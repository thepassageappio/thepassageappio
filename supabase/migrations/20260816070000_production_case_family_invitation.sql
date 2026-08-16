-- Production-safe case-scoped family invitation.
--
-- Problem: there is no way for a funeral-home director/owner to give a family
-- member read access to a specific case, and no way for a D2C case owner to
-- share their case with another family member either. app/case/[id]/today
-- (lib/family/case-view.ts) already reads through the legacy workflows_select_safe
-- / "workflow events participant select" RLS policies, which grant access via
-- the existing public.estate_access table (workflow_id, user_id/email, role,
-- status) -- but nothing in the app ever writes to estate_access, so that path
-- is reachable today only by the original workflow.user_id creator.
--
-- Fix: a small, self-contained invitation table + idempotent create/accept/
-- revoke RPCs that terminate in an estate_access upsert. This deliberately
-- reuses the existing estate_access + legacy RLS machinery instead of
-- introducing a parallel "continuity space" model (a from-scratch family-space
-- system was designed in isolated-lab migrations 20260723072450/20260723080309/
-- 20260726040000/20260810230000/20260810230100, but those were never applied to
-- production, duplicate what estate_access already does, and their companion
-- funeral-home-directory migration (20260723092402) hardcodes lab fixture org
-- ids -- porting all of that is separate, larger, deliberately deferred work).
--
-- Authorization for creating/revoking an invitation: either an org authority
-- for the case's organization/location (director or owner), or the case's own
-- D2C owner (workflows.user_id = auth.uid()). This single mechanism covers both
-- organic loops: a funeral home bringing a family onto Passage, and a family
-- member sharing their own case with another family member.

create table public.case_family_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id),
  invited_email text not null,
  display_name text not null,
  relationship text not null,
  purpose text not null,
  invited_by_user_id uuid not null references auth.users(id),
  token_digest text not null unique,
  token_hint text not null,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  accepted_by_user_id uuid references auth.users(id),
  revoked_at timestamp with time zone,
  revoked_by_user_id uuid references auth.users(id),
  revocation_reason text,
  creation_request_id uuid not null,
  created_at timestamp with time zone not null default pg_catalog.clock_timestamp(),
  constraint case_family_invitations_email_check
    check (
      invited_email = lower(btrim(invited_email))
      and position('@' in invited_email) > 1
      and length(invited_email) <= 254
    ),
  constraint case_family_invitations_display_name_check
    check (length(btrim(display_name)) between 1 and 120),
  constraint case_family_invitations_relationship_check
    check (length(btrim(relationship)) between 1 and 80),
  constraint case_family_invitations_purpose_check
    check (length(btrim(purpose)) between 1 and 240),
  constraint case_family_invitations_digest_check
    check (token_digest ~ '^[0-9a-f]{64}$'),
  constraint case_family_invitations_hint_check
    check (token_hint ~ '^[0-9a-f]{8}$'),
  constraint case_family_invitations_expiry_check
    check (expires_at > created_at),
  constraint case_family_invitations_terminal_state_check
    check (not (accepted_at is not null and revoked_at is not null)),
  constraint case_family_invitations_acceptance_shape_check
    check (
      (accepted_at is null and accepted_by_user_id is null)
      or (accepted_at is not null and accepted_by_user_id is not null)
    ),
  constraint case_family_invitations_revocation_shape_check
    check (
      (revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
      or (
        revoked_at is not null
        and revoked_by_user_id is not null
        and length(btrim(revocation_reason)) between 1 and 500
      )
    ),
  constraint case_family_invitations_workflow_request_unique
    unique (workflow_id, creation_request_id)
);

create unique index case_family_invitations_one_live_email
  on public.case_family_invitations (workflow_id, invited_email)
  where accepted_at is null and revoked_at is null;
create index case_family_invitations_workflow_idx
  on public.case_family_invitations (workflow_id, created_at desc);
