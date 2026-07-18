# BoardX: Product Solution and Build Plan

## The goal

> **BoardX is the safety layer for the in-between period:** a patient has been accepted for admission, remains physically in the ED, and their care is still changing.

BoardX makes that interval safer and more coordinated. It maintains a current, evidence-linked understanding of the patient, identifies meaningful new changes and open loops, and gives the care team a clear next step to review and act on.

This is not a generic chart summarizer, another alert feed, or a dashboard. It is a clinician-supervised continuity workflow for a specific, high-risk transition.

For the evidence behind the problem and its scale, see [scoping.md](scoping.md).

## The product promise

> **No patient should become clinically invisible because they are waiting for a bed.**

When an admitted patient boards in the ED, BoardX turns fragmented data and changing clinical context into a shared, actionable patient story. It helps clinicians answer three questions immediately:

1. **What is going on with this patient right now?**
2. **What changed, and why might it matter?**
3. **What needs to happen next, and who needs to see it?**

## What BoardX does

### 1. Live Boarding Brief

BoardX continuously builds a short, source-linked patient story—not a one-time AI summary.

It presents:

- Why the patient came to the ED.
- Why the patient is being admitted.
- The current working plan and key clinical context.
- What changed since the last meaningful review or handoff.
- Pending tests, consultant recommendations, and unresolved items.
- A concise transition-ready handoff when the bed becomes available.

Every statement points back to the supporting note, result, order, or vital-sign trend and includes a timestamp. The clinician can always see *why* BoardX said something.

### 2. Contextual Safety Watch

BoardX watches for meaningful changes after the admission decision. It does not simply repeat every abnormal lab or create an alert for every event.

It asks whether a new finding is:

- New since the last review.
- Relevant to the patient’s admission problem or active plan.
- Different from a preliminary result, prior trend, or documented expectation.
- Already acknowledged or addressed.
- Important enough to bring forward for clinician review.

Potential signals include:

- A final imaging read that changes the preliminary interpretation.
- A critical laboratory result that returns after the original handoff.
- A clinically meaningful vital-sign trend.
- A medication, order, or plan discrepancy that needs review.
- A consultant recommendation or pending test that remains open.

#### Example

> **Needs clinician review**
>
> Final CT read posted at 18:42 identifies a pulmonary embolism not described in the preliminary interpretation. The admission plan currently lists community-acquired pneumonia; no anticoagulation is visible in active orders.
>
> **Evidence:** final CT report, 18:42; admission note, 16:11; active medication and order list, 18:45.

This is more useful than an “abnormal CT” alert because it provides the patient-specific context, the evidence, and the reason the team should look. It remains a review prompt—not an autonomous diagnosis or treatment recommendation.

### 3. Close-the-Loop Coordinator

A signal only improves care if it leads to a safe action. BoardX turns a potential gap into a reviewable next step.

For each high-value item, it can:

- Show the source evidence and a concise explanation of why it matters.
- Identify the likely team or clinician who should review it.
- Draft a role-appropriate secure-chat message or updated handoff.
- Let the clinician edit, approve, send, dismiss, or defer the action.
- Record that the issue was acknowledged or resolved.

The result is a lightweight, human-controlled closed loop instead of another disconnected alert.

## How the workflow works

```text
New chart event
(note, vital, lab, imaging read, medication, order, consult)
        ↓
BoardX updates the shared patient story
        ↓
Focused evaluators ask: What changed? Does it matter? Is it already addressed?
        ↓
Evidence and safety checks
        ↓
Clinician review card with a clear next action
        ↓
Clinician acts, dismisses, or defers
        ↓
BoardX records the resolution and refreshes the handoff
```

## Product architecture: a shared story with focused helpers

BoardX can use several focused agents behind one coherent clinician experience. The clinician sees one patient story and a small number of high-value review cards—not a collection of agents.

