-- ISOLATED-PROJECT Passage Zero participant invitation thin slice.
--
-- Documentation-first contract:
-- docs/product/participant-invitation-thin-slice.md
--
-- Apply through reviewed Supabase migration tooling only to isolated project
-- uyacxqtsiwlvtmhxvoxr. Never apply to Production qsveqfchwylsbncsfgxe.

do $participant_preflight$
begin
  if to_regclass('public.workflow_events') is null
     or to_regclass('auth.users') is null
     or to_regprocedure('passage_private.hash_invitation_token(text)') is null
     or to_regprocedure('passage_private.current_verified_email()') is null
     or to_regprocedure('passage_private.reject_workflow_event_mutation()') is null
     or not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'cycle_8_task_proof_loop'
     )
     or not exists (
       select 1
       from pg_trigger as t
       where t.tgrelid = 'public.workflow_events'::regclass
         and t.tgname = 'workflow_events_cycle_7b_append_only'
         and not t.tgisinternal
         and t.tgenabled in ('O', 'A')
     ) then
    raise exception using
      errcode = '42501',
      message = 'Participant invitation refused: reviewed isolated authority and append-only event foundations are missing';
  end if;

  if (select count(*) from public.organizations) <> 1
     or (select count(*) from public.organization_locations) <> 1
     or (select count(*) from public.workflows) <> 2
     or (select count(*) from public.tasks) <> 3
     or (select count(*) from public.workflow_events) <> 8
     or (select count(*) from public.organization_invitations) <> 2
     or (select count(*) from public.organization_invitation_locations) <> 2
     or (select count(*) from public.organization_members where status = 'active') <> 2
     or (select count(*) from public.organization_members where status = 'revoked') <> 1
     or (select count(*) from public.organization_member_locations where revoked_at is null) <> 2
     or (select count(*) from public.workflows where case_reference = 'NS-2051') <> 1 then
    raise exception using
      errcode = '42501',
      message = 'Participant invitation refused: exact isolated Cycle 7A/7B/8 sentinel drifted';
  end if;

  if (select count(*) from public.organizations
      where id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.organization_locations
         where id = 'c7a00002-7a00-47a0-87a0-000000000002'
           and organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 1
     or (select count(*) from public.workflows
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 2
     or (select count(*) from public.tasks
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 3
     or (select count(*) from public.workflow_events
         where organization_id = 'c7a00001-7a00-47a0-87a0-000000000001') <> 8
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
      message = 'Participant invitation refused: exact isolated synthetic identities are missing';
  end if;

  if to_regclass('public.continuity_spaces') is not null
     or to_regclass('public.continuity_participants') is not null
     or to_regclass('public.participant_invitations') is not null then
    raise exception using
      errcode = '55000',
      message = 'Participant invitation refused: incompatible continuity objects already exist';
  end if;
end
$participant_preflight$;

create table public.continuity_spaces (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  display_name text not null,
  status text not null default 'active',
  creation_request_id uuid not null,
  created_at timestamp with time zone not null default pg_catalog.clock_timestamp(),
  archived_at timestamp with time zone,
  constraint continuity_spaces_name_check
    check (length(btrim(display_name)) between 1 and 120),
  constraint continuity_spaces_status_check
    check (status in ('active', 'archived')),
  constraint continuity_spaces_archive_shape_check
    check (
      (status = 'active' and archived_at is null)
      or (status = 'archived' and archived_at is not null)
    ),
  constraint continuity_spaces_owner_request_unique
    unique (owner_user_id, creation_request_id)
);

create unique index continuity_spaces_one_active_per_owner
  on public.continuity_spaces (owner_user_id)
  where status = 'active';

create table public.continuity_participants (
  id uuid primary key default extensions.gen_random_uuid(),
  continuity_space_id uuid not null references public.continuity_spaces(id),
  user_id uuid not null references auth.users(id),
  invited_email text not null,
  display_name text not null,
  relationship text not null,
  purpose text not null,
  category_scope text[] not null,
  status text not null default 'active',
  accepted_from_invitation_id uuid,
  accepted_at timestamp with time zone not null,
  revoked_at timestamp with time zone,
  revoked_by_user_id uuid references auth.users(id),
  revocation_reason text,
  constraint continuity_participants_email_check
    check (
      invited_email = lower(btrim(invited_email))
      and position('@' in invited_email) > 1
      and length(invited_email) <= 254
    ),
  constraint continuity_participants_display_name_check
    check (length(btrim(display_name)) between 1 and 120),
  constraint continuity_participants_relationship_check
    check (length(btrim(relationship)) between 1 and 80),
  constraint continuity_participants_purpose_check
    check (length(btrim(purpose)) between 1 and 240),
  constraint continuity_participants_scope_check
    check (
      cardinality(category_scope) between 1 and 6
      and category_scope <@ array['updates', 'tasks', 'decisions', 'documents', 'service', 'proof']::text[]
    ),
  constraint continuity_participants_status_check
    check (status in ('active', 'revoked')),
  constraint continuity_participants_revocation_shape_check
    check (
      (status = 'active' and revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
      or
      (
        status = 'revoked'
        and revoked_at is not null
        and revoked_by_user_id is not null
        and length(btrim(revocation_reason)) between 1 and 500
      )
    )
);

create unique index continuity_participants_one_active_user
  on public.continuity_participants (continuity_space_id, user_id)
  where status = 'active';

create index continuity_participants_user_status_idx
  on public.continuity_participants (user_id, status, continuity_space_id);
create index continuity_participants_space_idx
  on public.continuity_participants (continuity_space_id);
create unique index continuity_participants_space_invitation_idx
  on public.continuity_participants (accepted_from_invitation_id)
  where accepted_from_invitation_id is not null;
create index continuity_participants_revoked_by_idx
  on public.continuity_participants (revoked_by_user_id)
  where revoked_by_user_id is not null;

create table public.participant_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  continuity_space_id uuid not null references public.continuity_spaces(id),
  invited_email text not null,
  display_name text not null,
  relationship text not null,
  purpose text not null,
  category_scope text[] not null,
  invited_by_user_id uuid not null references auth.users(id),
  token_digest text not null unique,
  token_hint text not null,
  delivery_state text not null default 'not_sent',
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  accepted_by_user_id uuid references auth.users(id),
  accepted_participant_id uuid references public.continuity_participants(id),
  revoked_at timestamp with time zone,
  revoked_by_user_id uuid references auth.users(id),
  revocation_reason text,
  rotates_invitation_id uuid references public.participant_invitations(id),
  creation_request_id uuid not null,
  created_at timestamp with time zone not null default pg_catalog.clock_timestamp(),
  constraint participant_invitations_email_check
    check (
      invited_email = lower(btrim(invited_email))
      and position('@' in invited_email) > 1
      and length(invited_email) <= 254
    ),
  constraint participant_invitations_display_name_check
    check (length(btrim(display_name)) between 1 and 120),
  constraint participant_invitations_relationship_check
    check (length(btrim(relationship)) between 1 and 80),
  constraint participant_invitations_purpose_check
    check (length(btrim(purpose)) between 1 and 240),
  constraint participant_invitations_scope_check
    check (
      cardinality(category_scope) between 1 and 6
      and category_scope <@ array['updates', 'tasks', 'decisions', 'documents', 'service', 'proof']::text[]
    ),
  constraint participant_invitations_digest_check
    check (token_digest ~ '^[0-9a-f]{64}$'),
  constraint participant_invitations_hint_check
    check (token_hint ~ '^[0-9a-f]{8}$'),
  constraint participant_invitations_delivery_check
    check (delivery_state = 'not_sent'),
  constraint participant_invitations_expiry_check
    check (expires_at > created_at),
  constraint participant_invitations_terminal_state_check
    check (not (accepted_at is not null and revoked_at is not null)),
  constraint participant_invitations_acceptance_shape_check
    check (
      (accepted_at is null and accepted_by_user_id is null and accepted_participant_id is null)
      or
      (accepted_at is not null and accepted_by_user_id is not null and accepted_participant_id is not null)
    ),
  constraint participant_invitations_revocation_shape_check
    check (
      (revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
      or
      (
        revoked_at is not null
        and revoked_by_user_id is not null
        and length(btrim(revocation_reason)) between 1 and 500
      )
    ),
  constraint participant_invitations_space_request_unique
    unique (continuity_space_id, creation_request_id)
);

alter table public.continuity_participants
  add constraint continuity_participants_invitation_fkey
  foreign key (accepted_from_invitation_id)
  references public.participant_invitations(id);

create unique index participant_invitations_one_live_email
  on public.participant_invitations (continuity_space_id, invited_email)
  where accepted_at is null and revoked_at is null;

create index participant_invitations_space_state_idx
  on public.participant_invitations (continuity_space_id, created_at desc);

create index participant_invitations_expiry_idx
  on public.participant_invitations (expires_at)
  where accepted_at is null and revoked_at is null;
create index participant_invitations_invited_by_idx
  on public.participant_invitations (invited_by_user_id);
create index participant_invitations_accepted_by_idx
  on public.participant_invitations (accepted_by_user_id)
  where accepted_by_user_id is not null;
create index participant_invitations_accepted_participant_idx
  on public.participant_invitations (accepted_participant_id)
  where accepted_participant_id is not null;
create index participant_invitations_revoked_by_idx
  on public.participant_invitations (revoked_by_user_id)
  where revoked_by_user_id is not null;
create unique index participant_invitations_rotates_idx
  on public.participant_invitations (rotates_invitation_id)
  where rotates_invitation_id is not null;

alter table public.workflow_events
  add column if not exists continuity_space_id uuid,
  add column if not exists participant_invitation_id uuid,
  add column if not exists continuity_participant_id uuid;

alter table public.workflow_events
  add constraint workflow_events_continuity_space_id_fkey
    foreign key (continuity_space_id) references public.continuity_spaces(id),
  add constraint workflow_events_participant_invitation_id_fkey
    foreign key (participant_invitation_id) references public.participant_invitations(id),
  add constraint workflow_events_continuity_participant_id_fkey
    foreign key (continuity_participant_id) references public.continuity_participants(id);

create unique index workflow_events_continuity_idempotency_unique
  on public.workflow_events (continuity_space_id, idempotency_key)
  where continuity_space_id is not null and idempotency_key is not null;

create index workflow_events_continuity_occurred_idx
  on public.workflow_events (continuity_space_id, occurred_at desc)
  where continuity_space_id is not null;
create index workflow_events_participant_invitation_idx
  on public.workflow_events (participant_invitation_id, occurred_at desc)
  where participant_invitation_id is not null;
create index workflow_events_continuity_participant_idx
  on public.workflow_events (continuity_participant_id, occurred_at desc)
  where continuity_participant_id is not null;

create or replace function passage_private.can_view_continuity_space(p_continuity_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.continuity_spaces as s
    where s.id = p_continuity_space_id
      and s.status = 'active'
      and (
        s.owner_user_id = (select auth.uid())
        or exists (
          select 1
          from public.continuity_participants as p
          where p.continuity_space_id = s.id
            and p.user_id = (select auth.uid())
            and p.status = 'active'
        )
      )
  )
$function$;

create or replace function passage_private.can_manage_continuity_space(p_continuity_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.continuity_spaces as s
    where s.id = p_continuity_space_id
      and s.status = 'active'
      and s.owner_user_id = (select auth.uid())
  )
$function$;

create or replace function passage_private.append_continuity_event(
  p_continuity_space_id uuid,
  p_participant_invitation_id uuid,
  p_continuity_participant_id uuid,
  p_actor_user_id uuid,
  p_idempotency_key text,
  p_event_name text,
  p_previous_state text,
  p_next_state text,
  p_metadata jsonb
)
returns table (
  event_id uuid,
  occurred_at timestamp with time zone,
  inserted boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_event public.workflow_events%rowtype;
  v_occurred_at timestamp with time zone := pg_catalog.clock_timestamp();
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb)
    || pg_catalog.jsonb_build_object(
      'event_kind', p_event_name,
      'proof_destination', 'family_access_history'
    );
begin
  if p_continuity_space_id is null
     or p_actor_user_id is null
     or p_actor_user_id is distinct from (select auth.uid())
     or nullif(btrim(p_idempotency_key), '') is null
     or nullif(btrim(p_event_name), '') is null
     or not (
       passage_private.can_view_continuity_space(p_continuity_space_id)
       or (
         p_participant_invitation_id is not null
         and exists (
           select 1
           from public.participant_invitations as invited
           where invited.id = p_participant_invitation_id
             and invited.continuity_space_id = p_continuity_space_id
             and invited.invited_email = passage_private.current_verified_email()
             and invited.accepted_at is null
         )
       )
     ) then
    raise exception 'Continuity event authority and idempotency are required'
      using errcode = '42501';
  end if;
  if p_participant_invitation_id is not null and not exists (
    select 1
    from public.participant_invitations as i
    where i.id = p_participant_invitation_id
      and i.continuity_space_id = p_continuity_space_id
  ) then
    raise exception 'Invitation proof does not belong to this family space'
      using errcode = '23514';
  end if;
  if p_continuity_participant_id is not null and not exists (
    select 1
    from public.continuity_participants as p
    where p.id = p_continuity_participant_id
      and p.continuity_space_id = p_continuity_space_id
  ) then
    raise exception 'Participant proof does not belong to this family space'
      using errcode = '23514';
  end if;
  if p_participant_invitation_id is not null
     and p_continuity_participant_id is not null
     and not exists (
       select 1
       from public.continuity_participants as p
       where p.id = p_continuity_participant_id
         and p.accepted_from_invitation_id = p_participant_invitation_id
     ) then
    raise exception 'Participant proof does not match its accepted invitation'
      using errcode = '23514';
  end if;

  insert into public.workflow_events (
    workflow_id, event_type, name, actor_user_id, idempotency_key,
    audience, previous_state, next_state, occurred_at, metadata,
    continuity_space_id, participant_invitation_id, continuity_participant_id
  ) values (
    null, 'other', p_event_name, p_actor_user_id, p_idempotency_key,
    'family_space', p_previous_state, p_next_state, v_occurred_at, v_metadata,
    p_continuity_space_id, p_participant_invitation_id, p_continuity_participant_id
  )
  on conflict (continuity_space_id, idempotency_key)
    where continuity_space_id is not null and idempotency_key is not null
  do nothing
  returning * into v_event;

  if v_event.id is null then
    select e.* into strict v_event
    from public.workflow_events as e
    where e.continuity_space_id = p_continuity_space_id
      and e.idempotency_key = p_idempotency_key;
    if v_event.actor_user_id is distinct from p_actor_user_id
       or v_event.participant_invitation_id is distinct from p_participant_invitation_id
       or v_event.continuity_participant_id is distinct from p_continuity_participant_id
       or v_event.name is distinct from p_event_name
       or v_event.previous_state is distinct from p_previous_state
       or v_event.next_state is distinct from p_next_state
       or v_event.metadata is distinct from v_metadata then
      raise exception 'Continuity request conflicts with an earlier command'
        using errcode = '22023';
    end if;
    return query select v_event.id, v_event.occurred_at, false;
    return;
  end if;

  return query select v_event.id, v_event.occurred_at, true;
end
$function$;

create or replace function passage_private.create_family_space_idempotent(
  p_display_name text,
  p_request_id uuid
)
returns table (
  continuity_space_id uuid,
  space_name text,
  created_at timestamp with time zone,
  event_id uuid,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_space public.continuity_spaces%rowtype;
  v_event record;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if passage_private.current_verified_email() is null then
    raise exception 'A verified email address is required'
      using errcode = '42501';
  end if;
  if p_request_id is null or length(btrim(coalesce(p_display_name, ''))) not between 1 and 120 then
    raise exception 'A family name and request identity are required' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('continuity-space:' || v_actor::text, 0)
  );
  select s.* into v_space
  from public.continuity_spaces as s
  where s.owner_user_id = v_actor and s.status = 'active'
  order by s.created_at, s.id
  limit 1;

  if v_space.id is null then
    insert into public.continuity_spaces (
      owner_user_id, display_name, creation_request_id
    ) values (
      v_actor, btrim(p_display_name), p_request_id
    ) returning * into v_space;
  elsif v_space.creation_request_id is distinct from p_request_id
     and v_space.display_name is distinct from btrim(p_display_name) then
    raise exception 'An active family space already exists' using errcode = '23505';
  end if;

  select * into strict v_event
  from passage_private.append_continuity_event(
    v_space.id, null, null, v_actor,
    'continuity_space:' || v_space.id::text || ':created',
    'continuity_space.created', null, 'active',
    pg_catalog.jsonb_build_object('next_owner', 'family_coordinator')
  );
  return query select v_space.id, v_space.display_name, v_space.created_at,
    v_event.event_id, not v_event.inserted;
end
$function$;

create or replace function passage_private.create_participant_invitation_idempotent(
  p_continuity_space_id uuid,
  p_invited_email text,
  p_display_name text,
  p_relationship text,
  p_purpose text,
  p_category_scope text[],
  p_expires_at timestamp with time zone,
  p_request_id uuid,
  p_rotates_invitation_id uuid default null
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  invitation_expires_at timestamp with time zone,
  invitation_created_at timestamp with time zone,
  invitation_state text,
  delivery_state text,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_email text := lower(btrim(coalesce(p_invited_email, '')));
  v_scope text[];
  v_token text;
  v_invitation public.participant_invitations%rowtype;
  v_event record;
begin
  select coalesce(array_agg(distinct scope_name order by scope_name), '{}'::text[])
  into v_scope
  from unnest(coalesce(p_category_scope, '{}'::text[])) as scoped(scope_name);

  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not passage_private.can_manage_continuity_space(p_continuity_space_id) then
    raise exception 'Family coordinator authority is required' using errcode = '42501';
  end if;
  if v_email = passage_private.current_verified_email() then
    raise exception 'The family coordinator already has access'
      using errcode = '22023';
  end if;
  if p_request_id is null
     or position('@' in v_email) <= 1
     or length(v_email) > 254
     or length(btrim(coalesce(p_display_name, ''))) not between 1 and 120
     or length(btrim(coalesce(p_relationship, ''))) not between 1 and 80
     or length(btrim(coalesce(p_purpose, ''))) not between 1 and 240
     or cardinality(v_scope) not between 1 and 6
     or not v_scope <@ array['updates', 'tasks', 'decisions', 'documents', 'service', 'proof']::text[] then
    raise exception 'Review the participant, purpose, scope, and expiry' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_continuity_space_id::text || ':participant-invite:' || p_request_id::text, 0
    )
  );
  select i.* into v_invitation
  from public.participant_invitations as i
  where i.continuity_space_id = p_continuity_space_id
    and i.creation_request_id = p_request_id;

  if v_invitation.id is not null then
    if v_invitation.invited_email is distinct from v_email
       or v_invitation.display_name is distinct from btrim(p_display_name)
       or v_invitation.relationship is distinct from btrim(p_relationship)
       or v_invitation.purpose is distinct from btrim(p_purpose)
       or v_invitation.category_scope is distinct from v_scope
       or v_invitation.expires_at is distinct from p_expires_at
       or v_invitation.rotates_invitation_id is distinct from p_rotates_invitation_id then
      raise exception 'Invitation request conflicts with an earlier command'
        using errcode = '22023';
    end if;
    return query select v_invitation.id, null::text, v_invitation.token_hint,
      v_invitation.expires_at, v_invitation.created_at,
      case
        when v_invitation.accepted_at is not null then 'accepted'
        when v_invitation.revoked_at is not null then 'revoked'
        when v_invitation.expires_at <= pg_catalog.clock_timestamp() then 'expired'
        else 'available'
      end,
      v_invitation.delivery_state, true;
    return;
  end if;

  if p_expires_at is null
     or p_expires_at <= pg_catalog.clock_timestamp() + interval '15 minutes'
     or p_expires_at > pg_catalog.clock_timestamp() + interval '30 days' then
    raise exception 'Review the participant, purpose, scope, and expiry'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.participant_invitations as i
    where i.continuity_space_id = p_continuity_space_id
      and i.invited_email = v_email
      and i.accepted_at is null
      and i.revoked_at is null
  ) then
    raise exception 'A live invitation already exists for this person'
      using errcode = '23505';
  end if;
  if exists (
    select 1
    from public.continuity_participants as p
    where p.continuity_space_id = p_continuity_space_id
      and p.invited_email = v_email
      and p.status = 'active'
  ) then
    raise exception 'This person already has active family access'
      using errcode = '23505';
  end if;

  v_token := translate(
    pg_catalog.encode(extensions.gen_random_bytes(32), 'base64'),
    '+/=', '-_'
  );
  insert into public.participant_invitations (
    continuity_space_id, invited_email, display_name, relationship,
    purpose, category_scope, invited_by_user_id, token_digest, token_hint,
    delivery_state, expires_at, rotates_invitation_id, creation_request_id
  ) values (
    p_continuity_space_id, v_email, btrim(p_display_name), btrim(p_relationship),
    btrim(p_purpose), v_scope, v_actor,
    passage_private.hash_invitation_token(v_token),
    right(passage_private.hash_invitation_token(v_token), 8),
    'not_sent', p_expires_at, p_rotates_invitation_id, p_request_id
  ) returning * into v_invitation;

  select * into strict v_event
  from passage_private.append_continuity_event(
    p_continuity_space_id, v_invitation.id, null, v_actor,
    'participant_invitation:' || v_invitation.id::text || ':created',
    'participant_invitation.created', null, 'available',
    pg_catalog.jsonb_build_object(
      'relationship', v_invitation.relationship,
      'category_scope', to_jsonb(v_scope),
      'purpose', v_invitation.purpose,
      'delivery_state', 'not_sent',
      'next_owner', 'invited_participant'
    )
  );
  return query select v_invitation.id, v_token, v_invitation.token_hint,
    v_invitation.expires_at, v_invitation.created_at, 'available'::text,
    v_invitation.delivery_state, false;
end
$function$;

create or replace function passage_private.create_participant_invitation_public(
  p_continuity_space_id uuid,
  p_invited_email text,
  p_display_name text,
  p_relationship text,
  p_purpose text,
  p_category_scope text[],
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
  delivery_state text,
  replayed boolean
)
language sql
volatile
security definer
set search_path = ''
as $function$
  select *
  from passage_private.create_participant_invitation_idempotent(
    p_continuity_space_id, p_invited_email, p_display_name, p_relationship,
    p_purpose, p_category_scope, p_expires_at, p_request_id, null
  )
$function$;

create or replace function passage_private.inspect_passage_invitation(p_raw_token text)
returns table (
  invitation_type text,
  inviter_display_name text,
  space_name text,
  invitation_role text,
  scope_labels text[],
  invitation_purpose text,
  invitation_expires_at timestamp with time zone,
  invitation_state text,
  delivery_state text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_invitation public.participant_invitations%rowtype;
  v_space public.continuity_spaces%rowtype;
  v_inviter_name text;
  v_participant_status text;
  v_staff record;
begin
  if p_raw_token is null or length(p_raw_token) not between 32 and 256 then
    return;
  end if;
  select i.* into v_invitation
  from public.participant_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token);

  if v_invitation.id is not null then
    select s.* into strict v_space
    from public.continuity_spaces as s
    where s.id = v_invitation.continuity_space_id;
    select coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), 'A family coordinator')
    into v_inviter_name
    from auth.users as u
    where u.id = v_invitation.invited_by_user_id;
    if v_invitation.accepted_participant_id is not null then
      select p.status into v_participant_status
      from public.continuity_participants as p
      where p.id = v_invitation.accepted_participant_id;
    end if;
    return query select
      'participant'::text,
      coalesce(v_inviter_name, 'A family coordinator'),
      v_space.display_name,
      v_invitation.relationship,
      v_invitation.category_scope,
      v_invitation.purpose,
      v_invitation.expires_at,
      case
        when v_space.status <> 'active' then 'access_ended'
        when v_invitation.accepted_at is not null and v_participant_status = 'revoked' then 'access_ended'
        when v_invitation.accepted_at is not null then 'accepted'
        when v_invitation.revoked_at is not null then 'revoked'
        when v_invitation.expires_at <= pg_catalog.clock_timestamp() then 'expired'
        else 'available'
      end,
      v_invitation.delivery_state;
    return;
  end if;

  select * into v_staff
  from passage_private.inspect_organization_invitation(p_raw_token);
  if found then
    return query select
      'staff'::text,
      v_staff.inviter_display_name::text,
      v_staff.organization_name::text,
      v_staff.invitation_role::text,
      v_staff.location_names::text[],
      v_staff.invitation_purpose::text,
      v_staff.invitation_expires_at::timestamp with time zone,
      v_staff.invitation_state::text,
      'not_sent'::text;
  end if;
