-- Rollback-only authority matrix for the urgent family receiving-organization
-- boundary. Run only against the isolated Passage Zero project after applying
-- the urgent_family_thin_slice migration:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';

do $preflight$
begin
  if current_setting('passage.test_project_ref', true) is distinct from 'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) = 'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres' then
    raise exception 'Urgent family tests require the isolated project and postgres test role'
      using errcode = '42501';
  end if;
  if to_regclass('public.urgent_intake_requests') is null
     or to_regclass('public.urgent_intake_events') is null
     or to_regclass('public.organization_member_locations') is null
     or to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'urgent_family_thin_slice'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'urgent_receiving_organization_boundary'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'urgent_case_first_commitment'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'urgent_case_public_wrapper_authority_boundary'
     )
     or to_regprocedure('public.submit_urgent_intake_idempotent(uuid,text,text,text,text,text,text,text,text,boolean,uuid)') is null
     or to_regprocedure('public.claim_urgent_intake_idempotent(uuid,integer,uuid)') is null
     or to_regprocedure('public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)') is null
     or to_regprocedure('public.assign_task_idempotent(uuid,integer,uuid,text,uuid)') is null then
    raise exception 'Urgent family migration is missing or incomplete';
  end if;
end
$preflight$;

drop table if exists pg_temp.passage_urgent_matrix_baseline;
create temp table passage_urgent_matrix_baseline (
  relation_name text primary key,
  row_count bigint not null,
  row_digest text not null
) on commit preserve rows;

insert into passage_urgent_matrix_baseline (
  relation_name, row_count, row_digest
)
select
  'urgent_intake_requests',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.urgent_intake_requests row_value
union all
select
  'urgent_intake_events',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.urgent_intake_events row_value
union all
select
  'workflows',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.workflows row_value
union all
select
  'tasks',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.tasks row_value
union all
select
  'workflow_events',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.workflow_events row_value
union all
select
  'organization_member_locations',
  count(*),
  coalesce(
    md5(string_agg(
      to_jsonb(row_value)::text,
      E'\n' order by
        row_value.organization_member_id::text,
        row_value.organization_location_id::text
    )),
    md5('')
  )
from public.organization_member_locations row_value;

begin isolation level repeatable read;

do $baseline_and_collision_guard$
declare
  v_relation_name text;
  v_count bigint;
  v_digest text;
  v_expected_count bigint;
  v_expected_digest text;
