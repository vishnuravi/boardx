"use client";

import { useState } from "react";
import { boardingDuration, formatTime } from "@/lib/evaluator";
import type { ActionDraft, PatientState, SafetySignal } from "@/lib/types";
import { EvidenceDrawer } from "./evidence-drawer";
import { Icon } from "./icons";

/**
 * The BoardX rail tab — the action layer.
 *
 * Chrome matches the mockup; everything in it is live. The signal text, the
 * evidence set, and the draft all come from the orchestrator, so what renders
 * here is whatever the pipeline actually produced for this event.
 */
export function BoardXRail({
  state,
  setState,
}: {
  state: PatientState;
  setState: (s: PatientState) => void;
}) {
  const [drawerFor, setDrawerFor] = useState<string[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  const posted = state.events.some((e) => e.id === "evt-labs-repeat");

  async function call(input: string, init: RequestInit) {
    setBusy(true);
    try {
      const res = await fetch(input, init);
      if (res.ok) setState(await res.json());
    } finally {
      setBusy(false);
    }
  }

  const postPanel = () =>
    call("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "repeat-panel" }),
    });

  const decide = (draftId: string, decision: string, message: string) =>
    call(`/api/drafts/${draftId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, message }),
    });

  const reset = () => call("/api/patient", { method: "DELETE" });

  return (
    <>
      <div className="flex-1 px-1.5 pb-3 pt-[26px]">
        <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
          <span className="text-[18px] font-semibold">
            {state.patient.name.split(" ").reverse().join(", ")} · {state.patient.age}F
          </span>
          <Chip amber>Boarding {boardingDuration(state)}</Chip>
          <Chip>{state.patient.admittedTo.replace(" (", " · ").replace(")", "")}</Chip>
          <Chip>{state.patient.edBed}</Chip>
        </div>

        {state.signals.map((signal) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            draft={state.drafts.find((d) => d.signalId === signal.id)}
            state={state}
            busy={busy}
            editing={editing}
            setEditing={setEditing}
            onViewEvidence={() => setDrawerFor(signal.evidence)}
            onDecide={decide}
          />
        ))}

        {state.suppressed.map((s) => (
          <div
            key={s.id}
            className="mb-5 flex items-center gap-3.5 rounded-[14px] border border-line bg-[#fdfcfa] px-[22px] py-4"
          >
            <Icon name="circle-check" size={22} className="shrink-0 text-green" />
            <div className="min-w-0">
              <div className="text-[15px] font-medium">
                Suppressed · {s.finding} · {formatTime(s.createdAt)}
              </div>
              <div className="mt-0.5 text-[13.5px] text-ink-3">{s.reason}</div>
            </div>
            <button
              onClick={() => setShowTrace((v) => !v)}
              className="ml-auto whitespace-nowrap text-sm text-blue"
            >
              {showTrace ? "Hide trace" : "View trace"}
            </button>
          </div>
        ))}

        {showTrace && state.trace.length > 0 && (
          <div className="mb-5 rounded-[14px] border border-line bg-[#fdfcfa] px-[22px] py-4">
            <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-2">
              How this was produced
            </div>
            <ol className="space-y-2">
              {state.trace.map((step, i) => (
                <li key={`${step.label}-${i}`} className="flex flex-wrap items-baseline gap-x-2.5">
                  <span
                    className={`text-xs ${step.source === "claude" ? "text-blue" : "text-ink-3"}`}
                  >
                    {step.source === "claude" ? "claude" : "code"}
                  </span>
                  <span className="text-[13.5px] font-medium">{step.label}</span>
                  {step.ms > 0 && (
                    <span className="tabular text-xs text-ink-3">{step.ms}ms</span>
                  )}
                  {step.reason && (
                    <span className="w-full text-xs leading-relaxed text-ink-3">{step.reason}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {!posted && (
          <div className="rounded-[14px] border border-dashed border-line-2 px-[22px] py-5">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-2">
              Demo control
            </div>
            <p className="mt-1.5 text-[15px] leading-[1.55] text-ink-2">
              Story is current. Post the 05:32 repeat metabolic panel to run the pipeline.
            </p>
            <button
              onClick={postPanel}
              disabled={busy}
              className="mt-3.5 rounded-full bg-dark px-[22px] py-2.5 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {busy ? "Running helpers…" : "Post repeat metabolic panel"}
            </button>
          </div>
        )}

        {posted && (
          <button
            onClick={reset}
            disabled={busy}
            className="mt-2 text-[13px] text-ink-3 underline disabled:opacity-50"
          >
            Reset demo
          </button>
        )}
      </div>

      <div className="mt-auto flex items-center justify-center gap-1.5 px-[30px] pb-1.5 pt-3.5 text-[12.5px] text-ink-2">
        <Icon name="lock" size={13} />
        BoardX surfaces evidence-linked changes for clinician review. Nothing is sent without your
        approval.
      </div>

      {drawerFor && (
        <EvidenceDrawer
          refs={drawerFor.map((id) => state.evidence[id]).filter(Boolean)}
          onClose={() => setDrawerFor(null)}
        />
      )}
    </>
  );
}

function Chip({ children, amber = false }: { children: React.ReactNode; amber?: boolean }) {
  return (
    <span
      className={`rounded-full px-[13px] py-[5px] text-[13px] ${
        amber ? "bg-amber-bg text-amber-ink" : "bg-cream-2 text-ink-2"
      }`}
    >
      {children}
    </span>
  );
}

function SignalCard({
  signal,
  draft,
  state,
  busy,
  editing,
  setEditing,
  onViewEvidence,
  onDecide,
}: {
  signal: SafetySignal;
  draft?: ActionDraft;
  state: PatientState;
  busy: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onViewEvidence: () => void;
  onDecide: (draftId: string, decision: string, message: string) => void;
}) {
  const [message, setMessage] = useState(draft?.message ?? "");
  const settled = signal.status !== "needs-review";

  return (
    <div
      className={`mb-5 overflow-hidden rounded-[14px] border bg-[#fdfcfa] ${
        settled ? "border-line" : "border-sig-red-line"
      }`}
    >
      <div
        className={`flex items-center gap-2.5 px-[22px] py-[15px] text-[17px] font-medium ${
          settled ? "bg-cream-2 text-green" : "bg-sig-red-bg text-sig-red"
        }`}
      >
        <Icon name={settled ? "circle-check" : "alert-triangle"} size={19} />
        {settled ? statusLabel(signal.status) : "Needs clinician review"}
        <time className="ml-auto text-sm font-normal">{formatTime(signal.createdAt)}</time>
      </div>

      <div className="px-[22px] py-5">
        <p className="mb-[18px] text-base leading-[1.6]">{signal.explanation}</p>

        <div className="mb-[18px] flex flex-wrap gap-2">
          {signal.evidence.map((id) => {
            const ref = state.evidence[id];
            if (!ref) return null;
            const hot = id === "labs-repeat";
            return (
              <button
                key={id}
                onClick={onViewEvidence}
                className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-[13px] py-1.5 text-[13px] ${
                  hot ? "border-sig-red-line text-sig-red" : "border-line-2 text-ink-2"
                }`}
              >
                {ref.source === "abridge" && <Icon name="microphone" size={13} />}
                {ref.shortLabel} {formatTime(ref.timestamp)}
              </button>
            );
          })}
        </div>

        {draft && (
          <div className="mb-5 rounded-[14px] bg-cream-2 px-[18px] py-[15px]">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-2">
              <Icon name="message" size={13} />
              Draft · Secure Chat · {draft.recipient}
            </div>
            {editing && !settled ? (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-1 w-full resize-y rounded-lg border border-line-2 bg-white p-3 text-[15px] leading-[1.55] focus:outline-2 focus:outline-blue"
              />
            ) : (
              <p className="text-[15px] leading-[1.55]">{message}</p>
            )}
          </div>
        )}

        {draft && !settled && (
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onDecide(draft.id, "approved", message)}
              disabled={busy}
              className="rounded-full bg-dark px-[22px] py-[11px] text-[15px] font-medium text-white disabled:opacity-50"
            >
              Approve and Send
            </button>
            <button
              onClick={() => setEditing(!editing)}
              className="rounded-full border border-line-2 px-[22px] py-[11px] text-[15px] font-medium text-ink"
            >
              {editing ? "Done" : "Edit"}
            </button>
            <button
              onClick={() => onDecide(draft.id, "deferred", message)}
              disabled={busy}
              className="rounded-full border border-line-2 px-[22px] py-[11px] text-[15px] font-medium text-ink disabled:opacity-50"
            >
              Defer
            </button>
            <button
              onClick={() => onDecide(draft.id, "dismissed", message)}
              disabled={busy}
              className="rounded-full px-3.5 py-[11px] text-[15px] text-ink-3 disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        )}

        {draft && settled && draft.decision === "approved" && (
          <p className="text-[15px] text-ink-2">
            Sent to {draft.recipient} at{" "}
            <span className="tabular">{formatTime(draft.decidedAt ?? signal.createdAt)}</span>.
            Handoff updated.
          </p>
        )}
      </div>
    </div>
  );
}

function statusLabel(status: SafetySignal["status"]): string {
  if (status === "acknowledged") return "Acknowledged · sent";
  if (status === "deferred") return "Deferred";
  return "Dismissed";
}
