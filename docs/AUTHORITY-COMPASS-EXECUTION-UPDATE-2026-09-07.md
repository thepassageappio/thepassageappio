# Authority Compass 771204 — September 7 execution update

This checkpoint supersedes stale lower-table status text in `V2-DELIVERY-ROADMAP.md` while preserving its historical evidence.

## Verified now

- The real-production four-persona synthetic rehearsal is complete, including independent receipt comparison and clean decline-based closure of the duplicate request.
- Authenticated 360px and 390px QA, desktop, keyboard, reviewer access, newest-link recovery, receipt replay, and production participant/team delivery are verified in the latest evidence documents.
- The isolated Gmail nonarrival was a receiving-mailbox silent drop after provider acceptance. It is not a Passage delivery failure.
- UAT and Demo now each compute `clean`: zero unresolved inbox/outbox rows and zero reconciliation variances after audited provider cleanup and a corrected refund invariant.
- P0 demo readiness is closed. The real four-persona rehearsal passed on production.
- `thepassageapp.io` is served by Vercel project `passage-authority-uat`, now connected to GitHub and auto-deploying from `main`.
- PR #90 fast-forwarded `main` to the former `agent/founding-pilot-billing` tip.
- Real production data is Supabase `Passage Authority UAT`, not `passage-demo`.

## Still blocking release

- The September 7 and September 8 UTC immutable daily results remain `blocked`. The repair does not rewrite history, so the seven-day streak remains at zero and can start September 9 UTC.
- The UAT HubSpot row was an internal demo inquiry with no configured worker and is now canceled through a service-only RPC with append-only audit evidence. Both Demo Stripe rows were proven unmatched test invoices, including the $20 row, and are now explicitly ignored with append-only evidence.
- The live notification send-history fix was a shadow migration. Its exact SQL is now recovered into Git, and fresh local replay passes. Demo's missing member-summary and team-delivery migrations are applied.
- Supabase currently includes app-level TOTP on Free, so availability does not require a plan upgrade. The integration candidate now passes 148 domain tests, TypeScript, lint, and the optimized build. Its database migration applied from zero locally and rejected an owner AAL1 JWT while allowing AAL2. Hosted configuration, owner/admin enrollment and re-challenge, recovery/backup-factor handling, and production replay remain. Supabase organization-member MFA enforcement is a separate paid-plan control.
- Production Supabase is on Free with no backups; upgrading is an owner decision.
- Backup/restore/incident evidence, privacy/security/vendor-risk review, and state-by-state counsel review remain required before real-data or buyer-facing release.

## Five-state launch validation

Target validation set: New York, Pennsylvania, New Jersey, Connecticut, and Massachusetts. Pennsylvania is required. Current product behavior and public copy remain New York only; do not claim five-state availability until each state has counsel-approved policy content, version/effective-date metadata, institution configuration, state-specific synthetic fixtures, negative-path QA, and copy review. Pennsylvania requires a specific determination of whether `representative_certification` captures its statutory agent Acknowledgment.

## Release provenance

Prior deployment work proved that “deployed” can diverge from “merged to main.” Production is releasable only when a clean `main` commit passes required checks, Vercel records that Git SHA, the deployed SHA equals `origin/main`, migrations match, and production smoke checks pass. Every release record must separately report merge/push state, Demo deployment, and Production deployment.

## Commercial package

- Positioning: **the operating record for delegated authority after the document arrives.**
- Lead line: **One institution decision, with clear scope and a record of what changes later.**
- Founding pilot: `$5,000`, 60–90 days, one institution, one team, one defined workflow, credited toward year one under the agreement.
- Annual budget discovery anchors: `$12,000`, `$24,000`, and `$36,000` for the same bounded scope. These are research anchors, not published tiers.
- P1 infrastructure is prepared but not launched. Cold outreach, LinkedIn article/posts, and buyer-facing demos remain drafted and held until P1 and P2 both close. P0 is closed.

## Execution order

1. On September 9 UTC, record the first clean run in UAT and Demo; continue until seven consecutive clean days are credited.
2. Merge and deploy the green MFA candidate, apply its database enforcement migration, then confirm hosted TOTP configuration and run owner/admin enrollment, challenge/verify, AAL1 denial, AAL2 success, fresh sign-in, factor management, and recovery in browsers.
3. Build the five-state policy matrix and counsel packet, including Pennsylvania Acknowledgment coverage in `representative_certification`.
4. Resolve the Supabase Free-plan/no-backup decision and complete backup/restore/incident, privacy/security/vendor-risk, and counsel gates.
5. Capture/verify the backup recording and refresh the buyer deck, one-pager, pricing talk track, cold outreach, LinkedIn article, and posts.
6. Configure HubSpot credentials and add live provider comparison before claiming full three-way reconciliation.
7. Launch P1 and any buyer-facing activity only after P1 and P2 are explicitly closed.

## Tracked follow-ons

- Before real customer email volume, register and DNS-verify the authenticated sending domain in Google Postmaster Tools and assign dashboard monitoring ownership.
- Add an institution-side cancel/withdraw transition for requests still awaiting the principal; the current decline-only cleanup is a real lifecycle gap but is not a launch blocker.
- Before the first sales conversation, have the truthful SOC 2 path and conditional timeline ready. Credit-union vendor diligence is risk-based, while Passage should assume buyers will ask for evidence and a credible assurance plan.
