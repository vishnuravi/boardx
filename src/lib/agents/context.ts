/**
 * Renders patient state into the prompt text the helpers share.
 *
 * Every artifact is labelled with its evidence ID so the model can cite by ID
 * rather than paraphrase, which is what makes the provenance check possible.
 */

import { formatTime } from "@/lib/evaluator";
import type { ClinicalEvent, PatientState } from "@/lib/types";

/**
 * Evidence the patient's chart actually contains at this moment.
 *
 * `state.evidence` is the whole fixture dictionary, including artifacts for
 * events that have not happened yet. Rendering all of it into the prompt lets a
 * helper reason from the future: asked to interpret the 04:35 respiratory
 * trend, the Change Interpreter read the 05:38 CTA report sitting in the same
 * dictionary and wrote a signal announcing pulmonary emboli — a result that did
 * not exist, from a scan nobody had ordered.
 *
 * Only artifacts attached to events already on the chart, cited by the
 * admission story, or belonging to the event being evaluated are visible.
 */
export function visibleEvidenceIds(state: PatientState, incoming?: ClinicalEvent): Set<string> {
  const ids = new Set<string>(state.admissionIntent.evidence);
  for (const event of state.events) {
    if (event.evidence) ids.add(event.evidence.id);
  }
  if (incoming?.evidence) ids.add(incoming.evidence.id);
  return ids;
}

export function renderEvidence(state: PatientState, incoming?: ClinicalEvent): string {
  const visible = visibleEvidenceIds(state, incoming);
  return Object.values(state.evidence)
    .filter((e) => visible.has(e.id))
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

/**
 * The full shared context. Each helper appends its own question to this.
 *
 * `incoming` is the event being evaluated but not yet on the chart — its
 * evidence is visible, nothing later is.
 */
export function renderPatientContext(state: PatientState, incoming?: ClinicalEvent): string {
  const { patient } = state;
  return [
    `PATIENT`,
    `${patient.name}, ${patient.age}, ${patient.edBed}, admitted to ${patient.admittedTo}.`,
    `Accepting service: ${patient.service}. Attending: ${patient.attending}.`,
    `Boarding in the ED since ${formatTime(patient.admissionDecisionAt)}. Current time ${formatTime(state.now)}.`,
    ``,
    `ADMISSION STORY (captured by Abridge)`,
    renderAdmissionIntent(state),
    ``,
    `EVENT TIMELINE`,
    renderTimeline(state),
    ``,
    `EVIDENCE ARTIFACTS`,
    renderEvidence(state, incoming),
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
