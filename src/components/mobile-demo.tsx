"use client";

import { useState } from "react";
import Link from "next/link";
import { boardingDuration } from "@/lib/evaluator";
import type { PatientState } from "@/lib/types";
import { BoardXRail, useBoardX } from "./boardx-rail";

/**
 * The iOS surface — Abridge mobile with BoardX in the bottom tab bar.
 *
 * One phone, not two frames of one. The tab bar switches the view the way it
 * would on a device, so the badge, the note, and the action layer are the same
 * app rather than two pictures of it.
 *
 * The BoardX tab renders the *same* component as the desktop rail. It used to
 * have a parallel implementation, which meant every change to a card had to be
 * made twice — and the two had already drifted, the phone keeping its own
 * inline-styled rows long after the desktop moved on.
 */
export function MobileDemo({ initial }: { initial: PatientState }) {
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState<"note" | "pvs" | "bx">("bx");
  const actions = useBoardX(state, setState);

  const badge = state.signals.filter((s) => s.status === "needs-review").length;
  const [first, last] = state.patient.name.split(" ");

  return (
    <div className="stage">
      <div className="patient-bar">
        <span className="who">
          {last}, {first} <span className="age">{state.patient.age}F</span>
        </span>
        <span className="pill amber">Boarding {boardingDuration(state)}</span>
        <span className="pill">{state.patient.edBed}</span>
        <span className="pill">
          <i className="ti ti-stethoscope" /> {state.patient.service} · {state.patient.attending}
        </span>
        <span className="pill viewer">
          <i className="ti ti-user" /> You: ED attending
        </span>
        <Link href="/board" className="stage-link">
          ← Trackboard
        </Link>
        <Link href="/" className="stage-link alt">
          Desktop view →
        </Link>
      </div>

      <div className="phones">
        <div className="phone-wrap">
          <div className="phone-cap">
            {tab === "bx"
              ? "BoardX tab — the action layer"
              : tab === "pvs"
                ? "Patient summary"
                : "Clinical Note tab"}
          </div>
          <div className="phone">
            <div className="screen">
              <div className="statusbar">
                12:47 <i className="ti ti-bell-off" style={{ fontSize: 13, marginLeft: 4 }} />
                <div className="island" />
                <div className="right">
                  <i className="ti ti-antenna-bars-5" />
                  <i className="ti ti-wifi" />
                  <span className="batt">78</span>
                </div>
              </div>

              <div className="app-head">
                <div className="row1">
                  <span className="back">
                    <i className="ti ti-arrow-left" />
                  </span>
                  <div>
                    <div className="time">
                      {last}, {first} · {state.patient.age}F
                    </div>
                    <div className="enc" style={{ fontSize: 15 }}>
                      {state.patient.edBed} · Boarding {boardingDuration(state)}
                    </div>
                  </div>
                  <span className="kebab">
                    <i className="ti ti-dots-vertical" />
                  </span>
                </div>
                <hr />
              </div>

              {tab === "note" && <NoteTab state={state} />}

              {tab === "pvs" && (
                <div className="m-scroll">
                  <div className="m-card">
                    <p className="m-empty">
                      The patient summary is unchanged by BoardX and is not part of this
                      prototype.
                    </p>
                  </div>
                </div>
              )}

              {tab === "bx" && (
                <BoardXRail state={state} actions={actions} className="m-scroll bx-phone" />
              )}

              <div className="tabbar">
                <button
                  className={`tb ${tab === "note" ? "on" : ""}`}
                  onClick={() => setTab("note")}
                >
                  <i className="ti ti-file-description" />
                  <span>Clinical Note</span>
                </button>
                <button
                  className={`tb ${tab === "pvs" ? "on" : ""}`}
                  onClick={() => setTab("pvs")}
                >
                  <i className="ti ti-report-medical" />
                  <span>PVS</span>
                </button>
                <button className={`tb ${tab === "bx" ? "on" : ""}`} onClick={() => setTab("bx")}>
                  <i className="ti ti-clipboard-heart" />
                  <span>BoardX</span>
                  {badge > 0 && <span className="dot">{badge}</span>}
                </button>
              </div>

              <div className="homebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The same sections the desktop note panel carries, in the phone's card shape. */
function NoteTab({ state }: { state: PatientState }) {
  const { note } = state;
  return (
    <div className="m-scroll">
      <MobileCard title="History of Present Illness">
        {note.historyOfPresentIllness.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </MobileCard>
      <MobileCard title="Past Medical History">
        <ul>
          {note.pastMedicalHistory.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </MobileCard>
      <MobileCard title="Medications">
        <ul>
          {note.medications.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </MobileCard>
      <MobileCard title="Allergies">
        <ul>
          {note.allergies.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </MobileCard>
      <MobileCard title="Results">
        <p>{note.results}</p>
      </MobileCard>
    </div>
  );
}

function MobileCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="m-card">
      <div className="head">
        <span className="t">{title}</span>
        <span className="edit">
          <i className="ti ti-pencil" />
        </span>
      </div>
      <hr />
      {children}
    </div>
  );
}
