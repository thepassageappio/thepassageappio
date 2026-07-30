# Workflow-message trigger search-path source evidence

Recorded: 2026-07-28 22:45:47 -07:00
Role: Messaging Security/Engineering `/root/messaging_p1_engineering`
Reviewed source base: PR #74 head `dff62760e6e7139ab5a2ef8b8c6f9f887a524411` in an isolated archive

## Change boundary

The follow-up migration contains one statement only:

`alter function passage_private.reject_workflow_message_mutation() set search_path = '';`

It targets the exact zero-argument append-only trigger function. It does not replace the function body, change its owner or ACL, detach or recreate the trigger, alter message authority or grants, change RLS, or touch application code.

Recovery, if independently reviewed and required, is a later forward migration that resets the function setting. Applied migration history must not be rewritten.

## Source assertions

The rollback-only SQL matrix now fails closed unless:

- exactly one `passage_private.reject_workflow_message_mutation()` function with zero arguments exists;
- `pg_proc.proconfig`, expanded through `pg_options_to_table`, records an empty `search_path`;
- the enabled `workflow_messages_append_only` row trigger remains attached to `public.workflow_messages`; and
- its trigger type remains exactly row-level `BEFORE UPDATE OR DELETE`.

No SQL was run. No Supabase project, Vercel environment, deployment, branch, pull request, or Production resource changed.

Exact source hashes:

- `supabase/migrations/20260729053000_workflow_messages_trigger_search_path.sql`: `4DB886BE8512F3A822A7876A85C1692979CB07CB63A6C6070368B11D4745449D`
- Superseded assertion source, retained for evidence history: `supabase/tests/workflow_messages_client_projection.sql` was `3122CF00A4BB7DA2857F013361E58BB7057E629CE3A16A4EBD61EC37EB9A1C04`
- Corrected assertion source: `supabase/tests/workflow_messages_client_projection.sql` is `CFE980EDF43BB10B4BCBF9552EC49CD56E5AA37D9541624EB87A9644C4749AF1`
- `scripts/test-workflow-messaging-security.js`: `2DE373B7D23E80CA7F3487A6D36463B1A7B4148E253CD067A5D20103DBAF1311`

Assertion correction: `pg_options_to_table` represents the empty
`search_path` setting as the quoted empty identifier. The exact catalog
comparison is now
`function_option.option_value = pg_catalog.quote_ident('')`. It does not use
`IN`, a pattern, trimming, or another permissive comparison. The migration is
unchanged.

## Named deferred performance debt

`MESSAGING-FK-INDEX-01` — Owner: **Engineering / DB Performance**. Target: **before pilot-load testing and the 75% full-platform performance exercise**.

The existing `workflow_messages_workflow_idx` covers the `workflow_id` foreign-key access path. The remaining message foreign keys—`organization_id`, `sender_user_id`, `sender_organization_member_id`, and `sender_continuity_participant_id`—do not receive speculative indexes in this security-only correction. The owner must run isolated Supabase advisors plus representative `EXPLAIN (ANALYZE, BUFFERS)` at pilot-like cardinality, then add the justified indexes in a separate reviewed migration and repeat advisor/write-cost checks.

This is named QA infrastructure/performance debt, not `QA: N/A`, and it must be resolved or explicitly dispositioned before the pilot-load/75% exercise.

## Evidence verdict

- Source QA: focused static PASS — messaging security 17/17; parity ledger 19 contracts; parity regression 15/15; persona-language PASS
- Hosted Preview QA: NOT RUN
- Production Deployment: NOT DEPLOYED
- Production QA: NOT RUN
- Overall release state: SOURCE PARTIAL

## External Independent Data QA - later 2026-07-28 handoff

This later evidence preserves and supersedes only the earlier “No SQL was run” limitation. External Independent Data QA role `/root/urgent_data_qa` reported **PASS** for the hash-bound messaging database packet against isolated Supabase project `uyacxqtsiwlvtmhxvoxr`. The Development Engineer making this evidence update did not execute SQL or touch Supabase.

Locally recomputed SHA-256 bindings:

