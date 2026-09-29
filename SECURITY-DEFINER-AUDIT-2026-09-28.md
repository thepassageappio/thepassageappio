# SECURITY DEFINER execute audit: Passage Authority (2026-09-28, PT)

Scope: every SECURITY DEFINER function that the `anon` or `authenticated` role can execute on prod
(`ywlrxdjibngroycwnujg`) and Demo (`bklrclpertdtmhycpqlz`). Base: `origin/main` 6d78a16. Branch:
`sec/security-definer-lockdown` (local only, not pushed).

Method:
- Read-only catalog queries only, on both projects: pg_proc, pg_namespace, has_function_privilege,
  prosecdef, proconfig, proacl, pg_default_acl, pg_get_functiondef. No function was executed on
  prod or Demo, and nothing was applied.
- Local replay of all repo migrations on PostgreSQL 17 with a Supabase role/schema shim.
- Grep of `src/` for every `.rpc('<name>')`, plus SQL callers (prosrc) and RLS policy references.

## 1. Headline numbers

| | prod | Demo | local replay of main |
|---|---|---|---|
| SECURITY DEFINER in `authority_private` (anon / authenticated executable) | 100 (10 / 30) | 100 (10 / 30) | 100 (10 / 30) |
| SECURITY DEFINER in `public` (anon / authenticated executable) | 24 (1 / 9) | 24 (1 / 9) | 24 (1 / 9) |
| SECURITY DEFINER with PUBLIC EXECUTE | 0 | 0 | 0 |
| SECURITY DEFINER without pinned search_path (public, authority_private) | 0 | 0 | 0 |

That is 11 anon and 39 authenticated, matching the reported numbers. pgbouncer (1) and vault (2)
SECURITY DEFINER functions are not executable by client roles.

- **ACLs are byte-identical** across prod, Demo and the local replay for all 207 functions in
  `public` and `authority_private`.
- **Definitions:** all 39 in-scope functions are identical between prod and the repo.
- **Prod vs Demo, in scope:** the only difference is `organization_member_count_v1` (both
  schemas). It is CRLF line endings only; the logic is the same.
- **After the lockdown (local replay):**
  - anon can execute 10 SECURITY DEFINER functions (9 in authority_private, 1 in public).
  - authenticated can execute 35 (20 in authority_private, 15 in public). The public count grows
    only because 6 MFA wrappers that clients already called are now SECURITY DEFINER.

## 2. BLOCKERS

### BLOCKER 1: `submit_participant_decision_v1` gives the representative's secret link to the principal (anon-executable)

- **Functions:**
  - `public.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid)`, an
    invoker wrapper
  - `authority_private.submit_participant_decision_v1(...)`, SECURITY DEFINER
  - Both are executable by anon and authenticated on prod and Demo.
- **What's wrong:** when the principal confirms (`principal_confirm`), the function returns
  `representative_invitation_token`, the raw one-time token for the representative's invitation
  link. It also returns it on an idempotent replay with the same key.
- **How it could be exploited:** the app calls this RPC server-side with the user (publishable
  key) client and only uses the token to email the representative. The anon key is public, and
  the participant session token is the principal's own cookie. So anyone holding the principal's
  link can:
  1. Open the link to get a session.
  2. Read their own cookie.
  3. Call `POST /rest/v1/rpc/submit_participant_decision_v1` directly with the anon key.
  4. Receive the representative's token and exchange it at `/r/<token>`.
  5. Act as the representative: accept responsibility, upload evidence, certify.

  This breaks the principal/representative separation, which is a core control of the authority
  flow. It is not a cross-org read, but it is a privilege escalation inside a case, reachable
  with only the public anon key.
