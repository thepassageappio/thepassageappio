-- Cycle 7B advisor hardening - isolated lab only.
--
-- What changes:
-- 1. Index organization_members.revoked_by_user_id for its new foreign key.
-- 2. Replace the three overlapping authenticated SELECT policies on
--    organization_members with one equivalent authority predicate.
--
-- Why the frontend needs it:
-- Team and revoked-access projections query organization_members on every
-- director/staff request. The index keeps revocation lookups supported, while
-- one policy avoids evaluating overlapping permissive policies for each row.
--
-- What breaks if skipped:
-- Authority remains fail-closed, but the empty pilot lab retains Supabase
-- advisor warnings and avoidable per-row policy/index overhead.

do $cycle_7b_advisor_preflight$
declare
  v_policy_names text[];
begin
  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'test_fixture_cycle_7a_production_shape'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7a_isolated_lab_self_authority'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7b_assigned_work'
     ) then
    raise exception using
      errcode = '42501',
      message = 'Cycle 7B advisor hardening refused: isolated lab migration markers are missing';
  end if;

  if to_regclass('public.organization_members') is null
     or to_regprocedure('passage_private.can_view_team_member(uuid)') is null
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'organization_members'
         and column_name = 'revoked_by_user_id'
         and data_type = 'uuid'
     )
     or not exists (
       select 1
       from pg_catalog.pg_class as class_row
       join pg_catalog.pg_namespace as namespace_row
         on namespace_row.oid = class_row.relnamespace
       where namespace_row.nspname = 'public'
         and class_row.relname = 'organization_members'
         and class_row.relrowsecurity
     ) then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7B advisor hardening refused: reviewed RLS foundation has drifted';
  end if;

  select coalesce(
    pg_catalog.array_agg(policyname::text order by policyname::text),
    array[]::text[]
  )
    into v_policy_names
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename = 'organization_members';

  if v_policy_names <> array[
       'cycle_7a_isolated_lab_members_self_select',
       'cycle_7b_members_manager_select',
       'cycle_7b_members_revoked_self_select'
     ]::text[]
     and v_policy_names <> array[
       'cycle_7b_members_authorized_select'
     ]::text[] then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7B advisor hardening refused: organization_members policy set has drifted',
      detail = pg_catalog.array_to_string(v_policy_names, ', ');
  end if;
end
$cycle_7b_advisor_preflight$;

create index if not exists organization_members_revoked_by_user_id_idx
  on public.organization_members (revoked_by_user_id)
  where revoked_by_user_id is not null;

drop policy if exists cycle_7a_isolated_lab_members_self_select
  on public.organization_members;
drop policy if exists cycle_7b_members_manager_select
  on public.organization_members;
drop policy if exists cycle_7b_members_revoked_self_select
  on public.organization_members;
drop policy if exists cycle_7b_members_authorized_select
  on public.organization_members;

create policy cycle_7b_members_authorized_select
  on public.organization_members
  for select
  to authenticated
  using (
    (
      (select auth.uid()) is not null
      and user_id = (select auth.uid())
      and status in ('active', 'revoked')
    )
    or passage_private.can_view_team_member(id)
  );
