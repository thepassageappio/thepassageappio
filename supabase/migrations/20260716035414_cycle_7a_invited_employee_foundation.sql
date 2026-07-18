-- Cycle 7A: invited funeral-home employee foundation.
--
-- This migration is intentionally additive. It introduces durable invitation,
-- membership-location, assignment, and event authority fields without replacing
-- the legacy workflow/task RLS policies or enforcing append-only workflow_events.
-- Those cutovers remain blocked on deterministic production-data backfill.

do $migration_preflight$
declare
  v_check record;
begin
  for v_check in
    select *
    from (values
      ('organizations', 'id', 'uuid'),
      ('organization_locations', 'id', 'uuid'),
      ('organization_locations', 'organization_id', 'uuid'),
      ('organization_members', 'id', 'uuid'),
      ('organization_members', 'organization_id', 'uuid'),
      ('organization_members', 'user_id', 'uuid'),
      ('organization_members', 'email', 'text'),
      ('organization_members', 'role', 'text'),
      ('organization_members', 'status', 'text'),
      ('workflows', 'id', 'uuid'),
      ('workflows', 'organization_id', 'uuid'),
      ('tasks', 'id', 'uuid'),
      ('tasks', 'workflow_id', 'uuid'),
      ('tasks', 'organization_id', 'uuid'),
      ('workflow_events', 'id', 'uuid'),
      ('workflow_events', 'workflow_id', 'uuid'),
      ('workflow_events', 'event_type', 'text')
    ) as expected(table_name, column_name, data_type)
  loop
    if not exists (
      select 1
      from information_schema.columns as c
      where c.table_schema = 'public'
        and c.table_name = v_check.table_name
        and c.column_name = v_check.column_name
        and c.data_type = v_check.data_type
    ) then
      raise exception
        'Cycle 7A preflight failed: expected public.%.% to have type %',
        v_check.table_name,
        v_check.column_name,
        v_check.data_type;
    end if;
  end loop;

  if to_regclass('auth.users') is null then
    raise exception 'Cycle 7A preflight failed: auth.users is unavailable';
  end if;

  if not exists (
    select 1
    from pg_extension as e
    where e.extname = 'pgcrypto'
  ) then
    raise exception 'Cycle 7A preflight failed: pgcrypto is required';
  end if;
end
$migration_preflight$;

create schema if not exists passage_private;
revoke all on schema passage_private from public;
revoke all on schema passage_private from anon;
revoke all on schema passage_private from authenticated;

alter table public.organization_members
  add column if not exists accepted_at timestamp with time zone;

alter table public.workflows
  add column if not exists organization_location_id uuid,
  add column if not exists accountable_organization_member_id uuid;

alter table public.tasks
  add column if not exists assigned_organization_member_id uuid;

alter table public.workflow_events
  add column if not exists organization_id uuid,
  add column if not exists organization_location_id uuid,
  add column if not exists task_id uuid,
  add column if not exists actor_user_id uuid,
  add column if not exists actor_organization_member_id uuid,
  add column if not exists invitation_id uuid,
  add column if not exists idempotency_key text,
  add column if not exists audience text,
  add column if not exists previous_state text,
  add column if not exists next_state text,
  add column if not exists occurred_at timestamp with time zone default now(),
  add column if not exists metadata jsonb default '{}'::jsonb;

create table if not exists public.organization_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  invited_email text not null,
  role text not null default 'staff',
  purpose text not null,
  invited_by_user_id uuid not null references auth.users(id),
  token_digest text not null unique,
  token_hint text not null,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  accepted_by_user_id uuid references auth.users(id),
  accepted_organization_member_id uuid references public.organization_members(id),
  revoked_at timestamp with time zone,
  revoked_by_user_id uuid references auth.users(id),
  revocation_reason text,
  created_at timestamp with time zone not null default now(),
  constraint organization_invitations_email_normalized_check
    check (invited_email = lower(btrim(invited_email)) and position('@' in invited_email) > 1),
  constraint organization_invitations_role_check
    check (role = 'staff'),
  constraint organization_invitations_purpose_check
    check (length(btrim(purpose)) > 0),
  constraint organization_invitations_token_digest_check
    check (token_digest ~ '^[0-9a-f]{64}$'),
  constraint organization_invitations_token_hint_check
    check (token_hint ~ '^[0-9a-f]{8}$'),
  constraint organization_invitations_expiry_check
    check (expires_at > created_at),
  constraint organization_invitations_terminal_state_check
    check (not (accepted_at is not null and revoked_at is not null)),
  constraint organization_invitations_acceptance_shape_check
    check (
      (accepted_at is null and accepted_by_user_id is null and accepted_organization_member_id is null)
      or
      (accepted_at is not null and accepted_by_user_id is not null and accepted_organization_member_id is not null)
    ),
  constraint organization_invitations_revocation_shape_check
    check (
      (revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
      or
      (revoked_at is not null and revoked_by_user_id is not null and length(btrim(revocation_reason)) > 0)
    )
);

