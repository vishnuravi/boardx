/**
 * Hero scenario — Ariane Runolfsson, COVID-19 pneumonia with hypoxemia, and a
 * final CTA that changes the admission.
 *
 * Specified in planning/demo-case-ctpa-pe.md. Two signals in sequence:
 *
 *   04:35  respiratory escalation      → acknowledge-only, no draft
 *   04:39  medicine acknowledges, orders CTA
 *   05:38  final CTA identifies PE      → high-priority review, drafted message
 *
 * PROVENANCE BOUNDARY (demo-case-ctpa-pe.md §"Provenance boundary")
 *
 * The patient, history, home medications, and COVID admission come from the
 * supplied synthetic record (`synthetic-ambient-fhir-25`, encounter
 * 7bd9e5b0-5d4b-f10d-9579-f4813faf9cdc::7bd9e5b0-5d4b-f10d-cb93-7fcf216727d8).
 *
 * The vital-sign trend, the escalation, the CTA, the post-CTA order check, and
 * the creatinine of 1.4 are invented for the prototype. They are not source
 * data and are not represented as a real patient event. Every one of them
 * carries `simulated: true` and renders with a "Simulated demo event" tag.
 *
 * Times are wall-clock. Boarding starts 23:28; the demo clock is 05:45, which
 * makes the displayed interval 6h 17m as the case doc specifies.
 */

import type { ClinicalEvent, EvidenceRef, PatientState } from "@/lib/types";

const DAY = "2021-01-03";
const NEXT = "2021-01-04";
const at = (hhmm: string) => `${DAY}T${hhmm}:00-08:00`;
const atNext = (hhmm: string) => `${NEXT}T${hhmm}:00-08:00`;

export const DEMO_NOW = atNext("05:45");

