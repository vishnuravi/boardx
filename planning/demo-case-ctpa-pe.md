# BoardX demo case: the final CTA that changed the admission

## Purpose

This is the primary three-minute BoardX demo case. It shows a clinician-supervised
continuity agent catching a meaningful change during ED boarding and helping the
responsible team close the loop.

> **Demo premise:** Ariane was admitted for COVID pneumonia and hypoxemia. Her
> respiratory status worsened while she remained in the ED, so BoardX sent a
> non-prescriptive escalation notification to inpatient medicine. The team then
> appropriately ordered a CTA chest. The final CTA identified pulmonary emboli with
> right-heart strain, but no therapeutic-anticoagulation plan was yet visible.

## Provenance boundary

The patient identity, clinical history, and COVID admission below are based on the
supplied synthetic Ariane Runolfsson record.

The demo's current renal function, vital-sign trend, BoardX escalation, CTA, and
post-CTA order check are intentionally created for the prototype. They are not
represented as source data, clinical history, or a real patient event. In the product,
label those entries **Simulated demo event**.

## Patient baseline from the supplied record

**Ariane Runolfsson, 81** is admitted from the ED for COVID-19 pneumonia, hypoxemia,
and isolation. Her chest x-ray is consistent with pneumonia. She has poor oral intake.

- Synthetic-demo creatinine: 1.4 mg/dL
- Platelets: 136.34 ×10³/µL
- Active home medications include aspirin 81 mg and lisinopril 20 mg daily
- Admission plan: oxygen by mask, prone positioning as tolerated, and daily labs

The CTA order in this demo is made by inpatient medicine after the respiratory
escalation notification; contrast appropriateness remains a clinician decision.

## Abridge desktop clinical-note content

Use the following in the **Clinical Note** panel. The PE events belong in the separate
boarding-course section below so the demo can reveal them in real time.

### Encounter header

**Runolfsson, Ariane · 81F**<br>
Hospital admission for COVID isolation · Medicine<br>
ED Bed 7 · Boarding 6h 17m<br>
Allergy: Tree nuts

### History of Present Illness

Ariane Runolfsson is an 81-year-old woman with hypertension, hyperlipidemia, prior
STEMI, obesity, and prediabetes presenting with five to six days of initially dry
cough, persistent fever, poor appetite, and progressively worsening shortness of
breath.

She tested positive for SARS-CoV-2 as an outpatient; repeat testing on arrival is
positive. She reports dyspnea with minimal exertion and chest tightness with breathing,
but denies chest pain or pressure similar to her prior myocardial infarction. Her
daughter reports mild morning fogginess but no falls, syncope, hemoptysis, or leg
swelling.

She has had poor oral intake for two days. Chest x-ray is consistent with pneumonia.
She is admitted to medicine for COVID pneumonia, hypoxemia, and isolation.

### Past Medical History

- Essential hypertension
- Prior ST-elevation myocardial infarction
- Hyperlipidemia
- Metabolic syndrome
- Prediabetes
- Obesity
- Osteoporosis
- Adolescent idiopathic scoliosis

### Past Surgical / Other History

- Remote tubal ligation
- History of miscarriage

### Home Medications

- Aspirin 81 mg daily
- Atenolol 50 mg daily
- Rosuvastatin 40 mg daily
- Lisinopril 20 mg daily

### Allergies

- Tree nuts

### Admission Vitals

- Temperature: 38.45 °C
- HR: 57/min
- RR: 19/min
- BP: 105/53 mmHg
- SpO₂: 87% on presentation

### Key Admission Results

- SARS-CoV-2 PCR: positive ×2
- Chest x-ray: findings consistent with pneumonia
- Creatinine: 1.4 mg/dL *(simulated demo value)*
- WBC: 3.42 ×10³/µL
- Platelets: 136 ×10³/µL

### Assessment and Plan

**COVID-19 pneumonia with hypoxemia.** Admit to isolation. Oxygen by mask, titrated
to saturation; prone positioning as tolerated. Continue respiratory monitoring and
daily family updates.

**Chronic cardiovascular disease.** Continue aspirin, atenolol, rosuvastatin, and
lisinopril as hemodynamics allow.

## Synthetic demo extension

