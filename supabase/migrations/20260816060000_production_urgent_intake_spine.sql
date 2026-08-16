-- Production urgent/at-need intake spine.
--
-- Ports urgent_family_thin_slice.sql's design to production (its preflight
-- required the Northstar fixture org; would refuse outright here). All-new
-- tables, no legacy constraint collisions, no fixture block to drop.
--
-- Notably: this design was ALREADY the real multi-org routing answer, not a
-- single hardcoded receiving org. submit_urgent_intake_idempotent takes no
-- organization parameter at all -- a submitted request sits in a shared
-- "submitted" queue visible to any active owner/director across ANY
-- organization (is_active_operational_leader() has no org filter), and
-- claim_urgent_intake_idempotent lets whichever real director claims it
-- first take ownership. The frontend/app/start flow's hardcoded
-- PREVIEW_RECEIVING_ORGANIZATION and the DB CHECK constraint in
-- urgent_receiving_organization_boundary.sql were built on top of this
-- later, constraining it back down to one fixture org for the isolated
-- beta -- neither of those is applied here, so this migration alone
-- restores the originally-designed shared-queue behavior.

create table if not exists public.urgent_intake_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  situation_category text not null check (situation_category in ('home_unexpected', 'hospice', 'hospital', 'care_facility', 'already_handled', 'other')),
  person_name text not null check (length(btrim(person_name)) between 1 and 200),
  person_location text not null check (length(btrim(person_location)) between 1 and 300),
  person_timing text check (person_timing is null or length(person_timing) <= 300),
  coordinator_name text not null check (length(btrim(coordinator_name)) between 1 and 200),
  coordinator_phone text check (coordinator_phone is null or length(coordinator_phone) <= 40),
  coordinator_email text check (coordinator_email is null or length(coordinator_email) <= 320),
  callback_notes text check (callback_notes is null or length(callback_notes) <= 2000),
  wants_callback boolean not null,
  status text not null check (status in ('submitted', 'self_handling', 'claimed', 'case_created')),
  version integer not null default 1 check (version > 0),
  claimed_organization_id uuid references public.organizations (id),
  claimed_by_organization_member_id uuid references public.organization_members (id),
  workflow_id uuid references public.workflows (id),
  creation_request_id uuid not null,
  submitted_at timestamptz not null default clock_timestamp(),
  claimed_at timestamptz,
  case_created_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint urgent_intake_requests_contact_check check (coordinator_phone is not null or coordinator_email is not null),
  unique (requester_user_id, creation_request_id)
);
comment on table public.urgent_intake_requests is 'Urgent/at-need first-response intake. State machine: submitted|self_handling -> claimed -> case_created.';

create index if not exists urgent_intake_requests_requester_idx on public.urgent_intake_requests (requester_user_id);
create index if not exists urgent_intake_requests_status_idx on public.urgent_intake_requests (status);
create index if not exists urgent_intake_requests_claimed_org_idx on public.urgent_intake_requests (claimed_organization_id);

create table if not exists public.urgent_intake_events (
  id uuid primary key default gen_random_uuid(),
  urgent_intake_request_id uuid not null references public.urgent_intake_requests (id) on delete cascade,
  actor_user_id uuid references auth.users (id),
  actor_organization_member_id uuid references public.organization_members (id),
  name text not null check (length(btrim(name)) between 1 and 120),
  previous_state text,
  next_state text not null,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default clock_timestamp(),
  unique (urgent_intake_request_id, idempotency_key)
);
comment on table public.urgent_intake_events is 'Append-only audit trail for urgent_intake_requests lifecycle transitions.';

create index if not exists urgent_intake_events_request_idx on public.urgent_intake_events (urgent_intake_request_id, occurred_at);

create or replace function passage_private.reject_urgent_intake_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'urgent_intake_events is append-only';
end
$$;

drop trigger if exists urgent_intake_events_append_only on public.urgent_intake_events;
create trigger urgent_intake_events_append_only
  before update or delete on public.urgent_intake_events
  for each row execute function passage_private.reject_urgent_intake_event_mutation();

alter table public.urgent_intake_requests enable row level security;
alter table public.urgent_intake_events enable row level security;

create or replace function passage_private.is_active_operational_leader()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members om
    where om.user_id = (select auth.uid()) and om.status = 'active' and om.role in ('owner', 'director')
  )
