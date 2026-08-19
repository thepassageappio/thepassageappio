-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Phase J -- platform permissions, provisioning & handoffs model. Scoped to the
-- funeral-home side only per the founder's assisted-living scoping decision
-- (see roadmap "Phase J, continued" / "Phase J, shipped" sections, 2026-08-16/17).
--
-- Ships:
--  1. organization_members.role CHECK constraint (owner/director/staff) -- genuinely
--     new; the role/status text columns themselves predate this migration (cycle_7a).
--  2. Audit-trail columns on organization_member_locations (revoked_by_user_id,
--     revocation_reason, can_create_cases) -- additive to the table cycle_7a created
--     (organization_member_id, organization_location_id, granted_by_user_id,
--     granted_at, revoked_at already existed).
--  3. Audit-trail columns on estate_access (granted_by_user_id, expires_at,
--     revoked_by_user_id, revocation_reason) -- additive; estate_access itself
--     predates the tracked supabase/migrations/ history entirely (confirmed via
--     supabase/migrations/20260818110000_family_participant_structured_roles.sql's
--     own comment: "this is the first tracked migration to touch estate_access").
--  4. passage_private.can_create_case_at_location() -- new centralized check.
--  5. passage_private.set_staff_case_creation_grant_idempotent() -- new director-only
--     idempotent grant/revoke RPC.
--  6. create_case_from_urgent_intake_idempotent updated to call the new check.
--
-- CONFIDENCE NOTE, read before trusting every line here: two pieces below could not
-- be independently re-verified against production, because production has since
-- moved past this exact historical state:
--   (a) organization_member_locations_revocation_shape_check as created here is a
--       plausible reconstruction of the ORIGINAL (buggy) constraint, not a live
--       pull -- the live database only has the corrected version (added by the very
--       next migration, 20260817000843_phase_j_fix_revocation_shape_null_propagation.sql,
--       whose content IS independently verified live). The reconstruction below
--       intentionally reproduces the classic Postgres CHECK-constraint null-propagation
--       gotcha (`revocation_reason <> ''` evaluates to NULL, not FALSE, when
--       revocation_reason is NULL, and a NULL CHECK result is treated as satisfied,
--       not violated) -- consistent with the very next migration's name
--       ("fix_revocation_shape_null_propagation") and with the sibling
--       organization_members_revocation_shape_check constraint (already committed,
--       supabase/migrations/20260816040000_production_task_proof_spine.sql) which
--       does NOT have this bug, using `length(btrim(revocation_reason)) > 0` instead --
--       i.e. this table's version is reconstructed as the same pattern minus that fix.
--   (b) create_case_from_urgent_intake_idempotent below is reconstructed WITHOUT a
--       passage_private.seed_default_case_tasks(...) call, because that function does
--       not exist yet at this point in history -- it is created six minutes later by
--       20260817010515_task_orchestration_researched_funeral_home_checklist.sql, which
--       also re-issues this same CREATE OR REPLACE to add the seeding call. Verified:
--       the immediately-prior committed migration
--       (supabase/migrations/20260816130000_fix_urgent_intake_case_creation.sql) has
--       zero task-seeding calls anywhere in its version of this function, so "no
--       seeding yet" is the correct state for this migration specifically.
--
-- Both are flagged, not silently presented as independently verified -- everything
-- else in this file (the function bodies, the final column list, the role_check
-- constraint) was pulled directly from live pg_get_functiondef / information_schema
-- output on 2026-08-19 and is not in question.

-- 1. organization_members: role CHECK constraint. Verified: no committed migration
-- ever adds this constraint, and it is live today. Columns already existed.
alter table public.organization_members
  add constraint organization_members_role_check
  check (role = any (array['owner', 'director', 'staff']));

-- 2. organization_member_locations: audit-trail columns + capability flag.
-- granted_by_user_id, granted_at, revoked_at already existed (cycle_7a foundation).
alter table public.organization_member_locations
  add column if not exists revoked_by_user_id uuid,
  add column if not exists revocation_reason text,
  add column if not exists can_create_cases boolean not null default false;

