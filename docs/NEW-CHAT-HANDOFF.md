# Passage Authority fresh-chat handoff

**Codeword:** `AUTHORITY COMPASS 771204`

## Resume sequence

1. Read `AGENTS.md`.
2. Read [agent/CURRENT.md](./agent/CURRENT.md).
3. Inspect Git status and preserve all uncommitted work.
4. Load only the playbook for the active task.

## Current objective

Verify and finish the reconciliation fix across UAT and Demo, verify MFA end to end, begin the seven-clean-day streak, validate the five-state policy track, and finish the held commercial package. P0 demo readiness is closed; buyer-facing release and real-data approval still require P1 and P2.

## Current blockers

- The first real reconciliation run returned `blocked` in UAT and Demo; zero streak days are credited. UAT and Demo use different migration-history timestamps for related reconciliation SQL, so verify equivalence before applying anything again.
- Migration application did not resolve the stuck HubSpot row, investigate both stuck Stripe rows, or complete the `notification_outbox` history fix. All three need separate repair and verification before reconciliation is unblocked.
- Zero credited clean reconciliation days.
- App-level TOTP is available on Supabase Free. Integration code/build and a disposable local AAL1-deny/AAL2-allow database test pass; hosted owner/admin enrollment, re-challenge, recovery, and production replay remain.
- Supabase production is on Free with no backups; the plan decision remains with the owner.
- Backup/restore/incident evidence, privacy/security/vendor-risk review, and five-state counsel approval remain open.
- Before first sales: prepare the SOC 2 path/timeline answer. Before real customer email volume: register the authenticated sending domain in Google Postmaster Tools. Track institution-side cancellation of awaiting-principal requests as a non-launch-blocking product gap.
- Integration branch `agent/codex-p2-integration-20260907` is cleanly based on `origin/main` `76e52dc` and remains unmerged. Do not merge the divergent Claude branch wholesale; its final legal/vendor-risk packet files were selected into the integration branch.

Detailed current evidence: [AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](./AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md).

Archived full handoff: [archive/NEW-CHAT-HANDOFF-2026-09-07-full.md](./archive/NEW-CHAT-HANDOFF-2026-09-07-full.md).
