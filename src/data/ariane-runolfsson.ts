/**
 * Hero scenario — Ariane Runolfsson, COVID-19 pneumonia with hypoxemia.
 *
 * Source: `synthetic-ambient-fhir-25`, record
 * `7bd9e5b0-5d4b-f10d-9579-f4813faf9cdc::7bd9e5b0-5d4b-f10d-cb93-7fcf216727d8`
 * ("Inpatient admission — COVID-19 isolation with pneumonia and hypoxemia"),
 * the synthetic Synthea/Abridge dataset provided for the hackathon. Every lab
 * value, medication, and quoted line below is taken from that record — the
 * transcript excerpts and note text are verbatim.
 *
 * Two deliberate adaptations, both about time rather than content:
 *
 *  1. The source encounter runs 2021-01-03 → 01-14 as a full inpatient stay.
 *     We model only the boarding interval: the admission decision at 23:18 and
 *     the hours before a bed is available.
 *  2. The source's "daily" repeat metabolic panel (dated 01-04) is placed at
 *     05:32 — a repeat BMP roughly six hours after admission is routine in a
 *     patient with this degree of renal impairment, and it lands while she is
 *     still in the ED. The values are the source's 01-04 values, unmodified.
 *
 * Age note: the FHIR birthDate (1940-05-16) implies 80 at this encounter; the
 * source clinical note says 81. We follow the note, since the note is the
 * artifact quoted in evidence.
 */

import type { ClinicalEvent, EvidenceRef, PatientState } from "@/lib/types";

const DAY = "2021-01-03";
const NEXT = "2021-01-04";
const at = (hhmm: string) => `${DAY}T${hhmm}:00-08:00`;
const atNext = (hhmm: string) => `${NEXT}T${hhmm}:00-08:00`;

export const DEMO_NOW = atNext("05:35");

export const evidence: Record<string, EvidenceRef> = {
  "abridge-admission": {
    id: "abridge-admission",
    label: "Abridge admission story",
    source: "abridge",
    timestamp: at("23:45"),
    excerpt:
      "DR: Medications — I have aspirin eighty-one milligrams daily, atenolol fifty, rosuvastatin " +
      "forty, and lisinopril twenty. Is that current, nothing added or stopped? / FAMILY: That is " +
      "exactly her pillbox. She never misses. […] DR: Her kidney numbers are the thing I most want " +
      "to watch: the creatinine is elevated at two point seven, and the filtration estimate is quite " +
      "low. […] we will be careful and deliberate with her blood pressure medicines while the kidneys " +
      "recover — we will adjust based on what each morning's labs show.",
  },
  "note-renal-plan": {
    id: "note-renal-plan",
    label: "Admission note — renal assessment and plan",
    source: "abridge",
    timestamp: at("23:52"),
    excerpt:
      "Renal function and metabolic abnormalities. Creatinine 2.66 mg/dL with GFR 11.1 mL/min, " +
      "potassium 5.07 mmol/L, and glucose 67.23 mg/dL in the setting of fever and two days of poor " +
      "intake. — Follow daily comprehensive metabolic panel; support hydration and oral intake. " +
      "— Review home antihypertensives daily against renal function and potassium; adjust per lab trend.",
  },
  "labs-admission": {
    id: "labs-admission",
    label: "Admission metabolic panel",
    source: "epic",
    timestamp: at("23:45"),
    excerpt:
      "Creatinine 2.66 mg/dL. GFR (MDRD) 11.1 mL/min/1.73m². Potassium 5.07 mmol/L. " +
      "Sodium 136.05 mmol/L. CO2 21.79 mmol/L. BUN 13.39 mg/dL. Glucose 67.23 mg/dL.",
  },
  "labs-repeat": {
    id: "labs-repeat",
    label: "Repeat metabolic panel",
    source: "epic",
    timestamp: atNext("05:32"),
    excerpt:
      "Creatinine 2.78 mg/dL (prior 2.66). GFR (MDRD) 6.42 mL/min/1.73m² (prior 11.1). " +
      "Potassium 5.07 mmol/L. Sodium 136.4 mmol/L.",
  },
  "orders-active": {
    id: "orders-active",
    label: "Active medication and order list",
    source: "epic",
    timestamp: atNext("05:34"),
    excerpt:
      "lisinopril 20 mg PO daily (continued from home). aspirin 81 mg PO daily. atenolol 50 mg PO " +
      "daily. rosuvastatin calcium 40 mg PO daily. Oxygen by mask, continuous, titrate to SpO2 >92%. " +
      "Prone positioning as tolerated. Comprehensive metabolic panel daily.",
  },
};

