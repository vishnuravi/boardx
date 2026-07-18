"use client";

import { useState } from "react";
import { boardingDuration, formatTime } from "@/lib/evaluator";
import type { ActionDraft, AgentTrace, PatientState, SafetySignal } from "@/lib/types";
import { EvidenceDrawer } from "./evidence-drawer";

/**
 * The agents that run on one posted event, in pipeline order. `kind` is what
 * each runs on — a Claude call or the code-only safety gate — and `role` is the
 * one-line job shown in the pipeline panel so it is clear what each agent does.
 * Mirrors the orchestrator and the README "The agents" table.
 */
const PIPELINE: { label: string; kind: "claude" | "code"; role: string }[] = [
  {
    label: "Change Interpreter",
    kind: "claude",
    role: "Decides whether the new panel is a meaningful change for this patient",
  },
  {
    label: "Open-Loop Finder",
    kind: "claude",
    role: "Scans the plan for unresolved items — runs in parallel",
  },
  {
    label: "Safety & Evidence Layer",
    kind: "code",
    role: "Verifies every citation and blocks unsafe phrasing",
  },
  {
    label: "Action Drafting Helper",
    kind: "claude",
    role: "Drafts the secure-chat message to the admitting team",
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
  const { busy, escalationPosted, escalationAcknowledged, ctaPosted, postEvent, acknowledge, decide, reset } =
    actions;
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

      {(busy || state.trace.length > 0) && (
        <AgentPipeline running={busy} trace={state.trace} />
      )}

      {!ctaPosted && (
        <div className="bx-demo">
          <div className="lbl">Demo control · step {escalationPosted ? "2 of 2" : "1 of 2"}</div>
          {!escalationPosted ? (
            <>
              <p>
                Story is current. Post the 04:35 respiratory trend to run the agents over it.
              </p>
              <button
                className="pill-dark"
                onClick={() => postEvent("escalation")}
                disabled={busy}
              >
                {busy ? "Agents running…" : "Post 04:35 respiratory trend"}
              </button>
            </>
          ) : !escalationAcknowledged ? (
            <p className="waiting">
              Acknowledge the escalation above. Medicine then orders the CTA, and its final
              read becomes the next event.
            </p>
          ) : (
            <>
              <p>
                CTA ordered at 04:39. Post its 05:38 final read — the result that changes the
                admission.
              </p>
              <button
                className="pill-dark"
                onClick={() => postEvent("cta-result")}
                disabled={busy}
              >
                {busy ? "Agents running…" : "Post 05:38 final CTA result"}
              </button>
            </>
          )}
        </div>
      )}

      {escalationPosted && (
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

/**
 * Makes the agents visible. This panel is the answer to "is anything happening?"
 *
 *  - running:  each agent shown live with a pulsing marker while the pipeline runs.
 *  - complete: the real trace — what each agent produced, whether it ran on Claude
 *              or fell back to code, and (in detail) how long it took and why.
 *
 * The trace it renders is the orchestrator's own, so the panel cannot claim an
 * agent ran on Claude when it actually fell back — a stage that fell back is
 * tagged `fallback`, and one the safety layer overrode is marked vetoed.
 */
function AgentPipeline({ running, trace }: { running: boolean; trace: AgentTrace[] }) {
  const done = !running && trace.length > 0;

  return (
    <div className="bx-pipeline">
      <div className="bx-pipeline-h">
        <span className="lbl">
          <i className="ti ti-topology-star-3" /> BoardX agents
        </span>
        <span className={`state ${running ? "run" : done ? "done" : ""}`}>
          {running ? "Working…" : done ? "Complete" : "Ready"}
        </span>
      </div>

      <div className="bx-pipeline-stages">
        {running &&
          PIPELINE.map((stage) => (
            <Stage
              key={stage.label}
              kind={stage.kind}
              name={stage.label}
              role={stage.role}
              working
              tag={stage.kind === "claude" ? "Claude" : "code"}
            />
          ))}

        {done &&
          PIPELINE.map((stage) => {
            const hit = trace.find((t) => t.label === stage.label);
            const vetoed = trace.some((t) => t.label === stage.label && t.vetoed?.length);
            const ranOnClaude = hit?.source === "claude";
            return (
              <Stage
                key={stage.label}
                kind={stage.kind === "claude" && !ranOnClaude ? "code" : stage.kind}
                name={stage.label}
                role={stage.role}
                veto={vetoed}
                tag={stage.kind === "code" ? "code" : ranOnClaude ? "Claude" : "fallback"}
              />
            );
          })}

      </div>
    </div>
  );
}

function Stage({
  kind,
  name,
  role,
  working = false,
  veto = false,
  why,
  vetoDetail,
  tag,
  ms,
}: {
  kind: "claude" | "code";
  name: string;
  role?: string;
  working?: boolean;
  veto?: boolean;
  why?: string;
  vetoDetail?: string[];
  tag: string;
  ms?: number;
}) {
  return (
    <div className={`stage ${working ? "working" : "done"}`}>
      <span className={`dot ${kind} ${veto ? "veto" : ""}`} />
      <div className="txt">
        <span className="name">{name}</span>
        {role && <span className="role">{role}</span>}
        {why && <span className="why">{why}</span>}
        {veto && vetoDetail?.length ? (
          <span className="why veto">vetoed: {vetoDetail.join("; ")}</span>
        ) : null}
      </div>
      <span className="tag">
        {tag}
        {ms !== undefined && ms > 0 && <em> · {ms}ms</em>}
      </span>
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
  const { busy, escalationPosted, escalationAcknowledged, ctaPosted, postEvent, acknowledge, decide } =
    actions;
  const [message, setMessage] = useState<string | null>(null);

  // The PE signal is the one carrying a draft; the escalation is acknowledge-only.
  const signal = state.signals.find((s) => s.action === "draft") ?? state.signals[0];
  const escalation = state.signals.find((s) => s.action === "acknowledge");
  const draft = state.drafts[0];
  const settled = signal && signal.status !== "needs-review";
  const text = message ?? draft?.message ?? "";

  return (
    <div className="m-scroll">
      {(busy || state.trace.length > 0) && (
        <AgentPipelineMini running={busy} trace={state.trace} />
      )}

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

      {!ctaPosted && (
        <div className="bx-demo">
          <div className="lbl">Demo · step {escalationPosted ? "2 of 2" : "1 of 2"}</div>
          {!escalationPosted ? (
            <>
              <p>Post the 04:35 respiratory trend.</p>
              <button
                className="pill-dark"
                onClick={() => postEvent("escalation")}
                disabled={busy}
              >
                {busy ? "Agents running…" : "Post 04:35 trend"}
              </button>
            </>
          ) : !escalationAcknowledged ? (
            <p className="waiting">Acknowledge the escalation above.</p>
          ) : (
            <>
              <p>CTA ordered 04:39. Post the 05:38 final read.</p>
              <button
                className="pill-dark"
                onClick={() => postEvent("cta-result")}
                disabled={busy}
              >
                {busy ? "Agents running…" : "Post 05:38 CTA"}
              </button>
            </>
          )}
        </div>
      )}

      <div className="m-lock">
        <i className="ti ti-lock" style={{ fontSize: 12 }} /> Nothing sends without your approval
      </div>
    </div>
  );
}

/** Compact agent status for the phone — the same signal, room permitting. */
function AgentPipelineMini({ running, trace }: { running: boolean; trace: AgentTrace[] }) {
  const done = !running && trace.length > 0;
  const claudeRan = trace.filter((t) => t.source === "claude").length;

  return (
    <div className={`m-pipeline ${done ? "done" : ""}`}>
      <span className="dots">
        <span />
        <span />
        <span />
      </span>
      <span className="txt">
        {running
          ? "BoardX agents analyzing the panel…"
          : `${PIPELINE.length} agents ran · ${claudeRan} on Claude · citations verified`}
      </span>
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