begin
  for v_relation_name in
    select relation_name
    from pg_temp.passage_urgent_matrix_baseline
    order by relation_name
  loop
    if v_relation_name = 'organization_member_locations' then
      select
        count(*),
        coalesce(
          md5(string_agg(
            to_jsonb(row_value)::text,
            E'\n' order by
              row_value.organization_member_id::text,
              row_value.organization_location_id::text
          )),
          md5('')
        )
      into v_count, v_digest
      from public.organization_member_locations row_value;
    else
      execute format(
        'select count(*), coalesce(md5(string_agg(to_jsonb(row_value)::text, E''\n'' order by row_value.id::text)), md5('''')) from public.%I row_value',
        v_relation_name
      )
      into v_count, v_digest;
    end if;

    select row_count, row_digest
    into strict v_expected_count, v_expected_digest
    from pg_temp.passage_urgent_matrix_baseline
    where relation_name = v_relation_name;

    if v_count is distinct from v_expected_count
       or v_digest is distinct from v_expected_digest then
      raise exception 'Retained shared-lab baseline changed before the rollback matrix began: %',
        v_relation_name;
    end if;
  end loop;

  if exists (
    select 1
    from auth.users
    where id = any(array[
      'a1000011-a100-4100-8100-000000000011'::uuid,
      'a1000012-a100-4100-8100-000000000012'::uuid,
      'a1000013-a100-4100-8100-000000000013'::uuid,
      'a1000014-a100-4100-8100-000000000014'::uuid,
      'a1000015-a100-4100-8100-000000000015'::uuid,
      'a1000016-a100-4100-8100-000000000016'::uuid,
      'a1000017-a100-4100-8100-000000000017'::uuid,
      'a1000018-a100-4100-8100-000000000018'::uuid,
      'a1000019-a100-4100-8100-000000000019'::uuid,
      'a1000020-a100-4100-8100-000000000020'::uuid
    ])
       or lower(email) = any(array[
         'family@urgent-boundary.test',
         'wrong-director@urgent-boundary.test',
         'northstar-staff@urgent-boundary.test',
         'outsider@urgent-boundary.test',
         'revoked-director@urgent-boundary.test',
         'wrong-location-director@urgent-boundary.test',
         'wrong-location-staff@urgent-boundary.test',
         'revoked-staff@urgent-boundary.test',
         'wrong-organization-staff@urgent-boundary.test',
         'unassigned-staff@urgent-boundary.test'
       ])
  ) or exists (
    select 1 from public.organizations
    where id = 'a1000021-a100-4100-8100-000000000021'
  ) or exists (
    select 1 from public.organization_locations
    where id = any(array[
      'a1000022-a100-4100-8100-000000000022'::uuid,
      'a1000023-a100-4100-8100-000000000023'::uuid
    ])
  ) or exists (
    select 1 from public.organization_members
    where id = any(array[
      'a1000031-a100-4100-8100-000000000031'::uuid,
      'a1000032-a100-4100-8100-000000000032'::uuid,
      'a1000033-a100-4100-8100-000000000033'::uuid,
      'a1000034-a100-4100-8100-000000000034'::uuid,
      'a1000035-a100-4100-8100-000000000035'::uuid,
      'a1000036-a100-4100-8100-000000000036'::uuid,
      'a1000037-a100-4100-8100-000000000037'::uuid,
      'a1000038-a100-4100-8100-000000000038'::uuid
    ])
  ) or exists (
    select 1
    from public.urgent_intake_requests
    where creation_request_id = any(array[
      'a1000101-a100-4100-8100-000000000101'::uuid,
      'a1000104-a100-4100-8100-000000000104'::uuid,
      'a1000107-a100-4100-8100-000000000107'::uuid
    ])
  ) or exists (
    select 1
    from public.workflow_events
    where idempotency_key = any(array[
      'task_assignment:a1000109-a100-4100-8100-000000000109',
      'task_assignment:a1000110-a100-4100-8100-000000000110',
      'task_assignment:a1000111-a100-4100-8100-000000000111',
      'task_assignment:a1000112-a100-4100-8100-000000000112',
      'task_assignment:a1000113-a100-4100-8100-000000000113',
      'task_assignment:a1000114-a100-4100-8100-000000000114',
      'task_assignment:a1000115-a100-4100-8100-000000000115',
      'task_assignment:a1000116-a100-4100-8100-000000000116'
    ])
  ) or exists (
    select 1
    from public.workflows
    where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
      and case_reference = 'URGENT-BOUNDARY-1'
  ) then
    raise exception 'Reserved urgent rollback-matrix identity, key, or case reference already exists';
  end if;
end
$baseline_and_collision_guard$;

do $catalog_boundary$
declare
  v_function regprocedure;
  v_definition text;
  v_policy_expression text;
  v_constraint_definition text;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'urgent_intake_requests'
      and column_name = 'receiving_organization_id'
      and is_nullable = 'NO'
  ) or not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.urgent_intake_requests'::regclass
      and conname in (
        'urgent_intake_requests_claim_matches_receiver',
        'urgent_intake_requests_packet1_receiver'
      )
    group by conrelid
    having count(*) = 2
  ) then
    raise exception 'Receiving-organization column/invariant is incomplete';
  end if;

  if to_regprocedure('public.submit_urgent_intake_idempotent(text,text,text,text,text,text,text,text,boolean,uuid)') is not null then
    raise exception 'Org-agnostic urgent submission overload is still executable';
  end if;

  select lower(pg_get_functiondef(
    'passage_private.claim_urgent_intake_idempotent(uuid,integer,uuid)'::regprocedure
  )) into v_definition;
  if position('member_row.organization_id = v_request.receiving_organization_id' in v_definition) = 0
     or position('claimed_organization_id = v_request.receiving_organization_id' in v_definition) = 0
     or position('(v_existing_event.metadata ->> ''expected_version'')::integer' in v_definition) = 0 then
    raise exception 'Claim command lost the receiving-organization authority binding';
  end if;

  select lower(pg_get_expr(policy_row.polqual, policy_row.polrelid))
  into v_policy_expression
  from pg_policy policy_row
  where policy_row.polrelid = 'public.urgent_intake_requests'::regclass
    and policy_row.polname = 'urgent_intake_requests_authorized_select';

  select lower(pg_get_constraintdef(constraint_row.oid))
  into v_constraint_definition
  from pg_constraint constraint_row
  where constraint_row.conrelid = 'public.urgent_intake_requests'::regclass
    and constraint_row.conname = 'urgent_intake_requests_packet1_receiver';

  if position('wants_callback' in v_policy_expression) = 0
     or position('self_handling' in v_policy_expression) = 0
     or position('c7a00001-7a00-47a0-87a0-000000000001' in v_constraint_definition) = 0 then
    raise exception 'Callback-only RLS or exact Packet-1 receiver constraint drifted';
  end if;

  select lower(pg_get_functiondef(
    'passage_private.submit_urgent_intake_idempotent(uuid,text,text,text,text,text,text,text,text,boolean,uuid)'::regprocedure
  )) into v_definition;
  if position('p_receiving_organization_id is distinct from' in v_definition) = 0
     or position('v_existing.person_location is distinct from btrim(p_person_location)' in v_definition) = 0
     or position('v_existing.person_timing is distinct from v_timing' in v_definition) = 0
     or position('v_existing.coordinator_phone is distinct from v_phone' in v_definition) = 0
     or position('v_existing.coordinator_email is distinct from v_email' in v_definition) = 0
     or position('v_existing.callback_notes is distinct from v_notes' in v_definition) = 0
     or position('v_existing.wants_callback is distinct from p_wants_callback' in v_definition) = 0 then
    raise exception 'Submission command lost receiver allowlist or complete normalized replay comparison';
  end if;

  select lower(pg_get_functiondef(
    'passage_private.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)'::regprocedure
  )) into v_definition;
  if position('organization_location_id' in v_definition) = 0
     or position('case_reference' in v_definition) = 0
     or position('family_name' in v_definition) = 0
     or position('expected_version' in v_definition) = 0
     or position('insert into public.tasks' in v_definition) = 0
     or position('urgent_intake_first_task:' in v_definition) = 0
     or position('first_task_id' in v_definition) = 0 then
    raise exception 'Case creation lost replay validation or first-commitment atomicity';
  end if;

  for v_function in
    select function_oid
    from unnest(array[
      'passage_private.is_active_urgent_leader_of_organization(uuid)'::regprocedure,
      'passage_private.can_view_urgent_intake_request(uuid)'::regprocedure,
      'passage_private.submit_urgent_intake_idempotent(uuid,text,text,text,text,text,text,text,text,boolean,uuid)'::regprocedure,
      'passage_private.claim_urgent_intake_idempotent(uuid,integer,uuid)'::regprocedure,
      'passage_private.assign_task_idempotent(uuid,integer,uuid,text,uuid)'::regprocedure
    ]) as functions(function_oid)
  loop
    if not has_function_privilege('authenticated', v_function, 'EXECUTE')
       or has_function_privilege('anon', v_function, 'EXECUTE')
       or has_function_privilege('service_role', v_function, 'EXECUTE')
       or not exists (
         select 1
         from pg_proc
         where oid = v_function
           and array_to_string(proconfig, ',') like 'search_path=%'
       ) then
      raise exception 'Urgent helper ACL/search_path posture drifted for %', v_function;
    end if;
  end loop;

  if not has_schema_privilege('authenticated', 'public', 'USAGE')
     or not has_function_privilege(
       'authenticated',
       'public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'service_role',
       'public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'authenticated',
       'passage_private.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'passage_private.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'service_role',
       'passage_private.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)',
       'EXECUTE'
     )
     or not (
       select procedure_row.prosecdef
         and exists (
           select 1
           from unnest(procedure_row.proconfig) config_value
           where config_value in ('search_path=', 'search_path=""')
         )
       from pg_proc procedure_row
       where procedure_row.oid =
         'public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)'::regprocedure
     ) then
    raise exception 'Case command ACL boundary must expose only the public authenticated entrypoint';
  end if;

  if not has_table_privilege(
       'authenticated', 'public.urgent_intake_requests', 'SELECT'
     )
     or has_table_privilege(
       'authenticated', 'public.urgent_intake_requests', 'INSERT'
     )
     or has_table_privilege(
       'authenticated', 'public.urgent_intake_requests', 'UPDATE'
     )
     or has_table_privilege(
       'authenticated', 'public.urgent_intake_requests', 'DELETE'
     )
     or not has_table_privilege(
       'authenticated', 'public.urgent_intake_events', 'SELECT'
     )
     or has_table_privilege(
       'authenticated', 'public.urgent_intake_events', 'INSERT'
     )
     or has_table_privilege(
       'authenticated', 'public.urgent_intake_events', 'UPDATE'
     )
     or has_table_privilege(
       'authenticated', 'public.urgent_intake_events', 'DELETE'
     )
     or not has_table_privilege(
       'authenticated', 'public.organization_member_locations', 'SELECT'
     )
     or has_table_privilege(
       'authenticated', 'public.organization_member_locations', 'INSERT'
     )
     or has_table_privilege(
       'authenticated', 'public.organization_member_locations', 'UPDATE'
     )
     or has_table_privilege(
       'authenticated', 'public.organization_member_locations', 'DELETE'
     )
     or not (
       select count(*) = 6 and bool_and(relrowsecurity)
       from pg_class
       where oid in (
         'public.urgent_intake_requests'::regclass,
         'public.urgent_intake_events'::regclass,
         'public.organization_member_locations'::regclass,
         'public.workflows'::regclass,
         'public.tasks'::regclass,
         'public.workflow_events'::regclass
       )
     ) then
    raise exception 'Urgent table ACL or RLS posture drifted';
  end if;
end
$catalog_boundary$;

insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('a1000011-a100-4100-8100-000000000011', 'family@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Family"}', now(), now()),
  ('a1000012-a100-4100-8100-000000000012', 'wrong-director@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Wrong Director"}', now(), now()),
  ('a1000013-a100-4100-8100-000000000013', 'northstar-staff@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Northstar Staff"}', now(), now()),
  ('a1000014-a100-4100-8100-000000000014', 'outsider@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Outsider"}', now(), now()),
  ('a1000015-a100-4100-8100-000000000015', 'revoked-director@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Revoked Director"}', now(), now()),
  ('a1000016-a100-4100-8100-000000000016', 'wrong-location-director@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Wrong Location Director"}', now(), now()),
  ('a1000017-a100-4100-8100-000000000017', 'wrong-location-staff@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Wrong Location Staff"}', now(), now()),
  ('a1000018-a100-4100-8100-000000000018', 'revoked-staff@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Revoked Staff"}', now(), now()),
  ('a1000019-a100-4100-8100-000000000019', 'wrong-organization-staff@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Wrong Organization Staff"}', now(), now()),
  ('a1000020-a100-4100-8100-000000000020', 'unassigned-staff@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Unassigned Staff"}', now(), now());

insert into public.organizations (id, name)
values ('a1000021-a100-4100-8100-000000000021', 'Wrong Organization');

insert into public.organization_locations (id, organization_id, name, status)
values
  (
    'a1000022-a100-4100-8100-000000000022',
    'a1000021-a100-4100-8100-000000000021',
    'Wrong Organization Location',
    'active'
  ),
  (
    'a1000023-a100-4100-8100-000000000023',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'Northstar East',
    'active'
  );

insert into public.organization_members (
  id, organization_id, user_id, email, role, status, display_name, accepted_at,
  revoked_at, revoked_by_user_id, revocation_reason
) values
  (
    'a1000031-a100-4100-8100-000000000031',
    'a1000021-a100-4100-8100-000000000021',
    'a1000012-a100-4100-8100-000000000012',
    'wrong-director@urgent-boundary.test',
    'director', 'active', 'Wrong Director', now(),
    null, null, null
  ),
  (
    'a1000032-a100-4100-8100-000000000032',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'a1000013-a100-4100-8100-000000000013',
    'northstar-staff@urgent-boundary.test',
    'staff', 'active', 'Northstar Staff', now(),
    null, null, null
  ),
  (
    'a1000033-a100-4100-8100-000000000033',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'a1000015-a100-4100-8100-000000000015',
    'revoked-director@urgent-boundary.test',
    'director', 'revoked', 'Revoked Director', now(),
    clock_timestamp(),
    (
      select user_id
      from public.organization_members
      where id = 'c7a00003-7a00-47a0-87a0-000000000003'
    ),
    'Rollback-only revoked director authority test'
  ),
  (
    'a1000034-a100-4100-8100-000000000034',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'a1000016-a100-4100-8100-000000000016',
    'wrong-location-director@urgent-boundary.test',
    'director', 'active', 'Wrong Location Director', now(),
    null, null, null
  ),
  (
    'a1000035-a100-4100-8100-000000000035',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'a1000017-a100-4100-8100-000000000017',
    'wrong-location-staff@urgent-boundary.test',
    'staff', 'active', 'Wrong Location Staff', now(),
    null, null, null
  ),
  (
    'a1000036-a100-4100-8100-000000000036',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'a1000018-a100-4100-8100-000000000018',
    'revoked-staff@urgent-boundary.test',
    'staff', 'revoked', 'Revoked Staff', now(),
    clock_timestamp(),
    (
      select user_id
      from public.organization_members
      where id = 'c7a00003-7a00-47a0-87a0-000000000003'
    ),
    'Rollback-only revoked assignment target'
  ),
  (
    'a1000037-a100-4100-8100-000000000037',
    'a1000021-a100-4100-8100-000000000021',
    'a1000019-a100-4100-8100-000000000019',
    'wrong-organization-staff@urgent-boundary.test',
    'staff', 'active', 'Wrong Organization Staff', now(),
    null, null, null
  ),
  (
    'a1000038-a100-4100-8100-000000000038',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'a1000020-a100-4100-8100-000000000020',
    'unassigned-staff@urgent-boundary.test',
    'staff', 'active', 'Unassigned Staff', now(),
    null, null, null
  );

insert into public.organization_member_locations (
  organization_member_id, organization_location_id, granted_by_user_id
) values (
  'a1000031-a100-4100-8100-000000000031',
  'a1000022-a100-4100-8100-000000000022',
  'a1000012-a100-4100-8100-000000000012'
);

insert into public.organization_member_locations (
  organization_member_id, organization_location_id, granted_by_user_id
)
select
  'a1000032-a100-4100-8100-000000000032',
  'c7a00002-7a00-47a0-87a0-000000000002',
  director_member.user_id
from public.organization_members director_member
where director_member.id = 'c7a00003-7a00-47a0-87a0-000000000003';

insert into public.organization_member_locations (
  organization_member_id, organization_location_id, granted_by_user_id
) values
  (
    'a1000034-a100-4100-8100-000000000034',
    'a1000023-a100-4100-8100-000000000023',
    'a1000016-a100-4100-8100-000000000016'
  ),
  (
    'a1000035-a100-4100-8100-000000000035',
    'a1000023-a100-4100-8100-000000000023',
    'a1000016-a100-4100-8100-000000000016'
  ),
  (
    'a1000037-a100-4100-8100-000000000037',
    'a1000022-a100-4100-8100-000000000022',
    'a1000012-a100-4100-8100-000000000012'
  ),
  (
    'a1000038-a100-4100-8100-000000000038',
    'c7a00002-7a00-47a0-87a0-000000000002',
    (
      select user_id
      from public.organization_members
      where id = 'c7a00003-7a00-47a0-87a0-000000000003'
    )
  );

insert into public.organization_member_locations (
  organization_member_id, organization_location_id, granted_by_user_id, revoked_at
)
select
  'a1000036-a100-4100-8100-000000000036',
  'c7a00002-7a00-47a0-87a0-000000000002',
  director_member.user_id,
  clock_timestamp()
from public.organization_members director_member
where director_member.id = 'c7a00003-7a00-47a0-87a0-000000000003';

select set_config(
  'passage.test_director_user_id',
  (
    select user_id::text
    from public.organization_members
    where id = 'c7a00003-7a00-47a0-87a0-000000000003'
      and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
      and status = 'active'
      and role in ('owner', 'director')
  ),
  true
);

set local role authenticated;

do $authority_matrix$
declare
  v_northstar constant uuid := 'c7a00001-7a00-47a0-87a0-000000000001';
  v_northstar_location constant uuid := 'c7a00002-7a00-47a0-87a0-000000000002';
  v_wrong_org constant uuid := 'a1000021-a100-4100-8100-000000000021';
  v_request_key constant uuid := 'a1000101-a100-4100-8100-000000000101';
  v_claim_key constant uuid := 'a1000102-a100-4100-8100-000000000102';
  v_case_key constant uuid := 'a1000103-a100-4100-8100-000000000103';
  v_wrong_receiver_key constant uuid := 'a1000104-a100-4100-8100-000000000104';
  v_stale_claim_key constant uuid := 'a1000105-a100-4100-8100-000000000105';
  v_stale_case_key constant uuid := 'a1000106-a100-4100-8100-000000000106';
  v_private_key constant uuid := 'a1000107-a100-4100-8100-000000000107';
  v_director_user_id uuid := current_setting('passage.test_director_user_id')::uuid;
  v_request_id uuid;
  v_private_request_id uuid;
  v_workflow_id uuid;
  v_first_task_id uuid;
  v_assignment_event_id uuid;
  v_request_snapshot text;
  v_urgent_event_snapshot text;
  v_workflow_snapshot text;
  v_task_snapshot text;
  v_workflow_event_snapshot text;
  v_private_request_snapshot text;
  v_private_event_snapshot text;
  v_receipt record;
begin
  perform set_config('request.jwt.claim.sub', 'a1000011-a100-4100-8100-000000000011', true);

  begin
    perform public.submit_urgent_intake_idempotent(
      v_wrong_org, 'hospice', 'Wrong Receiver', 'Portland, Oregon', null,
      'Alex Example', '555-0100', 'family@urgent-boundary.test', null, true,
      v_wrong_receiver_key
    );
    raise exception 'Expected fresh-key non-allowlisted receiver denial';
  exception
    when sqlstate '22023' then null;
  end;
  if exists (
    select 1 from public.urgent_intake_requests
    where creation_request_id = v_wrong_receiver_key
  ) or exists (
    select 1 from public.urgent_intake_events
    where idempotency_key =
      'urgent_intake_create:' || v_wrong_receiver_key::text
  ) then
    raise exception 'Fresh-key wrong receiver denial created partial request/event state';
  end if;

  select * into strict v_receipt
  from public.submit_urgent_intake_idempotent(
    v_northstar, 'hospice', 'Morgan Example', 'Portland, Oregon', null,
    'Alex Example', '555-0100', 'family@urgent-boundary.test', null, true,
    v_request_key
  );
  v_request_id := v_receipt.urgent_intake_request_id;
  if v_receipt.replayed or v_receipt.status <> 'submitted' or v_receipt.version <> 1 then
    raise exception 'Initial urgent submission receipt is incorrect';
  end if;
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id
      and receiving_organization_id = v_northstar
      and claimed_organization_id is null
  ) or (
    select count(*) from public.urgent_intake_events
    where urgent_intake_request_id = v_request_id
  ) <> 1 then
    raise exception 'Submission did not bind exactly one Northstar request and event';
  end if;
  select md5(to_jsonb(request_row)::text)
  into strict v_request_snapshot
  from public.urgent_intake_requests request_row
  where request_row.id = v_request_id;
  select coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_urgent_event_snapshot
  from public.urgent_intake_events event_row
  where event_row.urgent_intake_request_id = v_request_id;

  select * into strict v_receipt
  from public.submit_urgent_intake_idempotent(
    v_northstar, 'hospice', 'Morgan Example', 'Portland, Oregon', null,
    'Alex Example', '555-0100', 'family@urgent-boundary.test', null, true,
    v_request_key
  );
  if not v_receipt.replayed or v_receipt.urgent_intake_request_id <> v_request_id then
    raise exception 'Same-organization submission replay was not idempotent';
  end if;

  begin
    perform public.submit_urgent_intake_idempotent(
      v_northstar, 'hospice', 'Morgan Example', 'Portland, Oregon', null,
      'Alex Example', '555-0100', 'family@urgent-boundary.test', 'changed', true,
      v_request_key
    );
    raise exception 'Expected normalized submission payload conflict';
  exception
    when sqlstate '22023' then null;
  end;
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id and version = 1 and callback_notes is null
  ) or (
    select count(*) from public.urgent_intake_events
    where urgent_intake_request_id = v_request_id
  ) <> 1 then
    raise exception 'Submission conflict changed request/event cardinality';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000014-a100-4100-8100-000000000014', true);
  if (select count(*) from public.urgent_intake_requests where id = v_request_id) <> 0
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 0 then
    raise exception 'Unaffiliated requester isolation failed';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000012-a100-4100-8100-000000000012', true);
  if (select count(*) from public.urgent_intake_requests where id in (v_request_id, v_private_request_id)) <> 0
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id in (v_request_id, v_private_request_id)) <> 0 then
    raise exception 'Wrong-organization director can see Northstar rows';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(v_request_id, 1, v_claim_key);
    raise exception 'Expected wrong-organization claim denial';
  exception
    when sqlstate '42501' then null;
  end;
  perform set_config('request.jwt.claim.sub', 'a1000011-a100-4100-8100-000000000011', true);
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id and status = 'submitted' and version = 1
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 1 then
    raise exception 'Wrong-organization denial changed request/event cardinality';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000013-a100-4100-8100-000000000013', true);
  if (select count(*) from public.urgent_intake_requests where id = v_request_id) <> 0 then
    raise exception 'Northstar staff can see leader-only urgent rows';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(v_request_id, 1, v_claim_key);
    raise exception 'Expected staff claim denial';
  exception
    when sqlstate '42501' then null;
  end;
  perform set_config('request.jwt.claim.sub', 'a1000011-a100-4100-8100-000000000011', true);
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id and status = 'submitted' and version = 1
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 1 then
    raise exception 'Staff denial changed request/event cardinality';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000015-a100-4100-8100-000000000015', true);
  if (select count(*) from public.urgent_intake_requests where id = v_request_id) <> 0 then
    raise exception 'Revoked director retained urgent projection';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(v_request_id, 1, v_claim_key);
    raise exception 'Expected revoked-director claim denial';
  exception
    when sqlstate '42501' then null;
  end;
  perform set_config('request.jwt.claim.sub', 'a1000011-a100-4100-8100-000000000011', true);
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id and status = 'submitted' and version = 1
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 1 then
    raise exception 'Revoked-director denial changed request/event cardinality';
  end if;

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  if (select count(*) from public.urgent_intake_requests where id = v_request_id) <> 1 then
    raise exception 'Northstar director cannot list its explicitly addressed request';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(v_request_id, 99, v_stale_claim_key);
    raise exception 'Expected stale claim denial';
  exception
    when sqlstate '40001' then null;
  end;
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id and status = 'submitted' and version = 1
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 1 then
    raise exception 'Stale claim changed request/event cardinality';
  end if;
  if (
    select md5(to_jsonb(request_row)::text)
    from public.urgent_intake_requests request_row
    where request_row.id = v_request_id
  ) is distinct from v_request_snapshot or (
    select coalesce(
      md5(string_agg(
        to_jsonb(event_row)::text,
        E'\n' order by event_row.id::text
      )),
      md5('')
    )
    from public.urgent_intake_events event_row
    where event_row.urgent_intake_request_id = v_request_id
  ) is distinct from v_urgent_event_snapshot then
    raise exception 'Submission replay/conflict or claim denials changed durable rows';
  end if;

  select * into strict v_receipt
  from public.claim_urgent_intake_idempotent(v_request_id, 1, v_claim_key);
  if v_receipt.replayed or v_receipt.status <> 'claimed' or v_receipt.version <> 2 then
    raise exception 'Northstar claim receipt is incorrect';
  end if;
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id
      and receiving_organization_id = v_northstar
      and claimed_organization_id = v_northstar
  ) then
    raise exception 'Claim changed or omitted the receiving organization';
  end if;
  select md5(to_jsonb(request_row)::text)
  into strict v_request_snapshot
  from public.urgent_intake_requests request_row
  where request_row.id = v_request_id;
  select coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_urgent_event_snapshot
  from public.urgent_intake_events event_row
  where event_row.urgent_intake_request_id = v_request_id;
  begin
    perform public.claim_urgent_intake_idempotent(v_request_id, 99, v_claim_key);
    raise exception 'Expected changed-version claim replay conflict';
  exception
    when sqlstate '22023' then null;
  end;
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id and status = 'claimed' and version = 2
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 2 then
    raise exception 'Claim replay conflict changed request/event cardinality';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000012-a100-4100-8100-000000000012', true);
  begin
    perform public.create_case_from_urgent_intake_idempotent(
      v_request_id, 2, 'a1000022-a100-4100-8100-000000000022',
      'WRONG-1', 'Example family', v_case_key
    );
    raise exception 'Expected wrong-organization case-creation denial';
  exception
    when sqlstate '42501' then null;
  end;
  perform set_config('request.jwt.claim.sub', 'a1000011-a100-4100-8100-000000000011', true);
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id and status = 'claimed' and version = 2 and workflow_id is null
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 2 then
    raise exception 'Wrong-organization case denial changed request/event/cardinality';
  end if;

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  begin
    perform public.create_case_from_urgent_intake_idempotent(
      v_request_id, 99, v_northstar_location,
      'URGENT-STALE', 'Example family', v_stale_case_key
    );
    raise exception 'Expected stale case-creation denial';
  exception
    when sqlstate '40001' then null;
  end;
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id and status = 'claimed' and version = 2 and workflow_id is null
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 2 then
    raise exception 'Stale case creation changed request/event cardinality';
  end if;
  if (
    select md5(to_jsonb(request_row)::text)
    from public.urgent_intake_requests request_row
    where request_row.id = v_request_id
  ) is distinct from v_request_snapshot or (
    select coalesce(
      md5(string_agg(
        to_jsonb(event_row)::text,
        E'\n' order by event_row.id::text
      )),
      md5('')
    )
    from public.urgent_intake_events event_row
    where event_row.urgent_intake_request_id = v_request_id
  ) is distinct from v_urgent_event_snapshot then
    raise exception 'Claim replay/conflict or case denials changed durable rows';
  end if;

  select * into strict v_receipt
  from public.create_case_from_urgent_intake_idempotent(
    v_request_id, 2, v_northstar_location,
    'URGENT-BOUNDARY-1', 'Example family', v_case_key
  );
  v_workflow_id := v_receipt.workflow_id;
  v_first_task_id := v_receipt.first_task_id;
  if v_receipt.replayed
     or v_receipt.status <> 'case_created'
     or v_receipt.version <> 3
     or v_first_task_id is null then
    raise exception 'Northstar case-creation receipt is incorrect';
  end if;
  if not exists (
    select 1 from public.workflows
    where id = v_workflow_id
      and organization_id = v_northstar
      and organization_location_id = v_northstar_location
  ) or not exists (
    select 1 from public.tasks
    where id = v_first_task_id
      and workflow_id = v_workflow_id
      and organization_id = v_northstar
      and assigned_organization_member_id is null
      and title = 'Confirm the family''s first arrangement step.'
      and status = 'assigned'
      and version = 1
  ) or not exists (
    select 1 from public.workflow_events
    where workflow_id = v_workflow_id
      and task_id = v_first_task_id
      and organization_id = v_northstar
      and organization_location_id = v_northstar_location
      and name = 'task.created'
      and idempotency_key = 'urgent_intake_first_task:' || v_request_id::text
  ) or (
    select count(*) from public.urgent_intake_events
    where urgent_intake_request_id = v_request_id
  ) <> 3 then
    raise exception 'Case creation did not persist exact workflow/task/event truth';
  end if;
  select md5(to_jsonb(request_row)::text)
  into strict v_request_snapshot
  from public.urgent_intake_requests request_row
  where request_row.id = v_request_id;
  select coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_urgent_event_snapshot
  from public.urgent_intake_events event_row
  where event_row.urgent_intake_request_id = v_request_id;
  select md5(to_jsonb(workflow_row)::text)
  into strict v_workflow_snapshot
  from public.workflows workflow_row
  where workflow_row.id = v_workflow_id;
  select md5(to_jsonb(task_row)::text)
  into strict v_task_snapshot
  from public.tasks task_row
  where task_row.id = v_first_task_id;
  select coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_workflow_event_snapshot
  from public.workflow_events event_row
  where event_row.workflow_id = v_workflow_id;

  select * into strict v_receipt
  from public.create_case_from_urgent_intake_idempotent(
    v_request_id, 2, v_northstar_location,
    'URGENT-BOUNDARY-1', 'Example family', v_case_key
  );
  if not v_receipt.replayed
     or v_receipt.workflow_id <> v_workflow_id
     or v_receipt.first_task_id <> v_first_task_id then
    raise exception 'Case creation replay was not idempotent';
  end if;

  begin
    perform public.create_case_from_urgent_intake_idempotent(
      v_request_id, 99, v_northstar_location,
      'URGENT-BOUNDARY-1', 'Example family', v_case_key
    );
    raise exception 'Expected changed-version case replay conflict';
  exception
    when sqlstate '22023' then null;
  end;
  begin
    perform public.create_case_from_urgent_intake_idempotent(
      v_request_id, 2, 'a1000022-a100-4100-8100-000000000022',
      'URGENT-BOUNDARY-1', 'Example family', v_case_key
    );
    raise exception 'Expected changed-location case replay conflict';
  exception
    when sqlstate '22023' then null;
  end;
  begin
    perform public.create_case_from_urgent_intake_idempotent(
      v_request_id, 2, v_northstar_location,
      'CHANGED-REFERENCE', 'Example family', v_case_key
    );
    raise exception 'Expected changed-reference case replay conflict';
  exception
    when sqlstate '22023' then null;
  end;
  begin
    perform public.create_case_from_urgent_intake_idempotent(
      v_request_id, 2, v_northstar_location,
      'URGENT-BOUNDARY-1', 'Changed family', v_case_key
    );
    raise exception 'Expected changed-family case replay conflict';
  exception
    when sqlstate '22023' then null;
  end;
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id
      and status = 'case_created'
      and version = 3
      and workflow_id = v_workflow_id
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 3
     or (select count(*) from public.workflows where id = v_workflow_id) <> 1
     or (select count(*) from public.tasks where id = v_first_task_id and workflow_id = v_workflow_id) <> 1
     or (select count(*) from public.workflow_events where task_id = v_first_task_id and name = 'task.created') <> 1 then
    raise exception 'Case replay conflict changed request/workflow/task/event cardinality';
  end if;
  if (
    select md5(to_jsonb(request_row)::text)
    from public.urgent_intake_requests request_row
    where request_row.id = v_request_id
  ) is distinct from v_request_snapshot or (
    select coalesce(
      md5(string_agg(
        to_jsonb(event_row)::text,
        E'\n' order by event_row.id::text
      )),
      md5('')
    )
    from public.urgent_intake_events event_row
    where event_row.urgent_intake_request_id = v_request_id
  ) is distinct from v_urgent_event_snapshot or (
    select md5(to_jsonb(workflow_row)::text)
    from public.workflows workflow_row
    where workflow_row.id = v_workflow_id
  ) is distinct from v_workflow_snapshot or (
    select md5(to_jsonb(task_row)::text)
    from public.tasks task_row
    where task_row.id = v_first_task_id
  ) is distinct from v_task_snapshot or (
    select coalesce(
      md5(string_agg(
        to_jsonb(event_row)::text,
        E'\n' order by event_row.id::text
      )),
      md5('')
    )
    from public.workflow_events event_row
    where event_row.workflow_id = v_workflow_id
  ) is distinct from v_workflow_event_snapshot then
    raise exception 'Case replay/conflict denials changed durable rows';
  end if;

  select * into strict v_receipt
  from public.assign_task_idempotent(
    v_first_task_id, 1,
    'a1000032-a100-4100-8100-000000000032',
    'First task owner',
    'a1000109-a100-4100-8100-000000000109'
  );
  v_assignment_event_id := v_receipt.event_id;
  if v_receipt.replayed
     or v_receipt.assigned_member_id <> 'a1000032-a100-4100-8100-000000000032'
     or v_receipt.task_version <> 2 then
    raise exception 'Urgent first-task assignment receipt failed';
  end if;
  if not exists (
    select 1
    from public.tasks
    where id = v_first_task_id
      and workflow_id = v_workflow_id
      and assigned_organization_member_id = 'a1000032-a100-4100-8100-000000000032'
      and version = 2
  ) or not exists (
    select 1
    from public.workflow_events
    where id = v_assignment_event_id
      and workflow_id = v_workflow_id
      and task_id = v_first_task_id
      and name = 'task.assigned'
      and idempotency_key = 'task_assignment:a1000109-a100-4100-8100-000000000109'
  ) then
    raise exception 'Urgent first-task assignment did not persist task and append-only event';
  end if;
  select md5(to_jsonb(request_row)::text)
  into strict v_request_snapshot
  from public.urgent_intake_requests request_row
  where request_row.id = v_request_id;
  select coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_urgent_event_snapshot
  from public.urgent_intake_events event_row
  where event_row.urgent_intake_request_id = v_request_id;
  select md5(to_jsonb(workflow_row)::text)
  into strict v_workflow_snapshot
  from public.workflows workflow_row
  where workflow_row.id = v_workflow_id;
  select md5(to_jsonb(task_row)::text)
  into strict v_task_snapshot
  from public.tasks task_row
  where task_row.id = v_first_task_id;
  select coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_workflow_event_snapshot
  from public.workflow_events event_row
  where event_row.workflow_id = v_workflow_id;

  select * into strict v_receipt
  from public.assign_task_idempotent(
    v_first_task_id, 1,
    'a1000032-a100-4100-8100-000000000032',
    'First task owner',
    'a1000109-a100-4100-8100-000000000109'
  );
  if not v_receipt.replayed or v_receipt.event_id <> v_assignment_event_id then
    raise exception 'Urgent first-task assignment replay duplicated or changed its receipt';
  end if;
  if (
    select count(*)
    from public.workflow_events
    where task_id = v_first_task_id and name = 'task.assigned'
  ) <> 1 then
    raise exception 'Urgent first-task assignment replay duplicated its event';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000013-a100-4100-8100-000000000013', true);
  if (
    select count(*)
    from public.tasks
    where organization_id = v_northstar
      and id = v_first_task_id
      and workflow_id = v_workflow_id
      and assigned_organization_member_id = 'a1000032-a100-4100-8100-000000000032'
      and version = 2
  ) <> 1 or (
    select count(*)
    from public.workflows
    where organization_id = v_northstar
      and id = v_workflow_id
      and organization_location_id = v_northstar_location
  ) <> 1 then
    raise exception 'Assigned staff My Work RLS projection omitted the urgent workflow or task';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000014-a100-4100-8100-000000000014', true);
  if (select count(*) from public.tasks where id = v_first_task_id) <> 0
     or (select count(*) from public.workflows where id = v_workflow_id) <> 0 then
    raise exception 'Unaffiliated identity can see the urgent workflow or task';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000020-a100-4100-8100-000000000020', true);
  if (select count(*) from public.tasks where id = v_first_task_id) <> 0
     or (select count(*) from public.workflows where id = v_workflow_id) <> 0 then
    raise exception 'Unassigned exact-location staff can see the urgent workflow or task';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000017-a100-4100-8100-000000000017', true);
  if (select count(*) from public.tasks where id = v_first_task_id) <> 0
     or (select count(*) from public.workflows where id = v_workflow_id) <> 0 then
    raise exception 'Wrong-location staff can see the urgent workflow or task';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000019-a100-4100-8100-000000000019', true);
  if (select count(*) from public.tasks where id = v_first_task_id) <> 0
     or (select count(*) from public.workflows where id = v_workflow_id) <> 0 then
    raise exception 'Wrong-organization staff can see the urgent workflow or task';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000018-a100-4100-8100-000000000018', true);
  if (select count(*) from public.tasks where id = v_first_task_id) <> 0
     or (select count(*) from public.workflows where id = v_workflow_id) <> 0 then
    raise exception 'Former or revoked staff can see the urgent workflow or task';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000015-a100-4100-8100-000000000015', true);
  if (select count(*) from public.tasks where id = v_first_task_id) <> 0
     or (select count(*) from public.workflows where id = v_workflow_id) <> 0 then
    raise exception 'Former or revoked director can see the urgent workflow or task';
  end if;

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  if not exists (
    select 1
    from public.tasks
    where id = v_first_task_id
      and assigned_organization_member_id = 'a1000032-a100-4100-8100-000000000032'
      and version = 2
  ) or not exists (
    select 1
    from public.workflows
    where id = v_workflow_id
  ) or (
    select count(*)
    from public.workflow_events
    where task_id = v_first_task_id and name = 'task.assigned'
  ) <> 1 then
    raise exception 'My Work RLS visibility matrix changed durable assignment cardinality';
  end if;

  begin
    perform public.assign_task_idempotent(
      v_first_task_id, 2,
      'a1000037-a100-4100-8100-000000000037',
      'Wrong organization target',
      'a1000110-a100-4100-8100-000000000110'
    );
    raise exception 'Expected wrong-organization assignment target denial';
  exception when sqlstate '42501' then null; end;

  begin
    perform public.assign_task_idempotent(
      v_first_task_id, 2,
      'a1000035-a100-4100-8100-000000000035',
      'Wrong location target',
      'a1000111-a100-4100-8100-000000000111'
    );
    raise exception 'Expected wrong-location assignment target denial';
  exception when sqlstate '42501' then null; end;

  begin
    perform public.assign_task_idempotent(
      v_first_task_id, 2,
      'a1000036-a100-4100-8100-000000000036',
      'Revoked target',
      'a1000112-a100-4100-8100-000000000112'
    );
    raise exception 'Expected revoked assignment target denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('request.jwt.claim.sub', 'a1000012-a100-4100-8100-000000000012', true);
  begin
    perform public.assign_task_idempotent(
      v_first_task_id, 2,
      'a1000032-a100-4100-8100-000000000032',
      'Wrong organization actor',
      'a1000113-a100-4100-8100-000000000113'
    );
    raise exception 'Expected wrong-organization assignment actor denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('request.jwt.claim.sub', 'a1000016-a100-4100-8100-000000000016', true);
  begin
    perform public.assign_task_idempotent(
      v_first_task_id, 2,
      'a1000032-a100-4100-8100-000000000032',
      'Wrong location actor',
      'a1000114-a100-4100-8100-000000000114'
    );
    raise exception 'Expected wrong-location assignment actor denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('request.jwt.claim.sub', 'a1000014-a100-4100-8100-000000000014', true);
  begin
    perform public.assign_task_idempotent(
      v_first_task_id, 2,
      'a1000032-a100-4100-8100-000000000032',
      'Unaffiliated actor',
      'a1000115-a100-4100-8100-000000000115'
    );
    raise exception 'Expected unaffiliated assignment actor denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('request.jwt.claim.sub', 'a1000015-a100-4100-8100-000000000015', true);
  begin
    perform public.assign_task_idempotent(
      v_first_task_id, 2,
      'a1000032-a100-4100-8100-000000000032',
      'Former or revoked actor',
      'a1000116-a100-4100-8100-000000000116'
    );
    raise exception 'Expected former-or-revoked assignment actor denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  if not exists (
    select 1
    from public.tasks
    where id = v_first_task_id
      and assigned_organization_member_id = 'a1000032-a100-4100-8100-000000000032'
      and version = 2
  ) or (
    select count(*)
    from public.workflow_events
    where task_id = v_first_task_id and name = 'task.assigned'
  ) <> 1 then
    raise exception 'Assignment denials changed durable task or event cardinality';
  end if;
  if (
    select md5(to_jsonb(request_row)::text)
    from public.urgent_intake_requests request_row
    where request_row.id = v_request_id
  ) is distinct from v_request_snapshot or (
    select coalesce(
      md5(string_agg(
        to_jsonb(event_row)::text,
        E'\n' order by event_row.id::text
      )),
      md5('')
    )
    from public.urgent_intake_events event_row
    where event_row.urgent_intake_request_id = v_request_id
  ) is distinct from v_urgent_event_snapshot or (
    select md5(to_jsonb(workflow_row)::text)
    from public.workflows workflow_row
    where workflow_row.id = v_workflow_id
  ) is distinct from v_workflow_snapshot or (
    select md5(to_jsonb(task_row)::text)
    from public.tasks task_row
    where task_row.id = v_first_task_id
  ) is distinct from v_task_snapshot or (
    select coalesce(
      md5(string_agg(
        to_jsonb(event_row)::text,
        E'\n' order by event_row.id::text
      )),
      md5('')
    )
    from public.workflow_events event_row
    where event_row.workflow_id = v_workflow_id
  ) is distinct from v_workflow_event_snapshot then
    raise exception 'Assignment replay, RLS projections, or denials changed durable rows';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000011-a100-4100-8100-000000000011', true);
  begin
    insert into public.urgent_intake_events (
      urgent_intake_request_id, actor_user_id, name, next_state,
      idempotency_key
    ) values (
      v_request_id, 'a1000011-a100-4100-8100-000000000011',
      'forged', 'forged', 'forged-insert'
    );
    raise exception 'Expected direct event insert denial';
  exception
    when sqlstate '42501' then null;
  end;
  begin
    update public.urgent_intake_events
    set metadata = jsonb_build_object('tampered', true)
    where urgent_intake_request_id = v_request_id;
    raise exception 'Expected append-only event mutation denial'
      using errcode = 'ZX001';
  exception
    when others then
      if sqlstate not in ('42501', 'P0001') then raise; end if;
  end;
  begin
    delete from public.urgent_intake_events
    where urgent_intake_request_id = v_request_id;
    raise exception 'Expected append-only event delete denial'
      using errcode = 'ZX001';
  exception
    when others then
      if sqlstate not in ('42501', 'P0001') then raise; end if;
  end;
  if (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 3 then
    raise exception 'Event INSERT/UPDATE/DELETE denial changed append-only cardinality';
  end if;
  if (
    select coalesce(
      md5(string_agg(
        to_jsonb(event_row)::text,
        E'\n' order by event_row.id::text
      )),
      md5('')
    )
    from public.urgent_intake_events event_row
    where event_row.urgent_intake_request_id = v_request_id
  ) is distinct from v_urgent_event_snapshot then
    raise exception 'Direct urgent-event denials changed append-only rows';
  end if;

  select * into strict v_receipt
  from public.submit_urgent_intake_idempotent(
    v_northstar, 'already_handled', 'Private Example', 'Portland, Oregon', null,
    'Alex Example', '555-0100', 'family@urgent-boundary.test',
    'Keep private', false, v_private_key
  );
  v_private_request_id := v_receipt.urgent_intake_request_id;
  if v_receipt.status <> 'self_handling'
     or not exists (
       select 1 from public.urgent_intake_requests
       where id = v_private_request_id
         and status = 'self_handling'
         and not wants_callback
         and claimed_organization_id is null
         and workflow_id is null
     )
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_private_request_id) <> 1 then
    raise exception 'Requester-private self-handling state is incorrect';
  end if;
  select md5(to_jsonb(request_row)::text)
  into strict v_private_request_snapshot
  from public.urgent_intake_requests request_row
  where request_row.id = v_private_request_id;
  select coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_private_event_snapshot
  from public.urgent_intake_events event_row
  where event_row.urgent_intake_request_id = v_private_request_id;

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  if (select count(*) from public.urgent_intake_requests where id = v_private_request_id) <> 0
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_private_request_id) <> 0 then
    raise exception 'Northstar director can see requester-private self-handling rows';
  end if;
  begin
    perform public.claim_urgent_intake_idempotent(
      v_private_request_id, 1, 'a1000108-a100-4100-8100-000000000108'
    );
    raise exception 'Expected self-handling claim denial';
  exception
    when sqlstate '42501' then null;
  end;

  perform set_config('request.jwt.claim.sub', 'a1000011-a100-4100-8100-000000000011', true);
  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_private_request_id
      and status = 'self_handling'
      and version = 1
      and claimed_organization_id is null
      and workflow_id is null
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_private_request_id) <> 1 then
    raise exception 'Self-handling denial changed private request/event cardinality';
  end if;
  if (
    select md5(to_jsonb(request_row)::text)
    from public.urgent_intake_requests request_row
    where request_row.id = v_private_request_id
  ) is distinct from v_private_request_snapshot or (
    select coalesce(
      md5(string_agg(
        to_jsonb(event_row)::text,
        E'\n' order by event_row.id::text
      )),
      md5('')
    )
    from public.urgent_intake_events event_row
    where event_row.urgent_intake_request_id = v_private_request_id
  ) is distinct from v_private_event_snapshot then
    raise exception 'Private-request RLS or claim denial changed durable rows';
  end if;

  perform set_config('request.jwt.claim.sub', 'a1000012-a100-4100-8100-000000000012', true);
  if (select count(*) from public.urgent_intake_requests where id in (v_request_id, v_private_request_id)) <> 0
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id in (v_request_id, v_private_request_id)) <> 0 then
    raise exception 'Wrong organization can see rows after claim/case creation';
  end if;

  perform set_config('passage.test_urgent_request_id', v_request_id::text, true);
  perform set_config('passage.test_private_urgent_request_id', v_private_request_id::text, true);
  perform set_config('passage.test_urgent_workflow_id', v_workflow_id::text, true);
  perform set_config('passage.test_urgent_first_task_id', v_first_task_id::text, true);
  perform set_config('passage.test_urgent_case_key', v_case_key::text, true);
end
$authority_matrix$;

reset role;

create temp table passage_urgent_forbidden_acl_snapshot (
  relation_name text primary key,
  row_count bigint not null,
  row_digest text not null
) on commit drop;

insert into passage_urgent_forbidden_acl_snapshot (
  relation_name, row_count, row_digest
)
select
  'urgent_intake_requests',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.urgent_intake_requests row_value
union all
select
  'urgent_intake_events',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.urgent_intake_events row_value
union all
select
  'workflows',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.workflows row_value
union all
select
  'tasks',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.tasks row_value
union all
select
  'workflow_events',
  count(*),
  coalesce(
    md5(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text)),
    md5('')
  )
from public.workflow_events row_value
union all
select
  'organization_member_locations',
  count(*),
  coalesce(
    md5(string_agg(
      to_jsonb(row_value)::text,
      E'\n' order by
        row_value.organization_member_id::text,
        row_value.organization_location_id::text
    )),
    md5('')
  )
from public.organization_member_locations row_value;

set local role authenticated;

do $authenticated_private_helper_denial$
declare
  v_request_id uuid := current_setting('passage.test_urgent_request_id')::uuid;
  v_case_key uuid := current_setting('passage.test_urgent_case_key')::uuid;
  v_director_user_id uuid := current_setting('passage.test_director_user_id')::uuid;
  v_receipt jsonb;
  v_denied boolean := false;
begin
  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  begin
    select to_jsonb(command_receipt)
    into v_receipt
    from passage_private.create_case_from_urgent_intake_idempotent(
      v_request_id,
      2,
      'c7a00002-7a00-47a0-87a0-000000000002',
      'URGENT-BOUNDARY-1',
      'Example family',
      v_case_key
    ) command_receipt;
  exception
    when sqlstate '42501' then
      v_denied := true;
  end;

  if not v_denied or v_receipt is not null then
    raise exception 'Authenticated direct private case helper must return 42501 with no receipt';
  end if;
end
$authenticated_private_helper_denial$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;

do $anon_public_wrapper_denial$
declare
  v_request_id uuid := current_setting('passage.test_urgent_request_id')::uuid;
  v_case_key uuid := current_setting('passage.test_urgent_case_key')::uuid;
  v_director_user_id uuid := current_setting('passage.test_director_user_id')::uuid;
  v_receipt jsonb;
  v_denied boolean := false;
begin
  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  begin
    select to_jsonb(command_receipt)
    into v_receipt
    from public.create_case_from_urgent_intake_idempotent(
      v_request_id,
      2,
      'c7a00002-7a00-47a0-87a0-000000000002',
      'URGENT-BOUNDARY-1',
      'Example family',
      v_case_key
    ) command_receipt;
  exception
    when sqlstate '42501' then
      v_denied := true;
  end;

  if not v_denied or v_receipt is not null then
    raise exception 'Anon public case wrapper must return 42501 with no receipt';
  end if;
end
$anon_public_wrapper_denial$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role service_role;

do $service_role_public_wrapper_denial$
declare
  v_request_id uuid := current_setting('passage.test_urgent_request_id')::uuid;
  v_case_key uuid := current_setting('passage.test_urgent_case_key')::uuid;
  v_director_user_id uuid := current_setting('passage.test_director_user_id')::uuid;
  v_receipt jsonb;
  v_denied boolean := false;
begin
  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  begin
    select to_jsonb(command_receipt)
    into v_receipt
    from public.create_case_from_urgent_intake_idempotent(
      v_request_id,
      2,
      'c7a00002-7a00-47a0-87a0-000000000002',
      'URGENT-BOUNDARY-1',
      'Example family',
      v_case_key
    ) command_receipt;
  exception
    when sqlstate '42501' then
      v_denied := true;
  end;

  if not v_denied or v_receipt is not null then
    raise exception 'Service-role public case wrapper must return 42501 with no receipt';
  end if;
end
$service_role_public_wrapper_denial$;

reset role;
select set_config('request.jwt.claim.sub', '', true);

do $forbidden_entrypoint_no_mutation$
declare
  v_relation_name text;
  v_count bigint;
  v_digest text;
  v_expected_count bigint;
  v_expected_digest text;
begin
  for v_relation_name in
    select relation_name
    from pg_temp.passage_urgent_forbidden_acl_snapshot
    order by relation_name
  loop
    if v_relation_name = 'organization_member_locations' then
      select
        count(*),
        coalesce(
          md5(string_agg(
            to_jsonb(row_value)::text,
            E'\n' order by
              row_value.organization_member_id::text,
              row_value.organization_location_id::text
          )),
          md5('')
        )
      into v_count, v_digest
      from public.organization_member_locations row_value;
    else
      execute format(
        'select count(*), coalesce(md5(string_agg(to_jsonb(row_value)::text, E''\n'' order by row_value.id::text)), md5('''')) from public.%I row_value',
        v_relation_name
      )
      into v_count, v_digest;
    end if;

    select row_count, row_digest
    into strict v_expected_count, v_expected_digest
    from pg_temp.passage_urgent_forbidden_acl_snapshot
    where relation_name = v_relation_name;

    if v_count is distinct from v_expected_count
       or v_digest is distinct from v_expected_digest then
      raise exception 'Forbidden case entrypoint changed full retained state: %',
        v_relation_name;
    end if;
  end loop;
