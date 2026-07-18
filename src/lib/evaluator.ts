/**
 * Change and open-loop evaluators.
 *
 * Each rule answers the Contextual Safety Watch questions from
 * planning/product-solution.md §2: is this new since last review, is it relevant
 * to the admission problem, does it differ from the preliminary read or prior
 * trend, and has it already been acknowledged?
 *
 * The logic here is deliberately deterministic. In the product, an LLM drafts
 * the *explanation* and the *message*; the gates that decide whether a signal
 * fires at all (event type, timestamps, active-order checks, duplicate
 * suppression) stay as code so they are testable and auditable.
 */

import type { ActionDraft, ClinicalEvent, PatientState, SafetySignal } from "./types";

type Rule = {
  id: string;
  /** Returns a signal when the rule fires for this event, otherwise null. */
  evaluate: (event: ClinicalEvent, state: PatientState) => SafetySignal | null;
};

const num = (v: unknown): boolean => v === true;

/**
 * A final imaging read that changes the preliminary interpretation — the one
 * signal class in scope for the prototype demo.
 */
const finalImagingChangesPreliminary: Rule = {
  id: "final-imaging-changes-preliminary",
  evaluate: (event, state) => {
    if (event.type !== "imaging-final") return null;

    const supersedesId = event.data?.supersedesEventId as string | undefined;
    const prior = state.events.find((e) => e.id === supersedesId);
    if (!prior) return null;

    const nowPositive = num(event.data?.peIdentified);
    const wasPositive = num(prior.data?.peIdentified);
    if (!nowPositive || wasPositive) return null;

    // Is the relevant treatment already visible in active orders?
    const orderEvent = [...state.events]
      .reverse()
      .find((e) => e.type === "order" && e.data?.anticoagulationPresent !== undefined);
    const anticoagVisible = num(orderEvent?.data?.anticoagulationPresent);

    const explanation = [
      `Final CT result changes the working admission story. Segmental PE appears on final read and was not in the preliminary interpretation.`,
      anticoagVisible
        ? `Anticoagulation is visible in the active medication list.`
        : `No anticoagulation is visible in the active medication or order list.`,
      `The admission plan currently lists ${state.admissionIntent.workingDiagnosis.toLowerCase()}.`,
    ].join(" ");

    return {
      id: `sig-${event.id}`,
      category: "result-change",
      headline: "Final imaging read changes the preliminary interpretation",
      explanation,
      evidence: ["abridge-admission", "ct-preliminary", "ct-final", "orders-active"],
      status: "needs-review",
      confidence: "high",
      triggeringEventId: event.id,
      createdAt: event.timestamp,
    };
  },
};

const rules: Rule[] = [finalImagingChangesPreliminary];

/**
 * Runs every rule against a newly posted event, suppressing signals that
 * already exist for it (a signal should not re-fire on re-render or replay).
 */
export function evaluateEvent(event: ClinicalEvent, state: PatientState): SafetySignal[] {
  const existing = new Set(state.signals.map((s) => s.triggeringEventId));
  if (existing.has(event.id)) return [];

  return rules
    .map((rule) => rule.evaluate(event, state))
    .filter((s): s is SafetySignal => s !== null);
}

/**
 * Turns a signal into a reviewable draft. Never sent — `decision` starts
 * `pending` and only a clinician can move it.
 */
export function draftForSignal(signal: SafetySignal, state: PatientState): ActionDraft {
  const { patient, admissionIntent } = state;
  const finalRead = state.evidence["ct-final"];
  const time = formatTime(finalRead?.timestamp ?? signal.createdAt);

  // "Hypoxia; presumed pneumonia" is a problem-list phrasing — it reads badly
  // mid-sentence, so join the clauses for prose.
  const reason = admissionIntent.reasonForAdmission.toLowerCase().replace("; ", " and ");

  const message =
    `${patient.name} is boarding in the ED after admission for ` +
    `${reason}. Final CT at ${time} identifies segmental PE ` +
    `not described in the preliminary interpretation. Anticoagulation is not visible in active orders. ` +
    `Please review.`;

  return {
    id: `draft-${signal.id}`,
    signalId: signal.id,
    recipient: patient.admittedTo,
    message,
    decision: "pending",
  };
}

/** Regenerates the transition-ready handoff from current state. */
export function buildHandoff(state: PatientState): string {
  const acknowledged = state.signals.filter((s) => s.status === "acknowledged");
  if (acknowledged.length === 0) return state.handoff;

  const notified = state.drafts
    .filter((d) => d.decision === "approved")
    .map((d) => `${d.recipient} notified at ${formatTime(d.decidedAt ?? state.now)}`)
    .join("; ");

  return [
    "Admitted for hypoxia and presumed community-acquired pneumonia.",
    "Final CT subsequently identified segmental PE not described in the preliminary read.",
    notified ? `${notified}; plan under review.` : "Pending team review.",
  ].join(" ");
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles",
  });
}

/** Boarding duration as "6h 12m", measured to the demo clock. */
export function boardingDuration(state: PatientState): string {
  const start = new Date(state.patient.admissionDecisionAt).getTime();
  const now = new Date(state.now).getTime();
  const minutes = Math.max(0, Math.round((now - start) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