export const evidence: Record<string, EvidenceRef> = {
  "abridge-admission": {
    id: "abridge-admission",
    label: "Abridge admission story",
    shortLabel: "Admission story",
    source: "abridge",
    timestamp: at("23:45"),
    excerpt:
      "81-year-old admitted from the ED for COVID-19 pneumonia, hypoxemia, and isolation. " +
      "Five to six days of dry cough, persistent fever, poor appetite, and progressively " +
      "worsening dyspnea. Denies chest pain resembling her prior myocardial infarction. " +
      "Chest x-ray consistent with pneumonia. Plan: oxygen by mask titrated to saturation, " +
      "prone positioning as tolerated, continue home aspirin, atenolol, rosuvastatin, and " +
      "lisinopril as hemodynamics allow.",
  },
  "vitals-baseline": {
    id: "vitals-baseline",
    label: "Vital signs — 00:15",
    shortLabel: "Vitals",
    source: "epic",
    timestamp: atNext("00:15"),
    excerpt: "SpO₂ 92% on 4 L oxygen. Respiratory rate 22/min.",
    simulated: true,
  },
  "vitals-interim": {
    id: "vitals-interim",
    label: "Vital signs — 02:40",
    shortLabel: "Vitals",
    source: "epic",
    timestamp: atNext("02:40"),
    excerpt: "SpO₂ 89% on 4 L oxygen. Respiratory rate 24/min. Oxygen requirement unchanged.",
    simulated: true,
  },
  "vitals-escalation": {
    id: "vitals-escalation",
    label: "Vital signs — 04:35",
    shortLabel: "Vitals",
    source: "epic",
    timestamp: atNext("04:35"),
    excerpt:
      "SpO₂ 86% despite 6 L oxygen (was 92% on 4 L at 00:15). Respiratory rate 28/min " +
      "(was 22/min). Oxygen support increased from 4 L to 6 L.",
    simulated: true,
  },
  "escalation-ack": {
    id: "escalation-ack",
    label: "Escalation acknowledged; CTA ordered",
    shortLabel: "Ack + CTA order",
    source: "epic",
    timestamp: atNext("04:39"),
    excerpt:
      "Inpatient medicine acknowledged the respiratory escalation and ordered CT angiogram " +
      "of the chest. Order placed by the admitting clinician.",
    simulated: true,
  },
  "cta-final": {
    id: "cta-final",
    label: "Final CTA chest report",
    shortLabel: "Final CTA",
    source: "epic",
    timestamp: atNext("05:38"),
    excerpt:
      "FINAL: Acute bilateral segmental pulmonary emboli. CT evidence of right-heart strain " +
      "with increased RV:LV ratio. Patchy airspace opacity consistent with known COVID-19 " +
      "pneumonia, unchanged.",
    simulated: true,
  },
  "orders-active": {
    id: "orders-active",
    label: "Active medication and order list",
    shortLabel: "Active orders",
    source: "epic",
    timestamp: atNext("05:40"),
    excerpt:
      "aspirin 81 mg PO daily. atenolol 50 mg PO daily. rosuvastatin calcium 40 mg PO daily. " +
      "lisinopril 20 mg PO daily. Oxygen by mask, titrate to saturation. Prone positioning as " +
      "tolerated. No therapeutic anticoagulation order and no documented PE-management plan.",
    simulated: true,
  },
  "labs-admission": {
    id: "labs-admission",
    label: "Admission labs",
    shortLabel: "Admission labs",
    source: "epic",
    timestamp: at("23:45"),
    excerpt:
      "WBC 3.42 ×10³/µL. Platelets 136 ×10³/µL. Creatinine 1.4 mg/dL (simulated demo value). " +
      "SARS-CoV-2 PCR positive ×2.",
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
      "COVID-19 pneumonia with hypoxemia. Admit to isolation. Oxygen by mask, prone " +
      "positioning as tolerated. Home medications continued as hemodynamics allow.",
    status: "reviewed",
    evidence: evidence["abridge-admission"],
  },
  {
    id: "evt-labs-admission",
    type: "lab",
    timestamp: at("23:45"),
    source: "epic",
    title: "Admission labs resulted",
    content: "WBC 3.42, platelets 136, creatinine 1.4. SARS-CoV-2 PCR positive ×2.",
    status: "reviewed",
    evidence: evidence["labs-admission"],
    data: { platelets: 136.34, creatinine: 1.4 },
  },
  {
    id: "evt-vitals-baseline",
    type: "vitals",
    timestamp: atNext("00:15"),
    source: "epic",
    title: "Respiratory baseline",
    content: "SpO₂ 92% on 4 L oxygen. Respiratory rate 22/min.",
    status: "reviewed",
    evidence: evidence["vitals-baseline"],
    simulated: true,
    data: { spo2: 92, oxygenLpm: 4, respRate: 22 },
  },
  {
    /**
     * The case doc marks this "Tracks change; no new alert". The gate evaluates
     * it and declines — saturation slipped but the oxygen requirement did not
     * move, so it is a trend the current plan already anticipates.
     */
    id: "evt-vitals-interim",
    type: "vitals",
    timestamp: atNext("02:40"),
    source: "epic",
    title: "Respiratory check",
    content: "SpO₂ 89% on 4 L oxygen. Respiratory rate 24/min.",
    status: "reviewed",
    evidence: evidence["vitals-interim"],
    simulated: true,
    data: { spo2: 89, oxygenLpm: 4, respRate: 24, supersedesEventId: "evt-vitals-baseline" },
  },
  {
    id: "evt-orders",
    type: "order",
    timestamp: at("23:52"),
    source: "epic",
    title: "Admission orders placed",
    content:
      "Home medications continued. Oxygen by mask titrated to saturation. Prone positioning.",
    status: "reviewed",
    evidence: evidence["orders-active"],
    data: {
      activeMedications: ["aspirin", "atenolol", "rosuvastatin", "lisinopril", "oxygen"],
      /** Therapeutic anticoagulation. Aspirin is antiplatelet, not anticoagulation. */
      therapeuticAnticoagulation: false,
      documentedPePlan: false,
    },
  },
];

/** Step one of the demo: the 04:35 respiratory escalation. */
export const escalationEvent: ClinicalEvent = {
  id: "evt-vitals-escalation",
  type: "vitals",
  timestamp: atNext("04:35"),
  source: "epic",
  title: "Respiratory status worsening",
  content: "SpO₂ 86% despite 6 L oxygen. Respiratory rate 28/min.",
  status: "posted",
  evidence: evidence["vitals-escalation"],
  simulated: true,
  data: { spo2: 86, oxygenLpm: 6, respRate: 28, supersedesEventId: "evt-vitals-interim" },
};

