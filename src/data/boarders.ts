/**
 * The boarding census behind the operations trackboard — the hero patient plus
 * nine hypothetical boarders in the same format.
 *
 * PROVENANCE: every patient except Ariane Runolfsson is invented for the
 * prototype (Synthea-style names, plausible ED-boarding presentations). Ariane's
 * row is derived from her case file, with her current vitals taken from the
 * 04:35 escalation event. Nothing here is a real patient; the board renders a
 * standing "synthetic demo data" tag, matching the simulated-event convention
 * in ariane-runolfsson.ts.
 *
 * The mix is deliberate, not random:
 *   - acuity and boarding time disagree — the longest boarder (16h, behavioral
 *     health placement) scores NEWS2 0, while the sickest has waited 6h. Sorting
 *     by wait alone and sorting by acuity alone tell different stories, which is
 *     the point of showing both.
 *   - one patient (NSTEMI, rising troponin) scores near-zero on vitals but
 *     carries a high-priority review flag — the "acuity scores don't capture
 *     everything" case.
 *
 * All timestamps share the hero case's fixed demo clock (05:45), so boarding
 * intervals read identically on every run.
 */

import type { Boarder } from "@/lib/types";
import { DEMO_NOW } from "./ariane-runolfsson";

const DAY = "2021-01-03";
const NEXT = "2021-01-04";
const at = (hhmm: string) => `${DAY}T${hhmm}:00-08:00`;
const atNext = (hhmm: string) => `${NEXT}T${hhmm}:00-08:00`;

export const BOARD_NOW = DEMO_NOW;