alter table public.organization_member_locations
  add constraint organization_member_locations_revoked_by_user_id_fkey
  foreign key (revoked_by_user_id) references auth.users(id) not valid;

-- Original (buggy) shape check -- see CONFIDENCE NOTE (a) above. Corrected four
-- minutes later by 20260817000843_phase_j_fix_revocation_shape_null_propagation.sql.
alter table public.organization_member_locations
  add constraint organization_member_locations_revocation_shape_check
  check (
    (revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
    or
    (revoked_at is not null and revoked_by_user_id is not null and revocation_reason <> '')
  );

-- 3. estate_access: audit-trail columns, additive. estate_access predates the
-- tracked migration history (see comment block above) -- only ALTERs, never a
-- fresh CREATE TABLE.
alter table public.estate_access
  add column if not exists granted_by_user_id uuid,
  add column if not exists expires_at timestamp with time zone,
  add column if not exists revoked_by_user_id uuid,
  add column if not exists revocation_reason text;

alter table public.estate_access
  add constraint estate_access_granted_by_user_id_fkey
  foreign key (granted_by_user_id) references auth.users(id) not valid;

alter table public.estate_access
  add constraint estate_access_revoked_by_user_id_fkey
  foreign key (revoked_by_user_id) references auth.users(id) not valid;

alter table public.estate_access
  add constraint estate_access_revocation_shape_check
  check (
    (status = 'revoked' and revoked_by_user_id is not null and revocation_reason is not null and length(btrim(revocation_reason)) > 0)
    or
    (status <> 'revoked' and revoked_by_user_id is null and revocation_reason is null)
  );

-- 4. Centralized case-creation authority check: owner/director (existing authority)
-- OR a staff member with an explicit can_create_cases grant at that location.
CREATE OR REPLACE FUNCTION passage_private.can_create_case_at_location(p_organization_id uuid, p_organization_location_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    passage_private.can_manage_location(p_organization_id, p_organization_location_id)
    or exists (
      select 1
      from public.organization_members as m
      join public.organization_member_locations as ml
        on ml.organization_member_id = m.id
      where m.organization_id = p_organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and m.role = 'staff'
        and ml.organization_location_id = p_organization_location_id
        and ml.revoked_at is null
        and ml.can_create_cases = true
    )
$function$;

-- 5. Director-only, idempotent staff case-creation grant/revoke RPC, with its own
-- append-only audit event (workflow_events, event_type='other'). NOTE: only the
-- passage_private (private-schema) version is created here -- the public.* wrapper
-- was NOT created by this migration. That omission is the real, documented bug:
-- "toggling a staff member's case-creation rights on /director/team has never
-- actually worked" (roadmap, "CRITICAL -- three RPC call sites were silently
-- broken in production"), fixed later by the already-committed
-- supabase/migrations/20260818070000_fix_missing_family_participant_rpcs.sql, which
-- adds public.set_staff_case_creation_grant_idempotent for the first time. Do not
-- add that wrapper here -- doing so would erase the very gap this history records.
CREATE OR REPLACE FUNCTION passage_private.set_staff_case_creation_grant_idempotent(p_organization_member_id uuid, p_organization_location_id uuid, p_granted boolean, p_request_id uuid, p_revocation_reason text DEFAULT NULL::text)
 RETURNS TABLE(organization_member_id uuid, organization_location_id uuid, can_create_cases boolean, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_target public.organization_member_locations%rowtype;
  v_target_member public.organization_members%rowtype;
  v_key text;
  v_existing_event public.workflow_events%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_organization_member_id is null or p_organization_location_id is null or p_request_id is null then
    raise exception 'A member, location, and request id are required' using errcode = '22023';
  end if;
  if not p_granted and length(btrim(coalesce(p_revocation_reason, ''))) = 0 then
    raise exception 'A reason is required to revoke case-creation rights' using errcode = '22023';
  end if;

  select m.* into v_target_member from public.organization_members as m where m.id = p_organization_member_id;
  if v_target_member.id is null or v_target_member.role <> 'staff' then
    raise exception 'Only staff members can hold this grant' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_target_member.organization_id, p_organization_location_id) then
    raise exception 'Director authority for this organization and location is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_target_member.organization_id);

  select ml.* into v_target
  from public.organization_member_locations as ml
  where ml.organization_member_id = p_organization_member_id
    and ml.organization_location_id = p_organization_location_id
  for update;

  if v_target.organization_member_id is null then
    raise exception 'That staff member is not assigned to this location' using errcode = '42501';
  end if;
  if v_target.revoked_at is not null then
    raise exception 'That location assignment has been revoked' using errcode = '42501';
  end if;

  v_key := 'staff_case_creation_grant:' || p_organization_member_id::text || ':' || p_organization_location_id::text || ':' || p_request_id::text;

  select e.* into v_existing_event from public.workflow_events as e
  where e.organization_id = v_target_member.organization_id and e.idempotency_key = v_key;
  if found then
    return query select p_organization_member_id, p_organization_location_id, v_target.can_create_cases, true;
    return;
  end if;

  if v_target.can_create_cases = p_granted then
    return query select v_target.organization_member_id, v_target.organization_location_id, v_target.can_create_cases, true;
    return;
  end if;

  update public.organization_member_locations as ml
  set can_create_cases = p_granted
  where ml.organization_member_id = p_organization_member_id
    and ml.organization_location_id = p_organization_location_id;

  insert into public.workflow_events (
    workflow_id, event_type, name, organization_id, organization_location_id,
    actor_user_id, actor_organization_member_id, invitation_id, idempotency_key,
    audience, previous_state, next_state, occurred_at, metadata
  ) values (
    null, 'other', case when p_granted then 'staff_case_creation.granted' else 'staff_case_creation.revoked' end,
    v_target_member.organization_id, p_organization_location_id,
    v_actor_user_id, v_actor_member_id, null, v_key,
    'organization_internal', case when p_granted then 'not_granted' else 'granted' end, case when p_granted then 'granted' else 'not_granted' end,
    pg_catalog.clock_timestamp(),
    pg_catalog.jsonb_build_object('target_organization_member_id', p_organization_member_id, 'reason', p_revocation_reason, 'event_kind', case when p_granted then 'staff_case_creation.granted' else 'staff_case_creation.revoked' end, 'proof_destination', 'organization_audit')
  )
  on conflict (organization_id, idempotency_key) where organization_id is not null and idempotency_key is not null
  do nothing;

  return query select p_organization_member_id, p_organization_location_id, p_granted, false;
end;
$function$;

-- 6. create_case_from_urgent_intake_idempotent updated to require the new
-- location-scoped case-creation authority instead of the old owner/director-only
-- can_manage_location gate. This is the actual fix for the bug that started
-- Phase J. See CONFIDENCE NOTE (b) above: no default-checklist seeding call yet.
CREATE OR REPLACE FUNCTION passage_private.create_case_from_urgent_intake_idempotent(p_urgent_intake_request_id uuid, p_expected_version integer, p_organization_location_id uuid, p_case_reference text, p_family_name text, p_request_id uuid)
 RETURNS TABLE(urgent_intake_request_id uuid, workflow_id uuid, status text, version integer, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  if v_request.claimed_organization_id is null or not passage_private.can_create_case_at_location(v_request.claimed_organization_id, p_organization_location_id) then
    raise exception 'Case-creation authority for this organization and location is required' using errcode = '42501';
  end if;
  v_member_id := passage_private.current_active_member_id(v_request.claimed_organization_id);
  if v_member_id is null then
    raise exception 'Active membership in this organization is required' using errcode = '42501';
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
