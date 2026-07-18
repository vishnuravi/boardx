"use client";

import { useState } from "react";
import Link from "next/link";
import { boardingDuration } from "@/lib/evaluator";
import type { PatientState } from "@/lib/types";
import { BoardXRail, useBoardX } from "./boardx-rail";
import { SideRail } from "./side-rail";

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
  // Opens on BoardX. The mockup defaults to Abridge AI to show BoardX as an
  // addition to an existing surface; the running app opens on the tab being
  // demoed, and Abridge AI stays one click away as the "before" state.
  const [rail, setRail] = useState<"ai" | "bx">("bx");

  // One action surface for both views, so their busy states cannot diverge.
  const actions = useBoardX(state, setState);

  const badge = state.signals.filter((s) => s.status === "needs-review").length;

  return (
    <div className="stage">
      {/*
        Patient identity lives in the chrome, not in the panel. It is true for
        the whole surface, so repeating it inside the BoardX rail was both
        duplication and density the rail could not afford.
      */}
      <div className="patient-bar">
        <span className="who">
          {surname(state)} <span className="age">{state.patient.age}F</span>
        </span>
        <span className="pill amber">Boarding {boardingDuration(state)}</span>
        <span className="pill">{state.patient.edBed}</span>
        <span className="pill">
          <i className="ti ti-stethoscope" /> {state.patient.service} · {state.patient.attending}
        </span>
        <span className="pill viewer">
          <i className="ti ti-user" /> You: ED attending
        </span>
        <Link href="/mobile" className="stage-link">
          iOS view →
        </Link>
      </div>

      <div className="desktop">
        <div className="topstrip" />
        <div className="desk-body">
          <SideRail active="worklist" />

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
              <BoardXRail state={state} actions={actions} />
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
      <div className="note-scroll">
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
