/**
 * Hero scenario fixture — Maria Chen (planning/prototype-prd.md §6).
 *
 * All data is synthetic. Timestamps are fixed rather than relative so the demo
 * reads identically on every run.
 *
 * Timeline note: the PRD cites both "boarding 6h 12m" and an Abridge admission
 * story at 16:11 with the final CT at 18:42 — which don't reconcile if boarding
 * starts at 16:11. We anchor the admission decision at 12:30 (boarding starts)
 * and keep the admitting team's documented conversation at 16:11, which is both
 * internally consistent and realistic for a long boarding interval. The decision
 * is pinned at 12:33 so the displayed duration matches the PRD's "6h 12m".
 */

import type { ClinicalEvent, EvidenceRef, PatientState } from "@/lib/types";

const DAY = "2026-07-18";
const at = (hhmm: string) => `${DAY}T${hhmm}:00-07:00`;

export const DEMO_NOW = at("18:45");

export const evidence: Record<string, EvidenceRef> = {
  "abridge-admission": {
    id: "abridge-admission",
    label: "Abridge admission story",
    source: "abridge",
    timestamp: at("16:11"),
    excerpt:
      "67F with two days of pleuritic chest pain, productive cough, and hypoxia to 88% on room air. " +
      "Exam and CXR consistent with community-acquired pneumonia. Admit to medicine for supplemental " +
      "oxygen and IV antibiotics. CT angiogram obtained in the ED — preliminary read negative for PE, " +
      "final read still pending.",
  },
  "ct-preliminary": {
    id: "ct-preliminary",
    label: "Preliminary CT interpretation",
    source: "epic",
    timestamp: at("16:28"),
    excerpt:
      "PRELIMINARY: Patchy right lower lobe airspace opacity compatible with pneumonia. " +
      "No pulmonary embolism seen. Final interpretation to follow.",
  },
  "ct-final": {
    id: "ct-final",
    label: "Final CT report",
    source: "epic",
    timestamp: at("18:42"),
    excerpt:
      "FINAL: Segmental pulmonary embolism involving the right lower lobe segmental pulmonary artery. " +
      "Patchy right lower lobe airspace opacity, unchanged. Right heart strain not present.",
  },
  "orders-active": {
    id: "orders-active",
    label: "Active medication and order list",
    source: "epic",
    timestamp: at("18:45"),
    excerpt:
      "Ceftriaxone 1g IV q24h; azithromycin 500mg IV q24h; oxygen 2L nasal cannula titrate to SpO2 >92%; " +
      "continuous pulse oximetry.",
  },
};

/** Events already on the chart when the workspace loads. */
export const seededEvents: ClinicalEvent[] = [
  {
    id: "evt-admission",
    type: "consult",
    timestamp: at("16:11"),
    source: "abridge",
    title: "Admission conversation documented",
    content: "Admitting team H&P captured. Working diagnosis: community-acquired pneumonia.",
    status: "reviewed",
    evidence: evidence["abridge-admission"],
  },
  {
    id: "evt-ct-prelim",
    type: "imaging-preliminary",
    timestamp: at("16:28"),
    source: "epic",
    title: "CT angiogram chest — preliminary read",
    content: "RLL airspace opacity compatible with pneumonia. No pulmonary embolism seen.",
    status: "reviewed",
    evidence: evidence["ct-preliminary"],
    data: { study: "ct-angiogram-chest", peIdentified: false },
  },
  {
    id: "evt-orders",
    type: "order",
    timestamp: at("16:35"),
    source: "epic",
    title: "Admission orders placed",
    content: "Ceftriaxone, azithromycin, oxygen 2L NC, continuous pulse oximetry.",
    status: "reviewed",
    evidence: evidence["orders-active"],
    data: {
      activeMedications: ["ceftriaxone", "azithromycin", "oxygen"],
      anticoagulationPresent: false,
    },
  },
];

/**
 * The event the demo posts on cue. Kept out of the seed so the workspace can
 * show a stable "no material changes" state first.
 */
export const finalCtEvent: ClinicalEvent = {
  id: "evt-ct-final",
  type: "imaging-final",
  timestamp: at("18:42"),
  source: "epic",
  title: "CT angiogram chest — final read",
  content: "Segmental pulmonary embolism, right lower lobe. RLL airspace opacity unchanged.",
  status: "posted",
  evidence: evidence["ct-final"],
  data: {
    study: "ct-angiogram-chest",
    peIdentified: true,
    supersedesEventId: "evt-ct-prelim",
  },
};

export function initialPatientState(): PatientState {
  return {
    patient: {
      id: "pt-maria-chen",
      name: "Maria Chen",
      age: 67,
      edBed: "ED bed 18",
      admittedTo: "Medicine",
      // 6h 12m before the demo clock (18:45), matching the PRD's stated duration.
      admissionDecisionAt: at("12:33"),
    },
    admissionIntent: {
      patientId: "pt-maria-chen",
      reasonForAdmission: "Hypoxia; presumed community-acquired pneumonia",
      workingDiagnosis: "Community-acquired pneumonia",
      plan: [
        "Supplemental oxygen, titrate to SpO2 >92%",
        "IV ceftriaxone and azithromycin",
        "Admit to medicine",
      ],
      pendingItems: ["Final CT angiogram read"],
      evidence: ["abridge-admission", "ct-preliminary"],
    },
    events: [...seededEvents],
    signals: [],
    drafts: [],
    evidence,
    handoff:
      "Admitted for hypoxia and presumed community-acquired pneumonia. On oxygen and IV antibiotics. " +
      "Final CT angiogram read pending at time of handoff.",
    trace: [],
    now: DEMO_NOW,
  };
}
