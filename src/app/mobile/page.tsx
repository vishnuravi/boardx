import { MobileDemo } from "@/components/mobile-demo";
import { getState } from "@/lib/store";

// Shares the in-memory store with the desktop route, so both views show the
// same patient state. Never prerender.
export const dynamic = "force-dynamic";

export default async function MobilePage() {
  return <MobileDemo initial={getState()} />;
}
