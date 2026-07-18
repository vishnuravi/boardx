import Link from "next/link";
import { news2, type News2Result } from "@/lib/acuity";
import { SideRail } from "@/components/side-rail";
import type { Boarder, NursingTask } from "@/lib/types";

/**
 * Operations trackboard — every boarded patient, prioritized for review.
 *
 * The audience is different from the workspace: charge nurses, bed managers,
 * and the admitting teams deciding who to see and place first. So the sort is
 * the product claim: NEWS2 acuity first, boarding time as the tiebreaker, with
 * the full per-parameter breakdown one hover away. The board recommends
 * review order; it never claims a patient can wait.
 *
 * Server component on purpose — the census is fixture data on a fixed demo
 * clock, and everything interactive here is CSS hover + native tooltips.
 */

type Row = { boarder: Boarder; acuity: News2Result; boardedMin: number };

const BAND_LABEL: Record<News2Result["band"], string> = {
  high: "High",
  medium: "Medium",
  "low-medium": "Low–med",
  low: "Low",
};

/** Review urgency implied by the band — spelled out, never color alone. */
const BAND_HINT: Record<News2Result["band"], string> = {
  high: "review first",
  medium: "review soon",
  "low-medium": "single red-flag parameter",
  low: "routine checks",
};

function minutesBoarded(b: Boarder, now: string): number {
  return Math.round((Date.parse(now) - Date.parse(b.admissionDecisionAt)) / 60_000);
}

function fmtDuration(min: number): string {
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles",
  });
}

/** Duration severity mirrors the boarding-mortality literature's landmarks. */
function durationBand(min: number): "ok" | "warn" | "serious" | "critical" {
  const h = min / 60;
  return h >= 12 ? "critical" : h >= 8 ? "serious" : h >= 4 ? "warn" : "ok";
}

function news2Tooltip(a: News2Result): string {
  const lines = a.components.map(
    (c) => `${c.parameter}: ${c.value} → ${c.points > 0 ? "+" : ""}${c.points}`,
  );
  return [`NEWS2 ${a.score} (${BAND_LABEL[a.band]})`, ...lines].join("\n");
}

