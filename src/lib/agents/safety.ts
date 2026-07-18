/**
 * Safety and Evidence Layer — code only, no model in the loop.
 *
 * This is the component that does not get to be probabilistic. It checks the
 * other four helpers' output before any of it reaches a clinician:
 *
 *   1. Provenance — every cited evidence ID must actually exist.
 *   2. Grounding  — a signal with no surviving evidence is not shown.
 *   3. Language   — no accusatory or instructional phrasing.
 *
 * A model that hallucinates a citation fails check 1 and the claim is dropped
 * rather than rendered with a broken link.
 */

import type { PatientState } from "@/lib/types";

/** Phrases that assert error or direct treatment. See planning/product-solution.md §"Safety by design". */
const BANNED = [
  /\bmissed\b/i,
  /\bfailed to\b/i,
  /\berror\b/i,
  /\bnegligen/i,
  /\byou must\b/i,
  /\bshould have\b/i,
  /\badminister\b/i,
  // Imperative dosing verbs — the product raises findings, it does not order.
  /\b(start|stop|hold|discontinue|initiate|give)\s+(the\s+)?\w+\s+(now|immediately|stat)\b/i,
];

export type SafetyVerdict = {
  ok: boolean;
  /** Evidence IDs that resolved. Unknown IDs are dropped, not rendered. */
  evidence: string[];
  violations: string[];
};

/** Drops unresolvable evidence IDs and reports which were invented. */
export function checkProvenance(ids: string[], state: PatientState) {
  const valid = ids.filter((id) => Boolean(state.evidence[id]));
  const invented = ids.filter((id) => !state.evidence[id]);
  return { valid, invented };
}

export function checkLanguage(text: string): string[] {
  return BANNED.filter((pattern) => pattern.test(text)).map(
    (pattern) => `disallowed phrasing: ${pattern.source}`,
  );
}

/**
 * Full gate for a clinician-facing claim. `ok: false` means do not show this —
 * the caller falls back to deterministic text rather than rendering it anyway.
 */
export function vetClaim(
  text: string,
  evidenceIds: string[],
  state: PatientState,
): SafetyVerdict {
  const { valid, invented } = checkProvenance(evidenceIds, state);
  const violations = checkLanguage(text);

  for (const id of invented) {
    violations.push(`unknown evidence id: ${id}`);
  }
  if (valid.length === 0) {
    violations.push("no verifiable evidence");
  }

  return { ok: violations.length === 0, evidence: valid, violations };
}
