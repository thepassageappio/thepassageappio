-- ISOLATED-LAB-ONLY Cycle 7B durable assigned-work authority and command audit.
--
-- WHAT / WHY / BREAKAGE IF SKIPPED
-- - Add workflow/task operating fields (case reference, family/person context,
--   title, owner, waiting party, due state, status, and version) so Director
--   Today and Staff My work project the same durable rows. Without them the UI
--   can only keep using browser fixtures and cannot prove ownership or reload.
-- - Add least-privilege workload, team, and activity SELECT policies. Without
--   them director/staff pages either reveal too much or cannot read real work.
-- - Add idempotent assignment, start-work, and membership-revocation commands
--   with server-derived append-only events. Without them UI retries can diverge
--   from durable state and claimed receipts can be forged or duplicated.
-- - Keep all direct authenticated writes revoked and preserve family grants and
--   projections unchanged. This migration does not reference family tables.
--
-- Apply through Supabase migration tooling only to isolated project
-- uyacxqtsiwlvtmhxvoxr. Never apply to production qsveqfchwylsbncsfgxe.

do $cycle_7b_preflight$
begin
  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'test_fixture_cycle_7a_production_shape'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7a_isolated_lab_self_authority'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7a_invitation_receipt_timestamp'
     ) then
    raise exception using
      errcode = '42501',
      message = 'Cycle 7B refused: isolated Passage Zero lab markers are missing';
  end if;

  if to_regclass('public.workflows') is null
     or to_regclass('public.tasks') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('public.organization_members') is null
     or to_regprocedure('passage_private.can_manage_location(uuid,uuid)') is null then
    raise exception using
      errcode = '55000',
      message = 'Cycle 7B refused: reviewed Cycle 7A authority foundation is missing';
  end if;

  -- A migration intended for the isolated production-shape lab must not be
  -- applied over an existing workload. The hosted fixture is applied afterward.
  if exists (select 1 from public.workflows)
     or exists (select 1 from public.tasks) then
    raise exception using
      errcode = '42501',
      message = 'Cycle 7B refused: isolated workload tables are not empty';
  end if;
end
$cycle_7b_preflight$;

alter table public.workflows
  add column if not exists case_reference text,
  add column if not exists family_name text,
  add column if not exists person_name text,
  add column if not exists phase text,
  add column if not exists status text not null default 'active';

alter table public.tasks
  add column if not exists title text,
  add column if not exists status text not null default 'assigned',
  add column if not exists waiting_party text,
  add column if not exists due_at timestamp with time zone,
  add column if not exists audience text not null default 'case_team',
  add column if not exists automation_level text not null default 'manual',
  add column if not exists prepared_output text,
  add column if not exists human_action text,
  add column if not exists proof_destination text,
  add column if not exists next_state text,
  add column if not exists version integer not null default 1;

alter table public.organization_members
  add column if not exists revoked_at timestamp with time zone,
  add column if not exists revoked_by_user_id uuid,
  add column if not exists revocation_reason text;

do $cycle_7b_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflows'::regclass
      and conname = 'workflows_cycle_7b_status_check'
  ) then
    alter table public.workflows
      add constraint workflows_cycle_7b_status_check
      check (status in ('active', 'closed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_cycle_7b_status_check'
  ) then
    alter table public.tasks
      add constraint tasks_cycle_7b_status_check
      check (status in ('assigned', 'in_progress', 'blocked', 'completed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_cycle_7b_version_check'
  ) then
    alter table public.tasks
      add constraint tasks_cycle_7b_version_check check (version > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_cycle_7b_revocation_shape_check'
  ) then
    alter table public.organization_members
      add constraint organization_members_cycle_7b_revocation_shape_check
      check (
        (status = 'revoked' and revoked_at is not null and revoked_by_user_id is not null and length(btrim(revocation_reason)) > 0)
        or
        (status <> 'revoked' and revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_revoked_by_user_id_fkey'
  ) then
    alter table public.organization_members
      add constraint organization_members_revoked_by_user_id_fkey
      foreign key (revoked_by_user_id) references auth.users(id) not valid;
  end if;
end
$cycle_7b_constraints$;

create unique index if not exists workflows_cycle_7b_case_reference_unique
  on public.workflows (organization_id, case_reference)
  where organization_id is not null and case_reference is not null;

create index if not exists tasks_cycle_7b_due_status_idx
  on public.tasks (organization_id, status, due_at, id);

create or replace function passage_private.can_view_workflow(p_workflow_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.workflows as w
    where w.id = p_workflow_id
      and w.organization_id is not null
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
$function$;

create or replace function passage_private.can_view_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.tasks as t
    join public.workflows as w on w.id = t.workflow_id
    where t.id = p_task_id
      and t.organization_id = w.organization_id
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
          where m.id = t.assigned_organization_member_id
            and m.organization_id = w.organization_id
            and m.user_id = (select auth.uid())
            and m.status = 'active'
            and m.role = 'staff'
        )
      )
  )
$function$;

create or replace function passage_private.can_view_workflow_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
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
      )
  )
