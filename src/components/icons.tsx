/**
 * Inline icon set, drawn from Tabler Icons (MIT) — the same family the mockup
 * loads from a CDN.
 *
 * Inlined rather than fetched: the mockup's three external requests (icon font
 * plus two Google Fonts) render bare behind a strict CSP or on conference wifi.
 * A demo shouldn't depend on the network to draw its own chrome.
 */

type IconProps = { name: IconName; size?: number; className?: string };

const PATHS = {
  "alert-triangle":
    "M12 9v4 M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636-2.87l-8.106-13.536a1.914 1.914 0 0 0-3.274 0z M12 16h.01",
  "circle-check": "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18 M9 12l2 2l4-4",
  "chevron-down": "M6 9l6 6l6-6",
  "chevron-up": "M6 15l6-6l6 6",
  copy: "M9 9m0 2.667a2.667 2.667 0 0 1 2.667-2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1-2.667 2.667h-8.666a2.667 2.667 0 0 1-2.667-2.667z M4.012 16.737a2 2 0 0 1-1.012-1.737v-10c0-1.1.9-2 2-2h10c.75 0 1.158.385 1.5 1",
  "file-text":
    "M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z M9 9l1 0 M9 13l6 0 M9 17l6 0",
  clipboard:
    "M9 5h-2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2 M9 3m0 2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z M11 14l1 1l3-3",
  microphone:
    "M9 2m0 3a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h0a3 3 0 0 1-3-3z M5 10a7 7 0 0 0 14 0 M8 21l8 0 M12 17l0 4",
  message:
    "M8 9h8 M8 13h6 M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3h-2a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z",
  lock: "M5 13a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2z M11 16a1 1 0 1 0 2 0a1 1 0 0 0-2 0 M8 11v-4a4 4 0 1 1 8 0v4",
  sliders:
    "M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M4 6l8 0 M16 6l4 0 M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M4 12l2 0 M10 12l10 0 M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M4 18l11 0 M19 18l1 0",
  star: "M12 17.75l-6.172 3.245l1.179-6.873l-5-4.867l6.9-1l3.086-6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z",
  bookmark: "M18 7v14l-6-4l-6 4v-14a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4z",
  send: "M10 14l11-11 M21 3l-6.5 18a.55 .55 0 0 1-1 0l-3.5-7l-7-3.5a.55 .55 0 0 1 0-1l18-6.5",
  "thumb-up":
    "M7 11v8a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3a4 4 0 0 0 4-4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1-2 2h-7a3 3 0 0 1-3-3",
  "thumb-down":
    "M7 13v-8a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3a4 4 0 0 1 4 4v1a2 2 0 0 0 4 0v-5h3a2 2 0 0 0 2-2l-1-5a2 3 0 0 0-2-2h-7a3 3 0 0 0-3 3",
  clock: "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18 M12 7v5l3 3",
  "arrow-left": "M5 12l14 0 M5 12l6 6 M5 12l6-6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].split(" M").map((seg, i) => (
        <path key={i} d={i === 0 ? seg : `M${seg}`} />
      ))}
    </svg>
  );
}
