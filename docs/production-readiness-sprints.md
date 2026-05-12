# Passage Production Readiness Sprints

This plan is the operating loop for moving Passage from founder-led demo confidence to controlled production pilot readiness. Each sprint must finish with build, visual QA, deployment, production smoke, and a short grade against the mission: one next move, one owner, one proof trail, one family continuity record.

## P0 Addendum - Self-Service Partner Launch, Family Handoff, And Organic Pipeline

Goal: a funeral home, family, employee, vendor, hospice location, or care facility should not need Steve to explain how they get invited, set up, receive work, hand work off, or keep using the family record. This is now a production-readiness blocker, not a later growth idea.

Scope:
- Passage admin can invite a funeral-home owner/director with a reviewed Passage email that sends them to first-day setup.
- Funeral-home owner/director can complete first-day setup from one management pane: co-branded family view, locations, employees, role permissions, case import/create, family handoff, and reporting.
- Employee and vendor creation always leads to a reviewed invite step: save person -> review invitation -> send email -> recipient signs in -> lands in the right role-native workspace.
- Families invited by funeral homes land in a co-branded family command center, understand what the funeral home can see/do, and retain ownership of the durable family record after funeral-home work is complete.
- Direct red/green families can search for or request a funeral home from inside the estate spine. Partner funeral homes receive warm inbound requests in their dashboard; non-partner funeral-home requests create a Passage admin lead queue for outreach.
- Funeral-home search/request flows must use a shared smart-address pattern with normalized name, address, city, state, zip, country, phone, website, and external place id when available. The same address component should be reused for funeral homes, locations, vendors, hospice, and care facilities.
- Funeral-home reporting includes pipeline and ROI: warm inbound requests, accepted family handoffs, tasks completed, response time, calls avoided, case value, location metrics, employee metrics, exports, and source data labels.
- Co-branding appears consistently on family invites, employee invites, family command center, packet outputs, reports, and post-service continuity prompts.

Acceptance:
- No partner onboarding screen relies on copy/paste-only instructions when an email invite is the expected action.
- No user sees internal language such as "say", "demo-safe", "billing metadata not linked", or Passage-only setup notes on an external-facing screen.
- A family can add/request a funeral home, the request is tracked, and a partner funeral home or Passage admin can see and act on it.
- A funeral home can invite a family, move a task, save proof, and then hand the ongoing family record back to the family without implying the record closes when the service ends.
- Role permissions are explained in plain language for director/admin, location manager, staff, family coordinator, participant, vendor, hospice/care-team user, and Passage system admin.
- Any backend persistence change has a matching frontend surface that shows state, next action, and proof.
- Desktop 100 percent Chrome and mobile QA cover the full loop: partner invite -> setup -> employee invite -> case create/import -> family invite -> task owner assignment -> output/proof -> report -> post-service continuity.

## Sprint 1 - First-Day Setup And Role-Native Onboarding

Goal: a signed pilot partner, employee, vendor, participant, red-path family, and green-path planner should know what to do first without a founder narrating the product.

Scope:
- Funeral home first-day setup: workspace, locations/case source, employees, roles, case import/create, first owner, proof/export.
- Staff first login: assigned work first, not director dashboard.
- Participant first visit: one responsibility, one answer, one update back to coordinator.
- Vendor first application/request: task-native support, scoped request, no family-record browsing.
- Demo studio: explicit contract-to-first-proof path.

Acceptance:
- Every onboarding surface answers: what now, who owns it, what is waiting, how proof returns.
- No real email/SMS in demo mode.
- No production record mutations in demo flows.
- Mobile and 100 percent desktop Chrome stay readable without horizontal overflow.

## Sprint 2 - Task, Action, Proof, And Dialog Consistency

Goal: all action surfaces feel like the same system.

Scope:
- Case creation, task action, participant action, vendor response, staff setup, and export/import use consistent focused dialogs or bounded panels.
- Action buttons replace or resolve in place instead of stacking long panels.
- Task actions produce output, waiting state, proof destination, and next expected update.
- Participant and staff use the same conceptual task spine, with role-native complexity.

Acceptance:
- A task can be assigned, blocked, marked waiting, proof-recorded, and exported with visible proof.
- The family view stays simpler than operator views.
- Dialogs close predictably via close button, backdrop, and Escape where appropriate.

## Sprint 3 - Trust, Permissions, Outputs, Reporting

Goal: the product feels safe enough for death, legal, family, and institutional coordination.

Scope:
- Permission explanations: who can see what, why data is requested, what stays private.
- Audit/proof language visible in family, participant, partner, vendor, and admin/demo views.
- Outputs: prepared summaries, family updates, packets, CSV export, vendor status trail.
- Reporting: director can explain calls avoided, waiting items, task owners, export portability.

Acceptance:
- No unknown state masquerades as done.
- Demo outputs are copyable/downloadable without sending live messages.
- Production legal/privacy claims remain plain-language and not overpromised.

## Sprint 4 - Full Visual QA, Production Smoke, And Pilot Grade

Goal: Passage is ready for founder-led funeral-home pilots and honest hospice/senior-living discovery conversations.

Scope:
- Walk every persona flow visually: family red path, green path, participant, funeral director, staff, vendor, system admin/demo.
- Desktop and mobile screenshots for touched surfaces.
- Build, deploy, production smoke for core routes and demo loop.
- Grade readiness by persona and list remaining blockers.

Acceptance:
- Founder can demo funeral-home pilot loop end to end without caveats beyond known pilot constraints.
- Hospice and senior living are positioned as discovery/next wedge, not sold as production-ready modules.
- Remaining work is prioritized into production pilot blockers vs broader scale work.

## Follow-On Loop - Outputs, Delivery Safety, Instrumentation

Goal: make the pilot feel operationally real without widening scope.

Shipped:
- Continuity packet outputs now show packet status, approval boundary, proof path, copy, print/PDF, and downloadable text artifacts.
- Email and SMS delivery routes now support authenticated dry runs for QA. Dry runs return preview payloads and do not call Resend, Twilio, fallback email, or production record mutations.

Next:
- Add controlled live-send QA only after owner approval, using approved test recipients and clear production logging.
- Add instrumentation around case creation, task movement, participant acceptance, packet download, export, and vendor response.
- Turn pilot readiness into a small internal checklist per partner: setup complete, first case loaded, first owner assigned, first proof saved, first export downloaded, first notification dry-run verified.
