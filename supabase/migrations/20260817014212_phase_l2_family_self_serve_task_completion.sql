-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Phase L.2: family self-serve task completion. Lets a D2C case owner mark their own
-- planning tasks complete/incomplete directly, with the same idempotent-command +
-- optimistic-version-check shape as every staff-side write RPC.
--
-- CONFIDENCE NOTE: the current live definition of this function (queried 2026-08-19)
-- also accepts an "elevated participant" (executor / POA) via
-- passage_private.has_elevated_family_authority(). That check, and the function
-- itself, do NOT exist yet at this point in history -- has_elevated_family_authority is
-- created a day later by the already-committed
-- supabase/migrations/20260818110000_family_participant_structured_roles.sql, which
-- also re-issues this exact CREATE OR REPLACE to add that branch. Verified: grepping
-- every committed migration for "set_family_task_completion_idempotent" turns up only
-- that one file (plus this backfill's own #8 sibling below) -- meaning the live
-- "current" shape already reflects 08-18's widening, not just 08-17's original scope.
-- Reconstructed below WITHOUT the elevated-authority branch (D2C case-owner only,
-- matching this migration's actual date and stated scope) -- medium-high confidence,
-- not an independent live pull for this exact historical shape, but directly derived
-- by removing the one later addition that is itself independently verified and dated.
-- Everything else (advisory lock, idempotency-key shape, version-check, event
-- metadata) is unchanged by that later widening and is high confidence.
--
-- This version also predates the occurred_at-ambiguity fix
-- (20260817014247_phase_l2_fix_occurred_at_ambiguity.sql, 35 seconds later) -- the
-- RETURNING clause below intentionally uses bare, unqualified column names, which is
-- reconstructed as the actual bug (see that migration's header for the full
-- explanation).

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
  returning id, occurred_at into event_id, occurred_at;

  return query select v_task.id, v_next_status, v_next_version, event_id, occurred_at, false;
end
$function$;

CREATE OR REPLACE FUNCTION public.set_family_task_completion_idempotent(p_task_id uuid, p_completed boolean, p_expected_version integer, p_request_id uuid)
 RETURNS TABLE(task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from passage_private.set_family_task_completion_idempotent(p_task_id, p_completed, p_expected_version, p_request_id)
$function$;
