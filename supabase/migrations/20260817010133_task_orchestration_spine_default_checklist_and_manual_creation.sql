-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Task orchestration spine: manual task creation. Gives a director the ability to add
-- an ad-hoc task to a case's task list (the "manual creation" this migration's name
-- refers to), same idempotent-command shape as every other write RPC in this codebase.
--
-- SCOPING NOTE: this migration's name also says "default_checklist" -- but the actual
-- default-checklist seeding function (passage_private.seed_default_case_tasks, the
-- researched 15-item funeral-home checklist) is not created until the very next
-- migration, six minutes later
-- (20260817010515_task_orchestration_researched_funeral_home_checklist.sql). Verified:
-- the immediately-prior committed migration
-- (supabase/migrations/20260816130000_fix_urgent_intake_case_creation.sql) has zero
-- task-seeding calls anywhere. Rather than fabricate an intermediate seed function that
-- left no live trace, this file is scoped to only what is independently verifiable here
-- (create_task_idempotent) and the checklist-seeding work is attributed to the next
-- migration where the evidence actually points.
--
-- Verified live via pg_get_functiondef on 2026-08-19; create_task_idempotent is not
-- touched by any later migration (committed or otherwise) -- high confidence.

CREATE OR REPLACE FUNCTION passage_private.create_task_idempotent(p_workflow_id uuid, p_title text, p_category text, p_request_id uuid)
 RETURNS TABLE(task_id uuid, status text, version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_workflow public.workflows%rowtype;
  v_existing_event public.workflow_events%rowtype;
  v_new_task_id uuid;
  v_key text;
  v_event_receipt record;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_workflow_id is null or p_request_id is null
     or length(btrim(coalesce(p_title, ''))) not between 1 and 200
     or p_category is null or p_category not in ('legal', 'service', 'notifications', 'property', 'personal', 'medical', 'memorial', 'logistics', 'digital', 'financial', 'government', 'other') then
    raise exception 'A valid title and category are required' using errcode = '22023';
  end if;

  select w.* into v_workflow from public.workflows as w where w.id = p_workflow_id;
  if v_workflow.id is null then
    raise exception 'Case is unavailable' using errcode = '42501';
  end if;
  if v_workflow.organization_id is null or v_workflow.organization_location_id is null
     or not passage_private.can_manage_location(v_workflow.organization_id, v_workflow.organization_location_id) then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_workflow.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;

  v_key := 'task_create:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_workflow.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.workflow_events as e
  where e.organization_id = v_workflow.organization_id and e.idempotency_key = v_key;
  if found then
    return query select (v_existing_event.metadata ->> 'task_id')::uuid, 'assigned'::text, 1, v_existing_event.id, v_existing_event.occurred_at, true;
    return;
  end if;

  insert into public.tasks (workflow_id, organization_id, title, category, status, audience, version)
  values (p_workflow_id, v_workflow.organization_id, btrim(p_title), p_category, 'assigned', 'case_team', 1)
  returning id into v_new_task_id;

  select * into strict v_event_receipt from passage_private.append_operational_event(
    v_workflow.id, v_new_task_id, v_workflow.organization_id, v_workflow.organization_location_id, v_actor_user_id, v_actor_member_id,
    v_key, 'task.created', 'not_created', 'assigned',
    pg_catalog.jsonb_build_object('task_id', v_new_task_id, 'task_title', btrim(p_title), 'category', p_category, 'case_reference', v_workflow.case_reference)
  );

  return query select v_new_task_id, 'assigned'::text, 1, v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_task_idempotent(p_workflow_id uuid, p_title text, p_category text, p_request_id uuid)
 RETURNS TABLE(task_id uuid, status text, version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from passage_private.create_task_idempotent(p_workflow_id, p_title, p_category, p_request_id) $function$;
