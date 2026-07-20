-- TEST-ONLY Cycle 8 hosted active-staff identity binding.
--
-- WHAT: bind the existing active alternate Cycle 7B staff membership to one
-- supported Auth Admin-created user supplied through a transaction-local UUID.
-- WHY: hosted staff proof submission requires a real authenticated identity;
-- the retained alternate membership intentionally has no Auth identity.
-- BREAKAGE IF SKIPPED: the staff Case Room remains fail-closed and hosted proof
-- submission cannot be verified. This file creates no Auth user and no event.
--
-- DML-only, isolated-lab-only, guarded, atomic, idempotent, and reversible.
-- Execute only after creating exactly one Auth user with the reserved email via
-- the supported Auth Admin path and independently verifying the target project:
--
--   begin;
--   set local passage.fixture_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--   set local passage.fixture_staff_auth_user_id = '<Auth Admin user UUID>';
--   -- execute this file
--   commit;

do $cycle_8_hosted_staff_bind$
declare
  v_expected_ref constant text := 'uyacxqtsiwlvtmhxvoxr';
  v_production_ref constant text := 'qsveqfchwylsbncsfgxe';
  v_organization_id constant uuid := 'c7a00001-7a00-47a0-87a0-000000000001';
  v_location_id constant uuid := 'c7a00002-7a00-47a0-87a0-000000000002';
  v_member_id constant uuid := 'c7b00004-7b00-47b0-87b0-000000000004';
  v_reserved_email constant text := 'avery-cycle7b@passage.test';
  v_ref text := nullif(current_setting('passage.fixture_project_ref', true), '');
  v_user_setting text := nullif(current_setting('passage.fixture_staff_auth_user_id', true), '');
  v_user_id uuid;
  v_existing_user_id uuid;
  v_existing_updated_at timestamptz;
  v_before_digest text;
  v_after_digest text;
  v_changed integer;
begin
  if v_ref is null then
    raise exception 'Cycle 8 staff binding refused: independently attest the target project'
      using errcode = '22023';
  end if;
  if v_ref = v_production_ref or v_ref <> v_expected_ref then
    raise exception 'Cycle 8 staff binding refused: only the isolated project is allowed'
      using errcode = '42501';
  end if;
  if session_user <> 'postgres' or current_user <> 'postgres' then
    raise exception 'Cycle 8 staff binding refused: isolated-lab postgres role required'
      using errcode = '42501';
  end if;
  if v_user_setting is null then
    raise exception 'Cycle 8 staff binding refused: transaction-local Auth user UUID is required'
      using errcode = '22023';
  end if;
  begin
    v_user_id := v_user_setting::uuid;
  exception when invalid_text_representation then
    raise exception 'Cycle 8 staff binding refused: Auth user UUID is invalid'
      using errcode = '22023';
  end;

  if to_regclass('auth.users') is null
     or to_regclass('public.organization_members') is null
     or to_regclass('public.organization_member_locations') is null
     or to_regclass('public.task_proofs') is null
     or to_regclass('public.task_proof_reviews') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7b_assigned_work'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_8_task_proof_loop'
     ) then
    raise exception 'Cycle 8 staff binding refused: reviewed schema is incomplete'
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
         where organization_id = v_organization_id and status = 'active') <> 2
     or (select count(*) from public.organization_members
         where organization_id = v_organization_id and status = 'revoked') <> 1
     or (select count(*) from public.organization_member_locations as grant_row
         join public.organization_members as member_row
           on member_row.id = grant_row.organization_member_id
         where member_row.organization_id = v_organization_id
           and grant_row.revoked_at is null) <> 2
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
    raise exception 'Cycle 8 staff binding refused: retained isolated manifest drifted'
      using errcode = '42501';
  end if;

  if (select count(*) from auth.users where id = v_user_id) <> 1
     or (select count(*) from auth.users
         where lower(btrim(email)) = v_reserved_email) <> 1
     or not exists (
       select 1 from auth.users
       where id = v_user_id and lower(btrim(email)) = v_reserved_email
     ) then
    raise exception 'Cycle 8 staff binding refused: supplied Auth identity is missing or does not own the reserved email'
      using errcode = '42501';
  end if;

  if exists (
       select 1 from auth.users
       where id <> v_user_id and lower(btrim(email)) = v_reserved_email
     )
     or exists (
       select 1 from public.organization_members
       where id <> v_member_id
         and (user_id = v_user_id or lower(btrim(email)) = v_reserved_email)
     )
     or not exists (
       select 1 from public.organization_members
       where id = v_member_id
         and organization_id = v_organization_id
         and lower(btrim(email)) = v_reserved_email
         and role = 'staff'
         and status = 'active'
         and display_name = 'Avery Brooks'
         and title = 'Care coordinator'
         and revoked_at is null
         and revoked_by_user_id is null
         and revocation_reason is null
     )
     or (select count(*) from public.organization_member_locations
         where organization_member_id = v_member_id
           and organization_location_id = v_location_id
           and revoked_at is null) <> 1 then
    raise exception 'Cycle 8 staff binding refused: reserved member, email, user, or location identity collided'
      using errcode = '23505';
  end if;

  select md5(string_agg(snapshot.entity || ':' || snapshot.row_id || ':' || snapshot.body,
                        E'\n' order by snapshot.entity, snapshot.row_id))
    into v_before_digest
  from (
    select 'organization'::text entity, id::text row_id,
           to_jsonb(row_data)::text body
    from public.organizations row_data
    union all
    select 'location', id::text, to_jsonb(row_data)::text
    from public.organization_locations row_data
    union all
    select 'member', id::text,
           (case when id = v_member_id
             then to_jsonb(row_data) - 'updated_at' - 'user_id'
             else to_jsonb(row_data)
           end)::text
    from public.organization_members row_data
    union all
    select 'member_location', organization_member_id::text || ':' || organization_location_id::text,
           to_jsonb(row_data)::text
    from public.organization_member_locations row_data
    union all
    select 'workflow', id::text, to_jsonb(row_data)::text
    from public.workflows row_data
    union all
    select 'task', id::text, to_jsonb(row_data)::text
    from public.tasks row_data
    union all
    select 'event', id::text, to_jsonb(row_data)::text
    from public.workflow_events row_data
    union all
    select 'invitation', id::text, to_jsonb(row_data)::text
    from public.organization_invitations row_data
    union all
    select 'invitation_location', invitation_id::text || ':' || organization_location_id::text,
           to_jsonb(row_data)::text
    from public.organization_invitation_locations row_data
  ) snapshot;

  select user_id, updated_at
    into strict v_existing_user_id, v_existing_updated_at
  from public.organization_members
  where id = v_member_id
  for update;

  if v_existing_user_id is null then
    update public.organization_members
    set user_id = v_user_id,
        updated_at = pg_catalog.clock_timestamp()
    where id = v_member_id and user_id is null;
    get diagnostics v_changed = row_count;
    if v_changed <> 1 then
      raise exception 'Cycle 8 staff binding refused: concurrent identity change detected'
        using errcode = '40001';
    end if;
  elsif v_existing_user_id <> v_user_id then
    raise exception 'Cycle 8 staff binding refused: membership is already bound to a different Auth user'
      using errcode = '23505';
  end if;

  if (select count(*) from public.organization_members
      where id = v_member_id and user_id = v_user_id) <> 1 then
    raise exception 'Cycle 8 staff binding postcondition failed; transaction must roll back';
  end if;
  if v_existing_user_id = v_user_id
     and (select updated_at from public.organization_members where id = v_member_id)
         is distinct from v_existing_updated_at then
    raise exception 'Cycle 8 staff binding replay changed the original receipt timestamp';
  end if;

  select md5(string_agg(snapshot.entity || ':' || snapshot.row_id || ':' || snapshot.body,
                        E'\n' order by snapshot.entity, snapshot.row_id))
    into v_after_digest
  from (
    select 'organization'::text entity, id::text row_id,
           to_jsonb(row_data)::text body
    from public.organizations row_data
    union all
    select 'location', id::text, to_jsonb(row_data)::text
    from public.organization_locations row_data
    union all
    select 'member', id::text,
           (case when id = v_member_id
             then to_jsonb(row_data) - 'updated_at' - 'user_id'
             else to_jsonb(row_data)
           end)::text
    from public.organization_members row_data
    union all
    select 'member_location', organization_member_id::text || ':' || organization_location_id::text,
           to_jsonb(row_data)::text
    from public.organization_member_locations row_data
    union all
    select 'workflow', id::text, to_jsonb(row_data)::text
    from public.workflows row_data
    union all
    select 'task', id::text, to_jsonb(row_data)::text
    from public.tasks row_data
    union all
    select 'event', id::text, to_jsonb(row_data)::text
    from public.workflow_events row_data
    union all
    select 'invitation', id::text, to_jsonb(row_data)::text
    from public.organization_invitations row_data
    union all
    select 'invitation_location', invitation_id::text || ':' || organization_location_id::text,
           to_jsonb(row_data)::text
    from public.organization_invitation_locations row_data
  ) snapshot;

  if v_after_digest is distinct from v_before_digest then
    raise exception 'Cycle 8 staff binding changed retained data outside the permitted Auth binding';
  end if;
