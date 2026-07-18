"use client";

import { useState } from "react";
import Link from "next/link";
import { boardingDuration } from "@/lib/evaluator";
import type { PatientState } from "@/lib/types";
import { BoardXMobile, useBoardX } from "./boardx-rail";

/**
 * The iOS surface — Abridge mobile with BoardX in the bottom tab bar.
 *
 * Split from the desktop route so each can be demoed on its own. Both drive the
 * same server-side patient state, so posting the panel or approving a draft on
 * one is reflected on the other after a reload.
 *
 * The two frames are one phone in two tab states, matching the mockup: the
 * unchanged Clinical Note tab with the badge visible, and the BoardX tab
 * showing the action layer. The tab bar switches between them.
 */
export function MobileDemo({ initial }: { initial: PatientState }) {
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState<"note" | "bx">("bx");
  const actions = useBoardX(state, setState);

  const badge = state.signals.filter((s) => s.status === "needs-review").length;

  return (
    <div className="stage">
      <div className="stage-label">
        iOS · Abridge mobile — BoardX in the bottom tab bar
        <Link href="/" className="stage-link">
          Desktop view →
        </Link>
      </div>

      <div className="phones">
        <Phone caption="Clinical Note tab — unchanged, BoardX badge visible">
          <PhoneHead title="11:45 PM" subtitle="Unlabeled Encounter" />
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
          <MobileTabBar active="note" badge={badge} onSelect={setTab} />
        </Phone>

        <Phone caption="BoardX tab — the action layer">
          <PhoneHead
            title={`${surname(state)} · ${state.patient.age}F`}
            subtitle={`ED 7 · Boarding ${boardingDuration(state)} · Medicine`}
            small
          />
          <BoardXMobile state={state} actions={actions} />
          <MobileTabBar active="bx" badge={badge} onSelect={setTab} />
        </Phone>
      </div>

      {/* Kept live rather than decorative; the frames above show both states. */}
      <span className="hidden">{tab}</span>
    </div>
  );
}

function surname(state: PatientState) {
  const [first, last] = state.patient.name.split(" ");
  return `${last}, ${first}`;
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
  small = false,
}: {
  title: string;
  subtitle: string;
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
          <div className="enc" style={small ? { fontSize: 15 } : undefined}>
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
