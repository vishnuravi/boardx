"use client";

import { useState } from "react";
import { boardingDuration, formatTime } from "@/lib/evaluator";
import type { PatientState } from "@/lib/types";
import { BoardXRail } from "./boardx-rail";
import { Icon } from "./icons";

/**
 * The Abridge clinician surface, with BoardX as a third rail tab.
 *
 * Layout mirrors planning/mockups/boardx-integration-mockups.html: BoardX has no
 * front door of its own, so everything outside the rail tab is Abridge's chrome
 * reproduced as-is. The only new elements are the tab, its badge, and what
 * renders inside it.
 */
export function Workspace({ initial }: { initial: PatientState }) {
  const [state, setState] = useState(initial);
  const [tab, setTab] = useState<"ai" | "boardx">("ai");

  const openSignals = state.signals.filter((s) => s.status === "needs-review").length;

  return (
    <div className="mx-auto max-w-[1320px] px-5 pt-11 pb-24">
      <p className="mb-3.5 text-xs font-semibold uppercase tracking-[0.09em] text-[#7d7a72]">
        notes.abridge.com — BoardX as a third rail tab
      </p>

      <div className="overflow-hidden rounded-[14px] border border-[#dcd9d0] bg-cream shadow-[0_2px_10px_rgba(30,28,22,0.10)]">
        <div className="h-2 bg-[#232323]" />
        <div className="flex min-h-[780px]">
          <WorklistRail />
          <NotePanel state={state} />
          <div className="mx-4 my-3.5 ml-4.5 flex min-w-0 flex-1 flex-col">
            <RailTabs tab={tab} setTab={setTab} badge={openSignals} />
            {tab === "ai" ? (
              <AbridgeAiRail />
            ) : (
              <BoardXRail state={state} setState={setState} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorklistRail() {
  return (
    <div className="relative w-[74px] flex-shrink-0">
      <div
        className="absolute left-1/2 top-[26px] -translate-x-1/2 text-[15px] font-semibold tracking-[0.14em] text-ink"
        style={{ writingMode: "vertical-rl" }}
      >
        WORKLIST
      </div>
      <div className="absolute bottom-[66px] left-1/2 -translate-x-1/2 text-ink">
        <Icon name="sliders" size={20} />
      </div>
      <div className="absolute bottom-[22px] left-1/2 -translate-x-1/2 text-[26px] font-semibold leading-none text-abridge-red">
        A
      </div>
    </div>
  );
}

function NotePanel({ state }: { state: PatientState }) {
  const { note } = state;
  return (
    <div className="my-3.5 flex min-w-0 flex-[1.18] flex-col rounded-xl border border-line bg-[#fdfcfa] px-11 pt-[34px]">
      <div className="text-[34px] font-medium tracking-[-0.02em] text-ink-3">Label your note</div>
      <hr className="my-[26px] mb-[30px] border-t border-line" />

      <div className="flex items-center">
        <div className="inline-flex rounded-full bg-cream-2 p-1">
          <button className="rounded-full border border-ink bg-white px-[22px] py-2.5 text-[15px] font-medium text-ink">
            Clinical Note
          </button>
          <button className="rounded-full border border-transparent px-[22px] py-2.5 text-[15px] text-ink-2">
            Patient Summary (PVS)
          </button>
        </div>
        <button className="ml-auto rounded-full border border-line-2 px-[22px] py-[9px] text-[15px] font-medium text-ink">
          Redraft
        </button>
      </div>

      <div className="mb-2.5 mt-[34px] text-sm font-medium">Note type</div>
      <div className="inline-flex items-center gap-2.5 border-b border-line pb-3 text-[23px] font-semibold">
        {note.noteType}
        <Icon name="chevron-down" size={18} className="text-ink-2" />
      </div>

      <NoteSection title="History of Present Illness">
        {note.historyOfPresentIllness.map((p) => (
          <p key={p} className="mb-3.5 text-base leading-[1.65]">
            {p}
          </p>
        ))}
      </NoteSection>

      <NoteSection title="Past Medical History">
        <ul className="dash-list">
          {note.pastMedicalHistory.map((i) => (
            <li key={i} className="text-base leading-[1.75]">
              {i}
            </li>
          ))}
        </ul>
      </NoteSection>

      <NoteSection title="Medications">
        <ul className="dash-list">
          {note.medications.map((m) => (
            <li key={m} className="text-base leading-[1.75]">
              {m}
            </li>
          ))}
        </ul>
      </NoteSection>

      <NoteSection title="Results" className="mb-[46px]">
        <p className="text-base leading-[1.65]">{note.results}</p>
      </NoteSection>

      <div className="-mx-2 mt-auto flex items-center gap-[18px] border-t border-line px-1 py-4">
        <div className="flex items-center gap-2.5 text-base font-medium">
          Rating
          <Icon name="star" size={18} className="text-ink-2" />
          <Icon name="chevron-down" size={18} className="text-ink-2" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-base">
          Pronouns <b className="font-semibold">She/Her</b>
          <Icon name="chevron-up" size={18} className="text-ink-2" />
        </div>
        <button className="rounded-full border border-line-2 px-[26px] py-3 text-base font-medium text-ink">
          Copy All
        </button>
        <button className="rounded-full bg-dark px-[26px] py-3 text-base font-medium text-white">
          Mark As Done
        </button>
      </div>
    </div>
  );
}

function NoteSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-10 ${className}`}>
      <div className="mb-4 flex items-center gap-2.5 text-[21px] font-medium">
        {title}
        <Icon name="copy" size={17} className="text-ink-2" />
      </div>
      {children}
    </div>
  );
}

function RailTabs({
  tab,
  setTab,
  badge,
}: {
  tab: "ai" | "boardx";
  setTab: (t: "ai" | "boardx") => void;
  badge: number;
}) {
  return (
    <div className="flex items-stretch border-b border-line-2">
      <RailTab active={tab === "ai"} onClick={() => setTab("ai")}>
        <span className="text-[22px] font-semibold leading-none text-blue">A</span> Abridge AI
      </RailTab>
      <div className="my-3 w-px bg-line-2" />
      <RailTab active={false} onClick={() => {}}>
        <Icon name="file-text" size={20} className="text-ink-2" /> Transcript
      </RailTab>
      <div className="my-3 w-px bg-line-2" />
      <RailTab active={tab === "boardx"} onClick={() => setTab("boardx")}>
        <Icon
          name="clipboard"
          size={20}
          className={tab === "boardx" ? "text-blue" : "text-ink-2"}
        />
        BoardX
        {badge > 0 && (
          <span className="rounded-full bg-sig-red px-2 py-0.5 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </RailTab>
    </div>
  );
}

function RailTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-[26px] pb-4 pt-3.5 text-[18px] ${
        active ? "font-medium text-blue" : "text-ink"
      }`}
    >
      {children}
      {active && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-blue" />}
    </button>
  );
}

/**
 * The existing Abridge AI panel, reproduced from the mockup. Static — it is
 * context for where BoardX sits, not part of what BoardX does.
 */
function AbridgeAiRail() {
  return (
    <>
      <div className="flex-1 px-1.5 pb-3 pt-[26px]">
        <div className="mb-[34px] flex items-center justify-end gap-3.5">
          <Icon name="bookmark" size={20} className="text-ink-2" />
          <div className="rounded-2xl bg-cream-2 px-[22px] py-4 text-[17px]">
            Is the patient on any blood thinners?
          </div>
        </div>
        <div className="mb-[30px] flex items-center justify-between rounded-[14px] border border-line bg-[#fdfcfa] px-[26px] py-[22px] text-[19px] font-medium">
          Thought
          <Icon name="chevron-down" size={18} className="text-ink-2" />
        </div>
        <p className="mb-[30px] text-[17px] leading-[1.62]">
          Aspirin 81 mg daily is documented in the home medication list, confirmed with the
          patient&rsquo;s daughter during the admission conversation. No anticoagulants are
          documented in the current note or transcript.
        </p>
        <div className="mb-10 flex justify-end gap-5 text-ink-2">
          <Icon name="thumb-up" size={19} />
          <Icon name="thumb-down" size={19} />
        </div>
        <div className="mb-[18px] flex items-center gap-2 text-[17px] font-medium">
          Follow up questions
          <Icon name="chevron-down" size={16} className="text-ink-2" />
        </div>
        {[
          "Should the home antihypertensives be adjusted for her renal function?",
          "Any concern for hyperkalemia with continuing the ACE inhibitor?",
        ].map((q) => (
          <button
            key={q}
            className="mb-3.5 block w-full rounded-full border border-line-2 bg-[#fdfcfa] px-6 py-[15px] text-left text-base text-ink"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-3 border-t border-line-2 pt-[18px]">
        <div className="flex flex-1 items-center justify-between rounded-[14px] border border-line-2 bg-[#fdfcfa] px-[18px] py-[15px] text-[17px] text-ink-3">
          Ask Abridge AI...
          <Icon name="send" size={20} />
        </div>
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-line-2 bg-[#fdfcfa] text-ink-2">
          <Icon name="bookmark" size={20} />
        </div>
      </div>
      <p className="px-[30px] pb-1.5 pt-3 text-center text-[12.5px] leading-[1.5] text-ink-2">
        Abridge AI is a supplemental clinical decision support and editing tool, which may contain
        errors. Please independently review and confirm all generated content.{" "}
        <span className="underline">Learn more.</span>
      </p>
    </>
  );
}

export { formatTime, boardingDuration };