| Component | Job | Output |
| --- | --- | --- |
| **Patient Story Builder** | Organizes notes, vitals, labs, imaging, medications, orders, and admission status into a current patient state. | Boarding Brief and timeline. |
| **Change Interpreter** | Compares each new event with the active story, previous data, and plan. | “What changed and why it may matter.” |
| **Open-Loop Finder** | Looks for pending, unacknowledged, inconsistent, or unresolved items. | Reviewable possible gaps. |
| **Action Drafting Helper** | Converts a clinician-approved concern into a concise message or handoff update. | Draft secure-chat message or handoff. |
| **Safety and Evidence Layer** | Requires provenance, timing, duplication checks, and clinician approval before any communication. | Source-linked, human-controlled workflow. |

### Data BoardX needs

For the hackathon, we can use synthetic, FHIR-shaped data and a simulated event stream. The product should be designed to consume:

- ED and admission notes.
- Vital signs and time-stamped trends.
- Laboratory results, including critical results.
- Preliminary and final imaging reads.
- Medication list and active medications.
- Orders, consults, and disposition/admission status.
- Team and handoff context.

## Safety by design

BoardX earns trust by making its boundaries obvious.

| BoardX does | BoardX does not |
| --- | --- |
| Surfaces a patient-specific concern with evidence. | Diagnose a patient autonomously. |
| Labels a finding as “needs clinician review.” | Declare that a clinician made an error. |
| Drafts a message or handoff for review. | Send a page, secure chat, or order automatically. |
| Shows source, timestamp, and relevant context. | Hide its reasoning behind a black box. |
| Supports a clinician’s decision. | Replace clinical judgment. |

## The hackathon MVP

The demo should feel like a real product, while proving a tight end-to-end loop.

### One patient, one evolving story, one high-value event

1. Start with a patient accepted for admission and still boarding in the ED.
2. Show the Live Boarding Brief: why they came in, why they are admitted, plan, pending items, and current owner.
3. Stream in a new final imaging read, critical lab, or vital-sign trend.
4. Show BoardX updating the story and creating a source-linked **Needs clinician review** card.
5. Let the clinician inspect evidence, approve or edit a secure-chat draft, and close the loop.
6. Show the updated handoff generated from the now-current patient story.

### What makes the demo technically credible

- A FHIR-shaped patient feed, not hardcoded prose alone.
- Time-aware event handling: the patient story changes as new events arrive.
- Distinct helpers for state-building, change interpretation, open-loop detection, and action drafting.
- Evidence links and timestamps on every review card.
- A clinician approval step before any draft is treated as communication.

## Build breakdown for a two-person team

| Workstream | Owner | Deliverable |
| --- | --- | --- |
| Clinical scenario and safety rules | Clinical/product lead | Synthetic case, expected patient story, meaningful-change rules, and review criteria. |
| Data and patient-state layer | Engineering lead | FHIR-shaped fixtures, event stream, shared patient-state object, and source references. |
| Brief and review-card interface | Shared | Patient story, evidence drawer, event timeline, and “needs review” card. |
| Message and handoff workflow | Shared | Clinician-editable secure-chat draft, resolve/defer state, and updated handoff. |
| Demo narrative and evaluation | Clinical/product lead | Three-minute script, safety boundary, and explanation of why the signal matters. |

## What we are intentionally not building

- A dashboard as the main product experience.
- Autonomous diagnosis, ordering, paging, or messaging.
- A generic RAG chatbot over the chart.
- A model that claims to predict mortality or replace clinical triage.
- A full production Epic integration during the hackathon.

## Roadmap

### Now: prove the patient-level safety loop

The MVP demonstrates that BoardX can maintain the patient story, detect a clinically meaningful change, show the evidence, and help a clinician close the loop.

### Next: expand the signal library

- More result-change patterns and trend detection.
- Medication reconciliation and plan/order review.
- Consultant and pending-test follow-up.
- More nuanced routing based on care-team structure.

### Later: Boarding Pulse

Once patient-level signals are trustworthy, BoardX can aggregate them into **Boarding Pulse**: an operational view of active boarders, duration, unresolved review items, and week-over-week trends. This is a natural roadmap extension—not the main hackathon product.

## The one-sentence pitch

> **BoardX is a clinician-supervised continuity agent for admitted patients who remain in the ED—keeping their story current, bringing forward meaningful changes, and helping the care team close the loop safely.**
