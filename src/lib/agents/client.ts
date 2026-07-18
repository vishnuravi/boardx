/**
 * Shared Claude client and the safety envelope every LLM helper runs inside.
 *
 * The envelope is the point of this file: no helper calls the model directly.
 * Each one goes through `runAgent`, which enforces a timeout and falls back to
 * a deterministic result if the model is unavailable, slow, or malformed. A
 * demo that loses its network should degrade to the deterministic path, not to
 * a spinner.
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

/**
 * Sonnet 5 rather than Opus for every helper.
 *
 * These are small, tightly-scoped structured-output calls over a context of
 * under a thousand tokens — comparing two vitals readings, checking an order
 * list, writing sixty words of secure chat. Sonnet 5 reaches near-Opus quality
 * on this shape of work at materially lower latency, and the eval suite is what
 * keeps that claim honest: the over-triggering, citation, and language tests
 * all run against whatever model is configured here.
 *
 * Override with BOARDX_MODEL to A/B against Opus without touching code.
 */
export const MODEL = process.env.BOARDX_MODEL ?? "claude-sonnet-5";

/** Hard ceiling per helper. Past this we take the deterministic answer. */
const TIMEOUT_MS = 20_000;

let client: Anthropic | null = null;

export function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

export function isLlmAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** How a given helper's output was produced — surfaced in the UI provenance. */
export type AgentSource = "claude" | "fallback";

export type AgentRun<T> = {
  value: T;
  source: AgentSource;
  /** Populated when we fell back, so the reason is visible rather than silent. */
  reason?: string;
  ms: number;
};

type RunOptions<T> = {
  /** Display name, used in logs and the UI provenance strip. */
  label: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** Deterministic answer. Must be cheap and must not throw. */
  fallback: () => T;
  /** Lower effort for mechanical extraction; higher for clinical judgment. */
  effort?: "low" | "medium" | "high";
  /**
   * Sonnet 5 runs adaptive thinking when `thinking` is omitted, which costs
   * seconds these helpers do not need. Extraction and drafting run with it
   * off; the one call that makes a judgement leaves it on.
   */
  thinking?: "adaptive" | "disabled";
};

/**
 * Runs one helper. Never throws — a failure is reported as a fallback with a
 * reason, because the caller's job is to keep the workflow moving.
 */
export async function runAgent<T>(opts: RunOptions<T>): Promise<AgentRun<T>> {
  const started = Date.now();
  const anthropic = getClient();

  if (!anthropic) {
    return {
      value: opts.fallback(),
      source: "fallback",
      reason: "ANTHROPIC_API_KEY not set",
      ms: Date.now() - started,
    };
  }

  try {
    const response = await anthropic.messages.parse(
      {
        model: MODEL,
        max_tokens: 4096,
        system: opts.system,
        thinking: { type: opts.thinking ?? "disabled" },
        output_config: {
          format: zodOutputFormat(opts.schema),
          effort: opts.effort ?? "medium",
        },
        messages: [{ role: "user", content: opts.prompt }],
      },
      { timeout: TIMEOUT_MS },
    );

    if (response.stop_reason === "refusal") {
      return {
        value: opts.fallback(),
        source: "fallback",
        reason: "model declined the request",
        ms: Date.now() - started,
      };
    }

    const parsed = response.parsed_output;
    if (!parsed) {
      return {
        value: opts.fallback(),
        source: "fallback",
        reason: "no structured output returned",
        ms: Date.now() - started,
      };
    }

    return { value: parsed, source: "claude", ms: Date.now() - started };
  } catch (error) {
    const reason =
      error instanceof Anthropic.APIError
        ? `${error.status ?? "api"}: ${error.message}`
        : error instanceof Error
          ? error.message
          : "unknown error";
    return {
      value: opts.fallback(),
      source: "fallback",
      reason,
      ms: Date.now() - started,
    };
  }
}
