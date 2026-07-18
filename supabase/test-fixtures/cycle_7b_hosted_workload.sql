-- TEST-ONLY Cycle 7B hosted workload fixture.
--
-- Project-guarded, idempotent, reversible, and DML-only. Apply only after the
-- real Cycle 7A director -> staff invitation has been accepted and its exact
-- cardinality evidence retained. This fixture adds synthetic workload and one
-- non-login alternate staff member so assignment, reassignment, no-orphan
-- revocation, assigned-only reads, and append-only activity can be proved.
-- It creates no Auth users and contains no family access grants, live customer
-- data, external delivery instructions, secrets, or raw invitation tokens.
--
-- Execute as one transaction against isolated project uyacxqtsiwlvtmhxvoxr:
--   begin;
--   set local passage.fixture_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--   -- execute this file
--   commit;

do $cycle_7b_hosted_guard$
declare
  v_ref text := nullif(current_setting('passage.fixture_project_ref', true), '');
begin
  if v_ref is null then
    raise exception 'Cycle 7B fixture refused: independently attest the target project'
      using errcode = '22023';
  end if;
  if v_ref = 'qsveqfchwylsbncsfgxe' or v_ref <> 'uyacxqtsiwlvtmhxvoxr' then
    raise exception 'Cycle 7B fixture refused: only the isolated project is allowed'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from supabase_migrations.schema_migrations
    where name = 'cycle_7b_assigned_work'
  )
     or to_regprocedure('public.assign_task_idempotent(uuid,integer,uuid,text,uuid)') is null
     or to_regprocedure('public.start_task_idempotent(uuid,integer,uuid)') is null
     or to_regprocedure('public.revoke_organization_member_idempotent(uuid,text,uuid)') is null then
    raise exception 'Cycle 7B fixture refused: reviewed migration is missing'
      using errcode = '55000';
  end if;
end
$cycle_7b_hosted_guard$;

do $cycle_7b_hosted_persona_guard$
begin
  if (select count(*) from public.organization_members
      where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
        and email = 'cycle7a-director@passage.test'
        and role = 'director' and status = 'active') <> 1
     or (select count(*) from public.organization_members
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and email = 'cycle7a-staff@passage.test'
           and user_id is not null and role = 'staff' and status = 'active') <> 1
     or (select count(*) from public.organization_member_locations as ml
         join public.organization_members as m on m.id = ml.organization_member_id
         where m.email = 'cycle7a-staff@passage.test'
           and ml.organization_location_id = 'c7a00002-7a00-47a0-87a0-000000000002'
           and ml.revoked_at is null) <> 1 then
    raise exception 'Cycle 7B fixture refused: retain and prove the real accepted Cycle 7A staff authority first'
      using errcode = '55000';
  end if;
end
$cycle_7b_hosted_persona_guard$;