create table if not exists public.organization_invitation_locations (
  invitation_id uuid not null references public.organization_invitations(id) on delete cascade,
  organization_location_id uuid not null references public.organization_locations(id),
  created_at timestamp with time zone not null default now(),
  primary key (invitation_id, organization_location_id)
);

create table if not exists public.organization_member_locations (
  organization_member_id uuid not null references public.organization_members(id) on delete cascade,
  organization_location_id uuid not null references public.organization_locations(id),
  granted_by_user_id uuid references auth.users(id),
  granted_at timestamp with time zone not null default now(),
  revoked_at timestamp with time zone,
  primary key (organization_member_id, organization_location_id),
  constraint organization_member_locations_revocation_check
    check (revoked_at is null or revoked_at >= granted_at)
);

do $add_cycle_7a_constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_user_id_auth_fkey'
  ) then
    alter table public.organization_members
      add constraint organization_members_user_id_auth_fkey
      foreign key (user_id) references auth.users(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflows'::regclass
      and conname = 'workflows_organization_location_id_fkey'
  ) then
    alter table public.workflows
      add constraint workflows_organization_location_id_fkey
      foreign key (organization_location_id)
      references public.organization_locations(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflows'::regclass
      and conname = 'workflows_accountable_organization_member_id_fkey'
  ) then
    alter table public.workflows
      add constraint workflows_accountable_organization_member_id_fkey
      foreign key (accountable_organization_member_id)
      references public.organization_members(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_assigned_organization_member_id_fkey'
  ) then
    alter table public.tasks
      add constraint tasks_assigned_organization_member_id_fkey
      foreign key (assigned_organization_member_id)
      references public.organization_members(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflow_events'::regclass
      and conname = 'workflow_events_organization_id_fkey'
  ) then
    alter table public.workflow_events
      add constraint workflow_events_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflow_events'::regclass
      and conname = 'workflow_events_organization_location_id_fkey'
  ) then
    alter table public.workflow_events
      add constraint workflow_events_organization_location_id_fkey
      foreign key (organization_location_id)
      references public.organization_locations(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflow_events'::regclass
      and conname = 'workflow_events_task_id_fkey'
  ) then
    alter table public.workflow_events
      add constraint workflow_events_task_id_fkey
      foreign key (task_id) references public.tasks(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflow_events'::regclass
      and conname = 'workflow_events_actor_user_id_fkey'
  ) then
    alter table public.workflow_events
      add constraint workflow_events_actor_user_id_fkey
      foreign key (actor_user_id) references auth.users(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflow_events'::regclass
      and conname = 'workflow_events_actor_organization_member_id_fkey'
  ) then
    alter table public.workflow_events
      add constraint workflow_events_actor_organization_member_id_fkey
      foreign key (actor_organization_member_id)
      references public.organization_members(id) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workflow_events'::regclass
      and conname = 'workflow_events_invitation_id_fkey'
  ) then
    alter table public.workflow_events
      add constraint workflow_events_invitation_id_fkey
      foreign key (invitation_id)
      references public.organization_invitations(id) not valid;
  end if;
end
$add_cycle_7a_constraints$;

create unique index if not exists organization_members_active_user_unique
  on public.organization_members (organization_id, user_id)
  where user_id is not null and status = 'active';

create index if not exists organization_invitations_org_email_state_idx
  on public.organization_invitations (organization_id, invited_email, created_at desc)
  where accepted_at is null and revoked_at is null;

create index if not exists organization_invitations_expiry_idx
  on public.organization_invitations (expires_at)
  where accepted_at is null and revoked_at is null;

create index if not exists organization_invitation_locations_location_idx
  on public.organization_invitation_locations (organization_location_id, invitation_id);

create index if not exists organization_member_locations_active_member_idx
  on public.organization_member_locations (organization_member_id, organization_location_id)
  where revoked_at is null;

create index if not exists organization_member_locations_active_location_idx
  on public.organization_member_locations (organization_location_id, organization_member_id)
  where revoked_at is null;

create index if not exists workflows_organization_location_idx
  on public.workflows (organization_id, organization_location_id);

create index if not exists workflows_accountable_member_idx
  on public.workflows (accountable_organization_member_id)
  where accountable_organization_member_id is not null;

create index if not exists tasks_organization_assignee_idx
  on public.tasks (organization_id, assigned_organization_member_id)
  where assigned_organization_member_id is not null;

create index if not exists workflow_events_workflow_occurred_idx
  on public.workflow_events (workflow_id, occurred_at desc)
  where workflow_id is not null;

create index if not exists workflow_events_task_occurred_idx
  on public.workflow_events (task_id, occurred_at desc)
  where task_id is not null;

create index if not exists workflow_events_invitation_occurred_idx
  on public.workflow_events (invitation_id, occurred_at desc)
  where invitation_id is not null;

create unique index if not exists workflow_events_org_idempotency_unique
  on public.workflow_events (organization_id, idempotency_key)
  where organization_id is not null and idempotency_key is not null;

create or replace function passage_private.hash_invitation_token(p_raw_token text)
returns text
language sql
immutable
strict
security invoker
set search_path = ''
as $function$
  select pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(p_raw_token, 'UTF8'), 'sha256'),
    'hex'
  )
