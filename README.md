<p align="center">
  <img src="public/boardx-wordmark.svg" alt="BOARDx logo" width="560">
</p>

# BoardX

> **No patient should become clinically invisible because they are waiting for a bed.**

BoardX is a clinician-supervised continuity agent for admitted patients who are still physically in the emergency department — keeping their story current, bringing forward meaningful changes, and helping the care team close the loop safely.

## The problem

ED *boarding* is the interval after a patient has been accepted for admission but before an inpatient bed is available. In 2022, roughly **3 million admitted ED visits involved a wait of at least four hours** — about one in six — with a national median boarding time of **215 minutes**.

The risk isn't just an uncomfortable wait. During boarding, the patient sits in the ED while responsibility, attention, and information are split across the ED and inpatient teams — and new data keeps arriving after the original handoff. A final imaging read revises the preliminary one. A critical lab returns among dozens of others. Vitals drift without any single value looking dramatic. Each team assumes the other has acted.

Longer boarding is associated with higher error rates, longer stays, and worse outcomes. See [`planning/scoping.md`](planning/scoping.md) for the evidence and sourcing.

## The insight

Clinicians don't lack data — the EHR already has the notes, labs, imaging, vitals, medications, and orders. What's missing is anything that continuously connects **new information** back to the **original admission plan** and confirms the right person has reviewed it.

> Abridge captures clinical intent. Epic captures the evolving clinical state. **BoardX protects the patient when the two diverge.**

## What BoardX does

**1. Live Boarding Brief** — a continuously updated, source-linked patient story: why they came in, why they're admitted, the working plan, what changed since the last review, what's still pending. Every statement links back to the supporting note, result, or order, with a timestamp.

**2. Contextual Safety Watch** — watches for changes that actually matter after the admission decision. Not every abnormal value: it asks whether a finding is new since last review, relevant to the admission problem, different from the preliminary read or prior trend, and not already acknowledged.

**3. Close-the-Loop Coordinator** — turns a reviewed concern into a safe next step: identifies who should see it, drafts a role-appropriate secure-chat message or updated handoff, and lets the clinician edit, approve, dismiss, or defer. Nothing sends without approval.

## Hero scenario

Built from real data: encounter `7bd9e5b0…::7bd9e5b0…` in **`synthetic-ambient-fhir-25`**,
the synthetic Synthea/Abridge dataset provided for the hackathon — the only inpatient
admission in the set. The patient, history, home medications, and COVID admission come
from that record. The vital-sign trend, the CTA, and the orders that follow are invented
for the prototype and are tagged **Simulated demo event** wherever they appear. Full
detail in [`planning/demo-case-ctpa-pe.md`](planning/demo-case-ctpa-pe.md).

**You are the ED attending.** Ariane Runolfsson, 81, is in your bed 7 — admitted for
COVID-19 pneumonia with hypoxemia, accepted by Internal Medicine, boarding 6h 17m
waiting on an isolation bed. She is physically your patient and clinically someone
else's. Every decision below is made by a team that is not at her bedside.

Before you touch anything, one line is already on the board:

> **Checked, not raised** · 02:40 SpO₂ 89% on 4 L — *Oxygen requirement unchanged at
> 4 L; within the range the current plan anticipates*

Her saturation had already slipped once. The gate looked at it and declined, because a
dip at unchanged oxygen is the drift the plan expects. You know it was watching before
it ever says anything.

**04:35 — the oxygen requirement moves.** SpO₂ 86% on 6 L, respiratory rate 28. BoardX
sends Medicine a notification *without waiting for approval*:

> Oxygen support increased from 4 L to 6 L while SpO₂ fell from 92% to 86% and
> respiratory rate rose from 22 to 28/min. This is progressing faster than the
> documented pneumonia course. Pulmonary embolism has not been excluded. She remains
> boarding in ED bed 7.

It names no study, no order, and no treatment. Stating what has *not been ruled out* is
information the receiving clinician needs; naming the scan to order would be prescribing
their workup.

**04:37 — acknowledged by Vishnu Ravi, MD.** The card carries the receipt. Until it
lands it reads *Delivered · not yet acknowledged*, because a message that was sent is
not a message that was read, and on an auto-sent notification you have no other way to
tell the difference.

**04:39 — Medicine orders the CTA.** Their call, their judgment, recorded as theirs.

**05:38 — the final read.** Acute bilateral segmental pulmonary emboli with right-heart
strain. Both teams notified. Aspirin is active; the gate models antiplatelet and
anticoagulation separately, so it does not count as treatment.

**05:44 — Medicine orders a heparin infusion.** The order routes to Internal Medicine,
who wrote it, and to ED nursing, who will hang it. **You are on neither notification.**
That is not a bug in the EHR; it is how order routing works. A heparin drip starts on
your patient and nothing tells you.

