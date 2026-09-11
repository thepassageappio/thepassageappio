-- Synthetic hosted/local security boundary replay; every fixture is rolled back.
begin;

insert into auth.users (id, email, email_confirmed_at, created_at, updated_at)
values
  ('12000000-0000-4000-8000-000000000001', 'reviewer-boundary-owner@local.authority.test', now(), now(), now()),
  ('12000000-0000-4000-8000-000000000002', 'reviewer-boundary-reviewer@local.authority.test', now(), now(), now());

insert into public.organizations (
  id, legal_name, display_name, organization_type, address_line_1,
  locality, region, postal_code, created_by, onboarding_status
) values (
  '22000000-0000-4000-8000-000000000001',
  'Reviewer Boundary Test Bank', 'Reviewer Boundary Test Bank', 'regional_bank',
  '1 Test Way', 'Albany', 'NY', '12207',
  '12000000-0000-4000-8000-000000000001', 'ready'
);

insert into public.organization_memberships (
  organization_id, user_id, email_normalized, display_name, role
) values
  (
    '22000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    'reviewer-boundary-owner@local.authority.test', 'Boundary Owner', 'owner'
  ),
  (
    '22000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000002',
    'reviewer-boundary-reviewer@local.authority.test', 'Boundary Reviewer', 'reviewer'
  );

insert into public.organization_template_selections (
  organization_id, template_key, template_version, selected_by
) values (
  '22000000-0000-4000-8000-000000000001', 'ny_financial_poa', '2026.1',
  '12000000-0000-4000-8000-000000000001'
);

insert into public.authority_records (
  id, organization_id, created_by, status, template_key, template_version,
  account_boundary, principal_name, principal_email_normalized,
  representative_name, representative_email_normalized, allowed_action_keys,
  valid_until
) values (
  '32000000-0000-4000-8000-000000000001',
  '22000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001', 'draft',
  'ny_financial_poa', '2026.1', 'Sample relationship ending 9010',
  'Parker Quinn', 'parker-reviewer-boundary@local.authority.test',
  'Casey Quinn', 'casey-reviewer-boundary@local.authority.test',
  array['receive_duplicate_statements']::text[], now() + interval '30 days'
);


-- Assertions execute as authenticated, not as the database owner.
create temporary table security_boundary_results(label text primary key, passed boolean);
grant all on security_boundary_results to authenticated;
create function pg_temp.expect_denied(p_label text, p_sql text, p_message text)
returns void language plpgsql security invoker as $$
declare v_message text;
begin
  begin
    execute p_sql;
    raise exception 'unexpected success: %', p_label;
  exception when others then
    get stacked diagnostics v_message = message_text;
    if v_message <> p_message then
      raise exception '%: expected %, received %', p_label, p_message, v_message;
    end if;
  end;
  insert into security_boundary_results values(p_label,true);
end $$;

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (
      'activate_authority_request_v1','reissue_participant_invitation_v1',
      'review_evidence_artifact_v1','get_authority_notification_status_v1')
      and (has_function_privilege('anon',p.oid,'execute')
        or not has_function_privilege('authenticated',p.oid,'execute')
        or not p.prosecdef or p.proconfig is distinct from array['search_path=""']::text[])
  ) then raise exception 'public command ACL/search-path drift'; end if;
  if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in (
      'activate_authority_request_v1','reissue_participant_invitation_v1',
      'review_evidence_artifact_v1','get_authority_notification_status_v1')) <> 4
  then raise exception 'expected exactly four command definitions'; end if;
  insert into security_boundary_results values('four RPC ACLs and empty search paths',true);
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"12000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',true);
select pg_temp.expect_denied('owner AAL1 activate', $q$select public.activate_authority_request_v1('22000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001',1,gen_random_uuid())$q$, 'mfa_verification_required');
select pg_temp.expect_denied('owner AAL1 reissue', $q$select public.reissue_participant_invitation_v1('22000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','principal',1,1,gen_random_uuid())$q$, 'mfa_verification_required');
select pg_temp.expect_denied('owner AAL1 review', $q$select public.review_evidence_artifact_v1('22000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000099',1,1,'accepted',null,gen_random_uuid())$q$, 'mfa_verification_required');

select set_config('request.jwt.claims','{"sub":"12000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}',true);
do $$ begin
  if public.get_authority_notification_status_v1('22000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001') <> '[]'::jsonb
  then raise exception 'notification positive control mismatch'; end if;
  insert into security_boundary_results values('owner AAL2 notification read positive control',true);
end $$;
select pg_temp.expect_denied('foreign organization activate', $q$select public.activate_authority_request_v1('22000000-0000-4000-8000-000000000099','32000000-0000-4000-8000-000000000001',1,gen_random_uuid())$q$, 'authority_request_creation_not_allowed');
select pg_temp.expect_denied('foreign organization reissue', $q$select public.reissue_participant_invitation_v1('22000000-0000-4000-8000-000000000099','32000000-0000-4000-8000-000000000001','principal',1,1,gen_random_uuid())$q$, 'authority_request_creation_not_allowed');
select pg_temp.expect_denied('foreign organization review', $q$select public.review_evidence_artifact_v1('22000000-0000-4000-8000-000000000099','32000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000099',1,1,'accepted',null,gen_random_uuid())$q$, 'authority_request_creation_not_allowed');
select pg_temp.expect_denied('foreign organization status', $q$select public.get_authority_notification_status_v1('22000000-0000-4000-8000-000000000099','32000000-0000-4000-8000-000000000001')$q$, 'authority_request_creation_not_allowed');

reset role;
update public.organization_memberships set role='admin'
where organization_id='22000000-0000-4000-8000-000000000001' and user_id='12000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"12000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',true);
select pg_temp.expect_denied('admin AAL1 activate', $q$select public.activate_authority_request_v1('22000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001',1,gen_random_uuid())$q$, 'mfa_verification_required');
select pg_temp.expect_denied('admin AAL1 reissue', $q$select public.reissue_participant_invitation_v1('22000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','principal',1,1,gen_random_uuid())$q$, 'mfa_verification_required');
select pg_temp.expect_denied('admin AAL1 review', $q$select public.review_evidence_artifact_v1('22000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000099',1,1,'accepted',null,gen_random_uuid())$q$, 'mfa_verification_required');

select set_config('request.jwt.claim.sub','12000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"12000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}',true);
select pg_temp.expect_denied('reviewer activation', $q$select public.activate_authority_request_v1('22000000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001',1,gen_random_uuid())$q$, 'authority_request_activation_not_allowed');
reset role;
do $$ begin
  if (select status from public.authority_records where id='32000000-0000-4000-8000-000000000001') <> 'draft'
    or (select version from public.authority_records where id='32000000-0000-4000-8000-000000000001') <> 1
    or exists(select 1 from public.authority_events where organization_id='22000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.authority_usage_events where organization_id='22000000-0000-4000-8000-000000000001')
    or exists(select 1 from public.authority_participant_invitations where organization_id='22000000-0000-4000-8000-000000000001')
    or exists(select 1 from authority_private.notification_outbox where organization_id='22000000-0000-4000-8000-000000000001')
  then raise exception 'denied commands changed durable state'; end if;
  insert into security_boundary_results values('denials preserve state events invitations usage outbox',true);
end $$;
select * from security_boundary_results order by label;
rollback;