function median(sorted: number[]): number {
  const mid = sorted.length / 2;
  return sorted.length % 2
    ? sorted[Math.floor(mid)]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export type BoardView = "care" | "nursing";

export function OpsBoard({
  census,
  now,
  view = "care",
}: {
  census: Boarder[];
  now: string;
  view?: BoardView;
}) {
  const rows: Row[] = census
    .map((boarder) => ({
      boarder,
      acuity: news2(boarder.vitals),
      boardedMin: minutesBoarded(boarder, now),
    }))
    .sort((a, b) => b.acuity.score - a.acuity.score || b.boardedMin - a.boardedMin);

  return (
    <div className="stage">
      <div className="stage-label">
        Desktop · BoardX operations trackboard — boarding census, prioritized for review
        (worklist / dashboard tabs on the left)
      </div>

      <div className="ops">
        <div className="topstrip" />
        <div className="ops-shell">
          <SideRail active="dashboard" />
          <div className="ops-body">
          <div className="ops-head">
            <div>
              <div className="ops-title">Boarding trackboard</div>
              <div className="ops-sub">
                {view === "care"
                  ? "Ordered by NEWS2 acuity, then time boarded"
                  : "Nursing queue — ordered by task urgency, then patient acuity"}
                {" · synthetic demo census · "}
                {fmtClock(now)}
              </div>
            </div>
            <div className="ops-head-right">
              {/* Stands in for role-based login: the view a nurse would land on
                  versus the care team's census. */}
              <nav className="ops-views">
                <Link href="/board" className={view === "care" ? "on" : ""}>
                  Care team
                </Link>
                <Link href="/board?view=nursing" className={view === "nursing" ? "on" : ""}>
                  Nursing
                </Link>
              </nav>
              <span className="ops-tag">
                <i className="ti ti-flask" /> Simulated demo data
              </span>
            </div>
          </div>

          {view === "care" ? <CareView rows={rows} /> : <NursingView rows={rows} now={now} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CareView({ rows }: { rows: Row[] }) {
  const durations = rows.map((r) => r.boardedMin).sort((a, b) => a - b);
  const longest = rows.reduce((max, r) => (r.boardedMin > max.boardedMin ? r : max), rows[0]);
  const highAcuity = rows.filter((r) => r.acuity.band === "high").length;
  const overFour = rows.filter((r) => r.boardedMin >= 240).length;

  return (
    <>


          <div className="ops-tiles">
            <div className="ops-tile">
              <div className="ops-tile-label">Boarded now</div>
              <div className="ops-tile-value">{rows.length}</div>
              <div className="ops-tile-note">admitted, no inpatient bed</div>
            </div>
            <div className="ops-tile">
              <div className="ops-tile-label">High acuity</div>
              <div className="ops-tile-value">{highAcuity}</div>
              <div className="ops-tile-note">NEWS2 ≥ 7 — review first</div>
            </div>
            <div className="ops-tile">
              <div className="ops-tile-label">Boarding ≥ 4 h</div>
              <div className="ops-tile-value">
                {overFour}
                <span className="ops-tile-of">/{rows.length}</span>
              </div>
              <div className="ops-tile-note">median {fmtDuration(median(durations))}</div>
            </div>
            <div className="ops-tile">
              <div className="ops-tile-label">Longest wait</div>
              <div className="ops-tile-value">{fmtDuration(longest.boardedMin)}</div>
              <div className="ops-tile-note">{longest.boarder.workingDiagnosis}</div>
            </div>
          </div>

          <table className="ops-table">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Patient</th>
                <th>Acuity (NEWS2)</th>
                <th>Working diagnosis</th>
                <th>Boarded</th>
                <th>Service</th>
                <th>Bed status</th>
                <th>Open items</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <BoarderRow key={row.boarder.id} row={row} rank={i + 1} />
              ))}
            </tbody>
          </table>

          <div className="ops-foot">
            <p>
              <b>Reading this board.</b> Priority order is NEWS2 from the latest vitals
              (hover a score for the per-parameter breakdown), tie-broken by time boarded.
              NEWS2 is computed on SpO₂ scale 1 and does not capture everything — flagged
              review items (<i className="ti ti-alert-triangle" />) ride alongside the
              score, not inside it. This is a review-ordering aid for the care team, not
              a triage decision, and no patient here is a real person.
            </p>
          </div>
    </>
  );
}

/**
 * The nursing side of the board: not who is sickest, but what to do next.
 * Every task comes from the active orders or admission plan; the queue only
 * orders them — STAT and overdue first, then time-due, then routine — with
 * patient acuity as the within-tier tiebreaker.
 */
function NursingView({ rows, now }: { rows: Row[]; now: string }) {
  const TIER: Record<NursingTask["urgency"], number> = { stat: 0, due: 1, routine: 2 };

  const tasks = rows
    .flatMap((row) =>
      row.boarder.nursingTasks.map((task) => ({
        task,
        row,
        overdueMin: Math.max(0, Math.round((Date.parse(now) - Date.parse(task.dueAt)) / 60_000)),
      })),
    )
    .sort(
      (a, b) =>
        TIER[a.task.urgency] - TIER[b.task.urgency] ||
        b.row.acuity.score - a.row.acuity.score ||
        Date.parse(a.task.dueAt) - Date.parse(b.task.dueAt),
    );

  const doNow = tasks.filter((t) => t.task.urgency === "stat" || t.overdueMin > 0).length;
  const hourEnd = Date.parse(now) + 60 * 60_000;
  const dueThisHour = tasks.filter(
    (t) => t.task.urgency !== "stat" && t.overdueMin === 0 && Date.parse(t.task.dueAt) <= hourEnd,
  ).length;
  const tightChecks = rows.filter((r) =>
    r.boarder.nursingTasks.some((t) => t.kind === "monitoring" && t.urgency === "stat"),
  ).length;

  return (
    <>
      <div className="ops-tiles">
        <div className="ops-tile">
          <div className="ops-tile-label">Do now</div>
          <div className="ops-tile-value">{doNow}</div>
          <div className="ops-tile-note">STAT or overdue tasks</div>
        </div>
        <div className="ops-tile">
          <div className="ops-tile-label">Due this hour</div>
          <div className="ops-tile-value">{dueThisHour}</div>
          <div className="ops-tile-note">by {fmtClock(new Date(hourEnd).toISOString())}</div>
        </div>
        <div className="ops-tile">
          <div className="ops-tile-label">Tight monitoring</div>
          <div className="ops-tile-value">{tightChecks}</div>
          <div className="ops-tile-note">patients on STAT-cadence checks</div>
        </div>
        <div className="ops-tile">
          <div className="ops-tile-label">Boarded now</div>
          <div className="ops-tile-value">{rows.length}</div>
          <div className="ops-tile-note">admitted, no inpatient bed</div>
        </div>
      </div>

      <table className="ops-table">
        <thead>
          <tr>
            <th className="num">#</th>
            <th>Priority</th>
            <th>Task</th>
            <th>Patient</th>
            <th>Acuity (NEWS2)</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <TaskRow key={t.task.id} task={t.task} row={t.row} overdueMin={t.overdueMin} rank={i + 1} />
          ))}
        </tbody>
      </table>

      <div className="ops-foot">
        <p>
          <b>Reading this queue.</b> Every task comes from an active order or the
          documented admission plan — BoardX orders the work, it never creates it.
          STAT and overdue tasks first, then time-due, then routine, with the
          patient&rsquo;s NEWS2 acuity breaking ties. Verify against the chart
          before acting; no patient here is a real person.
        </p>
      </div>
    </>
  );
}

