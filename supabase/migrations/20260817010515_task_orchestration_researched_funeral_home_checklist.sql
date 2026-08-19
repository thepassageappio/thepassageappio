-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Researched 15-item funeral-home default checklist, seeded on every new case.
-- Creates passage_private.seed_default_case_tasks and wires it into the only
-- case-creation path that existed at this point in history
-- (create_case_from_urgent_intake_idempotent). Note: this function's name does not
-- contain "checklist" -- discovered via cross-reference with the app's call sites
-- (create_case_from_urgent_intake_idempotent and, later, create_case_manual_idempotent
-- both call passage_private.seed_default_case_tasks), not a pg_proc name-search hit.
--
-- Both function bodies verified live via pg_get_functiondef on 2026-08-19. Verified:
-- the immediately-prior migration
-- (20260817000443_phase_j_role_constraint_grant_audit_staff_case_creation.sql, this
-- backfill) has this same create_case_from_urgent_intake_idempotent WITHOUT the
-- seeding call, and the committed pre-Phase-J version
-- (supabase/migrations/20260816130000_fix_urgent_intake_case_creation.sql) also has
-- no seeding call -- so this migration is confidently where the wiring was added.
-- High confidence throughout.

CREATE OR REPLACE FUNCTION passage_private.seed_default_case_tasks(p_workflow_id uuid, p_organization_id uuid, p_organization_location_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_count integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  insert into public.tasks (workflow_id, organization_id, title, category, status, audience, version, due_at)
  select p_workflow_id, p_organization_id, item.title, item.category, 'assigned', 'case_team', 1, v_now + item.offset
  from (values
    ('Confirm decision-maker and authorized family contact', 'legal', interval '0 hours'),
    ('Provide the General Price List before discussing pricing (FTC Funeral Rule)', 'legal', interval '1 day'),
    ('Confirm death certification status and medical examiner involvement if applicable', 'medical', interval '0 hours'),
    ('Schedule the arrangement conference', 'service', interval '1 day'),
    ('Collect vital statistics for the death certificate', 'legal', interval '2 days'),
    ('Confirm pricing agreement and signed authorization with family', 'financial', interval '2 days'),
    ('Verify veteran status (DD-214) for military honors and VA benefit eligibility', 'government', interval '3 days'),
    ('Prepare obituary draft', 'memorial', interval '3 days'),
    ('File the death certificate with state vital records', 'legal', interval '3 days'),
    ('Obtain the burial-transit permit', 'legal', interval '4 days'),
    ('Order certified death certificate copies (10-15 typical)', 'legal', interval '5 days'),
    ('Coordinate with cemetery or crematory', 'logistics', interval '5 days'),
    ('Confirm clergy or celebrant if applicable', 'service', interval '5 days'),
    ('Finalize service logistics: visitation, funeral, transportation', 'logistics', interval '7 days'),
    ('Close out vendor invoices and finalize billing', 'financial', interval '14 days')
  ) as item(title, category, "offset");
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

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

  perform passage_private.seed_default_case_tasks(v_workflow_id, v_request.claimed_organization_id, p_organization_location_id);

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
