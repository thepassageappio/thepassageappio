-- Security definer EXECUTE lockdown (20260929110000 + 20260929110100); every fixture rolls back.
-- Proves: locked functions are not client-executable, intended anon/authenticated RPCs still
-- work end to end through the client roles, MFA is still enforced through the (now SECURITY
-- DEFINER) public wrappers, and the participant decision path works for service_role only.
begin;

create temporary table lockdown_state (key text primary key, value text not null);
grant all on lockdown_state to anon, authenticated, service_role;

-- 1. Catalog assertions.
do $$
declare
  v_bad text;
  v_locked text[] := array[
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
    'public.submit_participant_decision_v1(text,uuid,bigint,text,boolean,text,uuid)'
  ];
  v_anon_public text[] := array[
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
  ];
  v_mfa_wrappers text[] := array[
    'public.change_member_role_v1(uuid,uuid,text,bigint,uuid)',
    'public.invite_member_v1(uuid,text,text,uuid)',
    'public.request_pilot_invoice_v1(uuid,date,date,integer,bigint,uuid)',
    'public.revoke_member_invitation_v1(uuid,uuid,bigint,uuid)',
    'public.revoke_member_v1(uuid,uuid,bigint,uuid)',
    'public.update_authority_draft_v1(uuid,uuid,bigint,text,text,text,text,uuid)'
  ];
begin
  select string_agg(f, ', ') into v_bad from unnest(v_locked) f
  where has_function_privilege('anon', f, 'execute') or has_function_privilege('authenticated', f, 'execute');
  if v_bad is not null then raise exception 'locked functions still client-executable: %', v_bad; end if;

  if not has_function_privilege('service_role', 'public.submit_participant_decision_v1(text,uuid,bigint,text,boolean,text,uuid)', 'execute') then
    raise exception 'service_role lost submit_participant_decision_v1';
  end if;

  select string_agg(f, ', ') into v_bad from unnest(v_anon_public) f
  where not has_function_privilege('anon', f, 'execute') or not has_function_privilege('authenticated', f, 'execute');
  if v_bad is not null then raise exception 'intended public RPCs lost anon/authenticated: %', v_bad; end if;

  select string_agg(f, ', ') into v_bad from unnest(v_mfa_wrappers || array[
    'public.organization_member_count_v1(uuid)',
    'public.create_authority_draft_v2(uuid,text,text,text,text,text,timestamp with time zone,text[],uuid,uuid)',
    'public.activate_authority_request_v1(uuid,uuid,bigint,uuid)',
    'public.accept_member_invitation_v1(uuid,text,uuid)',
    'public.create_organization_v1(text,text,text,text,text,text,text,text,text,text,boolean,uuid)'
  ]) f
  where (not has_function_privilege('authenticated', f, 'execute') or has_function_privilege('anon', f, 'execute'));
  if v_bad is not null then raise exception 'authenticated RPC grants wrong: %', v_bad; end if;

  select string_agg(f, ', ') into v_bad from unnest(v_mfa_wrappers) f
  where not (select prosecdef from pg_proc where oid = to_regprocedure(f));
  if v_bad is not null then raise exception 'MFA wrappers must be security definer: %', v_bad; end if;

  -- No SECURITY DEFINER function in an app schema without a pinned search_path or with PUBLIC EXECUTE.
  select string_agg(p.oid::regprocedure::text, ', ') into v_bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'authority_private') and p.prosecdef
    and (not exists (select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) c where c like 'search_path=%')
         or exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0));
  if v_bad is not null then raise exception 'unsafe security definer functions: %', v_bad; end if;

  -- No SECURITY INVOKER function that a client role can execute may call a locked inner function
  -- (it would fail with permission denied at runtime).
  select string_agg(p.oid::regprocedure::text, ', ') into v_bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public', 'authority_private') and not p.prosecdef
    and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
    and p.prosrc ~ '(require_privileged_mfa_v1|assert_authority_record_operator|authority_private\.(create_authority_draft_v1|submit_participant_decision_v1|change_member_role_v1|invite_member_v1|request_pilot_invoice_v1|revoke_member_invitation_v1|revoke_member_v1|update_authority_draft_v1))';
  if v_bad is not null then raise exception 'client-executable invoker functions call locked functions: %', v_bad; end if;

  -- No RLS policy may depend on a locked function.
  if exists (select 1 from pg_policies where coalesce(qual, '') || coalesce(with_check, '')
             ~ '(require_privileged_mfa_v1|assert_authority_record_operator)') then
    raise exception 'an RLS policy depends on a locked function';
  end if;

  -- New functions created by postgres no longer auto-grant EXECUTE to PUBLIC/anon/authenticated.
  if exists (select 1 from pg_default_acl d, aclexplode(d.defaclacl) a
             where d.defaclrole = 'postgres'::regrole and d.defaclobjtype = 'f'
               and (a.grantee in ('anon'::regrole, 'authenticated'::regrole))) then
    raise exception 'postgres default privileges still grant EXECUTE to anon/authenticated';
  end if;
  if not exists (select 1 from pg_default_acl d where d.defaclrole = 'postgres'::regrole
                 and d.defaclobjtype = 'f' and d.defaclnamespace = 0) then
    raise exception 'postgres global default privileges must revoke PUBLIC EXECUTE';
  end if;
