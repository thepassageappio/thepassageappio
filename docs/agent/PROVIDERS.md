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
- The September 7 and September 8 UTC immutable runs were `blocked`; neither starts the seven-day streak. Current computation after repair is `clean` in both environments, making September 9 UTC the first possible credited day.
- The related reconciliation/Stripe SQL exists under different hosted migration timestamps but its live function definitions were compared and found equivalent. The repository now contains the source-controlled migration.
- The pending UAT HubSpot row was an internal demo inquiry created while no HubSpot worker was configured. It is now `canceled` with code `internal_demo_no_worker` through a service-only RPC and an append-only commercial ledger event.
- Both Demo Stripe rows were unmatched test residue. The $20 event belonged to a different invoice/customer from Passage's $5,000 paid demo order. Both are now `ignored` with code `synthetic_test_event`; two append-only resolution events preserve their prior states.
- `notification_outbox_send_history` was already fixed live in both databases but absent from Git. Its exact applied SQL is now `20260907213516_notification_outbox_send_history.sql`; fresh local migration replay and delivery-history function creation pass.
- Demo's missing organization-member summary and team-invitation delivery migrations are now applied; the expected functions and tracking columns exist.
- The daily invariant was corrected so a normal paid-then-refunded order may retain one historical activation audit. A refunded order still fails reconciliation for any active allowance or more than one activation audit.
- Stripe negative-path defects found tonight are fixed.
- Production Supabase remains on the Free plan with zero backups; upgrading is an owner spending decision and a real-data gate.
- Full three-way Passage/Stripe/HubSpot reconciliation remains unavailable until HubSpot credentials and provider reads are configured; a clean internal reconciliation must not be described as that broader proof.

## Supabase MFA plan facts

- Supabase's current product documentation says app-level TOTP MFA is free and enabled on all projects; the pricing table includes Basic MFA on Free.
- That plan availability does not prove Passage MFA works. Verify hosted TOTP settings, enrollment, challenge/verify, session upgrade to AAL2, privileged-route enforcement, factor management, recovery/backup-factor behavior, and fresh-session behavior end to end.
- Supabase organization-member MFA enforcement is documented for Pro, Team, and Enterprise. Treat that administrative control separately from Passage end-user TOTP and from the backup decision.

Sources: [Supabase TOTP MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp), [Supabase pricing](https://supabase.com/pricing), and [Supabase organization MFA](https://supabase.com/docs/guides/platform/multi-factor-authentication).

## Deliverability backlog

Before real customer volume, add the DKIM/SPF-authenticated sending domain to Google Postmaster Tools, verify it through DNS, assign access, and record an owner for its authentication, compliance, spam-rate, and delivery-error dashboards. Expect sparse or absent dashboard data while volume is below Google's privacy threshold. Postmaster visibility helps diagnosis and reputation management; it does not guarantee inbox placement.

Sources: [Google Postmaster Tools setup](https://support.google.com/mail/answer/9981691) and [Gmail sender guidelines](https://support.google.com/mail/answer/81126).

Implementation history: [../V2-DELIVERY-ROADMAP.md](../V2-DELIVERY-ROADMAP.md). Current detail: [../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md).
