# Passage Authority fresh-chat handoff

**Codeword:** `AUTHORITY COMPASS 771204`

## Resume sequence

1. Read `AGENTS.md`.
2. Read [agent/CURRENT.md](./agent/CURRENT.md).
3. Inspect Git status and preserve all uncommitted work.
4. Load only the playbook for the active task.

## Current objective

Run the first credited clean reconciliation on September 9 UTC, verify MFA end to end, validate the five-state policy track, and finish the held commercial package. P0 demo readiness is closed; buyer-facing release and real-data approval still require P1 and P2.

## Current blockers

- September 7 and September 8 UTC are immutable `blocked` days, so zero streak days are credited. Current computation is clean in UAT and Demo after audited repair; run and record day 1 on September 9 UTC.
- The UAT internal demo HubSpot row is canceled with ledger evidence. Both Demo Stripe rows are proven synthetic unmatched invoices and ignored with ledger evidence. The notification send-history shadow migration is recovered into Git, and Demo's two missing committed migrations are applied.
- Internal reconciliation is unblocked. Full three-way provider reconciliation still requires HubSpot credentials and live provider comparison.
- App-level TOTP is available on Supabase Free. Integration code/build and a disposable local AAL1-deny/AAL2-allow database test pass; hosted owner/admin enrollment, re-challenge, recovery, and production replay remain.
- Supabase production is on Free with no backups; the plan decision remains with the owner.
- Backup/restore/incident evidence, privacy/security/vendor-risk review, and five-state counsel approval remain open.
- Before first sales: prepare the SOC 2 path/timeline answer. Before real customer email volume: register the authenticated sending domain in Google Postmaster Tools. Track institution-side cancellation of awaiting-principal requests as a non-launch-blocking product gap.
- Integration branch `agent/codex-p2-integration-20260907` is cleanly based on `origin/main` `76e52dc` and remains unmerged. Do not merge the divergent Claude branch wholesale; its final legal/vendor-risk packet files were selected into the integration branch.

Detailed current evidence: [AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](./AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md).

Archived full handoff: [archive/NEW-CHAT-HANDOFF-2026-09-07-full.md](./archive/NEW-CHAT-HANDOFF-2026-09-07-full.md).
