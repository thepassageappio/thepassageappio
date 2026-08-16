-- Production task/commitment/proof spine.
--
-- Ports the design proven on the isolated lab (cycle_7b_assigned_work.sql,
-- cycle_8_task_proof_loop.sql, cycle_7a_invitation_creation_idempotency.sql,
-- cycle_7a_invitation_receipt_timestamp.sql -- all explicitly marked
-- "never apply to production") into a production-safe migration written
-- against this database's actual schema instead of the lab's synthetic
-- fixture state. Those files' RPCs (assign_task_idempotent,
-- start_task_idempotent, submit_task_proof_idempotent,
-- review_task_proof_idempotent, create_employee_invitation_idempotent[_v2])
-- were never runnable on production -- the app called them, they didn't
-- exist, every director/staff assignment and proof action failed outright.
--
-- Differences from the lab originals, deliberate:
-- - No isolated-lab preflight guards or fixture-cardinality checks.
-- - Existing test-data status values are normalized before constraints are
--   added, rather than requiring empty tables.
-- - New SELECT policies are additive alongside existing legacy policies
--   (never revoked), so this cannot regress whatever the legacy Threshold
--   consumer app currently depends on.
-- - Append-only triggers have no lab fixture-reset escape hatch.
-- - Invitation creation reuses this database's own already-live
--   create_employee_invitation / can_manage_invitation rather than a lab
--   copy of them.

-- === Workflow/task operating fields ===
-- NOTE: legacy `workflows_status_check` and `tasks_status_check` constraints
-- already exist on production with their own (larger) legacy vocabularies.
-- No status values are renamed here -- the new RPCs below only ever read/write
-- tasks.status (never workflows.status), so tasks_status_check is widened to
-- include 'proof_submitted' and workflows_status_check is left untouched.
alter table public.workflows
  add column if not exists case_reference text,
  add column if not exists family_name text,
  add column if not exists person_name text,
  add column if not exists phase text,
  add column if not exists version integer not null default 1;

alter table public.tasks
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

