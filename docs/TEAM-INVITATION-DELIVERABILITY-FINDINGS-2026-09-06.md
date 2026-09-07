# Team Invitation Deliverability Findings — September 6, 2026

## Summary

Team (organization) invitation emails — sent to staff/admin/reviewer/developer/auditor joining an organization, via `deliverTeamInvitation` — had **no delivery-confirmation tracking at all**, unlike participant-facing invitations, which already track delivery status through `authority_private.notification_outbox` and the `/api/webhooks/resend` receipt pipeline (see `20260829141400_authority_participant_delivery.sql`, `20260829142746_authority_delivery_receipt_semantics.sql`, `20260829143717_authority_resend_webhook_receipts.sql`).

A persona/role audit found **4 of 5 test team invitations were silently dropped by Gmail's filtering** tonight (September 6, 2026) despite the email provider (Resend) reporting them as delivered. Nobody would have known without manually checking Resend's raw logs — the product itself had no record of the gap.

Team invitation delivery now has the same visibility participant invitations do: backend status tracking (`organization_invitations.delivery_status`, matched to Resend webhook events by `provider_message_id`) is implemented and committed, and `/app/team` surfaces a per-invitation **Delivery** status column directly in its Invitations table.

## What was found

- `deliverTeamInvitation()` (`src/lib/authority/team-invitation-delivery.ts`) sends via the Resend SDK and returns whether the API call was accepted, but nothing ever recorded that result or observed the `email.delivered` / `email.delivery_delayed` / `email.failed` / `email.bounced` webhook events Resend already sends to `/api/webhooks/resend` for every send, participant or team.
- `inviteTeamMemberAction()` (`src/app/account-actions.ts`) only used the accepted/not-accepted result to choose between two nearly identical UI notices (`invitation_sent` vs `invitation_created`); it never persisted the result.
- `/app/team`'s Invitations table showed only the invitation's own lifecycle `status` (pending / accepted / revoked) — never whether the email itself had actually reached the recipient.
- The existing `record_resend_delivery_event_v1` webhook handler only ever looked up `authority_private.notification_outbox`, which is keyed to `authority_participant_invitations` and `authority_records` — team invitations (`organization_invitations`) have no relationship to either table, so even if a team-invitation send had been recorded somewhere, the webhook handler had no path to find it.

Net effect: a team invitation could silently fail to reach an inbox — as it did four out of five times tonight — with zero product-visible signal.

## What changed

Full technical detail is in `docs/V2-DELIVERY-ROADMAP.md` under "Team invitation delivery tracking — September 6, 2026"; summarized here:

1. New migration `supabase/migrations/20260906193000_team_invitation_delivery_tracking.sql`:
   - Adds `delivery_status`, `delivery_provider`, `delivery_provider_message_id`, `delivery_error_code`, `delivery_attempts`, `delivery_last_attempt_at`, `delivery_confirmed_at`, `delivery_last_event_at` columns to `public.organization_invitations`, with `delivery_status` constrained to `pending | processing | delivered | failed | retrying`.
   - Adds `authority_private.record_team_invitation_delivery_service_v1` (+ `public` wrapper, service-role only), which records the initial Resend submission result.
   - Extends `authority_private.record_resend_delivery_event_v1` (+ `public` wrapper — signature unchanged, so `src/app/api/webhooks/resend/route.ts` needed no changes) to also match team invitations by `provider_message_id` when no participant `notification_outbox` row matches.
2. `inviteTeamMemberAction` calls the new RPC right after `deliverTeamInvitation()` returns (only for `provider === "resend"`; `local`/`disabled` delivery modes have no provider message ID to correlate a webhook to, so nothing to track).
3. `/app/team` (`src/app/app/team/page.tsx`) selects the new columns and renders a **Delivery** column: "Not sent yet", "Sending… confirming delivery", "Delivered", "Delivery delayed", or "Not delivered" (with the provider's error/bounce code when available).
4. New `membership.invitation_submitted` / `membership.invitation_delivered` / `membership.invitation_delivery_failed` / `membership.invitation_delivery_delayed` events also flow into the existing "Recent access activity" feed on `/app/team`.

### The "accepted" vs "delivered" lesson, applied proactively

Participant invitations originally had the same bug this audit just found for team invitations: the code that recorded "the provider accepted the send" also labeled it `delivered`, which `20260829142746_authority_delivery_receipt_semantics.sql` later had to correct with a trigger that rewrites premature `delivered` states to `processing`. Team invitation tracking was built with that lesson already applied: `record_team_invitation_delivery_service_v1` never writes `delivery_status = 'delivered'` — a successful Resend API call is stored as `'processing'` (submitted, unconfirmed). Only the confirmed `email.delivered` webhook event, handled in `record_resend_delivery_event_v1`, writes `'delivered'`. No follow-up correction migration should be needed for team invitations the way one was for participant invitations.

## Verification performed

Sent a real test email through the same Resend account and verified sending domain (`thepassageapp.io`) that `deliverTeamInvitation` uses, to a live Gmail address, and checked both ends of the pipeline directly rather than relying on assumptions:

- **Resend side:** `get-email` on the sent message (`65678ba2-8c37-4287-852e-c5db61cc3de6`) reported `Status: delivered`.
- **Gmail side:** searched the recipient's actual mailbox (`search_threads`, `subject:"[TEST] Join Passage Authority" in:anywhere`) and confirmed the message's label set was `UNREAD, IMPORTANT, INBOX` — it landed in the primary inbox, not spam.

This directly answers the question the original incident turned on — whether Resend's "delivered" status can be trusted to mean actual inbox placement — for this test, it could. It confirms the webhook-event-to-status mapping the new `record_resend_delivery_event_v1` team-invitation branch performs (`email.delivered` -> `delivery_status = 'delivered'`) is checking the signal that actually matters, not just a provider-side handshake.

What this verification does **not** cover: the actual `organization_invitations.delivery_status` row transitioning through `pending -> processing -> delivered` in the live database, because the migration has not been applied to the live UAT project yet (see below). The test send above exercised the Resend/Gmail half of the pipeline directly, independent of the not-yet-applied schema.

## Outstanding

- **Migration not yet applied.** `20260906193000_team_invitation_delivery_tracking.sql` is committed to `agent/founding-pilot-billing` but has not been run against the live UAT Supabase project. A concurrent task on the same branch is actively resolving a separate stale-migration issue against the same database, and this repo already had four other unapplied migrations ahead of this one at the time of this work, indicating migrations here are deployed in a deliberate batch rather than automatically on push — so applying this one was left to that normal batch process rather than run ad hoc. `inviteTeamMemberAction` fails safe in the meantime (it does not throw if the new RPC call errors), so team invitations keep sending normally, just without tracking, until the migration lands.
- **Close-out step, once the migration is applied:** send one more real team invitation through the actual app (not a synthetic Resend send like the verification above), and confirm in `/app/team` that its Delivery column moves from "Sending… confirming delivery" to "Delivered" after the webhook fires — the true end-to-end replay this audit asked for.
- **UI gap carried over from participant invitations:** participant invitations still do not have an equivalent single-glance delivery-status UI column the way team invitations now do (their delivery events only appear in the per-request event timeline). Not in scope for this fix, but worth closing for full parity in a future pass.