$function$;

create or replace function passage_private.can_view_team_member(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.organization_members as subject_member
    where subject_member.id = p_member_id
      and passage_private.can_manage_organization(subject_member.organization_id)
      and exists (
        select 1
        from public.organization_member_locations as subject_grant
        where subject_grant.organization_member_id = subject_member.id
          and (subject_member.status = 'revoked' or subject_grant.revoked_at is null)
          and passage_private.can_manage_location(
            subject_member.organization_id,
            subject_grant.organization_location_id
          )
      )
  )
$function$;

create or replace function passage_private.append_operational_event(
  p_workflow_id uuid,
  p_task_id uuid,
  p_organization_id uuid,
  p_organization_location_id uuid,
  p_actor_user_id uuid,
  p_actor_member_id uuid,
  p_idempotency_key text,
  p_event_name text,
  p_previous_state text,
  p_next_state text,
  p_metadata jsonb
)
returns table (event_id uuid, occurred_at timestamp with time zone, inserted boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_event_id uuid;
  v_occurred_at timestamp with time zone;
  v_metadata jsonb;
  v_existing public.workflow_events%rowtype;
begin
  if p_organization_id is null
     or p_actor_user_id is null
     or p_actor_member_id is null
     or nullif(btrim(p_idempotency_key), '') is null
     or nullif(btrim(p_event_name), '') is null then
    raise exception 'Operational event authority and idempotency are required'
      using errcode = '22023';
  end if;

  if p_organization_location_id is null
     and (p_workflow_id is not null or p_task_id is not null) then
    raise exception 'Workflow and task events require one location'
      using errcode = '22023';
  end if;

  v_occurred_at := pg_catalog.clock_timestamp();
  v_metadata := coalesce(p_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
    'event_kind', p_event_name,
    'proof_destination', 'organization_activity'
  );
  insert into public.workflow_events (
    workflow_id, event_type, name, organization_id,
    organization_location_id, task_id, actor_user_id,
    actor_organization_member_id, idempotency_key, audience,
    previous_state, next_state, occurred_at, metadata
  ) values (
    p_workflow_id, 'other', p_event_name, p_organization_id,
    p_organization_location_id, p_task_id, p_actor_user_id,
    p_actor_member_id, p_idempotency_key, 'organization_internal',
    p_previous_state, p_next_state, v_occurred_at,
    v_metadata
  )
  on conflict (organization_id, idempotency_key)
    where organization_id is not null and idempotency_key is not null
  do nothing
  returning id, workflow_events.occurred_at into v_event_id, v_occurred_at;

  if v_event_id is null then
    select e.* into strict v_existing
    from public.workflow_events as e
    where e.organization_id = p_organization_id
      and e.idempotency_key = p_idempotency_key;
    if v_existing.workflow_id is distinct from p_workflow_id
       or v_existing.task_id is distinct from p_task_id
       or v_existing.organization_location_id is distinct from p_organization_location_id
       or v_existing.actor_user_id is distinct from p_actor_user_id
       or v_existing.actor_organization_member_id is distinct from p_actor_member_id
       or v_existing.name is distinct from p_event_name
       or v_existing.previous_state is distinct from p_previous_state
       or v_existing.next_state is distinct from p_next_state
       or v_existing.metadata is distinct from v_metadata then
      raise exception 'Operational request conflicts with an earlier command'
        using errcode = '22023';
    end if;
    return query select v_existing.id, v_existing.occurred_at, false;
    return;
  end if;

  return query select v_event_id, v_occurred_at, true;
end
$function$;

create or replace function passage_private.assign_task_idempotent(
  p_task_id uuid,
  p_expected_version integer,
  p_assignee_member_id uuid,
  p_reason text,
  p_request_id uuid
)
returns table (
  task_id uuid,
  previous_member_id uuid,
  assigned_member_id uuid,
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
  v_assignee public.organization_members%rowtype;
  v_actor_member_id uuid;
  v_actor_user_id uuid := (select auth.uid());
  v_event public.workflow_events%rowtype;
  v_event_receipt record;
  v_previous_member_id uuid;
  v_next_version integer;
  v_key text := 'task_assignment:' || p_request_id::text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null or p_expected_version is null or p_assignee_member_id is null
     or nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Assignment request, version, and reason are required' using errcode = '22023';
  end if;

  select t.* into v_task
  from public.tasks as t
  where t.id = p_task_id
  for update;
  if not found then raise exception 'Work is unavailable' using errcode = '42501'; end if;

  select w.* into strict v_workflow
  from public.workflows as w where w.id = v_task.workflow_id;
  if v_workflow.organization_id is null
     or v_workflow.organization_location_id is null
     or not passage_private.can_manage_location(v_workflow.organization_id, v_workflow.organization_location_id) then
    raise exception 'Work is unavailable' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_workflow.organization_id::text || ':' || v_key, 0)
  );

  v_actor_member_id := passage_private.current_active_member_id(v_workflow.organization_id);
  if v_actor_member_id is null then
    raise exception 'Active director authority is required' using errcode = '42501';
  end if;

  select e.* into v_event
  from public.workflow_events as e
  where e.organization_id = v_workflow.organization_id
    and e.idempotency_key = v_key;
  if found then
    if v_event.task_id is distinct from p_task_id
       or v_event.metadata ->> 'assigned_member_id' is distinct from p_assignee_member_id::text
       or (v_event.metadata ->> 'expected_version')::integer is distinct from p_expected_version
       or v_event.metadata ->> 'reason' is distinct from btrim(p_reason) then
      raise exception 'Assignment request conflicts with an earlier command'
        using errcode = '22023';
    end if;
    return query select
      p_task_id,
      nullif(v_event.metadata ->> 'previous_member_id', '')::uuid,
      (v_event.metadata ->> 'assigned_member_id')::uuid,
      v_event.metadata ->> 'task_status',
      (v_event.metadata ->> 'task_version')::integer,
      v_event.id,
      v_event.occurred_at,
      true;
    return;
  end if;

  select m.* into v_assignee
  from public.organization_members as m
  where m.id = p_assignee_member_id
  for update;
  if v_assignee.id is null
     or v_assignee.organization_id <> v_workflow.organization_id
     or v_assignee.status <> 'active'
     or v_assignee.role <> 'staff'
     or not exists (
       select 1 from public.organization_member_locations as ml
       where ml.organization_member_id = v_assignee.id
         and ml.organization_location_id = v_workflow.organization_location_id
         and ml.revoked_at is null
     ) then
    raise exception 'Choose active staff authorized for this location'
      using errcode = '42501';
  end if;

  if v_task.assigned_organization_member_id = v_assignee.id then
    raise exception 'Work is already assigned to that staff member'
      using errcode = '55000';
  end if;
  if v_task.status = 'completed' then
    raise exception 'Completed work cannot be reassigned' using errcode = '55000';
  end if;
  if v_task.version <> p_expected_version then
    raise exception 'Ownership changed before the action was saved' using errcode = '40001';
  end if;

  v_previous_member_id := v_task.assigned_organization_member_id;
  v_next_version := v_task.version + 1;
  update public.tasks as t
  set assigned_organization_member_id = v_assignee.id,
      version = v_next_version,
      updated_at = pg_catalog.clock_timestamp()
  where t.id = v_task.id;

  select * into strict v_event_receipt
  from passage_private.append_operational_event(
    v_workflow.id,
    v_task.id,
    v_workflow.organization_id,
    v_workflow.organization_location_id,
    v_actor_user_id,
    v_actor_member_id,
    v_key,
    case when v_previous_member_id is null then 'task.assigned' else 'task.reassigned' end,
    coalesce(v_previous_member_id::text, 'unassigned'),
    v_assignee.id::text,
    pg_catalog.jsonb_build_object(
      'previous_member_id', coalesce(v_previous_member_id::text, ''),
      'assigned_member_id', v_assignee.id::text,
      'assigned_member_name', coalesce(v_assignee.display_name, v_assignee.email),
      'reason', btrim(p_reason),
      'expected_version', p_expected_version,
      'task_status', v_task.status,
      'task_version', v_next_version,
      'task_title', v_task.title,
      'case_reference', v_workflow.case_reference
    )
  );

  return query select
    v_task.id,
    v_previous_member_id,
    v_assignee.id,
    v_task.status,
    v_next_version,
    v_event_receipt.event_id,
    v_event_receipt.occurred_at,
    false;