const URGENCY_LABEL: Record<NursingTask["urgency"], string> = {
  stat: "STAT",
  due: "Due soon",
  routine: "Routine",
};

const KIND_ICON: Record<NursingTask["kind"], string> = {
  "lab-draw": "ti-test-pipe",
  imaging: "ti-radioactive",
  medication: "ti-pill",
  monitoring: "ti-activity",
  assessment: "ti-stethoscope",
  safety: "ti-shield-check",
  prep: "ti-checklist",
};

function TaskRow({
  task,
  row,
  overdueMin,
  rank,
}: {
  task: NursingTask;
  row: Row;
  overdueMin: number;
  rank: number;
}) {
  const b = row.boarder;
  return (
    <tr>
      <td className="num">{rank}</td>
      <td>
        <span className={`ops-urgency u-${task.urgency}`}>
          {URGENCY_LABEL[task.urgency]}
        </span>
        {overdueMin > 0 && <div className="ops-overdue">overdue {overdueMin}m</div>}
      </td>
      <td>
        <div className="ops-name">
          <i className={`ti ${KIND_ICON[task.kind]} ops-kind`} /> {task.label}
        </div>
        {task.reason && <div className="ops-dim">{task.reason}</div>}
      </td>
      <td>
        <div>{b.name}</div>
        <div className="ops-dim">
          {b.age} {b.sex} · {b.edBed}
          {b.isolation ? " · isolation" : ""}
        </div>
      </td>
      <td>
        <span className={`ops-acuity band-${row.acuity.band}`} title={news2Tooltip(row.acuity)}>
          <span className="ops-acuity-dot" />
          {row.acuity.score} · {BAND_LABEL[row.acuity.band]}
        </span>
      </td>
      <td>
        <div className="ops-wait">{fmtClock(task.dueAt)}</div>
      </td>
    </tr>
  );
}

function BoarderRow({ row, rank }: { row: Row; rank: number }) {
  const { boarder: b, acuity, boardedMin } = row;
  const dBand = durationBand(boardedMin);
  // Meter width: hours against a 16-hour scale, so the census's own worst case
  // nearly fills the track and everyone else reads proportionally.
  const pct = Math.min(100, (boardedMin / (16 * 60)) * 100);

  return (
    <tr>
      <td className="num">{rank}</td>
      <td>
        <div className="ops-name">{b.name}</div>
        <div className="ops-dim">
          {b.age} {b.sex} · {b.edBed}
          {b.isolation ? " · isolation" : ""}
        </div>
      </td>
      <td>
        <span className={`ops-acuity band-${acuity.band}`} title={news2Tooltip(acuity)}>
          <span className="ops-acuity-dot" />
          {acuity.score} · {BAND_LABEL[acuity.band]}
        </span>
        <div className="ops-dim">{BAND_HINT[acuity.band]}</div>
      </td>
      <td>
        <div>{b.workingDiagnosis}</div>
        {b.reviewFlag && (
          <div className="ops-flag">
            <i className="ti ti-alert-triangle" /> {b.reviewFlag}
          </div>
        )}
      </td>
      <td>
        <div className={`ops-wait ${boardedMin >= 240 ? "long" : ""}`}>
          {fmtDuration(boardedMin)}
        </div>
        <div className={`ops-meter dur-${dBand}`}>
          <span style={{ width: `${pct}%` }} />
        </div>
      </td>
      <td>
        <div>{b.service}</div>
        <div className="ops-dim">{b.attending}</div>
      </td>
      <td>{b.bedStatus}</td>
      <td>
        <span className="ops-open" title={b.openItems.join("\n")}>
          {b.openItems.length}
        </span>
        <div className="ops-dim">{b.openItems[0]}</div>
      </td>
    </tr>
  );
}
