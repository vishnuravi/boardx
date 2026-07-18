import { Workspace } from "@/components/workspace";
import { getState } from "@/lib/store";

// The store is in-memory and mutates per request, so never prerender this.
export const dynamic = "force-dynamic";

export default async function Page() {
  return <Workspace initial={getState()} />;
}