end
$function$;

create or replace function passage_private.start_task_idempotent(
  p_task_id uuid,
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
  v_key text := 'task_start:' || p_request_id::text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null or p_expected_version is null then
    raise exception 'Start-work request and version are required' using errcode = '22023';
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
    if v_event.task_id is distinct from p_task_id
       or v_event.actor_user_id is distinct from v_actor_user_id
       or (v_event.metadata ->> 'expected_version')::integer is distinct from p_expected_version then
      raise exception 'Start-work request conflicts with an earlier command'
        using errcode = '22023';
    end if;
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
  if v_task.status <> 'assigned' then
    raise exception 'Only assigned work can be started' using errcode = '55000';
  end if;

  v_next_version := v_task.version + 1;
  update public.tasks as t
  set status = 'in_progress', version = v_next_version,
      updated_at = pg_catalog.clock_timestamp()
  where t.id = v_task.id;

  select * into strict v_event_receipt
  from passage_private.append_operational_event(
    v_workflow.id, v_task.id, v_workflow.organization_id,
    v_workflow.organization_location_id, v_actor_user_id, v_actor.id,
    v_key, 'task.started', 'assigned', 'in_progress',
    pg_catalog.jsonb_build_object(
      'expected_version', p_expected_version,
      'task_status', 'in_progress',
      'task_version', v_next_version,
      'task_title', v_task.title,
      'case_reference', v_workflow.case_reference
    )
  );

  return query select v_task.id, 'in_progress'::text, v_next_version,
    v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

create or replace function passage_private.revoke_organization_member_idempotent(
  p_member_id uuid,
  p_reason text,
  p_request_id uuid
)
returns table (
  member_id uuid,
  revoked_at timestamp with time zone,
  event_id uuid,
  occurred_at timestamp with time zone,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_target public.organization_members%rowtype;
  v_actor_member_id uuid;
  v_actor_user_id uuid := (select auth.uid());
  v_event public.workflow_events%rowtype;
  v_location_ids uuid[];
  v_revoked_at timestamp with time zone;
  v_event_receipt record;
  v_key text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null or nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Revocation request and reason are required' using errcode = '22023';
  end if;

  select m.* into v_target
  from public.organization_members as m where m.id = p_member_id for update;
  if not found then raise exception 'Team member is unavailable' using errcode = '42501'; end if;
  if not passage_private.can_manage_organization(v_target.organization_id) then
    raise exception 'Team member is unavailable' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_target.organization_id);
  if v_actor_member_id is null or v_actor_member_id = v_target.id then
    raise exception 'You cannot revoke this membership' using errcode = '42501';
  end if;

  v_key := 'organization_member_revocation:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_target.organization_id::text || ':' || v_key, 0)
  );
  select e.* into v_event
  from public.workflow_events as e
  where e.organization_id = v_target.organization_id
    and e.idempotency_key = v_key;
  if found then
    if v_target.status <> 'revoked'
       or v_event.metadata ->> 'revoked_member_id' is distinct from v_target.id::text
       or v_event.metadata ->> 'reason' is distinct from btrim(p_reason)
       or v_event.metadata ->> 'request_id' is distinct from p_request_id::text then
      raise exception 'Revocation request conflicts with an earlier command'
        using errcode = '22023';
    end if;
    return query select v_target.id, v_target.revoked_at, v_event.id,
      v_event.occurred_at, true;
    return;
  end if;
  if v_target.status = 'revoked' then
    raise exception 'Team access was already ended by another command'
      using errcode = '55000';
  end if;

  select coalesce(array_agg(ml.organization_location_id order by ml.organization_location_id), '{}'::uuid[])
  into v_location_ids
  from public.organization_member_locations as ml
  where ml.organization_member_id = v_target.id and ml.revoked_at is null;
  if cardinality(v_location_ids) = 0
     or exists (
       select 1 from unnest(v_location_ids) as location_id
       where not passage_private.can_manage_location(v_target.organization_id, location_id)
     ) then
    raise exception 'Team member is unavailable' using errcode = '42501';
  end if;

  if v_target.status <> 'active' or v_target.role <> 'staff' then
    raise exception 'Only active staff access can be revoked' using errcode = '55000';
  end if;
  if exists (
    select 1 from public.tasks as t
    where t.assigned_organization_member_id = v_target.id
      and t.status in ('assigned', 'in_progress', 'blocked')
  ) then
    raise exception 'Reassign active commitments before ending access'
      using errcode = '55000';
  end if;

  v_revoked_at := pg_catalog.clock_timestamp();
  update public.organization_member_locations as ml
  set revoked_at = v_revoked_at
  where ml.organization_member_id = v_target.id and ml.revoked_at is null;
  update public.organization_members as m
  set status = 'revoked', revoked_at = v_revoked_at,
      revoked_by_user_id = v_actor_user_id,
      revocation_reason = btrim(p_reason), updated_at = v_revoked_at
  where m.id = v_target.id;

  select * into strict v_event_receipt
  from passage_private.append_operational_event(
    null, null, v_target.organization_id,
    case when cardinality(v_location_ids) = 1 then v_location_ids[1] else null end,
    v_actor_user_id, v_actor_member_id, v_key,
    'organization_member.revoked', 'active', 'revoked',
    pg_catalog.jsonb_build_object(
      'revoked_member_id', v_target.id::text,
      'revoked_member_name', coalesce(v_target.display_name, v_target.email),
      'location_ids', pg_catalog.to_jsonb(v_location_ids),
      'reason', btrim(p_reason),
      'request_id', p_request_id::text
    )
  );

  return query select v_target.id, v_revoked_at,
    v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