> **Heparin infusion ordered for your patient — you are not on the routing**
>
> Internal Medicine ordered heparin infusion at 05:44 for a patient in ED bed 7. The
> order was routed to Internal Medicine and ED nursing. No administration is recorded
> yet. She is in your department and you are not on the notification.

That is the one card that asks you to act. Acknowledging it is the whole point of the
product: the loop stayed attached to the person accountable for the patient in that bed.

**Why this case.** The 04:35 escalation is a *trend*, not a threshold — no alarm fires
and no single value is critical. The 05:44 routing gap is not a clinical error by
anyone; every team did their job correctly. Both are what boarding produces
structurally, and neither is something a threshold alert would catch.

## Safety boundaries

| BoardX does | BoardX does not |
| --- | --- |
| Surface a patient-specific concern with evidence | Diagnose autonomously |
| Send a factual notification between teams without approval | Recommend a study, an order, or a treatment |
| State what has not been excluded | Name the workup that would exclude it |
| Draft a clinical message for review | Send one without a clinician approving it |
| Label a finding "needs clinician review" | Declare that a clinician made an error |
| Show source, timestamp, and context | Hide reasoning behind a black box |
| Support a clinician's decision | Replace clinical judgment |

**On the one autonomous action.** Auto-notify is the only place the product acts without
a human, and the boundary is drawn at *data rather than silence*: a notification that
reports numbers and what they are inconsistent with sends itself; anything proposing a
clinical next step still waits for approval. The ED attending should not have to approve
telling Medicine that their patient is deteriorating. Because nothing reviews an
auto-sent message, two guards sit behind it — the drafter is given the triggering event
so it cannot report stale values, and the Safety layer checks the model's rewrite kept
the gate's required claims before it goes.

## Explicitly not building

- A dashboard as the main product experience
- Autonomous diagnosis, ordering, paging, or messaging
- A generic RAG chatbot over the chart
- Mortality prediction, deterioration prediction, or bed-availability prediction
- Live Epic or Abridge production integration

## Architecture

Five focused components behind one clinician experience. Four are Claude calls with
structured output; the fifth is code only.

```
ClinicalEvent
     ↓
deterministic gates          evaluator.ts — decides IF a signal fires
     ↓
Change Interpreter  ┐
Open-Loop Finder    ┘        parallel — independent questions
     ↓
Safety & Evidence Layer      code only — provenance, language, required claims
     ↓
Action Drafting Helper
     ↓
SafetySignal + ActionDraft   auto-notify → sent · otherwise pending
```

**Three signal classes**, each a rule in `lib/evaluator.ts`:

| Rule | Fires when | Action |
| --- | --- | --- |
| `respiratory-escalation` | Oxygen requirement rises *and* saturation falls anyway. A dip at unchanged support is suppressed. | auto-notify |
| `final-imaging-pe-without-management` | A final read identifies acute PE that is new to the story, with no therapeutic anticoagulation or documented plan visible. Aspirin does not count. | auto-notify |
| `ordered-for-patient-still-in-ed` | A drug is ordered for a patient still in an ED bed, with the ED attending absent from the routing and no administration recorded. | acknowledge |

Adding a class means adding one rule; the helpers and the safety layer generalize.

### The agents

Each agent has one narrow job, its own system prompt, and its own reasoning effort.
Four are Claude calls that return structured (zod-schema) output; the fifth is code
only. They are deliberately separate rather than one do-everything call — the
clinician sees a single workspace, but the reasoning behind it is decomposed so each
step can be evaluated, swapped, or given a different model on its own. Every agent
carries a deterministic fallback, so a model outage degrades the prose rather than
dropping the signal.

| Agent | Runs on | What it does | Fallback if the model is unavailable |
| --- | --- | --- | --- |
| **Patient Story Builder** | Sonnet 5 · `low` | Organizes current state into the ten-second Boarding Brief. Reports what *is*, not what it means. | Deterministic brief from the admission intent |
| **Change Interpreter** | Sonnet 5 · `medium` | Compares the new event against the admission story, prior data, and active plan, and decides whether it is a *meaningful* change for this patient. | The deterministic gate's own text |
| **Open-Loop Finder** | Sonnet 5 · `low` | Finds still-open loops: pending results, plan items with no matching order, unacknowledged findings. Runs concurrently with the Interpreter; its output feeds the brief's open items. | Pending items from the admission intent |
| **Action Drafting Helper** | Sonnet 5 · `low` | Writes the message — a clinical draft for approval, or the body of an auto-sent notification. | Deterministic message template |
| **Safety & Evidence Layer** | code only | Gates every model claim before a clinician sees it — provenance (every cited ID resolves *and is already on the chart*), grounding (no surviving evidence → not shown), language (no accusatory or instructional phrasing), and on auto-sent messages, that the rewrite kept the gate's required claims. | *is* the deterministic guarantee |