$$;

create or replace function passage_private.is_active_member_of_organization(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members om
    where om.organization_id = p_organization_id and om.user_id = (select auth.uid()) and om.status = 'active'
  )
$$;

create or replace function passage_private.can_view_urgent_intake_request(p_urgent_intake_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.urgent_intake_requests r
    where r.id = p_urgent_intake_request_id
      and (
        r.requester_user_id = (select auth.uid())
        or (r.status = 'submitted' and passage_private.is_active_operational_leader())
        or (r.claimed_organization_id is not null and passage_private.is_active_member_of_organization(r.claimed_organization_id))
      )
  )
$$;

grant execute on function passage_private.is_active_operational_leader() to authenticated;
grant execute on function passage_private.is_active_member_of_organization(uuid) to authenticated;
grant execute on function passage_private.can_view_urgent_intake_request(uuid) to authenticated;

drop policy if exists urgent_intake_requests_authorized_select on public.urgent_intake_requests;
create policy urgent_intake_requests_authorized_select on public.urgent_intake_requests
  for select to authenticated
  using (
    requester_user_id = (select auth.uid())
    or (status = 'submitted' and passage_private.is_active_operational_leader())
    or (claimed_organization_id is not null and passage_private.is_active_member_of_organization(claimed_organization_id))
  );

drop policy if exists urgent_intake_events_authorized_select on public.urgent_intake_events;
create policy urgent_intake_events_authorized_select on public.urgent_intake_events
  for select to authenticated
  using (passage_private.can_view_urgent_intake_request(urgent_intake_request_id));

revoke all on table public.urgent_intake_requests from public, anon, authenticated;
revoke all on table public.urgent_intake_events from public, anon, authenticated;
grant select on table public.urgent_intake_requests to authenticated;
grant select on table public.urgent_intake_events to authenticated;