$function$;

create or replace function passage_private.current_verified_email()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_email text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select lower(btrim(u.email))
    into v_email
  from auth.users as u
  where u.id = (select auth.uid())
    and u.email is not null
    and u.email_confirmed_at is not null;

  if v_email is null then
    raise exception 'A verified email address is required' using errcode = '28000';
  end if;

  return v_email;
end
$function$;

create or replace function passage_private.current_active_member_id(p_organization_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select m.id
  from public.organization_members as m
  where m.organization_id = p_organization_id
    and m.user_id = (select auth.uid())
    and m.status = 'active'
  order by m.created_at, m.id
  limit 1
$function$;

create or replace function passage_private.can_manage_organization(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.organization_members as m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role in ('owner', 'director')
  )
$function$;

create or replace function passage_private.can_manage_location(
  p_organization_id uuid,
  p_organization_location_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.organization_members as m
    join public.organization_locations as l
      on l.id = p_organization_location_id
     and l.organization_id = p_organization_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role in ('owner', 'director')
      and exists (
        select 1
        from public.organization_member_locations as ml
        where ml.organization_member_id = m.id
          and ml.organization_location_id = p_organization_location_id
          and ml.revoked_at is null
      )
  )
$function$;

create or replace function passage_private.can_manage_invitation(p_invitation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.organization_invitations as i
    where i.id = p_invitation_id
      and passage_private.can_manage_organization(i.organization_id)
      and not exists (
        select 1
        from public.organization_invitation_locations as il
        where il.invitation_id = i.id
          and not passage_private.can_manage_location(
            i.organization_id,
            il.organization_location_id
          )
      )
  )
$function$;

create or replace function passage_private.can_view_member_location(
  p_organization_member_id uuid,
  p_organization_location_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.organization_members as subject_member
    where subject_member.id = p_organization_member_id
      and (
        subject_member.user_id = (select auth.uid())
        or passage_private.can_manage_location(
          subject_member.organization_id,
          p_organization_location_id
        )
      )
  )
$function$;

create or replace function passage_private.enforce_invitation_location_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_invitation_organization_id uuid;
  v_location_organization_id uuid;
begin
  select i.organization_id into v_invitation_organization_id
  from public.organization_invitations as i
  where i.id = new.invitation_id;

  select l.organization_id into v_location_organization_id
  from public.organization_locations as l
  where l.id = new.organization_location_id;

  if v_invitation_organization_id is null
     or v_location_organization_id is null
     or v_invitation_organization_id <> v_location_organization_id then
    raise exception 'Invitation and location must belong to the same organization';
  end if;

  return new;
end
$function$;

create or replace function passage_private.enforce_workflow_authority_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_location_organization_id uuid;
  v_member public.organization_members%rowtype;
begin
  if new.organization_location_id is not null then
    select l.organization_id into v_location_organization_id
    from public.organization_locations as l
    where l.id = new.organization_location_id
      and l.status = 'active';

    if new.organization_id is null
       or v_location_organization_id is null
       or v_location_organization_id <> new.organization_id then
      raise exception 'Workflow location must be active and belong to the workflow organization';
    end if;
  end if;

  if new.accountable_organization_member_id is not null then
    select m.* into v_member
    from public.organization_members as m
    where m.id = new.accountable_organization_member_id;

    if new.organization_id is null
       or v_member.id is null
       or v_member.organization_id <> new.organization_id
       or v_member.status <> 'active' then
      raise exception 'Accountable member must be active in the workflow organization';
    end if;

    if new.organization_location_id is not null
       and not exists (
         select 1
         from public.organization_member_locations as ml
         where ml.organization_member_id = v_member.id
           and ml.organization_location_id = new.organization_location_id
           and ml.revoked_at is null
       ) then
      raise exception 'Accountable member must have relational access to the workflow location';
    end if;
  end if;

  return new;
end
$function$;

create or replace function passage_private.enforce_task_authority_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workflow_organization_id uuid;
  v_workflow_location_id uuid;
  v_member public.organization_members%rowtype;
begin
  if new.workflow_id is not null then
    select w.organization_id, w.organization_location_id
      into v_workflow_organization_id, v_workflow_location_id
    from public.workflows as w
    where w.id = new.workflow_id;

    if new.organization_id is not null
       and v_workflow_organization_id is not null
       and new.organization_id <> v_workflow_organization_id then
      raise exception 'Task organization must match its workflow organization';
    end if;
  end if;

  if new.assigned_organization_member_id is not null then
    select m.* into v_member
    from public.organization_members as m
    where m.id = new.assigned_organization_member_id;

    if new.organization_id is null
       or v_member.id is null
       or v_member.organization_id <> new.organization_id
       or v_member.status <> 'active' then
      raise exception 'Assigned member must be active in the task organization';
    end if;

    if v_workflow_location_id is not null
       and not exists (
         select 1
         from public.organization_member_locations as ml
         where ml.organization_member_id = v_member.id
           and ml.organization_location_id = v_workflow_location_id
           and ml.revoked_at is null
       ) then
      raise exception 'Assigned member must have relational access to the workflow location';
    end if;
  end if;

  return new;
end
$function$;

create or replace function passage_private.enforce_workflow_event_authority_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.organization_id is not null then
    if new.organization_location_id is not null and not exists (
      select 1 from public.organization_locations as l
      where l.id = new.organization_location_id
        and l.organization_id = new.organization_id
    ) then
      raise exception 'Event location must belong to the event organization';
    end if;

    if new.workflow_id is not null and exists (
      select 1 from public.workflows as w
      where w.id = new.workflow_id
        and w.organization_id is not null
        and w.organization_id <> new.organization_id
    ) then
      raise exception 'Event workflow must belong to the event organization';
    end if;

    if new.task_id is not null and exists (
      select 1 from public.tasks as t
      where t.id = new.task_id
        and t.organization_id is not null
        and t.organization_id <> new.organization_id
    ) then
      raise exception 'Event task must belong to the event organization';
    end if;

    if new.actor_organization_member_id is not null and not exists (
      select 1 from public.organization_members as m
      where m.id = new.actor_organization_member_id
        and m.organization_id = new.organization_id
        and (new.actor_user_id is null or m.user_id = new.actor_user_id)
    ) then
      raise exception 'Event actor member must belong to the event organization and user';
    end if;

    if new.invitation_id is not null and not exists (
      select 1 from public.organization_invitations as i
      where i.id = new.invitation_id
        and i.organization_id = new.organization_id
    ) then
      raise exception 'Event invitation must belong to the event organization';
    end if;
  elsif new.organization_location_id is not null
     or new.actor_organization_member_id is not null
     or new.invitation_id is not null then
    raise exception 'Organization-scoped event authority requires organization_id';
  end if;

  return new;
end
$function$;

drop trigger if exists workflows_authority_scope_integrity on public.workflows;
create trigger workflows_authority_scope_integrity
before insert or update of organization_id, organization_location_id,
  accountable_organization_member_id
on public.workflows
for each row execute function passage_private.enforce_workflow_authority_scope();

drop trigger if exists tasks_authority_scope_integrity on public.tasks;
create trigger tasks_authority_scope_integrity
before insert or update of workflow_id, organization_id,
  assigned_organization_member_id
on public.tasks
for each row execute function passage_private.enforce_task_authority_scope();

drop trigger if exists workflow_events_authority_scope_integrity
  on public.workflow_events;
create trigger workflow_events_authority_scope_integrity
before insert or update of workflow_id, organization_id,
  organization_location_id, task_id, actor_user_id,
  actor_organization_member_id, invitation_id
on public.workflow_events
for each row execute function passage_private.enforce_workflow_event_authority_scope();

create or replace function passage_private.enforce_member_location_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_member_organization_id uuid;
  v_location_organization_id uuid;
begin
  select m.organization_id into v_member_organization_id
  from public.organization_members as m
  where m.id = new.organization_member_id;

  select l.organization_id into v_location_organization_id
  from public.organization_locations as l
  where l.id = new.organization_location_id;

  if v_member_organization_id is null
     or v_location_organization_id is null
     or v_member_organization_id <> v_location_organization_id then
    raise exception 'Member and location must belong to the same organization';
  end if;

  return new;
end
$function$;

drop trigger if exists organization_invitation_locations_same_org
  on public.organization_invitation_locations;
create trigger organization_invitation_locations_same_org
before insert or update on public.organization_invitation_locations
for each row execute function passage_private.enforce_invitation_location_organization();

drop trigger if exists organization_member_locations_same_org
  on public.organization_member_locations;
create trigger organization_member_locations_same_org
before insert or update on public.organization_member_locations
for each row execute function passage_private.enforce_member_location_organization();

create or replace function passage_private.append_invitation_event(
  p_organization_id uuid,
  p_organization_location_id uuid,
  p_actor_user_id uuid,
  p_actor_organization_member_id uuid,
  p_invitation_id uuid,
  p_idempotency_key text,
  p_event_name text,
  p_previous_state text,
  p_next_state text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_event_id uuid;
begin
  if p_organization_id is null
     or p_actor_user_id is null
     or p_invitation_id is null
     or nullif(btrim(p_idempotency_key), '') is null
     or nullif(btrim(p_event_name), '') is null then
    raise exception 'Invitation event authority and idempotency are required';
  end if;

  if not exists (
    select 1
    from public.organization_invitations as i
    where i.id = p_invitation_id
      and i.organization_id = p_organization_id
  ) then
    raise exception 'Invitation event organization mismatch';
  end if;

  if p_organization_location_id is not null and not exists (
    select 1
    from public.organization_locations as l
    where l.id = p_organization_location_id
      and l.organization_id = p_organization_id
  ) then
    raise exception 'Invitation event location mismatch';
  end if;

  if p_actor_organization_member_id is not null and not exists (
    select 1
    from public.organization_members as m
    where m.id = p_actor_organization_member_id
      and m.organization_id = p_organization_id
      and m.user_id = p_actor_user_id
  ) then
    raise exception 'Invitation event actor mismatch';
  end if;

  insert into public.workflow_events (
    workflow_id,
    event_type,
    name,
    organization_id,
    organization_location_id,
    actor_user_id,
    actor_organization_member_id,
    invitation_id,
    idempotency_key,
    audience,
    previous_state,
    next_state,
    occurred_at,
    metadata
  ) values (
    null,
    'other',
    p_event_name,
    p_organization_id,
    p_organization_location_id,
    p_actor_user_id,
    p_actor_organization_member_id,
    p_invitation_id,
    p_idempotency_key,
    'organization_internal',
    p_previous_state,
    p_next_state,
    pg_catalog.clock_timestamp(),
    coalesce(p_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'event_kind', p_event_name,
      'proof_destination', 'organization_audit'
    )
  )
  on conflict (organization_id, idempotency_key)
    where organization_id is not null and idempotency_key is not null
  do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select e.id into v_event_id
    from public.workflow_events as e
    where e.organization_id = p_organization_id
      and e.idempotency_key = p_idempotency_key;
  end if;

  return v_event_id;
end
$function$;

revoke all on function passage_private.enforce_member_location_organization()
  from public, anon, authenticated;
revoke all on function passage_private.append_invitation_event(
  uuid, uuid, uuid, uuid, uuid, text, text, text, text, jsonb
) from public, anon, authenticated;
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
        select m.display_name
        from public.organization_members as m
        where m.organization_id = i.organization_id
          and m.user_id = i.invited_by_user_id
        order by m.created_at, m.id
        limit 1
      ),
      'A funeral home administrator'
    ) as inviter_display_name,
    o.name as organization_name,
    i.role as invitation_role,
    coalesce(
      (
        select array_agg(l.name order by l.name, l.id)
        from public.organization_invitation_locations as il
        join public.organization_locations as l
          on l.id = il.organization_location_id
        where il.invitation_id = i.id
      ),
      '{}'::text[]
    ) as location_names,
    i.purpose as invitation_purpose,
    i.expires_at as invitation_expires_at,
    case
      when i.accepted_at is not null then 'accepted'
      when i.revoked_at is not null then 'revoked'
      when i.expires_at <= pg_catalog.clock_timestamp() then 'expired'
      else 'available'
    end as invitation_state
  from public.organization_invitations as i
  join public.organizations as o on o.id = i.organization_id
  where length(coalesce(p_raw_token, '')) >= 32
    and i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  limit 1
