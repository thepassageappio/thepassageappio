# Unified Task Spine Rebuild Plan

## Product Thesis

Passage should not feel like a checklist, project board, vendor directory, or collection of cards. It should feel like an operating system for a life-to-death transition:

- one estate/case
- one active next action
- one owner
- one prepared output or instruction set
- one communication trail
- one proof trail
- one status truth across family, participants, funeral homes, employees, vendors, and Passage admins

The external promise from the current sell sheet and investor one-pager is now the acceptance bar:

- Families get one calm command center before, during, and after a death.
- Funeral homes reduce repeated "what's next?" calls.
- Staff can act on behalf of families without losing proof.
- Case status is shared instead of trapped in voicemails, texts, and staff memory.
- Tasks and communication are logged as they happen.
- Passage sits on top of existing funeral-home workflows, with exportable data and no migration burden.
- Participants, vendors, family, and staff each get only the slice they need.

If a demo path does not prove these claims end to end, it is not demo-ready.

## Research Pressure Test

Current SaaS onboarding guidance points in the same direction: reduce time to value, avoid dumping users into feature tours, and route each role to the first meaningful action. For Passage, the first value moment is not "create a task." It is "Passage tells me what happens next, who owns it, and what proof will show it happened."

Vendor/RFQ workflow patterns also support the Passage model: requests and responses should stay linked to the original work item, collect responses centrally, and avoid making the user chase separate vendor threads. For grief-sensitive work, that means vendors only appear inside a relevant task and only as "trusted local help if wanted," never as a sales directory.

## Operational Calm QA Lens

The May 2026 deep QA/audit is a useful product lens, not a detour from the main sprint. Keep what supports the spine; ignore anything that pulls Passage back into generic polish or feature sprawl.

- Passage wins as a crisis coordination and family/funeral-home operating layer, not as a memorial, AI, or feature-volume product.
- The strongest category line is "the calm coordination layer for everything families must manage after a death."
- Every first-run path must reduce cognitive load. A grieving user should not feel like they are configuring software.
- The red path must behave like guided incident response for families: situation triage, immediate authority guidance, then coordination activation.
- The green path must feel like making things easier for loved ones, not mortality branding.
- Funeral-home screens must feel restrained, practical, and enterprise-clean: fewer repeated calls, clearer owner/status/proof, data export, and visible ROI.
- Mobile is a first-class QA gate because real family coordination happens on phones.
- Trust must be visible: role permissions, data ownership, audit trail, export confidence, and plain security language.
- Design-system hardening is not cosmetic. Inconsistent spacing, cards, buttons, empty states, and modal behavior create perceived fragility.

The next gains should come from orchestration clarity: one owner, one next action, one communication/proof trail, and one status truth across funeral-home B2B, red-path family, green-path planning, participants, and vendors.

## Spine Contract

Every task-facing surface must render the same fields:

- Owner
- Recipient/contact
- Execution mode
- Prepared output
- Message/request state
- Proof destination
- Status
- Last actor/time
- Next action
- Visibility after save

## Communication Engine Contract

Communication is part of the task spine, not a separate inbox bolted onto the product.

Every assignment, sent message, copied message, staff update, participant update, vendor request, quote/status change, proof save, waiting state, help request, failed notification, and reminder should become a communication/audit event with:

- estate/case id
- task id
- actor and actor role
- recipient/contact and recipient role
- channel: in-app, email, sms, phone, copied message, vendor portal, staff note, system
- event type: assigned, sent, delivered, viewed, accepted, waiting, help, quoted, in progress, completed, declined, failed, proof saved
- message/output/proof body or summary
- timestamp
- visibility: family, funeral home, staff/internal, participant, vendor, system
- next action implied by the event

Each role should see the same truth with scoped detail:

- Family sees what was asked, who owns it, what is waiting, what the funeral home/staff/vendor recorded, and what proof exists.
- Funeral home director sees all family-facing and staff/internal communication for the case, plus reports.
- Funeral home employee sees assigned task context, family requests they are allowed to handle, and their own audit trail.
- Participant sees their assignment, their updates, and coordinator-visible confirmations.
- Vendor sees only the task-native request and their response/status trail.
- Passage admin sees demo/system QA events and provider failures.

No communication should be trapped only inside a modal, a vendor page, a participant page, or a funeral-home card. It must roll up to the estate communication/proof spine and down to the relevant role-specific view.

### Communication, Notification, and Audit Are Separate

Do not conflate these three layers:

- Audit/status trail: immutable record of what happened, who acted, when, current task truth, and proof. This is the source of operational trust.
- Notification delivery: channel attempt/result for getting attention: in-app, email, SMS, copied message, provider status, fallback, skipped reason. This is not the conversation itself.
- Communication thread: human coordination around the task/case: asks, replies, clarifications, approvals, vendor quote/status, staff-family updates. This is how work moves without scattered calls.

