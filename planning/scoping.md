# BoardX: Problem Scope and Clinical Impact

## Executive summary

ED boarding is the period after a patient has been accepted for admission but remains physically in the emergency department because an inpatient bed or next placement is not available. It is a large U.S. problem: approximately **3 million ED visits that led to admission involved a wait of at least four hours for a regular inpatient bed in 2022**—about one in six admitted ED visits in that analysis.[2]

Boarding is one of the largest unaddressed patient-safety and operational challenges in acute care. Longer boarding is associated with more adverse events, higher error rates, longer hospital stays, and worse outcomes in several studies.[4, 5, 7, 12] BoardX creates a practical opportunity to make this high-risk interval safer by ensuring that evolving information, clinical deterioration, and unfinished tasks stay visible and actionable.

BoardX is the intelligence and coordination layer for the boarding interval. It keeps the patient's story current, connects new information to the plan, and helps clinicians close important loops while the broader system works to secure a bed.

**Evidence convention:** every empirical number in this note has an inline source reference. Product statements and pricing are hypotheses, explicitly labeled as such, rather than research findings.

## 1. How large is the problem?

| Metric | Estimate | Why it matters | Source |
| --- | ---: | --- | --- |
| U.S. ED visits in 2022 | 155 million | Boarding sits inside a very large emergency-care system. | [1] |
| Admitted ED visits waiting >=4 hours for a regular bed in 2022 | ~3 million | A large target population, not a niche workflow. | [2] |
| Share of admitted ED visits waiting >=4 hours | ~1 in 6 | The issue is common enough to affect ordinary hospital operations. | [2] |
| 2022 all-ED median boarding time | 215 minutes (3 h 35 m) | Standard definition: admission decision to physical departure from the ED. | [3] |
| 2022 high-volume ED median boarding time | 276 minutes (4 h 35 m) | The highest-volume settings have the greatest need. | [3] |

### Important definition

For this document, **boarding time** means the time from an admission decision to physical departure from the ED (the CMS ED-2 definition). That is distinct from total ED length of stay, which also includes the diagnostic workup before an admission decision.

## 2. Why does boarding affect clinical care?

The risk is not just that a patient is waiting in an uncomfortable location. During the wait, the patient may be physically in the ED while responsibility, attention, and information are spread across the ED and inpatient teams. New data continue to arrive after the original handoff.[8, 12]

Illustrative clinical failure modes described in boarding literature and targeted by the product include:[8, 12]

- A final imaging interpretation changes the preliminary understanding after the admission decision.
- A critical laboratory result returns among many other results and is not clearly acknowledged.
- Vital signs drift in a concerning direction, but no individual measurement looks dramatic by itself.
- The current admission plan, orders, medications, and consultant recommendations no longer align.
- A handoff becomes stale as the patient changes over several hours.
- Teams each assume that another clinician has acted on an important new finding.

This is the precise gap BoardX is designed to address: **not more raw data or more generic alerts, but patient-specific context and closed-loop follow-through.**

## 3. What does the literature say about patient outcomes?

### Evidence with the strongest product relevance

- A 2025 retrospective cohort found boarding status associated with a **60% higher recorded error incidence rate** after adjustment (adjusted incidence-rate ratio 1.60, 95% CI 1.42–1.82).[5] This is an association, not proof that boarding caused each error, but it supports a product aimed at reducing information and coordination failures.
- In a cohort of 41,256 admissions, mortality increased from **2.5%** among patients boarding less than two hours to **4.5%** among those boarding 12 hours or longer. Hospital length of stay also rose with longer boarding.[4]
- A recent multicenter propensity-matched study found no association with in-hospital mortality but found a **1.3-fold increase in 90-day mortality** among boarded patients.[6]
- A systematic review/meta-analysis of critically ill U.S. patients found no statistically significant overall mortality difference, while a mixed-patient analysis found higher mortality among boarded patients.[7]

### Why BoardX can make a measurable difference