end
$forbidden_entrypoint_no_mutation$;

drop table pg_temp.passage_urgent_forbidden_acl_snapshot;

do $pre_revoke_full_snapshot$
declare
  v_request_id uuid := current_setting('passage.test_urgent_request_id')::uuid;
  v_private_request_id uuid :=
    current_setting('passage.test_private_urgent_request_id')::uuid;
  v_workflow_id uuid := current_setting('passage.test_urgent_workflow_id')::uuid;
  v_first_task_id uuid :=
    current_setting('passage.test_urgent_first_task_id')::uuid;
  v_fixture_member_ids constant uuid[] := array[
    'a1000031-a100-4100-8100-000000000031'::uuid,
    'a1000032-a100-4100-8100-000000000032'::uuid,
    'a1000033-a100-4100-8100-000000000033'::uuid,
    'a1000034-a100-4100-8100-000000000034'::uuid,
    'a1000035-a100-4100-8100-000000000035'::uuid,
    'a1000036-a100-4100-8100-000000000036'::uuid,
    'a1000037-a100-4100-8100-000000000037'::uuid,
    'a1000038-a100-4100-8100-000000000038'::uuid
  ];
  v_exact_grant_digest text;
begin
  select md5(to_jsonb(grant_row)::text)
  into strict v_exact_grant_digest
  from public.organization_member_locations grant_row
  where grant_row.organization_member_id =
        'c7a00003-7a00-47a0-87a0-000000000003'
    and grant_row.organization_location_id =
        'c7a00002-7a00-47a0-87a0-000000000002'
    and grant_row.revoked_at is null;

  perform set_config(
    'passage.pre_revoke_exact_grant_digest',
    v_exact_grant_digest,
    true
  );
  perform set_config(
    'passage.pre_revoke_exact_grant_stable_digest',
    (
      select md5((to_jsonb(grant_row) - 'revoked_at')::text)
      from public.organization_member_locations grant_row
      where grant_row.organization_member_id =
            'c7a00003-7a00-47a0-87a0-000000000003'
        and grant_row.organization_location_id =
            'c7a00002-7a00-47a0-87a0-000000000002'
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_all_grants_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(grant_row)::text,
          E'\n' order by
            grant_row.organization_member_id::text,
            grant_row.organization_location_id::text
        )),
        md5('')
      )
      from public.organization_member_locations grant_row
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_candidate_requests_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(request_row)::text,
          E'\n' order by request_row.id::text
        )),
        md5('')
      )
      from public.urgent_intake_requests request_row
      where request_row.id in (v_request_id, v_private_request_id)
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_candidate_events_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(event_row)::text,
          E'\n' order by event_row.id::text
        )),
        md5('')
      )
      from public.urgent_intake_events event_row
      where event_row.urgent_intake_request_id in (
        v_request_id, v_private_request_id
      )
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_candidate_workflow_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(workflow_row)::text,
          E'\n' order by workflow_row.id::text
        )),
        md5('')
      )
      from public.workflows workflow_row
      where workflow_row.id = v_workflow_id
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_candidate_task_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(task_row)::text,
          E'\n' order by task_row.id::text
        )),
        md5('')
      )
      from public.tasks task_row
      where task_row.id = v_first_task_id
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_candidate_workflow_events_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(event_row)::text,
          E'\n' order by event_row.id::text
        )),
        md5('')
      )
      from public.workflow_events event_row
      where event_row.workflow_id = v_workflow_id
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_assignment_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          jsonb_build_object(
            'task_id', task_row.id,
            'workflow_id', task_row.workflow_id,
            'assigned_organization_member_id',
              task_row.assigned_organization_member_id,
            'status', task_row.status,
            'version', task_row.version,
            'updated_at', task_row.updated_at
          )::text,
          E'\n' order by task_row.id::text
        )),
        md5('')
      )
      from public.tasks task_row
      where task_row.id = v_first_task_id
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_assignment_event_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(event_row)::text,
          E'\n' order by event_row.id::text
        )),
        md5('')
      )
      from public.workflow_events event_row
      where event_row.workflow_id = v_workflow_id
        and event_row.task_id = v_first_task_id
        and event_row.name = 'task.assigned'
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_unrelated_requests_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(request_row)::text,
          E'\n' order by request_row.id::text
        )),
        md5('')
      )
      from public.urgent_intake_requests request_row
      where request_row.id not in (v_request_id, v_private_request_id)
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_unrelated_events_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(event_row)::text,
          E'\n' order by event_row.id::text
        )),
        md5('')
      )
      from public.urgent_intake_events event_row
      where event_row.urgent_intake_request_id not in (
        v_request_id, v_private_request_id
      )
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_unrelated_workflows_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(workflow_row)::text,
          E'\n' order by workflow_row.id::text
        )),
        md5('')
      )
      from public.workflows workflow_row
      where workflow_row.id <> v_workflow_id
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_unrelated_tasks_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(task_row)::text,
          E'\n' order by task_row.id::text
        )),
        md5('')
      )
      from public.tasks task_row
      where task_row.id <> v_first_task_id
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_unrelated_workflow_events_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(event_row)::text,
          E'\n' order by event_row.id::text
        )),
        md5('')
      )
      from public.workflow_events event_row
      where event_row.workflow_id is distinct from v_workflow_id
    ),
    true
  );
  perform set_config(
    'passage.pre_revoke_unrelated_grants_fingerprint',
    (
      select count(*)::text || ':' || coalesce(
        md5(string_agg(
          to_jsonb(grant_row)::text,
          E'\n' order by
            grant_row.organization_member_id::text,
            grant_row.organization_location_id::text
        )),
        md5('')
      )
      from public.organization_member_locations grant_row
      where grant_row.organization_member_id <> all(v_fixture_member_ids)
        and (
          grant_row.organization_member_id,
          grant_row.organization_location_id
        ) <> (
          'c7a00003-7a00-47a0-87a0-000000000003'::uuid,
          'c7a00002-7a00-47a0-87a0-000000000002'::uuid
        )
    ),
    true
  );
