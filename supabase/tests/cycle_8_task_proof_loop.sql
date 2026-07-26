-- Disposable Cycle 8 task-proof command/RLS regression matrix.
--
-- Run only after cycle_8_task_proof_loop has been applied to the isolated lab.
-- The caller must independently attest the target before invoking this file:
--   set passage.test_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--
-- The exact retained Cycle 7A/7B sentinel is checked before test setup. Every
-- test mutation, including the synthetic Auth users, is enclosed by this
-- transaction and is discarded by the final ROLLBACK. Never run on Production.
begin;

do $cycle_8_preflight_tests$
begin
  if current_setting('passage.test_project_ref', true) is distinct from
       'uyacxqtsiwlvtmhxvoxr'
     or current_setting('passage.test_project_ref', true) =
       'qsveqfchwylsbncsfgxe' then
    raise exception 'Cycle 8 tests refused: exact isolated project attestation is required'
      using errcode = '42501';
  end if;

  if session_user <> 'postgres' or current_user <> 'postgres' then
    raise exception 'Cycle 8 tests require the isolated-lab postgres test role'
      using errcode = '42501';
  end if;

  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_8_task_proof_loop'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7b_assigned_work'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7b_advisor_hardening'
     ) then
    raise exception 'Cycle 8 tests refused: reviewed migration markers are missing'
      using errcode = '55000';
  end if;

  if (select count(*) from public.organizations) <> 1
     or (select count(*) from public.organization_locations) <> 1
     or (select count(*) from public.workflows) <> 2
     or (select count(*) from public.tasks) <> 3
     or (select count(*) from public.workflow_events) <> 8
     or (select count(*) from public.organization_invitations) <> 2
     or (select count(*) from public.organization_invitation_locations) <> 2
     or (select count(*) from public.organization_members
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and status = 'active') <> 2
     or (select count(*) from public.organization_members
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and status = 'revoked') <> 1
     or (select count(*) from public.organization_member_locations as ml
         join public.organization_members as m
           on m.id = ml.organization_member_id
         where m.organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and ml.revoked_at is null) <> 2
     or (select count(*) from public.workflows
         where id in (
           'c7b10001-7b00-47b0-87b0-000000000001',
           'c7b10002-7b00-47b0-87b0-000000000002'
         )) <> 2
     or (select count(*) from public.tasks
         where id in (
           'c7b20001-7b00-47b0-87b0-000000000001',
           'c7b20002-7b00-47b0-87b0-000000000002',
           'c7b20003-7b00-47b0-87b0-000000000003'
         )) <> 3
     or not exists (
       select 1 from public.workflows
       where id = 'c7b10001-7b00-47b0-87b0-000000000001'
         and case_reference = 'NS-2051'
     )
     or exists (select 1 from public.task_proofs)
     or exists (select 1 from public.task_proof_reviews) then
    raise exception 'Cycle 8 tests refused: retained isolated baseline drifted'
      using errcode = '42501';
  end if;
end
$cycle_8_preflight_tests$;

do $cycle_8_catalog_tests$
declare
  v_count integer;
  v_definition text;