They must be linked by estate/case id, task id, actor, recipient, and timestamp, but they should not appear as one undifferentiated log to users.

User-facing surfaces should separate them:

- "Current status" answers what is true now.
- "Conversation" answers what people are coordinating.
- "Proof" answers how we know it happened.
- "Notification" answers who was alerted and whether delivery worked.

Implementation rule:

- Product-facing APIs return `coordinationSpine`, not a flattened communication feed.
- `coordinationSpine.conversation` contains human asks, replies, clarifications, approvals, participant updates, and vendor statuses.
- `coordinationSpine.proof` contains audit/status truth and estate proof events.
- `coordinationSpine.notifications` contains delivery attempts/results and provider failures.
- `coordinationSpine.attentionItems` is the role-scoped "look here now" inbox derived from those layers.
- UI should never make users infer whether an item is a conversation, proof, or notification from a generic activity row.

Attention hierarchy:

- Urgent: failed delivery, blocked work, needs-review, declined request.
- Waiting: family response, vendor response, pending request, sent message.
- Assigned: a named person owns the next action.
- Proof/update: reassurance only, not primary work.
- Family surfaces should show the one clearest item and hide mechanics. Operator surfaces can show more items, but must label why each item deserves attention.

### Communication Spine Model

Every meaningful coordination update starts from one of five verbs:

- Assign: someone becomes responsible for the next action.
- Ask: someone needs information, approval, documents, or a decision.
- Update: someone records what changed, what is waiting, or what is blocked.
- Prove: someone saves evidence that the work happened.
- Escalate: the task needs help, permission, a professional, or a different owner.

Those verbs should always create one shared event with scoped visibility:

- Family-visible event: reduces "where are we?" uncertainty.
- Funeral-home event: helps staff/directors know who owns the next move.
- Staff/internal event: preserves handoff notes that should not confuse the family.
- Participant event: gives an invited helper only the context they need.
- Vendor event: keeps quote/status/proof tied to the task without exposing unrelated estate details.
- System/admin event: catches delivery failures, demo issues, and audit/debug facts.

The task row should show current truth; the communication/proof trail should show how it got there.

### Notification Routing

Notification routing should happen after the event is created, not before. The order is:

1. Save the task/action event in the estate spine.
2. Determine who needs to know based on role, task visibility, and next action.
3. Resolve channel preferences: in-app first, email as official default, SMS only with consent/urgency.
4. Send or prepare the message.
5. Log the attempted channel, provider status, fallback, skipped reason, and actor.
6. Update the same event/trail with sent, delivered, viewed, failed, or waiting state.

This prevents "message sent" from becoming an invisible side effect. The communication attempt itself becomes proof.

### Role-Specific Communication Rules

Family coordinator:

- Sees all family-facing work, funeral-home updates, participant responses, vendor statuses, and proof.
- Gets notified when the next action changes, someone asks for family input, proof is saved, or something is blocked.
- Should not receive every internal staff note.

Funeral-home director/admin:

- Sees all cases, all staff queues, family requests, vendor statuses, proof, export/report changes, and escalation events.
- Gets notified for blocked work, unassigned work, family responses, staff completions, failed notifications, and report-worthy changes.

Funeral-home employee:

- Sees assigned work first with case context, family request text, proof requirements, and allowed internal notes.
- Gets notified only for assignments, replies to their requests, escalations, and director reassignment.

Participant/helper:

- Sees one assigned responsibility, the request, deadline/context, how to respond, and their own proof history.
- Gets notified for assignment, reminder, coordinator clarification, and accepted/handled confirmation.

Vendor:

- Sees only task-linked request context, requested service, sensitivity note, quote/status controls, and their response/proof trail.
- Gets notified for request, family/funeral-home clarification, accepted quote, status due, and completion confirmation.

System admin:

- Sees provider failures, orphaned events, demo-data warnings, and audit inconsistencies.

### Status Truth

A communication should never leave task status ambiguous:

- Assigned: owner exists; recipient may still need invite/notification.
- Sent: request/message left Passage or was prepared for manual send.
- Delivered/viewed: provider or portal confirms receipt.
- Waiting: Passage is waiting on a named person/entity.
- Needs help: owner cannot move forward without escalation.
- Handled: output/proof is saved and visible to the right audience.
- Failed: delivery or action failed and needs retry/fallback.

Every status must answer:

- who owns it now
- who is waiting
- what was communicated
- what proof exists
- who can see it
- what happens next

## Notification Preference Contract