Each runs behind one envelope (`lib/agents/client.ts`): a 20-second timeout and the
fallback above, so no agent can be the reason the demo stalls. Every run is tagged
`claude` or `code` in the trace the UI surfaces (see below), so you can always see
which agent produced a given line and whether it ran on the model or fell back.

**Division of authority.** The deterministic gates decide *whether* a signal fires.
The model decides *how it reads*. Event type, timestamps, active-order checks, and
duplicate suppression stay in code so they're auditable and testable; a model outage
degrades the prose rather than silencing a signal. When the Change Interpreter
disagrees with a gate, the disagreement is recorded in the trace rather than
suppressing the card.

**Why five components and not one call.** Each helper gets its own effort level, the two
interpretation questions run concurrently, and each can be evaluated and swapped
independently. The clinician still sees one workspace — the decomposition is for us, not
them. All four run on **Sonnet 5** with thinking off; `BOARDX_MODEL` overrides to A/B
against Opus without touching code.

**The Safety and Evidence Layer never calls a model.** It checks provenance (every
cited evidence ID must resolve), grounding (a claim with no surviving evidence isn't
shown), and language (no accusatory or instructional phrasing). A hallucinated
citation is dropped rather than rendered as a broken link. The language check is a
regex backstop, not a semantic one — provenance is the load-bearing guarantee.

Every helper runs inside a timeout with a deterministic fallback. Nothing in the
pipeline can be the reason the demo stalls.

### Measured decisions

**Prompt caching is deliberately absent.** The four helpers share an identical
patient-context prefix, which looks like an obvious caching win — but `npm run measure`
puts it at **1,298 tokens** against the **4,096-token minimum cacheable prefix**. Adding
`cache_control` would be a silent no-op (no error, just
`cache_creation_input_tokens: 0`). The number is worth re-running as the case grows:
this started at 861 and crossing 4,096 is the moment caching becomes real.

**The safety layer is adversarially tested.** `npm run eval` runs **41 checks** — the
provenance and language gates, all three signal gates in both directions, and a live
red-team tier against the actual model. The gate tests are mostly about *not* firing:
no signal when saturation improves on less oxygen, when anticoagulation is already
visible, when a PE plan is documented, when the ED attending is already on the routing,
when administration is recorded, or when the patient has left the ED. Aspirin does not
satisfy the anticoagulation check.

The live tier earns its keep: it reproducibly catches the model citing `imaging-final`
(an event *type*) as though it were an evidence ID. Provenance rejects the claim. A gate
that has only ever seen synthetic bad input proves very little.

**Three bugs that testing found, not review.**

*Temporal leakage.* The prompt rendered the entire evidence dictionary, so the Change
Interpreter read the 05:38 CTA report while interpreting the 04:35 vitals and announced
pulmonary emboli from a scan nobody had ordered. Context now exposes only artifacts on
the chart, and provenance rejects citations to results that have not returned.

*Stale values in an unreviewed message.* `draftAction` rendered context without the
triggering event, so the auto-sent notification reported the 02:40 saturation while
announcing the 04:35 deterioration. On the one message nobody reviews, that is the
failure mode that matters most.

*Shared fixture state.* `initialPatientState()` spread the seeded-event array but shared
the event objects, so a test that held a medication silently corrupted every state built
afterwards. Fixed in the fixture, not the test.

**Degradation is verified, not assumed.** With no key and with an invalid key, the
pipeline still produces a complete signal from the deterministic path, with the reason
surfaced in the trace rather than swallowed.

**Latency is ~9–12s per event** on Sonnet 5 with thinking off — two parallel helpers,
then the drafter. Measuring is what found the real cost: the Open-Loop Finder was the
long pole while its output was never read, so it now feeds the brief's open items rather
than producing a trace line for several seconds a turn. Acceptable for a demo where the
event posts on cue; it would need work before a clinician waited on it live.

## Stack

- **Frontend** — React 19 / Next.js 16. Three surfaces: the clinician workspace, an iOS
  view, and an operations trackboard
- **Backend** — thin API over an in-memory patient-state store
- **Data** — synthetic FHIR-shaped fixtures plus a simulated Abridge encounter artifact
- **AI** — Claude Sonnet 5 via structured outputs (zod schemas); deterministic gates in code

```bash
npm run measure   # token footprint vs. the caching threshold
npm run eval      # safety-layer evals (static tier needs no API key)
```

Core objects: `AdmissionIntent`, `ClinicalEvent`, `PatientState`, `SafetySignal`, `ActionDraft`. See [`planning/prototype-prd.md`](planning/prototype-prd.md) for field-level detail and build order.

