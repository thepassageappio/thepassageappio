-- Packet 1 forward repair: urgent case creation must leave one assignable
-- commitment, not an empty workflow that cannot advance through the operating
-- loop. This migration is additive/forward-only relative to applied migration
-- 20260727042651_urgent_receiving_organization_boundary.sql.
--
-- Target for review/application: isolated project uyacxqtsiwlvtmhxvoxr only.
-- Production project qsveqfchwylsbncsfgxe is explicitly out of scope.

do $preflight$
begin
  if to_regprocedure(
    'passage_private.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)'
  ) is null
     or to_regprocedure(
       'public.create_case_from_urgent_intake_idempotent(uuid,integer,uuid,text,text,uuid)'
     ) is null
     or to_regprocedure(
       'passage_private.append_operational_event(uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,jsonb)'
     ) is null
     or to_regclass('public.urgent_intake_requests') is null
     or to_regclass('public.urgent_intake_events') is null
     or to_regclass('public.workflows') is null
     or to_regclass('public.tasks') is null
     or to_regclass('public.workflow_events') is null then
    raise exception 'Refusing urgent first-commitment repair: required Packet 1/Cycle 7B authority objects are missing';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name in (
        'workflow_id', 'organization_id', 'assigned_organization_member_id',
        'title', 'status', 'waiting_party', 'audience', 'automation_level',
        'prepared_output', 'human_action', 'proof_destination', 'next_state',
        'version'
      )
    group by table_schema, table_name
    having count(*) <> 13
  ) or (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name in (
        'workflow_id', 'organization_id', 'assigned_organization_member_id',
        'title', 'status', 'waiting_party', 'audience', 'automation_level',
        'prepared_output', 'human_action', 'proof_destination', 'next_state',
        'version'
      )
  ) <> 13 then
    raise exception 'Refusing urgent first-commitment repair: task contract columns are incomplete';
  end if;
end
$preflight$;

drop function public.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
);
drop function passage_private.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
);

