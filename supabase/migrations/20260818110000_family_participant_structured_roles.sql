-- Structured, authority-bearing participant roles. Founder decision (asked
-- directly): Executor and POA/medical-proxy get real differentiated
-- authority -- task creation/management and inviting other participants,
-- scoped to only the one case they were invited to (not cross-estate) --
-- while clergy/officiant and cemetery/crematory contact stay display-label
-- only, same baseline as a plain participant. `case_family_invitations` only
-- carried a flat free-text `relationship` column before this; every accepted
-- participant got identical generic access regardless of stated relationship.
--
-- Design notes carried over from live-schema research (estate_access and
-- workflows predate the tracked supabase/migrations/ history -- this is the
-- first tracked migration to touch estate_access; only ALTERs are used,
-- never a fresh CREATE TABLE, since the table already exists in production):
-- - `estate_access.role` already existed as a constrained enum-like column
--   with an unused 'activator' value; adding a new, unambiguous
--   'authorized_participant' value instead of repurposing 'activator' to
--   keep the new tier's meaning explicit.
-- - Elevated authority is scoped to self-serve (D2C) cases only
--   (workflows.organization_id is null), matching the existing boundary
--   between family-facing RPCs (D2C-only) and staff/director RPCs
--   (org-backed only) -- an executor does not get write authority over a
--   funeral home's own operational task list, which is a distinct
--   authority domain the founder was not asked about here.

alter table public.estate_access drop constraint estate_access_role_check;
alter table public.estate_access add constraint estate_access_role_check
  check (role = any (array['owner','participant','external_partner','activator','read_only','operator','authorized_participant']));

alter table public.case_family_invitations add column if not exists participant_role text not null default 'family_member';
alter table public.case_family_invitations add constraint case_family_invitations_participant_role_check
  check (participant_role = any (array['family_member','executor','poa_medical_proxy','clergy_officiant','cemetery_crematory_contact']));

comment on column public.case_family_invitations.participant_role is 'Structured functional role, distinct from the free-text relationship-to-deceased field. executor and poa_medical_proxy grant elevated estate_access.role = authorized_participant on accept; the other values are display-only.';

-- Is the caller an active, accepted, elevated-tier participant on this
-- specific self-serve case? Mirrors the estate_access exists(...) fragment
-- already used inside can_message_workflow, plus the elevated-role and
-- D2C-only conditions.
create or replace function passage_private.has_elevated_family_authority(p_workflow_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.workflows as w
    join public.estate_access as ea
      on ea.workflow_id = w.id
     and ea.user_id = (select auth.uid())
     and ea.role = 'authorized_participant'
     and coalesce(ea.status, 'accepted') not in ('revoked', 'removed', 'declined')
    where w.id = p_workflow_id
      and w.organization_id is null
  )
$function$;

revoke all on function passage_private.has_elevated_family_authority(uuid) from public, anon, authenticated;
grant execute on function passage_private.has_elevated_family_authority(uuid) to authenticated;

-- Extend invite authority (and, by sharing this same predicate, revoke
-- authority -- revoke_case_family_invitation already gates on this function)
-- to also cover an elevated participant on their own case.
create or replace function passage_private.can_invite_family_to_workflow(p_workflow_id uuid)
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
      and (
        w.user_id = (select auth.uid())
        or (
          w.organization_id is not null
          and w.organization_location_id is not null
          and passage_private.can_manage_location(w.organization_id, w.organization_location_id)
        )
        or passage_private.has_elevated_family_authority(p_workflow_id)
      )
  )
$function$;