/** Appended when the clinician acknowledges the escalation. */
export const ctaOrderEvent: ClinicalEvent = {
  id: "evt-cta-order",
  type: "order",
  timestamp: atNext("04:39"),
  source: "epic",
  title: "Escalation acknowledged; CTA chest ordered",
  content: "Inpatient medicine acknowledged the escalation and ordered CT angiogram of the chest.",
  status: "reviewed",
  evidence: evidence["escalation-ack"],
  simulated: true,
};

/** Step two of the demo: the final CTA that changes the admission. */
export const ctaResultEvent: ClinicalEvent = {
  id: "evt-cta-final",
  type: "imaging-final",
  timestamp: atNext("05:38"),
  source: "epic",
  title: "CT angiogram chest — final read",
  content:
    "Acute bilateral segmental pulmonary emboli with CT evidence of right-heart strain.",
  status: "posted",
  evidence: evidence["cta-final"],
  simulated: true,
  data: { study: "cta-chest", peIdentified: true, rightHeartStrain: true },
};

export function initialPatientState(): PatientState {
  return {
    patient: {
      id: "pt-ariane-runolfsson",
      name: "Ariane Runolfsson",
      age: 81,
      edBed: "ED bed 7",
      admittedTo: "Medicine (COVID isolation)",
      service: "Internal Medicine",
      attending: "Vishnu Ravi, MD",
      admissionDecisionAt: at("23:28"),
    },
    admissionIntent: {
      patientId: "pt-ariane-runolfsson",
      reasonForAdmission: "COVID-19 pneumonia with hypoxemia",
      workingDiagnosis: "COVID-19 with pneumonia; hypoxemia and respiratory distress",
      plan: [
        "Isolation admission; oxygen by mask titrated to saturation",
        "Prone positioning as tolerated, padded for known scoliosis",
        "Continue home aspirin, atenolol, rosuvastatin, lisinopril as hemodynamics allow",
        "Continue respiratory monitoring and daily family updates",
      ],
      pendingItems: ["Inpatient isolation bed assignment"],
      evidence: ["abridge-admission", "labs-admission", "vitals-baseline"],
    },
    note: {
      noteType: "Emergency Medicine Visit",
      historyOfPresentIllness: [
        "Ariane Runolfsson is an 81-year-old woman with hypertension, hyperlipidemia, prior " +
          "STEMI, obesity, and prediabetes presenting with five to six days of initially dry " +
          "cough, persistent fever, poor appetite, and progressively worsening shortness of breath.",
        "She tested positive for SARS-CoV-2 as an outpatient; repeat testing on arrival is " +
          "positive. She reports dyspnea with minimal exertion and chest tightness with " +
          "breathing, but denies chest pain or pressure similar to her prior myocardial " +
          "infarction. Her daughter reports mild morning fogginess but no falls, syncope, " +
          "hemoptysis, or leg swelling.",
        "She has had poor oral intake for two days. Chest x-ray is consistent with pneumonia. " +
          "She is admitted to medicine for COVID pneumonia, hypoxemia, and isolation.",
      ],
      pastMedicalHistory: [
        "Essential hypertension",
        "Prior ST-elevation myocardial infarction",
        "Hyperlipidemia",
        "Metabolic syndrome",
        "Prediabetes",
        "Obesity",
        "Osteoporosis",
        "Adolescent idiopathic scoliosis",
      ],
      medications: [
        "Aspirin 81 mg daily",
        "Atenolol 50 mg daily",
        "Rosuvastatin 40 mg daily",
        "Lisinopril 20 mg daily",
      ],
      allergies: ["Tree nuts"],
      results:
        "SARS-CoV-2 PCR positive ×2. Chest x-ray consistent with pneumonia. WBC 3.42 ×10³/µL. " +
        "Platelets 136 ×10³/µL. Creatinine 1.4 mg/dL. Admission vitals: T 38.45 °C, HR 57/min, " +
        "RR 19/min, BP 105/53 mmHg, SpO₂ 87% on presentation.",
    },
    events: seededEvents.map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined })),
    signals: [],
    suppressed: [],
    openLoops: [],
    drafts: [],
    evidence,
    handoff:
      "81-year-old admitted for COVID-19 pneumonia with hypoxemia. On oxygen by mask with " +
      "prone positioning as tolerated. Home medications continued. Awaiting isolation bed.",
    trace: [],
    now: DEMO_NOW,
  };
}
