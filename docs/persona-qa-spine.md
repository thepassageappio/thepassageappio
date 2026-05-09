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

## Persona QA Scores

| Persona | Current Score | What Works | Remaining Demo Risk |
| --- | ---: | --- | --- |
| Warm path family / hospice-adjacent | 8.6 | Clear continuity story; now saves a real workspace and known lifecycle dates. | Needs smoother transition from warm workspace to red activation and funeral-home handoff approval. |
| Red path family | 8.8 | Urgent triage, one-next-action framing, task explanations. | Still needs fewer visible modules after activation on small screens. |
| Green path planner | 8.4 | Calm setup and planning file direction. | Payoff needs to feel more like "my family is protected" and less like data entry. |
| Funeral-home director | 8.9 | Dashboard, risk/attention, case work, packets, import/export, calls avoided. | Demo needs one guided linear story that proves time saved without explanation. |
| Funeral-home employee | 8.2 | Staff setup and assigned-work concepts exist. | My Work should be the default daily surface with service date/context pinned. |
| Participant/helper | 8.6 | Demo mode, scoped task, note/proof, waiting/help responses. | First-time invite landing still needs stronger "why you are here" and single action focus. |
| Vendor | 8.5 | Scoped request, urgency, accept/in-progress/complete/decline loop. | Quote/scheduling/payment next steps are intentionally thin and need future structure. |
| Demo operator | 8.7 | Demo studio, live product links, warm path, packets, vendor demo. | Demo steps must always open the exact product moment and avoid dead buttons. |

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
5. Mobile density pass: estate task spine and funeral-home case work should keep one pane active instead of stacking every support detail.