end;
$$;

-- Default-privilege behaviour on a new function (rolled back).
create function public.lockdown_default_acl_probe() returns int language sql as 'select 1';
do $$
begin
  if has_function_privilege('anon', 'public.lockdown_default_acl_probe()', 'execute')
     or has_function_privilege('authenticated', 'public.lockdown_default_acl_probe()', 'execute') then
    raise exception 'new functions still auto-grant EXECUTE to client roles';
  end if;
  if not has_function_privilege('service_role', 'public.lockdown_default_acl_probe()', 'execute') then
    raise exception 'new functions in public should keep the service_role default';
  end if;
end;
$$;
drop function public.lockdown_default_acl_probe();

-- 2. Fixtures (as postgres).
insert into auth.users (id, email, email_confirmed_at, created_at, updated_at) values
  ('14000000-0000-4000-8000-000000000001', 'lockdown-owner@local.authority.test', now(), now(), now()),
  ('14000000-0000-4000-8000-000000000002', 'lockdown-other-owner@local.authority.test', now(), now(), now());

insert into public.organizations (
  id, legal_name, display_name, organization_type, address_line_1,
  locality, region, postal_code, created_by, onboarding_status
) values
  ('24000000-0000-4000-8000-000000000001', 'Lockdown Test Bank', 'Lockdown Test Bank', 'regional_bank',
   '1 Test Way', 'Albany', 'NY', '12207', '14000000-0000-4000-8000-000000000001', 'ready'),
  ('24000000-0000-4000-8000-000000000002', 'Lockdown Other Bank', 'Lockdown Other Bank', 'regional_bank',
   '2 Test Way', 'Albany', 'NY', '12207', '14000000-0000-4000-8000-000000000002', 'ready');

insert into public.organization_memberships (organization_id, user_id, email_normalized, display_name, role) values
  ('24000000-0000-4000-8000-000000000001', '14000000-0000-4000-8000-000000000001',
   'lockdown-owner@local.authority.test', 'Lockdown Owner', 'owner'),
  ('24000000-0000-4000-8000-000000000002', '14000000-0000-4000-8000-000000000002',
   'lockdown-other-owner@local.authority.test', 'Lockdown Other Owner', 'owner');

insert into public.organization_template_selections (organization_id, template_key, template_version, selected_by)
values ('24000000-0000-4000-8000-000000000001', 'ny_financial_poa', '2026.1', '14000000-0000-4000-8000-000000000001');

insert into public.authority_records (
  id, organization_id, created_by, status, version, template_key, template_version,
  account_boundary, principal_name, principal_email_normalized,
  representative_name, representative_email_normalized, allowed_action_keys,
  valid_until, activated_at
) values (
  '34000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001',
  '14000000-0000-4000-8000-000000000001', 'awaiting_principal', 1, 'ny_financial_poa', '2026.1',
  'Sample account ending 4401', 'Parker Lock', 'parker-lock@local.authority.test',
  'Casey Lock', 'casey-lock@local.authority.test',
  array['receive_duplicate_statements']::text[], now() + interval '30 days', now()
);

insert into public.authority_participant_invitations (
  id, organization_id, authority_record_id, participant_role, email_normalized,
  status, invited_by, accepted_at, expires_at
) values
  ('54000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001',
   '34000000-0000-4000-8000-000000000001', 'principal', 'parker-lock@local.authority.test', 'pending',
   '14000000-0000-4000-8000-000000000001', null, now() + interval '3 days'),
  ('54000000-0000-4000-8000-000000000002', '24000000-0000-4000-8000-000000000001',
   '34000000-0000-4000-8000-000000000001', 'representative', 'casey-lock@local.authority.test', 'pending',
   '14000000-0000-4000-8000-000000000001', null, now() + interval '3 days');

insert into authority_private.participant_invitation_secrets (invitation_id, token_hash) values
  ('54000000-0000-4000-8000-000000000001', encode(extensions.digest(convert_to(repeat('e', 64), 'UTF8'), 'sha256'), 'hex')),
  ('54000000-0000-4000-8000-000000000002', encode(extensions.digest(convert_to(repeat('f', 64), 'UTF8'), 'sha256'), 'hex'));

