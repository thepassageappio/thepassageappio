# Cycle 8 isolated proof-loop application evidence

Recorded: 2026-07-19 13:42:25 -07:00

## Scope and authorization

- This record covers the guarded Cycle 8 database application and rollback-only SQL matrix on the isolated project `uyacxqtsiwlvtmhxvoxr` only.
- Independent SQL QA passed the exact reviewed migration and rollback-test hashes before application and authorized this isolated application. A later PM recovery note saying that no migration application was authorized did not have the completed SQL-gate result; for this isolated SQL step only, it is superseded by the earlier exact-hash SQL QA authorization. It remains controlling for the still-unproven application/browser/deploy slice.
- Preflight reported the isolated project as `ACTIVE_HEALTHY` on PostgreSQL 17.
- Production project `qsveqfchwylsbncsfgxe` was prohibited and untouched.

## Exact retained baseline before application

| Record | Exact count |
| --- | ---: |
| Organizations | 1 |
| Organization locations | 1 |
| Workflows | 2 |
| Tasks | 3 |
| Workflow events | 8 |
| Invitations | 2 |
| Invitation-location rows | 2 |
| Active organization members | 2 |
| Revoked organization members | 1 |
| Active member-location grants | 2 |

## Reviewed artifacts and execution

- Migration: `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql`
  - SHA-256: `CA860B7D3590B88FDB5D4E02CB502A9A3642B38FAE602CA25CCFC7AFBCBFA408`
  - Applied through migration tooling as version `20260719203647`.
- Rollback-only matrix: `supabase/tests/cycle_8_task_proof_loop.sql`
  - SHA-256: `06880BE16B29006AA182D2D9EFE789D84110D8744E494F31E448CF2793E7FE62`
  - Executed without error inside its transaction and completed with `ROLLBACK`.
- The matrix exercised catalog, ACL, RLS, submit/review/replacement, replay/conflict, stale-version atomicity, assignment and authority denials, anti-branching, append-only integrity, and exact fixture cleanup behavior.

## Post-application state

- `task_proofs`: 0 rows.
- `task_proof_reviews`: 0 rows.
- Public submit and review RPCs are present.
- Every retained baseline count listed above remained unchanged.
- The rollback matrix left no proof or review fixture rows behind.

## Advisor and recovery evidence

- Security advisor: only the pre-existing leaked-password-protection warning; no new RLS or exposed-write error.
- Performance advisor: INFO-level unused-index notices only, including indexes on the new empty tables; no missing-index or RLS error.
- Recovery proof: all test mutations were transaction-local and rolled back. The migration is additive, and its guarded fixture-cleanup boundary is restricted to the isolated synthetic project and retained sentinel rows.

## Release boundary

- No Vercel Preview or Production deployment was created for this step.
- No Production Supabase or Vercel configuration was changed.
- Application/browser QA at 1440, 390, and 360 remains pending. No hosted responsive, accessibility, hydration, console, or runtime PASS is claimed.
- Cycle 8 release status remains **PARTIAL**. `[qa-approved]` is not authorized.
