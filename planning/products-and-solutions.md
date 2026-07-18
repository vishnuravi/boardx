# BoardX: Products and Solutions

## The vision

> **BoardX is the safety and intelligence layer for ED boarding.**

When a patient has been accepted for admission but remains physically in the emergency department, their chart and condition continue to change. BoardX keeps the patient’s story current, identifies meaningful gaps, and helps the care team communicate and close the loop safely.

> **No patient should become clinically invisible because they are waiting for a bed.**

## The core insight

The key product problem is not that clinicians lack data. The EHR already contains notes, labs, imaging, vital signs, medications, orders, and messaging. The problem is that, during a prolonged boarding interval, no one continuously connects new information to the original admission plan and confirms that the right person has reviewed the next important step.

BoardX creates that continuity.

```text
Admission story and plan
        +
New events while the patient boards
        ↓
BoardX identifies a meaningful change or open loop
        ↓
Clinician reviews evidence and approves the next action
        ↓
The patient story and handoff stay current
```

## Product 1: BoardX Sentinel

### What it is

BoardX Sentinel is a patient-level safety watch for admitted patients who remain in the ED. It monitors new clinical events after the admission decision and brings forward only the changes or gaps that need clinician review.

### What it does

- Maintains a live patient story from notes, vitals, labs, imaging, medications, orders, and admission status.
- Detects a meaningful difference between new information and the patient’s existing admission story or plan.
- Checks whether the finding appears already acknowledged or addressed.
- Shows source evidence and timestamps.
- Creates a clinician-reviewed draft of the next communication step.

### Examples of high-value signals

- A final imaging read changes a preliminary interpretation.
- A critical laboratory result returns after the admission handoff.
- A meaningful vital-sign trend emerges while the patient is boarding.
- A medication, order, or care-plan discrepancy requires review.
- A consultant recommendation or pending test remains open.

### Product promise

> Sentinel does not produce another generic alert. It explains what changed, why it may matter for this patient, and what the clinician can do next.

## Product 2: BoardX Relay

### What it is

BoardX Relay is a living ED-to-inpatient handoff and ownership layer. It keeps the transition current during boarding rather than relying on a handoff that becomes stale after the first conversation.

### What it does

- Generates a transition-ready view of why the patient came in, why they are admitted, and the current plan.
- Highlights what changed since the last handoff.
- Shows pending items, unresolved review cards, and acknowledged actions.
- Helps identify the likely team responsible for the next review.
- Produces an updated handoff when the patient changes shifts or finally transfers upstairs.

### Product promise

> Relay gives the receiving team the patient’s current story—not the story from six hours ago.

## How the products fit together

| Product | Core job | Value |
| --- | --- | --- |
| **Sentinel** | Detect a meaningful new change or open loop. | Prevents important information from disappearing inside a changing chart. |
| **Relay** | Carry the updated story and clear ownership across teams. | Prevents the transition from becoming fragmented or stale. |

> **Sentinel catches the gap. Relay makes sure the updated story follows the patient.**

## The Abridge and Epic opportunity

BoardX is designed as a companion layer inside the existing clinical workflow.

- **Abridge captures clinical intent:** the admission conversation, working diagnosis, plan, pending items, and patient-specific context.
- **Epic captures the evolving clinical state:** new labs, final imaging reads, vital signs, orders, medications, and care-team information.
- **BoardX connects the two:** it detects when a newly arriving event changes the story established in the encounter and helps the clinician close the loop.

```text
Abridge encounter
conversation → note → source-linked clinical intent
                        ↓
Epic events → labs, imaging, vitals, orders, medications
                        ↓
BoardX → meaningful change → evidence → clinician-reviewed action
```

### The central partnership message

> **Abridge captures the conversation. BoardX protects the patient after the conversation.**

## What the real-world experience looks like

BoardX should be an embedded patient workspace or sidecar launched from the ED trackboard or patient chart—not a separate dashboard clinicians must remember to open.

```text
Maria Chen                         Boarding 6h 12m
Admitted to Medicine               ED bed 18

WHY ADMITTED
Hypoxia; presumed pneumonia

SINCE LAST REVIEW
Final CT result changed the working admission story

NEEDS CLINICIAN REVIEW
Segmental PE now identified; anticoagulation not visible

[View evidence] [Review action] [Dismiss]
```

The clinician opens the evidence drawer, sees the exact source note, preliminary and final imaging reads, and active orders, then approves or edits a concise secure-chat draft to the admitting team. BoardX records that the issue was acknowledged and updates the transfer handoff.

## Product design principles

1. **Patient-specific, not generic.** Every signal must explain why it matters for this patient.
2. **Evidence-linked.** Every statement points to a note, result, order, or trend with a timestamp.
3. **Highly selective.** BoardX earns trust by surfacing a small number of high-value signals.
4. **Clinician-supervised.** It drafts, explains, and supports; clinicians decide and act.
5. **Inside the workflow.** It strengthens existing EHR and communication tools instead of replacing them.
6. **Closed loop.** A concern is not complete until it is reviewed, dismissed, deferred, or resolved.

## Recommended prototype

The prototype should prove one complete loop, not attempt to simulate an entire hospital.

### Hero case

1. Abridge captures an ED admission story for a patient admitted for hypoxia and presumed pneumonia; final CT is pending.
2. The patient boards in the ED.
3. A final CT read posts and identifies a segmental pulmonary embolism not described in the preliminary interpretation.
4. BoardX compares that event to the admission story and current active orders.
5. BoardX creates a source-linked **Needs clinician review** card.
6. The clinician approves an editable message draft to the admitting team.
7. The handoff updates with the new result and communication status.

### What this proves

- Abridge-derived clinical intent can establish the initial patient story.
- BoardX can detect a patient-specific divergence after the conversation.
- The system can provide transparent evidence, not a black-box recommendation.
- A clinician can safely close the communication loop in one workflow.

## Product roadmap

### Now: patient-level boarding safety

Launch Sentinel with one or two trusted signal types, beginning with final imaging-result changes and critical result follow-up. Pair it with Relay’s live transition brief and clinician-approved communication workflow.

### Next: broader continuity coverage

Expand to medication discrepancies, vital-sign changes, consultant recommendations, pending tests, and richer team routing.

### Later: Boarding Pulse

Once patient-level signals are trustworthy, aggregate them into Boarding Pulse: an operational view of active boarders, duration, unresolved safety items, and week-over-week trends. This is a roadmap product, not the primary hackathon experience.

## Reference planning documents

- [Problem scope and evidence](scoping.md)
- [Product solution and build plan](product-solution.md)
- [Prototype PRD](prototype-prd.md)
