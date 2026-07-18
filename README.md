# boardx

**Care doesn't have to stop at the ED doors.**

boardx is a tool for patients who have been admitted to the hospital but are still physically in the Emergency Department, waiting for an inpatient bed — a state known as *boarding*.

## The problem

When a patient is admitted, they officially become an inpatient. But if no bed is available upstairs, they stay in the ED — sometimes for hours, sometimes for days. During that window they fall into a gap:

- **Ownership is ambiguous.** The ED team has handed off; the admitting team hasn't laid eyes on them yet. Orders get written by a team that isn't at the bedside.
- **Inpatient care doesn't start.** Home medications, mobility, nutrition, and diet orders often lag behind the admission decision.
- **Nobody tells the patient anything.** The most common question from a boarding patient is some version of *"how much longer?"* — and usually nobody at the bedside knows.
- **It is not rare.** ED boarding is one of the most-cited drivers of crowding, ambulance diversion, and preventable harm in acute care, and it's associated with worse outcomes the longer it lasts.

Boarding is fundamentally a capacity problem, and a hackathon project isn't going to conjure up beds. So boardx targets the part that *is* tractable: making the boarding interval visible, accountable, and less awful for the person lying on the gurney.

## What boardx does

**A live board of boarders.** One view of every admitted-but-not-placed patient: how long they've been boarding, who the accepting team is, what bed they're waiting on, and where that bed is in the turnover process.

**An explicit owner per patient.** Every boarding patient gets a named responsible clinician for the boarding interval, so the handoff gap has someone standing in it.

**Time-triggered care checks.** As boarding time crosses thresholds, boardx surfaces the things that quietly get missed — home meds reconciled, diet ordered, mobility and skin checks, repeat vitals, delirium risk for older patients.

**Patient-facing status.** A plain-language view the patient or their family can actually see: you've been admitted, here's the team taking care of you, here's what we're waiting on. Honest uncertainty beats silence.

**Boarding metrics.** Median and 90th-percentile boarding time, boarding-hours by service, and where the delays actually come from — so the problem can be argued about with numbers.

## Status

Hackathon project. Early and in progress — expect rough edges and expect the scope above to be aspirational in places.

## Getting started

```bash
git clone https://github.com/vishnuravi/boardx.git
cd boardx
```

Setup instructions will land here as the stack comes together.

## A note on data

boardx is a prototype and is **not** a cleared medical device or a system of record. It runs on synthetic or de-identified data only. Nothing here should be used for clinical decision-making, and no real PHI should be put into it.

## License

TBD.
