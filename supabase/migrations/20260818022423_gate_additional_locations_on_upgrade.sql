-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Fix/extension, 63 seconds after 20260818022320_create_organization_location_idempotent.sql:
-- gates additional locations on plan tier. Adds organizations.included_location_slots
-- (default 1) and organizations.additional_location_fee_cents (default 9900, i.e.
-- $99.00) -- verified: no committed migration ever creates public.organizations
-- (it predates the tracked migration history, same as estate_access/workflows) or
-- alters it to add these columns, and the only other reference to
-- included_location_slots anywhere in git is a comparison comment in
-- supabase/migrations/20260818040000_production_d2c_multi_estate.sql ("same
-- relationship as Company.number_of_locations to organizations.included_location_slots"),
-- not a column-creation statement -- so this migration is confidently where both
-- columns were added. Also re-issues create_organization_location_idempotent (both
-- schemas) to add the gate itself (v_count >= included_location_slots -> error code
-- 55001, "Your plan includes % location(s). Upgrade to add another.") plus the
-- location_count/included_location_slots/is_additional fields the frontend actually
-- reads (app/director/actions.ts's LocationReceipt type,
-- app/director/team/page.tsx's includedLocationSlots display, and the 55001 ->
-- "Upgrade required" branch in app/director/actions.ts line ~60 all depend on this
-- exact shape).
--
-- This exact current live definition is independently verified via pg_get_functiondef
-- on 2026-08-19 -- high confidence, not a reconstruction. It supersedes the previous
-- (ungated) migration entirely.

alter table public.organizations
  add column if not exists included_location_slots integer not null default 1,
  add column if not exists additional_location_fee_cents integer not null default 9900;

CREATE OR REPLACE FUNCTION passage_private.create_organization_location_idempotent(p_organization_id uuid, p_name text, p_address text, p_city text, p_state text, p_zip text, p_request_id uuid)
 RETURNS TABLE(location_id uuid, location_count integer, included_location_slots integer, is_additional boolean, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_org public.organizations%rowtype;
  v_existing_location_id uuid;
  v_new_location_id uuid;
  v_count integer;
  v_key text := 'org_location_create:' || p_request_id::text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_organization_id is null or p_request_id is null or nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception 'A location name is required' using errcode = '22023';
  end if;

  select m.id into v_actor_member_id
  from public.organization_members as m
  where m.organization_id = p_organization_id
    and m.user_id = v_actor_user_id
    and m.status = 'active'
    and m.role in ('owner', 'director');
  if v_actor_member_id is null then
    raise exception 'Director authority for this organization is required' using errcode = '42501';
  end if;

  select o.* into v_org from public.organizations as o where o.id = p_organization_id;

  select (metadata ->> 'location_id')::uuid into v_existing_location_id
  from public.workflow_events
  where organization_id = p_organization_id and idempotency_key = v_key;
  if v_existing_location_id is not null then
    select count(*) into v_count from public.organization_locations where organization_id = p_organization_id;
    return query select v_existing_location_id, v_count, v_org.included_location_slots, v_count > v_org.included_location_slots, true;
    return;
  end if;

  select count(*) into v_count from public.organization_locations where organization_id = p_organization_id;
  if v_count >= coalesce(v_org.included_location_slots, 1) then
    raise exception 'Your plan includes % location(s). Upgrade to add another.', v_org.included_location_slots using errcode = '55001';
  end if;

  insert into public.organization_locations (organization_id, name, address, city, state, zip)
  values (p_organization_id, btrim(p_name), nullif(btrim(coalesce(p_address, '')), ''), nullif(btrim(coalesce(p_city, '')), ''), nullif(btrim(coalesce(p_state, '')), ''), nullif(btrim(coalesce(p_zip, '')), ''))
  returning id into v_new_location_id;

  insert into public.organization_member_locations (organization_member_id, organization_location_id, granted_by_user_id)
  values (v_actor_member_id, v_new_location_id, v_actor_user_id);

  insert into public.workflow_events (workflow_id, event_type, name, organization_id, organization_location_id, actor_user_id, actor_organization_member_id, idempotency_key, audience, previous_state, next_state, occurred_at, metadata)
  values (null, 'other', 'organization_location.created', p_organization_id, v_new_location_id, v_actor_user_id, v_actor_member_id, v_key, 'organization_internal', null, 'created', pg_catalog.clock_timestamp(), jsonb_build_object('location_id', v_new_location_id, 'name', btrim(p_name)));

  select count(*) into v_count from public.organization_locations where organization_id = p_organization_id;
  return query select v_new_location_id, v_count, v_org.included_location_slots, false, false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_organization_location_idempotent(p_organization_id uuid, p_name text, p_address text, p_city text, p_state text, p_zip text, p_request_id uuid)
 RETURNS TABLE(location_id uuid, location_count integer, included_location_slots integer, is_additional boolean, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from passage_private.create_organization_location_idempotent(p_organization_id, p_name, p_address, p_city, p_state, p_zip, p_request_id) $function$;
