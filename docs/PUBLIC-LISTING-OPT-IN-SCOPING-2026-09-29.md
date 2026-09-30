# Public multi-institution listing opt-in: scoping note (2026-09-29)

Status: **built-in-PR** (eng/org-public-listing-opt-in). Default remains **off**. There is **no
backfill** that sets `listed_for_public_requests = true` for active+ready orgs (CoS/Steve: opt-in,
not auto-on). Ops must apply migration `20260930100000_org_public_listing_opt_in.sql` **Demo first,
then prod**, after the tip is live. Demo orgs that need multi-institution search must opt in via the
Organization UI (or Ops SQL) after the migration. Guided Path B demos use invite links and stay OK
while default-off.

## What exists today (main 6d78a16; behavior before this PR)

- Requester search: `/start/multi-institution/[groupId]` calls `searchInstitutionsAction`
  (`src/app/multi-institution-actions.ts`), which calls `public.search_institutions_v1(p_query)`,
  a thin invoker wrapper over `authority_private.search_institutions_v1`
  (`supabase/migrations/20260913150500_...phase0_functions.sql`). That function is SECURITY DEFINER,
  executable by `anon` and `authenticated`, and (before this PR) listed every organization with
  `status = 'active' and onboarding_status = 'ready'` whose name matches (limit 10).
- Adding a target: `authority_private.add_submission_target_v1` accepts any active, ready
  organization id, whether or not it was found by search. Unmatched free-text targets are allowed.
  **Known gap (out of scope for this PR):** it still accepts an unlisted org id from a crafted call.
- There is no per-institution requester "direct link". Institutions reach people with invite links
  (`/r/[token]`) that they send themselves.
- Organization writes: `authenticated` has SELECT only on `public.organizations` (forced RLS).
  Every organization change goes through a SECURITY DEFINER RPC with command receipts
  (idempotency), `version` checks, and for owner/admin `authority_private.require_privileged_mfa_v1`.
- New organizations are created only by `create_organization` (gate 1 foundation migration), which
  does not name new columns, so a column default of `false` covers new orgs with no RPC change.

## Built in this PR

Migration `supabase/migrations/20260930100000_org_public_listing_opt_in.sql` (idempotent):

- `alter table public.organizations add column if not exists listed_for_public_requests boolean not null default false;`
- **No** backfill to `listed = true`.
- `search_institutions_v1` adds `and o.listed_for_public_requests` to the WHERE.
- New RPC `set_organization_public_listing_v1` (private + public MFA wrapper): owner/admin, version,
  command receipts, advisory lock, audit `organization_public_listing_changed` on real changes;
  no-op when already at the desired value (no version bump, no audit).

UI: `src/app/app/organization/page.tsx`, owner/admin only:

- Label: "Show my institution in the list when people start a request"
- On: "People can find you by name and send you a request."
- Off: "People will not see you in the list. You can still send them a request link yourself."
- Pre-migration (column/RPC missing): disabled copy "This setting is not ready yet."

Deploy ordering:

1. App tip live (toggle hidden/disabled until migration).
2. Ops applies migration Demo → prod.
3. Demo orgs that need search must opt in.

Tests: `supabase/tests/org_public_listing_opt_in.sql`; domain unit test for missing-column fallback.
