-- Rollback-only authority matrix for the urgent family receiving-organization
-- boundary. Run only against the isolated Passage Zero project after applying
-- the urgent_family_thin_slice migration:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';
begin;

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
     or to_regprocedure('public.submit_urgent_intake_idempotent(uuid,text,text,text,text,text,text,text,text,boolean,uuid)') is null
     or to_regprocedure('public.claim_urgent_intake_idempotent(uuid,integer,uuid)') is null
     or to_regprocedure('public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)') is null then
    raise exception 'Urgent family migration is missing or incomplete';
  end if;
end
$preflight$;

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
      'passage_private.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)'::regprocedure
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
  ('a1000015-a100-4100-8100-000000000015', 'revoked-director@urgent-boundary.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Revoked Director"}', now(), now());

insert into public.organizations (id, name)
values ('a1000021-a100-4100-8100-000000000021', 'Wrong Organization');

insert into public.organization_locations (id, organization_id, name, status)
values (
  'a1000022-a100-4100-8100-000000000022',
  'a1000021-a100-4100-8100-000000000021',
  'Wrong Location',
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
  if (select count(*) from public.urgent_intake_requests) <> 0
     or (select count(*) from public.urgent_intake_events) <> 0
     or exists (
    select 1 from public.urgent_intake_requests
    where creation_request_id = v_wrong_receiver_key
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

do $revoke_location_grant$
declare
  v_changed integer;
begin
  update public.organization_member_locations
  set revoked_at = clock_timestamp()
  where organization_member_id = 'c7a00003-7a00-47a0-87a0-000000000003'
    and organization_location_id = 'c7a00002-7a00-47a0-87a0-000000000002'
    and revoked_at is null;
  get diagnostics v_changed = row_count;
  if v_changed <> 1 then
    raise exception 'Expected to revoke exactly one Northstar director location grant';
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
begin
  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  begin
    perform public.create_case_from_urgent_intake_idempotent(
      v_request_id, 2, 'c7a00002-7a00-47a0-87a0-000000000002',
      'URGENT-BOUNDARY-1', 'Example family', v_case_key
    );
    raise exception 'Expected revoked-location case replay denial';
  exception
    when sqlstate '42501' then null;
  end;

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

do $postgres_final_cardinality$
declare
  v_request_id uuid := current_setting('passage.test_urgent_request_id')::uuid;
  v_private_request_id uuid := current_setting('passage.test_private_urgent_request_id')::uuid;
  v_workflow_id uuid := current_setting('passage.test_urgent_workflow_id')::uuid;
  v_first_task_id uuid := current_setting('passage.test_urgent_first_task_id')::uuid;
begin
  if (select count(*) from public.urgent_intake_requests where id in (v_request_id, v_private_request_id)) <> 2
     or (select count(*) from public.workflows where id = v_workflow_id) <> 1
     or (select count(*) from public.tasks where id = v_first_task_id and workflow_id = v_workflow_id) <> 1
     or (select count(*) from public.workflow_events where task_id = v_first_task_id and name = 'task.created') <> 1
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_request_id) <> 3
     or (select count(*) from public.urgent_intake_events where urgent_intake_request_id = v_private_request_id) <> 1 then
    raise exception 'Postgres final request/workflow/task/event cardinality changed';
  end if;
end
$postgres_final_cardinality$;

rollback;
