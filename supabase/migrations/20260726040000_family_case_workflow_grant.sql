-- Passage Zero: family/participant read grant for case workflows.
--
-- Problem: organization_members.role is hard-constrained to owner|director|staff.
-- can_view_workflow / can_view_task / can_view_workflow_event only grant access to
-- org staff/managers. The existing continuity_spaces / continuity_participants /
-- participant_invitations / family_provider_selections schema (already live on this
-- project) models a family's own personal space and their invited participants, but
-- has no structural link to an organization's public.workflows (case) rows. Result:
-- there is no way for a family/participant identity to be granted read access to a
-- specific funeral home case, which blocks /case/[id]/* entirely.
--
-- Fix: add a nullable bridge column (workflows.continuity_space_id) plus a new
-- can_view_workflow_as_family() predicate, and fold it into the existing
-- can_view_workflow / can_view_task / can_view_workflow_event authority functions.
-- No RLS policy DDL changes are needed -- every affected table's SELECT policy
-- already delegates to these functions, so the grant propagates automatically to
-- workflows, tasks, task_proofs, task_proof_reviews, and workflow_events.
--
-- Read-only. No INSERT/UPDATE/DELETE policy is added for family/participant roles;
-- workflows/tasks/task_proofs/task_proof_reviews currently only expose SELECT
-- policies (all mutation goes through SECURITY DEFINER command RPCs), so this grant
-- cannot be used to write anything.
--
-- Does not populate workflows.continuity_space_id for any row. Linking a specific
-- case to a family's continuity space (e.g. as part of a "handoff" action once
-- confirm_family_provider_selection resolves a real organization/location) is a
-- separate follow-on business-logic decision, intentionally left out of this
-- migration+RLS-only pass.
--
-- NOTE ON DEPENDENCIES: this migration references public.continuity_spaces and
-- passage_private.can_view_continuity_space, which are defined by migrations
-- 20260723072450, 20260723080309, and 20260723092402. Those migrations are applied
-- and tracked on this Supabase project but their .sql files were never committed to
-- git on any branch. See docs/product/family-case-workflow-grant-2026-07-26.md for
-- the full account -- that drift is flagged, not fixed, in this migration.

begin;

alter table public.workflows
  add column continuity_space_id uuid null
    references public.continuity_spaces (id) on delete set null;

create index workflows_continuity_space_idx
  on public.workflows (continuity_space_id)
  where continuity_space_id is not null;

create or replace function passage_private.can_view_workflow_as_family(p_workflow_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workflows as w
    where w.id = p_workflow_id
      and w.continuity_space_id is not null
      and passage_private.can_view_continuity_space(w.continuity_space_id)
  )
$$;

create or replace function passage_private.can_view_workflow(p_workflow_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workflows as w
    where w.id = p_workflow_id
      and (
        (
          w.organization_id is not null
          and w.organization_location_id is not null
          and (
            passage_private.can_manage_location(w.organization_id, w.organization_location_id)
            or exists (
              select 1
              from public.organization_members as m
              join public.organization_member_locations as ml
                on ml.organization_member_id = m.id
               and ml.organization_location_id = w.organization_location_id
               and ml.revoked_at is null
              join public.tasks as t
                on t.workflow_id = w.id
               and t.assigned_organization_member_id = m.id
              where m.organization_id = w.organization_id
                and m.user_id = (select auth.uid())
                and m.status = 'active'
                and m.role = 'staff'
            )
          )
        )
        or passage_private.can_view_workflow_as_family(w.id)
      )
  )
$$;

create or replace function passage_private.can_view_task(p_task_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks as t
    join public.workflows as w on w.id = t.workflow_id
    where t.id = p_task_id
      and t.organization_id = w.organization_id
      and (
        (
          w.organization_location_id is not null
          and (
            passage_private.can_manage_location(w.organization_id, w.organization_location_id)
            or exists (
              select 1
              from public.organization_members as m
              join public.organization_member_locations as ml
                on ml.organization_member_id = m.id
               and ml.organization_location_id = w.organization_location_id
               and ml.revoked_at is null
              where m.id = t.assigned_organization_member_id
                and m.organization_id = w.organization_id
                and m.user_id = (select auth.uid())
                and m.status = 'active'
                and m.role = 'staff'
            )
          )
        )
        or passage_private.can_view_workflow_as_family(w.id)
      )
  )
$$;

create or replace function passage_private.can_view_workflow_event(p_event_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workflow_events as e
    where e.id = p_event_id
      and e.organization_id is not null
      and (
        (
          passage_private.can_manage_organization(e.organization_id)
          and (
            (e.organization_location_id is not null
             and passage_private.can_manage_location(e.organization_id, e.organization_location_id))
            or
            (e.organization_location_id is null
             and not exists (
               select 1
               from jsonb_array_elements_text(coalesce(e.metadata -> 'location_ids', '[]'::jsonb)) as scoped(location_id)
               where case
                 when scoped.location_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                   then not passage_private.can_manage_location(e.organization_id, scoped.location_id::uuid)
                 else true
               end
             ))
          )
        )
        or (
          e.task_id is not null
          and passage_private.can_view_task(e.task_id)
          and exists (
            select 1 from public.tasks as assigned_task
            join public.organization_members as assigned_member
              on assigned_member.id = assigned_task.assigned_organization_member_id
            where assigned_task.id = e.task_id
              and assigned_member.user_id = (select auth.uid())
              and assigned_member.status = 'active'
              and assigned_member.role = 'staff'
          )
        )
        or (
          e.workflow_id is not null
          and passage_private.can_view_workflow_as_family(e.workflow_id)
        )
      )
  )
$$;

commit;
