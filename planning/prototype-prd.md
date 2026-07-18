# BoardX Prototype PRD

## 1. Prototype in one sentence

**BoardX is a clinician-supervised safety and intelligence layer for admitted patients who remain in the ED: it compares the admission story captured by Abridge with new Epic events, identifies a meaningful change or open loop, and prepares a clinician-reviewed next action.**

## 2. The product thesis

The admission conversation contains the care team’s working model: why the patient is here, why they are being admitted, what is pending, and what the plan is. The EHR then continues to receive new data while the patient boards. BoardX connects those two moments.

> **Abridge captures clinical intent. Epic captures the evolving clinical state. BoardX protects the patient when the two diverge.**

BoardX is not another chart summary, generic alert feed, or dashboard. It is a patient-level workflow that answers:

1. What was the admission story and plan?
2. What changed after that conversation?
3. Does the change create a gap that needs clinician review?
4. What is the clearest, safest next communication step?

## 3. The one-minute demo goal

Show a single, complete safety loop:

```text
Abridge admission story
        +
New Epic final imaging result
        ↓
BoardX detects a meaningful divergence
        ↓
Clinician reviews source evidence
        ↓
BoardX drafts a message to the admitting team
        ↓
Clinician approves; handoff updates
```

The audience should leave with one thought:

> “This is how Abridge can extend from capturing the clinical conversation to protecting the patient after the conversation.”

## 4. Primary user and job to be done

### Primary user

An ED attending, resident, or admitting clinician caring for an accepted patient who remains in the ED.

### Job to be done

> When an admitted patient is boarding and the chart changes after the original conversation or handoff, help me quickly understand what changed, why it may matter for this patient, and what I should do next—without making me reconstruct the chart or trust an opaque alert.

## 5. MVP scope

### Must ship

1. **Single-patient BoardX workspace**
   - Patient name, boarding duration, admission status, and current care team.
   - A concise live Boarding Brief.

2. **Abridge-derived admission story**
   - Synthetic structured note and transcript excerpts.
   - Admission reason, working diagnosis, active plan, and pending final CT read.
   - Source links back to evidence from the encounter.

3. **Epic-shaped event stream**
   - Synthetic FHIR-style resources for a final imaging result, active orders, medications, and timestamps.
   - One button or timed event that posts the final CT result.

4. **Contextual review card**
   - A single high-value “Needs clinician review” signal.
   - Explains the difference between the prior story and new result.
   - Shows relevant sources and timestamps.

5. **Clinician-reviewed action**
   - Draft secure-chat message to the admitting team.
   - Edit, approve, dismiss, or defer controls.
   - Approval changes the signal state to acknowledged and refreshes the handoff.

### Deliberately out of scope

- Live Epic or Abridge production integration.
- Raw audio ingestion or recording.
- Autonomous diagnosis, ordering, paging, or message sending.
- An operations dashboard as the main experience.
- More than one hero clinical scenario in the live demo.
- Prediction of mortality, clinical deterioration, or bed availability.

## 6. Hero scenario

### Patient

**Maria Chen**, 67, admitted from the ED for hypoxia and presumed community-acquired pneumonia. She has been boarding for 6 hours and 12 minutes.

### Admission story captured by Abridge

- Pleuritic chest pain, cough, hypoxia.
- Initial working diagnosis: community-acquired pneumonia.
- Decision: admit to medicine for oxygen and IV antibiotics.
- Preliminary CT interpretation: no pulmonary embolism seen; final read pending.

### New Epic event

At 18:42, the final CT read posts: **segmental pulmonary embolism identified.**

### BoardX signal

> **Needs clinician review**
>
> Final CT result changes the working admission story. Segmental PE appears on final read and was not in the preliminary interpretation. No anticoagulation is visible in the active medication or order list.
>
> **Evidence:** Abridge admission story, final CT report at 18:42, preliminary CT interpretation, active medication and order list at 18:45.

### Clinician action

BoardX drafts a message to medicine:

> “Maria Chen is boarding in the ED after admission for hypoxia/presumed pneumonia. Final CT at 18:42 identifies segmental PE not described in the preliminary interpretation. Anticoagulation is not visible in active orders. Please review.”

The clinician reviews and approves the draft. BoardX marks the item acknowledged and updates the transfer handoff.

## 7. User experience

### Screen 1: BoardX patient workspace

```text
Maria Chen                         Boarding 6h 12m
Admitted to Medicine               ED bed 18

WHY ADMITTED
Hypoxia; presumed pneumonia

CURRENT PLAN
Oxygen, IV antibiotics, final CT pending

SINCE LAST REVIEW
No material changes

OPEN ITEMS
Final CT read pending
```

### Screen 2: New event and review card

```text
NEW EVENT: Final CT read posted 18:42

NEEDS CLINICIAN REVIEW
Final CT changes the working admission story.
Segmental PE identified; no anticoagulation visible.

[View evidence]  [Review action]
```

### Screen 3: Evidence drawer and action draft

```text
EVIDENCE
• Abridge admission story — 16:11
• Preliminary CT interpretation — 16:28
• Final CT report — 18:42
• Active orders and medications — 18:45

MESSAGE DRAFT TO MEDICINE
[editable message]

[Approve and send] [Dismiss] [Defer]
```

