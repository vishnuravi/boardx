"use client";

import { useState } from "react";
import { formatTime } from "@/lib/evaluator";
import type { ActionDraft, PatientState, SafetySignal } from "@/lib/types";
import { EvidenceDrawer } from "./evidence-drawer";

/** The demo's chart events, in the order the case runs. Drives the stepper. */
type StepKey = "escalation" | "cta-result" | "heparin";

const STEPS: { key: StepKey; time: string; label: string; id: string }[] = [
  {
    key: "escalation",
    time: "04:35",
    label: "New vitals — SpO₂ 86% on 6 L",
    id: "evt-vitals-escalation",
  },
  {
    key: "cta-result",
    time: "05:38",
    label: "Final CTA report — PE identified",
    id: "evt-cta-final",
  },
  {
    key: "heparin",
    time: "05:44",
    label: "Medicine orders heparin infusion",
    id: "evt-heparin-order",
  },
];

/**
 * The BoardX rail tab and its mobile counterpart.
 *
 * Chrome is the mockup's; the content is live. Signal text, evidence set, and
 * draft all come from the orchestrator, so what renders is whatever the
 * pipeline actually produced for this event.
 */

export type BoardXActions = ReturnType<typeof useBoardX>;

/**
 * Owns every mutation the BoardX surfaces can make.
 *
 * Called once, in Workspace, and passed down — the desktop rail and the phone
 * are two views of one patient, so they must share `busy`. When each held its
 * own, clicking Post on the desktop left the phone's button live, and the
 * second click raced the first through a 15-second pipeline.
 */
export function useBoardX(state: PatientState, setState: (s: PatientState) => void) {
  const [busy, setBusy] = useState(false);

  async function call(input: string, init: RequestInit) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(input, init);
      if (res.ok) setState(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    escalationPosted: state.events.some((e) => e.id === "evt-vitals-escalation"),
    escalationAcknowledged: state.signals.some(
      (sig) => sig.category === "escalation" && sig.status === "acknowledged",
    ),
    ctaPosted: state.events.some((e) => e.id === "evt-cta-final"),
    heparinPosted: state.events.some((e) => e.id === "evt-heparin-order"),
    postEvent: (event: StepKey) =>
      call("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      }),
    acknowledge: (signalId: string) =>
      call(`/api/signals/${signalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "acknowledged" }),
      }),
    decide: (draftId: string, decision: string, message: string) =>
      call(`/api/drafts/${draftId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, message }),
      }),
    reset: () => call("/api/patient", { method: "DELETE" }),
  };
}

// ------------------------------------------------------------------- desktop

