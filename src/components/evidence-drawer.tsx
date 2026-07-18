"use client";

import { formatTime } from "@/lib/evaluator";
import type { EvidenceRef } from "@/lib/types";

/**
 * Provenance panel. Every statement BoardX makes has to be traceable to one of
 * these, so the drawer shows source, timestamp, and the verbatim excerpt.
 */
export function EvidenceDrawer({
  refs,
  onClose,
}: {
  refs: EvidenceRef[];
  onClose: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-xl">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Evidence</h2>
          <p className="text-xs text-muted">Every claim links back to a source.</p>
        </div>
        <button
          onClick={onClose}
          className="rounded px-2 py-1 text-sm text-muted hover:bg-background"
          aria-label="Close evidence drawer"
        >
          Close
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {refs.map((ref) => (
          <article key={ref.id} className="rounded-lg border border-line p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold">{ref.label}</h3>
              <span className="tabular text-xs text-muted">{formatTime(ref.timestamp)}</span>
            </div>
            <span className="label mt-1 block">{ref.source}</span>
            <p className="mt-2 text-sm leading-relaxed text-muted">{ref.excerpt}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
