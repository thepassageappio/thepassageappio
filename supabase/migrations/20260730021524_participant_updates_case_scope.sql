-- Passage Zero P1: family-safe participant updates without raw case-table access.
--
-- The earlier family workflow predicate flowed into RLS for workflows, tasks,
-- workflow_events, task_proofs, and task_proof_reviews. Adding a participant to
-- that predicate would expose operator records that an updates-only participant
-- does not need. Keep direct family-table reads for the continuity-space owner
-- only and give participants one bounded, human-readable projection instead.

begin;

do $participant_updates_case_scope_preflight$
begin
  if to_regclass('public.workflows') is null
     or to_regclass('public.tasks') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('public.task_proofs') is null
     or to_regclass('public.task_proof_reviews') is null
     or to_regclass('public.continuity_spaces') is null
     or to_regclass('public.continuity_participants') is null
     or to_regprocedure('passage_private.can_view_workflow_as_family(uuid)') is null then
    raise exception
      'Participant family-safe updates refused: required continuity/workflow foundation is missing';
  end if;
end
$participant_updates_case_scope_preflight$;

create or replace function passage_private.can_view_workflow_as_family(
  p_workflow_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.workflows as workflow_row
    join public.continuity_spaces as space_row
      on space_row.id = workflow_row.continuity_space_id
    where workflow_row.id = p_workflow_id
      and space_row.status = 'active'
      and space_row.owner_user_id = (select auth.uid())
  )
$function$;

revoke all on function
  passage_private.can_view_workflow_as_family(uuid)
  from public, anon, authenticated, service_role;

comment on function passage_private.can_view_workflow_as_family(uuid) is
  'Allows only the active continuity-space owner to use existing family table policies. Participants use the bounded public family-updates projection.';

create or replace function public.list_participant_family_updates()
returns table (
  space_name text,
  participant_name text,
  relationship text,
  purpose text,
  can_see text[],
  accepted_at timestamp with time zone,
  family_name text,
  person_name text,
  current_step_title text,
  current_step_summary text,
  current_step_owner text,
  current_step_updated_at timestamp with time zone,
  latest_update_summary text,
  latest_update_at timestamp with time zone
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
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
  from public.continuity_participants as participant_row
  join public.continuity_spaces as space_row
    on space_row.id = participant_row.continuity_space_id
   and space_row.status = 'active'
  left join lateral (
    select
      workflow_candidate.id,
      workflow_candidate.family_name,
      workflow_candidate.person_name
    from public.workflows as workflow_candidate
    where workflow_candidate.continuity_space_id = space_row.id
    order by workflow_candidate.created_at desc, workflow_candidate.id
    limit 1
  ) as workflow_row on true
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
    and participant_row.user_id = (select auth.uid())
    and participant_row.status = 'active'
    and 'updates' = any (participant_row.category_scope)
  order by space_row.created_at, space_row.display_name, participant_row.accepted_at
$function$;

revoke all on function public.list_participant_family_updates()
  from public, anon, authenticated, service_role;
grant execute on function public.list_participant_family_updates()
  to authenticated;

comment on function public.list_participant_family_updates() is
  'Returns only human-readable, updates-scoped family information for every active space joined by the signed-in participant. It returns no workflow, task, event, proof, review, organization, or member identifier.';

commit;
