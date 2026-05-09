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

Backend, schema, orchestration, import/export, notification, or task-spine work is not complete until the matching frontend persona surfaces are assessed. At minimum, run route smoke plus desktop and mobile visual QA for every persona affected by the change. If the backend creates richer truth, the frontend must translate it into the right amount of visible truth for that role instead of rendering every proof/detail panel at once.

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
| Funeral-home employee | 8.5 | Staff setup, assigned-work concepts, My Work default for non-directors, action dialogs, output/proof language. | Employee onboarding must reliably land on assigned work with service context, role scope, and first proof action. |
| Participant/helper | 8.8 | Demo mode, scoped task, note/proof, waiting/help responses, loop state, quieter non-primary planning prompt. | First-time invite landing must remain one responsibility, one proof path, and clear privacy scope. |
| Vendor | 8.7 | Scoped request, urgency, request/view/accept/in-progress/complete/decline loop, visible handoff spine. | Quote/scheduling/payment next steps are intentionally thin and need future structure. |
| Demo operator | 9.0 | Demo studio, live product links, warm path, packets, vendor demo, production-readiness level set. | Needs scripted screenshot/mobile QA so demos are not dependent on memory. |

## Current Readiness Level

| Gate | Status | Meaning |
| --- | --- | --- |
| Mission lock | Strong | Passage is now consistently presented as family continuity infrastructure, with institutions rotating through the family record. |
| Orchestration believability | Medium-high | The product now has the right spine; the next bar is whether tasks feel authoritative, trusted, and useful enough for a Monday-morning pilot. |
| Founder-led demo | Ready | The nine-stop loop is coherent enough for controlled funeral-home and family beta conversations. |
| Small pilot | 2-4 focused sprints | Needs repeatable persona QA, pilot operator onboarding, delivery/error audit checks, and mobile density review. |
| Broader production | 6-10 focused sprints | Needs observability, support operations, data repair tools, deeper outputs, and legal/trust finalization before broader acquisition. |

## Most Important Remaining Work

These are the remaining gaps to keep Passage aligned with the mission: a calm authoritative coordination layer for families, with institutions rotating through one persistent family record. The current goal is not to "finish the product"; it is to make the orchestration feel real and trustworthy enough that a pilot funeral home believes Passage reduces chaos.

1. Orchestration believability: every task must feel like guided coordination, not a checklist row. It should show authority, owner, request, expected response, proof, waiting state, and what happens next.
2. Task authority layer: every task must explain what it is, why it matters, who usually handles it, whether it needs attention now, what Passage can prepare, and how to ask for help when the family is overwhelmed.
3. Red-path first three minutes: the urgent flow should stabilize first, then coordinate, then organize. Avoid making grieving users configure software before they see the next safe action.
4. Trust posture: make privacy, permissions, audit trail, who-can-see-what, document visibility, export ownership, and human support easier to find without turning core workspaces into policy pages.
5. Participant simplicity: invited helpers should feel asked to help, not invited into software. One role, one action, one proof path, one coordinator update.
6. Family/operator separation: family views should be emotionally paced and dramatically simpler; director and staff views should be operational, workload-aware, and proof-focused.
7. Role clarity: director, staff, family coordinator, invited participant, vendor, and demo/admin surfaces should each show their own work queue and proof obligation.
8. Output generation: keep deepening useful prepared outputs now, then add persistent packet storage, PDF generation, and packet email only after owner approval for schema and live-send behavior.
9. Notification truth: assignment and participant onboarding should route attention with clear delivery/skipped/failed states, but never imply an email or SMS was sent unless a provider actually accepted it.
10. Timeline orientation: families understand journeys better than task databases, so major surfaces should increasingly show where they are across Green -> Warm -> Red -> Funeral -> After.
11. Linear demo loop: demo data and guided steps must tell Green -> Warm -> Red -> Funeral Home -> After with visible DEMO DATA boundaries and no hidden operator narration.
12. Pilot instrumentation: track waiting age, owner latency, proof completion, failed notification attempts, delivered notification attempts, tasks closed, outputs prepared, exports generated, and calls avoided.
13. No-silo output surfaces: announcements, event one-pagers, packets, vendor requests, and partner exports must read as prepared artifacts from the family record, not standalone tools.
14. Onboarding as spine handoff: participant invites and employee setup must land people on the exact work they own, show what they can see, and create proof without requiring them to understand every Passage module.
15. First-day pilot setup: funeral homes, vendors, future hospice locations, assisted-care teams, employees, participants, and red/green family members all need a role-specific launch rail that answers: who am I, what can I see, what do I set up once, what is my first real action, and how does proof return to the family record.

Owner approval is still required before production SQL, material legal/privacy changes, pricing changes, real email/SMS sends, or irreversible production data changes.

## Repeatable Pilot QA Run

Run this after any sprint that touches task, communication, proof, demo, or role-specific surfaces.

| Step | Route | Persona | Pass condition |
| --- | --- | --- | --- |
| 1 | `/hospice` | Warm-path family | Above the fold answers what happens now, who owns it, what is waiting, and how proof will be known. Saving continues the family record and must not send email/SMS. |
| 2 | `/?dashboard=1` | Family estate spine | User lands on one selected estate record with a next move, owner/waiting/proof signal, and an estate switcher only when multiple records exist. |
| 3 | `/estate` | Family command center | Selected task shows next move, owner, waiting state, proof destination, output, and one primary workspace action. Green/red family members should see what to set up once and what can wait. |
| 4 | `/funeral-home/dashboard` | Director | Dashboard shows active cases, waiting responses, staff/workload signal, calls avoided, next case focus, and export trust. |
| 5 | `/funeral-home/dashboard?staff=1` | Staff/operator onboarding | Employee lands on My work / assigned-first mode with case context, service timing, role scope, and direct waiting/request/proof actions. |
| 6 | `/participating?demo=1` | Participant/helper onboarding | Participant sees only assigned work, understands why they are there, and can accept, mark waiting, handle, or ask for help without seeing the whole estate. |
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
6. First-day pilot launch rail: make every B2B partner start from a guided setup path with two case-loading branches: import existing records by CSV or create the first family record fresh in UI.