## Getting started

```bash
git clone https://github.com/vishnuravi/boardx.git
cd boardx
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local   # optional — see below
npm run dev
```

Without a key the app still runs the full loop on the deterministic path, with each
helper marked `code` in the trace. With a key, the four helpers run on Claude.

### Three surfaces

| Route | What it is |
| --- | --- |
| `/` | The clinician workspace — the Abridge note surface with BoardX as a third rail tab. This is the demo. |
| `/mobile` | The same thing on iOS: one phone, the tab bar switching between the note and the BoardX action layer. Runs the same components as the rail. |
| `/board` | The operations trackboard — the whole boarding census ordered by NEWS2 acuity, with a nursing task view at `?view=nursing`. Ariane's row opens her chart. |

### Running the case

Open http://localhost:3000. It loads on the BoardX tab with Ariane mid-boarding and one
line already showing: the 02:40 check the gate considered and declined.

A stepper at the top of the pane advances the case; each press runs the agents over the
new event and takes about ten seconds.

1. **04:35 · New vitals — SpO₂ 86% on 6 L** → BoardX notifies Medicine automatically,
   stating PE has not been excluded. Watch the receipt flip from *Delivered · not yet
   acknowledged* to acknowledged by Dr. Ravi at 04:37; Medicine then orders the CTA.
2. **05:38 · Final CTA report — PE identified** → bilateral segmental PE with right-heart
   strain, both teams notified. The 04:35 card folds to one line.
3. **05:44 · Medicine orders heparin infusion** → routed to Medicine and ED nursing, not
   to you. This is the card that asks you to act.

**Reset** returns to the start. Every card's evidence chips open the drawer, where
artifacts invented for the prototype carry a **Simulated demo event** tag.

### Layout

```
src/
  app/
    page.tsx                  clinician workspace
    mobile/page.tsx           iOS view
    board/page.tsx            operations trackboard
    api/patient/              GET state · DELETE reset
    api/events/               POST a chart event
    api/signals/[id]/         POST an acknowledgement
    api/drafts/[id]/          POST a clinician decision
  components/
    workspace.tsx             Abridge desktop shell + note panel
    boardx-rail.tsx           the rail: stepper, brief, signal cards, collapse
    mobile-demo.tsx           the phone; renders the same rail
    ops-board.tsx             trackboard, care and nursing views
    evidence-drawer.tsx       provenance panel
  data/
    ariane-runolfsson.ts      hero-scenario fixtures
    boarders.ts               the boarding census
  lib/
    types.ts                  ClinicalEvent · PatientState · SafetySignal · ActionDraft
    evaluator.ts              the three signal gates, fallback text, handoff builder
    acuity.ts                 NEWS2 scoring for the trackboard
    store.ts                  in-memory patient state (prototype only)
    agents/
      client.ts               Claude client + timeout/fallback envelope
      context.ts              renders state into the shared prompt, chart-time scoped
      schemas.ts              zod structured-output contracts
      helpers.ts              the four LLM-backed agents
      safety.ts               Safety & Evidence Layer (no model)
      orchestrator.ts         wires the pipeline together
scripts/
  measure-tokens.ts           token footprint vs. caching threshold
  eval-safety.ts              adversarial evals
```

Adding a signal class means adding one rule to the registry in `lib/evaluator.ts` —
the agents and safety layer generalize across signal types without changes.

## Roadmap

**Now** — the patient-level safety loop end to end: three signal classes, one patient,
across the boarding interval.

**Next** — expand the signal library: more result-change patterns, medication
reconciliation, consultant and pending-test follow-up, and routing that knows who is
actually covering a bed rather than who is on the order.

**Later** — the trackboard at `/board` is the first cut of **Boarding Pulse**: active
boarders ordered by acuity with unresolved items surfaced. Making its rows live — every
patient with real state behind them, not just Ariane — is the step from one demo case to
a department.

## Planning docs

- [`planning/scoping.md`](planning/scoping.md) — problem scope, clinical evidence, market model
- [`planning/product-solution.md`](planning/product-solution.md) — product solution and build plan
- [`planning/prototype-prd.md`](planning/prototype-prd.md) — prototype PRD, hero scenario, acceptance criteria
- [`planning/demo-case-ctpa-pe.md`](planning/demo-case-ctpa-pe.md) — the demo case: timeline, trigger logic, safety boundary
- [`planning/mockups/`](planning/mockups/) — the integration mockups the UI replicates
- [`planning/products-and-solutions.md`](planning/products-and-solutions.md) — earlier two-product framing (Sentinel / Relay)

## A note on data

BoardX is a hackathon prototype — **not** a cleared medical device or a system of record. It runs on synthetic data only. Nothing here should be used for clinical decision-making, and no real PHI should go into it.
