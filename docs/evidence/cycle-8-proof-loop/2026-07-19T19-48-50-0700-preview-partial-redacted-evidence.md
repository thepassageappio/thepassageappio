# Cycle 8 Preview preparation and hosted-QA partial evidence

Recorded: 2026-07-19 19:48:50 -07:00

## Release status

- Decision: **PARTIAL / hosted browser QA blocked**.
- This record combines the already-passed isolated SQL gate with the later isolated identity preparation and non-production Preview build evidence.
- It does not establish a hosted staff proof submission, director review, replacement, verification, replay, reload, responsive, accessibility, console, hydration, or runtime-behavior PASS.
- No `[qa-approved]` marker, Production authorization, readiness increase, or public/pilot claim is supported by this evidence.

## Exact reviewed SQL artifacts

- Migration: `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql`
  - SHA-256: `CA860B7D3590B88FDB5D4E02CB502A9A3642B38FAE602CA25CCFC7AFBCBFA408`
  - Applied through migration tooling only to the isolated project.
- Rollback-only matrix: `supabase/tests/cycle_8_task_proof_loop.sql`
  - SHA-256: `06880BE16B29006AA182D2D9EFE789D84110D8744E494F31E448CF2793E7FE62`
  - Executed without error inside its transaction and completed with `ROLLBACK`.
- The matrix passed catalog, ACL, RLS, submit/review/replacement, replay/conflict, stale-version atomicity, race uniqueness, authority denial, append-only integrity, proof-pending reassignment, and exact cleanup checks.

## Isolated identity preparation

- Canonical committed artifact hashes use the UTF-8/LF bytes published by the Passage Bot:
  - `supabase/test-fixtures/cycle_8_hosted_active_staff_identity.sql`: `99D12A634F286E2379D66C250F2DDC6E8FC50EFB7E084FBAF56A8FDB701802E3`
  - `supabase/test-fixtures/cycle_7b_hosted_workload.sql`: `4E4D193DA0BA143F5A6D32F13FE828E8F365CB490B3FED10BEDC5F8188EBE349`
  - `supabase/tests/cycle_8_hosted_active_staff_identity.sql`: `17D22A8306560FD91EC7948BA8872F1A98DB2E98134D79041B7BEFC9ECD32268`
- The earlier mixed-CRLF worktree hash for the Cycle 7B fixture is not the canonical GitHub artifact hash and must not be used for exact-head review.
- Scope was restricted to isolated Supabase project `uyacxqtsiwlvtmhxvoxr`; Production project `qsveqfchwylsbncsfgxe` was prohibited and untouched.
- A controlled synthetic staff identity was created through the isolated Auth Admin path. Its email, Auth identifier, and credentials are intentionally omitted.
- Guarded DML bound that Auth identity to the already-reserved isolated staff membership. No new organization, location, workflow, task, invitation, grant, proof, review, or workflow-event row was created by the bind.
- Replaying the guarded bind passed and produced no duplicate or additional authority row.
- A redacted pre/post digest comparison matched. The retained relational counts remained exactly: one organization, one location, two workflows, three tasks, eight workflow events, two invitations, two invitation-location rows, two active plus one revoked organization member, two active member-location grants, zero task proofs, and zero proof reviews.
- No customer, family, participant, vendor, Production, or external-message data was used or changed.

## Non-production Preview configuration

- Ten additional environment variables were saved only for Vercel Preview branch `bot/cycle-8-preview-qa`. Their values are not reproduced here.
- The variables provide the existing isolated Preview runtime, isolated public Supabase binding, provider-disable controls, and controlled synthetic password-auth path needed by the bounded QA branch.
- The existing `greenfield/passage-zero` branch configuration was not replaced or changed.
- No repository-wide or Production Vercel environment value was added, removed, or changed.
- No service-role credential, private key, password, cookie, bearer/share token, or Production value is recorded in this artifact.

## Replacement Preview build evidence

- Canonical Vercel project: `prj_b7CKwanQaKwFQSHInr3l6wsZy9nD`.
- Deployment: `dpl_BpB5P1zqK4FtNBBo7E2yMhbYjZ4P`.
- Exact commit: `e62002e5601f7e06a1645e29a4d9da2476f714df`.
- Exact throwaway QA branch: `bot/cycle-8-preview-qa`.
- Status: `READY`.
- Target: `null` (non-production Preview).
- Build duration: 26 seconds.
- Build log scan: no warning, error, or fatal entry was returned.
- The throwaway branch opens the documented verification-Preview gate only for hosted QA and must never merge into the Passage Zero integration branch. Its normal ignore gate must be restored after the QA attempt is closed.

## Hosted browser QA blocker

- Fresh browser automation was redirected to Vercel deployment protection rather than the Passage application.
- A signed-in connector authorization handshake was attempted through the existing authorized path but stalled before producing a usable Passage session.
- The owner’s existing signed-in Vercel and Supabase admin tabs were preserved. No owner sign-out, credential entry, session replacement, or protection bypass was attempted.
- Because the application could not be reached in a fresh independent browser context, no Passage staff login or proof mutation was attempted and no 1440, 390, or 360 screenshot was captured.
- Consequently, there is no hosted evidence for staff submit, director review, replacement, verification, replay, reload persistence, wrong-role/organization/location/assignment denial, responsive overflow, accessibility, console, hydration, or runtime behavior.

## Production and readiness boundary

- Production Supabase project `qsveqfchwylsbncsfgxe` was untouched.
- Production Vercel configuration and deployment were untouched.
- Family access, vendor fulfillment, pricing, and external communications were untouched.
- Funeral-home readiness remains **94% guided / 40% operational**.
- D2C readiness remains **85% guided / 25% operational**.
- The truthful next release-train state is PM re-scope for the protected hosted-browser access path, followed by independent QA on this exact Preview or an equivalently bounded replacement only if the governing release process authorizes it.
