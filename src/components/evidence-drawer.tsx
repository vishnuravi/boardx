"use client";

import { formatTime } from "@/lib/evaluator";
import type { EvidenceRef } from "@/lib/types";
import { Icon } from "./icons";

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
    <>
      <button
        onClick={onClose}
        aria-label="Close evidence"
        className="fixed inset-0 z-20 bg-[#1c1b18]/20"
      />
      <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-line bg-cream shadow-xl">
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-[17px] font-semibold">Evidence</h2>
            <p className="text-[13px] text-ink-2">Every claim links back to a source.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-line-2 px-4 py-1.5 text-sm text-ink"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {refs.map((ref) => (
            <article key={ref.id} className="rounded-[14px] border border-line bg-[#fdfcfa] p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold">
                  {ref.source === "abridge" && <Icon name="microphone" size={14} />}
                  {ref.label}
                </h3>
                <span className="tabular text-[13px] text-ink-3">
                  {formatTime(ref.timestamp)}
                </span>
              </div>
              <span className="mt-1 block text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                {ref.source}
              </span>
              <p className="mt-2.5 text-sm leading-[1.6] text-ink-2">{ref.excerpt}</p>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}
