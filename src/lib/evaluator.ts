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

import type {
  ActionDraft,
  ClinicalEvent,
  PatientState,
  SafetySignal,
  SuppressedSignal,
} from "./types";

/**
 * A rule's verdict. The three cases are distinct on purpose:
 *
 *   `null`         — the rule does not apply to this event at all.
 *   `{suppressed}` — the rule applies, evaluated, and decided not to raise it.
 *   `{signal}`     — the rule fires.
 *
 * The middle case is what lets the UI show "considered and declined" rather
 * than leaving the clinician to assume silence means nothing was checked.
 */
type RuleOutcome = { signal: SafetySignal } | { suppressed: SuppressedSignal } | null;

type Rule = {
  id: string;
  evaluate: (event: ClinicalEvent, state: PatientState) => RuleOutcome;
};

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

/**
 * Respiratory status worsening enough to warrant reassessment.
 *
 * Deliberately narrow: it fires when the oxygen *requirement* rises and
 * saturation falls anyway. A saturation dip at unchanged support is the trend
 * the current plan already anticipates, and raising it would be the alert noise
 * this product exists to avoid — the 02:40 check is exactly that case.
 *
 * The signal is acknowledge-only. BoardX reports the change and asks the team
 * to reassess; it does not name a cause or suggest imaging, because that would
 * be the diagnosis it must not make (demo-case-ctpa-pe.md §"Safety boundary").
 */
const respiratoryEscalation: Rule = {
  id: "respiratory-escalation",
  evaluate: (event, state) => {
    if (event.type !== "vitals") return null;

    const spo2 = num(event.data?.spo2);
    const o2 = num(event.data?.oxygenLpm);
    const rr = num(event.data?.respRate);
    if (spo2 === null || o2 === null) return null;

    const priorId = event.data?.supersedesEventId as string | undefined;
    const prior = state.events.find((e) => e.id === priorId);
    const priorSpo2 = num(prior?.data?.spo2);
    const priorO2 = num(prior?.data?.oxygenLpm);
    const priorRr = num(prior?.data?.respRate);
    if (priorSpo2 === null || priorO2 === null) return null;

    const desaturating = spo2 < priorSpo2;
    const needingMoreOxygen = o2 > priorO2;

    if (!desaturating) return null;

    if (!needingMoreOxygen) {
      return {
        suppressed: {
          id: `sup-resp-${event.id}`,
          ruleId: "respiratory-escalation",
          finding: `SpO₂ ${spo2}% on ${o2} L`,
          reason: `Oxygen requirement unchanged at ${o2} L; within the range the current plan anticipates`,
          evidence: ["vitals-baseline", "vitals-interim"],
          createdAt: event.timestamp,
        },
      };
    }

    // Trace back to the earliest vitals in this run so the trend reads as a
    // trend rather than a single step.
    const first = state.events.find((e) => e.type === "vitals");
    const fromSpo2 = num(first?.data?.spo2) ?? priorSpo2;
    const fromO2 = num(first?.data?.oxygenLpm) ?? priorO2;
    const fromRr = num(first?.data?.respRate) ?? priorRr;

    const explanation =
      `${state.patient.name.split(" ")[0]}'s oxygen support increased from ${fromO2} L to ` +
      `${o2} L while SpO₂ fell from ${fromSpo2}% to ${spo2}%` +
      (rr !== null && fromRr !== null ? ` and respiratory rate rose from ${fromRr} to ${rr}/min` : "") +
      `. She remains boarding in the ED. Please reassess.`;

    return {
      signal: {
        id: `sig-resp-${event.id}`,
        category: "escalation",
        action: "acknowledge",
        headline: "Respiratory status needs reassessment",
        explanation,
        evidence: ["vitals-baseline", "vitals-interim", "vitals-escalation", "abridge-admission"],
        status: "needs-review",
        confidence: "high",
        triggeringEventId: event.id,
        createdAt: event.timestamp,
      },
    };
  },
};

/**
 * A final imaging result identifying acute PE with no visible management.
 *
 * Trigger conditions are the four in demo-case-ctpa-pe.md §"Trigger logic":
 * the result is final and identifies acute PE, it is new relative to the
 * admission story, no therapeutic anticoagulation or documented PE plan is
 * visible, and every assertion has a timestamped source.
 *
 * Note the aspirin check: aspirin is antiplatelet, not anticoagulation, so its
 * presence must not satisfy condition three. The order data models the two
 * separately for exactly that reason.
 */
