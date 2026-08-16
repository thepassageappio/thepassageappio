-- Real bug fix, found while auditing why a paying D2C customer has no way
-- to get a case: public.workflows.name and .trigger_type are NOT NULL with
-- no default, but create_case_from_urgent_intake_idempotent's insert never
-- set either one. Confirmed this has never actually succeeded in
-- production -- zero rows exist in urgent_intake_requests at all, and all
-- 9 existing workflows have both fields populated (they were created some
-- other way, not through this RPC). This RPC is the *only* case-creation
-- path in production today, so it has been silently broken since it
-- shipped. trigger_type value matches the only value ever used across the
-- existing 9 rows ('death_confirmed'), not a new invention.

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
  v_active_case_count integer;
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

  if not passage_private.can_use_gated_features(v_request.claimed_organization_id) then
    select count(*) into v_active_case_count from public.workflows
    where organization_id = v_request.claimed_organization_id and status = 'active';
    if v_active_case_count >= 1 then
      raise exception 'Your 90-day trial has ended. Upgrade to open another active case.' using errcode = '55001';
    end if;
  end if;

  insert into public.workflows (
    organization_id, organization_location_id, accountable_organization_member_id,
    case_reference, family_name, person_name, phase, status, name, trigger_type
  ) values (
    v_request.claimed_organization_id, p_organization_location_id, v_member_id,
    btrim(p_case_reference), btrim(p_family_name), v_request.person_name, 'Intake from urgent request', 'active',
    btrim(p_case_reference), 'death_confirmed'
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

-- Self-serve D2C family record creation, mirroring self_serve_create_organization's
-- pattern for B2B. Gated on the caller having an active/trialing subscription
-- (any plan) -- entitlement, not a director/org concept. Idempotent by
-- "does this user already have a workflow" (workflows has no
-- creation_request_id column, and one-per-user is the real invariant this
-- pass enforces -- multi-estate self-serve creation via the Estate Add-On
-- seat count is a real follow-up, not built here).
create or replace function passage_private.self_serve_create_family_record(
  p_person_name text,
  p_relationship_to_deceased text
)
returns table (workflow_id uuid, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_person_name text := btrim(coalesce(p_person_name, ''));
  v_relationship text := nullif(btrim(coalesce(p_relationship_to_deceased, '')), '');
  v_has_active_subscription boolean;
  v_existing_workflow_id uuid;
  v_new_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_person_name = '' or length(v_person_name) > 200 then
    raise exception 'A valid name is required' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.subscriptions
    where user_id = v_actor_user_id and status in ('active', 'trialing')
  ) into v_has_active_subscription;
  if not v_has_active_subscription then
    raise exception 'An active subscription is required to start a family record' using errcode = '42501';
  end if;

  select id into v_existing_workflow_id from public.workflows where user_id = v_actor_user_id limit 1;
  if v_existing_workflow_id is not null then
    return query select v_existing_workflow_id, true;
    return;
  end if;

  insert into public.workflows (
    user_id, name, person_name, relationship_to_deceased, trigger_type, mode, path, status, phase
  ) values (
    v_actor_user_id, v_person_name, v_person_name, v_relationship, 'death_confirmed', 'green', 'green', 'planning_active', 'Planning started'
  ) returning id into v_new_id;

  return query select v_new_id, false;
end
$function$;

create or replace function public.self_serve_create_family_record(
  p_person_name text,
  p_relationship_to_deceased text
)
returns table (workflow_id uuid, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.self_serve_create_family_record(p_person_name, p_relationship_to_deceased)
$$;

revoke all on function passage_private.self_serve_create_family_record(text, text) from public, anon, authenticated;
revoke all on function public.self_serve_create_family_record(text, text) from public, anon;
grant execute on function public.self_serve_create_family_record(text, text) to authenticated;
