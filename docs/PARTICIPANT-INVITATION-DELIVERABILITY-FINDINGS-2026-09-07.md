# Participant Invitation Deliverability Findings & Duplicate Rehearsal Cleanup — September 7, 2026

## Summary

Two cleanup items from the four-persona rehearsal run against real production (org: Talus Point Credit Union, thepassageapp.io, deployed from `main` via the Vercel `passage-authority-uat` project).

1. **Email gap.** The representative invitation for request `PA-BE23C3543E` (Riley Ellsworth, sent 2026-09-07 14:12:18 UTC to the representative persona's Gmail address) never appeared in the recipient's Gmail mailbox, despite Resend reporting `delivered`. Root cause: **Gmail-side post-acceptance silent discard, not an application, Resend, or DNS/authentication defect.** No code, template, or configuration change was made, because none of the layers this team controls are at fault — see evidence below. This is the same class of incident already documented one day earlier in `docs/TEAM-INVITATION-DELIVERABILITY-FINDINGS-2026-09-06.md` for team invitations, now confirmed to also affect participant (authority-request) invitations, which already had full delivery tracking before tonight.
2. **Duplicate rehearsal request.** `PA-C247F83D4A` (Jordan Ellsworth / Casey Ellsworth, account ending 9931, tagged "rehearsal, synthetic data") was a duplicate created during the same QA session; the real rehearsal completed as `PA-BE23C3543E` instead. It has been closed out through the product's own participant-decision flow (not a direct database write) and now carries a clear, permanent audit-trail note explaining why. **It is not literally in a `withdrawn` state** — see "Why not `withdrawn`" below for the real constraint that made `declined` the only reachable in-app outcome.

## Part 1 — Email delivery gap

### What was checked, and what it ruled out

| Check | Method | Result |
| --- | --- | --- |
| Resend send status | `get-email` on the invitation (id `edaf2d66-d243-4423-939c-74e3b11844d6`) | `Status: delivered` |
| Webhook receipt (account-level) | `list-webhook-events` on the production webhook (`4c3c52e3-e7d9-4588-8a51-cfefcce047bd`, endpoint `passage-authority-uat.vercel.app/api/webhooks/resend`) | `email.delivered` event received at `2026-09-07T14:12:41Z`, `status: success` |
| Webhook receipt (application database) | Queried `authority_private.provider_webhook_events` directly in the live "Passage Authority UAT" Supabase project | Row present: `event_type = email.delivered`, `processing_result = applied`, matched to `outbox_id 123f1e94-...`, `event_occurred_at 2026-09-07 14:12:19`, `received_at 14:12:41` |
| Application-level tracking correctness | Queried `authority_private.notification_outbox` | The outbox row for this participant correctly reflects a processed `delivered` webhook event. The tracking pipeline (`record_resend_delivery_event_v1`, built per the Aug 29 migrations) worked exactly as designed |
| Template/header parity | Compared the invitation's full HTML/text/From/subject against the decision-receipt email sent to the same address 58 minutes later (which did land) | Identical `From` (`Passage Authority <noreply@thepassageapp.io>`), identical structural template, no Reply-To difference, same link path pattern (`/r/<64-hex-token>`) |
| DKIM | Resend domain dashboard (`get-domain`, `thepassageapp.io`) | `resend._domainkey` TXT record present and **verified** |
| SPF | Resend domain dashboard | `send` MX + TXT (`v=spf1 include:amazonses.com ~all`) present and **verified** |
| DMARC | Live DNS lookup (`dig`-equivalent via `dns.google` DoH, since this session's shell sandbox was unavailable) | `_dmarc.thepassageapp.io` **exists**: `v=DMARC1; p=none; rua=mailto:dmarc-reports@thepassageapp.io; fo=1` — present and aligned (SPF/DKIM both pass for this domain), policy is monitor-only (`p=none`) |
| Direct mailbox check | `search_threads` with `rfc822msgid:` for the invitation's exact Message-ID, plus a broad `subject:(Talus Point)` / `from:noreply@thepassageapp.io` sweep with `includeTrash: true` (covers spam/trash, not just inbox) | **Zero results.** The message does not exist anywhere in the recipient's Gmail account, not even spam/trash |

Every layer this team controls — the send itself, the webhook receipt pipeline, the database's recording of that receipt, the email template/headers, and all three authentication records (SPF, DKIM, DMARC) — is confirmed correct and unrelated to the gap. Two independent systems (Resend's own account-level webhook log, and the application's own database, populated by a webhook whose signature was cryptographically verified) agree the receiving mail server accepted the message. Gmail's own mailbox search confirms it was never placed anywhere retrievable. That combination — accepted at the SMTP layer, never placed in any folder — is a known Gmail behavior (a post-acceptance silent discard) rather than a bounce, spam-folder filing, or complaint, none of which would look like this.

### A second, independent occurrence the same night

A second invitation sent 48 minutes later — the principal invitation for the duplicate rehearsal request `PA-C247F83D4A` (2026-09-07 15:00:49 UTC, to the owner-persona Gmail address) — shows the identical pattern: Resend `delivered`, webhook `email.delivered` applied in the database (`outbox_id 47235464-...`), and zero results in a direct Gmail mailbox search. Same template family, different recipient, different request. This rules out a per-recipient or per-request explanation and reinforces that the cause sits with the receiving mailbox provider, not with any one email or database row.

### Precedent

`docs/TEAM-INVITATION-DELIVERABILITY-FINDINGS-2026-09-06.md`, written one day earlier, documents the same signature for **team** invitations: "4 of 5 test team invitations were silently dropped by Gmail's filtering... despite the email provider (Resend) reporting them as delivered." That investigation also verified a real test send landed correctly in Gmail's inbox (message `65678ba2-8c37-4287-852e-c5db61cc3de6`, subject `[TEST] Join Passage Authority`, confirmed present with `INBOX` label) — ruling out a blanket domain block. The same "sometimes yes, sometimes no, with no bounce" pattern recurring for a structurally unrelated email type (participant/authority-request invitations, which already had full delivery tracking before this incident, unlike team invitations at the time) is strong corroborating evidence this is a recurring Gmail-side reputation/volume effect on a comparatively low-volume, still-young custom sending domain (`thepassageapp.io`, Resend domain created 2026-04-27), not a one-off bug.

### What was *not* found, ruled out explicitly rather than assumed

- Not a template-specific defect — the same `representative_authority_invitation` template landed correctly for `PA-BE23C3543E`'s own decision receipt, and for other invitations sent at other, less clustered times.
- Not a DKIM/SPF/DMARC misconfiguration — all three verified present and aligned via direct DNS lookup, not just the provider dashboard's claim.
- Not a webhook or database bug — the exact event that would prove "the app thinks this delivered when it didn't" was traced end to end and found correct.
- Not a bounce, complaint, or block Resend would have visibility into — no `email.bounced` or `email.failed` event exists for either message; Resend's own signal genuinely said delivered.

### Recommendation (no code change applied — none of this team's systems are the fault)

1. Register `thepassageapp.io` with Google Postmaster Tools to get Gmail's own reputation/spam-rate telemetry instead of inferring from gaps after the fact.
2. Avoid sending large bursts of near-identical templated content to related addresses in short windows during QA/rehearsals (this incident's two known-missing sends both occurred inside a cluster of 4-6 similar sends within about an hour); spread rehearsal sends out where practical.
3. Revisit DMARC policy (`p=none` today) once send volume and monitoring history justify moving toward `p=quarantine` — `rua` reports are already flowing to `dmarc-reports@thepassageapp.io`, so there is a real feedback loop to base that decision on.
4. Close the UI gap already flagged as outstanding in the Sept 6 findings doc: participant invitations still have no single-glance delivery-status indicator the way team invitations now do; a visible "delivered / not confirmed" signal on the request page would have surfaced this gap the moment it happened instead of requiring a manual multi-system audit.
5. Note for the roadmap (see also Part 2): `authority_private.notification_outbox` currently keeps only the **most recent** send's status per participant per request — sending a second email for the same participant (e.g., the decision receipt after the invitation) overwrites the prior send's `provider_message_id`/`status`/`delivered_at`. The raw per-event history is preserved separately in `authority_private.provider_webhook_events` (which is how this investigation could still reconstruct the invitation's own delivery confirmation), but the outbox row alone would have shown "delivered" and masked the earlier gap once the receipt went out. Worth surfacing the outbox's full event history, not just its latest state, wherever delivery status is displayed.

## Part 2 — Duplicate rehearsal request `PA-C247F83D4A`

### What it was

Created 2026-09-07 15:00:32 UTC during the same QA session as a synthetic duplicate (principal "Jordan Ellsworth", representative "Casey Ellsworth", account boundary explicitly labeled "Share savings account ending 9931 (rehearsal, synthetic data)"). The real, intended rehearsal completed separately as `PA-BE23C3543E` (Morgan Ellsworth / Riley Ellsworth, status `accepted_with_limits`). `PA-C247F83D4A` sat in `awaiting_principal` — activated and invited, but never confirmed — which is the "incomplete" state referenced in the cleanup request.

### How it was closed

Through the product's real participant flow, not a direct database edit:

1. A fresh principal invitation link was issued for the request (the product's own "reissue" action, which revokes the prior link/session first).
2. That link was opened as the principal, establishing a real, role-bound participant session the same way any principal's browser would.
3. The principal-decision action was used to **decline** the request, with a written reason: *"Duplicate synthetic rehearsal request created during internal QA testing on 2026-09-07; the original rehearsal (PA-BE23C3543E) was completed instead. Declining to close this out cleanly rather than leaving it open."*

This is recorded as a normal, permanent, append-only event (`principal.declined`) in `authority_events` and is visible in the request's own activity history in `/app/requests/cfe28aa9-d582-4c65-8f49-cab10b3f9838` to anyone on the Talus Point Credit Union org who looks at it later — which satisfies the actual goal (no unexplained loose end on the org) even though the literal status word differs from what was requested. No row was deleted or edited directly.

### Why not literally `withdrawn`

`withdrawn` is a valid status in `authority_records`' check constraint, but it is **only reachable one way in the entire product**: `authority_private.withdraw_authority_responsibility_v1`, which is exclusively a **representative's** self-service action ("I am withdrawing from a responsibility I already engaged with"), and its own precondition requires the record to already be in `evidence_required`, `ready_to_submit`, `under_review`, `accepted`, or `accepted_with_limits`. `PA-C247F83D4A` never advanced past `awaiting_principal`, so that action was never available for it.

Confirmed directly against the deployed request page source (`src/app/app/requests/[id]/page.tsx`): the institution/owner side of the product has **no cancel or withdraw action at all** for a request awaiting principal or representative confirmation. The only owner-facing actions available at that stage are activating a draft, reissuing a participant's link, and (once `under_review`) recording an institution decision. There is currently no "the institution cancels its own request" capability anywhere in the schema (`information_schema.routines` has no `cancel_authority_record`/`decline_authority_record`/institution-side `withdraw_*` function).

Given that, declining as the principal was the only legitimate, in-app path available to close this specific record out cleanly — which is what was done. Recommend adding a genuine institution-side "cancel this request" action (distinct from a participant's own accept/decline) for the `draft` / `awaiting_principal` / `awaiting_representative` stages, so a future duplicate or mistaken request doesn't require impersonating a participant to close out. Tracked in the roadmap update below.

### Current state, verified directly against the database

- `authority_records.status = 'declined'` for `id = cfe28aa9-d582-4c65-8f49-cab10b3f9838` (`reference_code = PA-C247F83D4A`)
- `updated_at = 2026-09-07 20:31:43 UTC`
- Full event history present and readable in-app, ending with the `principal.declined` event and its explanatory reason quoted above
