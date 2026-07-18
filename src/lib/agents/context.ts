/**
 * Renders patient state into the prompt text the helpers share.
 *
 * Every artifact is labelled with its evidence ID so the model can cite by ID
 * rather than paraphrase, which is what makes the provenance check possible.
 */

import { formatTime } from "@/lib/evaluator";
import type { ClinicalEvent, PatientState } from "@/lib/types";

export function renderEvidence(state: PatientState): string {
  return Object.values(state.evidence)
    .map((e) => `[${e.id}] ${e.label} (${e.source}, ${formatTime(e.timestamp)})\n  "${e.excerpt}"`)
    .join("\n");
}

export function renderTimeline(state: PatientState): string {
  return [...state.events]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(
      (e) =>
        `${formatTime(e.timestamp)} — ${e.title} [${e.type}]\n  ${e.content}` +
        (e.evidence ? `\n  evidence: ${e.evidence.id}` : ""),
    )
    .join("\n");
}

export function renderAdmissionIntent(state: PatientState): string {
  const a = state.admissionIntent;
  return [
    `Reason for admission: ${a.reasonForAdmission}`,
    `Working diagnosis: ${a.workingDiagnosis}`,
    `Plan: ${a.plan.join("; ")}`,
    `Pending: ${a.pendingItems.join("; ") || "none"}`,
    `Evidence: ${a.evidence.join(", ")}`,
  ].join("\n");
}

/** The full shared context. Each helper appends its own question to this. */
export function renderPatientContext(state: PatientState): string {
  const { patient } = state;
  return [
    `PATIENT`,
    `${patient.name}, ${patient.age}, ${patient.edBed}, admitted to ${patient.admittedTo}.`,
    `Boarding in the ED since ${formatTime(patient.admissionDecisionAt)}. Current time ${formatTime(state.now)}.`,
    ``,
    `ADMISSION STORY (captured by Abridge)`,
    renderAdmissionIntent(state),
    ``,
    `EVENT TIMELINE`,
    renderTimeline(state),
    ``,
    `EVIDENCE ARTIFACTS`,
    renderEvidence(state),
  ].join("\n");
}

export function renderNewEvent(event: ClinicalEvent): string {
  return [
    `NEW EVENT`,
    `${formatTime(event.timestamp)} — ${event.title} [${event.type}]`,
    event.content,
    event.evidence ? `evidence: ${event.evidence.id}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