const finalImagingPeWithoutManagement: Rule = {
  id: "final-imaging-pe-without-management",
  evaluate: (event, state) => {
    if (event.type !== "imaging-final") return null;
    if (event.data?.peIdentified !== true) return null;

    // Is PE already part of the working story? If the admission plan named it,
    // this is not a change.
    const alreadyInStory = /pulmonary emboli|\bPE\b/i.test(
      state.admissionIntent.workingDiagnosis + state.admissionIntent.plan.join(" "),
    );
    if (alreadyInStory) return null;

    const orderEvent = [...state.events]
      .reverse()
      .find((e) => e.type === "order" && e.data?.therapeuticAnticoagulation !== undefined);
    const anticoagulated = orderEvent?.data?.therapeuticAnticoagulation === true;
    const documentedPlan = orderEvent?.data?.documentedPePlan === true;

    if (anticoagulated || documentedPlan) return null;

    const strain = event.data?.rightHeartStrain === true;
    const labs = state.events.find((e) => e.id === "evt-labs-admission");
    const platelets = num(labs?.data?.platelets);

    const explanation =
      `Final CTA at ${formatTime(event.timestamp)} identifies acute bilateral segmental ` +
      `pulmonary emboli${strain ? " with CT evidence of right-heart strain" : ""}, changing the ` +
      `working explanation for ${state.patient.name.split(" ")[0]}'s worsening hypoxemia. ` +
      `No therapeutic-anticoagulation order or documented PE-management plan is visible.`;

    const context =
      ` Review context: oxygen support increased from 4 L to 6 L while SpO₂ fell from 92% to 86%; ` +
      `aspirin is active` +
      (platelets !== null ? `; platelets are ${Math.round(platelets)}` : "") +
      `.`;

    return {
      signal: {
        id: `sig-pe-${event.id}`,
        category: "result-change",
        action: "draft",
        priority: "high",
        headline: "Final CTA identifies acute pulmonary emboli",
        explanation: explanation + context,
        evidence: [
          "cta-final",
          "abridge-admission",
          "vitals-escalation",
          "orders-active",
          "escalation-ack",
          "labs-admission",
        ],
        status: "needs-review",
        confidence: "high",
        triggeringEventId: event.id,
        createdAt: event.timestamp,
      },
    };
  },
};

const rules: Rule[] = [respiratoryEscalation, finalImagingPeWithoutManagement];

/**
 * Runs every rule against a newly posted event, skipping events that already
 * have a signal (a rule should not re-fire on re-render or replay).
 */
export function evaluateEvent(
  event: ClinicalEvent,
  state: PatientState,
): { signals: SafetySignal[]; suppressed: SuppressedSignal[] } {
  const existing = new Set(state.signals.map((s) => s.triggeringEventId));
  if (existing.has(event.id)) return { signals: [], suppressed: [] };

  const outcomes = rules
    .map((rule) => rule.evaluate(event, state))
    .filter((o): o is NonNullable<RuleOutcome> => o !== null);

  return {
    signals: outcomes.flatMap((o) => ("signal" in o ? [o.signal] : [])),
    suppressed: outcomes.flatMap((o) => ("suppressed" in o ? [o.suppressed] : [])),
  };
}

/**
 * Replays the gates over events already on the chart at load.
 *
 * The 02:40 check was evaluated and declined before the demo starts, so its
 * suppression record is produced by actually running the rule rather than being
 * written into the fixture by hand.
 */
export function bootstrapSuppressions(state: PatientState): SuppressedSignal[] {
  return state.events.flatMap((event) => evaluateEvent(event, state).suppressed);
}

/**
 * Turns a signal into a reviewable draft. Never sent — `decision` starts
 * `pending` and only a clinician can move it.
 */
export function draftForSignal(signal: SafetySignal, state: PatientState): ActionDraft {
  const { patient } = state;
  const cta = state.evidence["cta-final"];

  const message =
    `${patient.name} remains boarding in the ED after admission for COVID pneumonia and ` +
    `hypoxemia. Final CTA at ${formatTime(cta?.timestamp ?? signal.createdAt)} identifies acute ` +
    `bilateral segmental pulmonary emboli with CT evidence of right-heart strain. Her oxygen ` +
    `requirement has increased, and no therapeutic-anticoagulation order or documented ` +
    `PE-management plan is visible. Current medications and platelet data are available for ` +
    `review. Please review and determine management.`;

  return {
    id: `draft-${signal.id}`,
    signalId: signal.id,
    recipient: `${patient.attending} · ${patient.service}`,
    message,
    decision: "pending",
  };
}

/** Regenerates the transition-ready handoff from current state. */
export function buildHandoff(state: PatientState): string {
  const acknowledged = state.signals.filter((s) => s.status === "acknowledged");
  if (acknowledged.length === 0) return state.handoff;

  const parts = [
    "81-year-old admitted for COVID-19 pneumonia with hypoxemia, boarding in the ED.",
  ];

  if (acknowledged.some((s) => s.category === "escalation")) {
    parts.push(
      "Respiratory status worsened during boarding: oxygen support 4 L to 6 L, SpO₂ 92% to 86%, " +
        `respiratory rate 22 to 28. Escalation acknowledged by ${state.patient.attending} ` +
        `(${state.patient.service}); CTA chest ordered.`,
    );
  }

  if (acknowledged.some((s) => s.category === "result-change")) {
    const notified = state.drafts
      .filter((d) => d.decision === "approved")
      .map((d) => `${d.recipient} notified at ${formatTime(d.decidedAt ?? state.now)}`)
      .join("; ");
    parts.push(
      "Final CTA identified acute bilateral segmental pulmonary emboli with right-heart strain. " +
        "No therapeutic anticoagulation visible at time of handoff." +
        (notified ? ` ${notified}; management decision pending clinician review.` : ""),
    );
  }

  return parts.join(" ");
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
