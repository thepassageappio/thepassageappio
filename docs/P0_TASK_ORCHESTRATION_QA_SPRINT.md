# P0 Task Orchestration QA Sprint

Date: May 14, 2026

## Goal

Make Passage demonstrably trustworthy as a coordination system: tasks move, people know their job, communication is review-first, every meaningful action leaves proof, and admin can verify the loop without polluting production.

## Current QA Read

### What is solid

- Public entry points are clearer: urgent help, planning, funeral homes, care providers, participants, and vendors each have a defined front door.
- `/system/admin` and `/system/demo` redirect unauthenticated users to `/login?next=...`.
- Urgent help starts with situational triage and keeps review-before-send language visible.
- Participant public and private pages now explain scoped access well.
- Task status APIs write through shared primitives:
  - `tasks`
  - `task_status_events`
  - `estate_events`
  - `notification_log` where delivery is involved
- Participant actions notify the coordinator and write back to the same family record.
- Vendor commerce has the right shape:
  - vendor request
  - vendor quote
  - family payment checkout
  - Stripe Connect destination
  - Passage fee
  - vendor order/payment rows
  - task communication event
- Supabase migration hygiene has the right tooling in place now that Docker and project linking are available.

### Gaps blocking full confidence

- Production smoke test cannot be run until `PASSAGE_INTERNAL_API_SECRET` is configured in the environment used to invoke it.
- Public contact/footer still used a Gmail address before this sprint. The code now displays `support@thepassageapp.io`; the domain inbox and env var still need to exist in production.
- SMS must remain treated as dry-run/paused until Twilio A2P is done.
- The admin QA launcher now exercises a broader persona spine: funeral-home proof, participant waiting update, vendor request/quote, family update, SMS dry-run, Green-to-urgent same-person block, simulated second confirmation, notification logs, task status events, estate events, and cleanup.
- Task orchestration is implemented and build-verified; production verification still depends on `PASSAGE_INTERNAL_API_SECRET`, Resend, and QA notification override being configured in the deployment environment.
- `npx supabase db diff --linked --schema public` needs a longer clean run before the next money-moving migration; the first QA attempt timed out after two minutes.

## Sprint Loop

### Sprint 1: Orchestration Smoke Test Access

Technical requirements:

- Set `PASSAGE_INTERNAL_API_SECRET` in Vercel Production and Preview.
- Keep the same value available locally only when intentionally running smoke tests.
- Add an admin-only UI button in `/system/admin` to call `/api/system/orchestrationSmokeTest`.
- Require a typed confirmation if `keepRecords=true`.
- Default QA recipient to `steventurrisi@gmail.com`.
- Show each check result:
  - temporary case created
  - funeral-home close with proof
  - participant assignment email
  - participant scoped waiting update
  - vendor scoped request
  - vendor quote status
  - reviewed family update email
  - SMS dry run
  - activation tables available
  - same-person activation confirmation blocked
  - simulated second activation confirmation
  - spine rows recorded

Success criteria:

- Steve can run the smoke test from admin without using PowerShell.
- Test records clean themselves up by default.
- Notification log records intended and actual recipients.
- Failed checks show the exact failed API/status/provider message.

### Sprint 2: Task Action Consistency

Technical requirements:

- Audit every task action button across estate, participant, funeral home, and vendor pages.
- Every action must call one of the canonical APIs:
  - `/api/tasks/[id]/status`
  - `/api/tasks/[id]/assign`
  - `/api/tasks/[id]/send`
  - `/api/tasks/[id]/reminder`
  - `/api/participantAction`
  - `/api/vendorRequests/*`
  - `/api/partnerHandleTask`
- Normalize all statuses through shared lifecycle helpers.
- Remove page-local status strings that are not accepted by DB constraints.
- Show a visible confirmation after every save.

Success criteria:

- Assign owner, mark waiting, close with proof, participant handled, vendor quoted, vendor scheduled, and vendor completed all update the task and proof trail.
- No action silently fails.
- Every action creates either a `task_status_events` row, an `estate_events` row, or both.

### Sprint 3: Communication Spine

Technical requirements:

- Ensure family updates, task assignment emails, participant updates, funeral-home staff invites, vendor invites, vendor quote/payment updates, and activation confirmation emails all use branded email shells.
- Require review before any external family/vendor/funeral-home message sends.
- Add notification status chips wherever a user expects confirmation:
  - sent
  - delivered
  - failed
  - blocked by QA mode
  - SMS dry-run
- Add “what the coordinator sees” copy to participant/vendor action confirmations.

Success criteria:

- All outbound email paths write `notification_log`.
- Family/coordinator can see what was sent, to whom, and what is waiting.
- Failed or blocked notifications surface inside the relevant task/case, not only in admin.

### Sprint 4: Green-to-Urgent Activation Proof

Technical requirements:

- Run the activation circle end-to-end with a seeded planning estate.
- Confirm one initiator cannot activate alone.
- Confirm a second activation witness receives email and can confirm from scoped participant view.
- After second confirmation:
  - workflow becomes urgent/active
  - activation events are recorded
  - planning tasks promote into urgent next-step tasks
  - all activation circle members see what happened

Success criteria:

- The activation mechanism is understandable without explanation.
- All participants know whether they are waiting, confirming, or done.
- Activation produces an audit trail that can be exported.

### Sprint 5: Vendor Payment Proof

Technical requirements:

- Run a live Stripe test-mode vendor flow:
  - vendor approved
  - Connect onboarding link generated
  - quote submitted
  - family accepts
  - checkout created with automatic tax and 12% application fee
  - webhook records paid state
  - vendor dashboard shows gross, Passage fee, net, payout status
- Add explicit admin failure states for missing Connect readiness.

Success criteria:

- Family can pay a vendor invoice.
- Passage records its fee.
- Vendor sees paid/scheduled work and expected payout.
- Task spine shows vendor payment as proof/context.

## Environment Dependencies

Required for full production QA:

- `PASSAGE_INTERNAL_API_SECRET`
- `QA_NOTIFICATION_MODE=true`
- `QA_NOTIFICATION_OVERRIDE_EMAIL=steventurrisi@gmail.com`
- `NEXT_PUBLIC_SUPPORT_EMAIL=support@thepassageapp.io`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=Passage <notifications@thepassageapp.io>`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe Connect platform enabled
- Twilio A2P approved before live SMS

## Definition of Done

- Admin can run one orchestration smoke test from the UI.
- Task action loop works across family, participant, funeral home, and vendor.
- Email notifications work and are logged.
- SMS is explicitly dry-run or blocked until A2P approval.
- Planning activation requires second confirmation and produces proof.
- Vendor quote-to-payment records Passage fee and vendor net.
- No public page shows internal/demo/admin language or Gmail contact details.
