-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Multi-location support: lets a director/owner add a new organization_locations row
-- to their own organization, idempotently, with the same append-only audit-event shape
-- as every other write RPC in this codebase.
--
-- CONFIDENCE NOTE: the current live definition of this function (queried 2026-08-19)
-- gates additional locations against organizations.included_location_slots and
-- returns is_additional -- but that column, and the plan-gating logic, do not exist
-- yet at this point in history. Evidence: (a) grepping every committed migration for
-- "alter table public.organizations" and for "included_location_slots" finds no
-- column-creation statement anywhere in git; (b) this migration is immediately
-- followed 63 seconds later by 20260818022423_gate_additional_locations_on_upgrade.sql
-- -- a name that only makes sense if gating was not yet wired here. Reconstructed
-- below WITHOUT the plan-gating check (location_count/included_location_slots columns
-- in the return row hard-coded to reflect "not gated yet" via a simplified return
-- shape) -- medium confidence, not an independent live pull for this exact
-- intermediate shape, since production has since moved past it. The next migration's
-- CREATE OR REPLACE (the true current live version, high confidence) supersedes this
-- entirely.

CREATE OR REPLACE FUNCTION passage_private.create_organization_location_idempotent(p_organization_id uuid, p_name text, p_address text, p_city text, p_state text, p_zip text, p_request_id uuid)
 RETURNS TABLE(location_id uuid, location_count integer, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
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

  select (metadata ->> 'location_id')::uuid into v_existing_location_id
  from public.workflow_events
  where organization_id = p_organization_id and idempotency_key = v_key;
  if v_existing_location_id is not null then
    select count(*) into v_count from public.organization_locations where organization_id = p_organization_id;
    return query select v_existing_location_id, v_count, true;
    return;
  end if;

  insert into public.organization_locations (organization_id, name, address, city, state, zip)
  values (p_organization_id, btrim(p_name), nullif(btrim(coalesce(p_address, '')), ''), nullif(btrim(coalesce(p_city, '')), ''), nullif(btrim(coalesce(p_state, '')), ''), nullif(btrim(coalesce(p_zip, '')), ''))
  returning id into v_new_location_id;

  insert into public.organization_member_locations (organization_member_id, organization_location_id, granted_by_user_id)
  values (v_actor_member_id, v_new_location_id, v_actor_user_id);

  insert into public.workflow_events (workflow_id, event_type, name, organization_id, organization_location_id, actor_user_id, actor_organization_member_id, idempotency_key, audience, previous_state, next_state, occurred_at, metadata)
  values (null, 'other', 'organization_location.created', p_organization_id, v_new_location_id, v_actor_user_id, v_actor_member_id, v_key, 'organization_internal', null, 'created', pg_catalog.clock_timestamp(), jsonb_build_object('location_id', v_new_location_id, 'name', btrim(p_name)));

  select count(*) into v_count from public.organization_locations where organization_id = p_organization_id;
  return query select v_new_location_id, v_count, false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_organization_location_idempotent(p_organization_id uuid, p_name text, p_address text, p_city text, p_state text, p_zip text, p_request_id uuid)
 RETURNS TABLE(location_id uuid, location_count integer, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from passage_private.create_organization_location_idempotent(p_organization_id, p_name, p_address, p_city, p_state, p_zip, p_request_id) $function$;
