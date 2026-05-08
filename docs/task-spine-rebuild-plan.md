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

## Research Pressure Test

Current SaaS onboarding guidance points in the same direction: reduce time to value, avoid dumping users into feature tours, and route each role to the first meaningful action. For Passage, the first value moment is not "create a task." It is "Passage tells me what happens next, who owns it, and what proof will show it happened."

Vendor/RFQ workflow patterns also support the Passage model: requests and responses should stay linked to the original work item, collect responses centrally, and avoid making the user chase separate vendor threads. For grief-sensitive work, that means vendors only appear inside a relevant task and only as "trusted local help if wanted," never as a sales directory.

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

### Green Path Family

Start with planning readiness and one calm preparation action. Green tasks should emphasize future family clarity: who owns it, where the document/output lives, and what family will see later.

### Family Coordinator

Default screen is the estate operating spine. The coordinator can assign, send, save proof, mark waiting/help/handled, see communication/proof, and access estate file drawers as secondary sections.

### Participant

Invite link lands on one assigned responsibility, not a dashboard. The participant sees context, accepts or declines/asks for help, saves proof/waiting notes, and sees only assigned work plus their own history.

### Funeral Home Director/Admin

Default screen is case work plus staff work plus reports. Director/admin can create cases, delegate to employees, act on behalf of family, request family info, request vendors, export, and see ROI.

### Funeral Home Employee

Default screen is My assigned work. Employees should not land in a broad case dashboard first. They see assigned tasks, case context, prepared output/request, family visibility, and proof controls.

### Vendor

Vendor experience is request-native. Vendor receives a task-linked request, sees context and sensitivity, can quote/ask for details/accept/in progress/complete/decline, and every status flows back to the estate/funeral-home spine.

## Sprint Order

1. Estate operating spine rebuild
   - Replace card-heavy command center with active-work surface.
   - Make assignment, message, proof, waiting, help, and handled one model.
   - Keep task lists, timeline, estate file, and logs secondary.

2. Participant assigned-work rebuild
   - One assigned item first.
   - Same owner/output/proof/status language.
   - Clear invitation and sign-in recovery.

3. Funeral-home operating layer rebuild
   - Director/admin: cases, staff queue, reports.
   - Employee: assigned work first.
   - Case task workspace uses same action model as estate.

4. Vendor request loop rebuild
   - No directory behavior.
   - Task-native request, quote/status, proof, and family/funeral-home visibility.

5. Red/green entry path alignment
   - Red path: crisis triage into active task.
   - Green path: planning readiness into estate spine.
   - Both land in the same command model with different urgency/copy.

6. Demo hardening
   - B2B closed loop: create case -> family link -> staff assignment -> task action -> family-visible proof -> vendor request if relevant -> report/export.
   - Do not call demo-safe until every actor path passes smoke QA.

## Design Rule

No new cards unless the element is a repeated item, modal, or small contained utility. Primary screens should be operating surfaces: rail, active work, proof trail, and secondary drawers.