end
$pre_revoke_full_snapshot$;

do $revoke_location_grant$
declare
  v_changed integer;
begin
  if not exists (
    select 1
    from public.organization_members member_row
    where member_row.id = 'c7a00003-7a00-47a0-87a0-000000000003'
      and member_row.organization_id =
          'c7a00001-7a00-47a0-87a0-000000000001'
      and member_row.status = 'active'
      and member_row.revoked_at is null
      and member_row.role in ('owner', 'director')
  ) then
    raise exception 'Northstar director membership must remain active before grant revocation';
  end if;

  update public.organization_member_locations
  set revoked_at = clock_timestamp()
  where organization_member_id = 'c7a00003-7a00-47a0-87a0-000000000003'
    and organization_location_id = 'c7a00002-7a00-47a0-87a0-000000000002'
    and revoked_at is null;
  get diagnostics v_changed = row_count;
  if v_changed <> 1 then
    raise exception 'Expected to revoke exactly one Northstar director location grant';
  end if;

  if not exists (
    select 1
    from public.organization_members member_row
    where member_row.id = 'c7a00003-7a00-47a0-87a0-000000000003'
      and member_row.organization_id =
          'c7a00001-7a00-47a0-87a0-000000000001'
      and member_row.status = 'active'
      and member_row.revoked_at is null
      and member_row.role in ('owner', 'director')
  ) then
    raise exception 'Grant revocation must not revoke the director membership';
  end if;