-- Derive the accepted estate_access.role from the invitation's structured
-- participant_role instead of hard-coding 'participant'. Everything else in
-- this function is unchanged from the live version.
create or replace function passage_private.accept_case_family_invitation(p_raw_token text)
returns table (
  workflow_id uuid,
  family_name text,
  person_name text,
  accepted_at timestamp with time zone,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_verified_email text;
  v_invitation public.case_family_invitations%rowtype;
  v_workflow public.workflows%rowtype;
  v_event record;
  v_estate_role text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_raw_token is null or length(p_raw_token) not between 32 and 256 then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  v_verified_email := passage_private.current_verified_email();

  select i.* into v_invitation
  from public.case_family_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  for update;
  if v_invitation.id is null then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by_user_id is distinct from v_actor then
      raise exception 'Invitation was accepted by another account' using errcode = '42501';
    end if;
    select w.* into v_workflow from public.workflows as w where w.id = v_invitation.workflow_id;
    return query select v_invitation.workflow_id, v_workflow.family_name, v_workflow.person_name, v_invitation.accepted_at, true;
    return;
  end if;
  if v_invitation.revoked_at is not null or v_invitation.expires_at <= pg_catalog.clock_timestamp() then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  if v_verified_email is distinct from v_invitation.invited_email then
    raise exception 'Sign in with the verified email address that received this invitation' using errcode = '42501';
  end if;

  select w.* into v_workflow from public.workflows as w where w.id = v_invitation.workflow_id;

  v_estate_role := case
    when v_invitation.participant_role in ('executor', 'poa_medical_proxy') then 'authorized_participant'
    else 'participant'
  end;

  insert into public.estate_access (workflow_id, user_id, email, role, status)
  values (v_invitation.workflow_id, v_actor, v_verified_email, v_estate_role, 'active')
  on conflict (workflow_id, user_id) do update
    set email = excluded.email, role = v_estate_role, status = 'active', updated_at = pg_catalog.clock_timestamp();

  update public.case_family_invitations
  set accepted_at = pg_catalog.clock_timestamp(), accepted_by_user_id = v_actor
  where id = v_invitation.id
  returning * into v_invitation;

  select * into strict v_event
  from passage_private.append_family_invitation_event(
    v_invitation.workflow_id, v_actor,
    'case_family_invitation:' || v_invitation.id::text || ':accepted',
    'case_family_invitation.accepted', 'available', 'accepted',
    pg_catalog.jsonb_build_object('relationship', v_invitation.relationship, 'participant_role', v_invitation.participant_role, 'next_owner', 'invited_family_member')
  );
  return query select v_invitation.workflow_id, v_workflow.family_name, v_workflow.person_name, v_invitation.accepted_at, false;
end
$function$;

-- Widen family task completion from strictly D2C-owner-only to also cover
-- an elevated participant on that same self-serve case. Unchanged
-- otherwise; still fails closed for any org-backed case.
create or replace function passage_private.set_family_task_completion_idempotent(p_task_id uuid, p_completed boolean, p_expected_version integer, p_request_id uuid)
returns table (task_id uuid, task_status text, task_version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
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

  if v_workflow.organization_id is not null
     or (v_workflow.user_id is distinct from v_actor_user_id and not passage_private.has_elevated_family_authority(v_workflow.id)) then
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

-- Read path for the previously-unbuilt participant task list
-- ('participant-not-supported' in lib/family/case-view.ts). Any active
-- estate_access participant on a self-serve case can see the list (matches
-- the existing view-only baseline everyone already has via
-- get_family_case_update_for_workflow); only an elevated participant gets a
-- non-null version back, since a non-null version is what the frontend uses
-- to decide whether to render a completion control at all.
create or replace function passage_private.list_family_tasks_for_participant(p_workflow_id uuid)
returns table (
  task_id uuid,
  title text,
  status text,
  waiting_party text,
  due_at timestamp with time zone,
  version integer
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_elevated boolean;
begin
  if not exists (
    select 1
    from public.workflows as w
    join public.estate_access as ea
      on ea.workflow_id = w.id
     and ea.user_id = (select auth.uid())
     and coalesce(ea.status, 'accepted') not in ('revoked', 'removed', 'declined')
    where w.id = p_workflow_id
      and w.organization_id is null
  ) then
    raise exception 'Case is unavailable' using errcode = '42501';
  end if;

  v_elevated := passage_private.has_elevated_family_authority(p_workflow_id);

  return query
  select t.id, t.title, t.status, t.waiting_party, t.due_at, case when v_elevated then t.version else null end
  from public.tasks as t
  where t.workflow_id = p_workflow_id
  order by t.due_at nulls last, t.created_at;
end
$function$;

revoke all on function passage_private.list_family_tasks_for_participant(uuid) from public, anon, authenticated;
grant execute on function passage_private.list_family_tasks_for_participant(uuid) to authenticated;

create or replace function public.list_family_tasks_for_participant(p_workflow_id uuid)
returns table (task_id uuid, title text, status text, waiting_party text, due_at timestamp with time zone, version integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from passage_private.list_family_tasks_for_participant(p_workflow_id)
$$;

revoke all on function public.list_family_tasks_for_participant(uuid) from public, anon;
grant execute on function public.list_family_tasks_for_participant(uuid) to authenticated;

-- Write path for elevated-participant task creation. Same idempotency
-- pattern as set_family_task_completion_idempotent (advisory lock + the
-- workflow_events_workflow_idempotency_unique partial index) since D2C
-- workflows have no organization_id to key against, unlike
-- create_task_idempotent's org-scoped equivalent for staff.
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
  if not passage_private.has_elevated_family_authority(p_workflow_id) then
    raise exception 'Executor or POA/medical-proxy authority is required to create a task on this case' using errcode = '42501';
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

revoke all on function passage_private.create_family_task_idempotent(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function passage_private.create_family_task_idempotent(uuid, text, text, uuid) to authenticated;

create or replace function public.create_family_task_idempotent(p_workflow_id uuid, p_title text, p_category text, p_request_id uuid)
returns table (task_id uuid, status text, version integer, event_id uuid, occurred_at timestamp with time zone, replayed boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from passage_private.create_family_task_idempotent(p_workflow_id, p_title, p_category, p_request_id)
$$;

revoke all on function public.create_family_task_idempotent(uuid, text, text, uuid) from public, anon;
grant execute on function public.create_family_task_idempotent(uuid, text, text, uuid) to authenticated;

-- Add p_participant_role (trailing, defaulted) to the invite-creation RPC.
-- CREATE OR REPLACE cannot add a parameter (it would create a distinct
-- overload rather than replace), so this drops and recreates both layers.
drop function if exists passage_private.create_case_family_invitation_idempotent(uuid, text, text, text, text, timestamp with time zone, uuid);
drop function if exists public.create_case_family_invitation_idempotent(uuid, text, text, text, text, timestamp with time zone, uuid);

create or replace function passage_private.create_case_family_invitation_idempotent(
  p_workflow_id uuid,
  p_invited_email text,
  p_display_name text,
  p_relationship text,
  p_purpose text,
  p_expires_at timestamp with time zone,
  p_request_id uuid,
  p_participant_role text default 'family_member'
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  invitation_expires_at timestamp with time zone,
  invitation_created_at timestamp with time zone,
  invitation_state text,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_email text := lower(btrim(coalesce(p_invited_email, '')));
  v_token text;
  v_invitation public.case_family_invitations%rowtype;
  v_event record;
  v_role text := coalesce(nullif(btrim(p_participant_role), ''), 'family_member');
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not passage_private.can_invite_family_to_workflow(p_workflow_id) then
    raise exception 'Case authority is required to invite family access' using errcode = '42501';
  end if;
  if v_role not in ('family_member', 'executor', 'poa_medical_proxy', 'clergy_officiant', 'cemetery_crematory_contact') then
    raise exception 'Review the participant role' using errcode = '22023';
  end if;
  if p_request_id is null
     or position('@' in v_email) <= 1
     or length(v_email) > 254
     or length(btrim(coalesce(p_display_name, ''))) not between 1 and 120
     or length(btrim(coalesce(p_relationship, ''))) not between 1 and 80
     or length(btrim(coalesce(p_purpose, ''))) not between 1 and 240 then
    raise exception 'Review the recipient, relationship, purpose, and expiry' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_workflow_id::text || ':family-invite:' || p_request_id::text, 0)
  );
  select i.* into v_invitation
  from public.case_family_invitations as i
  where i.workflow_id = p_workflow_id and i.creation_request_id = p_request_id;

  if v_invitation.id is not null then
    if v_invitation.invited_email is distinct from v_email
       or v_invitation.display_name is distinct from btrim(p_display_name)
       or v_invitation.relationship is distinct from btrim(p_relationship)
       or v_invitation.purpose is distinct from btrim(p_purpose)
       or v_invitation.expires_at is distinct from p_expires_at
       or v_invitation.participant_role is distinct from v_role then
      raise exception 'Invitation request conflicts with an earlier command' using errcode = '22023';
    end if;
    return query select v_invitation.id, null::text, v_invitation.token_hint,
      v_invitation.expires_at, v_invitation.created_at,
      case
        when v_invitation.accepted_at is not null then 'accepted'
        when v_invitation.revoked_at is not null then 'revoked'
        when v_invitation.expires_at <= pg_catalog.clock_timestamp() then 'expired'
        else 'available'
      end, true;
    return;
  end if;

  if p_expires_at is null
     or p_expires_at <= pg_catalog.clock_timestamp() + interval '15 minutes'
     or p_expires_at > pg_catalog.clock_timestamp() + interval '30 days' then
    raise exception 'Review the recipient, relationship, purpose, and expiry' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.case_family_invitations as i
    where i.workflow_id = p_workflow_id and i.invited_email = v_email
      and i.accepted_at is null and i.revoked_at is null
  ) then
    raise exception 'A live invitation already exists for this person' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.estate_access as ea
    where ea.workflow_id = p_workflow_id and lower(ea.email) = v_email
      and coalesce(ea.status, 'accepted') not in ('revoked', 'removed', 'declined')
  ) then
    raise exception 'This person already has active family access' using errcode = '23505';
  end if;

  v_token := translate(pg_catalog.encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
  insert into public.case_family_invitations (
    workflow_id, invited_email, display_name, relationship, purpose,
    invited_by_user_id, token_digest, token_hint, expires_at, creation_request_id, participant_role
  ) values (
    p_workflow_id, v_email, btrim(p_display_name), btrim(p_relationship), btrim(p_purpose),
    v_actor, passage_private.hash_invitation_token(v_token),
    right(passage_private.hash_invitation_token(v_token), 8), p_expires_at, p_request_id, v_role
  ) returning * into v_invitation;

  select * into strict v_event
  from passage_private.append_family_invitation_event(
    p_workflow_id, v_actor,
    'case_family_invitation:' || v_invitation.id::text || ':created',
    'case_family_invitation.created', null, 'available',
    pg_catalog.jsonb_build_object('relationship', v_invitation.relationship, 'participant_role', v_invitation.participant_role, 'purpose', v_invitation.purpose, 'next_owner', 'invited_family_member')
  );
  return query select v_invitation.id, v_token, v_invitation.token_hint,
    v_invitation.expires_at, v_invitation.created_at, 'available'::text, false;
end
$function$;

revoke all on function passage_private.create_case_family_invitation_idempotent(uuid, text, text, text, text, timestamp with time zone, uuid, text) from public, anon, authenticated;
grant execute on function passage_private.create_case_family_invitation_idempotent(uuid, text, text, text, text, timestamp with time zone, uuid, text) to authenticated;

create or replace function public.create_case_family_invitation_idempotent(
  p_workflow_id uuid, p_invited_email text, p_display_name text, p_relationship text,
  p_purpose text, p_expires_at timestamp with time zone, p_request_id uuid, p_participant_role text default 'family_member'
)
returns table (invitation_id uuid, raw_token text, token_hint text, invitation_expires_at timestamp with time zone, invitation_created_at timestamp with time zone, invitation_state text, replayed boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from passage_private.create_case_family_invitation_idempotent(p_workflow_id, p_invited_email, p_display_name, p_relationship, p_purpose, p_expires_at, p_request_id, p_participant_role)
$$;

revoke all on function public.create_case_family_invitation_idempotent(uuid, text, text, text, text, timestamp with time zone, uuid, text) from public, anon;
grant execute on function public.create_case_family_invitation_idempotent(uuid, text, text, text, text, timestamp with time zone, uuid, text) to authenticated;

-- Add participant_role to the pre-auth inspect preview. Adding an output
-- column changes the composite return type, so this also requires drop +
-- recreate rather than CREATE OR REPLACE.
drop function if exists passage_private.inspect_case_family_invitation(text);
drop function if exists public.inspect_case_family_invitation(text);

create or replace function passage_private.inspect_case_family_invitation(p_raw_token text)
returns table (
  inviter_display_name text,
  family_name text,
  person_name text,
  relationship text,
  participant_role text,
  invitation_purpose text,
  invitation_expires_at timestamp with time zone,
  invitation_state text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_invitation public.case_family_invitations%rowtype;
  v_workflow public.workflows%rowtype;
  v_inviter_name text;
begin
  if p_raw_token is null or length(p_raw_token) not between 32 and 256 then
    return;
  end if;
  select i.* into v_invitation
  from public.case_family_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token);
  if v_invitation.id is null then
    return;
  end if;
  select w.* into v_workflow from public.workflows as w where w.id = v_invitation.workflow_id;
  select coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), 'A family member')
  into v_inviter_name
  from auth.users as u where u.id = v_invitation.invited_by_user_id;

  return query select
    coalesce(v_inviter_name, 'A family member'),
    v_workflow.family_name,
    v_workflow.person_name,
    v_invitation.relationship,
    v_invitation.participant_role,
    v_invitation.purpose,
    v_invitation.expires_at,
    case
      when v_invitation.accepted_at is not null then 'accepted'
      when v_invitation.revoked_at is not null then 'revoked'
      when v_invitation.expires_at <= pg_catalog.clock_timestamp() then 'expired'
      else 'available'
    end;
end
$function$;

revoke all on function passage_private.inspect_case_family_invitation(text) from public;
grant execute on function passage_private.inspect_case_family_invitation(text) to anon, authenticated;

create or replace function public.inspect_case_family_invitation(p_raw_token text)
returns table (inviter_display_name text, family_name text, person_name text, relationship text, participant_role text, invitation_purpose text, invitation_expires_at timestamp with time zone, invitation_state text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from passage_private.inspect_case_family_invitation(p_raw_token)
$$;

revoke all on function public.inspect_case_family_invitation(text) from public;
grant execute on function public.inspect_case_family_invitation(text) to anon, authenticated;
