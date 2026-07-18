/**
 * Orchestrator — runs the helpers behind one coherent clinician experience.
 *
 *   ClinicalEvent
 *        ↓
 *   deterministic gates        (evaluator.ts — decides IF a signal fires)
 *        ↓
 *   Change Interpreter  ┐
 *   Open-Loop Finder    ┘      (parallel — independent questions)
 *        ↓
 *   Safety & Evidence Layer    (code only — provenance + language)
 *        ↓
 *   Action Drafting Helper
 *        ↓
 *   SafetySignal + ActionDraft (decision: pending)
 *
 * Division of authority: the deterministic gates decide whether a signal fires.
 * The model decides how it reads. That split is deliberate — event type,
 * timestamps, active-order checks, and duplicate suppression stay auditable in
 * code, and a model outage degrades the prose rather than silencing a signal.
 * When the Change Interpreter disagrees with a gate, the disagreement is
 * recorded in the trace rather than suppressing the card.
 */

import { draftForSignal, evaluateEvent } from "@/lib/evaluator";
import type {
  ActionDraft,
  AgentTrace,
  ClinicalEvent,
  PatientState,
  SafetySignal,
  SuppressedSignal,
} from "@/lib/types";
import { visibleEvidenceIds } from "./context";
import { buildStory, draftAction, findOpenLoops, interpretChange } from "./helpers";
import type { StoryOutput } from "./schemas";
import { vetClaim } from "./safety";

export type OrchestrationResult = {
  signals: SafetySignal[];
  suppressed: SuppressedSignal[];
  /** Unresolved items the Open-Loop Finder surfaced. Feeds the brief. */
  openLoops: string[];
  drafts: ActionDraft[];
  trace: AgentTrace[];
};

/**
 * Processes one newly posted event end to end. Returns the signals and drafts
 * to append, plus the trace of how each was produced.
 */
export async function orchestrateEvent(
  event: ClinicalEvent,
  state: PatientState,
): Promise<OrchestrationResult> {
  const trace: AgentTrace[] = [];

  // Gate first: deterministic rules decide whether anything fires at all.
  const { signals: gated, suppressed } = evaluateEvent(event, state);
  if (gated.length === 0) {
    return { signals: [], suppressed, openLoops: [], drafts: [], trace };
  }

  // The two interpretation questions are independent — run them concurrently.
  const [change, loops] = await Promise.all([
    interpretChange(state, event, () => ({
      isMeaningful: true,
      headline: gated[0].headline,
      explanation: gated[0].explanation,
      confidence: gated[0].confidence,
      evidence: gated[0].evidence,
    })),
    findOpenLoops(state, () => ({
      loops: state.admissionIntent.pendingItems.map((item) => ({
        description: item,
        acknowledged: false,
        evidence: state.admissionIntent.evidence,
      })),
    })),
  ]);

  trace.push({ label: "Change Interpreter", source: change.source, ms: change.ms, reason: change.reason });
  trace.push({ label: "Open-Loop Finder", source: loops.source, ms: loops.ms, reason: loops.reason });

  // Its output feeds the brief's open items. Previously this call ran on the
  // critical path and only ever produced a trace line — several seconds per
  // event for nothing a clinician could see.
  const openLoops = loops.value.loops
    .filter((l) => !l.acknowledged)
    .map((l) => l.description);

  // Safety gate on the interpreter's prose before it can reach a clinician.
  // Scoped to evidence on the chart at this moment, so a citation to a result
  // that has not returned is rejected rather than silently accepted.
  const visible = visibleEvidenceIds(state, event);
  const verdict = vetClaim(change.value.explanation, change.value.evidence, state, visible);
  const useModelProse = change.source === "claude" && verdict.ok && change.value.isMeaningful;

  if (change.source === "claude" && !verdict.ok) {
    trace.push({
      label: "Safety & Evidence Layer",
      source: "fallback",
      ms: 0,
      reason: "interpreter output rejected; using deterministic text",
      vetoed: verdict.violations,
    });
  } else {
    trace.push({ label: "Safety & Evidence Layer", source: "fallback", ms: 0 });
  }

  if (change.source === "claude" && !change.value.isMeaningful) {
    trace.push({
      label: "Change Interpreter",
      source: "claude",
      ms: 0,
      reason: "judged not meaningful; deterministic gate fired anyway — showing for review",
    });
  }

  // Nothing reviews an auto-sent notification, so the claims the gate put in it
  // have to survive the rewrite. If the model drops one, take the gate's text.
  const required = gated[0].action === "auto-notify" ? /not been excluded/i : null;
  const keptRequired = !required || required.test(change.value.explanation);

  if (change.source === "claude" && verdict.ok && !keptRequired) {
    trace.push({
      label: "Safety & Evidence Layer",
      source: "fallback",
      ms: 0,
      reason: "rewrite dropped a required claim; using deterministic text",
    });
  }

  const signal: SafetySignal = useModelProse && keptRequired
    ? {
        ...gated[0],
        headline: change.value.headline,
        explanation: change.value.explanation,
        confidence: change.value.confidence,
        evidence: verdict.evidence,
      }
    : gated[0];

  // An acknowledge-only signal has nothing to send — the next step is the
  // reader's to take, not a message to compose.
  if (signal.action === "acknowledge") {
    return { signals: [signal], suppressed, openLoops, drafts: [], trace };
  }

  // Draft last — it depends on the finalized, vetted signal.
  const draft = await draftAction(state, signal, event, () => {
    const d = draftForSignal(signal, state);
    return { recipient: d.recipient, message: d.message };
  });
  trace.push({ label: "Action Drafting Helper", source: draft.source, ms: draft.ms, reason: draft.reason });

  // Same gate on the drafted message. Provenance is inherited from the signal,
  // so only the language check can fail here.
  const draftVerdict = vetClaim(draft.value.message, signal.evidence, state, visible);
  const message = draftVerdict.ok
    ? draft.value.message
    : draftForSignal(signal, state).message;

  if (!draftVerdict.ok) {
    trace.push({
      label: "Safety & Evidence Layer",
      source: "fallback",
      ms: 0,
      reason: "draft rejected; using deterministic message",
      vetoed: draftVerdict.violations,
    });
  }

  // An auto-notify signal is delivered on the spot; anything else is born
  // pending and waits for a clinician. The distinction is structural, not a
  // matter of what the UI chooses to render.
  const autoSent = signal.action === "auto-notify";

  return {
    signals: [signal],
    suppressed,
    openLoops,
    drafts: [
      {
        id: `draft-${signal.id}`,
        signalId: signal.id,
        recipient: draft.value.recipient || state.patient.admittedTo,
        message,
        decision: autoSent ? "approved" : "pending",
        decidedAt: autoSent ? signal.createdAt : undefined,
        autoSent,
      },
    ],
    trace,
  };
}

/** Refreshes the Boarding Brief. Independent of the event pipeline. */
export async function orchestrateStory(
  state: PatientState,
): Promise<{ story: StoryOutput; trace: AgentTrace }> {
  const run = await buildStory(state, () => ({
    whyAdmitted: state.admissionIntent.reasonForAdmission,
    plan: state.admissionIntent.plan,
    sinceLastReview:
      state.signals.length > 0 ? "See review card above." : "No material changes",
    openItems: state.admissionIntent.pendingItems,
    evidence: state.admissionIntent.evidence,
  }));

  return {
    story: run.value,
    trace: {
      label: "Patient Story Builder",
      source: run.source,
      ms: run.ms,
      reason: run.reason,
    },
  };
}
