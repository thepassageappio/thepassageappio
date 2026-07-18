-- TEST-ONLY Cycle 7A hosted Auth personas.
--
-- WHAT: seed one synthetic Northstar organization, one Portland location, one
-- Auth-bound director membership, and its one relational location grant.
-- WHY: the isolated production-shape lab is intentionally fail-closed. A real
-- hosted director needs this narrow authority before the authenticated invite
-- RPC can prove director -> invited employee acceptance in two browser sessions.
-- BREAKAGE IF SKIPPED: the bound preview remains safely closed at /director and
-- cannot exercise the real invitation transaction or role landing.
--
-- Structural self-authority reads are installed separately by the lab-only
-- migration 20260717051552_cycle_7a_isolated_lab_self_authority.sql. This
-- project-guarded fixture is idempotent, reversible, and DML-only; it must never
-- be added to Supabase migration history. It contains no family,
-- participant, vendor, customer, case, task, password, service key, bearer
-- token, raw invitation token, or external-delivery instruction.

-- REQUIRED EXECUTION CHECKLIST (seed)
--
-- 1. In the Supabase connector/dashboard, verify the selected target project is
--    exactly uyacxqtsiwlvtmhxvoxr (passage-cycle-7a-test). Stop if the target is
--    production qsveqfchwylsbncsfgxe or cannot be independently identified.
-- 2. Verify the production-shape fixture and all Cycle 7A migrations, including
--    the invitation conflict correction and isolated-lab self-authority
--    migration, are already present in the lab.
-- 3. Create exactly one cycle7a-director@passage.test Auth user through the
--    supported isolated-project Auth Admin path. Do not insert auth.users here.
-- 4. Execute this whole file in the same transaction after setting the required
--    transaction-local attestation (the file fails closed without it):
--
--      begin;
--      set local passage.fixture_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--      -- execute this file here
--      commit;
--
-- 5. Create cycle7a-staff@passage.test through Auth Admin separately. Create the
--    invitation as the authenticated director and accept it as that staff user
--    through the real create/accept RPCs. Never seed the staff membership,
--    member-location row, accepted invitation, or acceptance event.
-- 6. Retain redacted evidence, then use the ordered cleanup block at the bottom.

do $cycle_7a_hosted_project_guard$
declare
  v_expected_project_ref constant text := 'uyacxqtsiwlvtmhxvoxr';
  v_production_project_ref constant text := 'qsveqfchwylsbncsfgxe';
  v_attested_project_ref text := nullif(
    current_setting('passage.fixture_project_ref', true),
    ''
  );
begin
  if v_attested_project_ref is null then
    raise exception using
      errcode = '22023',
      message = 'Cycle 7A hosted fixture refused: set the transaction-local project ref after independently verifying the connector target';
  end if;

  if v_attested_project_ref = v_production_project_ref then
    raise exception using
      errcode = '42501',
      message = 'Cycle 7A hosted fixture refused: production project ref is prohibited';
  end if;

  if v_attested_project_ref <> v_expected_project_ref then
    raise exception using
      errcode = '42501',
      message = 'Cycle 7A hosted fixture refused: target is not the isolated Cycle 7A lab';
  end if;
end
$cycle_7a_hosted_project_guard$;

do $cycle_7a_hosted_schema_and_collision_guard$
declare
  v_organization_id constant uuid := 'c7a00001-7a00-47a0-87a0-000000000001';
  v_location_id constant uuid := 'c7a00002-7a00-47a0-87a0-000000000002';
  v_director_member_id constant uuid := 'c7a00003-7a00-47a0-87a0-000000000003';
  v_director_email constant text := 'cycle7a-director@passage.test';
  v_director_user_id uuid;
  v_count integer;
