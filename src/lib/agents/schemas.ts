/**
 * Structured-output contracts for the LLM helpers.
 *
 * Every schema that carries a clinical claim also carries the evidence IDs
 * backing it. That is what makes the Safety and Evidence Layer able to check
 * provenance mechanically instead of trusting the prose.
 */

import { z } from "zod";

export const storySchema = z.object({
  whyAdmitted: z.string().describe("One line: why this patient is being admitted."),
  plan: z.array(z.string()).describe("Active plan items, one per entry."),
  sinceLastReview: z
    .string()
    .describe("What changed since the last meaningful review, or that nothing has."),
  openItems: z.array(z.string()).describe("Pending or unresolved items."),
  evidence: z.array(z.string()).describe("Evidence IDs supporting the above."),
});
export type StoryOutput = z.infer<typeof storySchema>;

export const changeSchema = z.object({
  isMeaningful: z
    .boolean()
    .describe("Whether this change warrants clinician review for THIS patient."),
  headline: z.string().describe("Short title, under 12 words."),
  explanation: z
    .string()
    .describe(
      "2-3 sentences: what changed, how it differs from the prior understanding, " +
        "and what is or is not visible in active orders. Source-backed statements only.",
    ),
  confidence: z.enum(["high", "medium", "low"]),
  evidence: z.array(z.string()).describe("Evidence IDs cited in the explanation."),
});
export type ChangeOutput = z.infer<typeof changeSchema>;

export const openLoopSchema = z.object({
  loops: z
    .array(
      z.object({
        description: z.string().describe("The unresolved item, stated plainly."),
        acknowledged: z.boolean().describe("Whether the chart shows it was addressed."),
        evidence: z.array(z.string()),
      }),
    )
    .describe("Pending, unacknowledged, or inconsistent items. Empty if none."),
});
export type OpenLoopOutput = z.infer<typeof openLoopSchema>;

export const draftSchema = z.object({
  recipient: z.string().describe("The team or role who should review this."),
  message: z
    .string()
    .describe(
      "A secure-chat message under 60 words. State the finding and ask for review. " +
        "Never instruct treatment or imply an error was made.",
    ),
});
export type DraftOutput = z.infer<typeof draftSchema>;
