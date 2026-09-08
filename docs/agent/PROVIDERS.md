# Provider and reconciliation playbook

Load for Supabase, Stripe, HubSpot, Resend, email delivery, or reconciliation.

## Source ownership

- Passage: authority state, entitlement, usage, durable commands/events.
- Stripe: payment source.
- HubSpot: customer and revenue-workflow projection.
- Resend: sender/provider acceptance and webhook events.
- Recipient mailbox: final inbox placement; provider delivery does not prove mailbox visibility.

## Rules

- Verify signatures and idempotency; duplicate/out-of-order events must not duplicate state, money, allowance, deals, or tickets.
- Keep provider events and delivery attempts append-only.
- A provider outage cannot change authority state or hide an existing receipt.
- Synthetic fixtures must be explicitly classified and excluded from provider-clean verdicts.
- Do not start the seven-day streak until the population and repair queue are clean.

## Current audit

- Real production is Supabase project `Passage Authority UAT`, not `passage-demo`.
- The reconciliation job exists and its first real UAT and Demo runs were both `blocked`; neither starts the seven-day streak.
- UAT records the tracked reconciliation/Stripe fix as `20260907035519`. Demo reports a related live migration under `20260905233220`; establish whether the SQL is identical and reconcile history before applying another migration.
- Migration application is schema evidence only. It does not resolve or verify the stuck provider rows or notification behavior.
- The stuck HubSpot row still needs normal-worker processing, resulting-record/association verification, completion, and replay verification.
- Two stuck Stripe rows still need investigation. One is a known test event; the other may expose a real product defect. Do not classify both as synthetic or exclude either from reconciliation without evidence.
- The `notification_outbox` overwrite/history fix was not completed before the interrupted task. Verify append-only per-send attempts and late/duplicate/out-of-order webhook behavior before closing it.
- Before the migration, production had zero unresolved provider-inbox events, one pending HubSpot projection, the two Stripe rows above, and eight notification rows associated with multiple provider message IDs. Re-query after the fix work before treating any count as current.
- Stripe negative-path defects found tonight are fixed.
- Production Supabase remains on the Free plan with zero backups; upgrading is an owner spending decision and a real-data gate.
- No later shared-file or remote-commit evidence was found confirming that the interrupted 6:20 PM repair task cleared any blocker.

## Supabase MFA plan facts

- Supabase's current product documentation says app-level TOTP MFA is free and enabled on all projects; the pricing table includes Basic MFA on Free.
- That plan availability does not prove Passage MFA works. Verify hosted TOTP settings, enrollment, challenge/verify, session upgrade to AAL2, privileged-route enforcement, factor management, recovery/backup-factor behavior, and fresh-session behavior end to end.
- Supabase organization-member MFA enforcement is documented for Pro, Team, and Enterprise. Treat that administrative control separately from Passage end-user TOTP and from the backup decision.

Sources: [Supabase TOTP MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp), [Supabase pricing](https://supabase.com/pricing), and [Supabase organization MFA](https://supabase.com/docs/guides/platform/multi-factor-authentication).

## Deliverability backlog

Before real customer volume, add the DKIM/SPF-authenticated sending domain to Google Postmaster Tools, verify it through DNS, assign access, and record an owner for its authentication, compliance, spam-rate, and delivery-error dashboards. Expect sparse or absent dashboard data while volume is below Google's privacy threshold. Postmaster visibility helps diagnosis and reputation management; it does not guarantee inbox placement.

Sources: [Google Postmaster Tools setup](https://support.google.com/mail/answer/9981691) and [Gmail sender guidelines](https://support.google.com/mail/answer/81126).

Implementation history: [../V2-DELIVERY-ROADMAP.md](../V2-DELIVERY-ROADMAP.md). Current detail: [../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md).
