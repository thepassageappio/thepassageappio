-- Real gap found doing the persona-by-persona completeness pass against
-- the roadmap's own success bar: there is no general-purpose "director or
-- authorized staff creates a new case" path anywhere in the app. The only
-- way an org-owned workflow gets created is create_case_from_urgent_intake_idempotent,
-- which requires a claimed urgent_intake_requests row -- meaning a funeral
-- home taking a case any other way (a phone call, a walk-in, a pre-need
-- arrangement, an existing family relationship) has no way to open a case
-- at all. /director/intake demonstrates the intended UX for exactly this
-- (manual walk-in mode) but is a pure client-only sandbox with zero
-- backend calls -- the real capability was never built underneath it.
--
-- This adds that missing capability, matching every existing convention
-- read directly from create_case_from_urgent_intake_idempotent (pulled
-- live via pg_get_functiondef, since several recent migrations were
-- applied straight to Supabase and never committed to git): the same
-- can_create_case_at_location authority (director/owner, or staff with an
-- explicit can_create_cases grant at that location -- not just any staff),
-- the same trial-gating check (55001 once the free-trial org has one
-- active case), and the same seed_default_case_tasks call so a manually
-- created case gets the researched 15-item funeral-home checklist, not an
-- empty case.

create or replace function passage_private.create_case_manual_idempotent(
  p_organization_id uuid,
  p_organization_location_id uuid,
  p_case_reference text,
  p_family_name text,
  p_person_name text,
  p_request_id uuid
)
returns table (workflow_id uuid, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_member_id uuid;
  v_key text;
  v_existing_event public.workflow_events%rowtype;
  v_workflow_id uuid;
  v_active_case_count integer;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_organization_id is null or p_organization_location_id is null or p_request_id is null
     or length(btrim(coalesce(p_case_reference, ''))) not between 1 and 60
     or length(btrim(coalesce(p_family_name, ''))) not between 1 and 200
     or length(btrim(coalesce(p_person_name, ''))) not between 1 and 200 then
    raise exception 'Valid case details are required' using errcode = '22023';
  end if;
  if not passage_private.can_create_case_at_location(p_organization_id, p_organization_location_id) then
    raise exception 'Case-creation authority for this organization and location is required' using errcode = '42501';
  end if;
  v_member_id := passage_private.current_active_member_id(p_organization_id);
  if v_member_id is null then
    raise exception 'Active membership in this organization is required' using errcode = '42501';
  end if;

  v_key := 'manual_case_create:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.workflow_events as e
  where e.organization_id = p_organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_existing_event.workflow_id, true;
    return;
  end if;

  if not passage_private.can_use_gated_features(p_organization_id) then
    select count(*) into v_active_case_count from public.workflows
    where organization_id = p_organization_id and status = 'active';
    if v_active_case_count >= 1 then
      raise exception 'Your 90-day trial has ended. Upgrade to open another active case.' using errcode = '55001';
    end if;
  end if;

  insert into public.workflows (
    organization_id, organization_location_id, accountable_organization_member_id,
    case_reference, family_name, person_name, phase, status, name, trigger_type
  ) values (
    p_organization_id, p_organization_location_id, v_member_id,
    btrim(p_case_reference), btrim(p_family_name), btrim(p_person_name), 'Case opened', 'active',
    btrim(p_case_reference), 'death_confirmed'
  ) returning id into v_workflow_id;

  perform passage_private.seed_default_case_tasks(v_workflow_id, p_organization_id, p_organization_location_id);

  insert into public.workflow_events (
    workflow_id, event_type, name, organization_id, organization_location_id,
    actor_user_id, actor_organization_member_id, idempotency_key, audience,
    previous_state, next_state, occurred_at, metadata
  ) values (
    v_workflow_id, 'other', 'case.created', p_organization_id, p_organization_location_id,
    v_actor_user_id, v_member_id, v_key, 'organization_internal',
    null, 'active', pg_catalog.clock_timestamp(),
    pg_catalog.jsonb_build_object('case_reference', btrim(p_case_reference), 'family_name', btrim(p_family_name))
  );

  return query select v_workflow_id, false;
end
$function$;

create or replace function public.create_case_manual_idempotent(
  p_organization_id uuid, p_organization_location_id uuid, p_case_reference text,
  p_family_name text, p_person_name text, p_request_id uuid
)
returns table (workflow_id uuid, replayed boolean)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.create_case_manual_idempotent(
    p_organization_id, p_organization_location_id, p_case_reference, p_family_name, p_person_name, p_request_id
  )
$function$;

revoke all on function passage_private.create_case_manual_idempotent(uuid, uuid, text, text, text, uuid) from public, anon, authenticated, service_role;
grant execute on function passage_private.create_case_manual_idempotent(uuid, uuid, text, text, text, uuid) to authenticated;

revoke all on function public.create_case_manual_idempotent(uuid, uuid, text, text, text, uuid) from public, anon, authenticated, service_role;
grant execute on function public.create_case_manual_idempotent(uuid, uuid, text, text, text, uuid) to authenticated;
