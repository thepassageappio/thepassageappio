# Passage Persona QA Spine

Last updated: May 9, 2026

Use this as the recurring QA rail for every sprint. The question is not whether a screen has features. The question is whether each person sees one calm next action, understands who owns it, and knows how proof will be recorded.

## Core Loop

Estate / case -> task -> owner -> communication -> proof -> status -> reporting.

Every persona must be a different slice of the same truth:

- Family sees reassurance, next action, what is waiting, and what changed.
- Funeral-home director sees risk, workload, staff ownership, family visibility, and ROI.
- Funeral-home staff sees assigned work, case context, service timing, and the proof field.
- Participant sees only the delegated responsibility and how to respond.
- Vendor sees only the scoped request, urgency, and response loop.
- Passage admin sees demo readiness, imports, exports, vendor approvals, and support intake.

## Decision Consistency Rule

Every product decision must make sense across the whole spine, not only the page being edited.

Before shipping a UI or workflow change, check:

1. Family view: does it reduce anxiety and show one next move?
2. Participant view: does it keep the role scoped to one responsibility?
3. Funeral-home director view: does it improve workload, risk, and reporting clarity?
4. Funeral-home staff view: does it show assigned work, case context, and proof?
5. Vendor view: does it stay task-native and avoid marketplace browsing?
6. Demo/admin view: does it still tell the Green -> Warm -> Red -> Funeral -> After story truthfully?
7. Lifecycle spine: does it preserve handoff continuity instead of creating a separate product island?

## Persona QA Scores

| Persona | Current Score | What Works | Remaining Demo Risk |
| --- | ---: | --- | --- |
| Warm path family / hospice-adjacent | 8.8 | Clear continuity story; starts the same family record, captures known lifecycle dates, and now shows the spine above the fold. | Needs smoother transition from warm state to red activation and funeral-home handoff approval. |
| Red path family | 8.8 | Urgent triage, one-next-action framing, task explanations. | Still needs fewer visible modules after activation on small screens and a more explicit hospice-to-red conversion. |
| Green path planner | 8.4 | Calm setup and planning file direction. | Payoff needs to feel more like "my family is protected" and less like data entry. |
| Funeral-home director | 9.0 | Dashboard, risk/attention, one-pane case work, packets, import/export, calls avoided, and next lifecycle date. | Needs first-day pilot path to be unmistakable without Codex/operator narration. |
| Funeral-home employee | 8.3 | Staff setup, assigned-work concepts, action dialogs, output/proof language. | My Work should be the default daily surface with service date/context pinned. |
| Participant/helper | 8.7 | Demo mode, scoped task, note/proof, waiting/help responses, loop state. | First-time invite landing still needs stronger "why you are here" and single action focus. |
| Vendor | 8.7 | Scoped request, urgency, request/view/accept/in-progress/complete/decline loop, visible handoff spine. | Quote/scheduling/payment next steps are intentionally thin and need future structure. |
| Demo operator | 9.0 | Demo studio, live product links, warm path, packets, vendor demo, production-readiness level set. | Needs scripted screenshot/mobile QA so demos are not dependent on memory. |

## Current Readiness Level

| Gate | Status | Meaning |
| --- | --- | --- |
| Mission lock | Strong | Passage is now consistently presented as family continuity infrastructure, with institutions rotating through the family record. |
| Founder-led demo | Ready | The nine-stop loop is coherent enough for controlled funeral-home and family beta conversations. |
| Small pilot | 2-4 focused sprints | Needs repeatable persona QA, pilot operator onboarding, delivery/error audit checks, and mobile density review. |
| Broader production | 6-10 focused sprints | Needs observability, support operations, data repair tools, deeper outputs, and legal/trust finalization before broader acquisition. |

## Most Important Remaining Work

These are the remaining gaps to keep Passage aligned with the mission: a calm authoritative coordination layer for families, with institutions rotating through one persistent family record.