create or replace function passage_private.submit_urgent_intake_idempotent(
  p_situation_category text,
  p_person_name text,
  p_person_location text,
  p_person_timing text,
  p_coordinator_name text,
  p_coordinator_phone text,
  p_coordinator_email text,
  p_callback_notes text,
  p_wants_callback boolean,
  p_request_id uuid
)
returns table (urgent_intake_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_existing public.urgent_intake_requests%rowtype;
  v_new_id uuid;
  v_status text;
  v_timing text := nullif(btrim(coalesce(p_person_timing, '')), '');
  v_phone text := nullif(btrim(coalesce(p_coordinator_phone, '')), '');
  v_email text := nullif(btrim(coalesce(p_coordinator_email, '')), '');
  v_notes text := nullif(btrim(coalesce(p_callback_notes, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null
     or p_situation_category is null or p_situation_category not in ('home_unexpected', 'hospice', 'hospital', 'care_facility', 'already_handled', 'other')
     or length(btrim(coalesce(p_person_name, ''))) not between 1 and 200
     or length(btrim(coalesce(p_person_location, ''))) not between 1 and 300
     or length(btrim(coalesce(p_coordinator_name, ''))) not between 1 and 200
     or (v_phone is null and v_email is null)
     or p_wants_callback is null then
    raise exception 'Valid situation and contact details are required' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor_user_id::text || ':urgent_intake_create:' || p_request_id::text, 0)
  );

  select r.* into v_existing from public.urgent_intake_requests as r
  where r.requester_user_id = v_actor_user_id and r.creation_request_id = p_request_id;
  if found then
    if v_existing.situation_category is distinct from p_situation_category
       or v_existing.person_name is distinct from btrim(p_person_name)
       or v_existing.coordinator_name is distinct from btrim(p_coordinator_name) then
      raise exception 'Request conflicts with an earlier command' using errcode = '22023';
    end if;
    return query select v_existing.id, v_existing.status, v_existing.version, true;
    return;
  end if;

  v_status := case when p_wants_callback then 'submitted' else 'self_handling' end;

  insert into public.urgent_intake_requests (
    requester_user_id, situation_category, person_name, person_location, person_timing,
    coordinator_name, coordinator_phone, coordinator_email, callback_notes, wants_callback,
    status, version, creation_request_id, submitted_at
  ) values (
    v_actor_user_id, p_situation_category, btrim(p_person_name), btrim(p_person_location), v_timing,
    btrim(p_coordinator_name), v_phone, v_email, v_notes, p_wants_callback,
    v_status, 1, p_request_id, pg_catalog.clock_timestamp()
  ) returning id into v_new_id;

  insert into public.urgent_intake_events (
    urgent_intake_request_id, actor_user_id, name, previous_state, next_state, idempotency_key, metadata
  ) values (
    v_new_id, v_actor_user_id, 'urgent_intake.submitted', null, v_status,
    'urgent_intake_create:' || p_request_id::text,
    pg_catalog.jsonb_build_object('situation_category', p_situation_category, 'wants_callback', p_wants_callback)
  );

  return query select v_new_id, v_status, 1, false;
end
$function$;

create or replace function public.submit_urgent_intake_idempotent(
  p_situation_category text,
  p_person_name text,
  p_person_location text,
  p_person_timing text,
  p_coordinator_name text,
  p_coordinator_phone text,
  p_coordinator_email text,
  p_callback_notes text,
  p_wants_callback boolean,
  p_request_id uuid
)
returns table (urgent_intake_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.submit_urgent_intake_idempotent(
    p_situation_category, p_person_name, p_person_location, p_person_timing,
    p_coordinator_name, p_coordinator_phone, p_coordinator_email, p_callback_notes,
    p_wants_callback, p_request_id
  )
$$;

create or replace function passage_private.claim_urgent_intake_idempotent(
  p_urgent_intake_request_id uuid,
  p_expected_version integer,
  p_request_id uuid
)
returns table (urgent_intake_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_member_id uuid;
  v_org_id uuid;
  v_request public.urgent_intake_requests%rowtype;
  v_existing_event public.urgent_intake_events%rowtype;
  v_key text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_urgent_intake_request_id is null or p_request_id is null or p_expected_version is null or p_expected_version < 1 then
    raise exception 'Valid request and version are required' using errcode = '22023';
  end if;

  select om.id, om.organization_id into v_member_id, v_org_id
  from public.organization_members om
  where om.user_id = v_actor_user_id and om.status = 'active' and om.role in ('owner', 'director')
  order by om.created_at asc, om.id asc
  limit 1;
  if v_member_id is null then
    raise exception 'Director or owner authority is required' using errcode = '42501';
  end if;

  select r.* into v_request from public.urgent_intake_requests as r where r.id = p_urgent_intake_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;

  v_key := 'urgent_intake_claim:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.urgent_intake_events as e
  where e.urgent_intake_request_id = v_request.id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Request changed before it was claimed' using errcode = '40001';
  end if;
  if v_request.status <> 'submitted' then
    raise exception 'This request is no longer waiting to be claimed' using errcode = '55000';
  end if;

  update public.urgent_intake_requests as r set
    status = 'claimed', version = r.version + 1,
    claimed_organization_id = v_org_id, claimed_by_organization_member_id = v_member_id,
    claimed_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
  where r.id = v_request.id;

  insert into public.urgent_intake_events (
    urgent_intake_request_id, actor_user_id, actor_organization_member_id, name, previous_state, next_state, idempotency_key, metadata
  ) values (
    v_request.id, v_actor_user_id, v_member_id, 'urgent_intake.claimed', 'submitted', 'claimed', v_key,
    pg_catalog.jsonb_build_object('version', v_request.version + 1, 'organization_id', v_org_id)
  );

  return query select v_request.id, 'claimed'::text, v_request.version + 1, false;
end
$function$;

create or replace function public.claim_urgent_intake_idempotent(
  p_urgent_intake_request_id uuid,
  p_expected_version integer,
  p_request_id uuid
)
returns table (urgent_intake_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.claim_urgent_intake_idempotent(p_urgent_intake_request_id, p_expected_version, p_request_id)
$$;

create or replace function passage_private.create_case_from_urgent_intake_idempotent(
  p_urgent_intake_request_id uuid,
  p_expected_version integer,
  p_organization_location_id uuid,
  p_case_reference text,
  p_family_name text,
  p_request_id uuid
)
returns table (urgent_intake_request_id uuid, workflow_id uuid, status text, version integer, replayed boolean)
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
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_urgent_intake_request_id is null or p_request_id is null or p_expected_version is null or p_expected_version < 1
     or p_organization_location_id is null
     or length(btrim(coalesce(p_case_reference, ''))) not between 1 and 60
     or length(btrim(coalesce(p_family_name, ''))) not between 1 and 200 then
    raise exception 'Valid case details are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.urgent_intake_requests as r where r.id = p_urgent_intake_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;
  if v_request.claimed_organization_id is null or not passage_private.can_manage_location(v_request.claimed_organization_id, p_organization_location_id) then
    raise exception 'Director authority for this organization and location is required' using errcode = '42501';
  end if;
  v_member_id := passage_private.current_active_member_id(v_request.claimed_organization_id);
  if v_member_id is null then
    raise exception 'Director authority for this organization is required' using errcode = '42501';
  end if;

  v_key := 'urgent_intake_case_create:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.urgent_intake_events as e
  where e.urgent_intake_request_id = v_request.id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_request.workflow_id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Request changed before the case was created' using errcode = '40001';
  end if;
  if v_request.status <> 'claimed' then
    raise exception 'This request is not ready for case creation' using errcode = '55000';
  end if;

  insert into public.workflows (
    organization_id, organization_location_id, accountable_organization_member_id,
    case_reference, family_name, person_name, phase, status
  ) values (
    v_request.claimed_organization_id, p_organization_location_id, v_member_id,
    btrim(p_case_reference), btrim(p_family_name), v_request.person_name, 'Intake from urgent request', 'active'
  ) returning id into v_workflow_id;

  update public.urgent_intake_requests as r set
    status = 'case_created', version = r.version + 1, workflow_id = v_workflow_id,
    case_created_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
  where r.id = v_request.id;

  insert into public.urgent_intake_events (
    urgent_intake_request_id, actor_user_id, actor_organization_member_id, name, previous_state, next_state, idempotency_key, metadata
  ) values (
    v_request.id, v_actor_user_id, v_member_id, 'urgent_intake.case_created', 'claimed', 'case_created', v_key,
    pg_catalog.jsonb_build_object('version', v_request.version + 1, 'workflow_id', v_workflow_id)
  );

  return query select v_request.id, v_workflow_id, 'case_created'::text, v_request.version + 1, false;
end
$function$;

create or replace function public.create_case_from_urgent_intake_idempotent(
  p_urgent_intake_request_id uuid,
  p_expected_version integer,
  p_organization_location_id uuid,
  p_case_reference text,
  p_family_name text,
  p_request_id uuid
)
returns table (urgent_intake_request_id uuid, workflow_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.create_case_from_urgent_intake_idempotent(
    p_urgent_intake_request_id, p_expected_version, p_organization_location_id, p_case_reference, p_family_name, p_request_id
  )
$$;

revoke all on function passage_private.submit_urgent_intake_idempotent(text, text, text, text, text, text, text, text, boolean, uuid) from public, anon, authenticated;
revoke all on function passage_private.claim_urgent_intake_idempotent(uuid, integer, uuid) from public, anon, authenticated;
revoke all on function passage_private.create_case_from_urgent_intake_idempotent(uuid, integer, uuid, text, text, uuid) from public, anon, authenticated;

revoke all on function public.submit_urgent_intake_idempotent(text, text, text, text, text, text, text, text, boolean, uuid) from public, anon;
revoke all on function public.claim_urgent_intake_idempotent(uuid, integer, uuid) from public, anon;
revoke all on function public.create_case_from_urgent_intake_idempotent(uuid, integer, uuid, text, text, uuid) from public, anon;

grant execute on function passage_private.submit_urgent_intake_idempotent(text, text, text, text, text, text, text, text, boolean, uuid) to authenticated;
grant execute on function passage_private.claim_urgent_intake_idempotent(uuid, integer, uuid) to authenticated;
grant execute on function passage_private.create_case_from_urgent_intake_idempotent(uuid, integer, uuid, text, text, uuid) to authenticated;

grant execute on function public.submit_urgent_intake_idempotent(text, text, text, text, text, text, text, text, boolean, uuid) to authenticated;
grant execute on function public.claim_urgent_intake_idempotent(uuid, integer, uuid) to authenticated;
grant execute on function public.create_case_from_urgent_intake_idempotent(uuid, integer, uuid, text, text, uuid) to authenticated;
