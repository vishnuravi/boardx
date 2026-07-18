import { NextResponse } from "next/server";
import { getState, reset } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getState());
}

/** Resets the scenario — used by the "Reset demo" control. */
export async function DELETE() {
  return NextResponse.json(reset());
}
