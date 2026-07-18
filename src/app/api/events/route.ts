import { NextResponse } from "next/server";
import { isPostable, postEvent } from "@/lib/store";

/**
 * Posts one of the demo's events into the patient's chart.
 *
 * The prototype exposes exactly two — the 04:35 respiratory escalation and the
 * 05:38 final CTA — so the demo stays on rails.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const event = body?.event;

  if (typeof event !== "string" || !isPostable(event)) {
    return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
  }
  return NextResponse.json(await postEvent(event));
}
