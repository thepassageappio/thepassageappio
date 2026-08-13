-- Disposable A16 provider-selection command/RLS regression matrix.
-- Run only on isolated project uyacxqtsiwlvtmhxvoxr after the reviewed
-- participant and provider-discovery migrations. Always rolls back.
begin;

do $provider_test_preflight$
begin
  if current_setting('passage.test_project_ref', true) is distinct from
       'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) =
       'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres'
     or (
       select system_identifier
       from pg_catalog.pg_control_system()
     ) is distinct from 7656983981618135123::bigint then
    raise exception 'Provider tests refused: isolated postgres attestation is required'
      using errcode = '42501';
  end if;

  if to_regclass('public.family_provider_selections') is null
     or to_regclass('passage_private.synthetic_provider_directory') is null
     or to_regprocedure(
       'public.confirm_family_provider_selection(uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text)'
     ) is null
     or to_regprocedure(
       'public.get_family_provider_selection_projection(uuid)'
     ) is null then
    raise exception 'Provider tests refused: A16 schema is incomplete';
  end if;

  if not exists (
       select 1 from pg_class
       where oid = 'public.family_provider_selections'::regclass
         and relrowsecurity
     )
     or not exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and policyname = 'family_provider_selection_authorized_select'
     )
     or (select count(*) from pg_policies
         where schemaname = 'public'
           and tablename = 'workflow_events'
           and permissive = 'PERMISSIVE'
           and cmd = 'SELECT') <> 1
     or not exists (
       select 1 from pg_policies
       where schemaname = 'public'
         and tablename = 'workflow_events'
         and policyname = 'workflow_events_authorized_select'
         and roles = array['authenticated']::name[]
         and qual like '%can_view_workflow_event(id)%'
         and qual like '%can_manage_continuity_space(continuity_space_id)%'
         and qual like '%family_provider_selection_id%'
         and qual like '%can_view_continuity_space(continuity_space_id)%'
     )
     or not exists (
       select 1 from pg_indexes
       where schemaname = 'public'
         and indexname = 'family_provider_one_active_per_space'
         and indexdef like 'CREATE UNIQUE INDEX%'
     ) then
    raise exception 'Provider RLS or one-active-selection protection is incomplete';
  end if;

  if has_table_privilege(
       'authenticated',
       'passage_private.synthetic_provider_directory',
       'SELECT,INSERT,UPDATE,DELETE'
     )
     or has_table_privilege(
       'authenticated',
       'public.family_provider_selections',
       'INSERT,UPDATE,DELETE'
     )
     or has_table_privilege(
       'authenticated',
       'public.family_provider_selections',
       'SELECT'
     )
     or not has_function_privilege(
       'authenticated',
       'public.confirm_family_provider_selection(uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.confirm_family_provider_selection(uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text)',
       'EXECUTE'
     )
     or exists (
       select 1
       from pg_proc as p
       join pg_namespace as n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in (
           'confirm_family_provider_selection',
           'get_family_provider_selection_projection'
         )
         and p.prosecdef
     )
     or (select count(*)
         from pg_proc as p
         join pg_namespace as n on n.oid = p.pronamespace
         where n.nspname = 'public'
           and p.proname in (
             'confirm_family_provider_selection',
             'get_family_provider_selection_projection'
           )
           and not p.prosecdef
           and p.proconfig = array['search_path=""']) <> 2
     or exists (
       select 1
       from pg_proc as p
       join pg_namespace as n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in (
           'confirm_family_provider_selection',
           'get_family_provider_selection_projection'
         )
         and lower(pg_catalog.pg_get_function_result(p.oid))
           ~ '(selection_id|continuity_space_id|source_kind|source_key|dataset_version|request_digest|event_id)'
     ) then
    raise exception 'Provider command and table grants are not least privilege';
  end if;

  if (select count(*)
      from passage_private.synthetic_provider_directory) <> 7
     or (select count(*)
         from passage_private.synthetic_provider_directory
         where organization_id is not null
           and organization_location_id is not null) <> 1 then
    raise exception 'Synthetic provider directory cardinality is not deterministic';
  end if;

  if (select count(*)
      from passage_private.synthetic_provider_directory
      where source_key = 'main-street-new-york'
        and display_name = 'Main Street Memorial Home'
        and address_line1 = '10 Main Street'
        and locality = 'New York'
        and administrative_area = 'NY'
        and postal_code = '10001'
        and organization_id is null
        and organization_location_id is null) <> 1 then
    raise exception 'New York multi-token directory fixture drifted';
  end if;
end
$provider_test_preflight$;

insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    'a1600001-a160-4100-8100-000000000001',
    'owner@provider.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Family Coordinator"}', now(), now()
  ),
  (
    'a1600002-a160-4200-8200-000000000002',
    'viewer@provider.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Family Viewer"}', now(), now()
  ),
  (
    'a1600003-a160-4300-8300-000000000003',
    'other@provider.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Other User"}', now(), now()
  ),
  (
    'a1600004-a160-4400-8400-000000000004',
    'unverified@provider.test', null,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Unverified User"}', now(), now()
  );

