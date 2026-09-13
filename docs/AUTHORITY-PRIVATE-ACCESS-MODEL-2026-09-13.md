# authority_private access model — verified September 13, 2026

**Prepared for:** Steve
**Purpose:** A live re-verification of PR #105 ("Fix new-owner MFA and harden private-table RLS," merged `f99da278a`) found that `SET ROLE service_role` is denied with `permission denied for table` on all 22 `authority_private` tables in UAT, identical to `SET ROLE anon`. `information_schema.role_table_grants` shows exactly one grantee across all 22 tables: `postgres`. Read in isolation, that looks like a broken production access path, since PR #105's description says it added RLS "while preserving the service-command boundary." This document records what was actually checked and why the finding is expected, correct behavior — not a regression.

## Verdict

**Not a bug. No GRANT, RLS, or code change was made as a result of this check.** The missing `service_role` table grant is intentional and was never required. The application never queries `authority_private` tables directly through PostgREST's table/REST interface — it can't, because `authority_private` is not in the exposed-schema list (`supabase/config.toml` → `api.schemas = ["public", "graphql_public"]`), and it doesn't need to, because every read/write path goes through `SECURITY DEFINER` command functions that run as the functions' owner regardless of the caller's table-level grants.

## The actual mechanism

1. **App code never touches `authority_private` tables directly.** Every function in `src/lib/authority/*` that needs private-schema data calls `supabase.rpc("<name>_v1", params)` — e.g. `src/lib/authority/participant-session.ts`, `src/lib/authority/sample-access.ts`. Nothing does `.from("authority_private....")`.
2. **The RPC call resolves to a `public.<name>_v1` wrapper function**, since `public` is the only user schema PostgREST exposes. These wrappers are one-line pass-throughs, e.g. (`supabase/migrations/20260830225500_authority_evidence_rpc_boundary.sql`):
   ```sql
   create or replace function public.get_participant_evidence_context_v1(p_session_token text, p_authority_record_id uuid)
   returns jsonb language sql security definer set search_path = ''
   as $$ select authority_private.get_participant_evidence_context_v1(p_session_token, p_authority_record_id); $$;
   ```
3. **The wrapper calls the real implementation in `authority_private`, which is `SECURITY DEFINER` and owned by `postgres`.** Live query against UAT (`ywlrxdjibngroycwnujg`) confirms every command/query function in `authority_private` — `get_participant_evidence_context_v1`, `get_participant_decision_receipt_v1`, `get_participant_session_context_v1`, `get_participant_cancellation_v1`, `has_sample_access_lead_v2`, `create_sample_access_lead_v2`, `activate_authority_request_v1`, `review_evidence_artifact_v1`, `submit_participant_decision_v1`, and 11 others — is `prosecdef = true`, owned by `postgres`.
4. **`SECURITY DEFINER` means the function executes with the *owner's* privileges, not the caller's.** Since `postgres` owns every `authority_private` table (confirmed: all 22 tables, `relowner = postgres`) and every command/query function, the function body has full table access the instant it starts running — independent of whatever grants `service_role`, `anon`, or `authenticated` do or don't have on the underlying tables. Table-level `GRANT`s to `service_role` were never part of this design and PR #105 didn't remove any (there were none to remove — `role_table_grants` shows only `postgres`, before and after).
5. **`postgres` also bypasses RLS.** Live query: `postgres` has `rolbypassrls = true` (it is not a full Postgres superuser here — `rolsuper = false` — but it does carry the explicit bypass-RLS attribute Supabase grants it). Postgres's own rule is that RLS is skipped for a table's owning role by default unless `FORCE ROW LEVEL SECURITY` is set, which PR #105 did not set. So the 22 tables having RLS enabled with zero policies (`pg_policies` returns empty for the schema) is true default-deny for every role *except* the owner — exactly the design the migration's comment describes: *"RLS adds a second default-deny boundary without changing the SECURITY DEFINER command surface or service_role access model."*
6. **The functions still enforce real authorization**, independent of the Postgres privilege story above. Spot-checked two of the `SECURITY DEFINER` functions Supabase's own advisor flags as "executable by `authenticated`" (`activate_authority_request_v1`, `get_authority_notification_status_v1`): both call `authority_private.assert_authority_record_operator(...)` / `authority_private.has_active_membership(...)` and raise an exception if the calling user isn't an active member of the target organization. The advisor warning is a generic lint for any authenticated-executable `SECURITY DEFINER` function; it does not know about these internal checks. No change needed — this is the intended pattern for institution-side actions gated by org membership rather than by row-owner service accounts.