begin
  if to_regclass('public.task_proofs') is null
     or to_regclass('public.task_proof_reviews') is null
     or to_regprocedure('public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)') is null
     or to_regprocedure('public.review_task_proof_idempotent(uuid,integer,text,text,uuid)') is null
     or to_regprocedure('passage_private.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)') is null
     or to_regprocedure('passage_private.review_task_proof_idempotent(uuid,integer,text,text,uuid)') is null then
    raise exception 'Cycle 8 catalog objects are incomplete';
  end if;

  select count(*)::integer into v_count
  from pg_constraint
  where conrelid in ('public.task_proofs'::regclass,
                     'public.task_proof_reviews'::regclass)
    and conname in (
      'task_proofs_type_check',
      'task_proofs_summary_check',
      'task_proofs_reference_check',
      'task_proofs_audience_check',
      'task_proofs_destination_check',
      'task_proofs_version_check',
      'task_proofs_not_self_superseding_check',
      'task_proofs_org_request_unique',
      'task_proof_reviews_decision_check',
      'task_proof_reviews_reason_check',
      'task_proof_reviews_version_check',
      'task_proof_reviews_proof_unique',
      'task_proof_reviews_org_request_unique'
    );
  if v_count <> 13 then
    raise exception 'Cycle 8 constraints missing: found % of 13', v_count;
  end if;

  if not exists (
       select 1 from pg_constraint
       where conrelid = 'public.tasks'::regclass
         and conname = 'tasks_cycle_8_status_check'
         and pg_get_constraintdef(oid) like '%proof_submitted%'
     )
     or exists (
       select 1 from pg_constraint
       where conrelid = 'public.tasks'::regclass
         and conname = 'tasks_cycle_7b_status_check'
     ) then
    raise exception 'Cycle 8 task-status constraint replacement is incorrect';
  end if;

  select count(*)::integer into v_count
  from pg_indexes
  where schemaname = 'public'
    and indexname in (
      'task_proofs_task_submitted_idx',
      'task_proofs_workflow_submitted_idx',
      'task_proofs_submitter_member_idx',
      'task_proofs_supersedes_idx',
      'task_proofs_one_replacement_per_prior_unique',
      'task_proofs_one_root_per_task_unique',
      'task_proofs_submitter_user_idx',
      'task_proof_reviews_task_reviewed_idx',
      'task_proof_reviews_reviewer_member_idx',
      'task_proof_reviews_workflow_idx',
      'task_proof_reviews_reviewer_user_idx'
    );
  if v_count <> 11 then
    raise exception 'Cycle 8 advisor indexes missing: found % of 11', v_count;
  end if;

  if exists (
    select 1
    from pg_index as i
    join pg_class as c on c.oid = i.indexrelid
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'task_proofs_task_submitted_idx',
        'task_proofs_workflow_submitted_idx',
        'task_proofs_submitter_member_idx',
        'task_proofs_supersedes_idx',
        'task_proofs_one_replacement_per_prior_unique',
        'task_proofs_one_root_per_task_unique',
        'task_proofs_submitter_user_idx',
        'task_proof_reviews_task_reviewed_idx',
        'task_proof_reviews_reviewer_member_idx',
        'task_proof_reviews_workflow_idx',
        'task_proof_reviews_reviewer_user_idx'
      )
      and (not i.indisvalid or not i.indisready)
  ) then
    raise exception 'Cycle 8 contains an invalid or unready index';
  end if;

  select count(*)::integer into v_count
  from pg_trigger
  where not tgisinternal
    and tgrelid in (
      'public.task_proofs'::regclass,
      'public.task_proof_reviews'::regclass,
      'public.tasks'::regclass
    )
    and tgname in (
      'task_proofs_scope_integrity',
      'task_proof_reviews_scope_integrity',
      'task_proofs_append_only',
      'task_proof_reviews_append_only',
      'tasks_cycle_8_proof_pending_assignment_guard'
    );
  if v_count <> 5 then
    raise exception 'Cycle 8 integrity/append-only triggers are incomplete';
  end if;

  if not exists (
       select 1 from pg_class
       where oid = 'public.task_proofs'::regclass and relrowsecurity
     )
     or not exists (
       select 1 from pg_class
       where oid = 'public.task_proof_reviews'::regclass and relrowsecurity
     )
     or (select count(*) from pg_policies
         where schemaname = 'public'
           and policyname in (
             'cycle_8_task_proofs_authorized_select',
             'cycle_8_task_proof_reviews_authorized_select'
           )
           and cmd = 'SELECT'
           and roles = array['authenticated'::name]
           and qual like '%can_view_task%') <> 2 then
    raise exception 'Cycle 8 RLS policy catalog is incomplete or widened';
  end if;

  if not has_table_privilege('authenticated', 'public.task_proofs', 'SELECT')
     or not has_table_privilege('authenticated', 'public.task_proof_reviews', 'SELECT')
     or has_table_privilege('authenticated', 'public.task_proofs', 'INSERT,UPDATE,DELETE,TRUNCATE')
     or has_table_privilege('authenticated', 'public.task_proof_reviews', 'INSERT,UPDATE,DELETE,TRUNCATE')
     or has_table_privilege('anon', 'public.task_proofs', 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('anon', 'public.task_proof_reviews', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Cycle 8 table grants are not least privilege';
  end if;

  if not has_function_privilege(
       'authenticated',
       'public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)',
       'EXECUTE'
     )
     or not has_function_privilege(
       'authenticated',
       'public.review_task_proof_idempotent(uuid,integer,text,text,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'service_role',
       'public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.review_task_proof_idempotent(uuid,integer,text,text,uuid)',
       'EXECUTE'
     )
     or has_function_privilege(
       'service_role',
       'public.review_task_proof_idempotent(uuid,integer,text,text,uuid)',
       'EXECUTE'
     ) then
    raise exception 'Cycle 8 command execution grants are incorrect';
  end if;

  if exists (
    select 1
    from pg_proc
    where oid in (
      'public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)'::regprocedure,
      'public.review_task_proof_idempotent(uuid,integer,text,text,uuid)'::regprocedure
    )
      and (prosecdef or array_to_string(proconfig, ',') not like '%search_path=%')
  )
     or exists (
       select 1
       from pg_proc
       where oid in (
         'passage_private.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)'::regprocedure,
         'passage_private.review_task_proof_idempotent(uuid,integer,text,text,uuid)'::regprocedure,
         'passage_private.assert_task_proof_scope()'::regprocedure,
         'passage_private.assert_task_proof_review_scope()'::regprocedure,
         'passage_private.reject_task_proof_mutation()'::regprocedure,
         'passage_private.reject_proof_pending_reassignment()'::regprocedure
       )
         and (not prosecdef or array_to_string(proconfig, ',') not like '%search_path=%')
     ) then
    raise exception 'Cycle 8 function security/search_path posture drifted';
  end if;

  select lower(pg_get_functiondef(
    'passage_private.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)'::regprocedure
  )) into v_definition;
  if position('pg_advisory_xact_lock' in v_definition) = 0
     or position('for update' in v_definition) = 0 then
    raise exception 'Submit command lost race serialization';
  end if;

  select lower(pg_get_functiondef(
    'passage_private.review_task_proof_idempotent(uuid,integer,text,text,uuid)'::regprocedure
  )) into v_definition;
  if position('pg_advisory_xact_lock' in v_definition) = 0
     or position('for update' in v_definition) = 0 then
    raise exception 'Review command lost race serialization';
  end if;
end
$cycle_8_catalog_tests$;

-- Synthetic users and memberships are transaction-local and roll back. The
-- retained null-user Cycle 7B staff row is bound to the primary test user only
-- for this transaction, preserving production-shape membership semantics.
insert into auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('c8000011-c800-4800-8800-000000000011', 'primary-staff@cycle8.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Primary Staff"}', now(), now()),
  ('c8000012-c800-4800-8800-000000000012', 'second-staff@cycle8.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Second Staff"}', now(), now()),
  ('c8000013-c800-4800-8800-000000000013', 'limited-director@cycle8.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Limited Director"}', now(), now()),
  ('c8000014-c800-4800-8800-000000000014', 'other-director@cycle8.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Other Director"}', now(), now()),
  ('c8000015-c800-4800-8800-000000000015', 'outsider@cycle8.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Outsider"}', now(), now());

update public.organization_members
set user_id = 'c8000011-c800-4800-8800-000000000011',
    status = 'active', revoked_at = null, revoked_by_user_id = null,
    revocation_reason = null, updated_at = clock_timestamp()
where id = 'c7b00004-7b00-47b0-87b0-000000000004';

insert into public.organization_locations (id, organization_id, name, status)
values (
  'c8000021-c800-4800-8800-000000000021',
  'c7a00001-7a00-47a0-87a0-000000000001',
  'Cycle 8 unscoped location', 'active'
);

insert into public.organizations (id, name)
values ('c8000031-c800-4800-8800-000000000031', 'Cycle 8 other organization');

insert into public.organization_locations (id, organization_id, name, status)
values (
  'c8000032-c800-4800-8800-000000000032',
  'c8000031-c800-4800-8800-000000000031',
  'Cycle 8 other location', 'active'
);

insert into public.organization_members (
  id, organization_id, user_id, email, role, status, display_name, accepted_at
) values
  ('c8000041-c800-4800-8800-000000000041', 'c7a00001-7a00-47a0-87a0-000000000001', 'c8000012-c800-4800-8800-000000000012', 'second-staff@cycle8.test', 'staff', 'active', 'Second Staff', now()),
  ('c8000042-c800-4800-8800-000000000042', 'c7a00001-7a00-47a0-87a0-000000000001', 'c8000013-c800-4800-8800-000000000013', 'limited-director@cycle8.test', 'director', 'active', 'Limited Director', now()),
  ('c8000043-c800-4800-8800-000000000043', 'c8000031-c800-4800-8800-000000000031', 'c8000014-c800-4800-8800-000000000014', 'other-director@cycle8.test', 'director', 'active', 'Other Director', now());

insert into public.organization_member_locations (
  organization_member_id, organization_location_id, granted_by_user_id
)
select grants.member_id, grants.location_id, director.user_id
from (
  values
    ('c8000041-c800-4800-8800-000000000041'::uuid, 'c7a00002-7a00-47a0-87a0-000000000002'::uuid),
    ('c8000042-c800-4800-8800-000000000042'::uuid, 'c8000021-c800-4800-8800-000000000021'::uuid)
) as grants(member_id, location_id)
cross join lateral (
  select user_id from public.organization_members
  where id = 'c7a00003-7a00-47a0-87a0-000000000003'
) as director;

insert into public.organization_member_locations (
  organization_member_id, organization_location_id, granted_by_user_id
) values (
  'c8000043-c800-4800-8800-000000000043',
  'c8000032-c800-4800-8800-000000000032',
  'c8000014-c800-4800-8800-000000000014'
);

-- Normalize only the three retained synthetic tasks inside the rollback-only
-- transaction. Distinct versions make stale/atomicity assertions explicit.
update public.tasks set
  assigned_organization_member_id = 'c7b00004-7b00-47b0-87b0-000000000004',
  status = 'in_progress', version = 101, updated_at = clock_timestamp()
where id = 'c7b20001-7b00-47b0-87b0-000000000001';

update public.tasks set
  assigned_organization_member_id = 'c7b00004-7b00-47b0-87b0-000000000004',
  status = 'in_progress', version = 201, updated_at = clock_timestamp()
where id = 'c7b20002-7b00-47b0-87b0-000000000002';

update public.tasks set
  assigned_organization_member_id = 'c7b00004-7b00-47b0-87b0-000000000004',
  status = 'in_progress', version = 301, updated_at = clock_timestamp()
where id = 'c7b20003-7b00-47b0-87b0-000000000003';

select set_config(
  'passage.test_director_user_id',
  (select user_id::text from public.organization_members
   where id = 'c7a00003-7a00-47a0-87a0-000000000003'),
  true
);

set local role authenticated;

do $cycle_8_command_tests$
declare
  v_director_user_id uuid;
  v_submit record;
  v_submit_replay record;
  v_review record;
  v_review_replay record;
  v_root_proof_id uuid;
  v_replacement_proof_id uuid;
  v_before_proofs integer;
  v_before_reviews integer;
  v_before_events integer;
begin
  v_director_user_id := current_setting('passage.test_director_user_id')::uuid;

  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  select * into strict v_submit
  from public.submit_task_proof_idempotent(
    'c7b20001-7b00-47b0-87b0-000000000001', 101,
    'confirmation', 'The arrangement meeting was confirmed.', 'confirmation-101',
    null, 'c8000101-c800-4800-8800-000000000101'
  );
  if v_submit.replayed
     or v_submit.task_status <> 'proof_submitted'
     or v_submit.task_version <> 102 then
    raise exception 'Initial proof submission receipt is incorrect';
  end if;

  select * into strict v_submit_replay
  from public.submit_task_proof_idempotent(
    'c7b20001-7b00-47b0-87b0-000000000001', 101,
    'confirmation', 'The arrangement meeting was confirmed.', 'confirmation-101',
    null, 'c8000101-c800-4800-8800-000000000101'
  );
  if not v_submit_replay.replayed
     or v_submit_replay.proof_id <> v_submit.proof_id
     or v_submit_replay.event_id <> v_submit.event_id
     or (select count(*) from public.task_proofs
         where task_id = v_submit.task_id) <> 1
     or (select count(*) from public.workflow_events
         where idempotency_key = 'task_proof_submission:c8000101-c800-4800-8800-000000000101') <> 1 then
    raise exception 'Proof replay was not cardinality-stable';
  end if;
  v_root_proof_id := v_submit.proof_id;

  select count(*) into v_before_proofs from public.task_proofs;
  select count(*) into v_before_events from public.workflow_events;
  begin
    perform * from public.submit_task_proof_idempotent(
      'c7b20001-7b00-47b0-87b0-000000000001', 101,
      'confirmation', 'Conflicting payload.', 'confirmation-101',
      null, 'c8000101-c800-4800-8800-000000000101'
    );
    raise exception 'Expected conflicting submission replay denial';
  exception when sqlstate '22023' then null; end;
  if (select count(*) from public.task_proofs) <> v_before_proofs
     or (select count(*) from public.workflow_events) <> v_before_events then
    raise exception 'Conflicting submission replay left partial rows';
  end if;

  begin
    perform * from public.submit_task_proof_idempotent(
      'c7b20002-7b00-47b0-87b0-000000000002', 200,
      'completion_note', 'Stale submission must not persist.', null,
      null, 'c8000102-c800-4800-8800-000000000102'
    );
    raise exception 'Expected stale proof version denial';
  exception when sqlstate '40001' then null; end;
  if (select count(*) from public.task_proofs) <> v_before_proofs
     or (select count(*) from public.workflow_events) <> v_before_events
     or (select status from public.tasks
         where id = 'c7b20002-7b00-47b0-87b0-000000000002') <> 'in_progress'
     or (select version from public.tasks
         where id = 'c7b20002-7b00-47b0-87b0-000000000002') <> 201 then
    raise exception 'Stale submission was not atomic';
  end if;

  -- An unassigned staff member cannot command or project the proof.
  perform set_config('request.jwt.claim.sub', 'c8000012-c800-4800-8800-000000000012', true);
  begin
    perform * from public.submit_task_proof_idempotent(
      'c7b20003-7b00-47b0-87b0-000000000003', 301,
      'handoff', 'Unassigned attempt.', null, null,
      'c8000103-c800-4800-8800-000000000103'
    );
    raise exception 'Expected unassigned staff denial';
  exception when sqlstate '42501' then null; end;
  if (select count(*) from public.task_proofs) <> 0 then
    raise exception 'Unassigned staff projected another assignment proof';
  end if;

  -- Staff cannot directly review, even when assigned to the task.
  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  begin
    perform * from public.review_task_proof_idempotent(
      v_root_proof_id, 102, 'verified', null,
      'c8000104-c800-4800-8800-000000000104'
    );
    raise exception 'Expected staff review denial';
  exception when sqlstate '42501' then null; end;

  -- Wrong-location and wrong-organization directors see no proof and cannot act.
  perform set_config('request.jwt.claim.sub', 'c8000013-c800-4800-8800-000000000013', true);
  if (select count(*) from public.task_proofs where id = v_root_proof_id) <> 0 then
    raise exception 'Wrong-location director projected proof';
  end if;
  begin
    perform * from public.review_task_proof_idempotent(
      v_root_proof_id, 102, 'verified', null,
      'c8000105-c800-4800-8800-000000000105'
    );
    raise exception 'Expected wrong-location review denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('request.jwt.claim.sub', 'c8000014-c800-4800-8800-000000000014', true);
  if (select count(*) from public.task_proofs where id = v_root_proof_id) <> 0 then
    raise exception 'Wrong-organization director projected proof';
  end if;
  begin
    perform * from public.review_task_proof_idempotent(
      v_root_proof_id, 102, 'verified', null,
      'c8000106-c800-4800-8800-000000000106'
    );
    raise exception 'Expected wrong-organization review denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('request.jwt.claim.sub', 'c8000015-c800-4800-8800-000000000015', true);
  if (select count(*) from public.task_proofs) <> 0
     or (select count(*) from public.task_proof_reviews) <> 0 then
    raise exception 'Unaffiliated/BOLA projection leaked proof history';
  end if;

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  select count(*) into v_before_reviews from public.task_proof_reviews;
  select count(*) into v_before_events from public.workflow_events;
  begin
    perform * from public.review_task_proof_idempotent(
      v_root_proof_id, 999, 'verified', null,
      'c8000107-c800-4800-8800-000000000107'
    );
    raise exception 'Expected stale review version denial';
  exception when sqlstate '40001' then null; end;
  if (select count(*) from public.task_proof_reviews) <> v_before_reviews
     or (select count(*) from public.workflow_events) <> v_before_events
     or (select status from public.tasks
         where id = 'c7b20001-7b00-47b0-87b0-000000000001') <> 'proof_submitted' then
    raise exception 'Stale review was not atomic';
  end if;

  select * into strict v_review
  from public.review_task_proof_idempotent(
    v_root_proof_id, 102, 'verified', null,
    'c8000108-c800-4800-8800-000000000108'
  );
  select * into strict v_review_replay
  from public.review_task_proof_idempotent(
    v_root_proof_id, 102, 'verified', null,
    'c8000108-c800-4800-8800-000000000108'
  );
  if v_review.replayed or not v_review_replay.replayed
     or v_review_replay.review_id <> v_review.review_id
     or v_review_replay.event_id <> v_review.event_id
     or v_review.task_status <> 'completed'
     or v_review.task_version <> 103 then
    raise exception 'Verified review/replay receipt is incorrect';
  end if;

  select count(*) into v_before_reviews from public.task_proof_reviews;
  select count(*) into v_before_events from public.workflow_events;
  begin
    perform * from public.review_task_proof_idempotent(
      v_root_proof_id, 102, 'needs_replacement', 'Conflicting decision',
      'c8000108-c800-4800-8800-000000000108'
    );
    raise exception 'Expected conflicting review replay denial';
  exception when sqlstate '22023' then null; end;
  if (select count(*) from public.task_proof_reviews) <> v_before_reviews
     or (select count(*) from public.workflow_events) <> v_before_events then
    raise exception 'Conflicting review replay left partial rows';
  end if;

  -- Separate task: root proof -> replacement request -> one successor -> verify.
  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  select * into strict v_submit
  from public.submit_task_proof_idempotent(
    'c7b20002-7b00-47b0-87b0-000000000002', 201,
    'completion_note', 'The receiving location was recorded.', null,
    null, 'c8000111-c800-4800-8800-000000000111'
  );
  v_root_proof_id := v_submit.proof_id;

  -- A proof from another task cannot become this task's predecessor.
  begin
    perform * from public.submit_task_proof_idempotent(
      'c7b20003-7b00-47b0-87b0-000000000003', 301,
      'completion_note', 'Cross-task predecessor attempt.', null,
      v_root_proof_id, 'c8000112-c800-4800-8800-000000000112'
    );
    raise exception 'Expected cross-task supersedes denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  select * into strict v_review
  from public.review_task_proof_idempotent(
    v_root_proof_id, 202, 'needs_replacement',
    'Please include the receiving desk reference.',
    'c8000113-c800-4800-8800-000000000113'
  );
  if v_review.task_status <> 'in_progress' or v_review.task_version <> 203 then
    raise exception 'Replacement request did not reopen work';
  end if;

  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  select * into strict v_submit
  from public.submit_task_proof_idempotent(
    'c7b20002-7b00-47b0-87b0-000000000002', 203,
    'reference', 'The receiving desk accepted the handoff.', 'desk-42',
    v_root_proof_id, 'c8000114-c800-4800-8800-000000000114'
  );
  v_replacement_proof_id := v_submit.proof_id;
  if v_submit.task_status <> 'proof_submitted' or v_submit.task_version <> 204
     or (select count(*) from public.task_proofs
         where supersedes_proof_id = v_root_proof_id) <> 1 then
    raise exception 'Replacement successor cardinality is incorrect';
  end if;

  perform set_config('request.jwt.claim.sub', v_director_user_id::text, true);
  select * into strict v_review
  from public.review_task_proof_idempotent(
    v_replacement_proof_id, 204, 'verified', null,
    'c8000116-c800-4800-8800-000000000116'
  );
  if v_review.task_status <> 'completed' or v_review.task_version <> 205
     or (select count(*) from public.task_proofs
         where task_id = 'c7b20002-7b00-47b0-87b0-000000000002') <> 2
     or (select count(*) from public.task_proof_reviews
         where task_id = 'c7b20002-7b00-47b0-87b0-000000000002') <> 2 then
    raise exception 'Replacement chain did not preserve immutable history';
  end if;

  if (select count(*) from public.task_proofs) <> 3
     or (select count(*) from public.task_proof_reviews) <> 3
     or (select count(*) from public.workflow_events
         where name in (
           'task.proof_submitted', 'task.proof_verified',
           'task.proof_replacement_requested'
         )) <> 6 then
    raise exception 'Happy-path proof/review/event cardinality is incorrect';
  end if;
end
$cycle_8_command_tests$;

reset role;

-- The unique successor index is the database race backstop. A privileged
-- second-branch attempt still fails the semantic trigger or unique index.
do $cycle_8_anti_branching_test$
declare
  v_root_proof_id uuid;
begin
  select id into strict v_root_proof_id
  from public.task_proofs
  where task_id = 'c7b20002-7b00-47b0-87b0-000000000002'
    and supersedes_proof_id is null;
  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  begin
    insert into public.task_proofs (
      organization_id, workflow_id, task_id,
      submitted_by_user_id, submitted_by_organization_member_id,
      proof_type, completion_summary, reference, audience, proof_destination,
      supersedes_proof_id, request_id, expected_task_version
    ) values (
      'c7a00001-7a00-47a0-87a0-000000000001',
      'c7b10001-7b00-47b0-87b0-000000000001',
      'c7b20002-7b00-47b0-87b0-000000000002',
      'c8000011-c800-4800-8800-000000000011',
      'c7b00004-7b00-47b0-87b0-000000000004',
      'reference', 'Second successor must fail.', 'desk-43', 'case_team',
      'Transport coordination activity', v_root_proof_id,
      'c8000115-c800-4800-8800-000000000115', 203
    );
    raise exception 'Expected anti-branching successor denial';
  exception when sqlstate '23514' or unique_violation then null; end;
end
$cycle_8_anti_branching_test$;

-- Persist checksums only in a temporary table so failed mutation/bypass tests
-- can prove the successful chain remained byte-for-byte unchanged.
create temporary table cycle_8_core_checksums (
  kind text not null,
  row_id uuid not null,
  digest text not null,
  primary key (kind, row_id)
) on commit drop;

insert into cycle_8_core_checksums
select 'proof', id, md5(row_to_json(p)::text)
from public.task_proofs as p
where task_id in (
  'c7b20001-7b00-47b0-87b0-000000000001',
  'c7b20002-7b00-47b0-87b0-000000000002'
)
union all
select 'review', id, md5(row_to_json(r)::text)
from public.task_proof_reviews as r
where task_id in (
  'c7b20001-7b00-47b0-87b0-000000000001',
  'c7b20002-7b00-47b0-87b0-000000000002'
)
union all
select 'event', id, md5(row_to_json(e)::text)
from public.workflow_events as e
where task_id in (
  'c7b20001-7b00-47b0-87b0-000000000001',
  'c7b20002-7b00-47b0-87b0-000000000002'
)
  and name in (
    'task.proof_submitted', 'task.proof_verified',
    'task.proof_replacement_requested'
  );

-- Former assignee: direct setup reassigns the unused third task, then the old
-- staff identity must lose both command and projection authority.
update public.tasks set
  assigned_organization_member_id = 'c8000041-c800-4800-8800-000000000041',
  status = 'in_progress', version = 302, updated_at = clock_timestamp()
where id = 'c7b20003-7b00-47b0-87b0-000000000003';

set local role authenticated;
do $cycle_8_former_tests$
begin
  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  begin
    perform * from public.submit_task_proof_idempotent(
      'c7b20003-7b00-47b0-87b0-000000000003', 302,
      'handoff', 'Former assignee attempt.', null, null,
      'c8000121-c800-4800-8800-000000000121'
    );
    raise exception 'Expected former-assignee denial';
  exception when sqlstate '42501' then null; end;
  if (select count(*) from public.task_proofs
      where task_id = 'c7b20003-7b00-47b0-87b0-000000000003') <> 0 then
    raise exception 'Former assignee projected third-task proof';
  end if;
end
$cycle_8_former_tests$;
reset role;

-- Revoked user: assign while active, revoke transaction-locally, then verify
-- command and all previously assigned proof projections close immediately.
update public.tasks set
  assigned_organization_member_id = 'c7b00004-7b00-47b0-87b0-000000000004',
  status = 'in_progress', version = 303, updated_at = clock_timestamp()
where id = 'c7b20003-7b00-47b0-87b0-000000000003';

update public.organization_members
set status = 'revoked', revoked_at = clock_timestamp(),
    revoked_by_user_id = (
      select user_id from public.organization_members
      where id = 'c7a00003-7a00-47a0-87a0-000000000003'
    ),
    revocation_reason = 'Rollback-only revoked authority test',
    updated_at = clock_timestamp()
where id = 'c7b00004-7b00-47b0-87b0-000000000004';

set local role authenticated;
do $cycle_8_revoked_tests$
begin
  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  begin
    perform * from public.submit_task_proof_idempotent(
      'c7b20003-7b00-47b0-87b0-000000000003', 303,
      'handoff', 'Revoked user attempt.', null, null,
      'c8000122-c800-4800-8800-000000000122'
    );
    raise exception 'Expected revoked-user denial';
  exception when sqlstate '42501' then null; end;
  if (select count(*) from public.task_proofs) <> 0
     or (select count(*) from public.task_proof_reviews) <> 0 then
    raise exception 'Revoked user retained proof projection authority';
  end if;
end
$cycle_8_revoked_tests$;
reset role;

update public.organization_members
set status = 'active', revoked_at = null, revoked_by_user_id = null,
    revocation_reason = null, updated_at = clock_timestamp()
where id = 'c7b00004-7b00-47b0-87b0-000000000004';

update public.tasks set version = 304, updated_at = clock_timestamp()
where id = 'c7b20003-7b00-47b0-87b0-000000000003';

set local role authenticated;
do $cycle_8_pending_proof_tests$
declare
  v_director_user_id uuid;
  v_submit record;
begin
  v_director_user_id := current_setting('passage.test_director_user_id')::uuid;

  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  select * into strict v_submit
  from public.submit_task_proof_idempotent(
    'c7b20003-7b00-47b0-87b0-000000000003', 304,
    'handoff', 'Family approval was recorded for review.', 'approval-304',
    null, 'c8000131-c800-4800-8800-000000000131'
  );

  -- Direct authenticated mutation is blocked by ACL before RLS or triggers.
  begin
    update public.task_proofs set completion_summary = 'Tampered'
    where id = v_submit.proof_id;
    raise exception 'Expected authenticated proof mutation denial';
  exception when sqlstate '42501' then null; end;

end
$cycle_8_pending_proof_tests$;
reset role;

do $cycle_8_pending_reassignment_guard_test$
begin
  begin
    update public.tasks
    set assigned_organization_member_id = 'c8000041-c800-4800-8800-000000000041'
    where id = 'c7b20003-7b00-47b0-87b0-000000000003';
    raise exception 'Expected proof-pending reassignment denial';
  exception when sqlstate '55000' then null; end;
end
$cycle_8_pending_reassignment_guard_test$;

set local role authenticated;
do $cycle_8_pending_review_test$
declare
  v_proof_id uuid;
  v_review record;
begin
  perform set_config(
    'request.jwt.claim.sub',
    current_setting('passage.test_director_user_id'),
    true
  );
  select id into strict v_proof_id
  from public.task_proofs
  where task_id = 'c7b20003-7b00-47b0-87b0-000000000003';
  select * into strict v_review
  from public.review_task_proof_idempotent(
    v_proof_id, 305, 'needs_replacement',
    'Please add the final approval reference.',
    'c8000132-c800-4800-8800-000000000132'
  );
  if v_review.task_status <> 'in_progress' or v_review.task_version <> 306 then
    raise exception 'Replacement request did not clear proof-pending state';
  end if;
end
$cycle_8_pending_review_test$;
reset role;

-- Once a director requests replacement, reassignment is allowed. The former
-- staff member then loses the proof/review projection for this task.
update public.tasks
set assigned_organization_member_id = 'c8000041-c800-4800-8800-000000000041',
    updated_at = clock_timestamp()
where id = 'c7b20003-7b00-47b0-87b0-000000000003';

set local role authenticated;
do $cycle_8_former_projection_tests$
begin
  perform set_config('request.jwt.claim.sub', 'c8000011-c800-4800-8800-000000000011', true);
  if (select count(*) from public.task_proofs
      where task_id = 'c7b20003-7b00-47b0-87b0-000000000003') <> 0
     or (select count(*) from public.task_proof_reviews
         where task_id = 'c7b20003-7b00-47b0-87b0-000000000003') <> 0 then
    raise exception 'Former assignee retained proof/review projection';
  end if;
end
$cycle_8_former_projection_tests$;
reset role;

do $cycle_8_append_only_and_cleanup_tests$
declare
  v_third_proof_id uuid;
  v_third_review_id uuid;
  v_before integer;
begin
  select id into strict v_third_proof_id
  from public.task_proofs
  where task_id = 'c7b20003-7b00-47b0-87b0-000000000003';
  select id into strict v_third_review_id
  from public.task_proof_reviews
  where task_id = 'c7b20003-7b00-47b0-87b0-000000000003';

  perform set_config('request.jwt.claim.sub', 'c8000015-c800-4800-8800-000000000015', true);
  begin
    insert into public.task_proofs (
      organization_id, workflow_id, task_id,
      submitted_by_user_id, submitted_by_organization_member_id,
      proof_type, completion_summary, reference, audience, proof_destination,
      supersedes_proof_id, request_id, expected_task_version
    ) values (
      'c7a00001-7a00-47a0-87a0-000000000001',
      'c7b10002-7b00-47b0-87b0-000000000002',
      'c7b20003-7b00-47b0-87b0-000000000003',
      'c8000011-c800-4800-8800-000000000011',
      'c7b00004-7b00-47b0-87b0-000000000004',
      'handoff', 'Privileged semantic bypass attempt.', null, 'case_team',
      'Keepsake activity and family approval', null,
      'c8000141-c800-4800-8800-000000000141', 304
    );
    raise exception 'Expected privileged insert semantic-integrity denial';
  exception when sqlstate '23514' then null; end;

  begin
    update public.task_proofs set completion_summary = 'Privileged tamper'
    where id = v_third_proof_id;
    raise exception 'Expected append-only proof update denial';
  exception when sqlstate '42501' then null; end;
  begin
    delete from public.task_proof_reviews where id = v_third_review_id;
    raise exception 'Expected append-only review delete denial';
  exception when sqlstate '42501' then null; end;
  begin
    update public.workflow_events set metadata = metadata || '{"tampered":true}'::jsonb
    where task_id = 'c7b20003-7b00-47b0-87b0-000000000003'
      and name = 'task.proof_submitted';
    raise exception 'Expected append-only event update denial';
  exception when sqlstate '42501' then null; end;

  perform set_config('passage.fixture_reset', 'cycle_8_isolated_lab', true);
  perform set_config('passage.fixture_project_ref', 'qsveqfchwylsbncsfgxe', true);
  begin
    delete from public.task_proof_reviews where id = v_third_review_id;
    raise exception 'Expected wrong-project cleanup denial';
  exception when sqlstate '42501' then null; end;

  if exists (
    select 1
    from cycle_8_core_checksums as expected
    left join lateral (
      select md5(row_to_json(p)::text) as digest
      from public.task_proofs as p
      where expected.kind = 'proof' and p.id = expected.row_id
      union all
      select md5(row_to_json(r)::text)
      from public.task_proof_reviews as r
      where expected.kind = 'review' and r.id = expected.row_id
      union all
      select md5(row_to_json(e)::text)
      from public.workflow_events as e
      where expected.kind = 'event' and e.id = expected.row_id
    ) as actual on true
    where actual.digest is distinct from expected.digest
  ) then
    raise exception 'Append-only denial changed a retained proof/review/event checksum';
  end if;

  -- Exact postgres + isolated-project + sentinel cleanup is allowed only for
  -- rollback/test-fixture recovery. Cleanup order respects review -> proof -> event.
  perform set_config('passage.fixture_project_ref', 'uyacxqtsiwlvtmhxvoxr', true);
  delete from public.task_proof_reviews where id = v_third_review_id;
  delete from public.task_proofs where id = v_third_proof_id;
  delete from public.workflow_events
  where task_id = 'c7b20003-7b00-47b0-87b0-000000000003'
    and name in ('task.proof_submitted', 'task.proof_replacement_requested');

  select count(*)::integer into v_before
  from public.task_proofs
  where task_id = 'c7b20003-7b00-47b0-87b0-000000000003';
  if v_before <> 0
     or exists (
       select 1 from public.task_proof_reviews
       where task_id = 'c7b20003-7b00-47b0-87b0-000000000003'
     )
     or exists (
       select 1 from public.workflow_events
       where task_id = 'c7b20003-7b00-47b0-87b0-000000000003'
         and name in ('task.proof_submitted', 'task.proof_replacement_requested')
     ) then
    raise exception 'Exact isolated cleanup did not remove only third-task test rows';
  end if;

  if (select count(*) from public.task_proofs) <> 3
     or (select count(*) from public.task_proof_reviews) <> 3
     or (select count(*) from public.workflow_events
         where name in (
           'task.proof_submitted', 'task.proof_verified',
           'task.proof_replacement_requested'
         )) <> 6 then
    raise exception 'Cleanup changed retained happy-path cardinality';
  end if;

  if exists (
    select 1
    from cycle_8_core_checksums as expected
    left join lateral (
      select md5(row_to_json(p)::text) as digest
      from public.task_proofs as p
      where expected.kind = 'proof' and p.id = expected.row_id
      union all
      select md5(row_to_json(r)::text)
      from public.task_proof_reviews as r
      where expected.kind = 'review' and r.id = expected.row_id
      union all
      select md5(row_to_json(e)::text)
      from public.workflow_events as e
      where expected.kind = 'event' and e.id = expected.row_id
    ) as actual on true
    where actual.digest is distinct from expected.digest
  ) then
    raise exception 'Cleanup changed retained proof/review/event checksums';
  end if;

  raise notice 'Cycle 8 task-proof command, RLS, append-only, race, and cleanup matrix passed';
end
$cycle_8_append_only_and_cleanup_tests$;

rollback;
