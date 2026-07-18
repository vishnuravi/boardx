"use client";

import { useState } from "react";
import { boardingDuration, formatTime } from "@/lib/evaluator";
import type { ActionDraft, PatientState, SafetySignal } from "@/lib/types";
import { EvidenceDrawer } from "./evidence-drawer";

/** The demo's chart events, in the order the case runs. Drives the stepper. */
const STEPS: { key: "escalation" | "cta-result"; time: string; label: string; id: string }[] = [
  { key: "escalation", time: "04:35", label: "Respiratory trend", id: "evt-vitals-escalation" },
  { key: "cta-result", time: "05:38", label: "Final CTA read", id: "evt-cta-final" },
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
    postEvent: (event: "escalation" | "cta-result") =>
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
}: {
  state: PatientState;
  actions: BoardXActions;
}) {
  // Posting and resetting live in the persistent demo bar above the frame; the
  // rail only renders the patient's state and the two clinical decisions on it.
  const { busy, acknowledge, decide } = actions;
  const [drawerFor, setDrawerFor] = useState<string[] | null>(null);
  const [editing, setEditing] = useState(false);

  return (
    <div className="rail-scroll">
      <div className="bx-context">
        <span className="name">
          {surname(state)} · {state.patient.age}F
        </span>
        <span className="bx-chip amber">Boarding {boardingDuration(state)}</span>
        <span className="bx-chip">{state.patient.service} · COVID isolation</span>
        <span className="bx-chip">{state.patient.edBed}</span>
        <span className="bx-chip">
          <i className="ti ti-stethoscope" /> {state.patient.attending}
        </span>
      </div>

      <BoardingBrief state={state} />

      {state.signals.map((signal) => {
        const draft = state.drafts.find((d) => d.signalId === signal.id);
        const settled = signal.status !== "needs-review";
        return (
          <div
            className={`bx-signal${signal.priority === "high" ? " high" : ""}${
              signal.action === "acknowledge" ? " escalation" : ""
            }`}
            key={signal.id}
          >
            <div className="bx-signal-h">
              <i className={`ti ti-${settled ? "circle-check" : signal.action === "acknowledge" ? "activity-heartbeat" : "alert-triangle"}`} />
              {settled
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

              {signal.action === "acknowledge" && !settled && (
                <div className="bx-actions">
                  <button
                    className="pill-dark"
                    disabled={busy}
                    onClick={() => acknowledge(signal.id)}
                  >
                    Acknowledge
                  </button>
                  <span className="bx-nonprescriptive">
                    Reports the change only. No cause named, no imaging suggested.
                  </span>
                </div>
              )}

              {signal.action === "acknowledge" && settled && (
                <p className="bx-sent">
                  <i className="ti ti-check" /> Acknowledged by {state.patient.attending} ·{" "}
                  {state.patient.service} · CTA chest ordered at 04:39
                </p>
              )}

              {draft && (
                <DraftBlock
                  draft={draft}
                  settled={settled}
                  editing={editing}
                  setEditing={setEditing}
                  busy={busy}
                  onDecide={decide}
                />
              )}
            </div>
          </div>
        );
      })}

      {/*
        What approval produces. Until a clinician approves, neither of these
        exists — the message has no destination and the handoff still says the
        panel is pending. They are the closed loop made visible.
      */}
      {state.drafts
        .filter((d) => d.decision === "approved")
        .map((d) => (
          <div className="bx-thread" key={`sent-${d.id}`}>
            <div className="h">
              <i className="ti ti-message" /> Secure Chat · {d.recipient}
              <time>{formatTime(d.decidedAt ?? state.now)}</time>
            </div>
            <div className="b">
              <div className="msg">{d.message}</div>
              <div className="meta">
                <i className="ti ti-check" /> Delivered · sent by you from BoardX
              </div>
            </div>
          </div>
        ))}

      {state.handoffUpdatedAt && (
        <div className="bx-handoff">
          <div className="lbl">
            <i className="ti ti-arrow-right" /> Transition-ready handoff · updated{" "}
            {formatTime(state.handoffUpdatedAt)}
          </div>
          <p>{state.handoff}</p>
        </div>
      )}

      {state.suppressed.map((s) => (
        <div className="bx-suppressed" key={s.id}>
          <i className="ti ti-circle-check" />
          <div>
            <div className="t1">
              Suppressed · {s.finding} · {formatTime(s.createdAt)}
            </div>
            <div className="t2">{s.reason}</div>
          </div>
        </div>
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
 * Steps the demo through its events one at a time. Shows the current chart time
 * and a forward arrow that posts the next event; between the two events it holds
 * until the clinician acknowledges the escalation — which is what makes Medicine
 * order the CTA — so the arrow never runs ahead of the clinical loop.
 */
export function DemoStepper({
  state,
  actions,
}: {
  state: PatientState;
  actions: BoardXActions;
}) {
  const { busy, escalationPosted, escalationAcknowledged, ctaPosted, postEvent, reset } = actions;
  // The chart clock: the latest event actually on the chart. ISO strings sort
  // chronologically, so a max by string is a max by time.
  const currentTime = formatTime(
    state.events.reduce(
      (latest, e) => (e.timestamp > latest ? e.timestamp : latest),
      state.events[0]?.timestamp ?? state.now,
    ),
  );

  const nextIndex = !escalationPosted ? 0 : !ctaPosted ? 1 : -1;
  const next = nextIndex >= 0 ? STEPS[nextIndex] : null;
  // Step two waits on acknowledging step one.
  const gated = nextIndex === 1 && !escalationAcknowledged;
  const done = ctaPosted;

  return (
    <div className="bx-stepper">
      <div className="bx-stepper-top">
        <span className="clock">
          <i className="ti ti-clock-hour-4" /> {currentTime}
        </span>
        <span className="track">
          {STEPS.map((s, i) => {
            const posted = state.events.some((e) => e.id === s.id);
            return (
              <span
                key={s.key}
                className={`node ${posted ? "on" : ""} ${
                  i === nextIndex && !gated ? "next" : ""
                }`}
                title={`${s.time} · ${s.label}`}
              />
            );
          })}
        </span>
        <span className="lbl">Demo timeline</span>
        {(escalationPosted || ctaPosted) && (
          <button className="bx-stepper-reset" onClick={reset} disabled={busy}>
            Reset
          </button>
        )}
      </div>

      {done ? (
        <div className="bx-stepper-msg done">
          <i className="ti ti-circle-check" /> All events posted — the admission has changed.
        </div>
      ) : gated ? (
        <div className="bx-stepper-msg wait">
          <i className="ti ti-arrow-up" /> Acknowledge the escalation above — Medicine then
          orders the CTA, and its 05:38 read becomes the next event.
        </div>
      ) : (
        <button
          className="bx-step-fwd"
          onClick={() => next && postEvent(next.key)}
          disabled={busy || !next}
        >
          {busy ? (
            <span className="when">Agents running…</span>
          ) : (
            <>
              <span className="when">
                <b>{next?.time}</b> · {next?.label}
              </span>
              <i className="ti ti-arrow-right" />
            </>
          )}
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
        <dt>Accepting service</dt>
        <dd>
          {state.patient.service} · {state.patient.attending}
        </dd>

        <dt>Why admitted</dt>
        <dd>{intent.reasonForAdmission}</dd>

        <dt>Current plan</dt>
        <dd>
          <ul>
            {intent.plan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </dd>

        <dt>Since last review</dt>
        <dd className={open.length > 0 ? "changed" : undefined}>{sinceLastReview}</dd>

        <dt>Open items</dt>
        <dd>{intent.pendingItems.length > 0 ? intent.pendingItems.join("; ") : "None outstanding"}</dd>
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

// -------------------------------------------------------------------- mobile

export function BoardXMobile({
  state,
  actions,
}: {
  state: PatientState;
  actions: BoardXActions;
}) {
  const { busy, acknowledge, decide } = actions;
  const [message, setMessage] = useState<string | null>(null);

  // The PE signal is the one carrying a draft; the escalation is acknowledge-only.
  const signal = state.signals.find((s) => s.action === "draft") ?? state.signals[0];
  const escalation = state.signals.find((s) => s.action === "acknowledge");
  const draft = state.drafts[0];
  const settled = signal && signal.status !== "needs-review";
  const text = message ?? draft?.message ?? "";

  return (
    <div className="m-scroll">
      {signal && (
        <div className="m-card m-signal">
          <div className="sh">
            <i className={`ti ti-${settled ? "circle-check" : "alert-triangle"}`} />
            {settled ? statusLabel(signal.status) : "Needs clinician review"}
            <time>{formatTime(signal.createdAt)}</time>
          </div>
          <div className="sb">
            <p>{signal.explanation}</p>
            <div className="m-evs">
              {signal.evidence.map((id) => {
                const ref = state.evidence[id];
                if (!ref) return null;
                return (
                  <span key={id} className={id === "labs-repeat" ? "hot" : undefined}>
                    {ref.shortLabel} {formatTime(ref.timestamp)}
                  </span>
                );
              })}
            </div>
            {draft && (
              <>
                <div className="m-draftcard">
                  <div className="lbl">Draft to {draft.recipient} · Secure Chat</div>
                  <p>{text}</p>
                </div>
                {!settled && (
                  <>
                    <button
                      className="m-approve"
                      disabled={busy}
                      onClick={() => decide(draft.id, "approved", text)}
                    >
                      Approve and Send
                    </button>
                    <div className="m-btnrow">
                      <button onClick={() => setMessage(text)}>Edit</button>
                      <button disabled={busy} onClick={() => decide(draft.id, "deferred", text)}>
                        Defer
                      </button>
                      <button
                        className="ghost"
                        disabled={busy}
                        onClick={() => decide(draft.id, "dismissed", text)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {state.drafts
        .filter((d) => d.decision === "approved")
        .map((d) => (
          <div className="m-card" key={`sent-${d.id}`} style={{ padding: "14px 16px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--ink-2)",
                marginBottom: 8,
              }}
            >
              Secure Chat · {d.recipient} · {formatTime(d.decidedAt ?? state.now)}
            </div>
            <div
              style={{
                background: "var(--blue)",
                color: "#fff",
                borderRadius: "12px 12px 3px 12px",
                padding: "11px 14px",
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {d.message}
            </div>
            <div
              style={{
                marginTop: 6,
                textAlign: "right",
                fontSize: 11,
                color: "var(--ink-3)",
              }}
            >
              Delivered
            </div>
          </div>
        ))}

      {state.handoffUpdatedAt && (
        <div className="m-card" style={{ padding: "14px 16px" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
              marginBottom: 6,
            }}
          >
            Handoff · updated {formatTime(state.handoffUpdatedAt)}
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>{state.handoff}</p>
        </div>
      )}

      {state.suppressed.map((s) => (
        <div
          className="m-card"
          key={s.id}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 18px" }}
        >
          <i className="ti ti-circle-check" style={{ fontSize: 20, color: "var(--green)" }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>
              Suppressed · {s.finding} · {formatTime(s.createdAt)}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>
              Unchanged; flagged in renal plan
            </div>
          </div>
        </div>
      ))}

      {escalation && escalation.status === "needs-review" && (
        <div className="m-card m-signal" style={{ padding: 0 }}>
          <div className="sh">
            <i className="ti ti-activity-heartbeat" /> {escalation.headline}
            <time>{formatTime(escalation.createdAt)}</time>
          </div>
          <div className="sb">
            <p>{escalation.explanation}</p>
            <button
              className="m-approve"
              disabled={busy}
              onClick={() => acknowledge(escalation.id)}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}


      <div className="m-lock">
        <i className="ti ti-lock" style={{ fontSize: 12 }} /> Nothing sends without your approval
      </div>
    </div>
  );
}

function surname(state: PatientState) {
  const [first, last] = state.patient.name.split(" ");
  return `${last}, ${first}`;
}

function statusLabel(status: SafetySignal["status"]): string {
  if (status === "acknowledged") return "Acknowledged · sent";
  if (status === "deferred") return "Deferred";
  return "Dismissed";
}
