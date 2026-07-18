/**
 * Measures the real token footprint of the shared helper prompt.
 *
 * Run: npm run measure
 *
 * The question this answers: is the shared patient context large enough for
 * prompt caching to fire? Opus 4.8 requires a 4096-token minimum cacheable
 * prefix. Below that, `cache_control` is silently a no-op — no error, just
 * `cache_creation_input_tokens: 0`. Measure before adding it.
 */

import Anthropic from "@anthropic-ai/sdk";
import { initialPatientState } from "../src/data/maria-chen";
import { renderPatientContext } from "../src/lib/agents/context";

const MODEL = "claude-opus-4-8";
const CACHE_MINIMUM = 4096; // Opus 4.8; Sonnet-tier is lower

const client = new Anthropic();

async function count(text: string): Promise<number> {
  const res = await client.messages.countTokens({
    model: MODEL,
    messages: [{ role: "user", content: text }],
  });
  return res.input_tokens;
}

async function main() {
  const state = initialPatientState();
  const context = renderPatientContext(state);
  const contextTokens = await count(context);

  console.log(`model                   ${MODEL}`);
  console.log(`shared patient context  ${contextTokens} tokens`);
  console.log(`cacheable minimum       ${CACHE_MINIMUM} tokens`);
  console.log("");

  if (contextTokens < CACHE_MINIMUM) {
    console.log(`VERDICT  below minimum by ${CACHE_MINIMUM - contextTokens} tokens.`);
    console.log("");
    console.log("Prompt caching would not fire. Adding cache_control to the shared");
    console.log("prefix would be a silent no-op, so it is deliberately absent.");
    console.log("");
    console.log("Revisit when the context grows: a real chart — full note text, lab");
    console.log("history, vitals trends, medication list — clears 4096 easily, and at");
    console.log("that point the helpers share one prefix genuinely worth caching.");
  } else {
    console.log("VERDICT  above minimum. Cache the shared prefix.");
  }
}

main();