- **Fix:**
  - Code: `src/app/participant-actions.ts` now calls the RPC with `createAuthorityAdminClient()`
    (service_role). The session token is still verified inside the function.
  - Migration 20260929110000: the public wrapper becomes SECURITY DEFINER and is granted to
    service_role; the inner function becomes owner-only.
  - Migration 20260929110100: removes anon/authenticated from the public wrapper. This matches
    how every other session-token service RPC already works (`submit_representative_certification_v1`,
    `record_participant_evidence_upload_v1`, `get_released_representative_delivery_context_v1`).

### Not a blocker today, but high: MFA bypass if `authority_private` is ever exposed in the Data API

- The public wrappers for these functions enforced `require_privileged_mfa_v1` as SECURITY INVOKER:
  - `change_member_role_v1`
  - `invite_member_v1`
  - `request_pilot_invoice_v1`
  - `revoke_member_invitation_v1`
  - `revoke_member_v1`
  - `update_authority_draft_v1`
- Each one then called an `authority_private` SECURITY DEFINER function that has no MFA check and
  was itself granted to `authenticated`. `authority_private` also grants USAGE to anon and
  authenticated.
- The repo's `config.toml` and docs expose only `public, graphql_public`, so today there is no
  HTTP route to `authority_private.*`, and a direct call is not reachable. Exposed schemas can't
  be read via SQL, so this was not verified on hosted.
- If someone adds `authority_private` to exposed schemas, an owner or admin with a stolen aal1
  session could manage members and invoices without MFA.
- Fixed: the wrappers are now SECURITY DEFINER, and the inner functions are owner-only.

### Medium: the unused `create_authority_draft_v1` skipped v2's published-version binding

- The app uses `create_authority_draft_v2`. `public.create_authority_draft_v1` was still
  executable by authenticated, and calling it directly skipped v2's stale-published-permission
  check.
- It still required MFA and an operator role in the same org, so there was no cross-org impact.
- Revoked from client roles (not dropped).

No function lets anon or a member of another org read or modify another org's data. Every
org-scoped RPC checks `auth.uid()` membership and role for `p_organization_id`, and every token RPC
checks sha256(token) against the stored hash, plus expiry and status.

## 3. Per-function table (39 functions, identical grants on prod and Demo)

Legend: A = anon can execute, U = authenticated can execute, before the change. search_path is
`''` on all 39. "Caller" is who calls it in `src/`.