end
$revoke_location_grant$;

set local role authenticated;

do $revoked_location_replay$
declare
  v_request_id uuid := current_setting('passage.test_urgent_request_id')::uuid;
  v_workflow_id uuid := current_setting('passage.test_urgent_workflow_id')::uuid;
  v_case_key uuid := current_setting('passage.test_urgent_case_key')::uuid;
  v_director_user_id uuid := current_setting('passage.test_director_user_id')::uuid;
  v_receipt jsonb;
  v_denied boolean := false;
begin
  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  begin
    select to_jsonb(command_receipt)
    into v_receipt
    from public.create_case_from_urgent_intake_idempotent(
      v_request_id,
      2,
      'c7a00002-7a00-47a0-87a0-000000000002',
      'URGENT-BOUNDARY-1',
      'Example family',
      v_case_key
    ) command_receipt;
  exception
    when sqlstate '42501' then
      v_denied := true;
  end;

  if not v_denied or v_receipt is not null then
    raise exception 'Revoked-location public case replay must return 42501 with no receipt';
  end if;

  if not exists (
    select 1 from public.urgent_intake_requests
    where id = v_request_id
      and status = 'case_created'
      and version = 3
      and workflow_id = v_workflow_id
  ) or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 3 then
    raise exception 'Revoked-location replay denial changed request/event cardinality';
  end if;