create function passage_private.create_case_from_urgent_intake_idempotent(
  p_urgent_intake_request_id uuid,
  p_expected_version integer,
  p_organization_location_id uuid,
  p_case_reference text,
  p_family_name text,
  p_request_id uuid
)
returns table (
  urgent_intake_request_id uuid,
  workflow_id uuid,
  first_task_id uuid,
  status text,
  version integer,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_member_id uuid;
  v_request public.urgent_intake_requests%rowtype;
  v_existing_event public.urgent_intake_events%rowtype;
  v_key text;
  v_workflow_id uuid;
  v_first_task_id uuid;
  v_case_reference text := btrim(coalesce(p_case_reference, ''));
  v_family_name text := btrim(coalesce(p_family_name, ''));
  v_replay_authorized boolean;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_urgent_intake_request_id is null
     or p_request_id is null
     or p_expected_version is null
     or p_expected_version < 1
     or p_organization_location_id is null
     or length(v_case_reference) not between 1 and 60
     or length(v_family_name) not between 1 and 200 then
    raise exception 'Valid case details are required'
      using errcode = '22023';
  end if;

  select request_row.*
  into v_request
  from public.urgent_intake_requests request_row
  where request_row.id = p_urgent_intake_request_id
  for update;
  if v_request.id is null
     or not v_request.wants_callback
     or v_request.status = 'self_handling' then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;

  select member_row.id
  into v_member_id
  from public.organization_members member_row
  where member_row.organization_id = v_request.receiving_organization_id
    and member_row.user_id = v_actor_user_id
    and member_row.status = 'active'
    and member_row.role in ('owner', 'director')
  order by member_row.created_at, member_row.id
  limit 1;
  if v_member_id is null then
    raise exception 'Director or owner authority for the receiving organization is required'
      using errcode = '42501';
  end if;

  v_key := 'urgent_intake_case_create:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_request.id::text || ':' || v_key, 0)
  );

  select event_row.*
  into v_existing_event
  from public.urgent_intake_events event_row
  where event_row.urgent_intake_request_id = v_request.id
    and event_row.idempotency_key = v_key;
  if found then
    if (v_existing_event.metadata ->> 'expected_version')::integer
         is distinct from p_expected_version
       or (v_existing_event.metadata ->> 'organization_location_id')::uuid
         is distinct from p_organization_location_id
       or v_existing_event.metadata ->> 'case_reference'
         is distinct from v_case_reference
       or v_existing_event.metadata ->> 'family_name'
         is distinct from v_family_name
       or v_existing_event.actor_user_id is distinct from v_actor_user_id
       or v_existing_event.actor_organization_member_id is distinct from v_member_id then
      raise exception 'Request conflicts with an earlier command'
        using errcode = '22023';
    end if;
    v_replay_authorized :=
      v_request.claimed_organization_id is not distinct from
        v_request.receiving_organization_id
      and passage_private.can_manage_location(
        v_request.receiving_organization_id,
        p_organization_location_id
      );
    if not v_replay_authorized then
      raise exception 'Director authority for this organization and location is required'
        using errcode = '42501';
    end if;

    v_workflow_id := (v_existing_event.metadata ->> 'workflow_id')::uuid;
    v_first_task_id := nullif(
      v_existing_event.metadata ->> 'first_task_id',
      ''
    )::uuid;
    if v_first_task_id is null then
      select event_row.task_id
      into v_first_task_id
      from public.workflow_events event_row
      where event_row.organization_id = v_request.receiving_organization_id
        and event_row.idempotency_key =
          'urgent_intake_first_task:' || v_request.id::text
        and event_row.workflow_id = v_workflow_id
        and event_row.name = 'task.created';
    end if;
    if v_first_task_id is null
       or not exists (
         select 1
         from public.tasks task_row
         where task_row.id = v_first_task_id
           and task_row.workflow_id = v_workflow_id
           and task_row.organization_id =
             v_request.receiving_organization_id
       ) then
      raise exception 'The original first commitment is unavailable'
        using errcode = '55000';
    end if;

    return query
      select
        v_request.id,
        v_workflow_id,
        v_first_task_id,
        v_existing_event.next_state,
        (v_existing_event.metadata ->> 'version')::integer,
        true;
    return;
  end if;

  if v_request.claimed_organization_id is distinct from
       v_request.receiving_organization_id
     or not passage_private.can_manage_location(
       v_request.receiving_organization_id,
       p_organization_location_id
     ) then
    raise exception 'Director authority for this organization and location is required'
      using errcode = '42501';
  end if;
  if v_request.version <> p_expected_version then
    raise exception 'Request changed before the case was created'
      using errcode = '40001';
  end if;
  if v_request.status <> 'claimed' then
    raise exception 'This request is not ready for case creation'
      using errcode = '55000';
  end if;

  insert into public.workflows (
    organization_id, organization_location_id,
    accountable_organization_member_id, case_reference, family_name,
    person_name, phase, status
  ) values (
    v_request.receiving_organization_id, p_organization_location_id,
    v_member_id, v_case_reference, v_family_name, v_request.person_name,
    'Intake from urgent request', 'active'
  )
  returning id into v_workflow_id;

  insert into public.tasks (
    workflow_id, organization_id, assigned_organization_member_id,
    title, status, waiting_party, due_at, audience, automation_level,
    prepared_output, human_action, proof_destination, next_state, version
  ) values (
    v_workflow_id,
    v_request.receiving_organization_id,
    null,
    'Confirm the family''s first arrangement step.',
    'assigned',
    v_family_name || ' family',
    pg_catalog.clock_timestamp() + interval '4 hours',
    'Authorized case team',
    'manual',
    'Passage opened the case and prepared the first ownership step. Nothing was sent.',
    'Assign an authorized staff member, then confirm the next arrangement step with the family.',
    'Case activity and family update',
    'in_progress with the assigned staff member',
    1
  )
  returning id into v_first_task_id;

  perform passage_private.append_operational_event(
    v_workflow_id,
    v_first_task_id,
    v_request.receiving_organization_id,
    p_organization_location_id,
    v_actor_user_id,
    v_member_id,
    'urgent_intake_first_task:' || v_request.id::text,
    'task.created',
    'not_created',
    'unassigned',
    pg_catalog.jsonb_build_object(
      'source', 'urgent_intake',
      'urgent_intake_request_id', v_request.id,
      'task_title', 'Confirm the family''s first arrangement step.',
      'task_version', 1,
      'assigned_member_id', null
    )
  );

  update public.urgent_intake_requests request_row
  set status = 'case_created',
      version = request_row.version + 1,
      workflow_id = v_workflow_id,
      case_created_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where request_row.id = v_request.id;

  insert into public.urgent_intake_events (
    urgent_intake_request_id, actor_user_id, actor_organization_member_id,
    name, previous_state, next_state, idempotency_key, metadata
  ) values (
    v_request.id, v_actor_user_id, v_member_id,
    'urgent_intake.case_created', 'claimed', 'case_created', v_key,
    pg_catalog.jsonb_build_object(
      'version', v_request.version + 1,
      'expected_version', p_expected_version,
      'workflow_id', v_workflow_id,
      'first_task_id', v_first_task_id,
      'organization_location_id', p_organization_location_id,
      'case_reference', v_case_reference,
      'family_name', v_family_name
    )
  );

  return query
    select
      v_request.id,
      v_workflow_id,
      v_first_task_id,
      'case_created'::text,
      v_request.version + 1,
      false;