| # | Function | A | U | Caller in repo | Internal authorization | Verdict |
|---|---|---|---|---|---|---|
| 1 | authority_private.add_submission_target_v1 | Y | Y | anon client via public wrapper (requester intake) | requester session: sha256 hash, group, active, expiry | OK |
| 2 | authority_private.remove_submission_target_v1 | Y | Y | anon client via public wrapper | requester session | OK |
| 3 | authority_private.update_submission_group_details_v1 | Y | Y | anon client via public wrapper | requester session | OK |
| 4 | authority_private.get_requester_session_context_v1 | Y | Y | anon client via public wrapper | requester session; returns only its own group | OK |
| 5 | public.get_submission_delivery_status_v1 | Y | Y | anon client | requester session | OK |
| 6 | authority_private.verify_requester_email_v1 | Y | Y | anon client via public wrapper | token hash + expiry. Note: until the link expires, a new idempotency key mints another session (256-bit emailed token, low) | OK (note) |
| 7 | authority_private.exchange_participant_invitation_v1 | Y | Y | anon client via public wrapper (`/r/[token]`) | hash, one-time (status becomes accepted), expiry, revoked | OK |
| 8 | authority_private.preview_participant_invitation_v1 | Y | Y | anon client via public wrapper | hash. Note: shows names and account boundary even for an expired link (low) | OK (note) |
| 9 | authority_private.get_participant_session_context_v1 | Y | Y | anon client via public wrapper | participant session hash, expiry, record match | OK |
| 10 | authority_private.search_institutions_v1 | Y | Y | anon client via public wrapper | none by design (public directory of active + ready orgs). Note: `limit 10` sits on the jsonb_agg and has no effect | OK (note; see triage §7) |
| 11 | authority_private.submit_participant_decision_v1 | Y | Y | (via public wrapper) user client in participant-actions.ts | participant session | **BLOCKER. Revoke client roles; server-only** |
| 12 | authority_private.accept_member_invitation_v1 | - | Y | user client (`/team/accept`) | token hash, email match, pending, expiry | OK |
| 13 | authority_private.get_member_invitation_summary_v1 | - | Y | user client | token hash + email | OK |
| 14 | authority_private.accept_terms_v1 | - | Y | user client (onboarding) | owner of the org | OK |
| 15 | authority_private.select_template_v1 | - | Y | user client (onboarding) | owner/admin | OK |
| 16 | authority_private.create_organization_v1 | - | Y | user client (onboarding) | any confirmed user, one active org per user (self-serve by design; see §7) | OK (product risk §7) |
| 17 | authority_private.cancel_pending_request_v1 | - | Y | user client via public wrapper | owner/admin/staff + MFA, org-scoped | OK |
| 18 | authority_private.change_member_role_v1 | - | Y | public wrapper (MFA) only | assert_member_manager, no MFA inside | Revoke client roles; wrapper becomes SECURITY DEFINER |
| 19 | authority_private.invite_member_v1 | - | Y | public wrapper only | same | same |
| 20 | authority_private.revoke_member_v1 | - | Y | public wrapper only | same | same |
| 21 | authority_private.revoke_member_invitation_v1 | - | Y | public wrapper only | same | same |
| 22 | authority_private.request_pilot_invoice_v1 | - | Y | public wrapper only | owner/admin, no MFA inside | same |
| 23 | authority_private.update_authority_draft_v1 | - | Y | public wrapper only | operator (reviewers blocked by trigger), no MFA inside | same |
| 24 | authority_private.create_authority_draft_v1 | - | Y | public v1 wrapper, called only by v2 (SECURITY DEFINER) | operator | **Unused by clients: revoke** |
| 25 | authority_private.assert_authority_record_operator | - | Y | only SECURITY DEFINER functions | returns the caller's role | Revoke client roles |
| 26 | authority_private.require_privileged_mfa_v1 | - | Y | wrappers (all SECURITY DEFINER after the fix) | checks the caller's own JWT aal | Revoke client roles (defence in depth) |
| 27 | authority_private.has_active_membership | - | Y | 30 RLS policies | answers only about auth.uid() | **Keep authenticated** (RLS needs it) |
| 28 | authority_private.organization_member_count_v1 | - | Y | public wrapper (team page, user client) | member of the org | OK. The public wrapper loses PUBLIC/anon |
| 29 | authority_private.get_organization_billing_status_v1 | - | Y | user client via wrapper | owner/admin/auditor | OK |
| 30 | authority_private.get_published_permission_catalog_v1 | - | Y | user client via wrapper | member | OK |
| 31 | authority_private.get_privileged_mfa_status_v1 | - | Y | user client via wrapper | owner/admin + MFA | OK |
| 32 | public.activate_authority_request_v1 | - | Y | user client | MFA + operator, org-scoped. Returns participant tokens to institution staff by design | OK |
| 33 | public.create_authority_draft_v2 | - | Y | user client | MFA + operator + published-version pin | OK |
| 34 | public.get_authority_governing_context_v1 | - | Y | user client | MFA + member, org-scoped | OK |
| 35 | public.get_authority_notification_status_v1 | - | Y | user client | MFA + member, org-scoped | OK |
| 36 | public.publish_permission_catalog_v1 | - | Y | user client | MFA + owner/admin | OK |
| 37 | public.rebase_authority_ny_draft_v1 | - | Y | user client | MFA + operator | OK |
| 38 | public.reissue_participant_invitation_v1 | - | Y | user client | MFA + operator. Returns the new token to staff (they deliver it) | OK |
| 39 | public.review_evidence_artifact_v1 | - | Y | user client | MFA + reviewer role, org-scoped | OK |

