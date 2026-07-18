/**
 * In-memory patient-state store.
 *
 * Prototype-grade on purpose: one patient, one process, no persistence. It is
 * held on `globalThis` so the state survives Next's dev-mode module reloads
 * mid-demo. Swapping this for a real store should not require touching the
 * evaluators or the UI.
 */

import { finalCtEvent, initialPatientState } from "@/data/maria-chen";
import { orchestrateEvent } from "./agents/orchestrator";
import { buildHandoff } from "./evaluator";
import type { ClinicianDecision, PatientState, SignalStatus } from "./types";

const KEY = Symbol.for("boardx.patient-state");
const globalRef = globalThis as unknown as Record<symbol, PatientState | undefined>;

function state(): PatientState {
  if (!globalRef[KEY]) globalRef[KEY] = initialPatientState();
  return globalRef[KEY]!;
}

export function getState(): PatientState {
  return state();
}

export function reset(): PatientState {
  globalRef[KEY] = initialPatientState();
  return state();
}

/**
 * Posts the demo's final CT read and runs the helper pipeline over it.
 * Idempotent — re-posting returns current state without re-running the agents.
 *
 * The event is appended only after orchestration completes, so the helpers
 * reason about the state as it was *before* the event landed. That is what lets
 * the Change Interpreter compare the new read against the prior understanding.
 */
export async function postFinalCt(): Promise<PatientState> {
  const s = state();
  if (s.events.some((e) => e.id === finalCtEvent.id)) return s;

  const { signals, drafts, trace } = await orchestrateEvent(finalCtEvent, s);

  s.events = [...s.events, finalCtEvent];
  s.signals = [...s.signals, ...signals];
  s.drafts = [...s.drafts, ...drafts];
  s.trace = trace;
  s.admissionIntent.pendingItems = s.admissionIntent.pendingItems.filter(
    (item) => !item.toLowerCase().includes("final ct"),
  );
  return s;
}

const STATUS_FOR: Record<Exclude<ClinicianDecision, "pending">, SignalStatus> = {
  approved: "acknowledged",
  dismissed: "dismissed",
  deferred: "deferred",
};

/**
 * Records a clinician decision on a draft. Approving is what marks the signal
 * acknowledged and refreshes the handoff — nothing else in the system may.
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

  s.handoff = buildHandoff(s);
  return s;
}