- Foundational messaging migration `supabase/migrations/20260727020000_workflow_messages_thin_slice.sql`: `4BD25BA04144BAE47683880782696068C877801C83D20187D870B8CCE22F3B93`
- Least-privilege/client projection migration `supabase/migrations/20260729034001_workflow_messages_client_projection.sql`: `97805F1BF66001FC13EDC23FB5AD3853B46D6CF76ABBDF5C3608B118CABADE80`
- Trigger search-path migration `supabase/migrations/20260729053000_workflow_messages_trigger_search_path.sql`: `4DB886BE8512F3A822A7876A85C1692979CB07CB63A6C6070368B11D4745449D`
- Rollback-only matrix `supabase/tests/workflow_messages_client_projection.sql`: `CFE980EDF43BB10B4BCBF9552EC49CD56E5AA37D9541624EB87A9644C4749AF1`
- Post-QA source guard `scripts/test-workflow-messaging-security.js`: `1E6BB890627F1E01C8F7B5B6016F5556CD86EAA2B4419DF3234F07F5FEEA5768`

The external matrix coverage included exact catalog/function/trigger/ACL/RLS preflight; positive list/post behavior for the family owner, updates-scoped participant, managed director, and exact-location assigned staff; non-updates, revoked participant, cross-organization, wrong-location, unassigned staff, and revoked staff denials; direct authenticated table SELECT/INSERT/UPDATE/DELETE denial; bounded sender labels; exact replay plus changed-actor and changed-body conflict behavior; no-write cardinality after every denial/conflict; and append-only UPDATE/DELETE rejection.

Rollback proof covered ten relations: `auth.users`, `public.continuity_spaces`, `public.continuity_participants`, `public.organizations`, `public.organization_locations`, `public.organization_members`, `public.organization_member_locations`, `public.workflows`, `public.tasks`, and `public.workflow_messages`. The external role reported that pre-run and post-rollback row counts and deterministic ordered fingerprints matched exactly for all ten and that the run persisted zero fixture change. Its handoff did not supply a run timestamp or the full fingerprint strings. No timestamp or fingerprint value is invented in this record; a later exact evidence rerun may still be required if those values are needed for promotion.

Advisor-equivalent catalog evidence found no release-blocking security or integrity advisory for this packet. Index findings remained informational: `workflow_messages_workflow_idx` covers `workflow_id`; `organization_id`, `sender_user_id`, `sender_organization_member_id`, and `sender_continuity_participant_id` remain `MESSAGING-FK-INDEX-01` INFO debt for representative pilot-cardinality `EXPLAIN (ANALYZE, BUFFERS)` and a separate reviewed index decision before pilot-load/75% performance testing. INFO debt does not convert the database security matrix to PARTIAL.

Verdicts:

- External Independent Data QA: PASS
- Source QA: messaging database packet PASS; repository integration remains PARTIAL because the inherited operational-route mismatch is unchanged
- Hosted Preview QA: NOT RUN
- Production Deployment: NOT DEPLOYED
- Production QA: NOT RUN
- Overall release state: SOURCE PARTIAL

No replacement commit exists yet. These artifacts are an uncommitted, hash-bound correction based on PR #74 head `dff62760e6e7139ab5a2ef8b8c6f9f887a524411`; they are not evidence for a new GitHub head. Any source change invalidates the Data QA binding and requires replacement exact-hash review.

## Executable-assertion lexical guard correction - 2026-07-28 23:43 -07:00

Independent source QA proved the earlier post-QA guard could accept the canonical predicate when it existed only inside a double-quoted identifier or dollar-quoted string. That lexical-proof claim is **INVALIDATED**; the unchanged database packet and external Data QA result remain preserved at the hashes above.

The replacement source guard tokenizes executable SQL and procedural `DO` bodies while excluding line comments, nested block comments, standard and backslash-aware `E` strings, escaped double-quoted identifiers, and tagged or untagged dollar strings. It matches the canonical comparison as an ordered executable token sequence and rejects the obsolete executable comparison.

Adversarial source results:

- line and nested block comment decoys: rejected;
- standard and `E` string decoys: rejected;
- double-quoted identifier decoy: rejected;
- tagged and untagged dollar-string decoys: rejected;
- obsolete executable comparison: rejected;
- actual executable canonical comparison: accepted.

Focused messaging security: **23/23 PASS**. The originally recorded replacement-guard SHA-256 `5FBF688AC1C74D6D7AECD6DBFDE3FBAA011EBC2FCCA70562F156F97C949E0B53` was later found not to bind the final committed guard and is **STALE**. The canonical committed blob is 15,625 LF bytes with SHA-256 `21C4A9389A154E459FB2D76382BDA77DD4FFB75B2679CC12C13FF585CD2ABFFF`; the 23/23 suite was rerun against that logical source during the 2026-07-29 combined-candidate correction. No migration or SQL-matrix hash changed.

No migration, rollback matrix, parity contract, product source, live SQL, database, GitHub, Vercel, Preview, or Production state changed. Distinct source rereview is required; repository integration remains PARTIAL because the inherited operational-route mismatch is unchanged.