Related invoker functions in public that were also changed:
- `public.change_member_role_v1`, `invite_member_v1`, `revoke_member_v1`,
  `revoke_member_invitation_v1`, `request_pilot_invoice_v1`, `update_authority_draft_v1`: now
  SECURITY DEFINER; grants are authenticated and service_role.
- `public.submit_participant_decision_v1`: now SECURITY DEFINER, service_role only after
  migration 110100.
- `public.create_authority_draft_v1`: revoked from every client role.
- `public.organization_member_count_v1`: was the only function in both schemas that still had
  PUBLIC and anon EXECUTE from the defaults. Revoked from PUBLIC and anon.

search_path: all SECURITY DEFINER functions in public and authority_private already had
`search_path=""` on prod, Demo and locally. Nothing needed pinning. The migration adds an
assertion that fails if that ever regresses.

### Prod vs Demo differences found (out of scope, none client-executable)

After normalizing CRLF, these definitions really differ (ACLs are identical):

| Function | Matches repo |
|---|---|
| authority_private.activate_authority_request_v1 (inner) | prod = repo; **Demo differs** |
| authority_private.record_institution_decision_service_v2 + public wrapper | prod = repo; **Demo differs** |
| authority_private.record_resend_delivery_event_v1 | Demo = repo; **prod differs** |
| authority_private.record_team_invitation_delivery_service_v1 | Demo = repo; **prod differs** |

- These differences are CRLF only: ingest_and_apply_stripe_event_v2, organization_member_count_v1,
  the two prevent_* triggers, provision_demo_run_v1, require_disclosure_before_institution_decision,
  submit_authority_for_review_v1.
- All of these are postgres-only or service_role-only, so the lockdown doesn't depend on them. Ops
  should reconcile the drift separately.

## 4. Migrations (all idempotent)

### `supabase/migrations/20260929110000_security_definer_execute_lockdown.sql`

Safe to apply before or after the app deploy.

1. `revoke execute ... public.create_authority_draft_v1(...)` and `authority_private.create_authority_draft_v1(...)` from public, anon, authenticated, service_role.
   - v2 still works because it is SECURITY DEFINER and calls v1 as the owner.
2. `revoke execute ... authority_private.assert_authority_record_operator(uuid)` from all client roles.
3. `alter function public.<6 MFA wrappers> security definer`.
   - Bodies and `search_path=''` are unchanged.
   - `auth.uid()` and `auth.jwt()` read request GUCs, so the caller's identity and aal are preserved.
   - Re-grants execute to authenticated and service_role, and revokes from public and anon.
   - Then revokes the 6 inner `authority_private` functions from all client roles.
4. `revoke execute ... authority_private.require_privileged_mfa_v1(uuid)` from all client roles.
5. Participant decision, phase 1:
   - `alter function public.submit_participant_decision_v1 security definer`
   - `grant ... to service_role`
   - revoke from public
   - revoke the inner function from all client roles.
   - anon and authenticated keep the public wrapper for now, so the old app keeps working.
6. `revoke execute ... public.organization_member_count_v1(uuid) from public, anon`, then grant to authenticated and service_role.
7. A read-only DO block that aborts the migration if:
   - any SECURITY DEFINER function in public or authority_private lacks a pinned search_path,
   - any is executable by PUBLIC, or
   - any locked function is still anon- or authenticated-executable.

### `supabase/migrations/20260929110100_participant_decision_server_only.sql`

**Apply only after the app deploy is live.**

- `revoke execute ... public.submit_participant_decision_v1(...) from public, anon, authenticated`
- `grant ... to service_role`
- An assertion that anon and authenticated can no longer execute it.
- This closes BLOCKER 1.

### `supabase/migrations/20260929110200_function_default_privileges.sql`

Independent; apply any time.

- `alter default privileges for role postgres revoke execute on functions from public;` (the
  global form)
- `alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;`
  - service_role keeps its public-schema default.
- An assertion.

