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

## Design Rule

No new cards unless the element is a repeated item, modal, or small contained utility. Primary screens should be operating surfaces: rail, active work, proof trail, and secondary drawers.