### Screen 4: Resolved handoff

```text
UPDATED HANDOFF
Admitted for hypoxia/presumed pneumonia.
Final CT subsequently identified segmental PE.
Medicine notified at 18:47; plan under review.
```

## 8. System design

### Prototype architecture

```text
Synthetic Abridge artifact                 Synthetic Epic/FHIR event feed
note + transcript evidence                 imaging + meds + orders + timestamps
                 \                         /
                  \                       /
                   Shared patient state
                           ↓
               Change and open-loop evaluator
                           ↓
                Evidence-linked review card
                           ↓
                  Clinician-approved draft
                           ↓
              Updated handoff + audit state
```

### Core data objects

| Object | Required fields | Purpose |
| --- | --- | --- |
| `AdmissionIntent` | reason for admission, working diagnosis, plan, pending items, evidence references | Establishes the patient’s initial story from the Abridge encounter. |
| `ClinicalEvent` | event type, timestamp, source, content, status | Represents a new imaging, lab, vital, medication, or order event. |
| `PatientState` | current story, active plan, pending items, reviewed events | Shared state updated after every new event. |
| `SafetySignal` | category, explanation, evidence references, status, confidence | A reviewable potential gap, never an autonomous instruction. |
| `ActionDraft` | recipient, message, linked signal, clinician decision | Converts a reviewed concern into a communication workflow. |

### Evaluation logic for the hero event

1. Ingest final CT result.
2. Detect difference from the preliminary CT and `AdmissionIntent`.
3. Check active medication/order list for anticoagulation.
4. Check for an existing acknowledgement event in the prototype state.
5. Generate a “Needs clinician review” signal with only source-backed statements.
6. Create a message draft; do not send it without clinician approval.

## 9. Safety requirements

| Requirement | Prototype behavior |
| --- | --- |
| Human control | Every draft can be edited, dismissed, deferred, or approved. |
| Provenance | Every signal links to named source artifacts and timestamps. |
| Appropriate language | Use “needs clinician review” and “not visible in active orders,” not “missed care” or “you must treat.” |
| No autonomous clinical action | No order placement, diagnosis, page, or message without clinician approval. |
| Narrow signal scope | Demo only one signal class: final imaging result that changes the preliminary interpretation. |
| Auditability | Preserve the signal, evidence, clinician decision, and updated handoff state. |

## 10. Technical implementation plan

### Suggested stack

- Frontend: fast React/Next.js interface with a patient workspace and evidence drawer.
- Backend: simple API plus an in-memory or JSON-backed patient-state store.
- Data: synthetic JSON fixtures shaped like FHIR resources and an Abridge encounter artifact.
- AI: structured-output calls for the change explanation and message draft; deterministic logic gates for event type, timestamps, and active-order checks.

### Build order

1. Create the patient workspace with static Maria data.
2. Add the Abridge admission story and linked evidence.
3. Add a “Post final CT” event control.
4. Update the shared patient state and render the review card.
5. Add the evidence drawer and editable message draft.
6. Add approval state and refresh the handoff.
7. Rehearse the one-minute demo until it is reliable.

## 11. Acceptance criteria

The prototype is ready when:

- A viewer can understand Maria’s admission story in under 10 seconds.
- A final CT event visibly changes the BoardX state.
- The review card explains *why* the event matters for this patient.
- Every statement on the card has a source and timestamp.
- The action can be reviewed and approved in one click.
- Approval visibly updates the handoff and closes the loop.
- The full demo runs reliably in 60 seconds.

## 12. One-minute demo script

> “Maria was admitted for hypoxia and presumed pneumonia, but she has been boarding in the ED for six hours. Abridge captured the original admission story and the plan: oxygen, antibiotics, and a final CT read still pending.
>
> Now the final CT arrives. Instead of simply showing another result, BoardX compares it to the conversation and current orders. It sees that the final read now identifies a segmental PE, which was not in the preliminary interpretation, and anticoagulation is not visible.
>
> BoardX shows the evidence, drafts a message to the admitting team, and keeps the clinician in control. Once approved, the handoff updates immediately.
>
> Abridge captures the conversation. BoardX protects the patient after the conversation.”

## 13. Future product path

1. Add critical labs, vital-sign trends, medication discrepancies, consultant recommendations, and pending-test follow-up.
2. Add richer team routing and Epic-integrated communication drafts.
3. Extend the same patient-state model to all ED-to-inpatient transitions.
4. Aggregate trusted patient-level signals into Boarding Pulse, an operational product for monitoring boarding duration and unresolved safety items.

## References

- [BoardX problem scope and supporting literature](scoping.md)
- [BoardX product solution](product-solution.md)
- [Abridge Inside for Emergency Medicine](https://www.abridge.com/press-release/abridge-inside-for-emergency-medicine-announcement)
- [Abridge Contextual Reasoning Engine](https://www.abridge.com/abridge-contextual-reasoning-engine)
- [Abridge Inside for Inpatient](https://www.abridge.com/press-release/abridge-inside-for-inpatient-and-outpatient-orders)
