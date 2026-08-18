-- Found reviewing the new create_family_task_idempotent RPC before wiring it
-- into the UI: it only checked has_elevated_family_authority (executor/POA),
-- so the case owner had strictly LESS authority on their own case than an
-- executor they themselves invited. There was no prior "D2C owner creates a
-- task" capability to preserve parity with either -- create_task_idempotent
-- is staff-only, set_family_task_completion_idempotent is completion-only --
-- so this closes a real, immediately-visible asymmetry rather than
-- introducing new scope. Owner authority added the same way
-- set_family_task_completion_idempotent already checks it.
create or replace function passage_private.create_family_task_idempotent(p_workflow_id uuid, p_title text, p_category text, p_request_id uuid)
returns table (task_id uuid, status text, version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_workflow public.workflows%rowtype;
  v_key text;
  v_existing public.workflow_events%rowtype;
  v_new_task_id uuid;
  v_event_id uuid;
  v_event_occurred_at timestamptz;
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
  if v_workflow.id is null or v_workflow.organization_id is not null then
    raise exception 'Case is unavailable' using errcode = '42501';
  end if;
  if v_workflow.user_id is distinct from v_actor_user_id and not passage_private.has_elevated_family_authority(p_workflow_id) then
    raise exception 'Case owner or executor/POA authority is required to create a task on this case' using errcode = '42501';
  end if;

  v_key := 'family_task_create:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_workflow.id::text || ':' || v_key, 0));

  select e.* into v_existing from public.workflow_events as e
  where e.workflow_id = v_workflow.id and e.idempotency_key = v_key;
  if found then
    return query select (v_existing.metadata ->> 'task_id')::uuid, 'assigned'::text, 1, v_existing.id, v_existing.occurred_at, true;
    return;
  end if;

  insert into public.tasks (workflow_id, title, category, status, audience, version)
  values (p_workflow_id, btrim(p_title), p_category, 'assigned', 'family', 1)
  returning id into v_new_task_id;

  insert into public.workflow_events (
    workflow_id, event_type, name, organization_id, organization_location_id, task_id,
    actor_user_id, actor_organization_member_id, idempotency_key, audience, previous_state, next_state, occurred_at, metadata
  ) values (
    v_workflow.id, 'other', 'task.family_created', null, null, v_new_task_id,
    v_actor_user_id, null, v_key, 'family', 'not_created', 'assigned', pg_catalog.clock_timestamp(),
    jsonb_build_object('task_id', v_new_task_id, 'task_title', btrim(p_title), 'category', p_category, 'case_reference', v_workflow.case_reference)
  )
  returning workflow_events.id, workflow_events.occurred_at into v_event_id, v_event_occurred_at;

  return query select v_new_task_id, 'assigned'::text, 1, v_event_id, v_event_occurred_at, false;
end
$function$;
