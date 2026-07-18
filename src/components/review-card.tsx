"use client";

import { useState } from "react";
import { formatTime } from "@/lib/evaluator";
import type { ActionDraft, SafetySignal } from "@/lib/types";

/**
 * The "needs clinician review" card and its drafted action.
 *
 * Language here is load-bearing: the card raises something for review and says
 * what is "not visible in active orders". It never asserts an error was made or
 * instructs treatment.
 */
export function ReviewCard({
  signal,
  draft,
  onViewEvidence,
  onDecide,
  busy,
}: {
  signal: SafetySignal;
  draft?: ActionDraft;
  onViewEvidence: () => void;
  onDecide: (decision: "approved" | "dismissed" | "deferred", message: string) => void;
  busy: boolean;
}) {
  const [message, setMessage] = useState(draft?.message ?? "");
  const [open, setOpen] = useState(false);

  const settled = signal.status !== "needs-review";

  return (
    <section
      className={`rounded-xl border p-5 ${
        settled
          ? "border-resolved/30 bg-resolved-surface"
          : "border-review/30 bg-review-surface"
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className={`label ${settled ? "text-resolved" : "text-review"}`}>
          {settled ? statusLabel(signal.status) : "Needs clinician review"}
        </span>
        <span className="tabular text-xs text-muted">{formatTime(signal.createdAt)}</span>
      </div>

      <h2 className="mt-2 text-base font-semibold">{signal.headline}</h2>
      <p className="mt-2 text-sm leading-relaxed">{signal.explanation}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onViewEvidence}
          className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          View evidence
        </button>
        {draft && !settled && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            {open ? "Hide draft" : "Review action"}
          </button>
        )}
      </div>

      {draft && open && !settled && (
        <div className="mt-4 rounded-lg border border-line bg-surface p-4">
          <label htmlFor="draft" className="label">
            Message draft to {draft.recipient}
          </label>
          <textarea
            id="draft"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="mt-2 w-full resize-y rounded-md border border-line bg-background p-3 text-sm leading-relaxed focus:outline-2 focus:outline-accent"
          />
          <p className="mt-2 text-xs text-muted">
            Nothing is sent until you approve. You can edit this text first.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => onDecide("approved", message)}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Approve and send
            </button>
            <button
              disabled={busy}
              onClick={() => onDecide("deferred", message)}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-50"
            >
              Defer
            </button>
            <button
              disabled={busy}
              onClick={() => onDecide("dismissed", message)}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {draft && settled && draft.decision === "approved" && (
        <p className="mt-4 rounded-lg border border-line bg-surface p-3 text-sm text-muted">
          Sent to {draft.recipient} at{" "}
          <span className="tabular">{formatTime(draft.decidedAt ?? signal.createdAt)}</span>.
        </p>
      )}
    </section>
  );
}

function statusLabel(status: SafetySignal["status"]): string {
  if (status === "acknowledged") return "Acknowledged";
  if (status === "deferred") return "Deferred";
  return "Dismissed";
}