begin
  if to_regclass('public.organizations') is null
     or to_regclass('public.organization_locations') is null
     or to_regclass('public.organization_members') is null
     or to_regclass('public.organization_member_locations') is null
     or to_regclass('public.organization_invitations') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('auth.users') is null then
    raise exception 'Cycle 7A hosted fixture refused: expected production-shape and Cycle 7A relations are missing';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and (
        (tablename = 'organizations'
         and policyname = 'cycle_7a_isolated_lab_organizations_self_select')
        or (tablename = 'organization_locations'
            and policyname = 'cycle_7a_isolated_lab_locations_self_select')
        or (tablename = 'organization_members'
            and policyname = 'cycle_7a_isolated_lab_members_self_select')
      )
      and cmd = 'SELECT'
      and roles @> array['authenticated']::name[]
  ) <> 3
     or not pg_catalog.has_table_privilege(
       'authenticated',
       'public.organizations',
       'SELECT'
     )
     or not pg_catalog.has_table_privilege(
       'authenticated',
       'public.organization_locations',
       'SELECT'
     )
     or not pg_catalog.has_table_privilege(
       'authenticated',
       'public.organization_members',
       'SELECT'
     ) then
    raise exception 'Cycle 7A hosted fixture refused: isolated-lab self-authority migration is missing or incomplete';
  end if;

  select count(*)
    into v_count
  from auth.users
  where lower(email) = v_director_email;

  if v_count <> 1 then
    raise exception
      'Cycle 7A hosted fixture refused: expected exactly one supported Auth Admin user for %, found %',
      v_director_email,
      v_count;
  end if;

  select id
    into strict v_director_user_id
  from auth.users
  where lower(email) = v_director_email;

  if exists (
    select 1 from public.organizations as organization_row
    where organization_row.id = v_organization_id
      and organization_row.name <> 'Northstar Funeral Home - Cycle 7A QA'
  ) or exists (
    select 1 from public.organizations as organization_row
    where organization_row.id <> v_organization_id
      and organization_row.name = 'Northstar Funeral Home - Cycle 7A QA'
  ) then
    raise exception 'Cycle 7A hosted fixture refused: reserved organization identity collided with another row';
  end if;

  if exists (
    select 1 from public.organization_locations as location_row
    where location_row.id = v_location_id
      and (
        location_row.organization_id <> v_organization_id
        or location_row.name <> 'Portland - Cycle 7A QA'
      )
  ) or exists (
    select 1 from public.organization_locations as location_row
    where location_row.id <> v_location_id
      and location_row.organization_id = v_organization_id
      and location_row.name = 'Portland - Cycle 7A QA'
  ) then
    raise exception 'Cycle 7A hosted fixture refused: reserved location identity collided with another row';
  end if;

  if exists (
    select 1 from public.organization_members as member_row
    where member_row.id = v_director_member_id
      and (
        member_row.organization_id <> v_organization_id
        or member_row.user_id is distinct from v_director_user_id
        or lower(member_row.email) <> v_director_email
        or member_row.role <> 'director'
      )
  ) or exists (
    select 1 from public.organization_members as member_row
    where member_row.id <> v_director_member_id
      and (
        member_row.user_id = v_director_user_id
        or lower(member_row.email) = v_director_email
      )
  ) then
    raise exception 'Cycle 7A hosted fixture refused: reserved director authority collided with another membership';
  end if;
end
$cycle_7a_hosted_schema_and_collision_guard$;

insert into public.organizations (id, name)
values (
  'c7a00001-7a00-47a0-87a0-000000000001',
  'Northstar Funeral Home - Cycle 7A QA'
)
on conflict (id) do update
set name = excluded.name,
    updated_at = now();

insert into public.organization_locations (
  id,
  organization_id,
  name,
  status
)
values (
  'c7a00002-7a00-47a0-87a0-000000000002',
  'c7a00001-7a00-47a0-87a0-000000000001',
  'Portland - Cycle 7A QA',
  'active'
)
on conflict (id) do update
set organization_id = excluded.organization_id,
    name = excluded.name,
    status = excluded.status,
    updated_at = now();

