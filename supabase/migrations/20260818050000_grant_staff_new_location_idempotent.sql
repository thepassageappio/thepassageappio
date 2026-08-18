-- UX-audit finding #15: /director/team can toggle an *existing*
-- organization_member_locations grant's can_create_cases flag
-- (set_staff_case_creation_grant_idempotent), but there is no RPC that
-- creates a NEW grant row -- a staff member can only ever be assigned to
-- a location by going through a fresh invitation. With multi-location
-- funeral homes now real (location creation shipped earlier tonight), a
-- director has no way to add an existing staff member to a second
-- location at all. This adds that missing capability, following the exact
-- same authority/idempotency/audit shape as set_staff_case_creation_grant_idempotent
-- (read live from Supabase via pg_get_functiondef -- its own migration file
-- was applied directly and never committed to git, a separate, already-
-- flagged gap this does not attempt to fix).

create or replace function passage_private.grant_staff_location_idempotent(
  p_organization_member_id uuid,
  p_organization_location_id uuid,
  p_can_create_cases boolean,
  p_request_id uuid
)
returns table (organization_member_id uuid, organization_location_id uuid, can_create_cases boolean, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_target public.organization_member_locations%rowtype;
  v_target_member public.organization_members%rowtype;
  v_location public.organization_locations%rowtype;
  v_key text;
  v_existing_event public.workflow_events%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_organization_member_id is null or p_organization_location_id is null or p_request_id is null then
    raise exception 'A member, location, and request id are required' using errcode = '22023';
  end if;

  select m.* into v_target_member from public.organization_members as m where m.id = p_organization_member_id;
  if v_target_member.id is null or v_target_member.role <> 'staff' or v_target_member.status <> 'active' then
    raise exception 'Only an active staff member can be granted a location' using errcode = '42501';
  end if;
  select l.* into v_location from public.organization_locations as l where l.id = p_organization_location_id;
  if v_location.id is null or v_location.organization_id <> v_target_member.organization_id then
    raise exception 'That location does not belong to this organization' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_target_member.organization_id, p_organization_location_id) then
    raise exception 'Director authority for this organization and location is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_target_member.organization_id);

  v_key := 'staff_location_grant:' || p_organization_member_id::text || ':' || p_organization_location_id::text || ':' || p_request_id::text;
  select e.* into v_existing_event from public.workflow_events as e
  where e.organization_id = v_target_member.organization_id and e.idempotency_key = v_key;
  if found then
    select ml.* into v_target from public.organization_member_locations as ml
    where ml.organization_member_id = p_organization_member_id and ml.organization_location_id = p_organization_location_id;
    return query select p_organization_member_id, p_organization_location_id, v_target.can_create_cases, true;
    return;
  end if;

  select ml.* into v_target
  from public.organization_member_locations as ml
  where ml.organization_member_id = p_organization_member_id and ml.organization_location_id = p_organization_location_id
  for update;

  if v_target.organization_member_id is not null and v_target.revoked_at is null then
    raise exception 'This staff member already has this location' using errcode = '23505';
  end if;

  if v_target.organization_member_id is not null then
    -- Previously revoked assignment at this same location -- re-activate
    -- rather than insert, since (member, location) is the primary key.
    update public.organization_member_locations
    set revoked_at = null, revoked_by_user_id = null, revocation_reason = null,
        can_create_cases = p_can_create_cases, granted_by_user_id = v_actor_user_id, granted_at = pg_catalog.clock_timestamp()
    where organization_member_id = p_organization_member_id and organization_location_id = p_organization_location_id;
  else
    insert into public.organization_member_locations (
      organization_member_id, organization_location_id, granted_by_user_id, can_create_cases
    ) values (
      p_organization_member_id, p_organization_location_id, v_actor_user_id, p_can_create_cases
    );
  end if;

  insert into public.workflow_events (
    workflow_id, event_type, name, organization_id, organization_location_id,
    actor_user_id, actor_organization_member_id, invitation_id, idempotency_key,
    audience, previous_state, next_state, occurred_at, metadata
  ) values (
    null, 'other', 'staff_location.granted',
    v_target_member.organization_id, p_organization_location_id,
    v_actor_user_id, v_actor_member_id, null, v_key,
    'organization_internal', 'not_assigned', 'assigned',
    pg_catalog.clock_timestamp(),
    pg_catalog.jsonb_build_object('target_organization_member_id', p_organization_member_id, 'can_create_cases', p_can_create_cases, 'event_kind', 'staff_location.granted', 'proof_destination', 'organization_audit')
  )
  on conflict (organization_id, idempotency_key) where organization_id is not null and idempotency_key is not null
  do nothing;

  return query select p_organization_member_id, p_organization_location_id, p_can_create_cases, false;
end;
$function$;

create or replace function public.grant_staff_location_idempotent(
  p_organization_member_id uuid, p_organization_location_id uuid, p_can_create_cases boolean, p_request_id uuid
)
returns table (organization_member_id uuid, organization_location_id uuid, can_create_cases boolean, replayed boolean)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.grant_staff_location_idempotent(p_organization_member_id, p_organization_location_id, p_can_create_cases, p_request_id)
$function$;

revoke all on function passage_private.grant_staff_location_idempotent(uuid, uuid, boolean, uuid) from public, anon, authenticated, service_role;
grant execute on function passage_private.grant_staff_location_idempotent(uuid, uuid, boolean, uuid) to authenticated;

revoke all on function public.grant_staff_location_idempotent(uuid, uuid, boolean, uuid) from public, anon, authenticated, service_role;
grant execute on function public.grant_staff_location_idempotent(uuid, uuid, boolean, uuid) to authenticated;
