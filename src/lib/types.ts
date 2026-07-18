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
  /** Compact form for the inline evidence chips, which are space-constrained. */
  shortLabel: string;
  source: "abridge" | "epic";
  /** ISO 8601. Rendered as wall-clock time in the UI. */
  timestamp: string;
  excerpt: string;
  /**
   * Invented for the prototype rather than drawn from the source record.
   * Rendered with a visible tag — see planning/demo-case-ctpa-pe.md
   * §"Provenance boundary".
   */
  simulated?: boolean;
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
  /** Invented for the prototype. Rendered with a visible tag. */
  simulated?: boolean;
};

export type SignalStatus = "needs-review" | "acknowledged" | "dismissed" | "deferred";

/**
 * A reviewable potential gap. Never an instruction — the language is
 * deliberately "needs clinician review", not "you must treat".
 */
export type SafetySignal = {
  id: string;
  category:
    | "result-change"
    | "critical-lab"
    | "vitals-trend"
    | "plan-discrepancy"
    | "open-loop"
    | "escalation";
  /**
   * What happens with this signal.
   *
   * `auto-notify` — BoardX delivers it without waiting for approval. Reserved
   *   for factual notifications between teams: a vital-sign trend, a result
   *   that returned. It reports numbers and what they are inconsistent with; it
   *   never names an order or a study. This is the one place the product acts
   *   without a human, and it is why the boundary is drawn at "data, not
   *   clinical recommendation" rather than at "never send".
   *
   * `acknowledge` — needs the reader to confirm they have it, because the next
   *   step is theirs to take.
   *
   * `draft` — a message a clinician edits and approves before it goes.
   */
  action: "auto-notify" | "acknowledge" | "draft";
  /** Marks the card as high-priority in the UI. */
  priority?: "high";
  headline: string;
  explanation: string;
  evidence: string[];
  status: SignalStatus;
  confidence: "high" | "medium" | "low";
  triggeringEventId: string;
  createdAt: string;
};

/**
 * A rule that evaluated and declined to fire.
 *
 * Surfacing these is a precision claim: it lets a clinician see that the system
 * considered a finding and had a reason not to raise it, rather than inferring
 * silence means it was never looked at.
 */
export type SuppressedSignal = {
  id: string;
  ruleId: string;
  /** What was evaluated, e.g. "potassium 5.07". */
  finding: string;
  /** Why it did not fire, in the clinician's terms. */
  reason: string;
  evidence: string[];
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
  /** Delivered by BoardX without approval. See SafetySignal.action. */
  autoSent?: boolean;
  /**
   * Set when the recipient confirms receipt. A notification that was sent is
   * not the same as one that was read, and for an auto-sent message the ED
   * attending has no other way to know which happened.
   */
  acknowledgedBy?: string;
  acknowledgedAt?: string;
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

/**
 * Most recent vitals for a boarded patient — the inputs NEWS2 needs, no more.
 * Everything here is synthetic demo data, like the hero case's simulated events.
 */
export type BoarderVitals = {
  /** ISO 8601 — when the set was recorded. */
  takenAt: string;
  respRate: number;
  spo2: number;
  supplementalO2: boolean;
  /** Display form of the oxygen support, e.g. "6 L mask". */
  o2Note?: string;
  tempC: number;
  systolicBp: number;
  heartRate: number;
  /** NEWS2 collapses CVPU into one non-alert bucket; so do we. */
  consciousness: "alert" | "altered";
};

/**
 * One nursing to-do for a boarded patient, derived from active orders and the
 * admission plan — never invented by the system. The nursing view of the
 * trackboard is a queue of these.
 */
export type NursingTask = {
  id: string;
  /** The task in task-board terms, e.g. "Draw repeat lactate". */
  label: string;
  kind:
    | "lab-draw"
    | "imaging"
    | "medication"
    | "monitoring"
    | "assessment"
    | "safety"
    | "prep";
  /** stat = do now; due = time-bound this hour; routine = scheduled. */
  urgency: "stat" | "due" | "routine";
  /** ISO 8601 — when it should happen. Overdue is computed against the clock. */
  dueAt: string;
  /** Why it matters now — the order or finding behind the task. */
  reason?: string;
};

/**
 * One row on the operations trackboard. A deliberately lighter object than
 * PatientState — the board answers "who is boarding, how long, how sick, what
 * is open", not the full evidence-linked story (that lives in the workspace).
 */
export type Boarder = {
  id: string;
  name: string;
  age: number;
  sex: "F" | "M";
  edBed: string;
  service: string;
  attending: string;
  workingDiagnosis: string;
  /** ISO 8601 — admission decision, start of the boarding interval. */
  admissionDecisionAt: string;
  /** Where the inpatient bed stands, in ops terms. */
  bedStatus: string;
  isolation?: boolean;
  vitals: BoarderVitals;
  /** Unresolved items a reviewer should see — consults, checks, placements. */
  openItems: string[];
  /** The nursing work the active orders imply, for the nursing view. */
  nursingTasks: NursingTask[];
  /**
   * Where this patient's chart opens from the board. Only set when a full
   * PatientState exists behind the row — the census's other patients are
   * board-level fixtures with no chart to open.
   */
  chartHref?: string;
  /**
   * One high-priority open review item, surfaced separately because acuity
   * scores don't capture it (e.g. a rising troponin in a patient whose vitals
   * score zero).
   */
  reviewFlag?: string;
};

/** Shared state, rebuilt after every event. */
export type PatientState = {
  patient: {
    id: string;
    name: string;
    age: number;
    edBed: string;
    admittedTo: string;
    /** Inpatient service accepting the admission. */
    service: string;
    /** Named attending on that service — who the drafted message reaches. */
    attending: string;
    /** ISO 8601 — start of the boarding interval (admission decision). */
    admissionDecisionAt: string;
  };
  admissionIntent: AdmissionIntent;
  /** The Abridge clinical note this boards alongside, rendered in the note panel. */
  note: {
    noteType: string;
    historyOfPresentIllness: string[];
    pastMedicalHistory: string[];
    medications: string[];
    allergies: string[];
    results: string;
  };
  events: ClinicalEvent[];
  signals: SafetySignal[];
  /** Rules that evaluated and declined. Shown beneath the fired signals. */
  suppressed: SuppressedSignal[];
  /** Unresolved items found by the Open-Loop Finder, shown in the brief. */
  openLoops: string[];
  drafts: ActionDraft[];
  evidence: Record<string, EvidenceRef>;
  /** Regenerated from current state whenever a loop closes. */
  handoff: string;
  /** Set when a clinician decision rewrote the handoff, so the UI can mark it. */
  handoffUpdatedAt?: string;
  /** Execution record of the most recent orchestration run. */
  trace: AgentTrace[];
  /** Fixed demo clock so the scenario reads identically on every run. */
  now: string;
};