end
$revoked_location_replay$;

reset role;

do $post_revoke_full_digest$
declare
  v_request_id uuid := current_setting('passage.test_urgent_request_id')::uuid;
  v_private_request_id uuid :=
    current_setting('passage.test_private_urgent_request_id')::uuid;
  v_workflow_id uuid := current_setting('passage.test_urgent_workflow_id')::uuid;
  v_first_task_id uuid :=
    current_setting('passage.test_urgent_first_task_id')::uuid;
  v_fixture_member_ids constant uuid[] := array[
    'a1000031-a100-4100-8100-000000000031'::uuid,
    'a1000032-a100-4100-8100-000000000032'::uuid,
    'a1000033-a100-4100-8100-000000000033'::uuid,
    'a1000034-a100-4100-8100-000000000034'::uuid,
    'a1000035-a100-4100-8100-000000000035'::uuid,
    'a1000036-a100-4100-8100-000000000036'::uuid,
    'a1000037-a100-4100-8100-000000000037'::uuid,
    'a1000038-a100-4100-8100-000000000038'::uuid
  ];
  v_actual text;
  v_exact_grant_digest text;
begin
  select md5(to_jsonb(grant_row)::text)
  into strict v_exact_grant_digest
  from public.organization_member_locations grant_row
  where grant_row.organization_member_id =
        'c7a00003-7a00-47a0-87a0-000000000003'
    and grant_row.organization_location_id =
        'c7a00002-7a00-47a0-87a0-000000000002'
    and grant_row.revoked_at is not null;
  if v_exact_grant_digest is not distinct from
       current_setting('passage.pre_revoke_exact_grant_digest')
     or (
       select md5((to_jsonb(grant_row) - 'revoked_at')::text)
       from public.organization_member_locations grant_row
       where grant_row.organization_member_id =
             'c7a00003-7a00-47a0-87a0-000000000003'
         and grant_row.organization_location_id =
             'c7a00002-7a00-47a0-87a0-000000000002'
     ) is distinct from current_setting(
       'passage.pre_revoke_exact_grant_stable_digest'
     ) then
    raise exception 'Revocation changed more or less than the exact grant timestamp';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(grant_row)::text,
      E'\n' order by
        grant_row.organization_member_id::text,
        grant_row.organization_location_id::text
    )),
    md5('')
  )
  into v_actual
  from public.organization_member_locations grant_row;
  if split_part(v_actual, ':', 1) is distinct from split_part(
       current_setting('passage.pre_revoke_all_grants_fingerprint'),
       ':',
       1
     )
     or v_actual is not distinct from current_setting(
       'passage.pre_revoke_all_grants_fingerprint'
     ) then
    raise exception 'Grant revocation did not preserve count with one full-row change';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(request_row)::text,
      E'\n' order by request_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.urgent_intake_requests request_row
  where request_row.id in (v_request_id, v_private_request_id);
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_candidate_requests_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed candidate urgent requests';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.urgent_intake_events event_row
  where event_row.urgent_intake_request_id in (
    v_request_id, v_private_request_id
  );
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_candidate_events_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed candidate urgent events';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(workflow_row)::text,
      E'\n' order by workflow_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.workflows workflow_row
  where workflow_row.id = v_workflow_id;
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_candidate_workflow_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed the candidate workflow';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(task_row)::text,
      E'\n' order by task_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.tasks task_row
  where task_row.id = v_first_task_id;
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_candidate_task_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed the candidate task';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.workflow_events event_row
  where event_row.workflow_id = v_workflow_id;
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_candidate_workflow_events_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed candidate workflow events';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      jsonb_build_object(
        'task_id', task_row.id,
        'workflow_id', task_row.workflow_id,
        'assigned_organization_member_id',
          task_row.assigned_organization_member_id,
        'status', task_row.status,
        'version', task_row.version,
        'updated_at', task_row.updated_at
      )::text,
      E'\n' order by task_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.tasks task_row
  where task_row.id = v_first_task_id;
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_assignment_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed assignment state';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.workflow_events event_row
  where event_row.workflow_id = v_workflow_id
    and event_row.task_id = v_first_task_id
    and event_row.name = 'task.assigned';
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_assignment_event_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed assignment-event state';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(request_row)::text,
      E'\n' order by request_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.urgent_intake_requests request_row
  where request_row.id not in (v_request_id, v_private_request_id);
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_unrelated_requests_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed retained urgent requests';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.urgent_intake_events event_row
  where event_row.urgent_intake_request_id not in (
    v_request_id, v_private_request_id
  );
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_unrelated_events_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed retained urgent events';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(workflow_row)::text,
      E'\n' order by workflow_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.workflows workflow_row
  where workflow_row.id <> v_workflow_id;
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_unrelated_workflows_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed retained workflows';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(task_row)::text,
      E'\n' order by task_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.tasks task_row
  where task_row.id <> v_first_task_id;
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_unrelated_tasks_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed retained tasks';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(event_row)::text,
      E'\n' order by event_row.id::text
    )),
    md5('')
  )
  into v_actual
  from public.workflow_events event_row
  where event_row.workflow_id is distinct from v_workflow_id;
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_unrelated_workflow_events_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed retained workflow events';
  end if;

  select count(*)::text || ':' || coalesce(
    md5(string_agg(
      to_jsonb(grant_row)::text,
      E'\n' order by
        grant_row.organization_member_id::text,
        grant_row.organization_location_id::text
    )),
    md5('')
  )
  into v_actual
  from public.organization_member_locations grant_row
  where grant_row.organization_member_id <> all(v_fixture_member_ids)
    and (
      grant_row.organization_member_id,
      grant_row.organization_location_id
    ) <> (
      'c7a00003-7a00-47a0-87a0-000000000003'::uuid,
      'c7a00002-7a00-47a0-87a0-000000000002'::uuid
    );
  if v_actual is distinct from current_setting(
    'passage.pre_revoke_unrelated_grants_fingerprint'
  ) then
    raise exception 'Revoked-location denial changed unrelated retained grants';
  end if;
