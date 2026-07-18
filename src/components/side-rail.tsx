import Link from "next/link";

/**
 * The left rail shared by the note workspace and the ops trackboard: a
 * vertical two-tab set (WORKLIST above DASHBOARD) plus the mockup's slider
 * icon and Abridge logo. The active tab wears full ink; the other is muted
 * and links across.
 */
export function SideRail({ active }: { active: "worklist" | "dashboard" }) {
  return (
    <div className="worklist-rail">
      <div className="vert-tabs">
        <Link href="/" className={`vert vert-link ${active === "worklist" ? "on" : ""}`}>
          WORKLIST
        </Link>
        <Link href="/board" className={`vert vert-link ${active === "dashboard" ? "on" : ""}`}>
          DASHBOARD
        </Link>
      </div>
      <div className="sliders">
        <i className="ti ti-adjustments-horizontal" />
      </div>
      <div className="logo">A</div>
    </div>
  );
}