1. Task authority layer: every task must explain what it is, why it matters, who usually handles it, whether it needs attention now, what happens next, what Passage can prepare, and how to ask for help when the family is overwhelmed.
2. Red-path first three minutes: the urgent flow should stabilize first, then coordinate, then organize. Avoid making grieving users configure software before they see the next safe action.
3. Family/operator separation: family views should be emotionally paced and dramatically simpler; director and staff views should be operational, workload-aware, and proof-focused.
4. Trust posture: make privacy, permissions, audit trail, who-can-see-what, document visibility, export ownership, and human support easier to find without turning core workspaces into policy pages.
5. Role clarity: director, staff, family coordinator, invited participant, vendor, and demo/admin surfaces should each show their own work queue and proof obligation.
6. Output generation: keep deepening useful prepared outputs now, then add persistent packet storage, PDF generation, and packet email only after owner approval for schema and live-send behavior.
7. Notification truth: assignment and participant onboarding should route attention with clear delivery/skipped/failed states, but never imply an email or SMS was sent unless a provider actually accepted it.
8. Linear demo loop: demo data and guided steps must tell Green -> Warm -> Red -> Funeral Home -> After with visible DEMO DATA boundaries and no hidden operator narration.
9. Pilot instrumentation: track waiting age, owner latency, proof completion, failed notification attempts, delivered notification attempts, tasks closed, outputs prepared, exports generated, and calls avoided.
10. No-silo output surfaces: announcements, event one-pagers, packets, vendor requests, and partner exports must read as prepared artifacts from the family record, not standalone tools.

Owner approval is still required before production SQL, material legal/privacy changes, pricing changes, real email/SMS sends, or irreversible production data changes.

## Repeatable Pilot QA Run

Run this after any sprint that touches task, communication, proof, demo, or role-specific surfaces.

| Step | Route | Persona | Pass condition |
| --- | --- | --- | --- |
| 1 | `/hospice` | Warm-path family | Above the fold answers what happens now, who owns it, what is waiting, and how proof will be known. Saving continues the family record and must not send email/SMS. |
| 2 | `/?dashboard=1` | Family estate spine | User lands on one selected estate record with a next move, owner/waiting/proof signal, and an estate switcher only when multiple records exist. |
| 3 | `/estate` | Family command center | Selected task shows next move, owner, waiting state, proof destination, output, and one primary workspace action. |
| 4 | `/funeral-home/dashboard` | Director | Dashboard shows active cases, waiting responses, staff/workload signal, calls avoided, next case focus, and export trust. |
| 5 | `/funeral-home/dashboard?demoStep=task` | Staff/operator | One task can be advanced through request family info, waiting, or proof without stacked panels. |
| 6 | `/participating?demo=1` | Participant/helper | Participant sees only assigned work and can accept, mark waiting, handle, or ask for help. |
| 7 | `/vendors/request?demo=1` | Vendor | Vendor sees scoped request, owner/waiting/proof loop, and demo actions do not touch live records. |
| 8 | `/share?dn=Eleanor%20Price&cn=Price%20family` | Family coordinator | Event one-pager and copy outputs are framed as family-record artifacts and prepared/saved only; nothing claims sent/published without a provider send. |
| 9 | `/system/demo` | Demo operator | Nine product moments, readiness level set, and next sprint queue match current product behavior. |

## P0 QA Checklist

- Does the page answer "what do I do now?" in five seconds?
- Is there one primary action, not a vertical pile of competing panels?
- Does the action produce something: message, packet, proof, owner, waiting state, or export?
- Are messages, notifications, and audit/proof separated?
- If a date is unknown, is it captured as a visible missing item instead of blocking progress?
- If a date is known, does it affect task priority and family/event outputs?
- Does the demo path use safe dummy behavior where appropriate?
- Did build pass and did production smoke return 200 for touched pages?

## Next Sprint Candidates

1. Staff daily queue: make "My assigned work" the employee-first surface with service date, urgency, and next proof field pinned.
2. Warm -> red activation: convert a warm-path workspace into urgent/red mode without rebuilding the family record.
3. Family event broadcast: make the event one-pager and recipient batch accessible from estate/funeral-home task work, with no live sends.
4. Demo rail hardening: each step should open and scroll to the exact product moment, with visible confirmation when actions are demo-only.
5. Mobile density pass: estate operating spine, estate switcher, and funeral-home case work should keep one pane active instead of stacking every support detail.