create index case_family_invitations_invited_by_idx
  on public.case_family_invitations (invited_by_user_id);

create unique index workflow_events_workflow_idempotency_unique
  on public.workflow_events (workflow_id, idempotency_key)
  where workflow_id is not null and idempotency_key is not null;

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
      )
  )
$function$;

create or replace function passage_private.append_family_invitation_event(
  p_workflow_id uuid,
  p_actor_user_id uuid,
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
  if p_workflow_id is null or p_actor_user_id is null
     or nullif(btrim(p_idempotency_key), '') is null or nullif(btrim(p_event_name), '') is null then
    raise exception 'Family invitation event authority and idempotency are required' using errcode = '22023';
  end if;

  v_occurred_at := pg_catalog.clock_timestamp();
  v_metadata := coalesce(p_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object('event_kind', p_event_name, 'proof_destination', 'case_family_access_history');
  insert into public.workflow_events (
    workflow_id, event_type, name, actor_user_id, idempotency_key, audience, previous_state, next_state, occurred_at, metadata
  ) values (
    p_workflow_id, 'other', p_event_name, p_actor_user_id, p_idempotency_key, 'family_access', p_previous_state, p_next_state, v_occurred_at, v_metadata
  )
  on conflict (workflow_id, idempotency_key) where workflow_id is not null and idempotency_key is not null
  do nothing
  returning id, workflow_events.occurred_at into v_event_id, v_occurred_at;

  if v_event_id is null then
    select e.* into strict v_existing from public.workflow_events as e
    where e.workflow_id = p_workflow_id and e.idempotency_key = p_idempotency_key;
    return query select v_existing.id, v_existing.occurred_at, false;
    return;
  end if;
  return query select v_event_id, v_occurred_at, true;
end
$function$;

create or replace function passage_private.create_case_family_invitation_idempotent(
  p_workflow_id uuid,
  p_invited_email text,
  p_display_name text,
  p_relationship text,
  p_purpose text,
  p_expires_at timestamp with time zone,
  p_request_id uuid
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
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not passage_private.can_invite_family_to_workflow(p_workflow_id) then
    raise exception 'Case authority is required to invite family access' using errcode = '42501';
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
       or v_invitation.expires_at is distinct from p_expires_at then
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
    invited_by_user_id, token_digest, token_hint, expires_at, creation_request_id
  ) values (
    p_workflow_id, v_email, btrim(p_display_name), btrim(p_relationship), btrim(p_purpose),
    v_actor, passage_private.hash_invitation_token(v_token),
    right(passage_private.hash_invitation_token(v_token), 8), p_expires_at, p_request_id
  ) returning * into v_invitation;

  select * into strict v_event
  from passage_private.append_family_invitation_event(
    p_workflow_id, v_actor,
    'case_family_invitation:' || v_invitation.id::text || ':created',
    'case_family_invitation.created', null, 'available',
    pg_catalog.jsonb_build_object('relationship', v_invitation.relationship, 'purpose', v_invitation.purpose, 'next_owner', 'invited_family_member')
  );
  return query select v_invitation.id, v_token, v_invitation.token_hint,
    v_invitation.expires_at, v_invitation.created_at, 'available'::text, false;
end
$function$;

create or replace function passage_private.inspect_case_family_invitation(p_raw_token text)
returns table (
  inviter_display_name text,
  family_name text,
  person_name text,
  relationship text,
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

  insert into public.estate_access (workflow_id, user_id, email, role, status)
  values (v_invitation.workflow_id, v_actor, v_verified_email, 'participant', 'active')
  on conflict (workflow_id, user_id) do update
    set email = excluded.email, role = 'participant', status = 'active', updated_at = pg_catalog.clock_timestamp();

  update public.case_family_invitations
  set accepted_at = pg_catalog.clock_timestamp(), accepted_by_user_id = v_actor
  where id = v_invitation.id
  returning * into v_invitation;

  select * into strict v_event
  from passage_private.append_family_invitation_event(
    v_invitation.workflow_id, v_actor,
    'case_family_invitation:' || v_invitation.id::text || ':accepted',
    'case_family_invitation.accepted', 'available', 'accepted',
    pg_catalog.jsonb_build_object('relationship', v_invitation.relationship, 'next_owner', 'invited_family_member')
  );
  return query select v_invitation.workflow_id, v_workflow.family_name, v_workflow.person_name, v_invitation.accepted_at, false;
end
$function$;

create or replace function passage_private.revoke_case_family_invitation(
  p_invitation_id uuid,
  p_reason text
)
returns table (invitation_id uuid, revoked_at timestamp with time zone, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_invitation public.case_family_invitations%rowtype;
  v_event record;
begin
  select i.* into v_invitation from public.case_family_invitations as i where i.id = p_invitation_id for update;
  if v_actor is null or v_invitation.id is null
     or not passage_private.can_invite_family_to_workflow(v_invitation.workflow_id) then
    raise exception 'Invitation is unavailable' using errcode = '42501';
  end if;
  if v_invitation.accepted_at is not null then
    raise exception 'An accepted invitation cannot be revoked' using errcode = '55000';
  end if;
  if v_invitation.revoked_at is null then
    if length(btrim(coalesce(p_reason, ''))) not between 1 and 500 then
      raise exception 'A revocation reason is required' using errcode = '22023';
    end if;
    update public.case_family_invitations
    set revoked_at = pg_catalog.clock_timestamp(), revoked_by_user_id = v_actor, revocation_reason = btrim(p_reason)
    where id = v_invitation.id
    returning * into v_invitation;
  elsif v_invitation.revocation_reason is distinct from btrim(p_reason) then
    raise exception 'Invitation revocation conflicts with earlier history' using errcode = '22023';
  end if;

  select * into strict v_event
  from passage_private.append_family_invitation_event(
    v_invitation.workflow_id, v_actor,
    'case_family_invitation:' || v_invitation.id::text || ':revoked',
    'case_family_invitation.revoked', 'available', 'revoked',
    pg_catalog.jsonb_build_object('next_owner', 'case_authority', 'outcome_note', v_invitation.revocation_reason)
  );
  return query select v_invitation.id, v_invitation.revoked_at, not v_event.inserted;
end
$function$;

create or replace function passage_private.list_case_family_invitation_projection(p_workflow_id uuid)
returns table (
  id uuid, invited_email text, display_name text, relationship text, purpose text,
  expires_at timestamp with time zone, accepted_at timestamp with time zone,
  revoked_at timestamp with time zone, created_at timestamp with time zone, lifecycle_state text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select i.id, i.invited_email, i.display_name, i.relationship, i.purpose,
    i.expires_at, i.accepted_at, i.revoked_at, i.created_at,
    case
      when i.accepted_at is not null then 'accepted'
      when i.revoked_at is not null then 'revoked'
      when i.expires_at <= pg_catalog.clock_timestamp() then 'expired'
      else 'available'
    end
  from public.case_family_invitations as i
  where i.workflow_id = p_workflow_id
    and passage_private.can_invite_family_to_workflow(p_workflow_id)
  order by i.created_at desc, i.id
$function$;

create or replace function public.create_case_family_invitation_idempotent(
  p_workflow_id uuid, p_invited_email text, p_display_name text, p_relationship text,
  p_purpose text, p_expires_at timestamp with time zone, p_request_id uuid
)
returns table (
  invitation_id uuid, raw_token text, token_hint text,
  invitation_expires_at timestamp with time zone, invitation_created_at timestamp with time zone,
  invitation_state text, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.create_case_family_invitation_idempotent(
    p_workflow_id, p_invited_email, p_display_name, p_relationship, p_purpose, p_expires_at, p_request_id
  )
$function$;

create or replace function public.inspect_case_family_invitation(p_raw_token text)
returns table (
  inviter_display_name text, family_name text, person_name text, relationship text,
  invitation_purpose text, invitation_expires_at timestamp with time zone, invitation_state text
)
language sql stable security invoker set search_path = ''
as $function$
  select * from passage_private.inspect_case_family_invitation(p_raw_token)
$function$;

create or replace function public.accept_case_family_invitation(p_raw_token text)
returns table (workflow_id uuid, family_name text, person_name text, accepted_at timestamp with time zone, replayed boolean)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.accept_case_family_invitation(p_raw_token)
$function$;

create or replace function public.revoke_case_family_invitation(p_invitation_id uuid, p_reason text)
returns table (invitation_id uuid, revoked_at timestamp with time zone, replayed boolean)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.revoke_case_family_invitation(p_invitation_id, p_reason)
$function$;

create or replace function public.list_case_family_invitation_projection(p_workflow_id uuid)
returns table (
  id uuid, invited_email text, display_name text, relationship text, purpose text,
  expires_at timestamp with time zone, accepted_at timestamp with time zone,
  revoked_at timestamp with time zone, created_at timestamp with time zone, lifecycle_state text
)
language sql stable security invoker set search_path = ''
as $function$
  select * from passage_private.list_case_family_invitation_projection(p_workflow_id)
$function$;

alter table public.case_family_invitations enable row level security;

create policy case_family_invitations_authorized_select
  on public.case_family_invitations for select to authenticated
  using (passage_private.can_invite_family_to_workflow(workflow_id));

grant select on table public.case_family_invitations to authenticated;

revoke all on function passage_private.can_invite_family_to_workflow(uuid) from public, anon, authenticated;
revoke all on function passage_private.append_family_invitation_event(uuid,uuid,text,text,text,text,jsonb) from public, anon, authenticated, service_role;
revoke all on function passage_private.create_case_family_invitation_idempotent(uuid,text,text,text,text,timestamp with time zone,uuid) from public, anon, authenticated, service_role;
revoke all on function passage_private.inspect_case_family_invitation(text) from public, anon, authenticated;
revoke all on function passage_private.accept_case_family_invitation(text) from public, anon, authenticated;
revoke all on function passage_private.revoke_case_family_invitation(uuid,text) from public, anon, authenticated;
revoke all on function passage_private.list_case_family_invitation_projection(uuid) from public, anon, authenticated;

grant execute on function passage_private.can_invite_family_to_workflow(uuid) to authenticated;
grant execute on function passage_private.create_case_family_invitation_idempotent(uuid,text,text,text,text,timestamp with time zone,uuid) to authenticated;
grant execute on function passage_private.inspect_case_family_invitation(text) to anon, authenticated;
grant execute on function passage_private.accept_case_family_invitation(text) to authenticated;
grant execute on function passage_private.revoke_case_family_invitation(uuid,text) to authenticated;
grant execute on function passage_private.list_case_family_invitation_projection(uuid) to authenticated;

revoke all on function public.create_case_family_invitation_idempotent(uuid,text,text,text,text,timestamp with time zone,uuid) from public, anon, authenticated, service_role;
revoke all on function public.inspect_case_family_invitation(text) from public, anon, authenticated, service_role;
revoke all on function public.accept_case_family_invitation(text) from public, anon, authenticated, service_role;
revoke all on function public.revoke_case_family_invitation(uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.list_case_family_invitation_projection(uuid) from public, anon, authenticated, service_role;

grant execute on function public.create_case_family_invitation_idempotent(uuid,text,text,text,text,timestamp with time zone,uuid) to authenticated;
grant execute on function public.inspect_case_family_invitation(text) to anon, authenticated;
grant execute on function public.accept_case_family_invitation(text) to authenticated;
grant execute on function public.revoke_case_family_invitation(uuid,text) to authenticated;
grant execute on function public.list_case_family_invitation_projection(uuid) to authenticated;
