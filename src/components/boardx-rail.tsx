"use client";

import { useState } from "react";
import { boardingDuration, formatTime } from "@/lib/evaluator";
import type { ActionDraft, PatientState, SafetySignal } from "@/lib/types";
import { EvidenceDrawer } from "./evidence-drawer";

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
    posted: state.events.some((e) => e.id === "evt-labs-repeat"),
    postPanel: () =>
      call("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "repeat-panel" }),
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
  const { busy, posted, postPanel, decide, reset } = actions;
  const [drawerFor, setDrawerFor] = useState<string[] | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <div className="rail-scroll">
      <div className="bx-context">
        <span className="name">
          {surname(state)} · {state.patient.age}F
        </span>
        <span className="bx-chip amber">Boarding {boardingDuration(state)}</span>
        <span className="bx-chip">Medicine · COVID isolation</span>
        <span className="bx-chip">{state.patient.edBed}</span>
      </div>

      {state.signals.map((signal) => {
        const draft = state.drafts.find((d) => d.signalId === signal.id);
        const settled = signal.status !== "needs-review";
        return (
          <div className="bx-signal" key={signal.id}>
            <div className="bx-signal-h">
              <i className={`ti ti-${settled ? "circle-check" : "alert-triangle"}`} />
              {settled ? statusLabel(signal.status) : "Needs clinician review"}
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

      {state.suppressed.map((s) => (
        <div className="bx-suppressed" key={s.id}>
          <i className="ti ti-circle-check" />
          <div>
            <div className="t1">
              Suppressed · {s.finding} · {formatTime(s.createdAt)}
            </div>
            <div className="t2">{s.reason}</div>
          </div>
          <button className="trace" onClick={() => setShowTrace((v) => !v)}>
            {showTrace ? "Hide trace" : "View trace"}
          </button>
        </div>
      ))}

      {showTrace && state.trace.length > 0 && (
        <div className="bx-trace">
          <div className="lbl">How this was produced</div>
          {state.trace.map((step, i) => (
            <div className="row" key={`${step.label}-${i}`}>
              <span className={step.source === "claude" ? "src claude" : "src"}>
                {step.source === "claude" ? "claude" : "code"}
              </span>
              <span className="name">{step.label}</span>
              {step.ms > 0 && <span className="ms">{step.ms}ms</span>}
              {step.reason && <span className="why">{step.reason}</span>}
            </div>
          ))}
        </div>
      )}

      {!posted && (
        <div className="bx-demo">
          <div className="lbl">Demo control</div>
          <p>Story is current. Post the 05:32 repeat metabolic panel to run the pipeline.</p>
          <button className="pill-dark" onClick={postPanel} disabled={busy}>
            {busy ? "Running helpers…" : "Post repeat metabolic panel"}
          </button>
        </div>
      )}

      {posted && (
        <button className="bx-reset" onClick={reset} disabled={busy}>
          Reset demo
        </button>
      )}

      {drawerFor && (
        <EvidenceDrawer
          refs={drawerFor.map((id) => state.evidence[id]).filter(Boolean)}
          onClose={() => setDrawerFor(null)}
        />
      )}
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
            Sent to {draft.recipient} at {formatTime(draft.decidedAt ?? "")}. Handoff updated.
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
  const { busy, posted, postPanel, decide } = actions;
  const [message, setMessage] = useState<string | null>(null);

  const signal = state.signals[0];
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
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12.5,
              color: "var(--blue)",
              whiteSpace: "nowrap",
            }}
          >
            View trace
          </span>
        </div>
      ))}

      {!posted && (
        <div className="bx-demo">
          <div className="lbl">Demo control</div>
          <p>Post the 05:32 repeat panel.</p>
          <button className="pill-dark" onClick={postPanel} disabled={busy}>
            {busy ? "Running…" : "Post panel"}
          </button>
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