## Live confirmation this actually works today

Ran, inside a rolled-back transaction on UAT, as `service_role` (the same role the earlier check found blocked from direct table access):

```sql
begin;
set local role service_role;
select public.get_participant_decision_receipt_v1('bogus-token-for-permission-probe', gen_random_uuid());
rollback;
```

Result: `ERROR: 22023: participant_receipt_unavailable`, raised from inside `authority_private.get_participant_decision_receipt_v1`'s own validation logic — an ordinary "no matching session" business error, not a permission or grant error. This proves the call reached the private schema, ran its query, and returned a normal application-level result under `service_role`, exactly as production traffic does. No `permission denied` occurred anywhere in the call path.

Parity check on Demo (`bklrclpertdtmhycpqlz`) confirms the same role configuration (`postgres` and `service_role` both `rolbypassrls = true`; `role_table_grants` on `authority_private` shows only `postgres`) — the two environments are consistent.

## What "preserving the service-command boundary" means, precisely

PR #105's description is accurate but relies on codebase-specific shorthand that's easy to misread. "Service-command boundary" refers to the set of `SECURITY DEFINER` functions in `authority_private` (the "service commands") — not to `service_role` holding direct table grants. The migration's own schema comment says this directly: *"Non-exposed service-command schema. Base tables use default-deny RLS and revoke browser-role privileges; approved functions remain the application boundary."* Nobody should read "service-command boundary" as implying `service_role` needs, has, or should be given `SELECT`/`INSERT`/`UPDATE`/`DELETE` grants on `authority_private` tables. It never has, and it doesn't need to.

## Why this data is still live (173 rows in `command_receipts`, 124 in `provider_webhook_events`, etc.)

Every one of those rows was written by an `authority_private.*_v1` `SECURITY DEFINER` function (owned by `postgres`) called through a `public.*_v1` RPC wrapper — via `createAuthorityAdminClient()` (`service_role` key) for service-only paths, or the session-scoped client for `anon`/`authenticated` paths. None of it was written by anything holding a direct table grant, and none of it required one.

## Action items from this check

- **No GRANT, RLS policy, or migration change required.** The access model is working as designed on both UAT and Demo.
- **No code change required.** `src/lib/authority/*` already exclusively uses the RPC boundary; there is no direct-table-access code path to fix.
- Recommend future live-verification passes test the actual application boundary (`select public.<fn>_v1(...)` as the relevant role) rather than raw `SELECT ... FROM authority_private.<table>`, since the latter is expected to fail for every role except `postgres` by design and is not part of any real request path.

## P0 status conclusion

The `authority_private` GRANT/RLS question that prompted this check is **resolved — not a defect, and not a blocker.** Combined with the already-recorded MFA enrollment fix (PR #105/#106, confirmed working in prior persona QA), there is no open item from this line of investigation blocking P0. Any remaining P0/P1/P2 gates (deterministic invitation delivery, timed/keyboard/accessibility rehearsal, remaining hosted negative-path evidence — see `docs/V2-DELIVERY-ROADMAP.md` and `docs/GO-NO-GO-STATUS-CHECK-2026-09-12.md`) are unrelated to this schema and unaffected by this finding.