$function$;

create or replace function passage_private.create_employee_invitation(
  p_organization_id uuid,
  p_invited_email text,
  p_organization_location_ids uuid[],
  p_purpose text,
  p_expires_at timestamp with time zone
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamp with time zone
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_email text := lower(btrim(coalesce(p_invited_email, '')));
  v_location_ids uuid[];
  v_raw_token text;
  v_token_digest text;
  v_token_hint text;
  v_invitation_id uuid;
  v_event_location_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not passage_private.can_manage_organization(p_organization_id) then
    raise exception 'You do not have authority to invite employees for this organization'
      using errcode = '42501';
  end if;

  if length(v_email) > 320 or position('@' in v_email) <= 1 then
    raise exception 'A valid invited email address is required' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_purpose, '')), '') is null then
    raise exception 'An invitation purpose is required' using errcode = '22023';
  end if;

  if p_expires_at is null
     or p_expires_at <= pg_catalog.clock_timestamp() + interval '15 minutes'
     or p_expires_at > pg_catalog.clock_timestamp() + interval '30 days' then
    raise exception 'Invitation expiry must be between 15 minutes and 30 days from now'
      using errcode = '22023';
  end if;

  if p_organization_location_ids is null
     or cardinality(p_organization_location_ids) = 0
     or array_position(p_organization_location_ids, null) is not null then
    raise exception 'At least one valid location is required' using errcode = '22023';
  end if;

  select array_agg(location_id order by location_id)
    into v_location_ids
  from (
    select distinct unnest(p_organization_location_ids) as location_id
  ) as requested_locations;

  if exists (
    select 1
    from unnest(v_location_ids) as requested(location_id)
    left join public.organization_locations as l
      on l.id = requested.location_id
     and l.organization_id = p_organization_id
     and l.status = 'active'
    where l.id is null
  ) then
    raise exception 'Every invited location must be active and belong to the organization'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from unnest(v_location_ids) as requested(location_id)
    where not passage_private.can_manage_location(
      p_organization_id,
      requested.location_id
    )
  ) then
    raise exception 'You do not have authority for every invited location'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.organization_members as m
    where m.organization_id = p_organization_id
      and lower(btrim(m.email)) = v_email
      and m.status = 'active'
  ) then
    raise exception 'This person is already an active organization member'
      using errcode = '23505';
  end if;

  v_actor_member_id := passage_private.current_active_member_id(p_organization_id);
  if v_actor_member_id is null then
    raise exception 'An active organization membership is required' using errcode = '42501';
  end if;

  v_raw_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  v_token_digest := passage_private.hash_invitation_token(v_raw_token);
  v_token_hint := right(v_raw_token, 8);
  v_invitation_id := extensions.gen_random_uuid();

  insert into public.organization_invitations (
    id,
    organization_id,
    invited_email,
    role,
    purpose,
    invited_by_user_id,
    token_digest,
    token_hint,
    expires_at
  ) values (
    v_invitation_id,
    p_organization_id,
    v_email,
    'staff',
    btrim(p_purpose),
    v_actor_user_id,
    v_token_digest,
    v_token_hint,
    p_expires_at
  );

  insert into public.organization_invitation_locations (
    invitation_id,
    organization_location_id
  )
  select v_invitation_id, requested.location_id
  from unnest(v_location_ids) as requested(location_id);

  if cardinality(v_location_ids) = 1 then
    v_event_location_id := v_location_ids[1];
  end if;

  perform passage_private.append_invitation_event(
    p_organization_id,
    v_event_location_id,
    v_actor_user_id,
    v_actor_member_id,
    v_invitation_id,
    'organization_invitation:' || v_invitation_id::text || ':created',
    'organization_invitation.created',
    null,
    'pending_acceptance',
    pg_catalog.jsonb_build_object(
      'invitation_role', 'staff',
      'location_ids', pg_catalog.to_jsonb(v_location_ids),
      'automation_level', 'manual',
      'delivery_state', 'not_sent',
      'next_action', 'Share the invitation through an approved delivery channel'
    )
  );

  return query
  select v_invitation_id, v_raw_token, v_token_hint, p_expires_at;