export function BoardXRail({
  state,
  actions,
  className = "rail-scroll",
}: {
  state: PatientState;
  actions: BoardXActions;
  /** The phone renders the same tree inside its own scroll container. */
  className?: string;
}) {
  const { busy, acknowledge, decide } = actions;
  const [drawerFor, setDrawerFor] = useState<string[] | null>(null);
  const [editing, setEditing] = useState(false);

  const open = state.signals.filter((s) => s.status === "needs-review");
  const settled = state.signals.filter((s) => s.status !== "needs-review");

  /**
   * Once the next event lands, a settled notification is history. It collapses
   * to one line so the pane keeps showing the thing that needs a decision
   * rather than a growing stack of what already got one. Still openable — the
   * evidence and the delivery receipt are the point of keeping it at all.
   */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const latestId = state.signals[state.signals.length - 1]?.id;
  // The current event stays open; anything the demo has moved past folds away.
  const isOpen = (id: string) => expanded[id] ?? id === latestId;
  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));

  const renderCollapsed = (signal: SafetySignal) => {
    const draft = state.drafts.find((d) => d.signalId === signal.id);
    return (
      <button
        className="bx-collapsed"
        key={signal.id}
        onClick={() => toggle(signal.id)}
        aria-expanded={false}
      >
        <i className="ti ti-circle-check" />
        <span className="txt">
          <b>{signal.headline}</b>
          {draft?.acknowledgedBy && (
            <span className="sub">
              Acknowledged by {draft.acknowledgedBy} at {formatTime(draft.acknowledgedAt ?? "")}
            </span>
          )}
        </span>
        <time>{formatTime(signal.createdAt)}</time>
        <i className="ti ti-chevron-down chev" />
      </button>
    );
  };

  const renderSignal = (signal: SafetySignal) => {
    const draft = state.drafts.find((d) => d.signalId === signal.id);
    const decided = signal.status !== "needs-review";
    return (
      <div
        className={`bx-signal${signal.priority === "high" ? " high" : ""}${
          signal.action === "acknowledge" ? " escalation" : ""
        }`}
        key={signal.id}
      >
        <div className="bx-signal-h">
          <i className={`ti ti-${decided ? "circle-check" : signal.action === "acknowledge" ? "activity-heartbeat" : "alert-triangle"}`} />
          {decided
            ? statusLabel(signal.status)
            : signal.action === "acknowledge"
              ? signal.headline
              : signal.priority === "high"
                ? "High-priority clinician review"
                : "Needs clinician review"}
          <time>{formatTime(signal.createdAt)}</time>
        </div>
        <div className="bx-signal-b">
          <p>{signal.explanation}</p>

          <div className="bx-ev">
            {signal.evidence.map((id) => {
              const ref = state.evidence[id];
              if (!ref) return null;
              return (
                <span
                  key={id}
                  className={id === "labs-repeat" ? "hot" : undefined}
                  onClick={() => setDrawerFor(signal.evidence)}
                  style={{ cursor: "pointer" }}
                >
                  {ref.source === "abridge" && <i className="ti ti-microphone" />}
                  {ref.shortLabel} {formatTime(ref.timestamp)}
                </span>
              );
            })}
          </div>

          {signal.action === "auto-notify" && draft?.autoSent && (
            <div className="bx-autosent">
              <p>
                <i className="ti ti-send" /> Sent automatically to {draft.recipient} at{" "}
                {formatTime(draft.decidedAt ?? signal.createdAt)} — factual notification, no
                approval required
              </p>
              {draft.acknowledgedAt ? (
                <p className="ack">
                  <i className="ti ti-checks" /> Acknowledged by {draft.acknowledgedBy} at{" "}
                  {formatTime(draft.acknowledgedAt)}
                </p>
              ) : (
                <p className="pending">
                  <i className="ti ti-clock" /> Delivered · not yet acknowledged
                </p>
              )}
            </div>
          )}

          {signal.action === "acknowledge" && !decided && (
            <div className="bx-actions">
              <button
                className="pill-dark"
                disabled={busy}
                onClick={() => acknowledge(signal.id)}
              >
                Acknowledge
              </button>
              <span className="bx-nonprescriptive">
                You were not on the order routing. Acknowledging records that you have it.
              </span>
            </div>
          )}

          {signal.action === "acknowledge" && decided && (
            <p className="bx-sent">
              <i className="ti ti-check" /> Acknowledged
            </p>
          )}

          {decided && (
            <button className="bx-collapse-back" onClick={() => toggle(signal.id)}>
              <i className="ti ti-chevron-up" /> Collapse
            </button>
          )}

          {draft && !draft.autoSent && (
            <DraftBlock
              draft={draft}
              settled={decided}
              editing={editing}
              setEditing={setEditing}
              busy={busy}
              onDecide={decide}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <DemoStepper actions={actions} />

      {/*
        Anything awaiting a decision sits above the story. The brief is context
        for the card, not a preamble to scroll past when something needs you.
      */}
      {open.map(renderSignal)}

      <BoardingBrief state={state} />

      {settled.map((signal) =>
        isOpen(signal.id) ? renderSignal(signal) : renderCollapsed(signal),
      )}

      {/*
        What approval produced, as one block rather than two stacked cards: the
        message that went out and the handoff it rewrote.
      */}
      {state.handoffUpdatedAt && (
        <div className="bx-outcome">
          <div className="lbl">
            <i className="ti ti-check" /> Handoff updated · {formatTime(state.handoffUpdatedAt)}
          </div>
          <div className="handoff">{state.handoff}</div>
        </div>
      )}

      {state.suppressed.map((s) => (
        <p className="bx-quiet" key={s.id}>
          <i className="ti ti-circle-check" />
          <span>
            <b>Checked, not raised</b> · {formatTime(s.createdAt)} {s.finding} — {s.reason}
          </span>
        </p>
      ))}

      {drawerFor && (
        <EvidenceDrawer
          refs={drawerFor.map((id) => state.evidence[id]).filter(Boolean)}
          onClose={() => setDrawerFor(null)}
        />
      )}
    </div>
  );
}

/**
 * Advances the demo one chart event at a time.
 *
 * It sits at the top of the same column as everything it produces, so the whole
 * demo reads down one page: what arrives next, then the story it lands in, then
 * the card raised, then what your decision produced. Splitting the controls
 * across a separate bar meant bouncing between two places to drive one loop.
 *
 * The one thing it will not do is act for the clinician. Between the two events
 * it waits: acknowledging the escalation is what makes Medicine order the CTA,
 * so the arrow never runs ahead of the clinical decision.
 */
export function DemoStepper({ actions }: { actions: BoardXActions }) {
  const { busy, escalationPosted, ctaPosted, heparinPosted, postEvent, reset } = actions;

  const nextIndex = !escalationPosted ? 0 : !ctaPosted ? 1 : !heparinPosted ? 2 : -1;
  const next = nextIndex >= 0 ? STEPS[nextIndex] : null;
  const done = nextIndex === -1;

  return (
    <div className="bx-stepper">
      {busy ? (
        <span className="state">Agents running…</span>
      ) : done ? (
        <span className="state">All events posted</span>
      ) : (
        <>
          <button
            className="bx-step-fwd"
            onClick={() => next && postEvent(next.key)}
            disabled={!next}
            aria-label={next ? `Post ${next.time} ${next.label}` : "Next event"}
          >
            <i className="ti ti-player-track-next-filled" />
          </button>
          <span className="state">
            Next: <b>{next?.time}</b> {next?.label}
          </span>
        </>
      )}

      {escalationPosted && (
        <button className="bx-stepper-reset" onClick={reset} disabled={busy}>
          Reset
        </button>
      )}
    </div>
  );
}

/**
 * The Live Boarding Brief — the first of the three capabilities in
 * planning/product-solution.md, and the thing a clinician reads before anything
 * else: why this patient is here, what the plan is, and what has moved.
 *
 * It sits above the signals deliberately. A review card without the story it
 * changes is an alert; with the story above it, it is a change to a plan the
 * reader is already holding.
 */
function BoardingBrief({ state }: { state: PatientState }) {
  const { admissionIntent: intent } = state;
  const open = state.signals.filter((s) => s.status === "needs-review");
  const acknowledged = state.signals.filter((s) => s.status === "acknowledged");

  const sinceLastReview =
    open.length > 0
      ? open.map((s) => s.headline).join(" · ")
      : acknowledged.length > 0
        ? `${acknowledged.length} item${acknowledged.length > 1 ? "s" : ""} reviewed and acknowledged`
        : "No material changes";

  return (
    <div className="bx-brief">
      <div className="lbl">
        <i className="ti ti-notes" /> Live boarding brief
      </div>
      <dl>
        <dt>Why admitted</dt>
        <dd>{intent.reasonForAdmission}</dd>

        <dt>Since last review</dt>
        <dd className={open.length > 0 ? "changed" : undefined}>{sinceLastReview}</dd>

        <dt>Open items</dt>
        <dd>
          {/* The Open-Loop Finder's output once it has run; the admission
              plan's pending list until then. */}
          {/* Capped: the brief is a glance, not a list. */}
          {(state.openLoops.length > 0 ? state.openLoops : intent.pendingItems)
            .slice(0, 3)
            .join(" · ") || "None outstanding"}
        </dd>
      </dl>
    </div>
  );
}

function DraftBlock({
  draft,
  settled,
  editing,
  setEditing,
  busy,
  onDecide,
}: {
  draft: ActionDraft;
  settled: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  busy: boolean;
  onDecide: (id: string, decision: string, message: string) => void;
}) {
  const [message, setMessage] = useState(draft.message);

  return (
    <>
      <div className="bx-draft">
        <div className="lbl">
          <i className="ti ti-message" /> Draft · Secure Chat · {draft.recipient}
        </div>
        {editing && !settled ? (
          <textarea
            className="bx-edit"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        ) : (
          <p>{message}</p>
        )}
      </div>

      {!settled ? (
        <div className="bx-actions">
          <button
            className="pill-dark"
            disabled={busy}
            onClick={() => onDecide(draft.id, "approved", message)}
          >
            Approve and Send
          </button>
          <button className="pill-outline" onClick={() => setEditing(!editing)}>
            {editing ? "Done" : "Edit"}
          </button>
          <button
            className="pill-outline"
            disabled={busy}
            onClick={() => onDecide(draft.id, "deferred", message)}
          >
            Defer
          </button>
          <button
            className="ghost"
            disabled={busy}
            onClick={() => onDecide(draft.id, "dismissed", message)}
          >
            Dismiss
          </button>
        </div>
      ) : (
        draft.decision === "approved" && (
          <p className="bx-sent">
            <i className="ti ti-check" /> Acknowledged and sent to {draft.recipient} at{" "}
            {formatTime(draft.decidedAt ?? "")}.
          </p>
        )
      )}
    </>
  );
}

function statusLabel(status: SafetySignal["status"]): string {
  if (status === "acknowledged") return "Acknowledged · sent";
  if (status === "deferred") return "Deferred";
  return "Dismissed";
}
