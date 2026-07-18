import { news2, type News2Result } from "@/lib/acuity";
import { SideRail } from "@/components/side-rail";
import type { Boarder } from "@/lib/types";

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

export function OpsBoard({ census, now }: { census: Boarder[]; now: string }) {
  const rows: Row[] = census
    .map((boarder) => ({
      boarder,
      acuity: news2(boarder.vitals),
      boardedMin: minutesBoarded(boarder, now),
    }))
    .sort((a, b) => b.acuity.score - a.acuity.score || b.boardedMin - a.boardedMin);

  const durations = rows.map((r) => r.boardedMin).sort((a, b) => a - b);
  const longest = rows.reduce((max, r) => (r.boardedMin > max.boardedMin ? r : max), rows[0]);
  const highAcuity = rows.filter((r) => r.acuity.band === "high").length;
  const overFour = rows.filter((r) => r.boardedMin >= 240).length;

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
                Ordered by NEWS2 acuity, then time boarded · synthetic demo census ·{" "}
                {fmtClock(now)}
              </div>
            </div>
            <span className="ops-tag">
              <i className="ti ti-flask" /> Simulated demo data
            </span>
          </div>

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
          </div>
        </div>
      </div>
    </div>
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