insert into public.continuity_spaces (
  id, owner_user_id, display_name, creation_request_id
) values (
  'a1600010-a160-4100-8100-000000000010',
  'a1600001-a160-4100-8100-000000000001',
  'The Provider Test Family',
  'a1600011-a160-4100-8100-000000000011'
);

insert into public.continuity_participants (
  id, continuity_space_id, user_id, invited_email, display_name,
  relationship, purpose, category_scope, accepted_at
) values (
  'a1600020-a160-4200-8200-000000000020',
  'a1600010-a160-4100-8100-000000000010',
  'a1600002-a160-4200-8200-000000000002',
  'viewer@provider.test', 'Family Viewer', 'Sibling',
  'Help with family coordination', array['service'], now()
);

do $provider_command_tests$
declare
  v_space constant uuid := 'a1600010-a160-4100-8100-000000000010';
  v_first record;
  v_replay record;
  v_replacement record;
  v_projection record;
  v_first_id uuid;
  v_replacement_id uuid;
  v_before integer;
begin
  perform set_config(
    'request.jwt.claim.sub',
    'a1600004-a160-4400-8400-000000000004',
    true
  );
  begin
    perform public.confirm_family_provider_selection(
      v_space, 'a1600100-a160-4100-8100-000000000100', null,
      'synthetic_directory', 'northstar-portland',
      null, null, null, null, null, null, null
    );
    raise exception 'Expected unverified-user denial';
  exception when sqlstate '42501' then null;
  end;

  perform set_config(
    'request.jwt.claim.sub',
    'a1600003-a160-4300-8300-000000000003',
    true
  );
  begin
    perform public.confirm_family_provider_selection(
      v_space, 'a1600101-a160-4100-8100-000000000101', null,
      'synthetic_directory', 'northstar-portland',
      null, null, null, null, null, null, null
    );
    raise exception 'Expected non-coordinator denial';
  exception when sqlstate '42501' then null;
  end;

  if exists (
    select 1 from public.family_provider_selections
    where continuity_space_id = v_space
  ) then
    raise exception 'Denied confirmation left durable state';
  end if;

  perform set_config(
    'request.jwt.claim.sub',
    'a1600001-a160-4100-8100-000000000001',
    true
  );
  select * into strict v_first
  from public.confirm_family_provider_selection(
    v_space, 'a1600102-a160-4100-8100-000000000102', null,
    'synthetic_directory', 'northstar-portland',
    'Client-forged name', 'Client-forged address', null,
    'Wrong city', 'XX', '00000', 'ZZ'
  );

  if v_first.replayed
     or v_first.provider_name <> 'Northstar Funeral Home'
     or v_first.handoff_available is not true
     or v_first.address_line1 <> '7421 SE Division Street'
     or (select count(*) from public.family_provider_selections
         where continuity_space_id = v_space and state = 'active') <> 1
     or (select count(*) from public.workflow_events
         where continuity_space_id = v_space
           and name = 'family_provider_selection.confirmed') <> 1 then
    raise exception 'Server-derived first confirmation is incorrect';
  end if;
  select id into strict v_first_id
  from public.family_provider_selections
  where continuity_space_id = v_space and state = 'active';

  select * into strict v_replay
  from public.confirm_family_provider_selection(
    v_space, 'a1600102-a160-4100-8100-000000000102', null,
    'synthetic_directory', 'northstar-portland',
    null, null, null, null, null, null, null
  );
  if not v_replay.replayed
     or v_replay.selected_at is distinct from v_first.selected_at
     or v_replay.provider_name is distinct from v_first.provider_name
     or (select count(*) from public.family_provider_selections
         where continuity_space_id = v_space) <> 1
     or (select count(*) from public.workflow_events
         where family_provider_selection_id = v_first_id) <> 1 then
    raise exception 'Exact confirmation replay changed cardinality';
  end if;

  begin
    perform public.confirm_family_provider_selection(
      v_space, 'a1600102-a160-4100-8100-000000000102', null,
      'synthetic_directory', 'northstar-beaverton',
      null, null, null, null, null, null, null
    );
    raise exception 'Expected changed-payload replay conflict';
  exception when sqlstate '22023' then null;
  end;

  select * into strict v_replacement
  from public.confirm_family_provider_selection(
    v_space, 'a1600103-a160-4100-8100-000000000103',
    v_first.selected_at, 'manual', null,
    'Harbor & Pine Funeral Care', null, null,
    'Portland', null, null, 'US'
  );
  select id into strict v_replacement_id
  from public.family_provider_selections
  where continuity_space_id = v_space and state = 'active';

  if v_replacement.replayed
     or v_replacement.address_review_required is not true
     or v_replacement.handoff_available is not false
     or (select count(*) from public.family_provider_selections
         where continuity_space_id = v_space and state = 'active') <> 1
     or (select count(*) from public.family_provider_selections
         where continuity_space_id = v_space and state = 'superseded'
           and superseded_by_selection_id = v_replacement_id) <> 1
     or (select count(*) from public.workflow_events
         where continuity_space_id = v_space
           and name = 'family_provider_selection.superseded'
           and family_provider_selection_id = v_replacement_id
           and previous_family_provider_selection_id = v_first_id) <> 1 then
    raise exception 'Atomic replacement or append-only receipt is incorrect';
  end if;

  v_before := (
    select count(*) from public.family_provider_selections
    where continuity_space_id = v_space
  );
  begin
    perform public.confirm_family_provider_selection(
      v_space, 'a1600104-a160-4100-8100-000000000104',
      v_first.selected_at, 'synthetic_directory', 'riverbend-salem',
      null, null, null, null, null, null, null
    );
    raise exception 'Expected stale-selection conflict';
  exception when sqlstate '40001' then null;
  end;
  if (select count(*) from public.family_provider_selections
      where continuity_space_id = v_space) <> v_before then
    raise exception 'Stale-selection conflict left partial state';
  end if;

  select * into strict v_projection
  from public.get_family_provider_selection_projection(v_space);
  if v_projection.provider_name is distinct from v_replacement.provider_name
     or v_projection.selected_at is distinct from v_replacement.selected_at
     or v_projection.viewer_count <> 2 then
    raise exception 'Authorized active provider projection is incorrect';
  end if;
