-- Founder decision 2026-08-19: staff can block and unblock their own
-- assigned work freely (no director gate) -- the `blocked` task status has
-- had full UI/copy support since Cycle 7B/8 ("Ask your director for help")
-- but zero backend writer anywhere; nothing could ever actually set or
-- clear it. This closes that dead state.
--
-- Mirrors passage_private.start_task_idempotent's authority pattern exactly
-- (current active assigned staff member with an active grant on the
-- workflow's exact location) -- see supabase/migrations/20260718180000_cycle_7b_assigned_work.sql.
-- A reason is required to block (mirrors the reason-required pattern used
-- for reassignment/revocation/replacement-request elsewhere in this
-- codebase) but not to unblock, since unblocking is just resuming work.
create or replace function passage_private.set_task_blocked_idempotent(
  p_task_id uuid,
  p_blocked boolean,
  p_reason text,
  p_expected_version integer,
  p_request_id uuid
)
returns table (
  task_id uuid,
  task_status text,
  task_version integer,
  event_id uuid,
  occurred_at timestamp with time zone,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_task public.tasks%rowtype;
  v_workflow public.workflows%rowtype;
  v_actor public.organization_members%rowtype;
  v_actor_user_id uuid := (select auth.uid());
  v_event public.workflow_events%rowtype;
  v_event_receipt record;
  v_next_version integer;
  v_next_status text;
  v_key text := 'task_blocked:' || p_request_id::text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null or p_expected_version is null or p_blocked is null then
    raise exception 'Request id, version, and blocked state are required' using errcode = '22023';
  end if;
  if p_blocked and length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'A reason is required to report a blocker' using errcode = '22023';
  end if;

  select t.* into v_task
  from public.tasks as t where t.id = p_task_id for update;
  if not found then raise exception 'Work is unavailable' using errcode = '42501'; end if;
  select w.* into strict v_workflow
  from public.workflows as w where w.id = v_task.workflow_id;
  select m.* into v_actor
  from public.organization_members as m
  where m.organization_id = v_workflow.organization_id
    and m.user_id = v_actor_user_id
    and m.status = 'active'
  order by m.created_at, m.id limit 1;
  if v_actor.id is null or v_actor.role <> 'staff' then
    raise exception 'Assigned staff authority is required' using errcode = '42501';
  end if;

  if v_task.assigned_organization_member_id <> v_actor.id
     or not exists (
       select 1 from public.organization_member_locations as ml
       where ml.organization_member_id = v_actor.id
         and ml.organization_location_id = v_workflow.organization_location_id
         and ml.revoked_at is null
     ) then
    raise exception 'Work is unavailable' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_workflow.organization_id::text || ':' || v_key, 0)
  );

  select e.* into v_event
  from public.workflow_events as e
  where e.organization_id = v_workflow.organization_id
    and e.idempotency_key = v_key;
  if found then
    return query select
      p_task_id,
      v_event.metadata ->> 'task_status',
      (v_event.metadata ->> 'task_version')::integer,
      v_event.id,
      v_event.occurred_at,
      true;
    return;
  end if;

  if v_task.version <> p_expected_version then
    raise exception 'Work changed before the action was saved' using errcode = '40001';
  end if;

  if p_blocked then
    if v_task.status <> 'in_progress' then
      raise exception 'Only work in progress can be reported as blocked' using errcode = '55000';
    end if;
    v_next_status := 'blocked';
  else
    if v_task.status <> 'blocked' then
      raise exception 'This work is not currently reported as blocked' using errcode = '55000';
    end if;
    v_next_status := 'in_progress';
  end if;

  v_next_version := v_task.version + 1;
  update public.tasks as t
  set status = v_next_status, version = v_next_version,
      updated_at = pg_catalog.clock_timestamp()
  where t.id = v_task.id;

  select * into strict v_event_receipt
  from passage_private.append_operational_event(
    v_workflow.id, v_task.id, v_workflow.organization_id,
    v_workflow.organization_location_id, v_actor_user_id, v_actor.id,
    v_key, case when p_blocked then 'task.blocked' else 'task.unblocked' end,
    v_task.status, v_next_status,
    pg_catalog.jsonb_build_object(
      'expected_version', p_expected_version,
      'task_status', v_next_status,
      'task_version', v_next_version,
      'task_title', v_task.title,
      'case_reference', v_workflow.case_reference,
      'reason', p_reason
    )
  );

  return query select v_task.id, v_next_status, v_next_version,
    v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

create or replace function public.set_task_blocked_idempotent(
  p_task_id uuid,
  p_blocked boolean,
  p_reason text,
  p_expected_version integer,
  p_request_id uuid
)
returns table (
  task_id uuid,
  task_status text,
  task_version integer,
  event_id uuid,
  occurred_at timestamp with time zone,
  replayed boolean
)
language sql
security invoker
set search_path = ''
as $function$
  select * from passage_private.set_task_blocked_idempotent(p_task_id, p_blocked, p_reason, p_expected_version, p_request_id)
$function$;

revoke all on function passage_private.set_task_blocked_idempotent(uuid,boolean,text,integer,uuid) from public, anon, authenticated;
grant execute on function passage_private.set_task_blocked_idempotent(uuid,boolean,text,integer,uuid) to authenticated;

revoke all on function public.set_task_blocked_idempotent(uuid,boolean,text,integer,uuid) from public, anon, authenticated, service_role;
grant execute on function public.set_task_blocked_idempotent(uuid,boolean,text,integer,uuid) to authenticated;

-- Adversarial verification (10/10 passed, zero-footprint transaction against
-- production, rolled back): empty-reason block denied (22023); valid block
-- succeeds (status=blocked, version+1); replay is idempotent (no version
-- bump); an unrelated staff member cannot block/unblock someone else's task
-- (42501); a director cannot block/unblock either -- staff-only per founder
-- decision (42501); the assigned staff member unblocks successfully
-- (status=in_progress, version+1); a stale expected_version is rejected
-- (40001).
