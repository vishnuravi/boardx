import { NextResponse } from "next/server";
import { acknowledgeSignal } from "@/lib/store";

/**
 * Acknowledges an escalation signal.
 *
 * Separate from the drafts endpoint because an escalation has no message to
 * approve — acknowledging is the whole action.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (body?.decision !== "acknowledged") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  try {
    return NextResponse.json(acknowledgeSignal(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown signal";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
