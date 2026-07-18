/**
 * Change and open-loop evaluators.
 *
 * Each rule answers the Contextual Safety Watch questions from
 * planning/product-solution.md §2: is this new since last review, is it relevant
 * to the admission problem, does it differ from the prior trend or documented
 * expectation, and has it already been acknowledged?
 *
 * The logic here is deliberately deterministic. In the product, an LLM drafts
 * the *explanation* and the *message*; the gates that decide whether a signal
 * fires at all (event type, thresholds, active-order checks, duplicate
 * suppression) stay as code so they are testable and auditable.
 */

import type { ActionDraft, ClinicalEvent, PatientState, SafetySignal } from "./types";

type Rule = {
  id: string;
  /** Returns a signal when the rule fires for this event, otherwise null. */
  evaluate: (event: ClinicalEvent, state: PatientState) => SafetySignal | null;
};

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

/**
 * A conditional medication continuation whose condition has changed.
 *
 * This is the signal class the boarding interval produces: the admission plan
 * continues a home medication *contingent on* something ("as labs allow",
 * "review daily against renal function"), the contingency then moves, and the
 * daily review that would catch it belongs to a team the patient hasn't
 * physically reached yet.
 *
 * The gate is narrow on purpose. It fires only when renal function has
 * genuinely worsened against the value the plan was written on, a
 * renally-sensitive medication is still active, and nobody has acknowledged it.
 */
const conditionalMedVsRenalFunction: Rule = {
  id: "conditional-med-vs-renal-function",
  evaluate: (event, state) => {
    if (event.type !== "lab") return null;

    const gfr = num(event.data?.gfr);
    if (gfr === null) return null;

    // Compare against the panel this one supersedes, not merely the last event.
    const priorId = event.data?.supersedesEventId as string | undefined;
    const prior = state.events.find((e) => e.id === priorId);
    const priorGfr = num(prior?.data?.gfr);
    if (priorGfr === null) return null;

    // Worsening only. An improving GFR is good news, not a signal.
    if (gfr >= priorGfr) return null;

    // Is a renally-sensitive medication still active and not held?
    const orderEvent = [...state.events]
      .reverse()
      .find((e) => e.type === "order" && e.data?.renallySensitiveActive !== undefined);
    const held = list(orderEvent?.data?.heldMedications);
    const atRisk = list(orderEvent?.data?.renallySensitiveActive).filter(
      (med) => !held.includes(med),
    );
    if (atRisk.length === 0) return null;

    const potassium = num(event.data?.potassium);
    const drugs = atRisk.join(", ");

    const explanation = [
      `The admission plan continues home ${drugs} contingent on renal function, and commits to`,
      `reviewing antihypertensives against each morning's labs. The repeat panel shows GFR`,
      `${gfr.toFixed(1)} mL/min, down from ${priorGfr.toFixed(1)}`,
      potassium !== null ? `with potassium ${potassium.toFixed(2)} mmol/L.` : `.`,
      `${drugs.charAt(0).toUpperCase() + drugs.slice(1)} is not visible as held or adjusted in the`,
      `active order list. The patient is still boarding, so the daily review the plan describes has`,
      `not yet occurred.`,
    ].join(" ");

    return {
      id: `sig-${event.id}`,
      category: "plan-discrepancy",
      headline: "Renal function has fallen below the condition the plan set for continuing lisinopril",
      explanation,
      evidence: ["abridge-admission", "note-renal-plan", "labs-admission", "labs-repeat", "orders-active"],
      status: "needs-review",
      confidence: "high",
      triggeringEventId: event.id,
      createdAt: event.timestamp,
    };
  },
};

const rules: Rule[] = [conditionalMedVsRenalFunction];

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
  const { patient } = state;
  const repeat = state.evidence["labs-repeat"];
  const time = formatTime(repeat?.timestamp ?? signal.createdAt);

  const message =
    `${patient.name} is boarding in the ED after admission for COVID-19 pneumonia with hypoxemia. ` +
    `Repeat metabolic panel at ${time} shows GFR 6.4 mL/min, down from 11.1 on admission, with ` +
    `potassium 5.07. Home lisinopril 20 mg was continued pending lab review and is not visible as ` +
    `held in active orders. Please review before transfer.`;

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
    "81-year-old admitted for COVID-19 pneumonia with hypoxemia. On oxygen by mask with prone positioning.",
    "Renal function declined during boarding: GFR 11.1 to 6.4, creatinine 2.66 to 2.78, potassium 5.07.",
    "Home lisinopril continued from admission and flagged for review against the new panel.",
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

/** Boarding duration as "6h 17m", measured to the demo clock. */
export function boardingDuration(state: PatientState): string {
  const start = new Date(state.patient.admissionDecisionAt).getTime();
  const now = new Date(state.now).getTime();
  const minutes = Math.max(0, Math.round((now - start) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
