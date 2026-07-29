-- Passage Zero Packet 1: bind every urgent request to one receiving
-- organization and close the org-agnostic queue/claim boundary.
--
-- The applied 20260726215450 migration is immutable history. This forward-only
-- repair is intentionally isolated-project guarded. Existing rows are migrated
-- only when their exact claimed organization or linked workflow proves the
-- receiver; unclaimed rows without that durable proof abort the migration.

do $guard$
declare
  v_northstar constant uuid := 'c7a00001-7a00-47a0-87a0-000000000001';
begin
  if to_regclass('public.urgent_intake_requests') is null
     or to_regclass('public.urgent_intake_events') is null
     or not exists (select 1 from public.organizations where id = v_northstar)
     or (select count(*) from public.organizations) > 25 then
    raise exception 'Refusing urgent organization repair: isolated Northstar lineage is missing'
      using errcode = '42501';
  end if;
  if exists (
    select 1
    from public.urgent_intake_requests request_row
    left join public.workflows workflow_row on workflow_row.id = request_row.workflow_id
    where coalesce(
      request_row.claimed_organization_id,
      workflow_row.organization_id
    ) is null
  ) or exists (
    select 1
    from public.urgent_intake_requests request_row
    left join public.workflows workflow_row on workflow_row.id = request_row.workflow_id
    where coalesce(
      request_row.claimed_organization_id,
      workflow_row.organization_id
    ) <> v_northstar
  ) or exists (
    select 1
    from public.urgent_intake_requests request_row
    join public.workflows workflow_row on workflow_row.id = request_row.workflow_id
    where workflow_row.organization_id is distinct from v_northstar
  ) then
    raise exception 'Refusing urgent organization repair: existing rows cannot be deterministically assigned to Northstar'
      using errcode = '55000';
  end if;
end
$guard$;

alter table public.urgent_intake_requests
  add column receiving_organization_id uuid references public.organizations (id);

update public.urgent_intake_requests request_row
set receiving_organization_id = coalesce(
  request_row.claimed_organization_id,
  workflow_row.organization_id
)
from public.workflows workflow_row
where workflow_row.id = request_row.workflow_id
  and request_row.receiving_organization_id is null;

update public.urgent_intake_requests request_row
set receiving_organization_id = request_row.claimed_organization_id
where request_row.receiving_organization_id is null
  and request_row.claimed_organization_id is not null;

alter table public.urgent_intake_requests
  alter column receiving_organization_id set not null,
  add constraint urgent_intake_requests_claim_matches_receiver
    check (
      claimed_organization_id is null
      or claimed_organization_id = receiving_organization_id
    ),
  add constraint urgent_intake_requests_packet1_receiver
    check (
      receiving_organization_id =
        'c7a00001-7a00-47a0-87a0-000000000001'::uuid
    );

create index urgent_intake_requests_receiving_org_status_idx
  on public.urgent_intake_requests (receiving_organization_id, status, submitted_at);

create or replace function passage_private.is_active_urgent_leader_of_organization(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members member_row
    where member_row.organization_id = p_organization_id
      and member_row.user_id = (select auth.uid())
      and member_row.status = 'active'
      and member_row.role in ('owner', 'director')
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
    select 1
    from public.urgent_intake_requests request_row
    where request_row.id = p_urgent_intake_request_id
      and (
        request_row.requester_user_id = (select auth.uid())
        or (
          request_row.wants_callback
          and request_row.status <> 'self_handling'
          and passage_private.is_active_urgent_leader_of_organization(
            request_row.receiving_organization_id
          )
        )
      )
  )
$$;

drop policy urgent_intake_requests_authorized_select
  on public.urgent_intake_requests;
create policy urgent_intake_requests_authorized_select
  on public.urgent_intake_requests
  for select to authenticated
  using (
    requester_user_id = (select auth.uid())
    or (
      wants_callback
      and status <> 'self_handling'
      and passage_private.is_active_urgent_leader_of_organization(
        receiving_organization_id
      )
    )
  );

-- Remove the org-agnostic submission overload before exposing the new,
-- organization-bound signature.
drop function public.submit_urgent_intake_idempotent(
  text, text, text, text, text, text, text, text, boolean, uuid
);
drop function passage_private.submit_urgent_intake_idempotent(
  text, text, text, text, text, text, text, text, boolean, uuid
);