BoardX is designed around the failure modes that emerge during a long ED-to-inpatient transition: information arrives after the initial handoff, the patient's condition changes, and important work can lack a clear next step. Its impact can be measured immediately through time to acknowledgement of an important result, unresolved issues identified and closed, updated handoffs after meaningful changes, and clinician-rated signal usefulness. These measures create a direct path to demonstrating safer, faster, and more reliable care.

## 4. How much money is involved?

The economic value at stake is substantial. Published sources quantify different pieces of the burden—direct care cost, lost ED capacity, ambulance offload delays, patients leaving before evaluation, delayed elective care, staffing pressure, and longer hospital stays.[8] Together, they show why solving the safety and coordination layer of boarding matters to both patients and health systems.

### Observed and modeled financial evidence

| Finding | Estimate | Interpretation | Source |
| --- | ---: | --- | --- |
| Medical/surgical daily cost for a boarded acute-stroke patient | $1,856 | Small, single-center time-driven costing study. | [9] |
| Medical/surgical daily cost on the inpatient floor | $993 | Same study. | [9] |
| Difference | $863 per patient-day | Directional evidence of higher cost; do not treat as a universal causal rate. | [9] |
| Modeled annual net-revenue opportunity from reducing boarding at one urban teaching hospital | $2.7–$3.6M | Throughput/revenue opportunity, not direct BoardX savings. | [8] |
| Minnesota discharge-delay burden | Nearly $500M/year | Driven by discharge delays broadly, not ED boarding alone. | [8] |

### Economic value at stake

If the $863 per 24-hour difference were used only as a rough time-based proxy, the incremental direct-cost exposure would be:

| Average boarding interval | Per 10,000 boarded patients | Across 3M patients | Calculation inputs |
| --- | ---: | ---: | --- |
| 4 hours | ~$1.4M | ~$430M | $863/24 hours [9]; 3M patients [2] |
| 8 hours | ~$2.9M | ~$860M | $863/24 hours [9]; 3M patients [2] |
| 12 hours | ~$4.3M | ~$1.3B | $863/24 hours [9]; 3M patients [2] |

These calculations use observed per-day cost differences and national boarding volume to show the scale of direct-cost exposure. They exclude major indirect costs, including lost ED capacity, ambulance delays, and downstream hospital throughput, so they represent only one part of the value BoardX can help protect.

### National TAM: a transparent planning model

BoardX has a multi-billion-dollar U.S. opportunity. The model below combines public market-size inputs with enterprise pricing scenarios and shows both the initial boarded-patient wedge and the broader continuity-platform opportunity.

| TAM method | Public input | Pricing hypothesis (not evidence) | Illustrative national TAM | Source for public input |
| --- | ---: | ---: | ---: | --- |
| BoardX facility license, initial enterprise case | ~4,880 hospitals with on-campus EDs (80% of 6,100 U.S. hospitals) | $250K per hospital/year | **~$1.22B/year** | [10], [11] |
| BoardX facility license, high-value workflow case | ~4,880 hospitals with on-campus EDs | $500K per hospital/year | **~$2.44B/year** | [10], [11] |
| BoardX facility license, major-system deployment case | ~4,880 hospitals with on-campus EDs | $750K per hospital/year | **~$3.66B/year** | [10], [11] |
| Boarded-patient volume cross-check | ~3M admitted ED visits with waits >=4 hours/year | $500 per boarded episode | **~$1.5B/year** | [2] |
| Platform expansion: all ED-to-inpatient transitions | ~21M annual ED-origin admissions (directional calculation: 35.7M annual U.S. admissions × 59.1%) | $200 per transition | **~$4.2B/year** | [10], [13] |
| Platform expansion: all ED-to-inpatient transitions | ~21M annual ED-origin admissions | $300 per transition | **~$6.3B/year** | [10], [13] |

The first market is high-volume, urban, academic, and system-affiliated hospitals where boarding burden and integration readiness are highest. BoardX's initial boarded-patient workflow supports a **$1.2B–$3.7B** U.S. TAM. The same infrastructure naturally expands into a **$4.2B–$6.3B** ED-to-inpatient continuity platform.