-- Requester intake is service_role only; create a verification token as postgres.
do $$
declare v_started jsonb;
begin
  v_started := public.start_submission_group_v1('Lockdown Requester', 'lockdown-requester@example.invalid', 'other', gen_random_uuid());
  insert into lockdown_state values
    ('verification_token', v_started->>'verification_token'),
    ('group_id', v_started->>'group_id');
end;
$$;

-- 3. anon: intended public RPCs work; the participant decision and locked internals are denied.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select set_config('request.jwt.claim.sub', '', true);

do $$
declare
  v_result jsonb;
  v_session text;
  v_group uuid := (select value::uuid from lockdown_state where key = 'group_id');
  v_error text;
begin
  v_result := public.preview_participant_invitation_v1(repeat('e', 64));
  if v_result is null then raise exception 'anon preview returned nothing'; end if;

  v_result := public.exchange_participant_invitation_v1(repeat('e', 64), gen_random_uuid());
  v_session := v_result->>'session_token';
  if v_session is null then raise exception 'anon exchange did not return a session'; end if;
  insert into lockdown_state values ('principal_session', v_session);

  v_result := public.get_participant_session_context_v1(v_session, '34000000-0000-4000-8000-000000000001');
  if v_result is null then raise exception 'anon participant session context failed'; end if;

  -- BLOCKER closed: a principal cannot call the decision RPC directly with the anon key.
  begin
    perform public.submit_participant_decision_v1(
      v_session, '34000000-0000-4000-8000-000000000001', 1, 'principal_confirm', true, '', gen_random_uuid());
    raise exception 'anon unexpectedly executed submit_participant_decision_v1';
  exception when insufficient_privilege then
    get stacked diagnostics v_error = message_text;
    if v_error not like 'permission denied for function submit_participant_decision_v1%' then raise; end if;
  end;
  begin
    perform authority_private.submit_participant_decision_v1(
      v_session, '34000000-0000-4000-8000-000000000001', 1, 'principal_confirm', true, '', gen_random_uuid());
    raise exception 'anon unexpectedly executed authority_private.submit_participant_decision_v1';
  exception when insufficient_privilege then
    get stacked diagnostics v_error = message_text;
    if v_error not like 'permission denied for function submit_participant_decision_v1%' then raise; end if;
  end;

  -- Requester flow through anon.
  v_result := public.verify_requester_email_v1((select value from lockdown_state where key = 'verification_token'), gen_random_uuid());
  if v_result->>'session_token' is null then raise exception 'anon verify_requester_email_v1 failed'; end if;
  insert into lockdown_state values ('requester_session', v_result->>'session_token');
  v_result := public.get_requester_session_context_v1(v_result->>'session_token', v_group);
  if v_result is null then raise exception 'anon requester session context failed'; end if;
  perform public.get_submission_delivery_status_v1((select value from lockdown_state where key = 'requester_session'), v_group);
  v_result := public.update_submission_group_details_v1(
    (select value from lockdown_state where key = 'requester_session'), v_group,
    (v_result->>'version')::bigint,
    'Lockdown Principal', 'lockdown-principal@example.invalid', 'Lockdown Rep', 'lockdown-rep@example.invalid',
    true, null, gen_random_uuid());
  if v_result is null then raise exception 'anon update_submission_group_details_v1 failed'; end if;

  v_result := public.search_institutions_v1('Lockdown');
  if v_result is null then raise exception 'anon search_institutions_v1 failed'; end if;

  -- Bad tokens still fail with business errors, not permission errors.
  begin
    perform public.add_submission_target_v1(repeat('0', 64), v_group, 1, 'Bank', 'regional_bank', null, gen_random_uuid());
    raise exception 'bad requester token accepted';
  exception when others then
    get stacked diagnostics v_error = message_text;
    if v_error like 'permission denied%' or v_error = 'bad requester token accepted' then raise; end if;
  end;
  begin
    perform public.remove_submission_target_v1(repeat('0', 64), v_group, gen_random_uuid(), 1, gen_random_uuid());
    raise exception 'bad requester token accepted';
  exception when others then
    get stacked diagnostics v_error = message_text;
    if v_error like 'permission denied%' or v_error = 'bad requester token accepted' then raise; end if;
  end;

  -- Locked internals and authenticated-only RPCs are denied to anon.
  begin
    perform authority_private.assert_authority_record_operator('24000000-0000-4000-8000-000000000001');
    raise exception 'anon executed assert_authority_record_operator';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.organization_member_count_v1('24000000-0000-4000-8000-000000000001');
    raise exception 'anon executed organization_member_count_v1';
  exception when insufficient_privilege then
    get stacked diagnostics v_error = message_text;
    if v_error not like 'permission denied for function organization_member_count_v1%' then raise; end if;
  end;
