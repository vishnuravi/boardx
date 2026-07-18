"use client";

import { useState } from "react";
import { boardingDuration, formatTime } from "@/lib/evaluator";
import type { PatientState } from "@/lib/types";
import { EvidenceDrawer } from "./evidence-drawer";
import { ReviewCard } from "./review-card";

export function Workspace({ initial }: { initial: PatientState }) {
  const [state, setState] = useState(initial);
  const [drawerFor, setDrawerFor] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const panelPosted = state.events.some((e) => e.id === "evt-labs-repeat");

  async function call(input: string, init: RequestInit) {
    setBusy(true);
    try {
      const res = await fetch(input, init);
      if (res.ok) setState(await res.json());
    } finally {
      setBusy(false);
    }
  }

  const postRepeatPanel = () =>
    call("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "repeat-panel" }),
    });

  const decide = (
    draftId: string,
    decision: "approved" | "dismissed" | "deferred",
    message: string,
  ) =>
    call(`/api/drafts/${draftId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, message }),
    });

  const reset = () => call("/api/patient", { method: "DELETE" });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Header state={state} onReset={reset} busy={busy} />

      <div className="mt-6 space-y-5">
        <BoardingBrief state={state} panelPosted={panelPosted} />

        {state.signals.map((signal) => (
          <ReviewCard
            key={signal.id}
            signal={signal}
            draft={state.drafts.find((d) => d.signalId === signal.id)}
            onViewEvidence={() => setDrawerFor(signal.evidence)}
            onDecide={(decision, message) => {
              const draft = state.drafts.find((d) => d.signalId === signal.id);
              if (draft) decide(draft.id, decision, message);
            }}
            busy={busy}
          />
        ))}

        <Handoff state={state} />
        <TraceStrip state={state} />
        <Timeline state={state} onViewEvidence={(id) => setDrawerFor([id])} />

        {!panelPosted && (
          <div className="rounded-xl border border-dashed border-line p-5">
            <span className="label">Demo control</span>
            <p className="mt-1 text-sm text-muted">
              Simulates the repeat metabolic panel resulting at 05:32, six hours into boarding.
            </p>
            <button
              onClick={postRepeatPanel}
              disabled={busy}
              className="mt-3 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Post repeat metabolic panel
            </button>
          </div>
        )}
      </div>

      {drawerFor && (
        <EvidenceDrawer
          refs={drawerFor.map((id) => state.evidence[id]).filter(Boolean)}
          onClose={() => setDrawerFor(null)}
        />
      )}
    </div>
  );
}

function Header({
  state,
  onReset,
  busy,
}: {
  state: PatientState;
  onReset: () => void;
  busy: boolean;
}) {
  const { patient } = state;
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
      <div>
        <span className="label">BoardX</span>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {patient.name}
          <span className="ml-2 text-base font-normal text-muted">{patient.age}</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Admitted to {patient.admittedTo} · {patient.edBed}
        </p>
      </div>
      <div className="text-right">
        <span className="label">Boarding</span>
        <p className="tabular mt-1 text-2xl font-semibold">{boardingDuration(state)}</p>
        <button
          onClick={onReset}
          disabled={busy}
          className="mt-2 text-xs text-muted underline hover:text-foreground disabled:opacity-50"
        >
          Reset demo
        </button>
      </div>
    </header>
  );
}

function BoardingBrief({ state, panelPosted }: { state: PatientState; panelPosted: boolean }) {
  const { admissionIntent } = state;
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <span className="label">Live boarding brief</span>

      <dl className="mt-3 space-y-4 text-sm">
        <Field label="Why admitted">{admissionIntent.reasonForAdmission}</Field>
        <Field label="Current plan">
          <ul className="space-y-1">
            {admissionIntent.plan.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Field>
        <Field label="Since last review">
          {panelPosted ? (
            <span className="text-review">
              Repeat metabolic panel resulted — see review card above.
            </span>
          ) : (
            "No material changes"
          )}
        </Field>
        <Field label="Open items">
          {admissionIntent.pendingItems.length > 0
            ? admissionIntent.pendingItems.join("; ")
            : "None outstanding"}
        </Field>
      </dl>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-1 leading-relaxed">{children}</dd>
    </div>
  );
}

/**
 * Provenance for the pipeline itself: which helper produced what, how long it
 * took, and whether the Safety layer overrode it. A clinician asked to trust a
 * card should be able to see how it was made.
 */
function TraceStrip({ state }: { state: PatientState }) {
  if (state.trace.length === 0) return null;

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <span className="label">How this was produced</span>
      <ol className="mt-3 space-y-2 text-sm">
        {state.trace.map((step, i) => (
          <li key={`${step.label}-${i}`} className="flex flex-wrap items-baseline gap-x-3">
            <span
              className={`tabular text-xs ${
                step.source === "claude" ? "text-accent" : "text-muted"
              }`}
            >
              {step.source === "claude" ? "claude" : "code"}
            </span>
            <span className="font-medium">{step.label}</span>
            {step.ms > 0 && <span className="tabular text-xs text-muted">{step.ms}ms</span>}
            {step.reason && (
              <span className="w-full text-xs leading-relaxed text-muted">{step.reason}</span>
            )}
            {step.vetoed?.map((v) => (
              <span key={v} className="w-full text-xs leading-relaxed text-review">
                {v}
              </span>
            ))}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Handoff({ state }: { state: PatientState }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <span className="label">Transition-ready handoff</span>
      <p className="mt-2 text-sm leading-relaxed">{state.handoff}</p>
    </section>
  );
}

function Timeline({
  state,
  onViewEvidence,
}: {
  state: PatientState;
  onViewEvidence: (evidenceId: string) => void;
}) {
  const events = [...state.events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <span className="label">Event timeline</span>
      <ol className="mt-3 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="flex gap-4 text-sm">
            <span className="tabular w-12 shrink-0 pt-0.5 text-xs text-muted">
              {formatTime(event.timestamp)}
            </span>
            <div className="min-w-0">
              <p className="font-medium">{event.title}</p>
              <p className="mt-0.5 leading-relaxed text-muted">{event.content}</p>
              {event.evidence && (
                <button
                  onClick={() => onViewEvidence(event.evidence!.id)}
                  className="mt-1 text-xs text-accent underline"
                >
                  Source
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
