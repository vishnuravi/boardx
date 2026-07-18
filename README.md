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

Maria Chen, 67, admitted for hypoxia and presumed community-acquired pneumonia. Boarding 6h 12m. The admission conversation noted a preliminary CT with no PE seen, final read pending.

At 18:42 the final CT posts: **segmental pulmonary embolism**.

> **Needs clinician review**
>
> Final CT result changes the working admission story. Segmental PE appears on final read and was not in the preliminary interpretation. No anticoagulation is visible in the active medication or order list.
>
> **Evidence:** Abridge admission story 16:11 · preliminary CT 16:28 · final CT report 18:42 · active orders and medications 18:45

BoardX drafts a message to Medicine. The clinician reviews the evidence, edits if needed, approves. The item is marked acknowledged and the handoff refreshes.

That's the whole demo loop — and it's more useful than an "abnormal CT" alert because it carries the patient-specific context, the evidence, and the reason to look.

## Safety boundaries

| BoardX does | BoardX does not |
| --- | --- |
| Surface a patient-specific concern with evidence | Diagnose autonomously |
| Label a finding "needs clinician review" | Declare that a clinician made an error |
| Draft a message or handoff for review | Send a page, chat, or order automatically |
| Show source, timestamp, and context | Hide reasoning behind a black box |
| Support a clinician's decision | Replace clinical judgment |

## Explicitly not building

- A dashboard as the main product experience
- Autonomous diagnosis, ordering, paging, or messaging
- A generic RAG chatbot over the chart
- Mortality prediction, deterioration prediction, or bed-availability prediction
- Live Epic or Abridge production integration

## Stack

- **Frontend** — React / Next.js patient workspace with an evidence drawer
- **Backend** — thin API over an in-memory or JSON-backed patient-state store
- **Data** — synthetic FHIR-shaped fixtures plus a simulated Abridge encounter artifact
- **AI** — structured-output calls for change explanation and message drafting; deterministic gates for event type, timestamps, and active-order checks

Core objects: `AdmissionIntent`, `ClinicalEvent`, `PatientState`, `SafetySignal`, `ActionDraft`. See [`planning/prototype-prd.md`](planning/prototype-prd.md) for field-level detail and build order.

## Getting started

```bash
git clone https://github.com/vishnuravi/boardx.git
cd boardx
```

No application code yet — setup instructions land here once the scaffold does.

## Roadmap

**Now** — prove the patient-level safety loop end to end on one patient, one event.
**Next** — expand the signal library: more result-change patterns, vital-sign trends, medication reconciliation, consultant and pending-test follow-up, care-team-aware routing.
**Later** — **Boarding Pulse**, an operational view of active boarders, duration, and unresolved review items. A roadmap extension, deliberately *not* the hackathon product.

## Planning docs

- [`planning/scoping.md`](planning/scoping.md) — problem scope, clinical evidence, market model
- [`planning/product-solution.md`](planning/product-solution.md) — product solution and build plan
- [`planning/prototype-prd.md`](planning/prototype-prd.md) — prototype PRD, hero scenario, acceptance criteria
- [`planning/products-and-solutions.md`](planning/products-and-solutions.md) — earlier two-product framing (Sentinel / Relay)

## A note on data

BoardX is a hackathon prototype — **not** a cleared medical device or a system of record. It runs on synthetic data only. Nothing here should be used for clinical decision-making, and no real PHI should go into it.