end
$function$;

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
  v_display_name text;
  v_invitation public.organization_invitations%rowtype;
  v_member public.organization_members%rowtype;
  v_member_count integer;
  v_location_ids uuid[];
  v_accepted_at timestamp with time zone;
  v_event_location_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if length(coalesce(p_raw_token, '')) < 32 then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  v_verified_email := passage_private.current_verified_email();

  select coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(v_verified_email, '@', 1)
  )
    into v_display_name
  from auth.users as u
  where u.id = v_actor_user_id;

  select i.* into v_invitation
  from public.organization_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  for update;

  if not found then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  select coalesce(array_agg(il.organization_location_id order by il.organization_location_id), '{}'::uuid[])
    into v_location_ids
  from public.organization_invitation_locations as il
  where il.invitation_id = v_invitation.id;

  if cardinality(v_location_ids) = 0 then
    raise exception 'Invitation has no valid location scope' using errcode = '22023';
  end if;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by_user_id <> v_actor_user_id then
      raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
    end if;

    return query
    select
      v_invitation.accepted_organization_member_id,
      v_invitation.organization_id,
      v_invitation.role,
      v_location_ids,
      '/staff'::text,
      v_invitation.accepted_at,
      true;
    return;
  end if;

  if v_invitation.revoked_at is not null
     or v_invitation.expires_at <= pg_catalog.clock_timestamp() then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  if v_invitation.invited_email <> v_verified_email then
    raise exception 'Sign in with the verified email address that received this invitation'
      using errcode = '42501';
  end if;

  perform m.id
  from public.organization_members as m
  where m.organization_id = v_invitation.organization_id
    and (
      m.user_id = v_actor_user_id
      or lower(btrim(m.email)) = v_verified_email
    )
  for update;

  select count(*)::integer
    into v_member_count
  from public.organization_members as m
  where m.organization_id = v_invitation.organization_id
    and (
      m.user_id = v_actor_user_id
      or lower(btrim(m.email)) = v_verified_email
    );

  if v_member_count > 1 then
    raise exception 'Membership needs administrator review before this invitation can be accepted'
      using errcode = '23505';
  end if;

  v_accepted_at := pg_catalog.clock_timestamp();

  if v_member_count = 1 then
    select m.* into v_member
    from public.organization_members as m
    where m.organization_id = v_invitation.organization_id
      and (
        m.user_id = v_actor_user_id
        or lower(btrim(m.email)) = v_verified_email
      )
    limit 1;

    if v_member.user_id is not null and v_member.user_id <> v_actor_user_id then
      raise exception 'Membership is already bound to another account' using errcode = '42501';
    end if;

    if v_member.role <> v_invitation.role then
      raise exception 'Membership role needs administrator review before acceptance'
        using errcode = '42501';
    end if;

    update public.organization_members as m
    set user_id = v_actor_user_id,
        email = v_verified_email,
        status = 'active',
        accepted_at = v_accepted_at,
        display_name = coalesce(nullif(m.display_name, ''), v_display_name),
        updated_at = v_accepted_at
    where m.id = v_member.id
    returning m.* into v_member;
  else
    insert into public.organization_members (
      organization_id,
      user_id,
      email,
      role,
      status,
      display_name,
      accepted_at,
      created_at,
      updated_at
    ) values (
      v_invitation.organization_id,
      v_actor_user_id,
      v_verified_email,
      v_invitation.role,
      'active',
      v_display_name,
      v_accepted_at,
      v_accepted_at,
      v_accepted_at
    )
    returning * into v_member;
  end if;

  update public.organization_member_locations as ml
  set revoked_at = v_accepted_at
  where ml.organization_member_id = v_member.id
    and ml.revoked_at is null
    and not (ml.organization_location_id = any(v_location_ids));

  insert into public.organization_member_locations as existing_scope (
    organization_member_id,
    organization_location_id,
    granted_by_user_id,
    granted_at,
    revoked_at
  )
  select
    v_member.id,
    requested.location_id,
    v_invitation.invited_by_user_id,
    v_accepted_at,
    null
  from unnest(v_location_ids) as requested(location_id)
  on conflict (organization_member_id, organization_location_id)
  do update set
    granted_by_user_id = excluded.granted_by_user_id,
    granted_at = case
      when existing_scope.revoked_at is null
        then existing_scope.granted_at
      else excluded.granted_at
    end,
    revoked_at = null;

  update public.organization_invitations as i
  set accepted_at = v_accepted_at,
      accepted_by_user_id = v_actor_user_id,
      accepted_organization_member_id = v_member.id
  where i.id = v_invitation.id
    and i.accepted_at is null
    and i.revoked_at is null;

  if not found then
    raise exception 'Invitation changed while it was being accepted' using errcode = '40001';
  end if;

  if cardinality(v_location_ids) = 1 then
    v_event_location_id := v_location_ids[1];
  end if;

  perform passage_private.append_invitation_event(
    v_invitation.organization_id,
    v_event_location_id,
    v_actor_user_id,
    v_member.id,
    v_invitation.id,
    'organization_invitation:' || v_invitation.id::text || ':accepted',
    'organization_invitation.accepted',
    'pending_acceptance',
    'accepted',
    pg_catalog.jsonb_build_object(
      'invitation_role', v_invitation.role,
      'location_ids', pg_catalog.to_jsonb(v_location_ids),
      'next_action', 'Open assigned work',
      'landing_path', '/staff'
    )
  );

  return query
  select
    v_member.id,
    v_invitation.organization_id,
    v_invitation.role,
    v_location_ids,
    '/staff'::text,
    v_accepted_at,
    false;
