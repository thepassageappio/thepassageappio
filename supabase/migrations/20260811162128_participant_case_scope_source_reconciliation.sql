-- Passage Zero participant case scope source reconciliation.
--
-- The isolated project already carries participant_updates_case_scope, but that
-- migration was absent from greenfield source. Without this replacement, a clean
-- source replay leaves every active continuity participant inside the raw
-- workflow, task, proof, review, and case-event SELECT predicates added by
-- 20260726040000_family_case_workflow_grant.sql.
--
-- Raw case records remain available to the continuity-space owner. An active
-- participant with updates scope receives only the bounded projection exposed by
-- public.get_family_case_update_for_workflow(uuid). No row data is changed.

begin;

do $$
begin
  if to_regclass('public.workflows') is null
     or to_regclass('public.continuity_spaces') is null
     or to_regclass('public.continuity_participants') is null
     or to_regprocedure('passage_private.can_view_workflow_as_family(uuid)') is null
     or to_regprocedure('public.get_family_case_update_for_workflow(uuid)') is null then
    raise exception using
      errcode = '55000',
      message = 'participant case scope prerequisites are missing';
  end if;
end
$$;

create or replace function passage_private.can_view_workflow_as_family(p_workflow_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workflows as workflow_row
    join public.continuity_spaces as space_row
      on space_row.id = workflow_row.continuity_space_id
    where workflow_row.id = p_workflow_id
      and space_row.status = 'active'
      and space_row.owner_user_id = (select auth.uid())
  )
$$;

revoke all on function passage_private.can_view_workflow_as_family(uuid)
  from public, anon, authenticated;

alter function public.get_family_case_update_for_workflow(uuid)
  security definer;
alter function public.get_family_case_update_for_workflow(uuid)
  set search_path = '';
revoke execute on function public.get_family_case_update_for_workflow(uuid)
  from public, anon, service_role;
grant execute on function public.get_family_case_update_for_workflow(uuid)
  to authenticated;

comment on function passage_private.can_view_workflow_as_family(uuid) is
  'Owner-only raw case predicate. Participants use a bounded public projection.';
comment on function public.get_family_case_update_for_workflow(uuid) is
  'Bounded family update projection for one active updates-scoped participant and workflow.';

commit;