end
$provider_command_tests$;

set local role authenticated;

do $provider_rls_tests$
declare
  v_space constant uuid := 'a1600010-a160-4100-8100-000000000010';
  v_projection record;
begin
  perform set_config(
    'request.jwt.claim.sub',
    'a1600002-a160-4200-8200-000000000002',
    true
  );
  select * into strict v_projection
  from public.get_family_provider_selection_projection(v_space);
  if v_projection.provider_name <> 'Harbor & Pine Funeral Care'
     or v_projection.viewer_count <> 2
     or (select count(*) from public.workflow_events
         where continuity_space_id = v_space
           and family_provider_selection_id is not null) <> 2 then
    raise exception 'Active participant narrow provider projection is incorrect';
  end if;

  begin
    perform 1 from public.family_provider_selections
    where continuity_space_id = v_space;
    raise exception 'Expected direct provider SELECT denial';
  exception when sqlstate '42501' then null;
  end;

  begin
    insert into public.family_provider_selections (
      continuity_space_id, source_kind, dataset_version, provider_name,
      address_line1, locality, administrative_area, postal_code, country_code,
      formatted_address, address_review_required, handoff_available,
      selected_by_user_id, selection_request_id, request_digest
    ) values (
      v_space, 'manual', 'manual-v1', 'Direct write',
      '1 Main Street', 'Portland', 'OR', '97205', 'US',
      '1 Main Street Portland, OR 97205 US', true, false,
      'a1600002-a160-4200-8200-000000000002',
      'a1600199-a160-4200-8200-000000000199', repeat('a', 64)
    );
    raise exception 'Expected direct provider mutation denial';
  exception when sqlstate '42501' then null;
  end;

  perform set_config(
    'request.jwt.claim.sub',
    'a1600003-a160-4300-8300-000000000003',
    true
  );
  if exists (
    select 1 from public.get_family_provider_selection_projection(v_space)
  ) or exists (
    select 1 from public.workflow_events
    where continuity_space_id = v_space
      and family_provider_selection_id is not null
  ) then
    raise exception 'Unrelated user can read provider selection proof';
  end if;
end
$provider_rls_tests$;

reset role;

update public.continuity_participants
set status = 'revoked',
    revoked_at = now(),
    revoked_by_user_id = 'a1600001-a160-4100-8100-000000000001',
    revocation_reason = 'Provider discovery access test'
where id = 'a1600020-a160-4200-8200-000000000020';

set local role authenticated;

do $provider_revocation_test$
begin
  perform set_config(
    'request.jwt.claim.sub',
    'a1600002-a160-4200-8200-000000000002',
    true
  );
  if exists (
    select 1
    from public.get_family_provider_selection_projection(
      'a1600010-a160-4100-8100-000000000010'
    )
  ) or exists (
    select 1 from public.workflow_events
    where continuity_space_id = 'a1600010-a160-4100-8100-000000000010'
      and family_provider_selection_id is not null
  ) then
    raise exception 'Revoked participant retained provider selection access';
  end if;
end
$provider_revocation_test$;

reset role;

do $provider_append_only_test$
begin
  begin
    update public.workflow_events
    set metadata = metadata || '{"tampered":true}'::jsonb
    where family_provider_selection_id is not null;
    raise exception 'Expected provider-event update denial';
  exception when sqlstate '42501' then null;
  end;
  begin
    delete from public.workflow_events
    where family_provider_selection_id is not null;
    raise exception 'Expected provider-event delete denial';
  exception when sqlstate '42501' then null;
  end;
  if (select count(*) from public.workflow_events
      where family_provider_selection_id is not null) <> 2 then
    raise exception 'Append-only denial changed provider event history';
  end if;
end
$provider_append_only_test$;

rollback;