Why this is safe, and why it's a separate file:
- It only affects functions created after it runs. Replay proves every earlier migration is
  unaffected.
- 206 of 207 existing functions already carry explicit revoke and grant statements, which is the
  house style.
- `CREATE OR REPLACE` keeps existing ACLs.
- PUBLIC can only be revoked with the global form, because per-schema defaults add to the global
  or built-in defaults and never subtract.
- Effect: a future migration that forgets a grant fails closed (permission denied, caught by the
  CI SQL tests) instead of open.
- It did break two test helpers that created `pg_temp` functions as postgres and called them as
  authenticated through the old implicit PUBLIC grant:
  - `authority_public_security_boundary.sql` (in CI)
  - `privileged_mfa_team_status.sql` (not in CI)
  - Both now grant explicitly. The same assumption would bite ad-hoc SQL-editor functions and
    hotfixes; that is the intended fail-closed behavior. It's split out so Ops can defer it
    without touching the security fixes.
- Defaults owned by `supabase_admin` cannot be changed from a migration and still grant
  anon/authenticated for functions Supabase itself creates in public.

## 5. App change and rollout order

`src/app/participant-actions.ts` `submitParticipantDecisionAction` now uses
`createAuthorityAdminClient()` for `submit_participant_decision_v1`. It reuses the same client for
the follow-up `get_released_representative_delivery_context_v1` call.

Proof that no client call remains for any revoked function:
- `rg` over `src/` finds exactly one caller of submit_participant_decision_v1 (now admin).
- There are no callers of `create_authority_draft_v1`.
- `authority_private.*` can't be reached through `supabase.rpc()`, which always targets `public`.
- The only in-database callers of the revoked inner functions are SECURITY DEFINER functions or
  the now-SECURITY DEFINER wrappers.
- No RLS policy or view references a revoked function.
- The new domain test enforces this (below).

Order:
1. Merge. Apply `20260929110000` (and optionally `110200`) at any time. The old and new app both
   work in that state; this was checked locally in a "phase 1" database where anon still succeeds
   through the public wrapper and service_role succeeds too.
2. Deploy the app.
3. Apply `20260929110100`.

**If 110100 is applied before the app deploy, participant decisions fail with permission denied.**

## 6. Tests and results (local, 2026-09-28 about 21:30 PT)

- **Local replay:** fresh DB from the shim template, all 79 migrations (76 existing + 3 new), one
  transaction per file, then seed.sql. **Clean.**
- **Idempotency:** each of the 3 new files re-applied twice onto the replayed DB; all succeed, and
  the lockdown test passes afterwards.
- **Phase 1 replay:** migrations up to but excluding 110100. The 7 CI SQL tests pass. The old
  anon participant-decision path works, the new service_role path works, and the inner function
  is denied.

SQL tests on the full replay:

| Test | Result |
|---|---|
| submission_server_boundary (CI) | PASS |
| submission_delivery_recovery (CI) | PASS |
| authority_public_security_boundary (CI, +explicit pg_temp grant) | PASS |
| authority_reviewer_role_boundary (CI, now uses v2 and asserts v1 is denied) | PASS |
| authority_terminal_and_recovery (CI) | PASS |
| ny_provenance_and_draft_pin (CI) | PASS |
| permission_publication_draft_binding (CI) | PASS |
| **security_definer_execute_lockdown (new, added to CI)** | PASS |
| authority_demo_runs, privileged_mfa_team_status, provider_resolution, stripe_negative_paths (non-CI) | PASS |
| pending_request_cancellation (non-CI) | FAIL, **the same failure on unmodified main** (`authority_events_are_append_only` at line 124); pre-existing, unrelated |
| verify-policy-snapshot-storage.mjs / verify-policy-source-storage.mjs (CI; run via a local `docker exec` shim against the replay DB) | PASS |

