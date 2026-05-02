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