end
$function$;

create or replace function passage_private.revoke_organization_invitation(
  p_invitation_id uuid,
  p_reason text
)
returns table (
  invitation_id uuid,
  revoked_at timestamp with time zone,
  invitation_state text,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_invitation public.organization_invitations%rowtype;
  v_location_ids uuid[];
  v_revoked_at timestamp with time zone;
  v_event_location_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'A revocation reason is required' using errcode = '22023';
  end if;

  select i.* into v_invitation
  from public.organization_invitations as i
  where i.id = p_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found' using errcode = '22023';
  end if;

  if not passage_private.can_manage_invitation(v_invitation.id) then
    raise exception 'You do not have authority to revoke this invitation'
      using errcode = '42501';
  end if;

  if v_invitation.accepted_at is not null then
    raise exception 'Accepted invitations require the membership-revocation workflow'
      using errcode = '55000';
  end if;

  if v_invitation.revoked_at is not null then
    return query
    select v_invitation.id, v_invitation.revoked_at, 'revoked'::text, true;
    return;
  end if;

  select coalesce(array_agg(il.organization_location_id order by il.organization_location_id), '{}'::uuid[])
    into v_location_ids
  from public.organization_invitation_locations as il
  where il.invitation_id = v_invitation.id;

  v_actor_member_id := passage_private.current_active_member_id(v_invitation.organization_id);
  if v_actor_member_id is null then
    raise exception 'An active organization membership is required' using errcode = '42501';
  end if;

  v_revoked_at := pg_catalog.clock_timestamp();
  update public.organization_invitations as i
  set revoked_at = v_revoked_at,
      revoked_by_user_id = v_actor_user_id,
      revocation_reason = btrim(p_reason)
  where i.id = v_invitation.id;

  if cardinality(v_location_ids) = 1 then
    v_event_location_id := v_location_ids[1];
  end if;

  perform passage_private.append_invitation_event(
    v_invitation.organization_id,
    v_event_location_id,
    v_actor_user_id,
    v_actor_member_id,
    v_invitation.id,
    'organization_invitation:' || v_invitation.id::text || ':revoked',
    'organization_invitation.revoked',
    'pending_acceptance',
    'revoked',
    pg_catalog.jsonb_build_object(
      'location_ids', pg_catalog.to_jsonb(v_location_ids),
      'reason', btrim(p_reason),
      'next_action', 'Create a new invitation if access is still needed'
    )
  );

  return query
  select v_invitation.id, v_revoked_at, 'revoked'::text, false;
end
$function$;

alter table public.organization_invitations enable row level security;
alter table public.organization_invitation_locations enable row level security;
alter table public.organization_member_locations enable row level security;

drop policy if exists organization_invitations_authorized_select
  on public.organization_invitations;
create policy organization_invitations_authorized_select
  on public.organization_invitations
  for select
  to authenticated
  using (
    invited_by_user_id = (select auth.uid())
    or accepted_by_user_id = (select auth.uid())
    or passage_private.can_manage_invitation(id)
  );

drop policy if exists organization_invitation_locations_authorized_select
  on public.organization_invitation_locations;
create policy organization_invitation_locations_authorized_select
  on public.organization_invitation_locations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_invitations as invitation
      where invitation.id = invitation_id
    )
  );

