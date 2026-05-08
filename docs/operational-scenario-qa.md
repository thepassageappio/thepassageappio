# Passage Operational Scenario QA

This is the sprint pressure-test script for the task/communication/proof spine. Every demo-readiness pass should walk these scenarios without sending real email/SMS or mutating production data unless explicitly approved.

## Research Notes To Keep

- Incident-management systems separate internal coordination from external stakeholder updates, but keep both tied to the same incident/status truth.
- Roles matter: someone owns communication, someone owns execution, and status updates must show who is currently responsible.
- Assignment should drive notification, but notification should never be the only record of assignment.
- Audit/activity history is not a developer log; it is how operators and families trust that work happened.
- Progressive disclosure matters: operators can tolerate density; families need one visible next action and reassurance.

## Shared Spine Questions

Every scenario must answer:

- What is the clearest next action?
- Who owns it now?
- Who is waiting on whom?
- What did Passage prepare for review?
- What communication happened or is prepared?
- What proof exists?
- Who was notified, by what channel, and what fallback happened?
- Is this an audit/status event, a notification delivery, or an actual coordination message?
- What can each role see?
- What changed in reports/export?

## Scenario 1: Funeral Director Day-To-Day

Path:

1. Director opens funeral-home dashboard.
2. Sees cases by attention, not by generic list order.
3. Opens the oldest/highest-risk case.
4. Assigns staff to one task.
5. Requests missing family information on another task.
6. Reviews proof saved by staff or participant.
7. Exports/report shows calls avoided, waiting items, and handled work.

Must feel:

- Enterprise-clean, practical, restrained.
- "This reduces repeated calls and staff memory."
- Director sees all work, waiting states, escalations, staff queue, and ROI.

Failure signs:

- Director has to hunt for what matters.
- Assignment does not produce proof/audit.
- Family request feels like a disconnected email.
- Report/export does not reflect the work.

## Scenario 2: Funeral Home Employee Managing Assigned Work

Path:

1. Employee signs in.
2. Lands on assigned work first, not the whole business dashboard.
3. Opens one task with case context.
4. Sees what Passage prepared, what family will see, and proof requirement.
5. Marks waiting/needs help/handled.
6. Director and family-facing status update appropriately.

Must feel:

- Quiet queue, no case overload.
- Employee understands exactly what to do and what not to expose.

Failure signs:

- Employee sees too many unrelated cases.
- Internal note leaks into family-facing status.
- Completion feels like a checkbox rather than reassurance/proof.

## Scenario 3: Family Responding To Funeral Home Request

Path:

1. Family coordinator receives or opens a request for missing info.
2. Sees why it is needed and who requested it.
3. Provides info/document/approval.
4. Funeral home sees response.
5. Family sees status change from waiting to handled/in progress.

Must feel:

- "They asked once, I answered once, everyone sees it."
- Email is official/default; SMS is only opt-in/urgent.

Failure signs:

- Family cannot tell whether reply was received.
- Funeral home must still call to confirm.
- The request is not tied to a task.

## Scenario 4: Family Delegated A Task

Path:

1. Coordinator assigns a family member a task.
2. Passage records assignment and prepares notification.
3. Assignee lands on one responsibility.
4. Assignee accepts, asks for help, marks waiting, or saves proof.
5. Coordinator sees update and proof.

Must feel:

- Clear, private, scoped.
- No one has to understand the whole estate to help.

Failure signs:

- Invite opens a dashboard instead of the task.
- The assignee cannot see enough context.
- Coordinator cannot tell whether the assignee accepted.

## Scenario 5: Participant Added To A Task

Path:

1. Coordinator/funeral home adds lawyer, pastor, executor, pallbearer, or helper.
2. Participant receives scoped task context.
3. Participant provides confirmation, blocker, note, or proof.
4. Event rolls up to estate/funeral-home communication trail.

Must feel:

- Minimal disclosure, enough context.
- Participant action updates the same spine.

Failure signs:

- Participant is treated like a full account owner.
- Their update lives only in participant page.
- Funeral home/family cannot see the relevant confirmation.

## Scenario 6: Red Path User

Path:

1. User chooses situation: unexpected home, hospice, hospital, care facility, expected at home, or past first steps.
2. Passage gives immediate authority guidance first.
3. Passage activates coordination only after the first real-world step is clear.
4. User sees one next action, owner, communication/proof, and what can wait.

Must feel:

- Guided incident response for families.
- Directive without pretending to be emergency/legal/medical authority.

Failure signs:

- Account setup before useful guidance.
- Too many tasks at once.
- No clear boundary around 911/hospice/facility/coroner/funeral home.

## Scenario 7: Green Path User

Path:

1. User starts planning ahead.
2. Passage frames the work as making things easier for loved ones.
3. User creates estate workspace.
4. Tasks prepare future family clarity: contacts, wishes, documents, notification preferences, proof destinations.
5. Activation/trigger path is visible but not alarming.

Must feel:

- Calm preparation, not mortality overload.
- Everything lives inside an estate.

Failure signs:

- Green path feels like urgent death workflow.
- Wishes/documents/memories float outside estate context.
- Next action is vague.

## Scenario 8: Vendor Receives Request For Quote/Service

Path:

1. Family or funeral home requests local support from inside a task.
2. Vendor receives task-linked request, not a marketplace lead blast.
3. Vendor views context, accepts/declines/quotes/in progress/completed.
4. Family and funeral home see status without salesy directory behavior.
5. Report tracks request/status/value when relevant.

Must feel:

- Natural, grief-aware, non-salesy.
- "Trusted local help if wanted."

Failure signs:

- Vendor flow feels like shopping.
- Vendor status is not tied to task proof.
- Funeral home cannot curate/prefer/hide vendors.

## Next QA Gates

- Use the shared orchestration helper in participant and vendor surfaces, not only family/funeral-home.
- Use the shared communication router for reminders, provider delivery webhooks, and notification fallback.
- Add a non-production demo account/state that can run the full loop safely.
- Capture screenshots for desktop and mobile for each scenario.
