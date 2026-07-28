-- ISOLATED-LAB-ONLY forward ACL repair for the staff reviewer-name helper.
--
-- Migration 20260726222505 correctly added a fixed-search-path private
-- SECURITY DEFINER helper and a task-assignment-derived member projection,
-- but PostgreSQL granted EXECUTE to PUBLIC when the function was created.
-- Granting authenticated afterwards did not remove that default privilege.
--
-- This migration changes no business data and does not widen the RLS
-- predicate. It first aligns the helper with can_view_task by requiring an
-- active grant on the assigned task's exact workflow location. It then removes
-- PUBLIC/anon/service_role execution and preserves only the authenticated
-- execution required by organization_members SELECT RLS.
-- Apply only to isolated project uyacxqtsiwlvtmhxvoxr after independent QA.
-- Never apply to production project qsveqfchwylsbncsfgxe.

do $staff_proof_reviewer_acl_preflight$
declare
  v_search_path text;
begin
  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'staff_proof_reviewer_visibility'
     ) then
    raise exception using
      errcode = '42501',
      message = 'Reviewer ACL repair refused: required applied migration marker is missing';
  end if;

  if to_regprocedure(
       'passage_private.can_view_proof_reviewer(uuid)'
     ) is null
     or not exists (
       select 1
       from pg_catalog.pg_policies
       where schemaname = 'public'
         and tablename = 'organization_members'
         and policyname = 'cycle_7b_members_authorized_select'
     )
     or not exists (
       select 1
       from public.organizations
       where id = 'c7a00001-7a00-47a0-87a0-000000000001'
     ) then
    raise exception using
      errcode = '55000',
      message = 'Reviewer ACL repair refused: isolated reviewer-visibility foundation drifted';
  end if;

  select array_to_string(p.proconfig, ',')
    into v_search_path
  from pg_catalog.pg_proc as p
  where p.oid =
    'passage_private.can_view_proof_reviewer(uuid)'::regprocedure
    and p.prosecdef;

  if v_search_path is null
     or v_search_path not like '%search_path=%' then
    raise exception using
      errcode = '55000',
      message = 'Reviewer ACL repair refused: helper is not fixed-search-path SECURITY DEFINER';
  end if;
end
$staff_proof_reviewer_acl_preflight$;

create or replace function passage_private.can_view_proof_reviewer(
  p_member_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.task_proof_reviews as review
    join public.tasks as task_row
      on task_row.id = review.task_id
    join public.workflows as workflow_row
      on workflow_row.id = task_row.workflow_id
     and workflow_row.organization_id = task_row.organization_id
    join public.organization_members as viewer
      on viewer.id = task_row.assigned_organization_member_id
     and viewer.organization_id = task_row.organization_id
    join public.organization_member_locations as viewer_grant
      on viewer_grant.organization_member_id = viewer.id
     and viewer_grant.organization_location_id =
         workflow_row.organization_location_id
     and viewer_grant.revoked_at is null
    where review.reviewed_by_organization_member_id = p_member_id
      and workflow_row.organization_location_id is not null
      and viewer.user_id = (select auth.uid())
      and viewer.status = 'active'
      and viewer.role = 'staff'
  )
$function$;

revoke all
on function passage_private.can_view_proof_reviewer(uuid)
from public, anon, service_role;

grant execute
on function passage_private.can_view_proof_reviewer(uuid)
to authenticated;
