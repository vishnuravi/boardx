# Integration mockups

BoardX has no front door. These mockups show how it renders inside surfaces clinicians already use, rather than as a separate destination.

Open [`boardx-integration-mockups.html`](./boardx-integration-mockups.html) in any browser (no build step, no dependencies beyond a CDN icon font).

## What they show

Both mockups are pixel-faithful replicas of the current Abridge clinician surfaces, with BoardX added as one new tab.

**Desktop** — the notes.abridge.com clinician view (worklist rail, note editor, Abridge AI panel) reproduced as-is, with a third rail tab: `BoardX (1)`. The tabs are clickable — switch between the existing Abridge AI Q&A and the BoardX action layer live during a demo. The review card reuses Abridge's card grammar; the only new chrome is the tab and its badge. A suppressed-signal card sits under the fired signal, making the precision story visible in the same glance (the gate evaluated the unchanged potassium and declined to fire, with a trace explaining why).

**iOS** — the Abridge mobile encounter view reproduced as-is, with `BoardX` added to the bottom tab bar. Two frames: the unchanged Clinical Note tab with the badge visible, and the BoardX tab active showing the action layer (signal, evidence, editable draft, approve/defer/dismiss, suppressed card).

## Three-layer surfacing model

| Layer | Surface | Attention state |
| --- | --- | --- |
| Ambient | Track board badge column (story current / needs review / acknowledged) | Glance |
| Review | Epic sidebar via CDS Hooks, or Abridge rail tab | Chart open |
| Action | Secure Chat draft, acknowledgment writes back to badge state | One decision |

Interruption (the iOS path) is reserved for signals where waiting for the next natural chart-open would itself be the harm.