Notification preferences are also part of the spine. Passage should not guess differently on different screens.

Each reachable person should eventually have a preference record or derived preference profile:

- in-app: default on for signed-in users
- email: default on when an email exists, unless opted out
- sms/text: off until a phone exists and the user/contact has consented or the sender is only copying a draft/manual text
- phone call: never automatic; only click-to-call or logged manual call unless explicitly approved later
- quiet hours / urgent override: roadmap item, with red-path urgent exceptions called out visibly
- role visibility: family, participant, funeral-home staff, funeral-home director/admin, vendor, Passage admin

Every task communication should resolve channel in one place:

1. Determine task intent: assignment, family update, staff request, reminder, vendor request, proof update, failure.
2. Determine recipient role and allowed visibility.
3. Read recipient preferences and available contact methods.
4. Choose the safest channel: in-app + email by default; sms only if allowed and appropriate.
5. If preferred channel is unavailable, show the fallback before sending.
6. Log the attempted channel, resolved channel, skipped channel, fallback reason, actor, timestamp, and recipient.
7. Show the result in the communication/proof trail.

Preference UI should be simple:

- Family coordinator: "How should Passage notify you about this estate?"
- Participant/helper: "How should Passage contact you about assigned work?"
- Funeral-home employee: "How should Passage notify you about assigned case work?"
- Funeral-home director/admin: "How should Passage notify you about case escalations, reports, and staff updates?"
- Vendor: "How should Passage send task-linked requests and quote/status updates?"

No real SMS should be sent without the existing owner approval gates and provider compliance being respected. If SMS is not approved/configured, the UI should say "text draft" or "email fallback" instead of pretending it sent.

Every action must write the same kind of truth:

- task row status
- task status event
- estate event
- notification log when a message is sent or attempted
- vendor request status when local help is involved
- reportable actor/timestamp/channel/recipient/proof

## Role Experiences

### Red Path Family

Start with crisis triage, then one next action. Do not show an empty dashboard first. The red path should land in an estate operating spine with urgency copy, authority cautions, and immediate proof capture.

Boundary: be direct before Passage coordination begins. If there is immediate safety, medical, or unclear-pronouncement risk, the screen should say to call 911/local emergency services, hospice, the facility, coroner/medical examiner, or funeral home as appropriate. Passage is the calm command center after the first urgent professional/local-authority step, not a replacement for emergency, medical, legal, religious, or funeral-directing judgment.

### Green Path Family

Start with planning readiness and one calm preparation action. Green tasks should emphasize future family clarity: who owns it, where the document/output lives, and what family will see later.

### Family Coordinator

Default screen is the estate operating spine. The coordinator can assign, send, save proof, mark waiting/help/handled, see communication/proof, and access estate file drawers as secondary sections.

### Participant

Invite link lands on one assigned responsibility, not a dashboard. The participant sees context, accepts or declines/asks for help, saves proof/waiting notes, and sees only assigned work plus their own history.

### Funeral Home Director/Admin

Default screen is case work plus staff work plus reports. Director/admin can create cases, delegate to employees, act on behalf of family, request family info, request vendors, export, and see ROI.

Primary demo buyer is a one-location owner/director first. The product should prove the Local-tier story before optimizing for multi-location complexity. Multi-location should still be structurally visible through location/report patterns, but it is not the first demo narrative.

### Funeral Home Employee

Default screen is My assigned work. Employees should not land in a broad case dashboard first. They see assigned tasks, case context, prepared output/request, family visibility, and proof controls.

First pilot default: staff see assigned tasks plus their open cases. Location managers and directors/admins get an "All cases at this location" visibility mode. The staff path should reduce noise; the manager path should preserve workload visibility.

### Vendor

Vendor experience is request-native. Vendor receives a task-linked request, sees context and sensitivity, can quote/ask for details/accept/in progress/complete/decline, and every status flows back to the estate/funeral-home spine.

Vendor posture: both family and funeral home may initiate help, but funeral homes curate/prefer/hide visible options. Families should never browse a generic directory. If a family requests a vendor outside the preferred list, it should route through an approval/review flow rather than feeling like an open marketplace.

First demo vendor categories:

- Florist / sympathy flowers
- Catering / reception or meal support
- Transportation

Clergy/officiant and estate cleanout can follow after the first vendor loop is trustworthy.

## Branding and Demo Positioning

For families who arrive through a funeral home, use subtle co-branding:

- funeral-home logo and primary accent in the family command center header
- small "Powered by Passage" footer language
- enough Passage identity to support long-term family adoption without making the funeral home feel displaced

Demo language should say "Passage prepares this for your review" more often than "Passage automates this" until the send/proof/follow-up loop is fully proven. Automation labels must be earned by visible artifacts, sends, requests, or logged follow-up.