do $constraints$
begin
  alter table public.tasks drop constraint if exists tasks_status_check;
  alter table public.tasks add constraint tasks_status_check check (status in (
    'pending', 'draft', 'assigned', 'in_progress', 'blocked', 'done', 'skipped',
    'handled', 'not_started', 'needs_owner', 'completed', 'waiting', 'active',
    'proof_submitted'
  ));

  if not exists (select 1 from pg_constraint where conrelid = 'public.tasks'::regclass and conname = 'tasks_version_check') then
    alter table public.tasks add constraint tasks_version_check check (version > 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.organization_members'::regclass and conname = 'organization_members_revocation_shape_check') then
    alter table public.organization_members add constraint organization_members_revocation_shape_check
      check (
        (status = 'revoked' and revoked_at is not null and revoked_by_user_id is not null and length(btrim(revocation_reason)) > 0)
        or
        (status <> 'revoked' and revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
      );
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.organization_members'::regclass and conname = 'organization_members_revoked_by_user_id_fkey') then
    alter table public.organization_members add constraint organization_members_revoked_by_user_id_fkey
      foreign key (revoked_by_user_id) references auth.users(id) not valid;
  end if;
end
$constraints$;

create index if not exists tasks_org_status_due_idx on public.tasks (organization_id, status, due_at, id);

-- === Authority predicates ===
create or replace function passage_private.can_view_workflow(p_workflow_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select exists (
    select 1 from public.workflows as w
    where w.id = p_workflow_id
      and w.organization_id is not null
      and w.organization_location_id is not null
      and (
        passage_private.can_manage_location(w.organization_id, w.organization_location_id)
        or exists (
          select 1 from public.organization_members as m
          join public.organization_member_locations as ml on ml.organization_member_id = m.id and ml.organization_location_id = w.organization_location_id and ml.revoked_at is null
          join public.tasks as t on t.workflow_id = w.id and t.assigned_organization_member_id = m.id
          where m.organization_id = w.organization_id and m.user_id = (select auth.uid()) and m.status = 'active' and m.role = 'staff'
        )
      )
  )
$function$;

create or replace function passage_private.can_view_task(p_task_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select exists (
    select 1 from public.tasks as t
    join public.workflows as w on w.id = t.workflow_id
    where t.id = p_task_id
      and t.organization_id = w.organization_id
      and w.organization_location_id is not null
      and (
        passage_private.can_manage_location(w.organization_id, w.organization_location_id)
        or exists (
          select 1 from public.organization_members as m
          join public.organization_member_locations as ml on ml.organization_member_id = m.id and ml.organization_location_id = w.organization_location_id and ml.revoked_at is null
          where m.id = t.assigned_organization_member_id and m.organization_id = w.organization_id and m.user_id = (select auth.uid()) and m.status = 'active' and m.role = 'staff'
        )
      )
  )
$function$;

create or replace function passage_private.can_view_workflow_event(p_event_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select exists (
    select 1 from public.workflow_events as e
    where e.id = p_event_id
      and e.organization_id is not null
      and (
        passage_private.can_manage_organization(e.organization_id)
        or (e.task_id is not null and passage_private.can_view_task(e.task_id))
      )
  )
$function$;

create or replace function passage_private.can_view_team_member(p_member_id uuid)
returns boolean language sql stable security definer set search_path = '' as $function$
  select exists (
    select 1 from public.organization_members as subject_member
    where subject_member.id = p_member_id
      and passage_private.can_manage_organization(subject_member.organization_id)
  )
$function$;

create or replace function passage_private.append_operational_event(
  p_workflow_id uuid, p_task_id uuid, p_organization_id uuid, p_organization_location_id uuid,
  p_actor_user_id uuid, p_actor_member_id uuid, p_idempotency_key text, p_event_name text,
  p_previous_state text, p_next_state text, p_metadata jsonb
)
returns table (event_id uuid, occurred_at timestamp with time zone, inserted boolean)
language plpgsql security definer set search_path = '' as $function$
declare
  v_event_id uuid;
  v_occurred_at timestamp with time zone;
  v_metadata jsonb;
  v_existing public.workflow_events%rowtype;
begin
  if p_organization_id is null or p_actor_user_id is null or p_actor_member_id is null
     or nullif(btrim(p_idempotency_key), '') is null or nullif(btrim(p_event_name), '') is null then
    raise exception 'Operational event authority and idempotency are required' using errcode = '22023';
  end if;

  v_occurred_at := pg_catalog.clock_timestamp();
  v_metadata := coalesce(p_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object('event_kind', p_event_name, 'proof_destination', 'organization_activity');
  insert into public.workflow_events (
    workflow_id, event_type, name, organization_id, organization_location_id, task_id,
    actor_user_id, actor_organization_member_id, idempotency_key, audience, previous_state, next_state, occurred_at, metadata
  ) values (
    p_workflow_id, 'other', p_event_name, p_organization_id, p_organization_location_id, p_task_id,
    p_actor_user_id, p_actor_member_id, p_idempotency_key, 'organization_internal', p_previous_state, p_next_state, v_occurred_at, v_metadata
  )
  on conflict (organization_id, idempotency_key) where organization_id is not null and idempotency_key is not null
  do nothing
  returning id, workflow_events.occurred_at into v_event_id, v_occurred_at;

  if v_event_id is null then
    select e.* into strict v_existing from public.workflow_events as e
    where e.organization_id = p_organization_id and e.idempotency_key = p_idempotency_key;
    return query select v_existing.id, v_existing.occurred_at, false;
    return;
  end if;
  return query select v_event_id, v_occurred_at, true;
end
$function$;

-- === Assignment, start-work, revocation ===
create or replace function passage_private.assign_task_idempotent(
  p_task_id uuid, p_expected_version integer, p_assignee_member_id uuid, p_reason text, p_request_id uuid
)
returns table (task_id uuid, previous_member_id uuid, assigned_member_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language plpgsql security definer set search_path = '' as $function$
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
  if v_actor_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_request_id is null or p_expected_version is null or p_assignee_member_id is null or nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Assignment request, version, and reason are required' using errcode = '22023';
  end if;

  select t.* into v_task from public.tasks as t where t.id = p_task_id for update;
  if not found then raise exception 'Work is unavailable' using errcode = '42501'; end if;
  select w.* into strict v_workflow from public.workflows as w where w.id = v_task.workflow_id;
  if v_workflow.organization_id is null or v_workflow.organization_location_id is null
     or not passage_private.can_manage_location(v_workflow.organization_id, v_workflow.organization_location_id) then
    raise exception 'Work is unavailable' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_workflow.organization_id::text || ':' || v_key, 0));
  v_actor_member_id := passage_private.current_active_member_id(v_workflow.organization_id);
  if v_actor_member_id is null then raise exception 'Active director authority is required' using errcode = '42501'; end if;

  select e.* into v_event from public.workflow_events as e where e.organization_id = v_workflow.organization_id and e.idempotency_key = v_key;
  if found then
    return query select p_task_id, nullif(v_event.metadata ->> 'previous_member_id', '')::uuid, (v_event.metadata ->> 'assigned_member_id')::uuid,
      v_event.metadata ->> 'task_status', (v_event.metadata ->> 'task_version')::integer, v_event.id, v_event.occurred_at, true;
    return;
  end if;

  select m.* into v_assignee from public.organization_members as m where m.id = p_assignee_member_id for update;
  if v_assignee.id is null or v_assignee.organization_id <> v_workflow.organization_id or v_assignee.status <> 'active' or v_assignee.role <> 'staff'
     or not exists (select 1 from public.organization_member_locations as ml where ml.organization_member_id = v_assignee.id and ml.organization_location_id = v_workflow.organization_location_id and ml.revoked_at is null) then
    raise exception 'Choose active staff authorized for this location' using errcode = '42501';
  end if;

  if v_task.assigned_organization_member_id = v_assignee.id then raise exception 'Work is already assigned to that staff member' using errcode = '55000'; end if;
  if v_task.status = 'completed' then raise exception 'Completed work cannot be reassigned' using errcode = '55000'; end if;
  if v_task.version <> p_expected_version then raise exception 'Ownership changed before the action was saved' using errcode = '40001'; end if;

  v_previous_member_id := v_task.assigned_organization_member_id;
  v_next_version := v_task.version + 1;
  update public.tasks as t set assigned_organization_member_id = v_assignee.id, status = case when t.status = 'assigned' then 'assigned' else t.status end,
    version = v_next_version, updated_at = pg_catalog.clock_timestamp() where t.id = v_task.id;

  select * into strict v_event_receipt from passage_private.append_operational_event(
    v_workflow.id, v_task.id, v_workflow.organization_id, v_workflow.organization_location_id, v_actor_user_id, v_actor_member_id, v_key,
    case when v_previous_member_id is null then 'task.assigned' else 'task.reassigned' end,
    coalesce(v_previous_member_id::text, 'unassigned'), v_assignee.id::text,
    pg_catalog.jsonb_build_object('previous_member_id', coalesce(v_previous_member_id::text, ''), 'assigned_member_id', v_assignee.id::text,
      'assigned_member_name', coalesce(v_assignee.display_name, v_assignee.email), 'reason', btrim(p_reason), 'expected_version', p_expected_version,
      'task_status', v_task.status, 'task_version', v_next_version, 'task_title', v_task.title, 'case_reference', v_workflow.case_reference)
  );
  return query select v_task.id, v_previous_member_id, v_assignee.id, v_task.status, v_next_version, v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

create or replace function passage_private.start_task_idempotent(p_task_id uuid, p_expected_version integer, p_request_id uuid)
returns table (task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language plpgsql security definer set search_path = '' as $function$
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
  if v_actor_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_request_id is null or p_expected_version is null then raise exception 'Start-work request and version are required' using errcode = '22023'; end if;

  select t.* into v_task from public.tasks as t where t.id = p_task_id for update;
  if not found then raise exception 'Work is unavailable' using errcode = '42501'; end if;
  select w.* into strict v_workflow from public.workflows as w where w.id = v_task.workflow_id;
  select m.* into v_actor from public.organization_members as m where m.organization_id = v_workflow.organization_id and m.user_id = v_actor_user_id and m.status = 'active' order by m.created_at, m.id limit 1;
  if v_actor.id is null or v_actor.role <> 'staff' then raise exception 'Assigned staff authority is required' using errcode = '42501'; end if;
  if v_task.assigned_organization_member_id <> v_actor.id
     or not exists (select 1 from public.organization_member_locations as ml where ml.organization_member_id = v_actor.id and ml.organization_location_id = v_workflow.organization_location_id and ml.revoked_at is null) then
    raise exception 'Work is unavailable' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_workflow.organization_id::text || ':' || v_key, 0));
  select e.* into v_event from public.workflow_events as e where e.organization_id = v_workflow.organization_id and e.idempotency_key = v_key;
  if found then
    return query select p_task_id, v_event.metadata ->> 'task_status', (v_event.metadata ->> 'task_version')::integer, v_event.id, v_event.occurred_at, true;
    return;
  end if;

  if v_task.version <> p_expected_version then raise exception 'Work changed before the action was saved' using errcode = '40001'; end if;
  if v_task.status <> 'assigned' then raise exception 'Only assigned work can be started' using errcode = '55000'; end if;

  v_next_version := v_task.version + 1;
  update public.tasks as t set status = 'in_progress', version = v_next_version, updated_at = pg_catalog.clock_timestamp() where t.id = v_task.id;

  select * into strict v_event_receipt from passage_private.append_operational_event(
    v_workflow.id, v_task.id, v_workflow.organization_id, v_workflow.organization_location_id, v_actor_user_id, v_actor.id,
    v_key, 'task.started', 'assigned', 'in_progress',
    pg_catalog.jsonb_build_object('expected_version', p_expected_version, 'task_status', 'in_progress', 'task_version', v_next_version, 'task_title', v_task.title, 'case_reference', v_workflow.case_reference)
  );
  return query select v_task.id, 'in_progress'::text, v_next_version, v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

create or replace function passage_private.revoke_organization_member_idempotent(p_member_id uuid, p_reason text, p_request_id uuid)
returns table (member_id uuid, revoked_at timestamp with time zone, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language plpgsql security definer set search_path = '' as $function$
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
  if v_actor_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_request_id is null or nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Revocation request and reason are required' using errcode = '22023'; end if;

  select m.* into v_target from public.organization_members as m where m.id = p_member_id for update;
  if not found then raise exception 'Team member is unavailable' using errcode = '42501'; end if;
  if not passage_private.can_manage_organization(v_target.organization_id) then raise exception 'Team member is unavailable' using errcode = '42501'; end if;
  v_actor_member_id := passage_private.current_active_member_id(v_target.organization_id);
  if v_actor_member_id is null or v_actor_member_id = v_target.id then raise exception 'You cannot revoke this membership' using errcode = '42501'; end if;

  v_key := 'organization_member_revocation:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_target.organization_id::text || ':' || v_key, 0));
  select e.* into v_event from public.workflow_events as e where e.organization_id = v_target.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_target.id, v_target.revoked_at, v_event.id, v_event.occurred_at, true;
    return;
  end if;
  if v_target.status = 'revoked' then raise exception 'Team access was already ended by another command' using errcode = '55000'; end if;
  if v_target.status <> 'active' or v_target.role <> 'staff' then raise exception 'Only active staff access can be revoked' using errcode = '55000'; end if;
  if exists (select 1 from public.tasks as t where t.assigned_organization_member_id = v_target.id and t.status in ('assigned', 'in_progress', 'blocked')) then
    raise exception 'Reassign active commitments before ending access' using errcode = '55000';
  end if;

  select coalesce(array_agg(ml.organization_location_id order by ml.organization_location_id), '{}'::uuid[]) into v_location_ids
  from public.organization_member_locations as ml where ml.organization_member_id = v_target.id and ml.revoked_at is null;

  v_revoked_at := pg_catalog.clock_timestamp();
  update public.organization_member_locations as ml set revoked_at = v_revoked_at where ml.organization_member_id = v_target.id and ml.revoked_at is null;
  update public.organization_members as m set status = 'revoked', revoked_at = v_revoked_at, revoked_by_user_id = v_actor_user_id, revocation_reason = btrim(p_reason), updated_at = v_revoked_at where m.id = v_target.id;

  select * into strict v_event_receipt from passage_private.append_operational_event(
    null, null, v_target.organization_id, case when cardinality(v_location_ids) = 1 then v_location_ids[1] else null end,
    v_actor_user_id, v_actor_member_id, v_key, 'organization_member.revoked', 'active', 'revoked',
    pg_catalog.jsonb_build_object('revoked_member_id', v_target.id::text, 'revoked_member_name', coalesce(v_target.display_name, v_target.email), 'location_ids', pg_catalog.to_jsonb(v_location_ids), 'reason', btrim(p_reason), 'request_id', p_request_id::text)
  );
  return query select v_target.id, v_revoked_at, v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

-- === Task proofs ===
create table if not exists public.task_proofs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workflow_id uuid not null references public.workflows(id),
  task_id uuid not null references public.tasks(id),
  submitted_by_user_id uuid not null references auth.users(id),
  submitted_by_organization_member_id uuid not null references public.organization_members(id),
  proof_type text not null,
  completion_summary text not null,
  reference text,
  audience text not null default 'case_team',
  proof_destination text not null,
  supersedes_proof_id uuid references public.task_proofs(id),
  request_id uuid not null,
  expected_task_version integer not null,
  submitted_at timestamp with time zone not null default clock_timestamp(),
  constraint task_proofs_type_check check (proof_type in ('confirmation', 'handoff', 'reference', 'completion_note')),
  constraint task_proofs_summary_check check (length(btrim(completion_summary)) between 1 and 2000),
  constraint task_proofs_reference_check check (reference is null or length(btrim(reference)) between 1 and 240),
  constraint task_proofs_destination_check check (length(btrim(proof_destination)) between 1 and 160),
  constraint task_proofs_version_check check (expected_task_version > 0),
  constraint task_proofs_not_self_superseding_check check (supersedes_proof_id is null or supersedes_proof_id <> id),
  constraint task_proofs_org_request_unique unique (organization_id, request_id)
);

create table if not exists public.task_proof_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  workflow_id uuid not null references public.workflows(id),
  task_id uuid not null references public.tasks(id),
  proof_id uuid not null references public.task_proofs(id),
  reviewed_by_user_id uuid not null references auth.users(id),
  reviewed_by_organization_member_id uuid not null references public.organization_members(id),
  decision text not null,
  reason text,
  request_id uuid not null,
  expected_task_version integer not null,
  reviewed_at timestamp with time zone not null default clock_timestamp(),
  constraint task_proof_reviews_decision_check check (decision in ('verified', 'needs_replacement')),
  constraint task_proof_reviews_reason_check check ((decision = 'verified' and reason is null) or (decision = 'needs_replacement' and length(btrim(reason)) between 1 and 500)),
  constraint task_proof_reviews_version_check check (expected_task_version > 0),
  constraint task_proof_reviews_proof_unique unique (proof_id),
  constraint task_proof_reviews_org_request_unique unique (organization_id, request_id)
);

create index if not exists task_proofs_task_submitted_idx on public.task_proofs (task_id, submitted_at, id);
create unique index if not exists task_proofs_one_replacement_per_prior_unique on public.task_proofs (supersedes_proof_id) where supersedes_proof_id is not null;
create unique index if not exists task_proofs_one_root_per_task_unique on public.task_proofs (task_id) where supersedes_proof_id is null;
create index if not exists task_proof_reviews_task_reviewed_idx on public.task_proof_reviews (task_id, reviewed_at, id);

create or replace function passage_private.reject_workflow_event_mutation()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  raise exception 'Workflow events are append-only' using errcode = '42501';
end
$function$;
drop trigger if exists workflow_events_append_only on public.workflow_events;
create trigger workflow_events_append_only before update or delete on public.workflow_events for each row execute function passage_private.reject_workflow_event_mutation();

create or replace function passage_private.reject_task_proof_mutation()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  raise exception 'Task proof history is append-only' using errcode = '42501';
end
$function$;
drop trigger if exists task_proofs_append_only on public.task_proofs;
create trigger task_proofs_append_only before update or delete on public.task_proofs for each row execute function passage_private.reject_task_proof_mutation();
drop trigger if exists task_proof_reviews_append_only on public.task_proof_reviews;
create trigger task_proof_reviews_append_only before update or delete on public.task_proof_reviews for each row execute function passage_private.reject_task_proof_mutation();

create or replace function passage_private.reject_proof_pending_reassignment()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  if old.status = 'proof_submitted' and new.assigned_organization_member_id is distinct from old.assigned_organization_member_id then
    raise exception 'Review or request replacement before reassigning proof-pending work' using errcode = '55000';
  end if;
  return new;
end
$function$;
drop trigger if exists tasks_proof_pending_assignment_guard on public.tasks;
create trigger tasks_proof_pending_assignment_guard before update of assigned_organization_member_id on public.tasks for each row execute function passage_private.reject_proof_pending_reassignment();

create or replace function passage_private.submit_task_proof_idempotent(
  p_task_id uuid, p_expected_task_version integer, p_proof_type text, p_completion_summary text,
  p_reference text, p_supersedes_proof_id uuid, p_request_id uuid
)
returns table (proof_id uuid, task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language plpgsql security definer set search_path = '' as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor public.organization_members%rowtype;
  v_task public.tasks%rowtype;
  v_workflow public.workflows%rowtype;
  v_existing public.task_proofs%rowtype;
  v_existing_event public.workflow_events%rowtype;
  v_latest_proof_id uuid;
  v_proof_id uuid;
  v_next_version integer;
  v_event_receipt record;
  v_key text;
  v_reference text := nullif(btrim(coalesce(p_reference, '')), '');
begin
  if v_actor_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_task_id is null or p_request_id is null or p_expected_task_version is null or p_expected_task_version < 1
     or p_proof_type is null or p_proof_type not in ('confirmation', 'handoff', 'reference', 'completion_note')
     or length(btrim(coalesce(p_completion_summary, ''))) not between 1 and 2000
     or (v_reference is not null and length(v_reference) > 240) then
    raise exception 'Valid proof input and task version are required' using errcode = '22023';
  end if;

  select t.* into v_task from public.tasks as t where t.id = p_task_id for update;
  if not found then raise exception 'Work is unavailable' using errcode = '42501'; end if;
  select w.* into strict v_workflow from public.workflows as w where w.id = v_task.workflow_id;
  select m.* into v_actor from public.organization_members as m where m.organization_id = v_task.organization_id and m.user_id = v_actor_user_id and m.role = 'staff' and m.status = 'active' order by m.created_at, m.id limit 1;
  if v_actor.id is null or v_task.assigned_organization_member_id <> v_actor.id
     or not exists (select 1 from public.organization_member_locations as ml where ml.organization_member_id = v_actor.id and ml.organization_location_id = v_workflow.organization_location_id and ml.revoked_at is null) then
    raise exception 'Work is unavailable' using errcode = '42501';
  end if;

  v_key := 'task_proof_submission:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_task.organization_id::text || ':' || v_key, 0));
  select p.* into v_existing from public.task_proofs as p where p.organization_id = v_task.organization_id and p.request_id = p_request_id;
  if found then
    select e.* into strict v_existing_event from public.workflow_events as e where e.organization_id = v_task.organization_id and e.idempotency_key = v_key;
    return query select v_existing.id, v_existing.task_id, v_existing_event.next_state, (v_existing_event.metadata ->> 'task_version')::integer, v_existing_event.id, v_existing_event.occurred_at, true;
    return;
  end if;

  if v_task.version <> p_expected_task_version then raise exception 'Work changed before proof was saved' using errcode = '40001'; end if;
  if v_task.status <> 'in_progress' then raise exception 'Only in-progress work can receive proof' using errcode = '55000'; end if;

  select p.id into v_latest_proof_id from public.task_proofs as p where p.task_id = v_task.id order by p.submitted_at desc, p.id desc limit 1;
  if v_latest_proof_id is null and p_supersedes_proof_id is not null then
    raise exception 'Replacement proof is unavailable' using errcode = '42501';
  elsif v_latest_proof_id is not null and p_supersedes_proof_id is distinct from v_latest_proof_id then
    raise exception 'Replacement proof is unavailable' using errcode = '42501';
  end if;

  insert into public.task_proofs (organization_id, workflow_id, task_id, submitted_by_user_id, submitted_by_organization_member_id, proof_type, completion_summary, reference, audience, proof_destination, supersedes_proof_id, request_id, expected_task_version)
  values (v_task.organization_id, v_workflow.id, v_task.id, v_actor_user_id, v_actor.id, p_proof_type, btrim(p_completion_summary), v_reference, 'case_team', coalesce(v_task.proof_destination, 'Organization activity'), p_supersedes_proof_id, p_request_id, p_expected_task_version)
  returning id into v_proof_id;

  v_next_version := v_task.version + 1;
  update public.tasks as t set status = 'proof_submitted', version = v_next_version, updated_at = pg_catalog.clock_timestamp() where t.id = v_task.id;

  select * into strict v_event_receipt from passage_private.append_operational_event(
    v_workflow.id, v_task.id, v_task.organization_id, v_workflow.organization_location_id, v_actor_user_id, v_actor.id,
    v_key, 'task.proof_submitted', 'in_progress', 'proof_submitted',
    pg_catalog.jsonb_build_object('proof_id', v_proof_id::text, 'proof_type', p_proof_type, 'supersedes_proof_id', coalesce(p_supersedes_proof_id::text, ''), 'expected_version', p_expected_task_version, 'task_version', v_next_version, 'task_title', v_task.title, 'case_reference', v_workflow.case_reference)
  );
  return query select v_proof_id, v_task.id, 'proof_submitted'::text, v_next_version, v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

create or replace function passage_private.review_task_proof_idempotent(p_proof_id uuid, p_expected_task_version integer, p_decision text, p_reason text, p_request_id uuid)
returns table (review_id uuid, proof_id uuid, task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language plpgsql security definer set search_path = '' as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_proof public.task_proofs%rowtype;
  v_task public.tasks%rowtype;
  v_workflow public.workflows%rowtype;
  v_existing public.task_proof_reviews%rowtype;
  v_existing_event public.workflow_events%rowtype;
  v_review_id uuid;
  v_next_status text;
  v_next_version integer;
  v_event_name text;
  v_event_receipt record;
  v_key text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_proof_id is null or p_request_id is null or p_expected_task_version is null or p_expected_task_version < 1
     or p_decision is null or p_decision not in ('verified', 'needs_replacement')
     or (p_decision = 'verified' and v_reason is not null)
     or (p_decision = 'needs_replacement' and (v_reason is null or length(v_reason) > 500)) then
    raise exception 'Valid review input and task version are required' using errcode = '22023';
  end if;

  select p.* into v_proof from public.task_proofs as p where p.id = p_proof_id;
  if not found then raise exception 'Proof is unavailable' using errcode = '42501'; end if;
  select t.* into strict v_task from public.tasks as t where t.id = v_proof.task_id for update;
  select w.* into strict v_workflow from public.workflows as w where w.id = v_proof.workflow_id;
  if not passage_private.can_manage_location(v_proof.organization_id, v_workflow.organization_location_id) then raise exception 'Proof is unavailable' using errcode = '42501'; end if;
  v_actor_member_id := passage_private.current_active_member_id(v_proof.organization_id);
  if v_actor_member_id is null then raise exception 'Director authority is required' using errcode = '42501'; end if;

  v_key := 'task_proof_review:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_proof.organization_id::text || ':' || v_key, 0));
  select r.* into v_existing from public.task_proof_reviews as r where r.organization_id = v_proof.organization_id and r.request_id = p_request_id;
  if found then
    select e.* into strict v_existing_event from public.workflow_events as e where e.organization_id = v_proof.organization_id and e.idempotency_key = v_key;
    return query select v_existing.id, v_existing.proof_id, v_existing.task_id, v_existing_event.next_state, (v_existing_event.metadata ->> 'task_version')::integer, v_existing_event.id, v_existing_event.occurred_at, true;
    return;
  end if;

  if v_task.version <> p_expected_task_version then raise exception 'Work changed before review was saved' using errcode = '40001'; end if;
  if v_task.status <> 'proof_submitted' then raise exception 'No proof is waiting for review' using errcode = '55000'; end if;

  v_next_status := case when p_decision = 'verified' then 'completed' else 'in_progress' end;
  v_event_name := case when p_decision = 'verified' then 'task.proof_verified' else 'task.proof_replacement_requested' end;
  insert into public.task_proof_reviews (organization_id, workflow_id, task_id, proof_id, reviewed_by_user_id, reviewed_by_organization_member_id, decision, reason, request_id, expected_task_version)
  values (v_proof.organization_id, v_proof.workflow_id, v_proof.task_id, v_proof.id, v_actor_user_id, v_actor_member_id, p_decision, v_reason, p_request_id, p_expected_task_version)
  returning id into v_review_id;

  v_next_version := v_task.version + 1;
  update public.tasks as t set status = v_next_status, version = v_next_version, updated_at = pg_catalog.clock_timestamp() where t.id = v_task.id;

  select * into strict v_event_receipt from passage_private.append_operational_event(
    v_workflow.id, v_task.id, v_proof.organization_id, v_workflow.organization_location_id, v_actor_user_id, v_actor_member_id,
    v_key, v_event_name, 'proof_submitted', v_next_status,
    pg_catalog.jsonb_build_object('proof_id', v_proof.id::text, 'review_id', v_review_id::text, 'decision', p_decision, 'reason', coalesce(v_reason, ''), 'expected_version', p_expected_task_version, 'task_version', v_next_version, 'task_title', v_task.title, 'case_reference', v_workflow.case_reference)
  );
  return query select v_review_id, v_proof.id, v_task.id, v_next_status, v_next_version, v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

-- === Invitation creation idempotency (wraps the already-live base function) ===
alter table public.organization_invitations add column if not exists creation_request_id uuid;
create unique index if not exists organization_invitations_creation_request_uidx on public.organization_invitations (organization_id, creation_request_id) where creation_request_id is not null;

create or replace function passage_private.create_employee_invitation_idempotent(
  p_organization_id uuid, p_invited_email text, p_organization_location_ids uuid[], p_purpose text, p_expires_at timestamp with time zone, p_creation_request_id uuid
)
returns table (invitation_id uuid, raw_token text, token_hint text, expires_at timestamp with time zone, invitation_purpose text, inviter_display_name text, organization_location_ids uuid[], invitation_state text, replayed boolean)
language plpgsql security definer set search_path = '' as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_email text := lower(btrim(coalesce(p_invited_email, '')));
  v_existing public.organization_invitations%rowtype;
  v_created record;
begin
  if v_actor_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not passage_private.can_manage_organization(p_organization_id) then raise exception 'You do not have authority to invite employees for this organization' using errcode = '42501'; end if;
  if p_creation_request_id is null then raise exception 'A creation request id is required' using errcode = '22023'; end if;
  if length(v_email) > 320 or position('@' in v_email) <= 1 then raise exception 'A valid invited email address is required' using errcode = '22023'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text || ':' || v_email, 0));
  select invitation.* into v_existing from public.organization_invitations as invitation where invitation.organization_id = p_organization_id and invitation.creation_request_id = p_creation_request_id;
  if found then
    if v_existing.invited_email <> v_email then raise exception 'Creation request id is already bound to another invitation' using errcode = '23505'; end if;
    return query select v_existing.id, null::text, v_existing.token_hint, v_existing.expires_at, v_existing.purpose,
      coalesce((select member.display_name from public.organization_members as member where member.organization_id = v_existing.organization_id and member.user_id = v_existing.invited_by_user_id order by member.created_at limit 1), 'Authorized director'),
      array(select link.organization_location_id from public.organization_invitation_locations as link where link.invitation_id = v_existing.id order by link.organization_location_id),
      case when v_existing.accepted_at is not null then 'accepted' when v_existing.revoked_at is not null then 'revoked' when v_existing.expires_at <= pg_catalog.clock_timestamp() then 'expired' else 'pending' end, true;
    return;
  end if;

  select invitation.* into v_existing from public.organization_invitations as invitation
  where invitation.organization_id = p_organization_id and invitation.invited_email = v_email and invitation.accepted_at is null and invitation.revoked_at is null and invitation.expires_at > pg_catalog.clock_timestamp()
  order by invitation.created_at limit 1;
  if found then
    return query select v_existing.id, null::text, v_existing.token_hint, v_existing.expires_at, v_existing.purpose,
      coalesce((select member.display_name from public.organization_members as member where member.organization_id = v_existing.organization_id and member.user_id = v_existing.invited_by_user_id order by member.created_at limit 1), 'Authorized director'),
      array(select link.organization_location_id from public.organization_invitation_locations as link where link.invitation_id = v_existing.id order by link.organization_location_id), 'pending'::text, true;
    return;
  end if;

  select * into strict v_created from passage_private.create_employee_invitation(p_organization_id, v_email, p_organization_location_ids, p_purpose, p_expires_at);
  update public.organization_invitations as invitation set creation_request_id = p_creation_request_id where invitation.id = v_created.invitation_id;
  return query select v_created.invitation_id::uuid, v_created.raw_token::text, v_created.token_hint::text, v_created.expires_at::timestamp with time zone, btrim(p_purpose),
    coalesce((select member.display_name from public.organization_members as member where member.organization_id = p_organization_id and member.user_id = v_actor_user_id order by member.created_at limit 1), 'Authorized director'),
    array(select distinct requested.location_id from unnest(p_organization_location_ids) as requested(location_id) order by requested.location_id), 'pending'::text, false;
end
$function$;

create or replace function passage_private.create_employee_invitation_idempotent_v2(
  p_organization_id uuid, p_invited_email text, p_organization_location_ids uuid[], p_purpose text, p_expires_at timestamp with time zone, p_creation_request_id uuid
)
returns table (invitation_id uuid, raw_token text, token_hint text, expires_at timestamp with time zone, created_at timestamp with time zone, invitation_purpose text, inviter_display_name text, organization_location_ids uuid[], invitation_state text, replayed boolean)
language plpgsql security definer set search_path = '' as $function$
declare
  v_receipt record;
  v_created_at timestamp with time zone;
begin
  select * into strict v_receipt from passage_private.create_employee_invitation_idempotent(p_organization_id, p_invited_email, p_organization_location_ids, p_purpose, p_expires_at, p_creation_request_id);
  select invitation.created_at into strict v_created_at from public.organization_invitations as invitation where invitation.id = v_receipt.invitation_id;
  return query select v_receipt.invitation_id::uuid, v_receipt.raw_token::text, v_receipt.token_hint::text, v_receipt.expires_at::timestamp with time zone, v_created_at,
    v_receipt.invitation_purpose::text, v_receipt.inviter_display_name::text, v_receipt.organization_location_ids::uuid[], v_receipt.invitation_state::text, v_receipt.replayed::boolean;
end
$function$;

-- === Public wrappers ===
create or replace function public.assign_task_idempotent(p_task_id uuid, p_expected_version integer, p_assignee_member_id uuid, p_reason text, p_request_id uuid)
returns table (task_id uuid, previous_member_id uuid, assigned_member_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language sql volatile security invoker set search_path = '' as $function$ select * from passage_private.assign_task_idempotent(p_task_id, p_expected_version, p_assignee_member_id, p_reason, p_request_id) $function$;

create or replace function public.start_task_idempotent(p_task_id uuid, p_expected_version integer, p_request_id uuid)
returns table (task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language sql volatile security invoker set search_path = '' as $function$ select * from passage_private.start_task_idempotent(p_task_id, p_expected_version, p_request_id) $function$;

create or replace function public.revoke_organization_member_idempotent(p_member_id uuid, p_reason text, p_request_id uuid)
returns table (member_id uuid, revoked_at timestamp with time zone, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language sql volatile security invoker set search_path = '' as $function$ select * from passage_private.revoke_organization_member_idempotent(p_member_id, p_reason, p_request_id) $function$;

create or replace function public.submit_task_proof_idempotent(p_task_id uuid, p_expected_task_version integer, p_proof_type text, p_completion_summary text, p_reference text, p_supersedes_proof_id uuid, p_request_id uuid)
returns table (proof_id uuid, task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language sql volatile security invoker set search_path = '' as $function$ select * from passage_private.submit_task_proof_idempotent(p_task_id, p_expected_task_version, p_proof_type, p_completion_summary, p_reference, p_supersedes_proof_id, p_request_id) $function$;

create or replace function public.review_task_proof_idempotent(p_proof_id uuid, p_expected_task_version integer, p_decision text, p_reason text, p_request_id uuid)
returns table (review_id uuid, proof_id uuid, task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language sql volatile security invoker set search_path = '' as $function$ select * from passage_private.review_task_proof_idempotent(p_proof_id, p_expected_task_version, p_decision, p_reason, p_request_id) $function$;

create or replace function public.create_employee_invitation_idempotent_v2(p_organization_id uuid, p_invited_email text, p_organization_location_ids uuid[], p_purpose text, p_expires_at timestamp with time zone, p_creation_request_id uuid)
returns table (invitation_id uuid, raw_token text, token_hint text, expires_at timestamp with time zone, created_at timestamp with time zone, invitation_purpose text, inviter_display_name text, organization_location_ids uuid[], invitation_state text, replayed boolean)
language sql volatile security invoker set search_path = '' as $function$ select * from passage_private.create_employee_invitation_idempotent_v2(p_organization_id, p_invited_email, p_organization_location_ids, p_purpose, p_expires_at, p_creation_request_id) $function$;

-- === RLS: additive only, legacy policies untouched ===
alter table public.workflows enable row level security;
alter table public.tasks enable row level security;
alter table public.workflow_events enable row level security;
alter table public.task_proofs enable row level security;
alter table public.task_proof_reviews enable row level security;

drop policy if exists org_authority_workflows_select on public.workflows;
create policy org_authority_workflows_select on public.workflows for select to authenticated using (organization_id is not null and passage_private.can_view_workflow(id));

drop policy if exists org_authority_tasks_select on public.tasks;
create policy org_authority_tasks_select on public.tasks for select to authenticated using (organization_id is not null and passage_private.can_view_task(id));

drop policy if exists org_authority_workflow_events_select on public.workflow_events;
create policy org_authority_workflow_events_select on public.workflow_events for select to authenticated using (organization_id is not null and passage_private.can_view_workflow_event(id));

drop policy if exists org_authority_task_proofs_select on public.task_proofs;
create policy org_authority_task_proofs_select on public.task_proofs for select to authenticated using (passage_private.can_view_task(task_id));

drop policy if exists org_authority_task_proof_reviews_select on public.task_proof_reviews;
create policy org_authority_task_proof_reviews_select on public.task_proof_reviews for select to authenticated using (passage_private.can_view_task(task_id));

drop policy if exists org_authority_members_manager_select on public.organization_members;
create policy org_authority_members_manager_select on public.organization_members for select to authenticated using (passage_private.can_view_team_member(id));

grant select on table public.task_proofs to authenticated;
grant select on table public.task_proof_reviews to authenticated;

grant execute on function passage_private.can_view_workflow(uuid) to authenticated;
grant execute on function passage_private.can_view_task(uuid) to authenticated;
grant execute on function passage_private.can_view_workflow_event(uuid) to authenticated;
grant execute on function passage_private.can_view_team_member(uuid) to authenticated;
grant execute on function passage_private.assign_task_idempotent(uuid,integer,uuid,text,uuid) to authenticated;
grant execute on function passage_private.start_task_idempotent(uuid,integer,uuid) to authenticated;
grant execute on function passage_private.revoke_organization_member_idempotent(uuid,text,uuid) to authenticated;
grant execute on function passage_private.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid) to authenticated;
grant execute on function passage_private.review_task_proof_idempotent(uuid,integer,text,text,uuid) to authenticated;
grant execute on function passage_private.create_employee_invitation_idempotent_v2(uuid,text,uuid[],text,timestamp with time zone,uuid) to authenticated;

grant execute on function public.assign_task_idempotent(uuid,integer,uuid,text,uuid) to authenticated;
grant execute on function public.start_task_idempotent(uuid,integer,uuid) to authenticated;
grant execute on function public.revoke_organization_member_idempotent(uuid,text,uuid) to authenticated;
grant execute on function public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid) to authenticated;
grant execute on function public.review_task_proof_idempotent(uuid,integer,text,text,uuid) to authenticated;
grant execute on function public.create_employee_invitation_idempotent_v2(uuid,text,uuid[],text,timestamp with time zone,uuid) to authenticated;