The new `supabase/tests/security_definer_execute_lockdown.sql` checks:
- **Catalog:** the locked functions are not anon- or authenticated-executable. service_role keeps
  the participant decision. The 10 intended public RPCs keep anon and authenticated. The
  authenticated RPCs keep authenticated and not anon. The 6 MFA wrappers are prosecdef.
- **No unsafe SECURITY DEFINER functions:** none has an unpinned search_path or PUBLIC EXECUTE.
- **No hidden callers:** no client-executable invoker function calls a locked function, and no
  RLS policy depends on one.
- **Default privileges:** postgres defaults no longer grant EXECUTE to anon or authenticated, and
  a probe function created in the test gets service_role only.
- **As anon, end to end:** preview works, exchange returns a session, and participant context
  works. submit_participant_decision_v1 is denied in both schemas. The requester flow works
  (verify email, session context, delivery status, update details). search_institutions works.
  Bad tokens get business errors, not permission errors. assert_authority_record_operator and
  organization_member_count_v1 are denied.
- **As an authenticated owner:**
  - Calling inner `invite_member_v1` or `update_authority_draft_v1` directly is denied.
  - At aal1, the public invite fails with `mfa_verification_required`.
  - The member count works.
  - At aal2, the invite succeeds through the SECURITY DEFINER wrapper, a cross-org invite is
    denied, and the participant decision is denied.
- **As service_role:** a bad session token is rejected. A valid principal session confirms and
  gets the representative token for server-side delivery.
- **Negative control:** against the unmodified main database, the test fails on its first
  assertion, listing all 12 locked functions.

Domain test: `src/lib/authority/security-definer-lockdown.test.mts`. It asserts:
- the participant action uses the admin client
- no other `src/` file calls submit_participant_decision_v1
- nothing calls the locked RPCs
- the migrations contain the expected revokes, security definer changes and default privileges
- the intended public RPCs are not revoked
- CI runs the new SQL test

Negative control: with the original participant-actions.ts, 1 of 4 fails.

`pnpm install --frozen-lockfile` and `pnpm verify` (Node 24.21.0, pnpm 10.17.1 as in CI): **green**.
350/350 domain tests, typecheck, lint and next build all pass.

## 7. Auth sign-up triage (report only; no change made)

What the app depends on:
- `requestSignInAction` (src/app/account-actions.ts) uses
  `signInWithOtp({ shouldCreateUser: true })`, and self-serve onboarding
  (`create_organization_v1`) relies on it. Google OAuth also creates users on first sign-in.
- Team invites are app-level (`invite_member_v1` + Resend email + `/team/accept`). A new invitee
  signs in with an email OTP, and **that creates their auth user**.
- So turning off **"Allow new users to sign up"** (Dashboard, Authentication, Sign In / Providers;
  Management API `PATCH /v1/projects/{ref}/config/auth` with `{"disable_signup": true}`) would
  break self-serve onboarding, first sign-in for newly invited staff, and new Google users.
- Magic links belong to the Email provider (`external_email_enabled`). You can't disable password
  sign-in without also disabling magic links.

What an attacker can do with a self-signed-up user under the current RLS and grants:
- **Read:** RLS allows only reference and catalog tables (jurisdiction packs, reason codes,
  authority type and permission definitions) and current terms documents. There is no row access
  to any org's data.
- **Storage:** denied (private buckets, restrictive server-only policy).
- **RPCs:** every org-scoped RPC requires active membership in `p_organization_id`, so there is no
  cross-org read or write. Password sign-up via `/auth/v1/signup` gives nothing beyond what OTP
  gives, as long as **Confirm email stays on (`mailer_autoconfirm: false`)**:
  `current_actor_id()` rejects unconfirmed emails. Ops should confirm this setting.