export const boarders: Boarder[] = [
  {
    // The hero case. Boarding since 23:28 → 6h 17m; vitals are the 04:35
    // escalation set (NEWS2 11, high).
    id: "pt-ariane-runolfsson",
    name: "Ariane Runolfsson",
    age: 81,
    sex: "F",
    edBed: "ED 7",
    service: "Internal Medicine",
    attending: "Vishnu Ravi, MD",
    workingDiagnosis: "COVID-19 pneumonia; new bilateral PE on CTA",
    admissionDecisionAt: at("23:28"),
    bedStatus: "Awaiting isolation bed",
    isolation: true,
    vitals: {
      takenAt: atNext("04:35"),
      respRate: 28,
      spo2: 86,
      supplementalO2: true,
      o2Note: "6 L mask",
      tempC: 38.1,
      systolicBp: 104,
      heartRate: 96,
      consciousness: "alert",
    },
    openItems: [
      "PE management plan not yet documented",
      "Drafted message to medicine awaiting review",
      "Isolation bed assignment",
    ],
    reviewFlag: "Final CTA: bilateral PE with right-heart strain — no anticoagulation order visible",
  },
  {
    // NEWS2 10 (high): fever, borderline pressure, new confusion.
    id: "pt-mose-gerlach",
    name: "Mose Gerlach",
    age: 88,
    sex: "M",
    edBed: "ED 3",
    service: "Internal Medicine",
    attending: "Priya Natarajan, MD",
    workingDiagnosis: "Urosepsis with new confusion",
    admissionDecisionAt: atNext("02:40"),
    bedStatus: "No medicine bed available",
    vitals: {
      takenAt: atNext("05:10"),
      respRate: 21,
      spo2: 96,
      supplementalO2: false,
      tempC: 39.3,
      systolicBp: 96,
      heartRate: 108,
      consciousness: "altered",
    },
    openItems: [
      "Repeat lactate pending",
      "Second fluid bolus response check due",
      "Blood culture ×2 collected, pending",
    ],
  },
  {
    // NEWS2 7 (high): tachycardic and soft pressure after melena, Hgb 6.8.
    id: "pt-yadira-bogisich",
    name: "Yadira Bogisich",
    age: 68,
    sex: "F",
    edBed: "ED 12",
    service: "Internal Medicine",
    attending: "Priya Natarajan, MD",
    workingDiagnosis: "Upper GI bleed — melena, Hgb 6.8",
    admissionDecisionAt: atNext("03:05"),
    bedStatus: "Stepdown bed requested",
    vitals: {
      takenAt: atNext("05:20"),
      respRate: 22,
      spo2: 97,
      supplementalO2: false,
      tempC: 36.4,
      systolicBp: 88,
      heartRate: 124,
      consciousness: "alert",
    },
    openItems: [
      "Type & crossmatch — 2 units requested",
      "GI consult response pending",
      "Post-transfusion hemoglobin check",
    ],
    reviewFlag: "Systolic BP 88 after first unit — reassessment due",
  },
  {
    // NEWS2 6 (medium). Scored on SpO₂ scale 1; if she carries a documented
    // hypercapnic target range, scale 2 would read differently — the board
    // notes the simplification.
    id: "pt-otha-kuhlman",
    name: "Otha Kuhlman",
    age: 71,
    sex: "F",
    edBed: "ED 9",
    service: "Internal Medicine",
    attending: "Daniel Okafor, MD",
    workingDiagnosis: "COPD exacerbation on home oxygen",
    admissionDecisionAt: at("21:55"),
    bedStatus: "Bed assigned — awaiting transport",
    vitals: {
      takenAt: atNext("05:00"),
      respRate: 21,
      spo2: 94,
      supplementalO2: true,
      o2Note: "2 L NC",
      tempC: 36.8,
      systolicBp: 138,
      heartRate: 94,
      consciousness: "alert",
    },
    openItems: ["Repeat blood gas due", "Steroid taper plan unconfirmed"],
  },
  {
    // NEWS2 5 (medium): Kussmaul-range breathing and tachycardia on the drip.
    id: "pt-deja-larkin",
    name: "Deja Larkin",
    age: 24,
    sex: "F",
    edBed: "ED 14",
    service: "Internal Medicine",
    attending: "Daniel Okafor, MD",
    workingDiagnosis: "Diabetic ketoacidosis, on insulin infusion",
    admissionDecisionAt: atNext("01:45"),
    bedStatus: "Stepdown bed requested",
    vitals: {
      takenAt: atNext("05:15"),
      respRate: 23,
      spo2: 99,
      supplementalO2: false,
      tempC: 37.1,
      systolicBp: 104,
      heartRate: 112,
      consciousness: "alert",
    },
    openItems: [
      "Hourly glucose checks while boarding",
      "Potassium replacement recheck due",
      "Anion gap not yet closed",
    ],
  },
  {
    // NEWS2 2 (low). Boarding 5h on IV antibiotics.
    id: "pt-braulio-windler",
    name: "Braulio Windler",
    age: 52,
    sex: "M",
    edBed: "ED 5",
    service: "Internal Medicine",
    attending: "Priya Natarajan, MD",
    workingDiagnosis: "Left leg cellulitis, failed oral antibiotics",
    admissionDecisionAt: atNext("00:45"),
    bedStatus: "No medicine bed available",
    vitals: {
      takenAt: atNext("05:05"),
      respRate: 18,
      spo2: 97,
      supplementalO2: false,
      tempC: 38.3,
      systolicBp: 124,
      heartRate: 98,
      consciousness: "alert",
    },
    openItems: ["Blood cultures pending", "Margins re-mark due this shift"],
  },
  {
    // NEWS2 2 (low).
    id: "pt-santos-emmerich",
    name: "Santos Emmerich",
    age: 45,
    sex: "M",
    edBed: "ED 11",
    service: "Internal Medicine",
    attending: "Daniel Okafor, MD",
    workingDiagnosis: "Acute pancreatitis (gallstone)",
    admissionDecisionAt: atNext("02:15"),
    bedStatus: "Bed assigned — cleaning",
    vitals: {
      takenAt: atNext("05:25"),
      respRate: 19,
      spo2: 96,
      supplementalO2: false,
      tempC: 38.2,
      systolicBp: 116,
      heartRate: 104,
      consciousness: "alert",
    },
    openItems: ["RUQ ultrasound read pending", "Pain reassessment due"],
  },
  {
    // NEWS2 1 (low) but boarding 9h 30m — long-wait, low-acuity quadrant.
    id: "pt-lourdes-kirlin",
    name: "Lourdes Kirlin",
    age: 84,
    sex: "F",
    edBed: "Hall A",
    service: "Orthopedic Surgery",
    attending: "Grace Lindqvist, MD",
    workingDiagnosis: "Right hip fracture after mechanical fall",
    admissionDecisionAt: at("20:15"),
    bedStatus: "Surgical bed requested",
    vitals: {
      takenAt: atNext("04:50"),
      respRate: 18,
      spo2: 95,
      supplementalO2: false,
      tempC: 36.2,
      systolicBp: 148,
      heartRate: 88,
      consciousness: "alert",
    },
    openItems: [
      "Ortho consult note pending",
      "Pre-op medical clearance",
      "NPO status confirmation for possible morning OR",
    ],
  },
  {
    // NEWS2 1 (low) — but the rising troponin is the real story. The vitals
    // score misses it; the review flag carries it.
    id: "pt-rusty-bechtelar",
    name: "Rusty Bechtelar",
    age: 59,
    sex: "M",
    edBed: "ED 2",
    service: "Cardiology",
    attending: "Miriam Castaneda, MD",
    workingDiagnosis: "NSTEMI — chest pain, elevated troponin",
    admissionDecisionAt: atNext("00:15"),
    bedStatus: "Telemetry bed requested",
    vitals: {
      takenAt: atNext("05:30"),
      respRate: 16,
      spo2: 98,
      supplementalO2: false,
      tempC: 36.9,
      systolicBp: 142,
      heartRate: 92,
      consciousness: "alert",
    },
    openItems: [
      "Cardiology consult response pending",
      "Repeat ECG due",
      "Heparin infusion protocol check",
    ],
    reviewFlag: "Repeat troponin rising (0.4 → 1.1) — needs cardiology review",
  },
  {
    // NEWS2 0, boarding 16h 15m — the longest boarder on the census, and the
    // reason "sort by wait" and "sort by acuity" have to coexist on one board.
    id: "pt-jewel-ratke",
    name: "Jewel Ratke",
    age: 31,
    sex: "M",
    edBed: "Psych obs 2",
    service: "Psychiatry",
    attending: "Alan Weiss, MD",
    workingDiagnosis: "Suicidal ideation — awaiting inpatient psychiatric placement",
    admissionDecisionAt: at("13:30"),
    bedStatus: "No psychiatric bed in region — placement search ongoing",
    vitals: {
      takenAt: atNext("04:30"),
      respRate: 14,
      spo2: 99,
      supplementalO2: false,
      tempC: 36.7,
      systolicBp: 122,
      heartRate: 76,
      consciousness: "alert",
    },
    openItems: [
      "1:1 sitter continuation",
      "Placement search — 4 facilities contacted",
      "Safety reassessment due this shift",
    ],
  },
];
