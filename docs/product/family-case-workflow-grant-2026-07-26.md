# Family/participant case-workflow read grant — 2026-07-26

Status: dated addendum, evidence for `supabase/migrations/20260726040000_family_case_workflow_grant.sql`. Cross-references the case-detail lane's own note in `lib/family/case-view.ts` (PR #51, `app/case/[id]/today` shell), which named this exact gap and the exact function name (`passage_private.can_view_workflow_as_family`) this migration implements.

## Why this exists

Owner-directed lane, 2026-07-26: the case-detail builder found that no family/participant identity existed anywhere in the schema, RLS, or RPCs — `organization_members.role` is hard-constrained to `owner|director|staff`, and `can_view_workflow`/`can_view_task` only grant org staff/managers. This blocked `/case/[id]/*` entirely. Directed to add the minimal real grant, migration + RLS only, verified with adversarial checks, database layer only (frontend/routes stayed with the parallel case-detail and vendor lanes).

## What was found before writing any SQL

The premise ("zero family identity anywhere in the schema") was half right. A full continuity/participant system already exists and is live on `passage-cycle-7a-test` (`uyacxqtsiwlvtmhxvoxr`): `continuity_spaces` (a family's own space, one active per owner), `continuity_participants` (invited relatives, with a `category_scope` array already anticipating per-section access), `participant_invitations` (a complete token-based create/accept/decline/revoke/rotate flow mirroring the staff invitation pattern), and `family_provider_selections` (records which funeral home a family picked, including `handoff_available` once a real organization/location resolves). Roughly 30 functions across `public`/`passage_private` implement this.

What doesn't exist: any structural link from that world to `public.workflows` (the org's actual case rows). `workflows` had no `continuity_space_id` column, `family_provider_selections` links a continuity space to an *organization*, not to a specific *case*, and `confirm_family_provider_selection` only ever inserts a `workflow_events` row with `workflow_id = null` — confirmed by reading its function body directly. So the case-detail builder's finding was correct in substance: there was no way for a family to be granted read access to a specific case, even though the family-side identity model was otherwise complete.

## What shipped

`supabase/migrations/20260726040000_family_case_workflow_grant.sql`:

- `workflows.continuity_space_id` — nullable FK to `continuity_spaces.id`, `on delete set null`, plus a partial index.
- `passage_private.can_view_workflow_as_family(workflow_id)` — new predicate: true if the workflow has a linked continuity space and the caller can view that space (owner or active participant), mirroring the existing `can_manage_location`/staff pattern.
- `can_view_workflow`, `can_view_task`, `can_view_workflow_event` — each re-defined to `or` in the new family predicate. No RLS policy DDL touched anywhere: `workflows`, `tasks`, `task_proofs`, `task_proof_reviews` all already gate their `SELECT` policy through `can_view_workflow`/`can_view_task`, so the grant propagates automatically.
- Nothing populates `continuity_space_id` for any row. Linking a specific case to a family's space (the actual "handoff" action) is business logic for the case-detail lane to build next, not part of this pass.

## Independent adversarial verification (real queries, real results)

Built a fresh, collision-free fixture (org, location, director, staff, workflow, task; a "Rivera family" continuity space with one active and one revoked participant; an unrelated "Outsider family" space) inside a single rollback-only transaction against `uyacxqtsiwlvtmhxvoxr`, then ran 10 checks as the real `authenticated` Postgres role with `auth.uid()` impersonation per check:

| # | Check | Result |
| --- | --- | --- |
| 1 | Continuity-space owner views the linked case (`workflows`) | PASS |
| 2 | Owner views the case's task | PASS |
| 3 | Owner can query the case's `workflow_events` without error | PASS |
| 4 | Active `continuity_participant` views the linked case | PASS |
| 4b | Active participant views the case's task | PASS |
| 5 | **Revoked** participant denied (0 rows) | PASS |
| 6 | An unrelated family's owner denied (cross-tenant isolation) | PASS |
| 7 | Family owner cannot write to the workflow — actually caught at the table-grant level (`permission denied for table workflows`, no `UPDATE` grant to `authenticated` exists at all), a stronger guarantee than RLS alone | PASS |
| 8 | Regression: assigned org staff still views the case unaffected | PASS |
| 9 | Regression: staff at a different, unrelated org still denied | PASS |

10/10 passed. Fixture and role/session state were fully rolled back; verified zero residual rows afterward (`leftover_workflow`/`leftover_spaces`/`leftover_orgs` all `0`).

`task_proofs`/`task_proof_reviews` were not directly fixture-seeded in this pass — `task_proofs` has an insert-time trigger (`assert_task_proof_scope`) that requires `auth.uid()` to match the real submitter and the task to be `in_progress` at insert time, making a raw fixture insert non-trivial without going through the real RPC. Their family-visibility is nonetheless a direct, provable consequence of checks 2/4b: both tables' `SELECT` policies are `passage_private.can_view_task(task_id)` verbatim (confirmed via `pg_policies`), and `can_view_task` is exactly what checks 2/4b exercised — so once `can_view_task` returns true for a family caller, `task_proofs`/`task_proof_reviews` visibility follows by construction, not by separate assumption.

`get_advisors` (security) before and after the migration returned the same single pre-existing warning (`auth_leaked_password_protection`, unrelated to this change) — no new advisory was introduced.

## A drift issue found, not fixed, along the way

While tracing the continuity/participant schema, found that 3 migrations already applied and tracked on `passage-cycle-7a-test`'s own migration history — `20260723072450_participant_invitation_thin_slice`, `20260723080309_participant_advisor_hardening`, `20260723092402_family_provider_discovery` — have no corresponding `.sql` files committed to git on any branch checked (`greenfield/passage-zero`, `feat/family-case-detail-shell`). The database bookkeeping is intact (`list_migrations` shows all 3 as applied versions); only the version-controlled source is missing.

This migration necessarily depends on that schema (`continuity_spaces`, `can_view_continuity_space`, etc.), so it will only reproduce correctly against a Supabase project that already has those 3 migrations' effects — which is true today of `passage-cycle-7a-test`, but would not be true of a freshly provisioned project built only from what's in git.

Reconstructing roughly 30 functions plus their tables, indexes, RLS policies, and triggers from live introspection alone — with no way to confirm the exact original file boundaries or byte-for-byte original SQL — was judged too large and too risky to attempt silently in this pass; an imperfect reconstruction presented as historical fact would itself be exactly the kind of "looks done, isn't" work this effort is trying to eliminate. Recommending this as its own explicitly scoped follow-up: a dedicated reconciliation migration (or three, matching the tracked versions) written by whoever has the most direct context on the original participant/continuity build, verified against live introspection rather than guessed.

## What was not touched

No file under `app/` was touched (frontend/routes stayed with the case-detail and vendor lanes, per instruction). No RLS policy DDL was modified — only the underlying `SECURITY DEFINER` functions the policies already delegate to. No row was inserted, updated, or deleted outside a transaction that ended in `rollback`. Production project `qsveqfchwylsbncsfgxe` was never referenced.
