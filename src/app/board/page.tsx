import { OpsBoard } from "@/components/ops-board";
import { BOARD_NOW, boarders } from "@/data/boarders";

export const metadata = {
  title: "BoardX — Operations trackboard",
  description: "Boarding census prioritized by acuity and time boarded.",
};

export default function BoardPage() {
  return <OpsBoard census={boarders} now={BOARD_NOW} />;
}
