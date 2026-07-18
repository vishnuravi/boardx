/**
 * Core BoardX domain objects.
 *
 * These mirror the data model in planning/prototype-prd.md §8. Every clinician-
 * facing statement in the product has to trace back to an EvidenceRef, so most
 * objects carry explicit evidence links rather than free prose.
 */

/** A citable artifact — note, result, order list, transcript excerpt. */
export type EvidenceRef = {
  id: string;
  label: string;
  source: "abridge" | "epic";
  /** ISO 8601. Rendered as wall-clock time in the UI. */
  timestamp: string;
  excerpt: string;
};

/** The admission story as captured in the Abridge encounter. */
export type AdmissionIntent = {
  patientId: string;
  reasonForAdmission: string;
  workingDiagnosis: string;
  plan: string[];
  pendingItems: string[];
  evidence: string[];
};

export type ClinicalEventType =
  | "imaging-preliminary"
  | "imaging-final"
  | "lab"
  | "vitals"
  | "medication"
  | "order"
  | "consult";

/** A new event arriving from the (synthetic) Epic feed while the patient boards. */
export type ClinicalEvent = {
  id: string;
  type: ClinicalEventType;
  timestamp: string;
  source: "epic" | "abridge";
  title: string;
  content: string;
  /** `pending` events are visible in the feed but not yet posted to the chart. */
  status: "pending" | "posted" | "reviewed";
  evidence?: EvidenceRef;
  /** Structured payload the evaluators read; shape varies by event type. */
  data?: Record<string, unknown>;
};

export type SignalStatus = "needs-review" | "acknowledged" | "dismissed" | "deferred";

/**
 * A reviewable potential gap. Never an instruction — the language is
 * deliberately "needs clinician review", not "you must treat".
 */
export type SafetySignal = {
  id: string;
  category: "result-change" | "critical-lab" | "vitals-trend" | "plan-discrepancy" | "open-loop";
  headline: string;
  explanation: string;
  evidence: string[];
  status: SignalStatus;
  confidence: "high" | "medium" | "low";
  triggeringEventId: string;
  createdAt: string;
};

export type ClinicianDecision = "pending" | "approved" | "dismissed" | "deferred";

/** A drafted communication. Nothing leaves BoardX without an explicit approval. */
export type ActionDraft = {
  id: string;
  signalId: string;
  recipient: string;
  message: string;
  decision: ClinicianDecision;
  decidedAt?: string;
};

/** How one helper's output was produced. Surfaced so the clinician can see it. */
export type AgentTrace = {
  label: string;
  source: "claude" | "fallback";
  ms: number;
  reason?: string;
  /** Set when the Safety and Evidence Layer rejected the helper's output. */
  vetoed?: string[];
};

/** Shared state, rebuilt after every event. */
export type PatientState = {
  patient: {
    id: string;
    name: string;
    age: number;
    edBed: string;
    admittedTo: string;
    /** ISO 8601 — start of the boarding interval (admission decision). */
    admissionDecisionAt: string;
  };
  admissionIntent: AdmissionIntent;
  events: ClinicalEvent[];
  signals: SafetySignal[];
  drafts: ActionDraft[];
  evidence: Record<string, EvidenceRef>;
  /** Regenerated from current state whenever a loop closes. */
  handoff: string;
  /** Execution record of the most recent orchestration run. */
  trace: AgentTrace[];
  /** Fixed demo clock so the scenario reads identically on every run. */
  now: string;
};
