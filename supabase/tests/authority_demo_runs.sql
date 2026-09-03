begin;

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'demo-owner-a@example.test', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'demo-owner-b@example.test', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'demo-staff@example.test', now(), now(), now());

insert into public.organizations (
  id, legal_name, display_name, organization_type, website_domain,
  address_line_1, locality, region, postal_code, country_code,
  status, onboarding_status, created_by
)
values
  (
    '20000000-0000-0000-0000-000000000001', 'Demo Institution A', 'Demo Institution A',
    'credit_union', 'demo-a.example.test', '1 Demo Way', 'Albany', 'NY', '12207', 'US',
    'active', 'ready', '10000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000002', 'Demo Institution B', 'Demo Institution B',
    'regional_bank', 'demo-b.example.test', '2 Demo Way', 'Buffalo', 'NY', '14202', 'US',
    'active', 'ready', '10000000-0000-0000-0000-000000000002'
  );

insert into public.organization_memberships (
  organization_id, user_id, email_normalized, display_name, role, status
)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'demo-owner-a@example.test', 'Demo Owner A', 'owner', 'active'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'demo-staff@example.test', 'Demo Staff', 'staff', 'active'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'demo-owner-b@example.test', 'Demo Owner B', 'owner', 'active');

insert into public.organization_template_selections (
  organization_id, template_key, template_version, selected_by
)
values
  ('20000000-0000-0000-0000-000000000001', 'ny_financial_poa', '2026.1', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'ny_financial_poa', '2026.1', '10000000-0000-0000-0000-000000000002');

create temporary table demo_test_results (
  label text primary key,
  result jsonb not null
);
grant all on demo_test_results to service_role;

set local role service_role;

do $$
declare
  v_first jsonb;
  v_replay jsonb;
  v_other_organization jsonb;
  v_error text;
begin
  v_first := public.provision_demo_run_v1(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'principal@example.test',
    'representative@example.test',
    1,
    'financial-poa-demo-2026.1',
    '30000000-0000-0000-0000-000000000001'
  );

  if v_first->>'replayed' <> 'false' then
    raise exception 'first Demo provisioning did not report a new result';
  end if;

  v_replay := public.provision_demo_run_v1(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'principal@example.test',
    'representative@example.test',
    1,
    'financial-poa-demo-2026.1',
    '30000000-0000-0000-0000-000000000001'
  );

  if v_replay->>'replayed' <> 'true'
    or v_replay->>'demo_run_id' <> v_first->>'demo_run_id'
    or v_replay->>'authority_record_id' <> v_first->>'authority_record_id' then
    raise exception 'Demo provisioning replay changed the durable result';
  end if;

  begin
    perform public.provision_demo_run_v1(
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'different-principal@example.test',
      'representative@example.test',
      1,
      'financial-poa-demo-2026.1',
      '30000000-0000-0000-0000-000000000001'
    );
    raise exception 'idempotency payload mismatch unexpectedly succeeded';
  exception when others then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'idempotency_payload_mismatch' then raise; end if;
  end;

  begin
    perform public.provision_demo_run_v1(
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000003',
      'principal@example.test',
      'representative@example.test',
      1,
      'financial-poa-demo-2026.1',
      '30000000-0000-0000-0000-000000000002'
    );
    raise exception 'unauthorized Demo staff provisioning unexpectedly succeeded';
  exception when others then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'demo_presenter_not_allowed' then raise; end if;
  end;

  begin
    perform public.provision_demo_run_v1(
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'principal@example.test',
      'representative@example.test',
      99,
      'financial-poa-demo-2026.1',
      '30000000-0000-0000-0000-000000000003'
    );
    raise exception 'stale Demo provisioning unexpectedly succeeded';
  exception when others then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'stale_demo_context' then raise; end if;
  end;

  v_other_organization := public.provision_demo_run_v1(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'principal-b@example.test',
    'representative-b@example.test',
    1,
    'financial-poa-demo-2026.1',
    '30000000-0000-0000-0000-000000000004'
  );

  if v_other_organization->>'demo_run_id' = v_first->>'demo_run_id' then
    raise exception 'separate organizations received the same Demo run';
  end if;

  insert into demo_test_results(label, result)
  values ('organization_a', v_first), ('organization_b', v_other_organization);
end;
$$;

reset role;

do $$
declare
  v_error text;
begin

  if (select count(*) from public.demo_runs) <> 2
    or (select count(*) from public.authority_records where demo_run_id is not null) <> 2
    or (select count(*) from public.demo_run_events) <> 2
    or (select count(*) from public.authority_events where event_type = 'authority.draft_created') <> 2 then
    raise exception 'Demo provisioning did not create exactly one evidence chain per organization';
  end if;

  if exists (
    select 1 from public.authority_records r
    join public.demo_runs d on d.id = r.demo_run_id
    where r.organization_id <> d.organization_id
  ) then
    raise exception 'a Demo request crossed its organization boundary';
  end if;

  if exists (select 1 from public.organization_entitlements where activated_count <> 0)
    or exists (select 1 from public.authority_participant_invitations) then
    raise exception 'Demo preparation changed usage or created participant access';
  end if;

  begin
    update public.demo_run_events set summary = 'changed';
    raise exception 'Demo run history unexpectedly allowed mutation';
  exception when others then
    get stacked diagnostics v_error = message_text;
    if v_error <> 'demo_run_events_are_append_only' then raise; end if;
  end;
end;
$$;

rollback;
