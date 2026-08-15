-- ISOLATED-LAB-ONLY Cycle 8 task-bound structured proof loop.
--
-- WHAT / WHY / BREAKAGE IF SKIPPED
-- - Add immutable task proofs and append-only director reviews so a started
--   commitment can reach a server-proven outcome instead of stopping at an
--   in-progress UI state.
-- - Add checked, versioned, idempotent submit/review commands. Without them a
--   retry can duplicate proof, stale clients can overwrite task truth, and a
--   director decision cannot be tied to one durable actor/time/event receipt.
-- - Add narrow task-authority SELECT policies and keep all direct client
--   writes revoked. Without them proof content can leak across assignments,
--   locations, or organizations.
--
-- Apply through Supabase migration tooling only to isolated project
-- uyacxqtsiwlvtmhxvoxr. Never apply to production qsveqfchwylsbncsfgxe.

do $cycle_8_preflight$
begin
  if to_regclass('supabase_migrations.schema_migrations') is null
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7a_isolated_lab_self_authority'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7b_assigned_work'
     )
     or not exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7b_advisor_hardening'
     ) then
    raise exception using
      errcode = '42501',
      message = 'Cycle 8 refused: reviewed isolated Cycle 7B markers are missing';
  end if;

  if to_regclass('public.workflows') is null
     or to_regclass('public.tasks') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('public.organization_members') is null
     or to_regprocedure('passage_private.can_view_task(uuid)') is null
     or to_regprocedure('passage_private.append_operational_event(uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,jsonb)') is null then
    raise exception using
      errcode = '55000',
      message = 'Cycle 8 refused: durable assigned-work authority is incomplete';
  end if;

  if (select count(*) from public.organizations where id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.organization_locations where id = 'c7a00002-7a00-47a0-87a0-000000000002' and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.workflows where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 2
     or (select count(*) from public.tasks where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 3
     or (select count(*) from public.workflow_events where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 8
     or not exists (select 1 from public.workflows where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001' and case_reference = 'NS-2051') then
    raise exception using
      errcode = '42501',
      message = 'Cycle 8 refused: exact isolated Cycle 7B fixture baseline is missing';
  end if;

  -- These exact synthetic-only totals are the machine-enforced lab sentinel.
  -- Production or a lab whose retained Cycle 7A/7B proof has drifted must fail
  -- before this migration changes the task constraint or creates any object.
  if (select count(*) from public.organizations) <> 1
     or (select count(*) from public.organization_locations) <> 1
     or (select count(*) from public.workflows) <> 2
     or (select count(*) from public.tasks) <> 3
     or (select count(*) from public.workflow_events) <> 8
     or (select count(*) from public.organization_invitations) <> 2
     or (select count(*) from public.organization_invitation_locations) <> 2
     or (select count(*) from public.organization_members
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and status = 'active') <> 2
     or (select count(*) from public.organization_members
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and status = 'revoked') <> 1
     or (select count(*) from public.organization_member_locations as ml
         join public.organization_members as m on m.id = ml.organization_member_id
         where m.organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
           and ml.revoked_at is null) <> 2
     or (select count(*) from public.workflows
         where id in (
           'c7b10001-7b00-47b0-87b0-000000000001',
           'c7b10002-7b00-47b0-87b0-000000000002'
         )) <> 2
     or (select count(*) from public.tasks
         where id in (
           'c7b20001-7b00-47b0-87b0-000000000001',
           'c7b20002-7b00-47b0-87b0-000000000002',
           'c7b20003-7b00-47b0-87b0-000000000003'
         )) <> 3 then
    raise exception using
      errcode = '42501',
      message = 'Cycle 8 refused: isolated project sentinel or retained Cycle 7A/7B cardinality drifted';
  end if;

  if to_regclass('public.task_proofs') is not null
     or to_regclass('public.task_proof_reviews') is not null
     or to_regprocedure('public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid)') is not null
     or to_regprocedure('public.review_task_proof_idempotent(uuid,integer,text,text,uuid)') is not null then
    raise exception using
      errcode = '55000',
      message = 'Cycle 8 refused: incompatible proof-loop catalog objects already exist';
  end if;
end
$cycle_8_preflight$;

alter table public.tasks
  drop constraint if exists tasks_cycle_7b_status_check;

alter table public.tasks
  drop constraint if exists tasks_cycle_8_status_check;

alter table public.tasks
  add constraint tasks_cycle_8_status_check
  check (status in ('assigned', 'in_progress', 'proof_submitted', 'blocked', 'completed'));

create table public.task_proofs (
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
  constraint task_proofs_type_check
    check (proof_type in ('confirmation', 'handoff', 'reference', 'completion_note')),
  constraint task_proofs_summary_check
    check (length(btrim(completion_summary)) between 1 and 2000),
  constraint task_proofs_reference_check
    check (reference is null or length(btrim(reference)) between 1 and 240),
  constraint task_proofs_audience_check check (audience = 'case_team'),
  constraint task_proofs_destination_check
    check (length(btrim(proof_destination)) between 1 and 160),
  constraint task_proofs_version_check check (expected_task_version > 0),
  constraint task_proofs_not_self_superseding_check
    check (supersedes_proof_id is null or supersedes_proof_id <> id),
  constraint task_proofs_org_request_unique unique (organization_id, request_id)
);

create table public.task_proof_reviews (
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
  constraint task_proof_reviews_decision_check
    check (decision in ('verified', 'needs_replacement')),
  constraint task_proof_reviews_reason_check
    check (
      (decision = 'verified' and reason is null)
      or
      (decision = 'needs_replacement' and length(btrim(reason)) between 1 and 500)
    ),
  constraint task_proof_reviews_version_check check (expected_task_version > 0),
  constraint task_proof_reviews_proof_unique unique (proof_id),
  constraint task_proof_reviews_org_request_unique unique (organization_id, request_id)
);

create index task_proofs_task_submitted_idx
  on public.task_proofs (task_id, submitted_at, id);
create index task_proofs_workflow_submitted_idx
  on public.task_proofs (workflow_id, submitted_at, id);
create index task_proofs_submitter_member_idx
  on public.task_proofs (submitted_by_organization_member_id);
create index task_proofs_supersedes_idx
  on public.task_proofs (supersedes_proof_id)
  where supersedes_proof_id is not null;
create unique index task_proofs_one_replacement_per_prior_unique
  on public.task_proofs (supersedes_proof_id)
  where supersedes_proof_id is not null;
create unique index task_proofs_one_root_per_task_unique
  on public.task_proofs (task_id)
  where supersedes_proof_id is null;
create index task_proofs_submitter_user_idx
  on public.task_proofs (submitted_by_user_id);
create index task_proof_reviews_task_reviewed_idx
  on public.task_proof_reviews (task_id, reviewed_at, id);
create index task_proof_reviews_reviewer_member_idx
  on public.task_proof_reviews (reviewed_by_organization_member_id);
create index task_proof_reviews_workflow_idx
  on public.task_proof_reviews (workflow_id);
create index task_proof_reviews_reviewer_user_idx
  on public.task_proof_reviews (reviewed_by_user_id);

create or replace function passage_private.assert_task_proof_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_task public.tasks%rowtype;
  v_workflow public.workflows%rowtype;
  v_member public.organization_members%rowtype;
  v_prior public.task_proofs%rowtype;
  v_prior_review public.task_proof_reviews%rowtype;
  v_latest_proof_id uuid;
begin
  select t.* into v_task from public.tasks as t where t.id = new.task_id;
  select w.* into v_workflow from public.workflows as w where w.id = new.workflow_id;
  select m.* into v_member
  from public.organization_members as m
  where m.id = new.submitted_by_organization_member_id;

  if v_task.id is null
     or v_workflow.id is null
     or v_member.id is null
     or v_task.workflow_id <> v_workflow.id
     or v_task.organization_id <> new.organization_id
     or v_workflow.organization_id <> new.organization_id
     or v_member.organization_id <> new.organization_id
     or v_member.user_id <> new.submitted_by_user_id
     or new.submitted_by_user_id is distinct from (select auth.uid())
     or v_member.role <> 'staff'
     or v_member.status <> 'active'
     or v_task.assigned_organization_member_id <> v_member.id
     or v_task.status <> 'in_progress'
     or v_task.version <> new.expected_task_version
     or new.audience <> 'case_team'
     or nullif(btrim(new.proof_destination), '') is distinct from
        nullif(btrim(v_task.proof_destination), '')
     or not exists (
       select 1 from public.organization_member_locations as ml
       where ml.organization_member_id = v_member.id
         and ml.organization_location_id = v_workflow.organization_location_id
         and ml.revoked_at is null
     ) then
    raise exception 'Task proof scope is invalid' using errcode = '23514';
  end if;

  select p.id into v_latest_proof_id
  from public.task_proofs as p
  where p.task_id = new.task_id
  order by p.submitted_at desc, p.id desc
  limit 1;

  if new.supersedes_proof_id is null then
    if v_latest_proof_id is not null then
      raise exception 'A proof chain already exists for this task' using errcode = '23514';
    end if;
  else
    select p.* into v_prior
    from public.task_proofs as p where p.id = new.supersedes_proof_id;
    if v_prior.id is null
       or v_prior.organization_id <> new.organization_id
       or v_prior.workflow_id <> new.workflow_id
       or v_prior.task_id <> new.task_id
       or v_prior.id is distinct from v_latest_proof_id then
      raise exception 'Replacement proof scope is invalid' using errcode = '23514';
    end if;
    select r.* into v_prior_review
    from public.task_proof_reviews as r
    where r.proof_id = v_prior.id;
    if v_prior_review.id is null
       or v_prior_review.decision <> 'needs_replacement' then
      raise exception 'Replacement proof requires the latest replacement request'
        using errcode = '23514';
    end if;
  end if;
  return new;
end
$function$;

create or replace function passage_private.assert_task_proof_review_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_proof public.task_proofs%rowtype;
  v_task public.tasks%rowtype;
  v_workflow public.workflows%rowtype;
  v_member public.organization_members%rowtype;
  v_latest_proof_id uuid;
begin
  select p.* into v_proof from public.task_proofs as p where p.id = new.proof_id;
  select t.* into v_task from public.tasks as t where t.id = new.task_id;
  select w.* into v_workflow from public.workflows as w where w.id = new.workflow_id;
  select m.* into v_member
  from public.organization_members as m
  where m.id = new.reviewed_by_organization_member_id;
  if v_proof.id is null
     or v_task.id is null
     or v_workflow.id is null
     or v_member.id is null
     or v_proof.organization_id <> new.organization_id
     or v_proof.workflow_id <> new.workflow_id
     or v_proof.task_id <> new.task_id
     or v_member.organization_id <> new.organization_id
     or v_member.user_id <> new.reviewed_by_user_id
     or new.reviewed_by_user_id is distinct from (select auth.uid())
     or v_member.role not in ('owner', 'director')
     or v_member.status <> 'active'
     or v_task.workflow_id <> v_workflow.id
     or v_task.organization_id <> new.organization_id
     or v_task.status <> 'proof_submitted'
     or v_task.version <> new.expected_task_version
     or not passage_private.can_manage_location(
       new.organization_id, v_workflow.organization_location_id
     ) then
    raise exception 'Task proof review scope is invalid' using errcode = '23514';
  end if;
  select p.id into v_latest_proof_id
  from public.task_proofs as p
  where p.task_id = new.task_id
  order by p.submitted_at desc, p.id desc
  limit 1;
  if v_latest_proof_id is distinct from new.proof_id
     or exists (
       select 1 from public.task_proof_reviews as r
       where r.proof_id = new.proof_id
     ) then
    raise exception 'Only the latest unreviewed proof can be reviewed'
      using errcode = '23514';
  end if;
  return new;
end
$function$;

create trigger task_proofs_scope_integrity
before insert or update on public.task_proofs
for each row execute function passage_private.assert_task_proof_scope();

create trigger task_proof_reviews_scope_integrity
before insert or update on public.task_proof_reviews
for each row execute function passage_private.assert_task_proof_review_scope();

create or replace function passage_private.reject_task_proof_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE'
     and session_user = 'postgres'
     and current_user = 'postgres'
     and current_setting('passage.fixture_reset', true) = 'cycle_8_isolated_lab'
     and current_setting('passage.fixture_project_ref', true) = 'uyacxqtsiwlvtmhxvoxr'
     and old.organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
     and exists (
       select 1 from supabase_migrations.schema_migrations
       where name = 'cycle_7b_assigned_work'
     )
     and exists (
       select 1 from public.tasks as t
       where t.id = old.task_id
         and t.organization_id = old.organization_id
         and t.id in (
           'c7b20001-7b00-47b0-87b0-000000000001',
           'c7b20002-7b00-47b0-87b0-000000000002',
           'c7b20003-7b00-47b0-87b0-000000000003'
         )
     ) then
    return old;
  end if;
  raise exception 'Task proof history is append-only' using errcode = '42501';
end
$function$;

-- Cycle 7B's cleanup escape accepted a caller-controlled setting alone. Narrow
-- it to DELETE-only, postgres-session, exact-project, retained synthetic rows.
create or replace function passage_private.reject_workflow_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE'
     and session_user = 'postgres'
     and current_user = 'postgres'
     and current_setting('passage.fixture_reset', true) = 'cycle_8_isolated_lab'
     and current_setting('passage.fixture_project_ref', true) = 'uyacxqtsiwlvtmhxvoxr'
     and old.organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
     and old.workflow_id in (
       'c7b10001-7b00-47b0-87b0-000000000001',
       'c7b10002-7b00-47b0-87b0-000000000002'
     )
     and old.task_id in (
       'c7b20001-7b00-47b0-87b0-000000000001',
       'c7b20002-7b00-47b0-87b0-000000000002',
       'c7b20003-7b00-47b0-87b0-000000000003'
     )
     and old.name in (
       'task.proof_submitted',
       'task.proof_verified',
       'task.proof_replacement_requested'
     ) then
    return old;
  end if;
  raise exception 'Workflow events are append-only' using errcode = '42501';
end
$function$;

create or replace function passage_private.reject_proof_pending_reassignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.status = 'proof_submitted'
     and new.assigned_organization_member_id is distinct from old.assigned_organization_member_id then
    raise exception 'Review or request replacement before reassigning proof-pending work'
      using errcode = '55000';
  end if;
  return new;
end
$function$;

create trigger tasks_cycle_8_proof_pending_assignment_guard
before update of assigned_organization_member_id on public.tasks
for each row execute function passage_private.reject_proof_pending_reassignment();

create trigger task_proofs_append_only
before update or delete on public.task_proofs
for each row execute function passage_private.reject_task_proof_mutation();

create trigger task_proof_reviews_append_only
before update or delete on public.task_proof_reviews
for each row execute function passage_private.reject_task_proof_mutation();

create or replace function passage_private.submit_task_proof_idempotent(
  p_task_id uuid,
  p_expected_task_version integer,
  p_proof_type text,
  p_completion_summary text,
  p_reference text,
  p_supersedes_proof_id uuid,
  p_request_id uuid
)
returns table (
  proof_id uuid,
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
  v_actor_user_id uuid := (select auth.uid());
  v_actor public.organization_members%rowtype;
  v_task public.tasks%rowtype;
  v_workflow public.workflows%rowtype;
  v_existing public.task_proofs%rowtype;
  v_existing_event public.workflow_events%rowtype;
  v_prior public.task_proofs%rowtype;
  v_prior_review public.task_proof_reviews%rowtype;
  v_latest_proof_id uuid;
  v_proof_id uuid;
  v_next_version integer;
  v_event_receipt record;
  v_key text;
  v_reference text := nullif(btrim(coalesce(p_reference, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_task_id is null or p_request_id is null
     or p_expected_task_version is null or p_expected_task_version < 1
     or p_proof_type is null
     or p_proof_type not in ('confirmation', 'handoff', 'reference', 'completion_note')
     or length(btrim(coalesce(p_completion_summary, ''))) not between 1 and 2000
     or (v_reference is not null and length(v_reference) > 240) then
    raise exception 'Valid proof input and task version are required' using errcode = '22023';
  end if;

  select t.* into v_task
  from public.tasks as t where t.id = p_task_id for update;
  if not found then raise exception 'Work is unavailable' using errcode = '42501'; end if;
  select w.* into strict v_workflow
  from public.workflows as w where w.id = v_task.workflow_id;
  select m.* into v_actor
  from public.organization_members as m
  where m.organization_id = v_task.organization_id
    and m.user_id = v_actor_user_id
    and m.role = 'staff'
    and m.status = 'active'
  order by m.created_at, m.id limit 1;
  if v_actor.id is null
     or v_task.assigned_organization_member_id <> v_actor.id
     or not exists (
       select 1 from public.organization_member_locations as ml
       where ml.organization_member_id = v_actor.id
         and ml.organization_location_id = v_workflow.organization_location_id
         and ml.revoked_at is null
     ) then
    raise exception 'Work is unavailable' using errcode = '42501';
  end if;

  v_key := 'task_proof_submission:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_task.organization_id::text || ':' || v_key, 0)
  );
  select p.* into v_existing
  from public.task_proofs as p
  where p.organization_id = v_task.organization_id
    and p.request_id = p_request_id;
  if found then
    if v_existing.task_id is distinct from p_task_id
       or v_existing.submitted_by_user_id is distinct from v_actor_user_id
       or v_existing.submitted_by_organization_member_id is distinct from v_actor.id
       or v_existing.proof_type is distinct from p_proof_type
       or v_existing.completion_summary is distinct from btrim(p_completion_summary)
       or v_existing.reference is distinct from v_reference
       or v_existing.supersedes_proof_id is distinct from p_supersedes_proof_id
       or v_existing.expected_task_version is distinct from p_expected_task_version then
      raise exception 'Proof request conflicts with an earlier command' using errcode = '22023';
    end if;
    select e.* into strict v_existing_event
    from public.workflow_events as e
    where e.organization_id = v_task.organization_id
      and e.idempotency_key = v_key;
    return query select v_existing.id, v_existing.task_id,
      v_existing_event.next_state, (v_existing_event.metadata ->> 'task_version')::integer,
      v_existing_event.id, v_existing_event.occurred_at, true;
    return;
  end if;

  if v_task.version <> p_expected_task_version then
    raise exception 'Work changed before proof was saved' using errcode = '40001';
  end if;
  if v_task.status <> 'in_progress' then
    raise exception 'Only in-progress work can receive proof' using errcode = '55000';
  end if;
  if nullif(btrim(coalesce(v_task.proof_destination, '')), '') is null then
    raise exception 'Proof destination is unavailable' using errcode = '55000';
  end if;

  select p.id into v_latest_proof_id
  from public.task_proofs as p
  where p.task_id = v_task.id
  order by p.submitted_at desc, p.id desc limit 1;
  if v_latest_proof_id is null and p_supersedes_proof_id is not null then
    raise exception 'Replacement proof is unavailable' using errcode = '42501';
  elsif v_latest_proof_id is not null then
    if p_supersedes_proof_id is distinct from v_latest_proof_id then
      raise exception 'Replacement proof is unavailable' using errcode = '42501';
    end if;
    select p.* into strict v_prior
    from public.task_proofs as p where p.id = v_latest_proof_id;
    select r.* into v_prior_review
    from public.task_proof_reviews as r where r.proof_id = v_prior.id;
    if v_prior_review.id is null or v_prior_review.decision <> 'needs_replacement' then
      raise exception 'Replacement proof is unavailable' using errcode = '42501';
    end if;
  end if;

  insert into public.task_proofs (
    organization_id, workflow_id, task_id,
    submitted_by_user_id, submitted_by_organization_member_id,
    proof_type, completion_summary, reference, audience, proof_destination,
    supersedes_proof_id, request_id, expected_task_version
  ) values (
    v_task.organization_id, v_workflow.id, v_task.id,
    v_actor_user_id, v_actor.id,
    p_proof_type, btrim(p_completion_summary), v_reference, 'case_team',
    coalesce(v_task.proof_destination, 'Organization activity'),
    p_supersedes_proof_id, p_request_id, p_expected_task_version
  ) returning id into v_proof_id;

  v_next_version := v_task.version + 1;
  update public.tasks as t
  set status = 'proof_submitted', version = v_next_version,
      updated_at = pg_catalog.clock_timestamp()
  where t.id = v_task.id;

  select * into strict v_event_receipt
  from passage_private.append_operational_event(
    v_workflow.id, v_task.id, v_task.organization_id,
    v_workflow.organization_location_id, v_actor_user_id, v_actor.id,
    v_key, 'task.proof_submitted', 'in_progress', 'proof_submitted',
    pg_catalog.jsonb_build_object(
      'proof_id', v_proof_id::text,
      'proof_type', p_proof_type,
      'supersedes_proof_id', coalesce(p_supersedes_proof_id::text, ''),
      'expected_version', p_expected_task_version,
      'task_version', v_next_version,
      'task_title', v_task.title,
      'case_reference', v_workflow.case_reference,
      'next_owner', 'accountable_director',
      'next_action', 'review_task_proof'
    )
  );
  return query select v_proof_id, v_task.id, 'proof_submitted'::text,
    v_next_version, v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

create or replace function passage_private.review_task_proof_idempotent(
  p_proof_id uuid,
  p_expected_task_version integer,
  p_decision text,
  p_reason text,
  p_request_id uuid
)
returns table (
  review_id uuid,
  proof_id uuid,
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
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_proof public.task_proofs%rowtype;
  v_task public.tasks%rowtype;
  v_workflow public.workflows%rowtype;
  v_existing public.task_proof_reviews%rowtype;
  v_existing_event public.workflow_events%rowtype;
  v_review_id uuid;
  v_latest_proof_id uuid;
  v_next_status text;
  v_next_version integer;
  v_event_name text;
  v_event_receipt record;
  v_key text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_proof_id is null or p_request_id is null
     or p_expected_task_version is null or p_expected_task_version < 1
     or p_decision is null
     or p_decision not in ('verified', 'needs_replacement')
     or (p_decision = 'verified' and v_reason is not null)
     or (p_decision = 'needs_replacement' and (v_reason is null or length(v_reason) > 500)) then
    raise exception 'Valid review input and task version are required' using errcode = '22023';
  end if;

  select p.* into v_proof
  from public.task_proofs as p where p.id = p_proof_id;
  if not found then raise exception 'Proof is unavailable' using errcode = '42501'; end if;
  select t.* into strict v_task
  from public.tasks as t where t.id = v_proof.task_id for update;
  select w.* into strict v_workflow
  from public.workflows as w where w.id = v_proof.workflow_id;
  if not passage_private.can_manage_location(
    v_proof.organization_id, v_workflow.organization_location_id
  ) then
    raise exception 'Proof is unavailable' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_proof.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority is required' using errcode = '42501';
  end if;

  v_key := 'task_proof_review:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_proof.organization_id::text || ':' || v_key, 0)
  );
  select r.* into v_existing
  from public.task_proof_reviews as r
  where r.organization_id = v_proof.organization_id
    and r.request_id = p_request_id;
  if found then
    if v_existing.proof_id is distinct from p_proof_id
       or v_existing.reviewed_by_user_id is distinct from v_actor_user_id
       or v_existing.reviewed_by_organization_member_id is distinct from v_actor_member_id
       or v_existing.decision is distinct from p_decision
       or v_existing.reason is distinct from v_reason
       or v_existing.expected_task_version is distinct from p_expected_task_version then
      raise exception 'Review request conflicts with an earlier command' using errcode = '22023';
    end if;
    select e.* into strict v_existing_event
    from public.workflow_events as e
    where e.organization_id = v_proof.organization_id
      and e.idempotency_key = v_key;
    return query select v_existing.id, v_existing.proof_id, v_existing.task_id,
      v_existing_event.next_state, (v_existing_event.metadata ->> 'task_version')::integer,
      v_existing_event.id, v_existing_event.occurred_at, true;
    return;
  end if;

  if v_task.version <> p_expected_task_version then
    raise exception 'Work changed before review was saved' using errcode = '40001';
  end if;
  if v_task.status <> 'proof_submitted' then
    raise exception 'No proof is waiting for review' using errcode = '55000';
  end if;
  select p.id into v_latest_proof_id
  from public.task_proofs as p where p.task_id = v_task.id
  order by p.submitted_at desc, p.id desc limit 1;
  if v_latest_proof_id is distinct from v_proof.id
     or exists (select 1 from public.task_proof_reviews as r where r.proof_id = v_proof.id) then
    raise exception 'Proof is no longer waiting for review' using errcode = '55000';
  end if;

  v_next_status := case when p_decision = 'verified' then 'completed' else 'in_progress' end;
  v_event_name := case when p_decision = 'verified'
    then 'task.proof_verified' else 'task.proof_replacement_requested' end;
  insert into public.task_proof_reviews (
    organization_id, workflow_id, task_id, proof_id,
    reviewed_by_user_id, reviewed_by_organization_member_id,
    decision, reason, request_id, expected_task_version
  ) values (
    v_proof.organization_id, v_proof.workflow_id, v_proof.task_id, v_proof.id,
    v_actor_user_id, v_actor_member_id, p_decision, v_reason,
    p_request_id, p_expected_task_version
  ) returning id into v_review_id;

  v_next_version := v_task.version + 1;
  update public.tasks as t
  set status = v_next_status, version = v_next_version,
      updated_at = pg_catalog.clock_timestamp()
  where t.id = v_task.id;

  select * into strict v_event_receipt
  from passage_private.append_operational_event(
    v_workflow.id, v_task.id, v_proof.organization_id,
    v_workflow.organization_location_id, v_actor_user_id, v_actor_member_id,
    v_key, v_event_name, 'proof_submitted', v_next_status,
    pg_catalog.jsonb_build_object(
      'proof_id', v_proof.id::text,
      'review_id', v_review_id::text,
      'decision', p_decision,
      'reason', coalesce(v_reason, ''),
      'expected_version', p_expected_task_version,
      'task_version', v_next_version,
      'task_title', v_task.title,
      'case_reference', v_workflow.case_reference,
      'next_owner', case when p_decision = 'verified' then 'case_team' else 'current_assignee' end,
      'next_action', case when p_decision = 'verified' then 'none' else 'submit_replacement_proof' end
    )
  );
  return query select v_review_id, v_proof.id, v_task.id, v_next_status,
    v_next_version, v_event_receipt.event_id, v_event_receipt.occurred_at, false;
end
$function$;

create or replace function public.submit_task_proof_idempotent(
  p_task_id uuid,
  p_expected_task_version integer,
  p_proof_type text,
  p_completion_summary text,
  p_reference text,
  p_supersedes_proof_id uuid,
  p_request_id uuid
)
returns table (
  proof_id uuid, task_id uuid, task_status text, task_version integer,
  event_id uuid, occurred_at timestamp with time zone, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.submit_task_proof_idempotent(
    p_task_id, p_expected_task_version, p_proof_type,
    p_completion_summary, p_reference, p_supersedes_proof_id, p_request_id
  )
$function$;

create or replace function public.review_task_proof_idempotent(
  p_proof_id uuid,
  p_expected_task_version integer,
  p_decision text,
  p_reason text,
  p_request_id uuid
)
returns table (
  review_id uuid, proof_id uuid, task_id uuid, task_status text,
  task_version integer, event_id uuid, occurred_at timestamp with time zone,
  replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.review_task_proof_idempotent(
    p_proof_id, p_expected_task_version, p_decision, p_reason, p_request_id
  )
$function$;

alter table public.task_proofs enable row level security;
alter table public.task_proof_reviews enable row level security;

create policy cycle_8_task_proofs_authorized_select on public.task_proofs
  for select to authenticated using (passage_private.can_view_task(task_id));

create policy cycle_8_task_proof_reviews_authorized_select on public.task_proof_reviews
  for select to authenticated using (passage_private.can_view_task(task_id));

revoke all on table public.task_proofs from public, anon, authenticated;
revoke all on table public.task_proof_reviews from public, anon, authenticated;
grant select on table public.task_proofs to authenticated;
grant select on table public.task_proof_reviews to authenticated;

revoke all on function passage_private.assert_task_proof_scope() from public, anon, authenticated;
revoke all on function passage_private.assert_task_proof_review_scope() from public, anon, authenticated;
revoke all on function passage_private.reject_task_proof_mutation() from public, anon, authenticated;
revoke all on function passage_private.reject_proof_pending_reassignment() from public, anon, authenticated;
revoke all on function passage_private.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid) from public, anon, authenticated;
revoke all on function passage_private.review_task_proof_idempotent(uuid,integer,text,text,uuid) from public, anon, authenticated;
grant execute on function passage_private.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid) to authenticated;
grant execute on function passage_private.review_task_proof_idempotent(uuid,integer,text,text,uuid) to authenticated;

revoke all on function public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function public.review_task_proof_idempotent(uuid,integer,text,text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.submit_task_proof_idempotent(uuid,integer,text,text,text,uuid,uuid) to authenticated;
grant execute on function public.review_task_proof_idempotent(uuid,integer,text,text,uuid) to authenticated;