end
$post_revoke_full_digest$;

do $postgres_final_cardinality$
declare
  v_request_id uuid := current_setting('passage.test_urgent_request_id')::uuid;
  v_private_request_id uuid := current_setting('passage.test_private_urgent_request_id')::uuid;
  v_workflow_id uuid := current_setting('passage.test_urgent_workflow_id')::uuid;
  v_first_task_id uuid := current_setting('passage.test_urgent_first_task_id')::uuid;
  v_baseline_count bigint;
  v_baseline_digest text;
  v_unrelated_count bigint;
  v_unrelated_digest text;
begin
  if (select count(*) from public.urgent_intake_requests where id in (v_request_id, v_private_request_id)) <> 2
     or (select count(*) from public.workflows where id = v_workflow_id) <> 1
     or (select count(*) from public.tasks where id = v_first_task_id and workflow_id = v_workflow_id) <> 1
     or (select count(*) from public.workflow_events where task_id = v_first_task_id and name = 'task.created') <> 1
     or (select count(*) from public.workflow_events where task_id = v_first_task_id and name = 'task.assigned') <> 1
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 3
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_private_request_id) <> 1 then
    raise exception 'Postgres final request/workflow/task/event cardinality changed';
  end if;

  select row_count, row_digest
  into strict v_baseline_count, v_baseline_digest
  from pg_temp.passage_urgent_matrix_baseline
  where relation_name = 'urgent_intake_requests';
  select
    count(*),
    coalesce(
      md5(string_agg(
        to_jsonb(row_value)::text,
        E'\n' order by row_value.id::text
      )),
      md5('')
    )
  into v_unrelated_count, v_unrelated_digest
  from public.urgent_intake_requests row_value
  where row_value.id not in (v_request_id, v_private_request_id);
  if (select count(*) from public.urgent_intake_requests)
       is distinct from v_baseline_count + 2
     or v_unrelated_count is distinct from v_baseline_count
     or v_unrelated_digest is distinct from v_baseline_digest then
    raise exception 'Urgent request fixture delta or retained digest changed';
  end if;

  select row_count, row_digest
  into strict v_baseline_count, v_baseline_digest
  from pg_temp.passage_urgent_matrix_baseline
  where relation_name = 'urgent_intake_events';
  select
    count(*),
    coalesce(
      md5(string_agg(
        to_jsonb(row_value)::text,
        E'\n' order by row_value.id::text
      )),
      md5('')
    )
  into v_unrelated_count, v_unrelated_digest
  from public.urgent_intake_events row_value
  where row_value.urgent_intake_request_id not in (
    v_request_id, v_private_request_id
  );
  if (select count(*) from public.urgent_intake_events)
       is distinct from v_baseline_count + 4
     or v_unrelated_count is distinct from v_baseline_count
     or v_unrelated_digest is distinct from v_baseline_digest then
    raise exception 'Urgent event fixture delta or retained digest changed';
  end if;

  select row_count, row_digest
  into strict v_baseline_count, v_baseline_digest
  from pg_temp.passage_urgent_matrix_baseline
  where relation_name = 'workflows';
  select
    count(*),
    coalesce(
      md5(string_agg(
        to_jsonb(row_value)::text,
        E'\n' order by row_value.id::text
      )),
      md5('')
    )
  into v_unrelated_count, v_unrelated_digest
  from public.workflows row_value
  where row_value.id <> v_workflow_id;
  if (select count(*) from public.workflows)
       is distinct from v_baseline_count + 1
     or v_unrelated_count is distinct from v_baseline_count
     or v_unrelated_digest is distinct from v_baseline_digest then
    raise exception 'Workflow fixture delta or retained digest changed';
  end if;

  select row_count, row_digest
  into strict v_baseline_count, v_baseline_digest
  from pg_temp.passage_urgent_matrix_baseline
  where relation_name = 'tasks';
  select
    count(*),
    coalesce(
      md5(string_agg(
        to_jsonb(row_value)::text,
        E'\n' order by row_value.id::text
      )),
      md5('')
    )
  into v_unrelated_count, v_unrelated_digest
  from public.tasks row_value
  where row_value.id <> v_first_task_id;
  if (select count(*) from public.tasks)
       is distinct from v_baseline_count + 1
     or v_unrelated_count is distinct from v_baseline_count
     or v_unrelated_digest is distinct from v_baseline_digest then
    raise exception 'Task fixture delta or retained digest changed';
  end if;

  select row_count, row_digest
  into strict v_baseline_count, v_baseline_digest
  from pg_temp.passage_urgent_matrix_baseline
  where relation_name = 'workflow_events';
  select
    count(*),
    coalesce(
      md5(string_agg(
        to_jsonb(row_value)::text,
        E'\n' order by row_value.id::text
      )),
      md5('')
    )
  into v_unrelated_count, v_unrelated_digest
  from public.workflow_events row_value
  where row_value.workflow_id is distinct from v_workflow_id;
  if (select count(*) from public.workflow_events)
       is distinct from v_baseline_count + 2
     or v_unrelated_count is distinct from v_baseline_count
     or v_unrelated_digest is distinct from v_baseline_digest then
    raise exception 'Workflow-event fixture delta or retained digest changed';
  end if;

  select row_count
  into strict v_baseline_count
  from pg_temp.passage_urgent_matrix_baseline
  where relation_name = 'organization_member_locations';
  if (select count(*) from public.organization_member_locations)
       is distinct from v_baseline_count + 7
     or (
       select count(*)
       from public.organization_member_locations grant_row
       where grant_row.organization_member_id = any(array[
         'a1000031-a100-4100-8100-000000000031'::uuid,
         'a1000032-a100-4100-8100-000000000032'::uuid,
         'a1000033-a100-4100-8100-000000000033'::uuid,
         'a1000034-a100-4100-8100-000000000034'::uuid,
         'a1000035-a100-4100-8100-000000000035'::uuid,
         'a1000036-a100-4100-8100-000000000036'::uuid,
         'a1000037-a100-4100-8100-000000000037'::uuid,
         'a1000038-a100-4100-8100-000000000038'::uuid
       ])
     ) <> 7
     or not exists (
       select 1
       from public.organization_member_locations grant_row
       where grant_row.organization_member_id =
             'c7a00003-7a00-47a0-87a0-000000000003'
         and grant_row.organization_location_id =
             'c7a00002-7a00-47a0-87a0-000000000002'
         and grant_row.revoked_at is not null
     ) then
    raise exception 'Grant fixture delta or exact revocation state changed';
  end if;
