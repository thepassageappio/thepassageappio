# Recovery and incident-response readiness — September 7, 2026

**Status:** First real assessment. No backup, restore, or incident-response documentation existed anywhere in this repository before today (verified by search; `docs/`, `AGENTS.md`, and `docs/BUILD-CONTRACT.md` contain no backup/incident content). This document replaces silence with a real, dated finding and a usable runbook. It is P2 exit evidence ("retention, restore and incident evidence") for `docs/V2-DELIVERY-ROADMAP.md`.

Passage currently runs two live Supabase projects, both in organization `thepassageappio's Org` (`zkvvkvzxlxybywkbflab`):

| Project | Ref | Role |
| --- | --- | --- |
| Passage Authority UAT | `ywlrxdjibngroycwnujg` | Persona/authorization/reconciliation testing, closest to a production dataset |
| passage-demo | `bklrclpertdtmhycpqlz` | Public demo flow, Stripe sandbox pilot evidence |

## 1. Backup capability — tested today, real finding: none exists

**The Supabase organization is on the Free plan** (confirmed via `get_organization`: `"plan":"free"`). Per Supabase's own documentation (supabase.com/docs/guides/platform/backups, fetched today):

- Automated **daily backups** are only provisioned on Pro, Team, and Enterprise plans. The Free plan gets none.
- **Point-in-Time Recovery (PITR)** is a paid add-on on Pro/Team/Enterprise only, not available on Free.
- Supabase's own guidance for Free-tier projects is to "regularly export their data using the Supabase CLI `db dump` command and maintain off-site backups" — i.e., backups on Free are the customer's manual responsibility, not Supabase's.

**Conclusion: today, neither UAT nor Demo has any backup of any kind.** If either database were lost or corrupted right now, there is no vendor-side recovery path. This is a hard gap against the P2 exit criterion and should be treated as a blocker for accepting real institution data, independent of the reconciliation and MFA items.

### What was actually tested today (safe, non-destructive)

Supabase branch creation (`create_branch`) was considered as a way to test restore safely, but its own tool description states branching **applies schema/migrations only — "production data will not carry over."** It cannot be used to test a real data restore, so it was not used for that purpose here. `restore_project` exists as a capability but was not invoked against either live project: there is nothing to restore from (no backups), and invoking a restore operation against the only copies of the current UAT/Demo data would itself be the kind of destructive, uncontrolled action this review is meant to prevent.

Instead, the concrete, safe thing that could be verified today — whether the data is actually extractable on demand, i.e. whether a manual backup is even technically possible — was tested directly:

| Environment | organizations | audit events | authority records | earliest audit event | latest audit event | audit-event-chain SHA-256 |
| --- | ---: | ---: | ---: | --- | --- | --- |
| UAT | 6 | 309 | 16 | 2026-08-28 22:08 UTC | 2026-09-07 15:11 UTC | `ee761bf231636b06d11563a79bb97cbd17d063d055d7180bbfcf202604ca55a8` |
| Demo | 5 | 261 | 9 | 2026-09-03 11:40 UTC | 2026-09-07 02:33 UTC | `02bb46be2967ea6220dccc8b9350d4b2b57d123e562d15e90b663b5761508d92` |