alter function passage_private.accept_organization_invitation(text)
  rename to accept_organization_invitation_cycle_7a;

create or replace function passage_private.accept_organization_invitation(p_raw_token text)
returns table (
  organization_member_id uuid,
  organization_id uuid,
  member_role text,
  organization_location_ids uuid[],
  landing_path text,
  accepted_at timestamp with time zone,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_verified_email text;
  v_invitation public.organization_invitations%rowtype;
  v_member public.organization_members%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if length(coalesce(p_raw_token, '')) < 32 then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  v_verified_email := passage_private.current_verified_email();

  select i.* into v_invitation
  from public.organization_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  for update;
  if not found then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by_user_id <> v_actor_user_id then
      raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
    end if;
    select m.* into v_member
    from public.organization_members as m
    where m.id = v_invitation.accepted_organization_member_id
    for share;
    if v_member.id is null or v_member.status <> 'active' or v_member.revoked_at is not null then
      raise exception 'Invitation membership access has ended' using errcode = '55000';
    end if;
  else
    select m.* into v_member
    from public.organization_members as m
    where m.organization_id = v_invitation.organization_id
      and (m.user_id = v_actor_user_id or lower(btrim(m.email)) = v_verified_email)
    order by m.created_at, m.id
    limit 1
    for share;
    if v_member.id is not null and (v_member.status = 'revoked' or v_member.revoked_at is not null) then
      raise exception 'Previously revoked membership requires administrator review'
        using errcode = '55000';
    end if;
  end if;

  return query
  select * from passage_private.accept_organization_invitation_cycle_7a(p_raw_token);
end
$function$;

create or replace function passage_private.inspect_organization_invitation(p_raw_token text)
returns table (
  inviter_display_name text,
  organization_name text,
  invitation_role text,
  location_names text[],
  invitation_purpose text,
  invitation_expires_at timestamp with time zone,
  invitation_state text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    coalesce(
      (
        select m.display_name from public.organization_members as m
        where m.organization_id = i.organization_id
          and m.user_id = i.invited_by_user_id
        order by m.created_at, m.id limit 1
      ),
      'A funeral home administrator'
    ),
    o.name,
    i.role,
    coalesce(
      (
        select array_agg(l.name order by l.name, l.id)
        from public.organization_invitation_locations as il
        join public.organization_locations as l on l.id = il.organization_location_id
        where il.invitation_id = i.id
      ),
      '{}'::text[]
    ),
    i.purpose,
    i.expires_at,
    case
      when i.accepted_at is not null and not exists (
        select 1 from public.organization_members as accepted_member
        where accepted_member.id = i.accepted_organization_member_id
          and accepted_member.status = 'active'
          and accepted_member.revoked_at is null
      ) then 'access_ended'
      when i.accepted_at is not null then 'accepted'
      when i.revoked_at is not null then 'revoked'
      when i.expires_at <= pg_catalog.clock_timestamp() then 'expired'
      else 'available'
    end
  from public.organization_invitations as i
  join public.organizations as o on o.id = i.organization_id
  where length(coalesce(p_raw_token, '')) >= 32
    and i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  limit 1
$function$;

create or replace function public.accept_organization_invitation(raw_token text)
returns table (
  organization_member_id uuid,
  organization_id uuid,
  member_role text,
  organization_location_ids uuid[],
  landing_path text,
  accepted_at timestamp with time zone,
  replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.accept_organization_invitation(raw_token)
$function$;

create or replace function public.assign_task_idempotent(
  p_task_id uuid, p_expected_version integer, p_assignee_member_id uuid, p_reason text, p_request_id uuid
)
returns table (
  task_id uuid, previous_member_id uuid, assigned_member_id uuid,
  task_status text, task_version integer, event_id uuid,
  occurred_at timestamp with time zone, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.assign_task_idempotent(
    p_task_id, p_expected_version, p_assignee_member_id, p_reason, p_request_id
  )
$function$;

create or replace function public.start_task_idempotent(
  p_task_id uuid, p_expected_version integer, p_request_id uuid
)
returns table (
  task_id uuid, task_status text, task_version integer,
  event_id uuid, occurred_at timestamp with time zone, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.start_task_idempotent(
    p_task_id, p_expected_version, p_request_id
  )
$function$;

create or replace function public.revoke_organization_member_idempotent(
  p_member_id uuid, p_reason text, p_request_id uuid
)
returns table (
  member_id uuid, revoked_at timestamp with time zone,
  event_id uuid, occurred_at timestamp with time zone, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.revoke_organization_member_idempotent(
    p_member_id, p_reason, p_request_id
  )
$function$;

create or replace function passage_private.reject_workflow_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if current_setting('passage.fixture_reset', true) = 'cycle_7b_isolated_lab' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  raise exception 'Workflow events are append-only' using errcode = '42501';
end
$function$;

drop trigger if exists workflow_events_cycle_7b_append_only on public.workflow_events;
create trigger workflow_events_cycle_7b_append_only
before update or delete on public.workflow_events
for each row execute function passage_private.reject_workflow_event_mutation();

alter table public.workflows enable row level security;
alter table public.tasks enable row level security;
alter table public.workflow_events enable row level security;

drop policy if exists cycle_7b_workflows_authorized_select on public.workflows;
create policy cycle_7b_workflows_authorized_select on public.workflows
  for select to authenticated using (passage_private.can_view_workflow(id));

drop policy if exists cycle_7b_tasks_authorized_select on public.tasks;
create policy cycle_7b_tasks_authorized_select on public.tasks
  for select to authenticated using (passage_private.can_view_task(id));

drop policy if exists cycle_7b_events_authorized_select on public.workflow_events;
create policy cycle_7b_events_authorized_select on public.workflow_events
  for select to authenticated using (passage_private.can_view_workflow_event(id));

drop policy if exists cycle_7b_members_manager_select on public.organization_members;
create policy cycle_7b_members_manager_select on public.organization_members
  for select to authenticated using (passage_private.can_view_team_member(id));

drop policy if exists cycle_7b_members_revoked_self_select on public.organization_members;
create policy cycle_7b_members_revoked_self_select on public.organization_members
  for select to authenticated using (
    user_id = (select auth.uid()) and status = 'revoked'
  );

revoke all on table public.workflows from anon, authenticated;
revoke all on table public.tasks from anon, authenticated;
revoke all on table public.workflow_events from anon, authenticated;
revoke all on table public.organization_invitations from anon, authenticated;
revoke all on table public.organization_invitation_locations from anon, authenticated;
grant select on table public.workflows to authenticated;
grant select on table public.tasks to authenticated;
grant select on table public.workflow_events to authenticated;
grant select on table public.organization_invitations to authenticated;
grant select on table public.organization_invitation_locations to authenticated;

revoke all on function passage_private.can_view_workflow(uuid) from public, anon, authenticated;
revoke all on function passage_private.can_view_task(uuid) from public, anon, authenticated;
revoke all on function passage_private.can_view_workflow_event(uuid) from public, anon, authenticated;
revoke all on function passage_private.can_view_team_member(uuid) from public, anon, authenticated;
revoke all on function passage_private.append_operational_event(uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function passage_private.assign_task_idempotent(uuid,integer,uuid,text,uuid) from public, anon, authenticated;
revoke all on function passage_private.start_task_idempotent(uuid,integer,uuid) from public, anon, authenticated;
revoke all on function passage_private.revoke_organization_member_idempotent(uuid,text,uuid) from public, anon, authenticated;
revoke all on function passage_private.reject_workflow_event_mutation() from public, anon, authenticated;
revoke all on function passage_private.accept_organization_invitation_cycle_7a(text) from public, anon, authenticated;
revoke all on function passage_private.accept_organization_invitation(text) from public, anon, authenticated;

grant execute on function passage_private.can_view_workflow(uuid) to authenticated;
grant execute on function passage_private.can_view_task(uuid) to authenticated;
grant execute on function passage_private.can_view_workflow_event(uuid) to authenticated;
grant execute on function passage_private.can_view_team_member(uuid) to authenticated;
grant execute on function passage_private.assign_task_idempotent(uuid,integer,uuid,text,uuid) to authenticated;
grant execute on function passage_private.start_task_idempotent(uuid,integer,uuid) to authenticated;
grant execute on function passage_private.revoke_organization_member_idempotent(uuid,text,uuid) to authenticated;
grant execute on function passage_private.accept_organization_invitation(text) to authenticated;

revoke all on function public.assign_task_idempotent(uuid,integer,uuid,text,uuid) from public, anon, authenticated, service_role;
revoke all on function public.start_task_idempotent(uuid,integer,uuid) from public, anon, authenticated, service_role;
revoke all on function public.revoke_organization_member_idempotent(uuid,text,uuid) from public, anon, authenticated, service_role;
revoke all on function public.accept_organization_invitation(text) from public, anon, authenticated, service_role;
grant execute on function public.assign_task_idempotent(uuid,integer,uuid,text,uuid) to authenticated;
grant execute on function public.start_task_idempotent(uuid,integer,uuid) to authenticated;
grant execute on function public.revoke_organization_member_idempotent(uuid,text,uuid) to authenticated;
grant execute on function public.accept_organization_invitation(text) to authenticated;