create or replace function passage_private.submit_urgent_intake_idempotent(
  p_receiving_organization_id uuid,
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
returns table (
  urgent_intake_request_id uuid,
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
     or p_receiving_organization_id is null
     or p_situation_category is null
     or p_situation_category not in (
       'home_unexpected', 'hospice', 'hospital',
       'care_facility', 'already_handled', 'other'
     )
     or length(btrim(coalesce(p_person_name, ''))) not between 1 and 200
     or length(btrim(coalesce(p_person_location, ''))) not between 1 and 300
     or length(btrim(coalesce(p_coordinator_name, ''))) not between 1 and 200
     or (v_phone is null and v_email is null)
     or p_wants_callback is null then
    raise exception 'Valid situation, receiving home, and contact details are required'
      using errcode = '22023';
  end if;
  if p_receiving_organization_id is distinct from
       'c7a00001-7a00-47a0-87a0-000000000001'::uuid then
    raise exception 'The selected funeral home is unavailable for this preview'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_actor_user_id::text || ':urgent_intake_create:' || p_request_id::text,
      0
    )
  );

  select request_row.*
  into v_existing
  from public.urgent_intake_requests request_row
  where request_row.requester_user_id = v_actor_user_id
    and request_row.creation_request_id = p_request_id;
  if found then
    if v_existing.receiving_organization_id is distinct from p_receiving_organization_id
       or v_existing.situation_category is distinct from p_situation_category
       or v_existing.person_name is distinct from btrim(p_person_name)
       or v_existing.person_location is distinct from btrim(p_person_location)
       or v_existing.person_timing is distinct from v_timing
       or v_existing.coordinator_name is distinct from btrim(p_coordinator_name)
       or v_existing.coordinator_phone is distinct from v_phone
       or v_existing.coordinator_email is distinct from v_email
       or v_existing.callback_notes is distinct from v_notes
       or v_existing.wants_callback is distinct from p_wants_callback then
      raise exception 'Request conflicts with an earlier command'
        using errcode = '22023';
    end if;
    return query
      select v_existing.id, v_existing.status, v_existing.version, true;
    return;
  end if;

  v_status := case when p_wants_callback then 'submitted' else 'self_handling' end;

  insert into public.urgent_intake_requests (
    requester_user_id, receiving_organization_id, situation_category,
    person_name, person_location, person_timing, coordinator_name,
    coordinator_phone, coordinator_email, callback_notes, wants_callback,
    status, version, creation_request_id, submitted_at
  ) values (
    v_actor_user_id, p_receiving_organization_id, p_situation_category,
    btrim(p_person_name), btrim(p_person_location), v_timing,
    btrim(p_coordinator_name), v_phone, v_email, v_notes, p_wants_callback,
    v_status, 1, p_request_id, pg_catalog.clock_timestamp()
  )
  returning id into v_new_id;

  insert into public.urgent_intake_events (
    urgent_intake_request_id, actor_user_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_new_id, v_actor_user_id, 'urgent_intake.submitted', null, v_status,
    'urgent_intake_create:' || p_request_id::text,
    pg_catalog.jsonb_build_object(
      'situation_category', p_situation_category,
      'wants_callback', p_wants_callback,
      'receiving_organization_id', p_receiving_organization_id
    )
  );

  return query select v_new_id, v_status, 1, false;
end
$function$;

