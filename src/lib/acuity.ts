/**
 * NEWS2 (National Early Warning Score 2) over a boarder's latest vitals.
 *
 * The trackboard ranks by acuity, and the ranking has to be defensible in the
 * same way every other claim in this product is: computed from named inputs a
 * clinician can check, never a model's opinion. NEWS2 is the standard ward
 * early-warning score (Royal College of Physicians, 2017), so the board can
 * show the score, the band, and the exact per-parameter breakdown.
 *
 * Scoring uses SpO₂ scale 1 throughout. Scale 2 (hypercapnic respiratory
 * failure) needs a documented target-range decision this summary object does
 * not carry — a known simplification, noted on the board.
 *
 * Like everything else here, this is a review aid, not a triage order: the
 * band language is "review first", never "treat".
 */

import type { BoarderVitals } from "./types";

export type News2Component = {
  parameter: string;
  /** The observed value, display-formatted. */
  value: string;
  points: number;
};

export type News2Band = "low" | "low-medium" | "medium" | "high";

export type News2Result = {
  score: number;
  band: News2Band;
  /** Every parameter it looked at, including the zeros — the score shows its work. */
  components: News2Component[];
};

const respRatePoints = (rr: number) =>
  rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3;

const spo2Points = (s: number) => (s <= 91 ? 3 : s <= 93 ? 2 : s <= 95 ? 1 : 0);

const tempPoints = (t: number) =>
  t <= 35 ? 3 : t <= 36 ? 1 : t <= 38 ? 0 : t <= 39 ? 1 : 2;

const systolicPoints = (bp: number) =>
  bp <= 90 ? 3 : bp <= 100 ? 2 : bp <= 110 ? 1 : bp <= 219 ? 0 : 3;

const heartRatePoints = (hr: number) =>
  hr <= 40 ? 3 : hr <= 50 ? 1 : hr <= 90 ? 0 : hr <= 110 ? 1 : hr <= 130 ? 2 : 3;

export function news2(v: BoarderVitals): News2Result {
  const components: News2Component[] = [
    { parameter: "Respiratory rate", value: `${v.respRate}/min`, points: respRatePoints(v.respRate) },
    { parameter: "SpO₂", value: `${v.spo2}%`, points: spo2Points(v.spo2) },
    {
      parameter: "Supplemental O₂",
      value: v.supplementalO2 ? (v.o2Note ?? "yes") : "room air",
      points: v.supplementalO2 ? 2 : 0,
    },
    { parameter: "Temperature", value: `${v.tempC.toFixed(1)} °C`, points: tempPoints(v.tempC) },
    { parameter: "Systolic BP", value: `${v.systolicBp} mmHg`, points: systolicPoints(v.systolicBp) },
    { parameter: "Heart rate", value: `${v.heartRate}/min`, points: heartRatePoints(v.heartRate) },
    {
      parameter: "Consciousness",
      value: v.consciousness,
      points: v.consciousness === "alert" ? 0 : 3,
    },
  ];

  const score = components.reduce((sum, c) => sum + c.points, 0);

  // RCP thresholds: 0–4 low, 5–6 medium, ≥7 high — except any single
  // parameter scoring 3 lifts an otherwise-low total to low-medium
  // ("urgent ward-based review").
  const band: News2Band =
    score >= 7
      ? "high"
      : score >= 5
        ? "medium"
        : components.some((c) => c.points === 3)
          ? "low-medium"
          : "low";

  return { score, band, components };
}
