"use client";

import { useState } from "react";
import type { PatientState } from "@/lib/types";
import { BoardXRail, BoardXMobile } from "./boardx-rail";
import { boardingDuration } from "@/lib/evaluator";

/**
 * The Abridge clinician surfaces with BoardX added, replicating
 * planning/mockups/boardx-integration-mockups.html.
 *
 * Markup and class names are the mockup's. Everything outside the BoardX tab is
 * Abridge's chrome reproduced as-is — BoardX has no front door, so the demo has
 * to show it living inside a surface clinicians already open.
 */
export function Workspace({ initial }: { initial: PatientState }) {
  const [state, setState] = useState(initial);
  const [rail, setRail] = useState<"ai" | "bx">("ai");
  const [mobileTab, setMobileTab] = useState<"note" | "bx">("note");

  const badge = state.signals.filter((s) => s.status === "needs-review").length;

  return (
    <div className="stage">
      <div className="stage-label">
        Desktop · notes.abridge.com — BoardX as a third rail tab (tabs are clickable)
      </div>

      <div className="desktop">
        <div className="topstrip" />
        <div className="desk-body">
          <div className="worklist-rail">
            <div className="vert">WORKLIST</div>
            <div className="sliders">
              <i className="ti ti-adjustments-horizontal" />
            </div>
            <div className="logo">A</div>
          </div>

          <NotePanel state={state} />

          <div className="rail-panel">
            <div className="rail-tabs">
              <button
                className={`rtab ${rail === "ai" ? "on" : ""}`}
                onClick={() => setRail("ai")}
              >
                <span className="amark">A</span> Abridge AI
              </button>
              <div className="rtab-div" />
              <button className="rtab">
                <i className="ti ti-file-text" /> Transcript
              </button>
              <div className="rtab-div" />
              <button
                className={`rtab ${rail === "bx" ? "on" : ""}`}
                onClick={() => setRail("bx")}
              >
                <i className="ti ti-clipboard-heart" /> BoardX
                {badge > 0 && <span className="bxbadge">{badge}</span>}
              </button>
            </div>

            {rail === "ai" ? (
              <AbridgeAiRail />
            ) : (
              <BoardXRail state={state} setState={setState} />
            )}

            {rail === "ai" ? (
              <>
                <div className="ask-row">
                  <div className="ask">
                    Ask Abridge AI... <i className="ti ti-send" />
                  </div>
                  <div className="bm-btn">
                    <i className="ti ti-bookmark" />
                  </div>
                </div>
                <div className="disclaimer">
                  Abridge AI is a supplemental clinical decision support and editing tool, which
                  may contain errors. Please independently review and confirm all generated
                  content. <a href="#">Learn more.</a>
                </div>
              </>
            ) : (
              <div className="disclaimer">
                BoardX surfaces evidence-linked changes for clinician review. Nothing is sent
                without your approval. <a href="#">Learn more.</a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stage-label">iOS · Abridge mobile — BoardX in the bottom tab bar</div>

      <div className="phones">
        <Phone caption="Clinical Note tab — unchanged, BoardX badge visible">
          <PhoneHead
            title="11:45 PM"
            subtitle="Unlabeled Encounter"
            subtitleClass="enc"
          />
          <div className="m-scroll">
            <MobileCard title="History of Present Illness">
              {state.note.historyOfPresentIllness.slice(0, 2).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </MobileCard>
            <MobileCard title="Past Medical History">
              <ul>
                {state.note.pastMedicalHistory.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </MobileCard>
            <MobileCard title="Medications">
              <ul>
                {state.note.medications.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </MobileCard>
          </div>
          <MobileTabBar active="note" badge={badge} onSelect={setMobileTab} />
        </Phone>

        <Phone caption="BoardX tab — the action layer">
          <PhoneHead
            title={`${surname(state)} · ${state.patient.age}F`}
            subtitle={`ED 7 · Boarding ${boardingDuration(state)} · Medicine`}
            subtitleClass="enc"
            small
          />
          <BoardXMobile state={state} setState={setState} />
          <MobileTabBar active="bx" badge={badge} onSelect={setMobileTab} />
        </Phone>
      </div>

      {/* mobileTab is wired so the tab bar is live rather than decorative. */}
      <span className="hidden">{mobileTab}</span>
    </div>
  );
}

function surname(state: PatientState) {
  const [first, last] = state.patient.name.split(" ");
  return `${last}, ${first}`;
}

function NotePanel({ state }: { state: PatientState }) {
  const { note } = state;
  return (
    <div className="note-panel">
      <div className="note-title">Label your note</div>
      <hr className="note-hr" />
      <div className="toggle-row">
        <div className="toggle-group">
          <button className="tg on">Clinical Note</button>
          <button className="tg">Patient Summary (PVS)</button>
        </div>
        <button className="redraft">Redraft</button>
      </div>

      <div className="notetype-label">Note type</div>
      <div className="notetype">
        {note.noteType} <i className="ti ti-chevron-down" />
      </div>

      <div className="sec">
        <div className="sec-h">
          History of Present Illness <i className="ti ti-copy" />
        </div>
        {note.historyOfPresentIllness.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="sec">
        <div className="sec-h">
          Past Medical History <i className="ti ti-copy" />
        </div>
        <ul>
          {note.pastMedicalHistory.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>

      <div className="sec">
        <div className="sec-h">
          Medications <i className="ti ti-copy" />
        </div>
        <ul>
          {note.medications.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>

      <div className="sec" style={{ marginBottom: 46 }}>
        <div className="sec-h">
          Results <i className="ti ti-copy" />
        </div>
        <p>{note.results}</p>
      </div>

      <div className="note-footer">
        <div className="rating">
          Rating <i className="ti ti-star" /> <i className="ti ti-chevron-down" />
        </div>
        <div className="spacer" />
        <div className="pronouns">
          Pronouns <b>She/Her</b> <i className="ti ti-chevron-up" />
        </div>
        <button className="pill-outline">Copy All</button>
        <button className="pill-dark">Mark As Done</button>
      </div>
    </div>
  );
}

/** The existing Abridge AI panel — context for where BoardX sits. */
function AbridgeAiRail() {
  return (
    <div className="rail-scroll">
      <div className="user-q">
        <i className="ti ti-bookmark" />
        <div className="bubble">Is the patient on any blood thinners?</div>
      </div>
      <div className="thought">
        Thought <i className="ti ti-chevron-down" />
      </div>
      <p className="rail-answer">
        Aspirin 81 mg daily is documented in the home medication list, confirmed with the
        patient&rsquo;s daughter during the admission conversation. No anticoagulants are
        documented in the current note or transcript.
      </p>
      <div className="thumbs">
        <i className="ti ti-thumb-up" />
        <i className="ti ti-thumb-down" />
      </div>
      <div className="fuq-label">
        Follow up questions <i className="ti ti-chevron-down" />
      </div>
      <button className="fuq">
        Should the home antihypertensives be adjusted for her renal function?
      </button>
      <button className="fuq">
        Any concern for hyperkalemia with continuing the ACE inhibitor?
      </button>
    </div>
  );
}

function Phone({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="phone-wrap">
      <div className="phone-cap">{caption}</div>
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
          {children}
          <div className="homebar" />
        </div>
      </div>
    </div>
  );
}

function PhoneHead({
  title,
  subtitle,
  subtitleClass,
  small = false,
}: {
  title: string;
  subtitle: string;
  subtitleClass: string;
  small?: boolean;
}) {
  return (
    <div className="app-head">
      <div className="row1">
        <span className="back">
          <i className="ti ti-arrow-left" />
        </span>
        <div>
          <div className="time">{title}</div>
          <div className={subtitleClass} style={small ? { fontSize: 15 } : undefined}>
            {subtitle}
          </div>
        </div>
        <span className="kebab">
          <i className="ti ti-dots-vertical" />
        </span>
      </div>
      <hr />
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

function MobileTabBar({
  active,
  badge,
  onSelect,
}: {
  active: "note" | "bx";
  badge: number;
  onSelect: (t: "note" | "bx") => void;
}) {
  return (
    <div className="tabbar">
      <button className={`tb ${active === "note" ? "on" : ""}`} onClick={() => onSelect("note")}>
        <i className="ti ti-file-description" />
        <span>Clinical Note</span>
      </button>
      <button className="tb">
        <i className="ti ti-report-medical" />
        <span>PVS</span>
      </button>
      <button className={`tb ${active === "bx" ? "on" : ""}`} onClick={() => onSelect("bx")}>
        <i className="ti ti-clipboard-heart" />
        <span>BoardX</span>
        {badge > 0 && <span className="dot">{badge}</span>}
      </button>
    </div>
  );
}