The SHA-256 is a hash over the ordered `event_id` sequence of `organization_audit_events` at the moment of the query — a cheap, real tamper-evidence checksum, not a full data export (a full export was deliberately not taken or committed to this repo; a git repository is not a backup store, and even synthetic test data shouldn't be dumped into version control as a matter of habit). This confirms service-role access can enumerate and checksum the full audit trail today, which is the prerequisite for a real manual export — but no scheduled, redundant, or off-Supabase copy exists, and none was created today.

### What "restore" means right now: untested and effectively unavailable

There is nothing to restore from, so restore was not and could not be tested. This is stated plainly rather than glossed over.

### Recommendation (not performed — requires a paid decision Steve needs to make)

1. Upgrade at least the UAT project (and Demo, before any real pilot data lands there) to the Supabase Pro plan to enable automated daily backups; evaluate the PITR add-on given the audit/evidence-integrity requirements in this same P2 gate.
2. Once Pro-tier backups exist, run one real, documented restore drill using Supabase's "Restore to a new project" / duplicate-project path (supabase.com/docs/guides/platform/clone-project), which restores into a **separate** project rather than overwriting the live one — this is the actual safe way to prove restore works, and it should replace the branch-based approach considered and rejected above.
3. Record that drill's result (time to restore, data verified present, checksum compared against the pre-restore snapshot) as the next dated entry in this document.

## 2. Incident response process — did not exist; runbook below is new

No incident-response document, escalation path, or severity framework existed anywhere in the repo before today. The runbook below is scoped to this stack's actual components (Next.js/Vercel, Supabase/Postgres, Stripe, Resend, HubSpot-pending) and is meant to be actually usable, not aspirational.

### Detection

- Vercel deployment/runtime errors and Supabase project health (`ACTIVE_HEALTHY` status, `get_advisors` security/performance lints — both projects currently return `ACTIVE_HEALTHY`).
- `authority_private.reconciliation_runs` status: any `blocked` or `variance` day (see `docs/RECONCILIATION-LOG.md`) is itself a low-severity incident signal — a broken reconciliation day means recorded state and provider/audit state have diverged.
- Stripe Dashboard alerts (webhook delivery failures, disputes) and Resend delivery-event webhooks (`/api/webhooks/resend`) already wired for participant/team invitation delivery.
- No centralized alerting/paging exists yet (no Sentry, no on-call tool connected). Today, detection is manual/dashboard-based. This is a gap worth closing before real customer data, but is separate from this review's two owned items.

### Severity

| Severity | Definition | Example |
| --- | --- | --- |
| SEV1 | Real customer/institution data exposed, corrupted, or unrecoverable; payment integrity broken | A leaked service-role key; a reconciliation run shows money/entitlement mismatch involving a paid, non-test order |
| SEV2 | Production-path outage or integrity risk without confirmed data loss | Webhook signature verification failing; reconciliation `blocked` due to unresolved provider events for two+ consecutive days |
| SEV3 | Degraded but contained | A single stuck outbox/inbox row (see today's actual reconciliation findings), delivery delay, non-security bug |

### Immediate containment steps, by component

- **Supabase service-role key compromise:** rotate the key in Supabase project settings (Project Settings → API), redeploy Vercel with the new `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, and review `authority_private.command_receipts` and `organization_audit_events` for actions taken with the old key before rotation.
- **Stripe key compromise or webhook forgery suspicion:** roll the Stripe secret/webhook-signing key in the Stripe Dashboard, redeploy with the new secrets, and cross-check `authority_private.provider_event_inbox` (`signature_status`) for any `invalid`-signature rows that were nonetheless processed.
- **Suspected unauthorized data access:** query `organization_audit_events` and `authority_events` for the affected organization(s) — both are append-only (enforced by `authority_private.prevent_*_mutation()` triggers, already covered by `scripts/verify-gate1-database.mjs`) — to reconstruct exactly what happened before taking further action.
- **Database-level incident (corruption, accidental destructive migration):** pause further writes if possible (`pause_project` is available but pauses the whole project — weigh against active-user impact), and follow the backup recommendation above; today, absent backups, this scenario has no vendor-side recovery path, which is precisely why section 1's recommendation is a blocker, not a nice-to-have.

### Evidence preservation

Do not delete or "clean up" `organization_audit_events`, `authority_events`, `commercial_event_ledger`, `authority_institution_decisions`, `authority_private.command_receipts`, or `authority_private.reconciliation_runs` rows during an incident — all are append-only by design and are the primary forensic record. Take a fresh checksum (see section 1's query) immediately at incident detection time, before any remediation, so the pre-remediation state is fixed and comparable afterward.

### Communication and postmortem

No customers hold real data yet, so there is no customer-notification obligation today. Before that changes (P2 exit), this section needs an owner-approved customer-communication template and a named decision-maker for breach-notification timing — currently unassigned. Every SEV1/SEV2 should get a written postmortem appended to this file once one occurs; there is no history to record yet.

## 3. Audit-log and evidence retention — real findings

- `organization_audit_events`, `authority_events`, `authority_private.commercial_event_ledger`, `authority_institution_decisions`, and `authority_private.commercial_adjustments` are all append-only, enforced by `before update or delete` triggers that raise on any mutation attempt. This was already exercised by `scripts/verify-gate1-database.mjs` (asserts a direct `update` against `organization_audit_events` fails) — not re-tested today, cited as existing evidence.
- Current volume, both environments combined: 570 audit events, 16 + 9 = 25 authority records, spanning August 28 – September 7, 2026 (UAT) and September 3–7, 2026 (Demo).
- **No retention policy is documented anywhere, and none was enforced before today** — there is no purge/archival job (confirmed: `pg_cron` extension is available but not installed in either project, and no scheduled job of any kind exists in-database or in this repo). In practice, retention today is "as long as the live Postgres instance exists," which is a single point of failure given section 1's finding of zero backups. Sufficiency for reconstructing an incident is real but fragile: the data to reconstruct what happened is present and hash-verifiable today, but there is currently no redundant copy of it anywhere.

## Bottom line for the P2 gate

Backup/restore capability: **not present, tested today and confirmed absent, requires a paid-plan decision to close.** Incident-response process: **did not exist, now documented above.** Audit/evidence retention: **real and currently sufficient, but fragile — same root cause as backup/restore (Free-plan, single-instance, zero redundancy).** None of this should be read as ready for real institution data; it should be read as an accurate account of exactly what is and isn't true today, which is what the P2 gate calls for.