create or replace function public.submit_urgent_intake_idempotent(
  p_receiving_organization_id uuid,
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
returns table (
  urgent_intake_request_id uuid,
  status text,
  version integer,
  replayed boolean
)
language sql
volatile
security invoker
set search_path = ''
as $$
  select *
  from passage_private.submit_urgent_intake_idempotent(
    p_receiving_organization_id, p_situation_category, p_person_name,
    p_person_location, p_person_timing, p_coordinator_name,
    p_coordinator_phone, p_coordinator_email, p_callback_notes,
    p_wants_callback, p_request_id
  )
$$;

-- The claim signature remains stable, but authority now resolves from the
-- request's receiver rather than from the actor's first operational membership.
create or replace function passage_private.claim_urgent_intake_idempotent(
  p_urgent_intake_request_id uuid,
  p_expected_version integer,
  p_request_id uuid
)
returns table (
  urgent_intake_request_id uuid,
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
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_urgent_intake_request_id is null
     or p_request_id is null
     or p_expected_version is null
     or p_expected_version < 1 then
    raise exception 'Valid request and version are required'
      using errcode = '22023';
  end if;

  select request_row.*
  into v_request
  from public.urgent_intake_requests request_row
  where request_row.id = p_urgent_intake_request_id
  for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;
  if not v_request.wants_callback or v_request.status = 'self_handling' then
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

  v_key := 'urgent_intake_claim:' || p_request_id::text;
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
       or v_existing_event.actor_user_id is distinct from v_actor_user_id
       or v_existing_event.actor_organization_member_id is distinct from v_member_id
       or (v_existing_event.metadata ->> 'organization_id')::uuid
         is distinct from v_request.receiving_organization_id then
      raise exception 'Request conflicts with an earlier command'
        using errcode = '22023';
    end if;
    return query
      select v_request.id, v_existing_event.next_state,
             (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Request changed before it was claimed'
      using errcode = '40001';
  end if;
  if v_request.status <> 'submitted' then
    raise exception 'This request is no longer waiting to be claimed'
      using errcode = '55000';
  end if;

  update public.urgent_intake_requests request_row
  set status = 'claimed',
      version = request_row.version + 1,
      claimed_organization_id = v_request.receiving_organization_id,
      claimed_by_organization_member_id = v_member_id,
      claimed_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where request_row.id = v_request.id;

  insert into public.urgent_intake_events (
    urgent_intake_request_id, actor_user_id, actor_organization_member_id,
    name, previous_state, next_state, idempotency_key, metadata
  ) values (
    v_request.id, v_actor_user_id, v_member_id, 'urgent_intake.claimed',
    'submitted', 'claimed', v_key,
    pg_catalog.jsonb_build_object(
      'version', v_request.version + 1,
      'expected_version', p_expected_version,
      'organization_id', v_request.receiving_organization_id
    )
  );

  return query
    select v_request.id, 'claimed'::text, v_request.version + 1, false;
end
$function$;

create or replace function passage_private.create_case_from_urgent_intake_idempotent(
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
    return query
      select
        v_request.id,
        (v_existing_event.metadata ->> 'workflow_id')::uuid,
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
      'organization_location_id', p_organization_location_id,
      'case_reference', v_case_reference,
      'family_name', v_family_name
    )
  );

  return query
    select
      v_request.id, v_workflow_id, 'case_created'::text,
      v_request.version + 1, false;
end
$function$;

revoke all on function passage_private.is_active_operational_leader()
  from public, anon, authenticated, service_role;
revoke all on function passage_private.is_active_member_of_organization(uuid)
  from public, anon, authenticated, service_role;
revoke all on function passage_private.is_active_urgent_leader_of_organization(uuid)
  from public, anon, authenticated, service_role;
revoke all on function passage_private.can_view_urgent_intake_request(uuid)
  from public, anon, authenticated, service_role;
revoke all on function passage_private.submit_urgent_intake_idempotent(
  uuid, text, text, text, text, text, text, text, text, boolean, uuid
) from public, anon, authenticated, service_role;
revoke all on function passage_private.claim_urgent_intake_idempotent(uuid, integer, uuid)
  from public, anon, authenticated, service_role;
revoke all on function passage_private.create_case_from_urgent_intake_idempotent(uuid, integer, uuid, text, text, uuid)
  from public, anon, authenticated, service_role;

revoke all on function public.submit_urgent_intake_idempotent(
  uuid, text, text, text, text, text, text, text, text, boolean, uuid
) from public, anon, service_role;
revoke all on function public.claim_urgent_intake_idempotent(uuid, integer, uuid)
  from public, anon, service_role;
revoke all on function public.create_case_from_urgent_intake_idempotent(uuid, integer, uuid, text, text, uuid)
  from public, anon, service_role;

grant execute on function passage_private.is_active_urgent_leader_of_organization(uuid)
  to authenticated;
grant execute on function passage_private.can_view_urgent_intake_request(uuid)
  to authenticated;
grant execute on function passage_private.submit_urgent_intake_idempotent(
  uuid, text, text, text, text, text, text, text, text, boolean, uuid
) to authenticated;
grant execute on function passage_private.claim_urgent_intake_idempotent(uuid, integer, uuid)
  to authenticated;
grant execute on function passage_private.create_case_from_urgent_intake_idempotent(uuid, integer, uuid, text, text, uuid)
  to authenticated;

grant execute on function public.submit_urgent_intake_idempotent(
  uuid, text, text, text, text, text, text, text, text, boolean, uuid
) to authenticated;
grant execute on function public.claim_urgent_intake_idempotent(uuid, integer, uuid)
  to authenticated;
grant execute on function public.create_case_from_urgent_intake_idempotent(uuid, integer, uuid, text, text, uuid)
  to authenticated;
