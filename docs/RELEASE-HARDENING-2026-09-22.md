# Consolidated release hardening

This candidate closes the submission token and storage access gaps found in the September 21 audit and restores the source quality checks. Base main: `61ee1260b9281389ea79653034d093617293c169`.

## Included

- Trusted server execution for requester initiation, submission, and evidence registration. Browser roles cannot call either public or private versions of those functions. Verification and requester-session checks remain in place.
- Submission evidence is inaccessible directly to browser roles. Server upload validates the requester session, group, draft state, and expected version before writing bytes. The database checks the mutation again.
- Participant access-link flash is restricted to allowlisted Demo presenters, after the recipient allowlist check. Production no longer creates or displays it. Copy describes bearer access accurately.
- Fixed stale test fixtures, the email-rendering module boundary, request-view prop types, and lint findings. No checks were disabled.
- CI runs domain tests, typecheck, lint, build, a clean migration replay, and the submission SQL security regression. Repository administrators still need to configure these jobs as required branch checks; adding a workflow does not enforce branch protection.

## Validation

Local `pnpm verify` passed: 221 domain tests, typecheck, lint, and optimized build. The full migration chain, including `20260922013126_submission_server_boundary.sql`, replayed successfully into a new isolated Supabase database. `supabase/tests/submission_server_boundary.sql` passed with all fixtures rolled back: anonymous and authenticated privilege denial, storage read/upload denial even under an additional permissive policy, service-role initiation, verification replay, and cross-group session denial.

The existing public-security, reviewer-role, and terminal/recovery SQL suites also passed. One legacy public-security assertion was corrected to expect the existing notification function's `authority_request_not_found` response for an inaccessible organization. The denial remains required; application authorization behavior was not changed to satisfy the test.

Tests use synthetic addresses and send no email. The existing local database and hosted environments were not used for migration testing.

## Rollout

September 22 update: PR #144 (`15335f5`) has green CI and both preview builds. The security migration was applied once to each hosted database, Demo first, then Production. Rollback-based hosted boundary checks passed; follow-up queries found zero synthetic test rows. No recovery migration was applied. Main merge and application rollout await explicit approval after automatic approval review rejected the merge; the old submission commands currently fail closed. The steps below are the release procedure, not a claim that deployment has completed.

1. Confirm the PR head matches green CI and review the application/migration pair together.
2. Apply only the new forward migration through the tracked migration process on Demo, then Production after Demo validation. Do not replay already-applied historical migrations to reconcile different hosted migration timestamps.
3. Release the reviewed Git commit through the repository's Git-triggered Vercel path. Old submission initiation/submission commands fail closed between the migration and compatible application deployment; coordinate that short interruption. Server service-role configuration is required, as it already is for evidence uploads.
4. Verify exact `/api/version` SHA on both domains and run public smoke, synthetic authenticated flows, and receipt replay. Do not repeatedly deploy while a quota rejection remains unresolved.

Pushing this branch does not apply hosted migrations, merge main, or establish that a release is live. Supabase local success does not establish hosted role/configuration parity.

## Still open

This package does not complete durable submission copy/invitation recovery, NY legacy provenance and draft pinning, full policy/catalog publication, a fresh five-persona hosted acceptance run, or seven consecutive operational reconciliation days. Keep those audit findings open. Demo restoration has completed, but that alone is not a release-readiness decision.
