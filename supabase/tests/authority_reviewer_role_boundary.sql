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

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-4000-8000-000000000002', true);

do $$
declare
  v_error text;
begin
  begin
    perform public.create_authority_draft_v1(
      '22000000-0000-4000-8000-000000000001',
      'Robin Lane', 'robin-reviewer-boundary@local.authority.test',
      'Taylor Lane', 'taylor-reviewer-boundary@local.authority.test',
      'Sample relationship ending 9020', now() + interval '30 days',
      array['discuss_service_issues']::text[],
      '62000000-0000-4000-8000-000000000001'
    );
    raise exception 'reviewer unexpectedly created a draft';
  exception when sqlstate '42501' then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'authority_request_creation_not_allowed' then raise; end if;
  end;

  begin
    perform public.activate_authority_request_v1(
      '22000000-0000-4000-8000-000000000001',
      '32000000-0000-4000-8000-000000000001', 1,
      '62000000-0000-4000-8000-000000000002'
    );
    raise exception 'reviewer unexpectedly activated a draft';
  exception when sqlstate '42501' then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'authority_request_activation_not_allowed' then raise; end if;
  end;
end;
$$;

reset role;

do $$
begin
  if (select count(*) from public.authority_records where organization_id = '22000000-0000-4000-8000-000000000001') <> 1
    or (select status from public.authority_records where id = '32000000-0000-4000-8000-000000000001') <> 'draft'
    or (select version from public.authority_records where id = '32000000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.authority_events where organization_id = '22000000-0000-4000-8000-000000000001') <> 0
    or (select count(*) from public.authority_usage_events where organization_id = '22000000-0000-4000-8000-000000000001') <> 0
    or (select count(*) from public.authority_participant_invitations where organization_id = '22000000-0000-4000-8000-000000000001') <> 0
    or (select activated_count from public.organization_entitlements where organization_id = '22000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'reviewer coordination denial changed state, events, invitations, or usage';
  end if;
end;
$$;

rollback;