end;
$$;

reset role;

-- 4. authenticated owner: the MFA bypass is closed, the wrappers still enforce MFA and work with aal2.
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims',
  '{"sub":"14000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

do $$
declare v_error text; v_result jsonb;
begin
  begin
    perform authority_private.invite_member_v1(
      '24000000-0000-4000-8000-000000000001', 'bypass@local.authority.test', 'staff', gen_random_uuid());
    raise exception 'aal1 owner reached inner invite_member_v1 directly';
  exception when insufficient_privilege then
    get stacked diagnostics v_error = message_text;
    if v_error not like 'permission denied for function invite_member_v1%' then raise; end if;
  end;
  begin
    perform authority_private.update_authority_draft_v1(
      '24000000-0000-4000-8000-000000000001', '34000000-0000-4000-8000-000000000001', 1,
      'A', 'a@local.authority.test', 'B', 'b@local.authority.test', gen_random_uuid());
    raise exception 'aal1 owner reached inner update_authority_draft_v1 directly';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.invite_member_v1(
      '24000000-0000-4000-8000-000000000001', 'aal1@local.authority.test', 'staff', gen_random_uuid());
    raise exception 'aal1 owner invited without MFA';
  exception when insufficient_privilege then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'mfa_verification_required' then raise; end if;
  end;

  if public.organization_member_count_v1('24000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'authenticated member count failed';
  end if;
  -- Other org stays opaque.
  begin
    if coalesce(public.organization_member_count_v1('24000000-0000-4000-8000-000000000002'), 0) > 0 then
      raise exception 'member count leaked another organization';
    end if;
  exception when insufficient_privilege or invalid_parameter_value or no_data_found then null;
  end;
end;
$$;

select set_config('request.jwt.claims',
  '{"sub":"14000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}', true);
do $$
declare v_result jsonb; v_error text;
begin
  v_result := public.invite_member_v1(
    '24000000-0000-4000-8000-000000000001', 'new-staff-lockdown@local.authority.test', 'staff', gen_random_uuid());
  if v_result is null then raise exception 'aal2 owner invite through SECURITY DEFINER wrapper failed'; end if;
  if not exists (select 1 from public.organization_invitations
                 where organization_id = '24000000-0000-4000-8000-000000000001'
                   and email_normalized = 'new-staff-lockdown@local.authority.test') then
    raise exception 'invite not recorded';
  end if;
  -- Owner of org 1 cannot manage org 2 through the definer wrapper.
  begin
    perform public.invite_member_v1(
      '24000000-0000-4000-8000-000000000002', 'cross-org@local.authority.test', 'staff', gen_random_uuid());
    raise exception 'cross-org invite succeeded';
  exception when insufficient_privilege then null;
  end;
  -- Participant decision is server-only for authenticated users too.
  begin
    perform public.submit_participant_decision_v1(
      (select value from lockdown_state where key = 'principal_session'),
      '34000000-0000-4000-8000-000000000001', 1, 'principal_confirm', true, '', gen_random_uuid());
    raise exception 'authenticated executed submit_participant_decision_v1';
  exception when insufficient_privilege then
    get stacked diagnostics v_error = message_text;
    if v_error not like 'permission denied for function submit_participant_decision_v1%' then raise; end if;
  end;
end;
$$;

reset role;

-- 5. service_role (the app's admin client): the participant decision still works and the
--    session token is still enforced inside the function.
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$
declare v_result jsonb;
begin
  begin
    perform public.submit_participant_decision_v1(
      repeat('0', 64), '34000000-0000-4000-8000-000000000001', 1, 'principal_confirm', true, '', gen_random_uuid());
    raise exception 'service_role decision accepted a bad session token';
  exception when others then
    if sqlerrm like 'permission denied%' or sqlerrm = 'service_role decision accepted a bad session token' then raise; end if;
  end;

  v_result := public.submit_participant_decision_v1(
    (select value from lockdown_state where key = 'principal_session'),
    '34000000-0000-4000-8000-000000000001', 1, 'principal_confirm', true, '', gen_random_uuid());
  if v_result->>'decision' <> 'confirmed' or v_result->>'representative_invitation_token' is null then
    raise exception 'service_role participant decision failed: %', v_result;
  end if;
end;
$$;
reset role;

select 'security_definer_execute_lockdown: ok' as result;
rollback;
