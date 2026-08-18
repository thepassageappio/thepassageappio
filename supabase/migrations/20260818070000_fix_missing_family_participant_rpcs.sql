-- CRITICAL, found while cross-referencing every client.rpc() call site in the
-- app against what actually exists in the live database (a systematic sweep,
-- not a spot check -- triggered by getting one gap thrown back by the founder
-- and deciding to check ALL call sites rather than just the one raised).
--
-- Three real production bugs found this way, all the same shape: a frontend
-- calls client.rpc('name'), which PostgREST only ever resolves against the
-- `public` schema (confirmed: pgrst.db_schemas is unset, so it defaults to
-- public-only) -- but the function only exists in passage_private, so the
-- call has been failing with a 404 the whole time, silently caught and
-- treated as "no data" or "unauthorized" by the caller.
--
-- 1. get_family_visible_partner_requests -- lib/family/case-view.ts. Effect:
--    families have never actually seen vendor-request status merged into
--    their timeline, despite Phase L.1 being recorded as shipped and
--    verified. Fixed below: adds the missing public wrapper.
-- 2. set_staff_case_creation_grant_idempotent -- app/director/actions.ts.
--    Effect: toggling a staff member's case-creation rights on
--    /director/team has never actually worked. Fixed below: adds the
--    missing public wrapper.
-- 3. get_family_case_update_for_workflow -- lib/family/case-view.ts, the
--    bounded participant projection for an invited family member (spouse,
--    etc). This one is worse: the function does not exist under this name
--    in ANY schema. The committed migration that was supposed to create it
--    (supabase/migrations/20260810230000_participant_case_update_for_workflow.sql)
--    depends on continuity_spaces/continuity_participants -- a from-scratch
--    family-space system that (per commentary in
--    20260816070000_production_case_family_invitation.sql) was designed in
--    an isolated lab and deliberately never ported to production, superseded
--    by estate_access/case_family_invitations instead. That old migration
--    was therefore never applied here (it would fail outright -- those
--    tables don't exist), and nothing replaced it. Net effect, confirmed by
--    tracing the actual call path: workflows/tasks RLS denies a
--    participant on the owner-path query in loadFamilyCaseView, which
--    correctly falls back to loadFamilyCaseViewAsParticipant -- which then
--    calls this missing function and gets an error, which the caller
--    treats as "unavailable". An invited family participant who accepts an
--    invitation has been completely locked out of /case/[id]/today and
--    /case/[id]/tasks. Fixed below: rebuilt against estate_access +
--    case_family_invitations (the live mechanism), same bounded output
--    shape and the same task/event summarization logic as the original
--    migration, so the existing TypeScript consumer needs no changes.

create or replace function public.get_family_visible_partner_requests(p_workflow_id uuid)
returns table (id uuid, category text, title text, status text, needed_by timestamptz, created_at timestamptz, updated_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from passage_private.get_family_visible_partner_requests(p_workflow_id)
$function$;

revoke all on function public.get_family_visible_partner_requests(uuid) from public, anon, service_role;
grant execute on function public.get_family_visible_partner_requests(uuid) to authenticated;

create or replace function public.set_staff_case_creation_grant_idempotent(
  p_organization_member_id uuid, p_organization_location_id uuid, p_granted boolean, p_request_id uuid, p_revocation_reason text default null
)
returns table (organization_member_id uuid, organization_location_id uuid, can_create_cases boolean, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $function$
  select * from passage_private.set_staff_case_creation_grant_idempotent(p_organization_member_id, p_organization_location_id, p_granted, p_request_id, p_revocation_reason)
$function$;

revoke all on function public.set_staff_case_creation_grant_idempotent(uuid, uuid, boolean, uuid, text) from public, anon, service_role;
grant execute on function public.set_staff_case_creation_grant_idempotent(uuid, uuid, boolean, uuid, text) to authenticated;

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
as $function$
  select
    workflow_row.id,
    workflow_row.family_name,
    coalesce(invitation_row.display_name, 'Family member'),
    coalesce(invitation_row.relationship, 'Family member'),
    coalesce(invitation_row.purpose, 'Stay updated on this case'),
    array['Family updates']::text[],
    access_row.created_at,
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
  join public.estate_access as access_row
    on access_row.workflow_id = workflow_row.id
   and (
     access_row.user_id = (select auth.uid())
     or lower(access_row.email) = lower((select auth.jwt() ->> 'email'))
   )
   and coalesce(access_row.status, 'accepted') not in ('revoked', 'removed', 'declined')
   and (access_row.expires_at is null or access_row.expires_at > pg_catalog.clock_timestamp())
  left join public.case_family_invitations as invitation_row
    on invitation_row.workflow_id = workflow_row.id
   and lower(invitation_row.invited_email) = lower(access_row.email)
   and invitation_row.accepted_at is not null
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
        'task.assigned', 'task.reassigned', 'task.started',
        'task.proof_submitted', 'task.proof_verified', 'task.proof_replacement_requested'
      )
    order by event_candidate.occurred_at desc, event_candidate.id
    limit 1
  ) as event_row on true
  where (select auth.uid()) is not null
    and workflow_row.id = p_workflow_id
  limit 1
$function$;

revoke all on function public.get_family_case_update_for_workflow(uuid) from public, anon, service_role;
grant execute on function public.get_family_case_update_for_workflow(uuid) to authenticated;
