# Cycle 8 RLS audit — 2026-07-26

Status: dated addendum, evidence-only. Does not change `docs/product/operational-readiness-roadmap.md`'s scoring directly — that's a Product Manager decision — but should inform the next scoring pass. Cross-references `supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql` and `supabase/tests/cycle_8_task_proof_loop.sql` on `bot/cycle-8-task-proof-loop`.

## Why this exists

Owner instruction, 2026-07-26: investigate the actual reason PR #24/#30 keep coming back "Cycle 8 SQL/RLS remains FAIL/PARTIAL," using the Supabase MCP against the isolated test project only, with real verification queries rather than claims. This is that verification, plus a root-cause diagnosis of why the official regression suite can't currently confirm it.

## Project identity, confirmed twice independently

- `list_projects` via Supabase MCP: `uyacxqtsiwlvtmhxvoxr` = **"passage-cycle-7a-test"**; `qsveqfchwylsbncsfgxe` = **"thepassageappio's Project"** (production).
- Independently cross-checked: the live preview's `/staff` login page HTML embeds `"supabaseUrl":"https://uyacxqtsiwlvtmhxvoxr.supabase.co"` directly in its client bundle.
- Every query in this audit ran inside `begin; ... rollback;` against `uyacxqtsiwlvtmhxvoxr` only. `qsveqfchwylsbncsfgxe` was never queried, migrated, or connected to in this session.

## What was independently verified (real queries, real results)

Built a fresh, collision-free synthetic fixture (its own org/location/users, IDs prefixed `dddddddd-...`, never touching the shared Cycle 7A/7B/8 baseline rows) inside a rollback-only transaction, then ran six checks directly against the live `submit_task_proof_idempotent` / `review_task_proof_idempotent` RPCs and the `task_proofs` / `task_proof_reviews` RLS policies:

1. **Unassigned staff denied submit** — a staff member not assigned to the task got `42501` on submit. PASS.
2. **Assigned staff submits successfully** — task moved `in_progress` → `proof_submitted`, version `1` → `2`. PASS.
3. **Wrong-org director: RLS SELECT denial + command denial** — a director in a different organization saw zero rows querying `task_proofs` directly by ID (RLS `cycle_8_task_proofs_authorized_select` policy holds — no BOLA leak), and got `42501` attempting to review. PASS.
4. **Staff cannot review their own proof** — role separation (`role not in ('owner','director')` check in `assert_task_proof_review_scope`) correctly denied the submitter's own review attempt. PASS.
5. **Correct-org, correct-location director verifies** — task moved `proof_submitted` → `completed`, version `2` → `3`, via `review_task_proof_idempotent`. PASS.
6. **Append-only holds** — a direct authenticated `UPDATE` on `task_proofs.completion_summary`, attempted by the original submitter, was denied with `42501` (the `reject_task_proof_mutation` trigger holds even for the row's own author). PASS.

All 6 real, adversarial checks passed. This is independent evidence — a fresh QA pass, not a rerun of the original author's assertions — that the Cycle 8 RLS/authority model as currently deployed to the isolated lab is sound for the scenarios tested.

## Root cause of "FAIL/PARTIAL": test baseline drift, not a schema defect

The official rollback-only regression suite, `supabase/tests/cycle_8_task_proof_loop.sql`, refuses to even start:

```
ERROR: 42501: Cycle 8 tests refused: retained isolated baseline drifted
```

Its preflight hard-codes exact global counts against the frozen Cycle 7A/7B fixture: exactly 8 `workflow_events`, exactly 0 `task_proofs`, exactly 0 `task_proof_reviews`, among others. Querying the live table directly:

- `workflow_events` currently has **10** rows, not 8. The two extra: `task.proof_submitted` and `task.proof_verified`, both dated `2026-07-26`, both real and committed (not inside a rolled-back transaction).
- `task_proofs` has **1** row, not 0: `"Called Maya Rivera and confirmed the arrangement meeting for Thursday 2pm at the Portland location."`, submitted `2026-07-26 02:45:07 UTC`, reviewed/verified `2026-07-26 02:47:05 UTC`. Task `c7b20001-...-001` (case `NS-2051`) is now `status = completed`, `version = 6`.

This reads as genuine functional exercise of the real `/staff` → `/director` proof flow — almost certainly the parallel frontend/routes lane's own testing against this same shared isolated project — not leftover cruft from an improperly-rolled-back test. The schema and RLS are doing exactly what they're supposed to do here: a real submit-and-verify cycle happened and produced a durable, correctly-authorized outcome.

The problem is that `cycle_8_task_proof_loop.sql`'s preflight was written assuming it has the isolated lab to itself — a single frozen baseline, checked by exact global counts. That assumption no longer holds now that multiple lanes share `uyacxqtsiwlvtmhxvoxr` concurrently (which is the intended, sanctioned use of that project — see the owner's 2026-07-24 clarification that agents share this identity/environment by design). The test isn't wrong to refuse when it can't guarantee isolation; it's just brittle in a way that will keep tripping every time another lane touches this database, which given the current multi-agent setup is going to be often.

## What this changes and what it doesn't

- **Does not** change Cycle 8's roadmap score directly — that's explicitly a Product Manager decision per `docs/product/operational-readiness-roadmap.md`'s "Decision ownership" section, not an audit's to make unilaterally.
- **Does** provide real, fresh evidence that the underlying RLS/authority model is sound, which the next PM scoring pass should weigh alongside the fact that the *official* automated suite currently can't run to completion for an environmental reason, not a correctness one.
- **Recommended next engineering step** (not done in this pass — scoping it accurately is real work its own right): make `cycle_8_task_proof_loop.sql`'s preflight resilient to concurrent multi-lane usage — for example, scope its assertions to the specific fixture IDs it created and cares about rather than global exact-count sentinels — so it stops refusing to run every time a different lane legitimately exercises the shared lab. This is a test-file change only; no schema or production risk.

## What was not touched

No migration was applied. No RLS policy, trigger, or function was modified. No row was inserted, updated, or deleted outside a transaction that ended in `rollback`. Production project `qsveqfchwylsbncsfgxe` was never referenced by any query in this session.