| Time | Event | BoardX state |
| --- | --- | --- |
| 00:15 | SpO₂ 92% on 4 L oxygen; RR 22/min | Establishes respiratory baseline |
| 02:40 | SpO₂ 89% on 4 L; RR 24/min | Tracks change; no new alert |
| 04:35 | SpO₂ 86% despite 6 L; RR 28/min | Sends non-prescriptive hypoxia escalation to inpatient medicine |
| 04:39 | Inpatient medicine acknowledges the escalation and orders CTA chest | BoardX records a clinician-owned next step |
| 05:38 | **Final CTA chest: acute bilateral segmental pulmonary emboli with CT evidence of right-heart strain** | Creates a high-priority review signal |
| 05:40 | Active-order check: no therapeutic anticoagulation order or documented PE plan visible | Adds treatment-plan context |

The 04:35 notification is an escalation signal, not a diagnosis or imaging
recommendation. It says that Ariane's oxygen need has increased while her saturation
has fallen and asks the inpatient team to reassess. The clinician chooses whether to
order a CTA. The final radiology result is a distinct, later event that changes her
working story.

### 04:35 escalation-notification copy

> **Respiratory status needs reassessment**
>
> Ariane's oxygen support increased from 4 L to 6 L while SpO₂ fell from 92% to 86%
> and RR rose from 22 to 28/min. She remains boarding in the ED. Please reassess.

The notification has one non-prescriptive action: **Acknowledge**. In the demo,
inpatient medicine acknowledges it and places the CTA order.

## The BoardX signal

### Trigger logic

BoardX raises a signal only when all of the following are true:

1. A final imaging result identifies acute pulmonary emboli.
2. The result is new relative to the admission story.
3. A current therapeutic-anticoagulation order or documented PE management plan is
   not visible.
4. The system can show supporting evidence and a timestamp for each assertion.

### Review card copy

> **High-priority clinician review**
>
> Final CTA at 05:38 identifies acute bilateral segmental pulmonary emboli with CT
> evidence of right-heart strain, changing the working explanation for Ariane's
> worsening hypoxemia. No therapeutic-anticoagulation order or documented
> PE-management plan is visible.
>
> **Review context:** oxygen support increased from 4 L to 6 L while SpO₂ fell from
> 92% to 86%; aspirin is active; platelets are 136.

The card must use **“no … is visible”** rather than declaring that care was missed.

## Evidence drawer

The review card opens an evidence drawer with:

1. The final CTA result and its 05:38 timestamp.
2. The admission story: COVID pneumonia, hypoxemia, and current oxygen plan.
3. The respiratory trend: 92% on 4 L → 86% on 6 L.
4. Active medication and order list, including absence of a visible therapeutic
   anticoagulation order.
5. The 04:35 escalation notification, its acknowledgment, and the clinician's CTA
   order.
6. Aspirin and platelet context.

Each item should be source-linked and timestamped. The user should be able to inspect
the evidence before taking any action.

## Clinician-approved action

BoardX drafts, but does not send:

> Ariane remains boarding in the ED after admission for COVID pneumonia and
> hypoxemia. Final CTA at 05:38 identifies acute bilateral segmental pulmonary emboli
> with CT evidence of right-heart strain. Her oxygen requirement has increased, and
> no therapeutic-anticoagulation order or documented PE-management plan is visible.
> Current medications and platelet data are available for review. Please review and
> determine management.

The user can **Edit**, **Approve & send**, **Defer**, or **Dismiss** the draft.

After approval, BoardX shows:

> ✓ Result acknowledged by inpatient medicine<br>
> ✓ Boarding handoff updated<br>
> ✓ No autonomous order placed

## Safety boundary

At 04:35, BoardX sends only a defined respiratory-status escalation; it does not
diagnose a cause or recommend a CTA. The inpatient clinician decides to order imaging.

At 05:38, BoardX does not diagnose pulmonary embolism; the final radiology report
does. It does not recommend an agent, dose, or anticoagulation regimen. It identifies
a high-priority final result whose management decision is not visible, brings forward
relevant chart context, and gives the responsible clinician a reviewable next action.

## Demo line

> “BoardX alerted the inpatient team to a meaningful respiratory change. The team
> chose the CTA. The risk is what happens next: the final result returns during a
> long, fragmented boarding interval. BoardX makes sure that result becomes a
> reviewed decision.”
