/**
 * In-memory patient-state store.
 *
 * Prototype-grade on purpose: one patient, one process, no persistence. It is
 * held on `globalThis` so the state survives Next's dev-mode module reloads
 * mid-demo. Swapping this for a real store should not require touching the
 * evaluators or the UI.
 */

import {
  ctaOrderEvent,
  ctaResultEvent,
  escalationEvent,
  initialPatientState,
} from "@/data/ariane-runolfsson";
import { orchestrateEvent } from "./agents/orchestrator";
import { bootstrapSuppressions, buildHandoff } from "./evaluator";
import type { ClinicalEvent, ClinicianDecision, PatientState, SignalStatus } from "./types";

const KEY = Symbol.for("boardx.patient-state");
const INFLIGHT = Symbol.for("boardx.inflight");

type GlobalStore = {
  [KEY]?: PatientState;
  /** Keyed by event id — see postEvent. */
  [INFLIGHT]?: Record<string, Promise<PatientState> | undefined>;
};

const globalRef = globalThis as unknown as GlobalStore;

function fresh(): PatientState {
  const s = initialPatientState();
  // Replay the gates over what is already on the chart, so the 02:40 check that
  // was evaluated and declined shows as a real suppression rather than a
  // hand-written fixture entry.
  s.suppressed = bootstrapSuppressions(s);
  return s;
}

function state(): PatientState {
  if (!globalRef[KEY]) globalRef[KEY] = fresh();
  return globalRef[KEY]!;
}

export function getState(): PatientState {
  return state();
}

export function reset(): PatientState {
  globalRef[KEY] = fresh();
  globalRef[INFLIGHT] = {};
  return state();
}

/** The events the demo can post, in the order the case runs. */
const POSTABLE: Record<string, ClinicalEvent> = {
  escalation: escalationEvent,
  "cta-result": ctaResultEvent,
};

export function isPostable(key: string): key is keyof typeof POSTABLE {
  return key in POSTABLE;
}

/**
 * Posts one of the demo's events and runs the helper pipeline over it.
 *
 * Single-flight per event. Orchestration takes ~15 seconds, and a bare
 * `if (already posted) return` guard is a check-then-act race across that
 * await: two clicks both pass the check before either writes, and you end up
 * with the pipeline run twice and duplicate signals. Concurrent callers await
 * the same promise instead of starting their own run.
 *
 * The event is appended only after orchestration completes, so the helpers
 * reason about the state as it was *before* it landed — that is what lets the
 * Change Interpreter compare against the prior understanding.
 */
export async function postEvent(key: keyof typeof POSTABLE): Promise<PatientState> {
  const event = POSTABLE[key];
  const s = state();
  if (s.events.some((e) => e.id === event.id)) return s;

  const pending = globalRef[INFLIGHT] ?? (globalRef[INFLIGHT] = {});
  const existing = pending[event.id];
  if (existing) return existing;

  const run = (async () => {
    const { signals, suppressed, drafts, trace } = await orchestrateEvent(event, s);

    // Re-check under the same tick as the write: reset() may have run while
    // orchestration was in flight.
    if (s.events.some((e) => e.id === event.id)) return s;

    s.events = [...s.events, event];
    s.signals = dedupeById([...s.signals, ...signals]);
    s.suppressed = dedupeById([...s.suppressed, ...suppressed]);
    s.drafts = dedupeById([...s.drafts, ...drafts]);
    s.trace = trace;
    return s;
  })();

  pending[event.id] = run;
  try {
    return await run;
  } finally {
    pending[event.id] = undefined;
  }
}

const STATUS_FOR: Record<Exclude<ClinicianDecision, "pending">, SignalStatus> = {
  approved: "acknowledged",
  dismissed: "dismissed",
  deferred: "deferred",
};

/**
 * Acknowledges an escalation — the only action available on a signal that has
 * no drafted message.
 *
 * Acknowledging records the clinician-owned next step: inpatient medicine
 * picked up the escalation and ordered the CTA. BoardX did not order it and
 * does not claim to have; the order event is attributed to the clinician.
 */
export function acknowledgeSignal(signalId: string): PatientState {
  const s = state();
  const signal = s.signals.find((sig) => sig.id === signalId);
  if (!signal) throw new Error(`Unknown signal: ${signalId}`);
  if (signal.action !== "acknowledge") {
    throw new Error(`Signal ${signalId} carries a draft; decide on the draft instead`);
  }

  signal.status = "acknowledged";

  if (!s.events.some((e) => e.id === ctaOrderEvent.id)) {
    s.events = [...s.events, ctaOrderEvent];
  }

  refreshHandoff(s);
  return s;
}

/**
 * Records the clinician's decision on a drafted action. Approving is what marks
 * the signal acknowledged and refreshes the handoff — nothing else may.
 */
export function decide(
  draftId: string,
  decision: Exclude<ClinicianDecision, "pending">,
  editedMessage?: string,
): PatientState {
  const s = state();
  const draft = s.drafts.find((d) => d.id === draftId);
  if (!draft) throw new Error(`Unknown draft: ${draftId}`);

  draft.decision = decision;
  draft.decidedAt = s.now;
  if (editedMessage !== undefined) draft.message = editedMessage;

  const signal = s.signals.find((sig) => sig.id === draft.signalId);
  if (signal) signal.status = STATUS_FOR[decision];

  refreshHandoff(s);
  return s;
}

function refreshHandoff(s: PatientState) {
  const rebuilt = buildHandoff(s);
  if (rebuilt !== s.handoff) {
    s.handoff = rebuilt;
    s.handoffUpdatedAt = s.now;
  }
}

/** Last write wins. Rule IDs are deterministic, so duplicates are re-runs. */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((i) => [i.id, i])).values()];
}