drop policy if exists organization_member_locations_authorized_select
  on public.organization_member_locations;
create policy organization_member_locations_authorized_select
  on public.organization_member_locations
  for select
  to authenticated
  using (
    passage_private.can_view_member_location(
      organization_member_id,
      organization_location_id
    )
  );

revoke all on table public.organization_invitations from anon, authenticated;
revoke all on table public.organization_invitation_locations from anon, authenticated;
revoke all on table public.organization_member_locations from anon, authenticated;
grant select on table public.organization_member_locations to authenticated;

create or replace function public.inspect_organization_invitation(raw_token text)
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
security invoker
set search_path = ''
as $function$
  select * from passage_private.inspect_organization_invitation(raw_token)
$function$;

create or replace function public.create_employee_invitation(
  p_organization_id uuid,
  p_invited_email text,
  p_organization_location_ids uuid[],
  p_purpose text,
  p_expires_at timestamp with time zone
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamp with time zone
)
language sql
volatile
security invoker
set search_path = ''
as $function$
  select * from passage_private.create_employee_invitation(
    p_organization_id,
    p_invited_email,
    p_organization_location_ids,
    p_purpose,
    p_expires_at
  )
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
language sql
volatile
security invoker
set search_path = ''
as $function$
  select * from passage_private.accept_organization_invitation(raw_token)