Highest-impact demo outputs:

- funeral home meeting packet / arrangement summary
- family notification message set
- obituary draft
- vendor request / quote workflow
- staff + family status summary or one-page report

## Sprint Order

0. Operational Calm hardening
   - Normalize spacing, button hierarchy, cards, empty states, modals, loading states, and status colors.
   - Reduce nested card/panel density on family and funeral-home surfaces.
   - Tighten homepage first 15 seconds around red path vs green path.
   - Make red path situation triage directive before asking users to configure anything.
   - Surface trust, permissions, audit, and export confidence where users hesitate.
   - QA mobile for one-handed task completion, invite acceptance, and family/funeral-home status reading.

1. Estate operating spine rebuild
   - Replace card-heavy command center with active-work surface.
   - Make assignment, message, proof, waiting, help, and handled one model.
   - Keep task lists, timeline, estate file, and logs secondary.
   - Resolve task communication through shared notification preferences and fallback rules.

2. Participant assigned-work rebuild
   - One assigned item first.
   - Same owner/output/proof/status language.
   - Clear invitation and sign-in recovery.
   - Preference setup after sign-in: in-app/email first, text only when allowed.

3. Funeral-home operating layer rebuild
   - Director/admin: cases, staff queue, reports.
   - Employee: assigned work first.
   - Case task workspace uses same action model as estate.
   - Staff notification preferences for assigned work, escalations, and family-request responses.

4. Vendor request loop rebuild
   - No directory behavior.
   - Task-native request, quote/status, proof, and family/funeral-home visibility.
   - Vendor contact preferences for request, quote, in-progress, completed, and declined states.

5. Red/green entry path alignment
   - Red path: crisis triage into active task.
   - Green path: planning readiness into estate spine.
   - Both land in the same command model with different urgency/copy.
   - Red/green family users can configure how Passage sends task updates and reminders.

6. Demo hardening
   - B2B closed loop: create case -> family link -> staff assignment -> task action -> family-visible proof -> vendor request if relevant -> report/export.
   - Do not call demo-safe until every actor path passes smoke QA.

## 12-Minute Pilot Demo Loop

The first demo loop to perfect is:

1. Funeral home creates a case.
2. Funeral home assigns staff.
3. Funeral home requests missing information from family.
4. Staff handles the task or records what is waiting.
5. Family sees the proof/update without another phone call.
6. Funeral home sees the case status, staff action, and report/export change.

This loop must be perfect before broadening the story. It proves the sell-sheet value: fewer repeated calls, clear ownership, proof, no disruption to the funeral home's system, and exportable case data.

## Three Sprint Demo-Readiness Plan

### Sprint 1: Operational Calm

Goal: make Passage feel trustworthy before the prospect evaluates feature depth.

Must ship:

- normalized typography, spacing, density, buttons, inputs, and status language across family, participant, funeral-home, vendor, and admin paths
- one obvious next action per primary screen
- fewer nested cards; primary screens use operating surfaces, rails, proof trails, and secondary drawers
- mobile-safe task, assignment, notification, participant, and vendor paths
- emotionally paced red/green family entry points

Acceptance:

- user can say what to do next in 3 seconds
- no page feels like a pile of cards
- no dead button, unclear status, or unexplained recovery path in the demo route

### Sprint 2: Perfect Demo Loop

Goal: make the one-location funeral-home loop undeniably useful.

Must ship:

- case creation
- staff assignment
- family information request
- staff task handling or waiting update
- family-visible proof/status update
- communication/proof trail
- vendor request/quote path where relevant and non-salesy
- report/export change

Acceptance:

- 12-minute walkthrough runs without hand-waving
- every action changes visible state
- family, staff, director, participant, vendor, and report surfaces show the same task truth
- no real email/SMS sends during QA unless explicitly approved; demo/fallback state is honest

### Sprint 3: Trust and Enterprise Readiness

Goal: make a serious operator believe Passage can touch grieving-family coordination safely.

Must ship:

- role/permission clarity for director/admin, location manager, staff, family coordinator, participant, vendor, and Passage admin
- visible audit/proof model
- export confidence and data ownership copy
- vault/document handling trust language where exposed
- support/trust center surfaces ready for demos, with legal/compliance pages still marked owner/counsel-review where appropriate
- notification preference model and fallback logging

Acceptance:

- product feels safe enough for a pilot conversation
- operators understand who can see, assign, send, complete, and report
- trust story is plain-language and operational, not SOC2 theater

## Design Rule

No new cards unless the element is a repeated item, modal, or small contained utility. Primary screens should be operating surfaces: rail, active work, proof trail, and secondary drawers.