insert into public.organization_members (
  id,
  organization_id,
  user_id,
  email,
  role,
  status,
  display_name,
  title,
  location_scope,
  accepted_at
)
select
  'c7a00003-7a00-47a0-87a0-000000000003',
  'c7a00001-7a00-47a0-87a0-000000000001',
  user_row.id,
  'cycle7a-director@passage.test',
  'director',
  'active',
  'Elena Cycle 7A',
  'Funeral home director',
  null,
  null
from auth.users as user_row
where lower(user_row.email) = 'cycle7a-director@passage.test'
on conflict (id) do update
set organization_id = excluded.organization_id,
    user_id = excluded.user_id,
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    display_name = excluded.display_name,
    title = excluded.title,
    location_scope = null,
    accepted_at = null,
    updated_at = now();

insert into public.organization_member_locations (
  organization_member_id,
  organization_location_id,
  granted_by_user_id
)
select
  'c7a00003-7a00-47a0-87a0-000000000003',
  'c7a00002-7a00-47a0-87a0-000000000002',
  user_row.id
from auth.users as user_row
where lower(user_row.email) = 'cycle7a-director@passage.test'
on conflict on constraint organization_member_locations_pkey do update
set revoked_at = null,
    granted_by_user_id = excluded.granted_by_user_id;

do $cycle_7a_hosted_postcondition$
declare
  v_director_user_id uuid;
begin
  select id into strict v_director_user_id
  from auth.users
  where lower(email) = 'cycle7a-director@passage.test';

  if (select count(*) from public.organizations
      where id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.organization_locations
         where id = 'c7a00002-7a00-47a0-87a0-000000000002'
           and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and status = 'active') <> 1
     or (select count(*) from public.organization_members
         where id = 'c7a00003-7a00-47a0-87a0-000000000003'
           and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and user_id = v_director_user_id
           and email = 'cycle7a-director@passage.test'
           and role = 'director'
           and status = 'active') <> 1
     or (select count(*) from public.organization_member_locations
         where organization_member_id = 'c7a00003-7a00-47a0-87a0-000000000003'
           and organization_location_id = 'c7a00002-7a00-47a0-87a0-000000000002'
           and revoked_at is null) <> 1 then
    raise exception 'Cycle 7A hosted fixture postcondition failed; transaction must roll back';
  end if;
end
$cycle_7a_hosted_postcondition$;

-- ORDERED CLEANUP (run only after retaining redacted QA evidence)
--
-- This cleanup intentionally removes the staff membership/invitation/event that
-- the real RPC may have produced; the seed section above never creates them.
-- Verify the same isolated target again and run the following as one transaction.
-- The workflow/task assertion prevents deleting a synthetic organization after
-- later Cycle 7B/8 fixtures have attached operational data to it.
--
--   begin;
--   set local passage.fixture_project_ref = 'uyacxqtsiwlvtmhxvoxr';
--
--   do $cleanup_project_guard$
--   declare
--     v_ref text := nullif(current_setting('passage.fixture_project_ref', true), '');
--   begin
--     if v_ref = 'qsveqfchwylsbncsfgxe' or v_ref <> 'uyacxqtsiwlvtmhxvoxr' then
--       raise exception 'Cycle 7A hosted cleanup refused: wrong project';
--     end if;
--     if exists (
--       select 1 from public.workflows
--       where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
--     ) or exists (
--       select 1 from public.tasks
--       where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
--     ) then
--       raise exception 'Cycle 7A hosted cleanup refused: later workflow/task data exists';
--     end if;
--   end
--   $cleanup_project_guard$;
--
--   delete from public.workflow_events
--   where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001';
--
--   delete from public.organization_invitations
--   where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001';
--
--   delete from public.organization_members
--   where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001';
--
--   delete from public.organization_locations
--   where id = 'c7a00002-7a00-47a0-87a0-000000000002'
--     and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001';
--
--   delete from public.organizations
--   where id = 'c7a00001-7a00-47a0-87a0-000000000001';
--
--   commit;
--
-- Auth users are owned by Supabase Auth. Remove/disable the two synthetic users
-- through the supported Auth Admin path only after session/evidence retention.
