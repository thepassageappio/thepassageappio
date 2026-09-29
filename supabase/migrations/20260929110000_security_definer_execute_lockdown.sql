-- Security definer EXECUTE lockdown (audit 2026-09-28, see SECURITY-DEFINER-AUDIT-2026-09-28.md).
--
-- Idempotent: only REVOKE, GRANT, ALTER FUNCTION ... SECURITY DEFINER and read-only
-- assertions. No function bodies change. Safe to apply before or after the app
-- deploy that moves submit_participant_decision_v1 to the service-role client, because it keeps
-- the public submit_participant_decision_v1 grants for anon/authenticated. Those grants are
-- removed by 20260929110100, which must be applied only AFTER that app deploy is live.

-- 1. Unused v1 draft creation path. The app calls create_authority_draft_v2, which is a
--    SECURITY DEFINER function that calls public.create_authority_draft_v1 as its owner.
--    Calling v1 directly skipped v2's stale-published-version check.
revoke execute on function public.create_authority_draft_v1(
  uuid, text, text, text, text, text, timestamp with time zone, text[], uuid
) from public, anon, authenticated, service_role;
revoke execute on function authority_private.create_authority_draft_v1(
  uuid, text, text, text, text, text, timestamp with time zone, text[], uuid
) from public, anon, authenticated, service_role;

-- 2. Internal helper, only called from SECURITY DEFINER functions (which run as the owner).
revoke execute on function authority_private.assert_authority_record_operator(uuid)
  from public, anon, authenticated, service_role;

-- 3. Close the MFA bypass. These public wrappers enforced require_privileged_mfa_v1 as
--    SECURITY INVOKER, while the inner authority_private SECURITY DEFINER function (no MFA
--    check) was itself executable by authenticated. Make the wrappers SECURITY DEFINER (bodies
--    and search_path='' unchanged; auth.uid()/auth.jwt() read request GUCs, so the caller
--    identity is preserved) and remove authenticated from the inner functions.
alter function public.change_member_role_v1(uuid, uuid, text, bigint, uuid) security definer;
alter function public.invite_member_v1(uuid, text, text, uuid) security definer;
alter function public.request_pilot_invoice_v1(uuid, date, date, integer, bigint, uuid) security definer;
alter function public.revoke_member_invitation_v1(uuid, uuid, bigint, uuid) security definer;
alter function public.revoke_member_v1(uuid, uuid, bigint, uuid) security definer;
alter function public.update_authority_draft_v1(uuid, uuid, bigint, text, text, text, text, uuid) security definer;

revoke execute on function public.change_member_role_v1(uuid, uuid, text, bigint, uuid) from public, anon;
revoke execute on function public.invite_member_v1(uuid, text, text, uuid) from public, anon;
revoke execute on function public.request_pilot_invoice_v1(uuid, date, date, integer, bigint, uuid) from public, anon;
revoke execute on function public.revoke_member_invitation_v1(uuid, uuid, bigint, uuid) from public, anon;
revoke execute on function public.revoke_member_v1(uuid, uuid, bigint, uuid) from public, anon;
revoke execute on function public.update_authority_draft_v1(uuid, uuid, bigint, text, text, text, text, uuid) from public, anon;
grant execute on function public.change_member_role_v1(uuid, uuid, text, bigint, uuid) to authenticated, service_role;
grant execute on function public.invite_member_v1(uuid, text, text, uuid) to authenticated, service_role;
grant execute on function public.request_pilot_invoice_v1(uuid, date, date, integer, bigint, uuid) to authenticated, service_role;
grant execute on function public.revoke_member_invitation_v1(uuid, uuid, bigint, uuid) to authenticated, service_role;
grant execute on function public.revoke_member_v1(uuid, uuid, bigint, uuid) to authenticated, service_role;
grant execute on function public.update_authority_draft_v1(uuid, uuid, bigint, text, text, text, text, uuid) to authenticated, service_role;

revoke execute on function authority_private.change_member_role_v1(uuid, uuid, text, bigint, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function authority_private.invite_member_v1(uuid, text, text, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function authority_private.request_pilot_invoice_v1(uuid, date, date, integer, bigint, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function authority_private.revoke_member_invitation_v1(uuid, uuid, bigint, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function authority_private.revoke_member_v1(uuid, uuid, bigint, uuid)
  from public, anon, authenticated, service_role;
revoke execute on function authority_private.update_authority_draft_v1(uuid, uuid, bigint, text, text, text, text, uuid)
  from public, anon, authenticated, service_role;

-- 4. MFA helper: after step 3 every caller is SECURITY DEFINER (or the now-revoked
--    public.create_authority_draft_v1, reachable only through v2). It only inspects the
--    caller's own JWT, so this is defence in depth.
revoke execute on function authority_private.require_privileged_mfa_v1(uuid)
  from public, anon, authenticated, service_role;

-- 5. Participant decision (BLOCKER): the result of principal_confirm carries the
--    representative's raw invitation token. Phase 1 (this file): route the public wrapper
--    through SECURITY DEFINER, like every other session-token service RPC
--    (submit_representative_certification_v1, record_participant_evidence_upload_v1, ...),
--    grant it to service_role for the new app code, and make the inner function owner-only.
--    Phase 2 (20260929110100) removes anon/authenticated from the public wrapper.
alter function public.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid) security definer;
grant execute on function public.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid) to service_role;
revoke execute on function public.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid) from public;
revoke execute on function authority_private.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid)
  from public, anon, authenticated, service_role;

-- 6. Member count wrapper was the only function in public/authority_private still relying on
--    the built-in PUBLIC default and granted to anon. The team page calls it as authenticated.
revoke execute on function public.organization_member_count_v1(uuid) from public, anon;
grant execute on function public.organization_member_count_v1(uuid) to authenticated, service_role;

-- 7. Assertions (read-only). Fail the migration if any SECURITY DEFINER function in an app
--    schema has an unpinned search_path, is executable by PUBLIC, or if any locked function is
--    still executable by anon.
do $$
declare
  v_bad text;
begin
  select string_agg(p.oid::regprocedure::text, ', ') into v_bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'authority_private')
    and p.prosecdef
    and not exists (
      select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%'
    );
  if v_bad is not null then
    raise exception 'security definer functions without pinned search_path: %', v_bad;
  end if;

  select string_agg(p.oid::regprocedure::text, ', ') into v_bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'authority_private')
    and p.prosecdef
    and exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0);
  if v_bad is not null then
    raise exception 'security definer functions executable by PUBLIC: %', v_bad;
  end if;

  select string_agg(f, ', ') into v_bad
  from unnest(array[
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
    'authority_private.submit_participant_decision_v1(text,uuid,bigint,text,boolean,text,uuid)'
  ]) f
  where has_function_privilege('anon', f, 'execute')
     or has_function_privilege('authenticated', f, 'execute');
  if v_bad is not null then
    raise exception 'locked functions still executable by a client role: %', v_bad;
  end if;
end;
$$;