## 5. The BoardX wedge

### The problem statement

> Once a patient is admitted but remains in the ED, new information continues to arrive while the patient moves between teams, handoffs, and competing priorities. There is no reliable shared mechanism to connect what changed to the plan, determine whether it matters, and ensure the right person closes the loop.

### Product boundary

> BoardX makes every hour of boarding safer and more coordinated by turning fragmented clinical information into a clear, clinician-supervised next step.

### What success looks like

- A continuously updated, evidence-linked patient story: why the patient came in, why they are admitted, what changed, what is pending, and what needs attention.
- Fewer missed or delayed acknowledgements of clinically important new results.
- Less handoff drift across a prolonged ED-to-inpatient transition.
- Clearer clinician ownership and a reviewable next action for high-value safety signals.
- High signal-to-noise: the clinician can dismiss, edit, or approve every proposed action.

## 6. Suggested pitch language

> Millions of admitted patients board in U.S. emergency departments each year. Longer boarding is associated with more errors, delays, and adverse outcomes. BoardX is a clinician-supervised continuity agent that keeps the patient story current, identifies meaningful changes and unfinished loops, and helps the care team close them safely.

## Sources

1. Centers for Disease Control and Prevention. [Emergency Department Visit Rates by Selected Characteristics: United States, 2022](https://stacks.cdc.gov/view/cdc/159284/cdc_159284_DS1.pdf).
2. Associated Press / Side Effects Public Media. [A look at ER boarding in the U.S.](https://apnews.com/article/f906664b9c47ea603c9a49b99efbe36e). Reports an analysis finding ~3M admitted ED visits with waits >=4 hours in 2022.
3. Emergency Department Benchmarking Alliance data, reproduced in [federal supporting materials](https://www.reginfo.gov/public/do/eoDownloadDocument?documentID=215995&eodoc=true&pubId=). 2022 preliminary national boarding-time benchmarks.
4. Singer AJ, Thode HC, Viccellio P, Pines JM. [The association between length of emergency department boarding and mortality](https://pubmed.ncbi.nlm.nih.gov/22168198/). *Academic Emergency Medicine*. 2011.
5. [Emergency Department Boarding, Crowding, and Error](https://pubmed.ncbi.nlm.nih.gov/40492209/). *American Journal of Emergency Medicine*. 2025.
6. [Inpatient boarding in the emergency departments and clinical outcomes: A propensity-matched study](https://pubmed.ncbi.nlm.nih.gov/41016086/). 2025.
7. [Outcomes of boarding critically ill patients in U.S. EDs: A systematic review and meta-analysis](https://pubmed.ncbi.nlm.nih.gov/41151219/). 2025.
8. Agency for Healthcare Research and Quality. [Summit to Address Emergency Department Boarding](https://www.ahrq.gov/sites/default/files/wysiwyg/topics/ed-boarding-summit-report.pdf). 2024.
9. [Measurement of Cost of Boarding in the Emergency Department Using Time-Driven Activity-Based Costing](https://www.sciencedirect.com/science/article/pii/S019606442400221X). 2024.
10. American Hospital Association. [Fast Facts on U.S. Hospitals, 2026](https://www.aha.org/statistics/fast-facts-us-hospitals). Reports 6,100 U.S. hospitals, using FY 2024 AHA Annual Survey data.
11. American Hospital Association. [Coalition report highlights the unique role of hospitals](https://www.aha.org/news/headline/2024-10-25-coalition-report-highlights-unique-role-hospitals). Reports that 80% of U.S. hospitals have an on-campus ED.
12. [Patient and staff safety implications of emergency department boarding: a systematic review](https://pmc.ncbi.nlm.nih.gov/articles/PMC13167025/). 2025.
13. Agency for Healthcare Research and Quality, HCUP. [Costs of Treat-and-Release Emergency Department Visits in the United States, 2021](https://hcup-us.ahrq.gov/reports/statbriefs/sb311-ED-visit-costs-2021.pdf). Reports that 59.1% of hospital inpatient stays in 2021 included ED services before admission.
