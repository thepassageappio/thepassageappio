-- Disposable Cycle 7B command/RLS regression matrix. Run only after the
-- cycle_7b_assigned_work migration in an isolated/local lab. All rows roll back.
begin;

insert into auth.users (id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('7b000011-7b00-47b0-87b0-000000000011', 'director@cycle7b.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Director"}', now(), now()),
  ('7b000012-7b00-47b0-87b0-000000000012', 'limited-director@cycle7b.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Limited Director"}', now(), now()),
  ('7b000013-7b00-47b0-87b0-000000000013', 'staff-one@cycle7b.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Staff One"}', now(), now()),
  ('7b000014-7b00-47b0-87b0-000000000014', 'staff-two@cycle7b.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Staff Two"}', now(), now()),
  ('7b000015-7b00-47b0-87b0-000000000015', 'staff-three@cycle7b.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Staff Three"}', now(), now()),
  ('7b000016-7b00-47b0-87b0-000000000016', 'other-director@cycle7b.test', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Other Director"}', now(), now());

insert into public.organizations (id, name) values
  ('7b000001-7b00-47b0-87b0-000000000001', 'Cycle 7B Northstar'),
  ('7b000021-7b00-47b0-87b0-000000000021', 'Cycle 7B Other');

insert into public.organization_locations (id, organization_id, name, status) values
  ('7b000002-7b00-47b0-87b0-000000000002', '7b000001-7b00-47b0-87b0-000000000001', 'Portland', 'active'),
  ('7b000003-7b00-47b0-87b0-000000000003', '7b000001-7b00-47b0-87b0-000000000001', 'Beaverton', 'active'),
  ('7b000022-7b00-47b0-87b0-000000000022', '7b000021-7b00-47b0-87b0-000000000021', 'Other location', 'active');

insert into public.organization_members (
  id, organization_id, user_id, email, role, status, display_name, accepted_at
) values
  ('7b000004-7b00-47b0-87b0-000000000004', '7b000001-7b00-47b0-87b0-000000000001', '7b000011-7b00-47b0-87b0-000000000011', 'director@cycle7b.test', 'director', 'active', 'Director', now()),
  ('7b000005-7b00-47b0-87b0-000000000005', '7b000001-7b00-47b0-87b0-000000000001', '7b000012-7b00-47b0-87b0-000000000012', 'limited-director@cycle7b.test', 'director', 'active', 'Limited Director', now()),
  ('7b000006-7b00-47b0-87b0-000000000006', '7b000001-7b00-47b0-87b0-000000000001', '7b000013-7b00-47b0-87b0-000000000013', 'staff-one@cycle7b.test', 'staff', 'active', 'Staff One', now()),
  ('7b000007-7b00-47b0-87b0-000000000007', '7b000001-7b00-47b0-87b0-000000000001', '7b000014-7b00-47b0-87b0-000000000014', 'staff-two@cycle7b.test', 'staff', 'active', 'Staff Two', now()),
  ('7b000008-7b00-47b0-87b0-000000000008', '7b000001-7b00-47b0-87b0-000000000001', null, 'multi-staff@cycle7b.test', 'staff', 'active', 'Multi Staff', now()),
  ('7b000023-7b00-47b0-87b0-000000000023', '7b000021-7b00-47b0-87b0-000000000021', '7b000016-7b00-47b0-87b0-000000000016', 'other-director@cycle7b.test', 'director', 'active', 'Other Director', now());

insert into public.organization_member_locations (organization_member_id, organization_location_id, granted_by_user_id)
values
  ('7b000004-7b00-47b0-87b0-000000000004', '7b000002-7b00-47b0-87b0-000000000002', '7b000011-7b00-47b0-87b0-000000000011'),
  ('7b000004-7b00-47b0-87b0-000000000004', '7b000003-7b00-47b0-87b0-000000000003', '7b000011-7b00-47b0-87b0-000000000011'),
  ('7b000005-7b00-47b0-87b0-000000000005', '7b000002-7b00-47b0-87b0-000000000002', '7b000011-7b00-47b0-87b0-000000000011'),
  ('7b000006-7b00-47b0-87b0-000000000006', '7b000002-7b00-47b0-87b0-000000000002', '7b000011-7b00-47b0-87b0-000000000011'),
  ('7b000007-7b00-47b0-87b0-000000000007', '7b000002-7b00-47b0-87b0-000000000002', '7b000011-7b00-47b0-87b0-000000000011'),
  ('7b000008-7b00-47b0-87b0-000000000008', '7b000002-7b00-47b0-87b0-000000000002', '7b000011-7b00-47b0-87b0-000000000011'),
  ('7b000008-7b00-47b0-87b0-000000000008', '7b000003-7b00-47b0-87b0-000000000003', '7b000011-7b00-47b0-87b0-000000000011'),
  ('7b000023-7b00-47b0-87b0-000000000023', '7b000022-7b00-47b0-87b0-000000000022', '7b000016-7b00-47b0-87b0-000000000016');

insert into public.workflows (
  id, organization_id, organization_location_id, accountable_organization_member_id,
  case_reference, family_name, person_name, phase, status
) values
  ('7b000031-7b00-47b0-87b0-000000000031', '7b000001-7b00-47b0-87b0-000000000001', '7b000002-7b00-47b0-87b0-000000000002', '7b000004-7b00-47b0-87b0-000000000004', 'TEST-1', 'Rivera', 'Sofia Rivera', 'Arrangement', 'active'),
  ('7b000032-7b00-47b0-87b0-000000000032', '7b000001-7b00-47b0-87b0-000000000001', '7b000003-7b00-47b0-87b0-000000000003', '7b000004-7b00-47b0-87b0-000000000004', 'TEST-2', 'Other', 'Other Person', 'Coordination', 'active'),
  ('7b000033-7b00-47b0-87b0-000000000033', '7b000021-7b00-47b0-87b0-000000000021', '7b000022-7b00-47b0-87b0-000000000022', '7b000023-7b00-47b0-87b0-000000000023', 'OTHER-1', 'Other', 'Other Person', 'Other', 'active');

insert into public.tasks (
  id, workflow_id, organization_id, title, status, waiting_party, due_at,
  audience, automation_level, human_action, proof_destination, next_state, version
) values
  ('7b000041-7b00-47b0-87b0-000000000041', '7b000031-7b00-47b0-87b0-000000000031', '7b000001-7b00-47b0-87b0-000000000001', 'Task one', 'assigned', 'Maya', now() + interval '1 hour', 'case_team', 'manual', 'Start', 'Activity', 'in_progress', 1),
  ('7b000042-7b00-47b0-87b0-000000000042', '7b000031-7b00-47b0-87b0-000000000031', '7b000001-7b00-47b0-87b0-000000000001', 'Task two', 'assigned', 'Transport', now() + interval '2 hours', 'case_team', 'manual', 'Start', 'Activity', 'in_progress', 1),
  ('7b000043-7b00-47b0-87b0-000000000043', '7b000032-7b00-47b0-87b0-000000000032', '7b000001-7b00-47b0-87b0-000000000001', 'Beaverton task', 'assigned', 'Other', now() + interval '3 hours', 'case_team', 'manual', 'Start', 'Activity', 'in_progress', 1),
  ('7b000044-7b00-47b0-87b0-000000000044', '7b000033-7b00-47b0-87b0-000000000033', '7b000021-7b00-47b0-87b0-000000000021', 'Other org task', 'assigned', 'Other', now() + interval '4 hours', 'case_team', 'manual', 'Start', 'Activity', 'in_progress', 1);

set local role authenticated;

do $cycle_7b_tests$
declare
  v_receipt record;
  v_replay record;
  v_token text;
  v_invited_member_id uuid;
  v_multi_event_id uuid;
  v_count integer;
begin
  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000011-7b00-47b0-87b0-000000000011', true);

  if pg_catalog.has_table_privilege('authenticated', 'public.tasks', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.tasks', 'UPDATE')
     or pg_catalog.has_table_privilege('authenticated', 'public.workflow_events', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.workflow_events', 'UPDATE')
     or pg_catalog.has_table_privilege('authenticated', 'public.workflow_events', 'DELETE') then
    raise exception 'Authenticated direct DML privilege leaked';
  end if;

  select * into v_receipt from public.assign_task_idempotent(
    '7b000041-7b00-47b0-87b0-000000000041', 1,
    '7b000006-7b00-47b0-87b0-000000000006', 'Initial owner',
    '7b000051-7b00-47b0-87b0-000000000051'
  );
  if v_receipt.replayed or v_receipt.task_version <> 2 then raise exception 'Initial assignment receipt failed'; end if;
  select * into v_replay from public.assign_task_idempotent(
    '7b000041-7b00-47b0-87b0-000000000041', 1,
    '7b000006-7b00-47b0-87b0-000000000006', 'Initial owner',
    '7b000051-7b00-47b0-87b0-000000000051'
  );
  if not v_replay.replayed or v_replay.event_id <> v_receipt.event_id then raise exception 'Assignment replay failed'; end if;

  begin
    perform * from public.assign_task_idempotent(
      '7b000042-7b00-47b0-87b0-000000000042', 1,
      '7b000006-7b00-47b0-87b0-000000000006', 'Initial owner',
      '7b000051-7b00-47b0-87b0-000000000051'
    );
    raise exception 'Expected cross-task request collision';
  exception when sqlstate '22023' then null; end;

  begin
    perform * from public.assign_task_idempotent(
      '7b000041-7b00-47b0-87b0-000000000041', 1,
      '7b000007-7b00-47b0-87b0-000000000007', 'Stale change',
      '7b000052-7b00-47b0-87b0-000000000052'
    );
    raise exception 'Expected stale assignment conflict';
  exception when sqlstate '40001' then null; end;

  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000013-7b00-47b0-87b0-000000000013', true);
  select * into v_receipt from public.start_task_idempotent(
    '7b000041-7b00-47b0-87b0-000000000041', 2,
    '7b000053-7b00-47b0-87b0-000000000053'
  );
  select * into v_replay from public.start_task_idempotent(
    '7b000041-7b00-47b0-87b0-000000000041', 2,
    '7b000053-7b00-47b0-87b0-000000000053'
  );
  if v_receipt.replayed or not v_replay.replayed or v_replay.event_id <> v_receipt.event_id then raise exception 'Start/replay failed'; end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000011-7b00-47b0-87b0-000000000011', true);
  perform * from public.assign_task_idempotent(
    '7b000041-7b00-47b0-87b0-000000000041', 3,
    '7b000007-7b00-47b0-87b0-000000000007', 'Coverage handoff',
    '7b000054-7b00-47b0-87b0-000000000054'
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000013-7b00-47b0-87b0-000000000013', true);
  begin
    perform * from public.start_task_idempotent(
      '7b000041-7b00-47b0-87b0-000000000041', 2,
      '7b000053-7b00-47b0-87b0-000000000053'
    );
    raise exception 'Expected former-assignee replay denial';
  exception when sqlstate '42501' then null; end;

  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000011-7b00-47b0-87b0-000000000011', true);
  select * into v_receipt from public.revoke_organization_member_idempotent(
    '7b000006-7b00-47b0-87b0-000000000006', 'Access no longer needed',
    '7b000055-7b00-47b0-87b0-000000000055'
  );
  select * into v_replay from public.revoke_organization_member_idempotent(
    '7b000006-7b00-47b0-87b0-000000000006', 'Access no longer needed',
    '7b000055-7b00-47b0-87b0-000000000055'
  );
  if v_receipt.replayed or not v_replay.replayed or v_replay.event_id <> v_receipt.event_id then raise exception 'Revocation replay failed'; end if;
  if (select count(*) from public.organization_members where id = '7b000006-7b00-47b0-87b0-000000000006' and status = 'revoked') <> 1 then raise exception 'Director lost historical revoked member projection'; end if;

  select created.raw_token into v_token
  from public.create_employee_invitation_idempotent_v2(
    '7b000001-7b00-47b0-87b0-000000000001', 'staff-three@cycle7b.test',
    array['7b000002-7b00-47b0-87b0-000000000002'::uuid],
    'Invitation revocation interaction test', now() + interval '1 day',
    '7b000056-7b00-47b0-87b0-000000000056'
  ) as created;
  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000015-7b00-47b0-87b0-000000000015', true);
  select accepted.organization_member_id into v_invited_member_id
  from public.accept_organization_invitation(v_token) as accepted;
  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000011-7b00-47b0-87b0-000000000011', true);
  perform * from public.revoke_organization_member_idempotent(
    v_invited_member_id, 'Accepted access ended',
    '7b000057-7b00-47b0-87b0-000000000057'
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000015-7b00-47b0-87b0-000000000015', true);
  begin
    perform * from public.accept_organization_invitation(v_token);
    raise exception 'Expected accepted-token replay denial after membership revocation';
  exception when sqlstate '55000' then null; end;
  if (select inspection.invitation_state from public.inspect_organization_invitation(v_token) as inspection) <> 'access_ended' then raise exception 'Inspection did not expose access_ended'; end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000011-7b00-47b0-87b0-000000000011', true);
  select revoked.event_id into v_multi_event_id
  from public.revoke_organization_member_idempotent(
    '7b000008-7b00-47b0-87b0-000000000008', 'Both locations ended',
    '7b000058-7b00-47b0-87b0-000000000058'
  ) as revoked;
  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000012-7b00-47b0-87b0-000000000012', true);
  select count(*)::integer into v_count from public.workflow_events where id = v_multi_event_id;
  if v_count <> 0 then raise exception 'Partial-location director could read multi-location revocation event'; end if;

  perform pg_catalog.set_config('request.jwt.claim.sub', '7b000016-7b00-47b0-87b0-000000000016', true);
  if (select count(*) from public.tasks where organization_id = '7b000001-7b00-47b0-87b0-000000000001') <> 0 then raise exception 'Cross-organization task rows leaked'; end if;

  raise notice 'Cycle 7B assigned-work command and RLS matrix passed';
end
$cycle_7b_tests$;

reset role;
rollback;
