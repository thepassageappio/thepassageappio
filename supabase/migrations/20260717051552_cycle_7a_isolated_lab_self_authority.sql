-- ISOLATED-LAB-ONLY Cycle 7A hosted QA self-authority reads.
--
-- WHAT: expose SELECT on the three legacy authority relations and add three
-- narrowly user-relative policies required by lib/auth/authorization.ts.
-- WHY: the production-shape safety lab is intentionally fail-closed. Hosted
-- director/staff QA needs to resolve only the signed-in user's active
-- membership, organization, and active granted locations.
-- BREAKAGE IF SKIPPED: authenticated hosted sessions remain safely closed and
-- cannot prove the invitation-to-role-landing path.
-- BREAKAGE RISK: these are structural Data API/RLS changes. Apply this migration
-- through Supabase migration tooling only to isolated project
-- uyacxqtsiwlvtmhxvoxr. Never apply it to production project
-- qsveqfchwylsbncsfgxe. The preflight below rejects the known production state
-- and any lab whose expected empty, fail-closed relation shape has drifted.
--
-- This is not the Cycle 7B production authority design. Reversal requires a
-- separate isolated-lab migration which first checks for dependent later lab
-- policies, drops only the three cycle_7a_isolated_lab_* policies, and revokes
-- only the three SELECT grants introduced here.

do $cycle_7a_isolated_lab_preflight$
declare
  v_missing_columns text[];
  v_rls_disabled text[];
  v_policy_count integer;
begin
  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1
       from information_schema.columns
       where table_schema = 'supabase_migrations'
         and table_name = 'schema_migrations'
         and column_name = 'name'
     ) then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A isolated-lab migration refused: Supabase migration history is unavailable';
  end if;

  if not exists (
    select 1
    from supabase_migrations.schema_migrations
    where name = 'test_fixture_cycle_7a_production_shape'
  ) then
    raise exception using
      errcode = '42501',
      message = 'Cycle 7A isolated-lab migration refused: isolated production-shape lab marker is missing';
  end if;

  if to_regclass('public.organizations') is null
     or to_regclass('public.organization_locations') is null
     or to_regclass('public.organization_members') is null
     or to_regclass('public.organization_member_locations') is null
     or to_regclass('public.organization_invitations') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('auth.users') is null then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A isolated-lab migration refused: expected production-shape and foundation relations are missing';
  end if;

  select pg_catalog.array_agg(expected.column_name order by expected.relation_name, expected.column_name)
    into v_missing_columns
  from (
    values
      ('organizations', 'id'),
      ('organization_locations', 'id'),
      ('organization_locations', 'organization_id'),
      ('organization_locations', 'status'),
      ('organization_members', 'id'),
      ('organization_members', 'organization_id'),
      ('organization_members', 'user_id'),
      ('organization_members', 'status'),
      ('organization_member_locations', 'organization_member_id'),
      ('organization_member_locations', 'organization_location_id'),
      ('organization_member_locations', 'revoked_at')
  ) as expected(relation_name, column_name)
  where not exists (
    select 1
    from information_schema.columns as actual
    where actual.table_schema = 'public'
      and actual.table_name = expected.relation_name
      and actual.column_name = expected.column_name
  );

  if v_missing_columns is not null then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A isolated-lab migration refused: required authority columns are missing',
      detail = pg_catalog.array_to_string(v_missing_columns, ', ');
  end if;

  select pg_catalog.array_agg(class_row.relname order by class_row.relname)
    into v_rls_disabled
  from pg_catalog.pg_class as class_row
  join pg_catalog.pg_namespace as namespace_row
    on namespace_row.oid = class_row.relnamespace
  where namespace_row.nspname = 'public'
    and class_row.relname in (
      'organizations',
      'organization_locations',
      'organization_members',
      'organization_member_locations'
    )
    and not class_row.relrowsecurity;

  if v_rls_disabled is not null then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A isolated-lab migration refused: RLS is disabled on an authority relation',
      detail = pg_catalog.array_to_string(v_rls_disabled, ', ');
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'organization_member_locations'
      and policyname = 'organization_member_locations_authorized_select'
      and cmd = 'SELECT'
      and roles @> array['authenticated']::name[]
  ) then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A isolated-lab migration refused: the reviewed member-location foundation policy is missing';
  end if;

  select count(*)
    into v_policy_count
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename in (
      'organizations',
      'organization_locations',
      'organization_members'
    );

  if v_policy_count <> 0 then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A isolated-lab migration refused: target relations are not in the expected fail-closed policy state';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.organizations', 'SELECT')
     or pg_catalog.has_table_privilege('authenticated', 'public.organization_locations', 'SELECT')
     or pg_catalog.has_table_privilege('authenticated', 'public.organization_members', 'SELECT') then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A isolated-lab migration refused: an authenticated SELECT grant already exists on a target relation';
  end if;

  if exists (select 1 from public.organizations)
     or exists (select 1 from public.organization_locations)
     or exists (select 1 from public.organization_members)
     or exists (select 1 from public.organization_member_locations) then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7A isolated-lab migration refused: authority rows already exist; verify the exact isolated target and migration order';
  end if;
end
$cycle_7a_isolated_lab_preflight$;

grant select on table public.organizations to authenticated;
grant select on table public.organization_locations to authenticated;
grant select on table public.organization_members to authenticated;

create policy cycle_7a_isolated_lab_organizations_self_select
  on public.organizations
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members as member_row
      where member_row.organization_id = organizations.id
        and member_row.user_id = (select auth.uid())
        and member_row.status = 'active'
    )
  );

create policy cycle_7a_isolated_lab_locations_self_select
  on public.organization_locations
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and status = 'active'
    and exists (
      select 1
      from public.organization_members as member_row
      join public.organization_member_locations as grant_row
        on grant_row.organization_member_id = member_row.id
       and grant_row.organization_location_id = organization_locations.id
       and grant_row.revoked_at is null
      where member_row.user_id = (select auth.uid())
        and member_row.status = 'active'
    )
  );

create policy cycle_7a_isolated_lab_members_self_select
  on public.organization_members
  for select
  to authenticated
  using (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
    and status = 'active'
  );
