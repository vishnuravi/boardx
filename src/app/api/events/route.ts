import { NextResponse } from "next/server";
import { postRepeatPanel } from "@/lib/store";

/**
 * Posts a new event into the patient's chart. The prototype exposes exactly one
 * event — the hero scenario's repeat metabolic panel — so the demo stays on rails.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body?.event !== "repeat-panel") {
    return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
  }
  return NextResponse.json(await postRepeatPanel());
}
