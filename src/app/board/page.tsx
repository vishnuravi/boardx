import { OpsBoard } from "@/components/ops-board";
import { BOARD_NOW, boarders } from "@/data/boarders";

export const metadata = {
  title: "BoardX — Operations trackboard",
  description: "Boarding census prioritized by acuity and time boarded.",
};

/**
 * ?view=nursing swaps the census table for the nursing task queue — a stand-in
 * for role-based login in a prototype with no auth.
 */
export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  return (
    <OpsBoard census={boarders} now={BOARD_NOW} view={view === "nursing" ? "nursing" : "care"} />
  );
}