insert into public.organization_members (
  id, organization_id, user_id, email, role, status,
  display_name, title, location_scope, accepted_at
) values (
  'c7b00004-7b00-47b0-87b0-000000000004',
  'c7a00001-7a00-47a0-87a0-000000000001',
  null,
  'avery-cycle7b@passage.test',
  'staff',
  'active',
  'Avery Brooks',
  'Care coordinator',
  null,
  pg_catalog.clock_timestamp()
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  user_id = null,
  email = excluded.email,
  role = excluded.role,
  status = excluded.status,
  display_name = excluded.display_name,
  title = excluded.title,
  location_scope = null,
  accepted_at = excluded.accepted_at,
  revoked_at = null,
  revoked_by_user_id = null,
  revocation_reason = null,
  updated_at = pg_catalog.clock_timestamp();

insert into public.organization_member_locations (
  organization_member_id, organization_location_id, granted_by_user_id
)
select
  'c7b00004-7b00-47b0-87b0-000000000004',
  'c7a00002-7a00-47a0-87a0-000000000002',
  director.user_id
from public.organization_members as director
where director.id = 'c7a00003-7a00-47a0-87a0-000000000003'
on conflict on constraint organization_member_locations_pkey do update set
  revoked_at = null,
  granted_by_user_id = excluded.granted_by_user_id;

insert into public.workflows (
  id, organization_id, organization_location_id,
  accountable_organization_member_id, case_reference,
  family_name, person_name, phase, status
) values
  (
    'c7b10001-7b00-47b0-87b0-000000000001',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'c7a00002-7a00-47a0-87a0-000000000002',
    'c7a00003-7a00-47a0-87a0-000000000003',
    'NS-2051', 'Rivera', 'Sofia Rivera',
    'Arrangement coordination', 'active'
  ),
  (
    'c7b10002-7b00-47b0-87b0-000000000002',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'c7a00002-7a00-47a0-87a0-000000000002',
    'c7a00003-7a00-47a0-87a0-000000000003',
    'NS-2053', 'Williams', 'Jordan Williams',
    'Keepsake review', 'active'
  )
on conflict (id) do update set
  organization_id = excluded.organization_id,
  organization_location_id = excluded.organization_location_id,
  accountable_organization_member_id = excluded.accountable_organization_member_id,
  case_reference = excluded.case_reference,
  family_name = excluded.family_name,
  person_name = excluded.person_name,
  phase = excluded.phase,
  status = excluded.status,
  updated_at = pg_catalog.clock_timestamp();

insert into public.tasks (
  id, workflow_id, organization_id, assigned_organization_member_id,
  title, status, waiting_party, due_at, audience, automation_level,
  prepared_output, human_action, proof_destination, next_state, version
) values
  (
    'c7b20001-7b00-47b0-87b0-000000000001',
    'c7b10001-7b00-47b0-87b0-000000000001',
    'c7a00001-7a00-47a0-87a0-000000000001',
    null,
    'Confirm the arrangement meeting with Maya Rivera.',
    'assigned', 'Maya Rivera',
    date_trunc('day', pg_catalog.clock_timestamp()) + interval '1 day 10 hours 30 minutes',
    'Rivera family coordinator', 'semi_automated',
    'Passage prepared a meeting-confirmation draft for review. Nothing was sent.',
    'Confirm the meeting time and start the coordinated work.',
    'Arrangement activity and family acknowledgment',
    'in_progress with the assigned staff member', 1
  ),
  (
    'c7b20002-7b00-47b0-87b0-000000000002',
    'c7b10001-7b00-47b0-87b0-000000000001',
    'c7a00001-7a00-47a0-87a0-000000000001',
    null,
    'Confirm the receiving location before transport dispatch.',
    'assigned', 'Transport team',
    date_trunc('day', pg_catalog.clock_timestamp()) + interval '1 day 11 hours 15 minutes',
    'Northstar case team', 'manual',
    'No message is prepared. Passage will preserve the selected owner and activity receipt.',
    'Confirm the destination and start the work.',
    'Transport coordination activity',
    'in_progress with the assigned staff member', 1
  ),
  (
    'c7b20003-7b00-47b0-87b0-000000000003',
    'c7b10002-7b00-47b0-87b0-000000000002',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'c7b00004-7b00-47b0-87b0-000000000004',
    'Review keepsake artwork and record family approval.',
    'assigned', 'Williams family',
    date_trunc('day', pg_catalog.clock_timestamp()) + interval '1 day 13 hours 45 minutes',
    'Williams family coordinator', 'manual',
    'No output is sent automatically.',
    'Review the artwork with the family and start the work.',
    'Keepsake activity and family approval',
    'in_progress with the assigned staff member', 1
  )
on conflict (id) do update set
  workflow_id = excluded.workflow_id,
  organization_id = excluded.organization_id,
  assigned_organization_member_id = excluded.assigned_organization_member_id,
  title = excluded.title,
  status = excluded.status,
  waiting_party = excluded.waiting_party,
  due_at = excluded.due_at,
  audience = excluded.audience,
  automation_level = excluded.automation_level,
  prepared_output = excluded.prepared_output,
  human_action = excluded.human_action,
  proof_destination = excluded.proof_destination,
  next_state = excluded.next_state,
  version = excluded.version,
  updated_at = pg_catalog.clock_timestamp();

do $cycle_7b_hosted_postcondition$
begin
  if (select count(*) from public.workflows
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
     or (select count(*) from public.organization_member_locations
         where organization_member_id = 'c7b00004-7b00-47b0-87b0-000000000004'
           and organization_location_id = 'c7a00002-7a00-47a0-87a0-000000000002'
           and revoked_at is null) <> 1 then
    raise exception 'Cycle 7B hosted fixture postcondition failed; transaction must roll back';
  end if;
end
$cycle_7b_hosted_postcondition$;

-- ORDERED CLEANUP (isolated project only, after retaining evidence)
--   begin;
--   set local passage.fixture_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--   set local passage.fixture_reset = 'cycle_7b_isolated_lab';
--   do $guard$ begin
--     if current_setting('passage.fixture_project_ref', true) <> 'uyacxqtsiwlvtmhxvoxr'
--        or current_setting('passage.fixture_project_ref', true) = 'qsveqfchwylsbncsfgxe' then
--       raise exception 'Cycle 7B cleanup refused: wrong project';
--     end if;
--   end $guard$;
--   delete from public.workflow_events
--     where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
--       and (workflow_id in (
--         'c7b10001-7b00-47b0-87b0-000000000001',
--         'c7b10002-7b00-47b0-87b0-000000000002'
--       ) or name = 'organization_member.revoked');
--   delete from public.tasks where id in (
--     'c7b20001-7b00-47b0-87b0-000000000001',
--     'c7b20002-7b00-47b0-87b0-000000000002',
--     'c7b20003-7b00-47b0-87b0-000000000003'
--   );
--   delete from public.workflows where id in (
--     'c7b10001-7b00-47b0-87b0-000000000001',
--     'c7b10002-7b00-47b0-87b0-000000000002'
--   );
--   delete from public.organization_members
--     where id = 'c7b00004-7b00-47b0-87b0-000000000004';
--   commit;
