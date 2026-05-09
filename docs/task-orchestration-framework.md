# Passage Task Orchestration Framework

## Goal

Every task should become one of three execution modes:

1. Fully automated
   - Passage sends or initiates the action.
   - Passage logs proof.
   - Passage follows up.

2. Assisted execution
   - Passage prepares the call, message, packet, form, or one-pager.
   - User clicks, calls, sends, prints, or assigns.
   - Passage records outcome and proof.

3. Guided manual
   - Passage provides the clearest official path and next action.
   - Used only when automation is unrealistic, legally sensitive, or trust-sensitive.

## Task Fields That Matter

For every task, maintain:
- Owner
- Waiting on
- Execution mode
- Proof required
- Next action CTA
- Recipient or institution
- Failure or blocked state
- Follow-up behavior

## Priority Task Categories

Start by tightening:
- Official pronouncement
- Funeral home contact
- Death certificates
- Immediate family notification
- Home / pets / vehicle security
- Cemetery coordination
- Clergy / faith community coordination
- Social Security / survivor benefits
- Bank / financial institution notification
- Insurance claims
- Medical records and healthcare proxy location
- Funeral home prep summary

## Proof States

Use these labels consistently:
- Draft
- Sent
- Waiting for confirmation
- Confirmed
- Handled
- Blocked
- Failed

Do not show confirmed unless a person, provider, participant, or webhook proves it.

## Follow-Up Loop

If no response:
- Show "Waiting for response"
- Offer "Send reminder"
- Keep "We're tracking this for you. You don't need to follow up."

If blocked:
- Show who needs help
- Notify owner
- Make next action obvious

## Timeline Anchors

Passage should not rank work only by task title. The orchestration spine needs real-world dates because deathcare work is deadline-driven.

Core event anchors:
- Date/time of death
- Official pronouncement time
- Release / pickup deadline
- Funeral home arrangement meeting
- Visitation, wake, or shiva
- Funeral or memorial service
- Burial, committal, cremation, or cemetery appointment
- Reception or family gathering
- Obituary submission / publication deadline
- Certificate order / pickup date
- Agency, institution, or court deadline

Green path intake:
- Ask only for known wishes and likely contacts first.
- Capture preferences such as burial/cremation, faith or cultural timing, preferred funeral home, cemetery, and key people.
- Do not force service dates because they usually do not exist yet.
- Store these as planning anchors that later seed red-path and funeral-home tasks.

Red path intake:
- Ask death context first: unexpected, hospice, hospital, facility, expected at home, or already past first steps.
- Capture date of death and, only if known, pronouncement, facility release, funeral home, cemetery, clergy, and immediate family owner.
- Do not ask for wake/funeral/burial dates until the family or funeral home has them.
- When a date is missing but needed, create the next action as "Confirm the date" rather than leaving the user staring at a blank field.

Funeral home intake:
- Funeral homes can usually add or confirm arrangement meeting, service, visitation, burial/cremation, cemetery, obituary, reception, and staff-owner dates.
- The director view should allow fast case/date updates without cluttering the family view.
- Staff tasks should inherit service context: service date, family waiting state, urgency, owner, and proof needed.

Participant and vendor intake:
- Participants see only the task, why it matters, and any relevant date.
- Vendors see the request, needed-by date, urgency, quote/status path, and what happens after they respond.
- Vendors should never see unrelated estate timeline details.

How dates affect the spine:
- Near dates raise priority.
- Past dates create an at-risk or overdue signal.
- Service-related tasks use service, visitation, burial, or reception dates.
- Legal/financial tasks use death date plus due-window rules when no explicit deadline exists.
- Missing required dates become their own next action if they block family messaging, funeral-home execution, vendor quotes, or exports.
- Every generated packet or family summary should include known dates and explicitly say what is still unknown.
