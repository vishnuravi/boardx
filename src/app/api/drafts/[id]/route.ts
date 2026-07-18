import { NextResponse } from "next/server";
import { decide } from "@/lib/store";
import type { ClinicianDecision } from "@/lib/types";

const ALLOWED: Exclude<ClinicianDecision, "pending">[] = ["approved", "dismissed", "deferred"];

/** Records the clinician's decision on a drafted action. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const decision = body?.decision;

  if (!ALLOWED.includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  try {
    return NextResponse.json(decide(id, decision, body?.message));
  } catch {
    return NextResponse.json({ error: "Unknown draft" }, { status: 404 });
  }
}
