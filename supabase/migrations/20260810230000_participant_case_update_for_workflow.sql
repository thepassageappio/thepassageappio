-- Adds a workflow-id-scoped sibling to public.list_participant_family_updates().
-- That function (participant_updates_case_scope, 2026-07-30) returns the bounded,
-- privacy-minimizing family-participant projection but has no workflow_id in its
-- input or output, so a route keyed by a specific case id (e.g. /case/[id]/today)
-- has no safe way to authorize or fetch data for participants through it -- the
-- root cause of the P0 lockout found in docs/evidence/passage-zero/qa-2026-08-10-full-sweep.md.
-- This is purely additive: same predicate (active participant, 'updates' in
-- category_scope, on an active continuity_space), same bounded column shape, same
-- lateral-join task/event summarization logic as list_participant_family_updates,
-- just filtered to one p_workflow_id and returning that id so callers can verify
-- it matches the case they asked for. Does not modify any existing function or RLS policy.

create or replace function public.get_family_case_update_for_workflow(p_workflow_id uuid)
returns table (
  workflow_id uuid,
  space_name text,
  participant_name text,
  relationship text,
  purpose text,
  can_see text[],
  accepted_at timestamptz,
  family_name text,
  person_name text,
  current_step_title text,
  current_step_summary text,
  current_step_owner text,
  current_step_updated_at timestamptz,
  latest_update_summary text,
  latest_update_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    workflow_row.id,
    space_row.display_name,
    participant_row.display_name,
    participant_row.relationship,
    participant_row.purpose,
    array['Family updates']::text[],
    participant_row.accepted_at,
    workflow_row.family_name,
    workflow_row.person_name,
    task_row.title,
    case task_row.status
      when 'assigned' then 'This step has not started yet.'
      when 'in_progress' then 'The care team is working on this now.'
      when 'proof_submitted' then 'A step was completed and is being double-checked.'
      when 'blocked' then 'This step needs more time before it can continue.'
      when 'completed' then 'This step is complete.'
      else null
    end,
    coalesce(nullif(pg_catalog.btrim(task_row.waiting_party), ''), 'Your care team'),
    coalesce(task_row.updated_at, task_row.due_at),
    event_row.summary,
    event_row.occurred_at
  from public.workflows as workflow_row
  join public.continuity_spaces as space_row
    on space_row.id = workflow_row.continuity_space_id
   and space_row.status = 'active'
  join public.continuity_participants as participant_row
    on participant_row.continuity_space_id = space_row.id
   and participant_row.user_id = (select auth.uid())
   and participant_row.status = 'active'
   and 'updates' = any (participant_row.category_scope)
  left join lateral (
    select
      task_candidate.title,
      task_candidate.status,
      task_candidate.waiting_party,
      task_candidate.updated_at,
      task_candidate.due_at
    from public.tasks as task_candidate
    where task_candidate.workflow_id = workflow_row.id
    order by
      case
        when task_candidate.status = 'proof_submitted' then 0
        when task_candidate.status <> 'completed' then 1
        else 2
      end,
      task_candidate.due_at nulls last,
      task_candidate.created_at,
      task_candidate.id
    limit 1
  ) as task_row on true
  left join lateral (
    select
      case event_candidate.name
        when 'task.assigned' then 'A next step was set up for the family.'
        when 'task.reassigned' then 'The next step moved to another team member.'
        when 'task.started' then 'Work began on the next step.'
        when 'task.proof_submitted' then 'A step was completed and is being reviewed.'
        when 'task.proof_verified' then 'A completed step was confirmed.'
        when 'task.proof_replacement_requested' then 'The team is redoing part of a step to make sure it is right.'
      end as summary,
      event_candidate.occurred_at
    from public.workflow_events as event_candidate
    where event_candidate.workflow_id = workflow_row.id
      and event_candidate.name in (
        'task.assigned',
        'task.reassigned',
        'task.started',
        'task.proof_submitted',
        'task.proof_verified',
        'task.proof_replacement_requested'
      )
    order by event_candidate.occurred_at desc, event_candidate.id
    limit 1
  ) as event_row on true
  where (select auth.uid()) is not null
    and workflow_row.id = p_workflow_id
$$;

grant execute on function public.get_family_case_update_for_workflow(uuid) to authenticated;