end
$function$;

create function public.create_case_from_urgent_intake_idempotent(
  p_urgent_intake_request_id uuid,
  p_expected_version integer,
  p_organization_location_id uuid,
  p_case_reference text,
  p_family_name text,
  p_request_id uuid
)
returns table (
  urgent_intake_request_id uuid,
  workflow_id uuid,
  first_task_id uuid,
  status text,
  version integer,
  replayed boolean
)
language sql
set search_path = ''
as $function$
  select *
  from passage_private.create_case_from_urgent_intake_idempotent(
    p_urgent_intake_request_id,
    p_expected_version,
    p_organization_location_id,
    p_case_reference,
    p_family_name,
    p_request_id
  )
$function$;

-- Repair already-created urgent workflows that have not yet gained any task.
-- Provenance is preserved by the deterministic workflow-event key, allowing
-- the new replay branch to recover the original backfilled task ID without
-- mutating the append-only urgent event.
do $backfill$
declare
  candidate record;
  v_first_task_id uuid;
begin
  for candidate in
    select
      request_row.id as urgent_intake_request_id,
      request_row.receiving_organization_id as organization_id,
      workflow_row.id as workflow_id,
      workflow_row.organization_location_id,
      workflow_row.family_name,
      case_event.actor_user_id,
      case_event.actor_organization_member_id
    from public.urgent_intake_requests request_row
    join public.workflows workflow_row
      on workflow_row.id = request_row.workflow_id
     and workflow_row.organization_id =
       request_row.receiving_organization_id
    join lateral (
      select event_row.actor_user_id, event_row.actor_organization_member_id
      from public.urgent_intake_events event_row
      where event_row.urgent_intake_request_id = request_row.id
        and event_row.name = 'urgent_intake.case_created'
      order by event_row.occurred_at, event_row.id
      limit 1
    ) case_event on true
    where request_row.status = 'case_created'
      and request_row.wants_callback
      and request_row.receiving_organization_id is not null
      and workflow_row.organization_location_id is not null
      and case_event.actor_user_id is not null
      and case_event.actor_organization_member_id is not null
      and not exists (
        select 1
        from public.tasks task_row
        where task_row.workflow_id = workflow_row.id
      )
  loop
    insert into public.tasks (
      workflow_id, organization_id, assigned_organization_member_id,
      title, status, waiting_party, due_at, audience, automation_level,
      prepared_output, human_action, proof_destination, next_state, version
    ) values (
      candidate.workflow_id,
      candidate.organization_id,
      null,
      'Confirm the family''s first arrangement step.',
      'assigned',
      coalesce(nullif(btrim(candidate.family_name), ''), 'Family') || ' family',
      pg_catalog.clock_timestamp() + interval '4 hours',
      'Authorized case team',
      'manual',
      'Passage opened the case and prepared the first ownership step. Nothing was sent.',
      'Assign an authorized staff member, then confirm the next arrangement step with the family.',
      'Case activity and family update',
      'in_progress with the assigned staff member',
      1
    )
    returning id into v_first_task_id;

    perform passage_private.append_operational_event(
      candidate.workflow_id,
      v_first_task_id,
      candidate.organization_id,
      candidate.organization_location_id,
      candidate.actor_user_id,
      candidate.actor_organization_member_id,
      'urgent_intake_first_task:' ||
        candidate.urgent_intake_request_id::text,
      'task.created',
      'not_created',
      'unassigned',
      pg_catalog.jsonb_build_object(
        'source', 'urgent_intake_backfill',
        'urgent_intake_request_id',
          candidate.urgent_intake_request_id,
        'task_title', 'Confirm the family''s first arrangement step.',
        'task_version', 1,
        'assigned_member_id', null
      )
    );
  end loop;

  if exists (
    select 1
    from public.urgent_intake_requests request_row
    join public.workflows workflow_row
      on workflow_row.id = request_row.workflow_id
    where request_row.status = 'case_created'
      and request_row.wants_callback
      and not exists (
        select 1
        from public.tasks task_row
        where task_row.workflow_id = workflow_row.id
      )
  ) then
    raise exception 'Urgent first-commitment backfill left a case without a task';
  end if;
end
$backfill$;

revoke all on function passage_private.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) from public, anon, authenticated, service_role;
revoke all on function public.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) from public, anon, service_role;

grant execute on function passage_private.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) to authenticated;
grant execute on function public.create_case_from_urgent_intake_idempotent(
  uuid, integer, uuid, text, text, uuid
) to authenticated;