- **The real exposure: self-serve org creation with no Passage approval.** A new user can:
  1. Call `create_organization_v1` with any legal or display name (for example, a real bank's name).
  2. Accept terms and select a template. The org becomes active and ready immediately.
  3. The org then shows up in anon `search_institutions_v1`. Public requesters in the
     multi-institution intake could pick it and send POA details and documents to a fake
     institution.
  4. It gets the automatic `free_evaluation` entitlement (5 activations over 10 days, trigger
     `create_default_entitlement`).
  5. After enrolling TOTP, it can send Passage-branded invitation emails to arbitrary addresses
     (phishing through Passage's sender).
  6. One active org per user, but unlimited emails means unlimited orgs.

Recommendations:
1. Keep sign-ups on for now, because disabling them breaks onboarding and invites. Confirm:
   - `mailer_autoconfirm=false`
   - enable CAPTCHA (`security_captcha_enabled` + provider)
   - tighten `rate_limit_email_sent` and `rate_limit_otp`
   - set `password_hibp_enabled`
   - raise the minimum password length (or keep passwords unused)
2. If Passage wants sign-ups off: first switch staff invites to the service-role
   `auth.admin.inviteUserByEmail` / `generateLink({type:'invite'})`, and gate self-serve onboarding
   behind an allow-list. Then set `disable_signup: true`. Existing users can still sign in with
   magic links when sign-ups are disabled; only new-user creation stops.
3. **Product fix (recommended before public launch):** require Passage approval before an org
   becomes `ready`, appears in `search_institutions_v1`, or receives an entitlement. For example,
   add a `verified_at` / `listed` flag that only service_role sets, and filter
   `search_institutions_v1` on it.

## 8. Deliberately left alone

- `has_active_membership`: 30 RLS policies need authenticated EXECUTE, and it only answers about
  `auth.uid()`.
- The intended anon RPCs (rows 1 to 10 in §3): their internal checks are sound. No DB-level rate
  limit on the token RPCs. Tokens are 256-bit, anon `statement_timeout` is 3s, and requester
  intake (service_role) has its own limit. Edge or WAF rate limiting is the right layer.
- Low notes, reported only, not changed:
  - `search_institutions_v1` limit placement
  - `preview_participant_invitation_v1` shows details for an expired link
  - `verify_requester_email_v1` can mint several sessions per link before it expires
- `activate_authority_request_v1` and `reissue_participant_invitation_v1` return participant
  tokens to MFA-verified institution staff. That is by design (staff deliver them).
- `get_jurisdiction_pack_v1` and `get_organization_jurisdiction_pack_settings_v1` (public,
  invoker, not SECURITY DEFINER, authenticated-executable, unused by the app): out of scope.
- `storage.objects` still has anon/authenticated table grants (owned by supabase_storage_admin; a
  revoke by postgres is a no-op). The restrictive policy still denies clients.
- Prod/Demo definition drift in service-only functions (§3): not touched.
- No functions were dropped. No function bodies were changed.
- `pending_request_cancellation.sql` fails on main as well; not investigated further.

## 9. Read-only SQL for Ops after applying (run on Demo first, then prod)

```sql
-- A. Grants on every changed or intended function.
select f as function,
       has_function_privilege('anon', f, 'execute')          as anon,
       has_function_privilege('authenticated', f, 'execute') as authenticated,
       has_function_privilege('service_role', f, 'execute')  as service_role,
       (select prosecdef from pg_proc where oid = f::regprocedure) as security_definer,
       (select proconfig from pg_proc where oid = f::regprocedure) as config,
       (select pg_get_userbyid(proowner) from pg_proc where oid = f::regprocedure) as owner
from unnest(array[
  -- expected: anon f, authenticated f
  'public.create_authority_draft_v1(uuid,text,text,text,text,text,timestamp with time zone,text[],uuid)',
  'authority_private.create_authority_draft_v1(uuid,text,text,text,text,text,timestamp with time zone,text[],uuid)',
  'authority_private.assert_authority_record_operator(uuid)',
  'authority_private.change_member_role_v1(uuid,uuid,text,bigint,uuid)',
  'authority_private.invite_member_v1(uuid,text,text,uuid)',
  'authority_private.request_pilot_invoice_v1(uuid,date,date,integer,bigint,uuid)',
  'authority_private.revoke_member_invitation_v1(uuid,uuid,bigint,uuid)',
  'authority_private.revoke_member_v1(uuid,uuid,bigint,uuid)',
  'authority_private.update_authority_draft_v1(uuid,uuid,bigint,text,text,text,text,uuid)',
  'authority_private.require_privileged_mfa_v1(uuid)',
  'authority_private.submit_participant_decision_v1(text,uuid,bigint,text,boolean,text,uuid)',
  -- expected after 110100: anon f, authenticated f, service_role t, security_definer t
  'public.submit_participant_decision_v1(text,uuid,bigint,text,boolean,text,uuid)',
  -- expected: anon f, authenticated t, service_role t, security_definer t
  'public.change_member_role_v1(uuid,uuid,text,bigint,uuid)',
  'public.invite_member_v1(uuid,text,text,uuid)',
  'public.request_pilot_invoice_v1(uuid,date,date,integer,bigint,uuid)',
  'public.revoke_member_invitation_v1(uuid,uuid,bigint,uuid)',
  'public.revoke_member_v1(uuid,uuid,bigint,uuid)',
  'public.update_authority_draft_v1(uuid,uuid,bigint,text,text,text,text,uuid)',
  -- expected: anon f, authenticated t
  'public.organization_member_count_v1(uuid)',
  'authority_private.has_active_membership(uuid,text[])',
  -- expected: anon t, authenticated t (intended public RPCs)
  'public.exchange_participant_invitation_v1(text,uuid)',
  'public.preview_participant_invitation_v1(text)',
  'public.get_participant_session_context_v1(text,uuid)',
  'public.get_requester_session_context_v1(text,uuid)',
  'public.verify_requester_email_v1(text,uuid)',
  'public.add_submission_target_v1(text,uuid,bigint,text,text,uuid,uuid)',
  'public.remove_submission_target_v1(text,uuid,uuid,bigint,uuid)',
  'public.update_submission_group_details_v1(text,uuid,bigint,text,text,text,text,boolean,text,uuid)',
  'public.search_institutions_v1(text)',
  'public.get_submission_delivery_status_v1(text,uuid)'
]) f;

-- B. Counts. Expected after all 3 files: authority_private 100 / anon 9 / authenticated 20;
--    public 31 / anon 1 / authenticated 15. After 110000 only: public anon 2, authenticated 16.
select n.nspname, count(*) as secdef_total,
       count(*) filter (where has_function_privilege('anon', p.oid, 'execute')) as anon_exec,
       count(*) filter (where has_function_privilege('authenticated', p.oid, 'execute')) as authenticated_exec
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef and n.nspname in ('public', 'authority_private')
group by 1 order by 1;

-- C. Must return zero rows: unpinned search_path or PUBLIC EXECUTE on SECURITY DEFINER.
select p.oid::regprocedure, p.proconfig, p.proacl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'authority_private') and p.prosecdef
  and (not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
       or exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0));

-- D. Default privileges (after 110200). Expected rows for postgres/f:
--    <global> {postgres=X/postgres} and public {postgres=X/postgres,service_role=X/postgres}.
select pg_get_userbyid(defaclrole) as role,
       coalesce(nullif(defaclnamespace, 0)::regnamespace::text, '<global>') as schema,
       defaclobjtype, defaclacl
from pg_default_acl where defaclobjtype = 'f' order by 1, 2;
```

- Also confirm the Data API exposed schemas are still only `public, graphql_public`: Dashboard,
  Project Settings, Data API, "Exposed schemas". Or read-only
  `GET https://api.supabase.com/v1/projects/{ref}/postgrest` (field `db_schema`).
- Also confirm auth settings: `GET /v1/projects/{ref}/config/auth` (fields `disable_signup`,
  `mailer_autoconfirm`, `external_email_enabled`, `security_captcha_enabled`).
