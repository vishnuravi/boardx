/**
 * The four LLM-backed helpers.
 *
 * Each one has a narrow job and its own system prompt (planning/product-solution.md
 * §"Product architecture"). They are deliberately separate rather than one
 * do-everything call: the clinician sees a single coherent workspace, but the
 * reasoning behind it is decomposed so each step can be evaluated, swapped, or
 * given a different model independently.
 *
 * Every helper carries a deterministic fallback. Nothing here is allowed to be
 * the reason the demo stalls.
 */

import { runAgent, type AgentRun } from "./client";
import { renderNewEvent, renderPatientContext } from "./context";
import {
  changeSchema,
  draftSchema,
  openLoopSchema,
  storySchema,
  type ChangeOutput,
  type DraftOutput,
  type OpenLoopOutput,
  type StoryOutput,
} from "./schemas";
import type { ClinicalEvent, PatientState, SafetySignal } from "@/lib/types";

/**
 * Shared framing. The language rules here are not stylistic — they are the
 * product's safety boundary (planning/product-solution.md §"Safety by design").
 */
const HOUSE_RULES = `
You are one component of BoardX, a clinician-supervised safety layer for patients
who have been admitted to the hospital but are still boarding in the emergency
department. A clinician reviews everything you produce before it reaches anyone.

Rules you must follow:
- Only state things supported by the artifacts you are given. Never infer a result,
  a medication, or a timestamp that is not present.
- Cite evidence by its bracketed ID. Only use IDs that appear in the context.
- Say "not visible in active orders", never "was missed" or "the team failed to".
- Never diagnose, never instruct treatment, never assert that an error occurred.
- Write for a clinician at the bedside: plain, specific, no hedging filler.
`.trim();

/** 1. Patient Story Builder — organizes current state into the Boarding Brief. */
export function buildStory(
  state: PatientState,
  fallback: () => StoryOutput,
): Promise<AgentRun<StoryOutput>> {
  return runAgent({
    label: "Patient Story Builder",
    effort: "low",
    schema: storySchema,
    fallback,
    system: `${HOUSE_RULES}

Your job: maintain the patient's current story. Organize what is known into a brief
a clinician can absorb in ten seconds. Do not interpret significance — that is
another component's job. Report what is, not what it means.`,
    prompt: `${renderPatientContext(state)}

Produce the current boarding brief.`,
  });
}

/** 2. Change Interpreter — decides whether a new event diverges meaningfully. */
export function interpretChange(
  state: PatientState,
  event: ClinicalEvent,
  fallback: () => ChangeOutput,
): Promise<AgentRun<ChangeOutput>> {
  return runAgent({
    label: "Change Interpreter",
    effort: "high",
    schema: changeSchema,
    fallback,
    system: `${HOUSE_RULES}

Your job: compare one new event against the admission story, the prior data, and the
active plan. Decide whether it is a meaningful change for THIS patient.

Meaningful means all of: new since the last review, relevant to the admission problem
or active plan, different from the preliminary result or documented expectation, and
not already acknowledged. An abnormal value that the plan already accounts for is not
meaningful. Set isMeaningful to false when those conditions are not met — a false
alarm costs more than a missed nicety.

When it is meaningful, explain what a clinician would need to know to decide what to
do, in two or three sentences.`,
    prompt: `${renderPatientContext(state, event)}

${renderNewEvent(event)}

Does this event represent a meaningful change requiring clinician review?

Reason only from the artifacts above. Do not anticipate results that have not
returned or describe studies that have not been performed.`,
  });
}

/** 3. Open-Loop Finder — pending, unacknowledged, or inconsistent items. */
export function findOpenLoops(
  state: PatientState,
  fallback: () => OpenLoopOutput,
): Promise<AgentRun<OpenLoopOutput>> {
  return runAgent({
    label: "Open-Loop Finder",
    effort: "medium",
    schema: openLoopSchema,
    fallback,
    system: `${HOUSE_RULES}

Your job: find loops that are still open — pending tests without results, consultant
recommendations without a response, plan items with no corresponding order,
acknowledged findings with no follow-through.

Only report a loop if the chart shows it is genuinely unresolved. If the timeline
shows it was addressed, mark acknowledged true. Report nothing rather than padding.`,
    prompt: `${renderPatientContext(state)}

What loops are still open for this patient?`,
  });
}

/** 4. Action Drafting Helper — turns a reviewed concern into a message draft. */
export function draftAction(
  state: PatientState,
  signal: SafetySignal,
  fallback: () => DraftOutput,
): Promise<AgentRun<DraftOutput>> {
  return runAgent({
    label: "Action Drafting Helper",
    effort: "medium",
    schema: draftSchema,
    fallback,
    system: `${HOUSE_RULES}

Your job: draft a secure-chat message the reviewing clinician can send after editing.
Address the named attending on the accepting service. State the patient, the finding,
what is not visible in active orders, and ask them to review. Under 60 words.

Set the recipient field to the attending and service exactly as given in the
patient context.

This is a request for review between colleagues. It is not an alert, not an
instruction, and not an accusation. A clinician will read it before it sends.`,
    prompt: `${renderPatientContext(state)}

SIGNAL RAISED FOR REVIEW
${signal.headline}
${signal.explanation}

Draft the message.`,
  });
}
