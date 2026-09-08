# Current Passage checkpoint

Updated September 7, 2026.

## Verified

- Real-production four-persona synthetic journey, reviewer access, matching receipts, decline cleanup, recovery, authenticated 360/390 mobile, desktop, and keyboard evidence.
- Production invitation and team delivery work; one Gmail message was silently dropped after provider acceptance.
- Production `provider_event_inbox` was observed with zero unresolved events, but separate stuck HubSpot/Stripe rows and notification history work still block a clean reconciliation verdict.
- P0 demo readiness is closed: the real four-persona production rehearsal passed.
- `thepassageapp.io` is served by the Git-connected Vercel project `passage-authority-uat`, which now auto-deploys pushes to `main`.
- PR #90 fast-forwarded `main` to the previous `agent/founding-pilot-billing` tip.
- The real production database is Supabase `Passage Authority UAT`, not `passage-demo`.
- Release-provenance logic and `/api/version` endpoint have focused passing tests.
- Clean integration candidate based on `origin/main` `76e52dc`: 148 domain tests, TypeScript, lint, and optimized Next.js build pass after repairing the team-delivery audit allowlist and MFA enrollment typing.
- Privileged mutation MFA now has three layers in the candidate: `/app` routing, Server Action enforcement, and database RPC AAL2 enforcement. A disposable local Supabase reset applied every migration; a real JWT-claims test rejected an owner at AAL1 and allowed the owner at AAL2.
- Legal-review and vendor-risk/privacy briefing packets from the advanced Claude branch are preserved in the integration candidate without importing that divergent branch's deletions.

## Blocking

1. The reconciliation job ran once on both live environments and returned `blocked`; zero clean days are credited. UAT has tracked migration `20260907035519`; Demo reports an older applied copy at `20260905233220`. Confirm SQL equivalence and migration bookkeeping before applying anything again.
2. The stuck HubSpot row, two stuck Stripe rows, and `notification_outbox` history bug remain unresolved until separately investigated, repaired, and verified. One Stripe row is a known test event; the other may be a real defect.
3. Supabase currently documents app-level TOTP as included on Free and enabled for all projects. Candidate code/build and local AAL enforcement pass; hosted configuration, owner/admin enrollment and re-challenge, recovery/backup-factor behavior, and production mutation replay remain.
4. First clean reconciliation plus seven consecutive clean calendar days.
5. Supabase production is on Free with no backups; owner plan decision remains open.
6. Backup/restore/incident, privacy/security/vendor-risk, and five-state counsel evidence.
7. The integration candidate is not merged or deployed; production `main` still lacks these fixes and progressive checkpoints.

## Non-blocking backlog

- Register and DNS-verify the authenticated sending domain in Google Postmaster Tools before real customer email volume; low volume may not populate dashboards immediately.
- Add an institution-authorized cancel/withdraw action for a request still awaiting the principal, with append-only audit and all-persona receipt behavior.
- Prepare the truthful SOC 2 path and timeline answer before the first sales conversation; do not claim an audit is underway without ownership, funding, and an engagement.

## Commercial hold

P1 infrastructure is prepared but the pipeline is not launched. Cold outreach, LinkedIn publication, buyer-facing demos, and real-data pilots remain held until **P1 and P2 both close**. Drafting, research, and synthetic QA continue.

## State track

Validation order: New York, Pennsylvania, New Jersey, Connecticut, Massachusetts. Current product and public copy remain New York only. Pennsylvania requires a specific review of whether `representative_certification` satisfies its statutory agent Acknowledgment requirement.

For full evidence and identifiers, read [../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md](../AUTHORITY-COMPASS-EXECUTION-UPDATE-2026-09-07.md).