end
$function$;

create or replace function passage_private.accept_participant_invitation(p_raw_token text)
returns table (
  participant_id uuid,
  continuity_space_id uuid,
  space_name text,
  relationship text,
  category_scope text[],
  accepted_at timestamp with time zone,
  event_id uuid,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_verified_email text;
  v_invitation public.participant_invitations%rowtype;
  v_participant public.continuity_participants%rowtype;
  v_space public.continuity_spaces%rowtype;
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
  from public.participant_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  for update;
  if v_invitation.id is null then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  select s.* into strict v_space
  from public.continuity_spaces as s where s.id = v_invitation.continuity_space_id;
  if v_space.status <> 'active' then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by_user_id is distinct from v_actor then
      raise exception 'Invitation was accepted by another account' using errcode = '42501';
    end if;
    select p.* into strict v_participant
    from public.continuity_participants as p where p.id = v_invitation.accepted_participant_id;
    if v_participant.status <> 'active' then
      raise exception 'Participant access has ended' using errcode = '42501';
    end if;
    select e.id, e.occurred_at into v_event
    from public.workflow_events as e
    where e.continuity_space_id = v_invitation.continuity_space_id
      and e.idempotency_key = 'participant_invitation:' || v_invitation.id::text || ':accepted';
    return query select v_participant.id, v_space.id, v_space.display_name,
      v_participant.relationship, v_participant.category_scope,
      v_participant.accepted_at, v_event.id, true;
    return;
  end if;

  if v_invitation.revoked_at is not null
     or v_invitation.expires_at <= pg_catalog.clock_timestamp() then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  if v_verified_email is distinct from v_invitation.invited_email then
    raise exception 'Sign in with the verified email address that received this invitation'
      using errcode = '42501';
  end if;
  if exists (
    select 1 from public.continuity_participants as p
    where p.continuity_space_id = v_invitation.continuity_space_id
      and p.user_id = v_actor
      and p.status = 'active'
  ) then
    raise exception 'This account already has active family access'
      using errcode = '23505';
  end if;

  insert into public.continuity_participants (
    continuity_space_id, user_id, invited_email, display_name, relationship,
    purpose, category_scope, accepted_from_invitation_id, accepted_at
  ) values (
    v_invitation.continuity_space_id, v_actor, v_invitation.invited_email,
    v_invitation.display_name, v_invitation.relationship, v_invitation.purpose,
    v_invitation.category_scope, v_invitation.id, pg_catalog.clock_timestamp()
  ) returning * into v_participant;

  update public.participant_invitations as i
  set accepted_at = v_participant.accepted_at,
      accepted_by_user_id = v_actor,
      accepted_participant_id = v_participant.id
  where i.id = v_invitation.id;

  select * into strict v_event
  from passage_private.append_continuity_event(
    v_invitation.continuity_space_id, v_invitation.id, v_participant.id, v_actor,
    'participant_invitation:' || v_invitation.id::text || ':accepted',
    'participant_invitation.accepted', 'available', 'accepted',
    pg_catalog.jsonb_build_object(
      'relationship', v_participant.relationship,
      'category_scope', to_jsonb(v_participant.category_scope),
      'purpose', v_participant.purpose,
      'next_owner', 'invited_participant'
    )
  );
  return query select v_participant.id, v_space.id, v_space.display_name,
    v_participant.relationship, v_participant.category_scope,
    v_participant.accepted_at, v_event.event_id, false;
end
$function$;

create or replace function passage_private.decline_participant_invitation(
  p_raw_token text,
  p_reason text
)
returns table (
  invitation_id uuid,
  declined_at timestamp with time zone,
  event_id uuid,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_verified_email text;
  v_invitation public.participant_invitations%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_event record;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_raw_token is null or length(p_raw_token) not between 32 and 256 then
    raise exception 'Invitation is unavailable' using errcode = '22023';
  end if;
  v_verified_email := passage_private.current_verified_email();
  select i.* into v_invitation
  from public.participant_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  for update;
  if v_invitation.id is null
     or v_invitation.invited_email is distinct from v_verified_email then
    raise exception 'Invitation is unavailable' using errcode = '42501';
  end if;
  if v_invitation.accepted_at is not null then
    raise exception 'An accepted invitation cannot be declined'
      using errcode = '55000';
  end if;
  if v_invitation.expires_at <= pg_catalog.clock_timestamp()
     and v_invitation.revoked_at is null then
    raise exception 'Invitation is unavailable' using errcode = '22023';
  end if;
  if v_reason is null or length(v_reason) > 500 then
    raise exception 'A short decline reason is required' using errcode = '22023';
  end if;
  if v_invitation.revoked_at is null then
    update public.participant_invitations as i
    set revoked_at = pg_catalog.clock_timestamp(),
        revoked_by_user_id = v_actor,
        revocation_reason = v_reason
    where i.id = v_invitation.id
    returning * into v_invitation;
  elsif v_invitation.revoked_by_user_id is distinct from v_actor
     or v_invitation.revocation_reason is distinct from v_reason then
    raise exception 'Invitation decline conflicts with earlier history'
      using errcode = '22023';
  end if;
  select * into strict v_event
  from passage_private.append_continuity_event(
    v_invitation.continuity_space_id, v_invitation.id, null, v_actor,
    'participant_invitation:' || v_invitation.id::text || ':declined',
    'participant_invitation.declined', 'available', 'revoked',
    pg_catalog.jsonb_build_object(
      'next_owner', 'family_coordinator',
      'outcome_note', v_reason
    )
  );
  return query select v_invitation.id, v_invitation.revoked_at,
    v_event.event_id, not v_event.inserted;
end
$function$;

create or replace function passage_private.revoke_participant_invitation(
  p_invitation_id uuid,
  p_reason text
)
returns table (
  invitation_id uuid,
  revoked_at timestamp with time zone,
  event_id uuid,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_invitation public.participant_invitations%rowtype;
  v_event record;
begin
  select i.* into v_invitation
  from public.participant_invitations as i
  where i.id = p_invitation_id for update;
  if v_actor is null or v_invitation.id is null
     or not passage_private.can_manage_continuity_space(v_invitation.continuity_space_id) then
    raise exception 'Invitation is unavailable' using errcode = '42501';
  end if;
  if v_invitation.accepted_at is not null then
    raise exception 'End participant access instead of revoking an accepted invitation'
      using errcode = '55000';
  end if;
  if v_invitation.revoked_at is null then
    if length(btrim(coalesce(p_reason, ''))) not between 1 and 500 then
      raise exception 'A revocation reason is required' using errcode = '22023';
    end if;
    update public.participant_invitations as i
    set revoked_at = pg_catalog.clock_timestamp(),
        revoked_by_user_id = v_actor,
        revocation_reason = btrim(p_reason)
    where i.id = v_invitation.id
    returning * into v_invitation;
  elsif v_invitation.revocation_reason is distinct from btrim(p_reason) then
    raise exception 'Invitation revocation conflicts with earlier history'
      using errcode = '22023';
  end if;
  select * into strict v_event
  from passage_private.append_continuity_event(
    v_invitation.continuity_space_id, v_invitation.id, null, v_actor,
    'participant_invitation:' || v_invitation.id::text || ':revoked',
    'participant_invitation.revoked', 'available', 'revoked',
    pg_catalog.jsonb_build_object(
      'next_owner', 'family_coordinator',
      'outcome_note', v_invitation.revocation_reason
    )
  );
  return query select v_invitation.id, v_invitation.revoked_at,
    v_event.event_id, not v_event.inserted;
end
$function$;

create or replace function passage_private.rotate_participant_invitation_idempotent(
  p_invitation_id uuid,
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
  delivery_state text,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_old public.participant_invitations%rowtype;
  v_existing public.participant_invitations%rowtype;
  v_event record;
begin
  if v_actor is null or p_request_id is null then
    raise exception 'Authentication and request identity are required'
      using errcode = '28000';
  end if;
  select i.* into v_old
  from public.participant_invitations as i
  where i.id = p_invitation_id
  for update;
  if v_old.id is null
     or not passage_private.can_manage_continuity_space(v_old.continuity_space_id) then
    raise exception 'Invitation is unavailable' using errcode = '42501';
  end if;

  select i.* into v_existing
  from public.participant_invitations as i
  where i.continuity_space_id = v_old.continuity_space_id
    and i.creation_request_id = p_request_id;
  if v_existing.id is not null then
    if v_existing.rotates_invitation_id is distinct from v_old.id
       or v_existing.expires_at is distinct from p_expires_at then
      raise exception 'Rotation request conflicts with earlier history'
        using errcode = '22023';
    end if;
    return query select v_existing.id, null::text, v_existing.token_hint,
      v_existing.expires_at, v_existing.created_at,
      case
        when v_existing.accepted_at is not null then 'accepted'
        when v_existing.revoked_at is not null then 'revoked'
        when v_existing.expires_at <= pg_catalog.clock_timestamp() then 'expired'
        else 'available'
      end,
      v_existing.delivery_state, true;
    return;
  end if;

  if v_old.accepted_at is not null then
    raise exception 'An accepted invitation cannot be rotated'
      using errcode = '55000';
  end if;
  if v_old.revoked_at is not null
     and v_old.revocation_reason is distinct from 'Replaced with a new secure link' then
    raise exception 'This invitation is no longer available to rotate'
      using errcode = '55000';
  end if;
  if v_old.revoked_at is null then
    update public.participant_invitations as i
    set revoked_at = pg_catalog.clock_timestamp(),
        revoked_by_user_id = v_actor,
        revocation_reason = 'Replaced with a new secure link'
    where i.id = v_old.id
    returning * into v_old;
  end if;
  select * into strict v_event
  from passage_private.append_continuity_event(
    v_old.continuity_space_id, v_old.id, null, v_actor,
    'participant_invitation:' || v_old.id::text || ':rotated',
    'participant_invitation.rotated', 'available', 'revoked',
    pg_catalog.jsonb_build_object(
      'next_owner', 'family_coordinator',
      'outcome_note', v_old.revocation_reason
    )
  );

  return query
  select *
  from passage_private.create_participant_invitation_idempotent(
    v_old.continuity_space_id,
    v_old.invited_email,
    v_old.display_name,
    v_old.relationship,
    v_old.purpose,
    v_old.category_scope,
    p_expires_at,
    p_request_id,
    v_old.id
  );
end
$function$;

create or replace function passage_private.revoke_continuity_participant_idempotent(
  p_participant_id uuid,
  p_reason text,
  p_request_id uuid
)
returns table (
  participant_id uuid,
  revoked_at timestamp with time zone,
  event_id uuid,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_participant public.continuity_participants%rowtype;
  v_event record;
  v_key text;
begin
  select p.* into v_participant
  from public.continuity_participants as p
  where p.id = p_participant_id for update;
  if v_actor is null or v_participant.id is null or p_request_id is null
     or not passage_private.can_manage_continuity_space(v_participant.continuity_space_id) then
    raise exception 'Participant access is unavailable' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_reason, ''))) not between 1 and 500 then
    raise exception 'A revocation reason is required' using errcode = '22023';
  end if;
  v_key := 'continuity_participant:' || v_participant.id::text || ':revoked';

  if v_participant.status = 'active' then
    update public.continuity_participants as p
    set status = 'revoked',
        revoked_at = pg_catalog.clock_timestamp(),
        revoked_by_user_id = v_actor,
        revocation_reason = btrim(p_reason)
    where p.id = v_participant.id
    returning * into v_participant;
  elsif v_participant.revocation_reason is distinct from btrim(p_reason) then
    raise exception 'Participant revocation conflicts with earlier history'
      using errcode = '22023';
  end if;

  select * into strict v_event
  from passage_private.append_continuity_event(
    v_participant.continuity_space_id,
    v_participant.accepted_from_invitation_id,
    v_participant.id,
    v_actor,
    v_key,
    'continuity_participant.revoked',
    'active',
    'revoked',
    pg_catalog.jsonb_build_object(
      'next_owner', 'family_coordinator',
      'outcome_note', v_participant.revocation_reason
    )
  );
  return query select v_participant.id, v_participant.revoked_at,
    v_event.event_id, not v_event.inserted;
end
$function$;

create or replace function public.inspect_passage_invitation(p_raw_token text)
returns table (
  invitation_type text,
  inviter_display_name text,
  space_name text,
  invitation_role text,
  scope_labels text[],
  invitation_purpose text,
  invitation_expires_at timestamp with time zone,
  invitation_state text,
  delivery_state text
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from passage_private.inspect_passage_invitation(p_raw_token)
$function$;

create or replace function public.create_family_space_idempotent(
  p_display_name text,
  p_request_id uuid
)
returns table (
  continuity_space_id uuid, space_name text,
  created_at timestamp with time zone, event_id uuid, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.create_family_space_idempotent(p_display_name, p_request_id)
$function$;

create or replace function public.create_participant_invitation_idempotent(
  p_continuity_space_id uuid, p_invited_email text, p_display_name text,
  p_relationship text, p_purpose text, p_category_scope text[],
  p_expires_at timestamp with time zone, p_request_id uuid
)
returns table (
  invitation_id uuid, raw_token text, token_hint text,
  invitation_expires_at timestamp with time zone,
  invitation_created_at timestamp with time zone,
  invitation_state text, delivery_state text, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.create_participant_invitation_public(
    p_continuity_space_id, p_invited_email, p_display_name, p_relationship,
    p_purpose, p_category_scope, p_expires_at, p_request_id
  )
$function$;

create or replace function public.accept_participant_invitation(p_raw_token text)
returns table (
  participant_id uuid, continuity_space_id uuid, space_name text,
  relationship text, category_scope text[],
  accepted_at timestamp with time zone, event_id uuid, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.accept_participant_invitation(p_raw_token)
$function$;

create or replace function public.decline_participant_invitation(
  p_raw_token text, p_reason text
)
returns table (
  invitation_id uuid, declined_at timestamp with time zone,
  event_id uuid, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.decline_participant_invitation(p_raw_token, p_reason)
$function$;

create or replace function public.revoke_participant_invitation(
  p_invitation_id uuid, p_reason text
)
returns table (
  invitation_id uuid, revoked_at timestamp with time zone,
  event_id uuid, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.revoke_participant_invitation(p_invitation_id, p_reason)
$function$;

create or replace function public.rotate_participant_invitation_idempotent(
  p_invitation_id uuid, p_expires_at timestamp with time zone, p_request_id uuid
)
returns table (
  invitation_id uuid, raw_token text, token_hint text,
  invitation_expires_at timestamp with time zone,
  invitation_created_at timestamp with time zone,
  invitation_state text, delivery_state text, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.rotate_participant_invitation_idempotent(
    p_invitation_id, p_expires_at, p_request_id
  )
$function$;

create or replace function public.revoke_continuity_participant_idempotent(
  p_participant_id uuid, p_reason text, p_request_id uuid
)
returns table (
  participant_id uuid, revoked_at timestamp with time zone,
  event_id uuid, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.revoke_continuity_participant_idempotent(
    p_participant_id, p_reason, p_request_id
  )
$function$;

alter table public.continuity_spaces enable row level security;
alter table public.continuity_participants enable row level security;
alter table public.participant_invitations enable row level security;

create policy participant_spaces_authorized_select
  on public.continuity_spaces for select to authenticated
  using (passage_private.can_view_continuity_space(id));

create policy participant_members_authorized_select
  on public.continuity_participants for select to authenticated
  using (
    (user_id = (select auth.uid()) and status = 'active')
    or passage_private.can_manage_continuity_space(continuity_space_id)
  );

create policy participant_invitations_coordinator_select
  on public.participant_invitations for select to authenticated
  using (passage_private.can_manage_continuity_space(continuity_space_id));

create policy participant_events_authorized_select
  on public.workflow_events for select to authenticated
  using (
    continuity_space_id is not null
    and passage_private.can_manage_continuity_space(continuity_space_id)
  );

create or replace function passage_private.list_owned_continuity_spaces()
returns table (
  id uuid, display_name text, created_at timestamp with time zone
)
language sql stable security definer set search_path = ''
as $function$
  select s.id, s.display_name, s.created_at
  from public.continuity_spaces as s
  where (select auth.uid()) is not null
    and s.owner_user_id = (select auth.uid())
    and s.status = 'active'
  order by s.created_at, s.id
$function$;

create or replace function passage_private.list_participant_continuity_spaces()
returns table (
  id uuid, display_name text, created_at timestamp with time zone
)
language sql stable security definer set search_path = ''
as $function$
  select s.id, s.display_name, s.created_at
  from public.continuity_spaces as s
  join public.continuity_participants as p
    on p.continuity_space_id = s.id
   and p.user_id = (select auth.uid())
   and p.status = 'active'
  where (select auth.uid()) is not null
    and s.status = 'active'
  order by s.created_at, s.id
$function$;

create or replace function passage_private.list_continuity_participant_projection()
returns table (
  id uuid, continuity_space_id uuid, display_name text, relationship text,
  purpose text, category_scope text[], status text,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone
)
language sql stable security definer set search_path = ''
as $function$
  select
    p.id, p.continuity_space_id, p.display_name, p.relationship,
    p.purpose, p.category_scope, p.status, p.accepted_at, p.revoked_at
  from public.continuity_participants as p
  where (select auth.uid()) is not null
    and p.user_id = (select auth.uid())
    and p.status = 'active'
  order by p.accepted_at, p.id
$function$;

create or replace function passage_private.list_owned_continuity_participant_projection()
returns table (
  id uuid, continuity_space_id uuid, display_name text, relationship text,
  purpose text, category_scope text[], status text,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone,
  outcome_note text
)
language sql stable security definer set search_path = ''
as $function$
  select
    p.id, p.continuity_space_id, p.display_name, p.relationship,
    p.purpose, p.category_scope, p.status, p.accepted_at, p.revoked_at,
    p.revocation_reason
  from public.continuity_participants as p
  where (select auth.uid()) is not null
    and passage_private.can_manage_continuity_space(p.continuity_space_id)
  order by p.accepted_at, p.id
$function$;

create or replace function passage_private.list_participant_invitation_projection()
returns table (
  id uuid, continuity_space_id uuid, invited_email text, display_name text,
  relationship text, purpose text, category_scope text[], token_hint text,
  delivery_state text, expires_at timestamp with time zone,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone,
  created_at timestamp with time zone, lifecycle_state text,
  outcome_note text
)
language sql stable security definer set search_path = ''
as $function$
  select
    i.id, i.continuity_space_id, i.invited_email, i.display_name,
    i.relationship, i.purpose, i.category_scope, i.token_hint,
    i.delivery_state, i.expires_at, i.accepted_at, i.revoked_at, i.created_at,
    case
      when i.accepted_at is not null then 'accepted'
      when i.revoked_at is not null and exists (
        select 1
        from public.workflow_events as e
        where e.participant_invitation_id = i.id
          and e.name = 'participant_invitation.declined'
      ) then 'declined'
      when i.revoked_at is not null then 'revoked'
      when i.expires_at <= pg_catalog.clock_timestamp() then 'expired'
      else 'available'
    end,
    i.revocation_reason
  from public.participant_invitations as i
  where (select auth.uid()) is not null
    and passage_private.can_manage_continuity_space(i.continuity_space_id)
  order by i.created_at desc, i.id
$function$;

create or replace function public.list_owned_continuity_spaces()
returns table (
  id uuid, display_name text, created_at timestamp with time zone
)
language sql stable security definer set search_path = ''
as $function$
  select * from passage_private.list_owned_continuity_spaces()
$function$;

create or replace function public.list_participant_continuity_spaces()
returns table (
  id uuid, display_name text, created_at timestamp with time zone
)
language sql stable security definer set search_path = ''
as $function$
  select * from passage_private.list_participant_continuity_spaces()
$function$;

create or replace function public.list_continuity_participant_projection()
returns table (
  id uuid, continuity_space_id uuid, display_name text, relationship text,
  purpose text, category_scope text[], status text,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone
)
language sql stable security definer set search_path = ''
as $function$
  select * from passage_private.list_continuity_participant_projection()
$function$;

create or replace function public.list_owned_continuity_participant_projection()
returns table (
  id uuid, continuity_space_id uuid, display_name text, relationship text,
  purpose text, category_scope text[], status text,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone,
  outcome_note text
)
language sql stable security definer set search_path = ''
as $function$
  select * from passage_private.list_owned_continuity_participant_projection()
$function$;

create or replace function public.list_participant_invitation_projection()
returns table (
  id uuid, continuity_space_id uuid, invited_email text, display_name text,
  relationship text, purpose text, category_scope text[], token_hint text,
  delivery_state text, expires_at timestamp with time zone,
  accepted_at timestamp with time zone, revoked_at timestamp with time zone,
  created_at timestamp with time zone, lifecycle_state text,
  outcome_note text
)
language sql stable security definer set search_path = ''
as $function$
  select * from passage_private.list_participant_invitation_projection()
$function$;

revoke all on table public.continuity_spaces from public, anon, authenticated;
revoke all on table public.continuity_participants from public, anon, authenticated;
revoke all on table public.participant_invitations from public, anon, authenticated;

revoke all on function passage_private.can_view_continuity_space(uuid) from public, anon, authenticated;
revoke all on function passage_private.can_manage_continuity_space(uuid) from public, anon, authenticated;
revoke all on function passage_private.append_continuity_event(uuid,uuid,uuid,uuid,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function passage_private.create_family_space_idempotent(text,uuid) from public, anon, authenticated;
revoke all on function passage_private.create_participant_invitation_idempotent(uuid,text,text,text,text,text[],timestamp with time zone,uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function passage_private.create_participant_invitation_public(uuid,text,text,text,text,text[],timestamp with time zone,uuid) from public, anon, authenticated, service_role;
revoke all on function passage_private.inspect_passage_invitation(text) from public, anon, authenticated;
revoke all on function passage_private.accept_participant_invitation(text) from public, anon, authenticated;
revoke all on function passage_private.decline_participant_invitation(text,text) from public, anon, authenticated;
revoke all on function passage_private.revoke_participant_invitation(uuid,text) from public, anon, authenticated;
revoke all on function passage_private.rotate_participant_invitation_idempotent(uuid,timestamp with time zone,uuid) from public, anon, authenticated;
revoke all on function passage_private.revoke_continuity_participant_idempotent(uuid,text,uuid) from public, anon, authenticated;
revoke all on function passage_private.list_owned_continuity_spaces() from public, anon, authenticated;
revoke all on function passage_private.list_participant_continuity_spaces() from public, anon, authenticated;
revoke all on function passage_private.list_continuity_participant_projection() from public, anon, authenticated;
revoke all on function passage_private.list_owned_continuity_participant_projection() from public, anon, authenticated;
revoke all on function passage_private.list_participant_invitation_projection() from public, anon, authenticated;

grant execute on function passage_private.create_family_space_idempotent(text,uuid) to authenticated;
grant execute on function passage_private.create_participant_invitation_public(uuid,text,text,text,text,text[],timestamp with time zone,uuid) to authenticated;
grant execute on function passage_private.inspect_passage_invitation(text) to anon, authenticated;
grant execute on function passage_private.accept_participant_invitation(text) to authenticated;
grant execute on function passage_private.decline_participant_invitation(text,text) to authenticated;
grant execute on function passage_private.revoke_participant_invitation(uuid,text) to authenticated;
grant execute on function passage_private.rotate_participant_invitation_idempotent(uuid,timestamp with time zone,uuid) to authenticated;
grant execute on function passage_private.revoke_continuity_participant_idempotent(uuid,text,uuid) to authenticated;
grant execute on function passage_private.can_view_continuity_space(uuid) to authenticated;
grant execute on function passage_private.can_manage_continuity_space(uuid) to authenticated;

revoke all on function public.inspect_passage_invitation(text) from public, anon, authenticated, service_role;
revoke all on function public.create_family_space_idempotent(text,uuid) from public, anon, authenticated, service_role;
revoke all on function public.create_participant_invitation_idempotent(uuid,text,text,text,text,text[],timestamp with time zone,uuid) from public, anon, authenticated, service_role;
revoke all on function public.accept_participant_invitation(text) from public, anon, authenticated, service_role;
revoke all on function public.decline_participant_invitation(text,text) from public, anon, authenticated, service_role;
revoke all on function public.revoke_participant_invitation(uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.rotate_participant_invitation_idempotent(uuid,timestamp with time zone,uuid) from public, anon, authenticated, service_role;
revoke all on function public.revoke_continuity_participant_idempotent(uuid,text,uuid) from public, anon, authenticated, service_role;
revoke all on function public.list_owned_continuity_spaces() from public, anon, authenticated, service_role;
revoke all on function public.list_participant_continuity_spaces() from public, anon, authenticated, service_role;
revoke all on function public.list_continuity_participant_projection() from public, anon, authenticated, service_role;
revoke all on function public.list_owned_continuity_participant_projection() from public, anon, authenticated, service_role;
revoke all on function public.list_participant_invitation_projection() from public, anon, authenticated, service_role;
grant execute on function public.inspect_passage_invitation(text) to anon, authenticated;
grant execute on function public.create_family_space_idempotent(text,uuid) to authenticated;
grant execute on function public.create_participant_invitation_idempotent(uuid,text,text,text,text,text[],timestamp with time zone,uuid) to authenticated;
grant execute on function public.accept_participant_invitation(text) to authenticated;
grant execute on function public.decline_participant_invitation(text,text) to authenticated;
grant execute on function public.revoke_participant_invitation(uuid,text) to authenticated;
grant execute on function public.rotate_participant_invitation_idempotent(uuid,timestamp with time zone,uuid) to authenticated;
grant execute on function public.revoke_continuity_participant_idempotent(uuid,text,uuid) to authenticated;
grant execute on function public.list_owned_continuity_spaces() to authenticated;
grant execute on function public.list_participant_continuity_spaces() to authenticated;
grant execute on function public.list_continuity_participant_projection() to authenticated;
grant execute on function public.list_owned_continuity_participant_projection() to authenticated;
grant execute on function public.list_participant_invitation_projection() to authenticated;
