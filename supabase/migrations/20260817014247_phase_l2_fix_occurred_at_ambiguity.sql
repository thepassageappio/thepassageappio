-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Fix, 35 seconds after 20260817014212_phase_l2_family_self_serve_task_completion.sql:
-- same bug class documented elsewhere in the roadmap for accept_case_family_invitation
-- (42702 "column reference is ambiguous"). set_family_task_completion_idempotent's
-- RETURNS TABLE declares an implicit `event_id` and `occurred_at` output variable;
-- the previous migration's `returning id, occurred_at into event_id, occurred_at`
-- left "occurred_at" bare in the RETURNING clause, which collides with both the
-- workflow_events.occurred_at column being returned AND the function's own
-- occurred_at OUT parameter -- Postgres cannot tell which one a bare reference means
-- in that position. Fixed by (a) introducing dedicated local variables
-- (v_event_id, v_event_occurred_at) instead of writing directly into the OUT
-- parameters, and (b) fully table-qualifying the RETURNING clause
-- (workflow_events.id, workflow_events.occurred_at) so there is no ambiguity to
-- resolve in the first place.
--
-- This is the exact CURRENT live definition, independently verified via
-- pg_get_functiondef on 2026-08-19 -- high confidence, not a reconstruction. It does
-- NOT yet include the has_elevated_family_authority (executor/POA) branch that a
-- later, already-committed migration
-- (supabase/migrations/20260818110000_family_participant_structured_roles.sql, dated
-- the next day) adds on top of this same function -- that file's version is the true
-- current live shape and is not duplicated here.

CREATE OR REPLACE FUNCTION passage_private.set_family_task_completion_idempotent(p_task_id uuid, p_completed boolean, p_expected_version integer, p_request_id uuid)
 RETURNS TABLE(task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_task public.tasks%rowtype;
  v_workflow public.workflows%rowtype;
  v_actor_user_id uuid := (select auth.uid());
  v_key text := 'family_task_completion:' || p_request_id::text;
  v_existing public.workflow_events%rowtype;
  v_next_status text;
  v_next_version integer;
  v_event_id uuid;
  v_event_occurred_at timestamptz;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null or p_expected_version is null or p_completed is null then
    raise exception 'Request id, version, and completion state are required' using errcode = '22023';
  end if;

  select t.* into v_task from public.tasks as t where t.id = p_task_id for update;
  if not found then
    raise exception 'Task is unavailable' using errcode = '42501';
  end if;
  select w.* into strict v_workflow from public.workflows as w where w.id = v_task.workflow_id;

  if v_workflow.organization_id is not null or v_workflow.user_id is distinct from v_actor_user_id then
    raise exception 'Task is unavailable' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_workflow.id::text || ':' || v_key, 0));

  select e.* into v_existing from public.workflow_events as e
  where e.workflow_id = v_workflow.id and e.idempotency_key = v_key;
  if found then
    return query select p_task_id, v_existing.metadata ->> 'task_status', (v_existing.metadata ->> 'task_version')::integer, v_existing.id, v_existing.occurred_at, true;
    return;
  end if;

  if v_task.version <> p_expected_version then
    raise exception 'Task changed before the action was saved' using errcode = '40001';
  end if;

  v_next_status := case when p_completed then 'completed' else 'in_progress' end;
  v_next_version := v_task.version + 1;

  update public.tasks as t
  set status = v_next_status,
      version = v_next_version,
      completed_at = case when p_completed then pg_catalog.clock_timestamp() else null end,
      completed_by = case when p_completed then 'family' else null end,
      updated_at = pg_catalog.clock_timestamp()
  where t.id = v_task.id;

  insert into public.workflow_events (
    workflow_id, event_type, name, organization_id, organization_location_id, task_id,
    actor_user_id, actor_organization_member_id, idempotency_key, audience, previous_state, next_state, occurred_at, metadata
  ) values (
    v_workflow.id, 'other', case when p_completed then 'task.family_completed' else 'task.family_reopened' end,
    null, null, v_task.id,
    v_actor_user_id, null, v_key, 'family', v_task.status, v_next_status, pg_catalog.clock_timestamp(),
    jsonb_build_object('expected_version', p_expected_version, 'task_status', v_next_status, 'task_version', v_next_version, 'task_title', v_task.title, 'case_reference', v_workflow.case_reference)
  )
  returning workflow_events.id, workflow_events.occurred_at into v_event_id, v_event_occurred_at;

  return query select v_task.id, v_next_status, v_next_version, v_event_id, v_event_occurred_at, false;
end
$function$;

CREATE OR REPLACE FUNCTION public.set_family_task_completion_idempotent(p_task_id uuid, p_completed boolean, p_expected_version integer, p_request_id uuid)
 RETURNS TABLE(task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from passage_private.set_family_task_completion_idempotent(p_task_id, p_completed, p_expected_version, p_request_id)
$function$;