$function$;

create or replace function public.revoke_organization_invitation(
  p_invitation_id uuid,
  p_reason text
)
returns table (
  invitation_id uuid,
  revoked_at timestamp with time zone,
  invitation_state text,
  replayed boolean
)
language sql
volatile
security invoker
set search_path = ''
as $function$
  select * from passage_private.revoke_organization_invitation(
    p_invitation_id,
    p_reason
  )
$function$;

revoke all on function passage_private.hash_invitation_token(text)
  from public, anon, authenticated;
revoke all on function passage_private.inspect_organization_invitation(text)
  from public, anon, authenticated;
revoke all on function passage_private.create_employee_invitation(uuid, text, uuid[], text, timestamp with time zone)
  from public, anon, authenticated;
revoke all on function passage_private.accept_organization_invitation(text)
  from public, anon, authenticated;
revoke all on function passage_private.revoke_organization_invitation(uuid, text)
  from public, anon, authenticated;
revoke all on function passage_private.current_verified_email()
  from public, anon, authenticated;
revoke all on function passage_private.current_active_member_id(uuid)
  from public, anon, authenticated;
revoke all on function passage_private.can_manage_organization(uuid)
  from public, anon, authenticated;
revoke all on function passage_private.can_manage_location(uuid, uuid)
  from public, anon, authenticated;
revoke all on function passage_private.can_manage_invitation(uuid)
  from public, anon, authenticated;
revoke all on function passage_private.can_view_member_location(uuid, uuid)
  from public, anon, authenticated;
revoke all on function passage_private.enforce_invitation_location_organization()
  from public, anon, authenticated;
revoke all on function passage_private.enforce_workflow_authority_scope()
  from public, anon, authenticated;
revoke all on function passage_private.enforce_task_authority_scope()
  from public, anon, authenticated;
revoke all on function passage_private.enforce_workflow_event_authority_scope()
  from public, anon, authenticated;

-- The private schema is not exposed by the Data API. Exact entrypoints still
-- enforce their own authentication, verified-email, token, and scope checks.
grant usage on schema passage_private to anon, authenticated;
grant execute on function passage_private.inspect_organization_invitation(text)
  to anon, authenticated;
grant execute on function passage_private.create_employee_invitation(uuid, text, uuid[], text, timestamp with time zone)
  to authenticated;
grant execute on function passage_private.accept_organization_invitation(text)
  to authenticated;
grant execute on function passage_private.revoke_organization_invitation(uuid, text)
  to authenticated;
grant execute on function passage_private.can_manage_invitation(uuid)
  to authenticated;
grant execute on function passage_private.can_view_member_location(uuid, uuid)
  to authenticated;

revoke all on function public.inspect_organization_invitation(text)
  from public, anon, authenticated, service_role;
revoke all on function public.create_employee_invitation(uuid, text, uuid[], text, timestamp with time zone)
  from public, anon, authenticated, service_role;
revoke all on function public.accept_organization_invitation(text)
  from public, anon, authenticated, service_role;
revoke all on function public.revoke_organization_invitation(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.inspect_organization_invitation(text)
  to anon, authenticated;
grant execute on function public.create_employee_invitation(uuid, text, uuid[], text, timestamp with time zone)
  to authenticated;
grant execute on function public.accept_organization_invitation(text)
  to authenticated;
grant execute on function public.revoke_organization_invitation(uuid, text)
  to authenticated;


