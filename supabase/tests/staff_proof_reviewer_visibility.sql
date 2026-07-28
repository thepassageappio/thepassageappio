-- Rollback-only RLS regression for the staff-facing proof-reviewer name.
--
-- Run only as postgres against isolated project uyacxqtsiwlvtmhxvoxr after
-- applying staff_proof_reviewer_visibility and its forward ACL hardening:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--
-- Every fixture and mutation below is transaction-contained. Production is
-- refused explicitly and the final ROLLBACK is the only cleanup boundary.
begin;

do $reviewer_visibility_preflight$
declare
  v_policy_expression text;
  v_search_path text;
begin
  if current_setting('passage.test_project_ref', true) is distinct from
       'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) =
       'qsveqfchwylsbncsfgxe'
     or session_user <> 'postgres'
     or current_user <> 'postgres' then
    raise exception 'Reviewer visibility tests refused: exact isolated postgres context required'
      using errcode = '42501';
  end if;

  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'staff_proof_reviewer_visibility'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'staff_proof_reviewer_visibility_acl_hardening'
     )
     or to_regprocedure(
       'passage_private.can_view_proof_reviewer(uuid)'
     ) is null then
    raise exception 'Reviewer visibility tests refused: reviewed migration markers or helper are missing'
      using errcode = '55000';
  end if;

  select array_to_string(p.proconfig, ',')
    into v_search_path
  from pg_catalog.pg_proc as p
  where p.oid =
    'passage_private.can_view_proof_reviewer(uuid)'::regprocedure
    and p.prosecdef;

  select pg_catalog.pg_get_expr(policy.polqual, policy.polrelid)
    into v_policy_expression
  from pg_catalog.pg_policy as policy
  where policy.polrelid = 'public.organization_members'::regclass
    and policy.polname = 'cycle_7b_members_authorized_select';

  if v_search_path is null
     or v_search_path not like 'search_path=%'
     or v_policy_expression is null
     or position(
       'can_view_proof_reviewer' in lower(v_policy_expression)
     ) = 0
     or not has_function_privilege(
       'authenticated',
       'passage_private.can_view_proof_reviewer(uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'passage_private.can_view_proof_reviewer(uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'service_role',
       'passage_private.can_view_proof_reviewer(uuid)',
       'EXECUTE'
     ) then
    raise exception 'Reviewer helper function ACL/search_path posture drifted';
  end if;

  if not exists (
       select 1 from public.organizations
       where id = 'c7a00001-7a00-47a0-87a0-000000000001'
     )
     or not exists (
       select 1 from public.organization_locations
       where id = 'c7a00002-7a00-47a0-87a0-000000000002'
         and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
     )
     or not exists (
       select 1 from public.organization_members
       where id = 'c7a00003-7a00-47a0-87a0-000000000003'
         and role in ('owner', 'director')
         and status = 'active'
     )
     or not exists (
       select 1 from public.organization_members
       where id = 'c7b00004-7b00-47b0-87b0-000000000004'
         and role = 'staff'
         and status = 'active'
     )
     or (select count(*) from public.tasks
         where id in (
           'c7b20001-7b00-47b0-87b0-000000000001',
           'c7b20002-7b00-47b0-87b0-000000000002'
         )) <> 2 then
    raise exception 'Reviewer visibility tests refused: retained isolated fixture drifted'
      using errcode = '42501';
  end if;
end
$reviewer_visibility_preflight$;

-- Remove only transaction-local proof history from the two retained tasks.
select set_config('passage.fixture_reset', 'cycle_8_isolated_lab', true);
select set_config('passage.fixture_project_ref', 'uyacxqtsiwlvtmhxvoxr', true);

delete from public.task_proof_reviews
where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
  and task_id in (
    'c7b20001-7b00-47b0-87b0-000000000001',
    'c7b20002-7b00-47b0-87b0-000000000002'
  );

delete from public.task_proofs
where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
  and task_id in (
    'c7b20001-7b00-47b0-87b0-000000000001',
    'c7b20002-7b00-47b0-87b0-000000000002'
  );

delete from public.workflow_events
where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
  and task_id in (
    'c7b20001-7b00-47b0-87b0-000000000001',
    'c7b20002-7b00-47b0-87b0-000000000002'
  )
  and name in (
    'task.proof_submitted',
    'task.proof_verified',
    'task.proof_replacement_requested'
  );

reset passage.fixture_reset;
reset passage.fixture_project_ref;

insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  (
    'ca110001-ca11-4a11-8a11-000000000001',
    'assigned-staff@reviewer.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Assigned Staff"}', now(), now()
  ),
  (
    'ca110002-ca11-4a11-8a11-000000000002',
    'second-staff@reviewer.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Second Staff"}', now(), now()
  ),
  (
    'ca110003-ca11-4a11-8a11-000000000003',
    'unassigned-staff@reviewer.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Unassigned Staff"}', now(), now()
  ),
  (
    'ca110004-ca11-4a11-8a11-000000000004',
    'second-director@reviewer.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Second Director"}', now(), now()
  ),
  (
    'ca110005-ca11-4a11-8a11-000000000005',
    'other-org-staff@reviewer.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Other Organization Staff"}', now(), now()
  ),
  (
    'ca110006-ca11-4a11-8a11-000000000006',
    'wrong-location-staff@reviewer.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Wrong Location Staff"}', now(), now()
  ),
  (
    'ca110007-ca11-4a11-8a11-000000000007',
    'third-director@reviewer.test', now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Third Director"}', now(), now()
  );

update public.organization_members
set user_id = 'ca110001-ca11-4a11-8a11-000000000001',
    status = 'active',
    revoked_at = null,
    revoked_by_user_id = null,
    revocation_reason = null,
    updated_at = clock_timestamp()
where id = 'c7b00004-7b00-47b0-87b0-000000000004';

insert into public.organizations (id, name)
values (
  'ca110010-ca11-4a11-8a11-000000000010',
  'Reviewer visibility other organization'
);

insert into public.organization_locations (
  id, organization_id, name, status
) values (
  'ca110011-ca11-4a11-8a11-000000000011',
  'ca110010-ca11-4a11-8a11-000000000010',
  'Other organization location',
  'active'
);

insert into public.organization_locations (
  id, organization_id, name, status
) values (
  'ca110012-ca11-4a11-8a11-000000000012',
  'c7a00001-7a00-47a0-87a0-000000000001',
  'Wrong reviewer-test location',
  'active'
);

insert into public.organization_members (
  id, organization_id, user_id, email, role, status, display_name, accepted_at
) values
  (
    'ca110021-ca11-4a11-8a11-000000000021',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'ca110002-ca11-4a11-8a11-000000000002',
    'second-staff@reviewer.test',
    'staff', 'active', 'Second Staff', now()
  ),
  (
    'ca110022-ca11-4a11-8a11-000000000022',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'ca110003-ca11-4a11-8a11-000000000003',
    'unassigned-staff@reviewer.test',
    'staff', 'active', 'Unassigned Staff', now()
  ),
  (
    'ca110023-ca11-4a11-8a11-000000000023',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'ca110004-ca11-4a11-8a11-000000000004',
    'second-director@reviewer.test',
    'director', 'active', 'Second Director', now()
  ),
  (
    'ca110024-ca11-4a11-8a11-000000000024',
    'ca110010-ca11-4a11-8a11-000000000010',
    'ca110005-ca11-4a11-8a11-000000000005',
    'other-org-staff@reviewer.test',
    'staff', 'active', 'Other Organization Staff', now()
  ),
  (
    'ca110025-ca11-4a11-8a11-000000000025',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'ca110006-ca11-4a11-8a11-000000000006',
    'wrong-location-staff@reviewer.test',
    'staff', 'active', 'Wrong Location Staff', now()
  ),
  (
    'ca110026-ca11-4a11-8a11-000000000026',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'ca110007-ca11-4a11-8a11-000000000007',
    'third-director@reviewer.test',
    'director', 'active', 'Third Director', now()
  );

insert into public.organization_member_locations (
  organization_member_id, organization_location_id, granted_by_user_id
) values
  (
    'ca110021-ca11-4a11-8a11-000000000021',
    'c7a00002-7a00-47a0-87a0-000000000002',
    (select user_id from public.organization_members
     where id = 'c7a00003-7a00-47a0-87a0-000000000003')
  ),
  (
    'ca110022-ca11-4a11-8a11-000000000022',
    'c7a00002-7a00-47a0-87a0-000000000002',
    (select user_id from public.organization_members
     where id = 'c7a00003-7a00-47a0-87a0-000000000003')
  ),
  (
    'ca110023-ca11-4a11-8a11-000000000023',
    'c7a00002-7a00-47a0-87a0-000000000002',
    (select user_id from public.organization_members
     where id = 'c7a00003-7a00-47a0-87a0-000000000003')
  ),
  (
    'ca110024-ca11-4a11-8a11-000000000024',
    'ca110011-ca11-4a11-8a11-000000000011',
    'ca110005-ca11-4a11-8a11-000000000005'
  ),
  (
    'ca110025-ca11-4a11-8a11-000000000025',
    'ca110012-ca11-4a11-8a11-000000000012',
    (select user_id from public.organization_members
     where id = 'c7a00003-7a00-47a0-87a0-000000000003')
  ),
  (
    'ca110026-ca11-4a11-8a11-000000000026',
    'c7a00002-7a00-47a0-87a0-000000000002',
    (select user_id from public.organization_members
     where id = 'c7a00003-7a00-47a0-87a0-000000000003')
  );

update public.tasks
set assigned_organization_member_id =
      'c7b00004-7b00-47b0-87b0-000000000004',
    status = 'in_progress',
    version = 701,
    updated_at = clock_timestamp()
where id = 'c7b20001-7b00-47b0-87b0-000000000001';

update public.tasks
set assigned_organization_member_id =
      'ca110021-ca11-4a11-8a11-000000000021',
    status = 'in_progress',
    version = 801,
    updated_at = clock_timestamp()
where id = 'c7b20002-7b00-47b0-87b0-000000000002';

-- Bind the primary proof to a transaction-local test-only director rather
-- than a retained isolated-project director. Retained tasks may legitimately
-- expose retained reviewers and must not satisfy this test's denial cases.
select set_config(
  'passage.test_reviewer_director_user_id',
  'ca110004-ca11-4a11-8a11-000000000004',
  true
);

set local role authenticated;

do $create_reviewed_proofs$
declare
  v_primary_proof record;
  v_second_proof record;
  v_director_user_id uuid :=
    current_setting('passage.test_reviewer_director_user_id')::uuid;
begin
  perform set_config(
    'request.jwt.claim.sub',
    'ca110001-ca11-4a11-8a11-000000000001',
    true
  );
  select * into strict v_primary_proof
  from public.submit_task_proof_idempotent(
    'c7b20001-7b00-47b0-87b0-000000000001',
    701,
    'confirmation',
    'Primary task proof for reviewer projection.',
    'reviewer-primary-701',
    null,
    'ca110101-ca11-4a11-8a11-000000000101'
  );

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  perform *
  from public.review_task_proof_idempotent(
    v_primary_proof.proof_id,
    702,
    'verified',
    null,
    'ca110102-ca11-4a11-8a11-000000000102'
  );

  perform set_config(
    'request.jwt.claim.sub',
    'ca110002-ca11-4a11-8a11-000000000002',
    true
  );
  select * into strict v_second_proof
  from public.submit_task_proof_idempotent(
    'c7b20002-7b00-47b0-87b0-000000000002',
    801,
    'confirmation',
    'Second task proof for wrong-task denial.',
    'reviewer-second-801',
    null,
    'ca110103-ca11-4a11-8a11-000000000103'
  );

  perform set_config(
    'request.jwt.claim.sub',
    'ca110007-ca11-4a11-8a11-000000000007',
    true
  );
  perform *
  from public.review_task_proof_idempotent(
    v_second_proof.proof_id,
    802,
    'verified',
    null,
    'ca110104-ca11-4a11-8a11-000000000104'
  );
end
$create_reviewed_proofs$;

do $active_and_negative_projection_tests$
declare
  v_primary_reviewer_id uuid :=
    current_setting('passage.test_reviewer_director_user_id')::uuid;
begin
  perform set_config(
    'request.jwt.claim.sub',
    'ca110001-ca11-4a11-8a11-000000000001',
    true
  );
  if (select count(*) from public.organization_members
      where id = 'ca110023-ca11-4a11-8a11-000000000023'
        and user_id = v_primary_reviewer_id
        and nullif(btrim(display_name), '') is not null) <> 1 then
    raise exception 'Active assigned staff could not resolve the exact proof reviewer';
  end if;
  if (select count(*) from public.organization_members
      where id = 'ca110026-ca11-4a11-8a11-000000000026') <> 0 then
    raise exception 'Wrong-task reviewer identity leaked to assigned staff';
  end if;

  perform set_config(
    'request.jwt.claim.sub',
    'ca110003-ca11-4a11-8a11-000000000003',
    true
  );
  if (select count(*) from public.organization_members
      where id in (
        'ca110023-ca11-4a11-8a11-000000000023',
        'ca110026-ca11-4a11-8a11-000000000026'
      )) <> 0 then
    raise exception 'Unassigned staff retained proof-reviewer visibility';
  end if;

  perform set_config(
    'request.jwt.claim.sub',
    'ca110005-ca11-4a11-8a11-000000000005',
    true
  );
  if (select count(*) from public.organization_members
      where id in (
        'ca110023-ca11-4a11-8a11-000000000023',
        'ca110026-ca11-4a11-8a11-000000000026'
      )) <> 0 then
    raise exception 'Wrong-organization staff gained proof-reviewer visibility';
  end if;
end
$active_and_negative_projection_tests$;

reset role;

do $wrong_location_assignment_denial$
declare
  v_assignment uuid;
  v_version integer;
  v_updated_at timestamp with time zone;
  v_task_count bigint;
  v_proof_count bigint;
  v_review_count bigint;
begin
  select assigned_organization_member_id, version, updated_at
    into strict v_assignment, v_version, v_updated_at
  from public.tasks
  where id = 'c7b20001-7b00-47b0-87b0-000000000001';

  select count(*) into v_task_count
  from public.tasks
  where id = 'c7b20001-7b00-47b0-87b0-000000000001';

  select count(*) into v_proof_count
  from public.task_proofs
  where task_id = 'c7b20001-7b00-47b0-87b0-000000000001';

  select count(*) into v_review_count
  from public.task_proof_reviews
  where task_id = 'c7b20001-7b00-47b0-87b0-000000000001';

  begin
    update public.tasks
    set assigned_organization_member_id =
          'ca110025-ca11-4a11-8a11-000000000025',
        updated_at = clock_timestamp()
    where id = 'c7b20001-7b00-47b0-87b0-000000000001';
    raise exception 'Expected wrong-location task assignment denial'
      using errcode = 'ZX001';
  exception
    when others then
      if sqlstate <> 'P0001'
         or sqlerrm <> 'Assigned member must have relational access to the workflow location' then
        raise;
      end if;
  end;

  if not exists (
       select 1
       from public.tasks
       where id = 'c7b20001-7b00-47b0-87b0-000000000001'
         and assigned_organization_member_id is not distinct from v_assignment
         and version = v_version
         and updated_at = v_updated_at
     )
     or (select count(*) from public.tasks
         where id = 'c7b20001-7b00-47b0-87b0-000000000001') <> v_task_count
     or (select count(*) from public.task_proofs
         where task_id = 'c7b20001-7b00-47b0-87b0-000000000001') <> v_proof_count
     or (select count(*) from public.task_proof_reviews
         where task_id = 'c7b20001-7b00-47b0-87b0-000000000001') <> v_review_count then
    raise exception 'Wrong-location assignment denial changed task assignment or cardinality';
  end if;
end
$wrong_location_assignment_denial$;

set local role authenticated;
do $wrong_location_projection_test$
begin
  perform set_config(
    'request.jwt.claim.sub',
    'ca110006-ca11-4a11-8a11-000000000006',
    true
  );
  if (select count(*) from public.organization_members
      where id = 'ca110023-ca11-4a11-8a11-000000000023') <> 0 then
    raise exception 'Wrong-location staff retained proof-reviewer visibility';
  end if;
end
$wrong_location_projection_test$;
reset role;

update public.organization_member_locations
set revoked_at = clock_timestamp()
where organization_member_id =
        'c7b00004-7b00-47b0-87b0-000000000004'
  and organization_location_id =
        'c7a00002-7a00-47a0-87a0-000000000002';

set local role authenticated;
do $revoked_location_projection_test$
begin
  perform set_config(
    'request.jwt.claim.sub',
    'ca110001-ca11-4a11-8a11-000000000001',
    true
  );
  if (select count(*) from public.organization_members
      where id = 'ca110023-ca11-4a11-8a11-000000000023') <> 0 then
    raise exception 'Revoked location grant retained proof-reviewer visibility';
  end if;
end
$revoked_location_projection_test$;
reset role;

update public.organization_member_locations
set revoked_at = null
where organization_member_id =
        'c7b00004-7b00-47b0-87b0-000000000004'
  and organization_location_id =
        'c7a00002-7a00-47a0-87a0-000000000002';

update public.tasks
set assigned_organization_member_id =
      'ca110022-ca11-4a11-8a11-000000000022',
    updated_at = clock_timestamp()
where id = 'c7b20001-7b00-47b0-87b0-000000000001';

set local role authenticated;
do $former_projection_test$
begin
  perform set_config(
    'request.jwt.claim.sub',
    'ca110001-ca11-4a11-8a11-000000000001',
    true
  );
  if (select count(*) from public.organization_members
      where id = 'ca110023-ca11-4a11-8a11-000000000023') <> 0 then
    raise exception 'Former assignee retained proof-reviewer visibility';
  end if;
end
$former_projection_test$;
reset role;

update public.tasks
set assigned_organization_member_id =
      'c7b00004-7b00-47b0-87b0-000000000004',
    updated_at = clock_timestamp()
where id = 'c7b20001-7b00-47b0-87b0-000000000001';

update public.organization_members
set status = 'revoked',
    revoked_at = clock_timestamp(),
    revoked_by_user_id = (
      select user_id
      from public.organization_members
      where id = 'c7a00003-7a00-47a0-87a0-000000000003'
    ),
    revocation_reason = 'Rollback-only reviewer projection denial',
    updated_at = clock_timestamp()
where id = 'c7b00004-7b00-47b0-87b0-000000000004';

set local role authenticated;
do $revoked_projection_test$
begin
  perform set_config(
    'request.jwt.claim.sub',
    'ca110001-ca11-4a11-8a11-000000000001',
    true
  );
  if (select count(*) from public.organization_members
      where id = 'ca110023-ca11-4a11-8a11-000000000023') <> 0 then
    raise exception 'Revoked staff retained proof-reviewer visibility';
  end if;
end
$revoked_projection_test$;
reset role;

do $reviewer_visibility_final$
begin
  if (select count(*) from public.task_proofs
      where task_id in (
        'c7b20001-7b00-47b0-87b0-000000000001',
        'c7b20002-7b00-47b0-87b0-000000000002'
      )) <> 2
     or (select count(*) from public.task_proof_reviews
         where task_id in (
           'c7b20001-7b00-47b0-87b0-000000000001',
           'c7b20002-7b00-47b0-87b0-000000000002'
         )) <> 2 then
    raise exception 'Reviewer visibility matrix changed proof/review cardinality unexpectedly';
  end if;

  raise notice 'Staff proof reviewer visibility RLS matrix passed';
end
$reviewer_visibility_final$;

rollback;
