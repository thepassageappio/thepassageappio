# Public multi-institution listing opt-in: scoping note (2026-09-29)

Status: scoped, not built. The ask was "if small, build it; otherwise scope it". It is not small
because the settings toggle cannot be built without a new privileged database command.

## What exists today (main 6d78a16)

- Requester search: `/start/multi-institution/[groupId]` calls `searchInstitutionsAction`
  (`src/app/multi-institution-actions.ts`), which calls `public.search_institutions_v1(p_query)`,
  a thin invoker wrapper over `authority_private.search_institutions_v1`
  (`supabase/migrations/20260913150500_...phase0_functions.sql`). That function is SECURITY DEFINER,
  executable by `anon` and `authenticated`, and lists every organization with
  `status = 'active' and onboarding_status = 'ready'` whose name matches (limit 10).
- Adding a target: `authority_private.add_submission_target_v1` accepts any active, ready
  organization id, whether or not it was found by search. Unmatched free-text targets are allowed.
- There is no per-institution requester "direct link". Institutions reach people with invite links
  (`/r/[token]`) that they send themselves. The proposed copy "people can only reach you with your
  direct link" would promise a feature that does not exist.
- Organization writes: `authenticated` has SELECT only on `public.organizations` (forced RLS).
  Every organization change goes through a SECURITY DEFINER RPC with command receipts
  (idempotency), `version` checks, and for owner/admin `authority_private.require_privileged_mfa_v1`.
- New organizations are created only by `create_organization` (gate 1 foundation migration), which
  does not name new columns, so a column default of `false` covers new orgs with no RPC change.
- Demo (read-only query, 2026-09-28 21:20 PT): 6 active+ready orgs, 1 active+terms_required,
  1 closed+ready.

## Why it is not small

The search filter and the column are small. The toggle is not:

1. It needs a new SECURITY DEFINER RPC (for example
   `authority_private.set_organization_public_listing_v1(p_organization_id, p_listed, p_expected_version, p_idempotency_key)`
   plus a `public` invoker wrapper) that checks owner/admin role, calls
   `require_privileged_mfa_v1`, checks `version`, writes a command receipt, updates the column,
   bumps `version`, and inserts one `organization_audit_events` row in the same transaction.
2. It needs new `grant execute ... to authenticated` lines. SECURITY DEFINER grants are being
   re-audited on another branch (11 anon and 9 authenticated functions). This batch was told to stay
   out of that area.
3. The only way to skip the RPC is a server action using the service-role client to update and then
   insert the audit row. That is two separate writes, not atomic, and breaks the engineering rule
   "write state and append-only event atomically".
4. The search function change is also a SECURITY DEFINER body change on a function the other branch
   is auditing (`create or replace` keeps grants, but the two branches must not both redefine it).

## Proposed build (one PR, after the SECURITY DEFINER audit lands)

Migration `2026MMDDhhmmss_org_public_listing_opt_in.sql` (idempotent):

```sql
alter table public.organizations
  add column if not exists listed_for_public_requests boolean not null default false;
-- Backfill once, only where the column was just added, so a re-run does not undo an opt-out.
-- Use a guard such as a one-row marker table or a DO block that checks
-- information_schema before the ALTER. Backfill: status = 'active' and onboarding_status = 'ready'.
create or replace function authority_private.search_institutions_v1(p_query text) ... 
  where ... and o.listed_for_public_requests  -- grants unchanged by create or replace
-- New RPC set_organization_public_listing_v1 + public wrapper + grants (see above).
-- Audit row: event_type 'organization_public_listing_changed', subject_type 'organization',
-- payload {"listed": true|false, "previous": ...}.
```

Decide with the owner whether `add_submission_target_v1` should also refuse unlisted orgs by id.
Today an id can only come from search, so filtering search is enough for the requester UI, but the
RPC would still accept an unlisted id from a crafted call.

UI: `src/app/app/organization/page.tsx`, owner/admin only, one checkbox form posting to a server
action that calls the RPC with the org `version` and a fresh idempotency key. Suggested copy (no
promise of a direct link):

- Label: "Show my institution in the list when people start a request"
- On: "People can find you by name and send you a request."
- Off: "People will not see you in the list. You can still send them a request link yourself."

Deploy ordering (app deploys before Ops applies migrations):

- Search needs no app change. The filter lives in the SQL function, so search keeps today's
  behavior until the migration is applied.
- The settings page must not select the new column directly. Read it through the new RPC or a
  `select('*')` and treat a missing field as "listed" (today's behavior). Hide the toggle, or show it
  disabled with "This setting is not ready yet", when the RPC returns PostgREST `PGRST202`
  (function not found) or the field is absent.
- Server action: map `PGRST202` / `42883` to a plain "Try again later" message.

Tests: SQL regression (new org defaults off, backfill sets existing active+ready on, re-run keeps an
opt-out, search hides unlisted, non-admin and no-MFA callers rejected, stale version rejected,
idempotent replay returns the original result, one audit row per real change); domain test for the
missing-column fallback; browser check as owner (toggle off, search from a requester session no
longer shows the org, toggle on, it returns).

Risks: guided demos break if the backfill misses a demo org (check Demo counts before and after);
two branches redefining `search_institutions_v1`; copy promising a direct link that does not exist.
