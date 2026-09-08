# Current Passage checkpoint

Updated September 8, 2026 UTC.

## Verified

- Real-production four-persona synthetic journey, reviewer access, matching receipts, decline cleanup, recovery, authenticated 360/390 mobile, desktop, and keyboard evidence.
- Production invitation and team delivery work; one Gmail message was silently dropped after provider acceptance.
- UAT and Demo each compute `clean` after the exact provider repair described below: zero unresolved inbox/outbox rows and zero reconciliation variances.
- P0 demo readiness is closed: the real four-persona production rehearsal passed.
- `thepassageapp.io` is served by the Git-connected Vercel project `passage-authority-uat`, which now auto-deploys pushes to `main`.
- PR #90 fast-forwarded `main` to the previous `agent/founding-pilot-billing` tip.
- The real production database is Supabase `Passage Authority UAT`, not `passage-demo`.
- Release-provenance logic and `/api/version` endpoint have focused passing tests.
- Clean integration candidate based on `origin/main` `76e52dc`: 148 domain tests, TypeScript, lint, and optimized Next.js build pass after repairing the team-delivery audit allowlist and MFA enrollment typing.
- Privileged mutation MFA now has three layers in the candidate: `/app` routing, Server Action enforcement, and database RPC AAL2 enforcement. A disposable local Supabase reset applied every migration; a real JWT-claims test rejected an owner at AAL1 and allowed the owner at AAL2.
- Legal-review and vendor-risk/privacy briefing packets from the advanced Claude branch are preserved in the integration candidate without importing that divergent branch's deletions.
- The live `notification_outbox_send_history` fix was recovered verbatim into `20260907213516_notification_outbox_send_history.sql`; the shadow migration is now source controlled and applies from zero locally.
- UAT's pending internal demo HubSpot projection was canceled through a service-only function with append-only ledger evidence. Demo's two unmatched test Stripe events were independently tied to non-Passage test invoices and resolved as `synthetic_test_event`, also with append-only ledger evidence.
- Demo's missing organization-member summary and team-invitation delivery migrations are applied and their functions/columns are present.
- Reconciliation now permits the valid paid-then-refunded history of one activation audit while still rejecting active allowances or duplicate activation audits after refund.

## Blocking

1. The immutable September 8 UTC daily runs were recorded as `blocked` before the repair and remain unchanged. Current computation is clean in both environments, but zero days are credited; September 9 UTC is the first possible clean streak day.
2. Supabase currently documents app-level TOTP as included on Free and enabled for all projects. Candidate code/build and local AAL enforcement pass; hosted configuration, owner/admin enrollment and re-challenge, recovery/backup-factor behavior, and production mutation replay remain.
3. Seven consecutive clean calendar-day runs beginning no earlier than September 9 UTC. Internal clean computation does not satisfy the later full Stripe/Passage/HubSpot three-way check while HubSpot credentials remain unconfigured.
4. Supabase production is on Free with no backups; owner plan decision remains open.
5. Backup/restore/incident, privacy/security/vendor-risk, and five-state counsel evidence.
6. The integration candidate is not merged or deployed; production `main` still lacks these fixes and progressive checkpoints.

## Non-blocking backlog

- Register and DNS-verify the authenticated sending domain in Google Postmaster Tools before real customer email volume; low volume may not populate dashboards immediately.
- Add an institution-authorized cancel/withdraw action for a request still awaiting the principal, with append-only audit and all-persona receipt behavior.
- Prepare the truthful SOC 2 path and timeline answer before the first sales conversation; do not claim an audit is underway without ownership, funding, and an engagement.

## Commercial hold

P1 infrastructure is prepared but the pipeline is not launched. Cold outreach, LinkedIn publication, buyer-facing demos, and real-data pilots remain held until **P1 and P2 both close**. Drafting, research, and synthetic QA continue.

## State track

Validation order: New York, Pennsylvania, New Jersey, Connecticut, Massachusetts. Current product and public copy remain New York only. Pennsylvania requires a specific review of whether `representative_certification` satisfies its statutory agent Acknowledgment requirement.

For full evidence and identifiers, read [../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md).