end
$cycle_8_hosted_staff_bind$;

-- GUARDED UNBIND (only after hosted proof/review evidence has been cleaned up)
--
-- This returns only the alternate membership's Auth binding to its retained
-- pre-Cycle-8 state. It does not delete the Auth user, membership, grant, task,
-- workflow, invitation, or event. Remove/disable the synthetic Auth user later
-- through the supported Auth Admin path, never with this DML fixture.
--
--   begin;
--   set local passage.fixture_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--   set local passage.fixture_staff_auth_user_id = '<same Auth user UUID>';
--   set local passage.fixture_reset = 'cycle_8_hosted_active_staff_identity';
--   do $unbind$
--   declare
--     v_user_id uuid := current_setting('passage.fixture_staff_auth_user_id')::uuid;
--     v_changed integer;
--   begin
--     if session_user <> 'postgres' or current_user <> 'postgres'
--        or current_setting('passage.fixture_project_ref', true) <> 'uyacxqtsiwlvtmhxvoxr'
--        or current_setting('passage.fixture_project_ref', true) = 'qsveqfchwylsbncsfgxe'
--        or current_setting('passage.fixture_reset', true) <> 'cycle_8_hosted_active_staff_identity'
--        or not exists (select 1 from auth.users where id = v_user_id and lower(btrim(email)) = 'avery-cycle7b@passage.test')
--        or exists (select 1 from public.task_proofs)
--        or exists (select 1 from public.task_proof_reviews)
--        or (select count(*) from public.workflow_events) <> 8 then
--       raise exception 'Cycle 8 staff unbind refused: exact isolated cleanup boundary is not satisfied';
--     end if;
--     update public.organization_members
--     set user_id = null, updated_at = pg_catalog.clock_timestamp()
--     where id = 'c7b00004-7b00-47b0-87b0-000000000004'
--       and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
--       and lower(btrim(email)) = 'avery-cycle7b@passage.test'
--       and role = 'staff' and status = 'active' and user_id = v_user_id;
--     get diagnostics v_changed = row_count;
--     if v_changed <> 1 then
--       raise exception 'Cycle 8 staff unbind refused: expected exact binding was not found';
--     end if;
--   end
--   $unbind$;
--   commit;