/** Already on the chart when the workspace loads. */
export const seededEvents: ClinicalEvent[] = [
  {
    id: "evt-admission",
    type: "consult",
    timestamp: at("23:45"),
    source: "abridge",
    title: "Admission conversation documented",
    content:
      "Home medications confirmed with daughter. Plan: continue home antihypertensives, adjusted " +
      "against each morning's labs while renal function recovers.",
    status: "reviewed",
    evidence: evidence["abridge-admission"],
  },
  {
    id: "evt-labs-admission",
    type: "lab",
    timestamp: at("23:45"),
    source: "epic",
    title: "Comprehensive metabolic panel — admission",
    content: "Creatinine 2.66, GFR 11.1, potassium 5.07. Acute renal impairment noted on admission.",
    status: "reviewed",
    evidence: evidence["labs-admission"],
    data: { panel: "cmp", gfr: 11.101, creatinine: 2.6628, potassium: 5.07 },
  },
  {
    id: "evt-orders",
    type: "order",
    timestamp: at("23:52"),
    source: "epic",
    title: "Admission orders placed",
    content:
      "Home medications continued including lisinopril 20 mg daily. Oxygen by mask. Prone " +
      "positioning. Daily comprehensive metabolic panel.",
    status: "reviewed",
    evidence: evidence["orders-active"],
    data: {
      activeMedications: ["lisinopril", "aspirin", "atenolol", "rosuvastatin", "oxygen"],
      /**
       * Medications whose safety depends on renal function. The gate checks
       * this list against the renal trend rather than pattern-matching drug
       * names in prose.
       */
      renallySensitiveActive: ["lisinopril"],
      heldMedications: [],
    },
  },
];

/**
 * The event the demo posts on cue: the repeat panel that changes the condition
 * the admission plan attached to continuing her antihypertensives.
 */
export const repeatPanelEvent: ClinicalEvent = {
  id: "evt-labs-repeat",
  type: "lab",
  timestamp: atNext("05:32"),
  source: "epic",
  title: "Comprehensive metabolic panel — repeat",
  content: "Creatinine 2.78 (prior 2.66). GFR 6.42 (prior 11.1). Potassium 5.07.",
  status: "posted",
  evidence: evidence["labs-repeat"],
  data: {
    panel: "cmp",
    gfr: 6.4176,
    creatinine: 2.7847,
    potassium: 5.07,
    supersedesEventId: "evt-labs-admission",
  },
};

export function initialPatientState(): PatientState {
  return {
    patient: {
      id: "pt-ariane-runolfsson",
      name: "Ariane Runolfsson",
      age: 81,
      edBed: "ED bed 7",
      admittedTo: "Medicine (COVID isolation)",
      admissionDecisionAt: at("23:18"),
    },
    admissionIntent: {
      patientId: "pt-ariane-runolfsson",
      reasonForAdmission: "COVID-19 pneumonia with hypoxemia",
      workingDiagnosis: "COVID-19 with pneumonia; hypoxemia and respiratory distress",
      plan: [
        "Isolation admission; oxygen by mask titrated to SpO2 >92%",
        "Prone positioning as tolerated, padded for known scoliosis",
        "Continue home aspirin, atenolol, rosuvastatin, lisinopril as labs and hemodynamics allow",
        "Daily comprehensive metabolic panel; review antihypertensives against renal function",
      ],
      pendingItems: [
        "Repeat metabolic panel to guide antihypertensive dosing",
        "Inpatient isolation bed assignment",
      ],
      evidence: ["abridge-admission", "note-renal-plan", "labs-admission"],
    },
    // Deep-copy the seeded events. Spreading only the array would share the
    // event objects (and their `data`) across every call, so a caller that
    // mutates one — a test holding a medication, say — would silently corrupt
    // every state built afterwards.
    events: seededEvents.map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined })),
    signals: [],
    drafts: [],
    evidence,
    handoff:
      "81-year-old admitted for COVID-19 pneumonia with hypoxemia. On oxygen by mask with prone " +
      "positioning. Acute renal impairment on admission (creatinine 2.66, GFR 11.1); home " +
      "antihypertensives continued pending repeat labs.",
    trace: [],
    now: DEMO_NOW,
  };
}
