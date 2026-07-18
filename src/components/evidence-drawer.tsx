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
    <>
      <button className="ev-scrim" onClick={onClose} aria-label="Close evidence" />
      <aside className="ev-drawer">
        <header>
          <div>
            <h2>Evidence</h2>
            <p>Every claim links back to a source.</p>
          </div>
          <button className="close" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="ev-list">
          {refs.map((ref) => (
            <article className="ev-item" key={ref.id}>
              <div className="top">
                <h3>
                  {ref.source === "abridge" && <i className="ti ti-microphone" />}
                  {ref.label}
                </h3>
                <time>{formatTime(ref.timestamp)}</time>
              </div>
              <span className="src">{ref.source}</span>
              <p className="excerpt">{ref.excerpt}</p>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}