end
$postgres_final_cardinality$;

rollback;

do $post_rollback_equality$
declare
  v_relation_name text;
  v_count bigint;
  v_digest text;
  v_expected_count bigint;
  v_expected_digest text;
begin
  for v_relation_name in
    select relation_name
    from pg_temp.passage_urgent_matrix_baseline
    order by relation_name
  loop
    if v_relation_name = 'organization_member_locations' then
      select
        count(*),
        coalesce(
          md5(string_agg(
            to_jsonb(row_value)::text,
            E'\n' order by
              row_value.organization_member_id::text,
              row_value.organization_location_id::text
          )),
          md5('')
        )
      into v_count, v_digest
      from public.organization_member_locations row_value;
    else
      execute format(
        'select count(*), coalesce(md5(string_agg(to_jsonb(row_value)::text, E''\n'' order by row_value.id::text)), md5('''')) from public.%I row_value',
        v_relation_name
      )
      into v_count, v_digest;
    end if;

    select row_count, row_digest
    into strict v_expected_count, v_expected_digest
    from pg_temp.passage_urgent_matrix_baseline
    where relation_name = v_relation_name;

    if v_count is distinct from v_expected_count
       or v_digest is distinct from v_expected_digest then
      raise exception 'Rollback did not restore exact retained shared-lab state: %',
        v_relation_name;
    end if;
  end loop;
end
$post_rollback_equality$;

drop table pg_temp.passage_urgent_matrix_baseline;
