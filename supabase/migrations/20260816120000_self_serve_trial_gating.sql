-- Self-serve trial gating (2026-08-16, founder decision): a self-serve or
-- admin-bootstrapped funeral-home organization (no stripe_subscription_id --
-- distinct from a B2B-checkout auto-provisioned org, which always has one)
-- gets 90 days of full access from organizations.created_at. After that,
-- it is never locked out entirely -- it drops to a capped free tier (one
-- active case at a time, no new vendor marketplace requests) so the
-- relationship and the CRM trail stay alive rather than the org just
-- disappearing. A paying org (stripe_subscription_id is not null) is never
-- gated by this mechanism regardless of age.

create or replace function passage_private.can_use_gated_features(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizations as o
    where o.id = p_organization_id
      and (o.stripe_subscription_id is not null or o.created_at >= (pg_catalog.clock_timestamp() - interval '90 days'))
  )
$$;

create or replace function public.can_use_gated_features(p_organization_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select passage_private.can_use_gated_features(p_organization_id)
$$;

-- Backs a trial-status banner in the director UI -- shows the countdown
-- before the gate takes effect, or that the org is already gated/paid.
create or replace function passage_private.organization_trial_status(p_organization_id uuid)
returns table (is_gated boolean, is_paid boolean, trial_ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    not (o.stripe_subscription_id is not null or o.created_at >= (pg_catalog.clock_timestamp() - interval '90 days')),
    o.stripe_subscription_id is not null,
    o.created_at + interval '90 days'
  from public.organizations as o
  where o.id = p_organization_id
$$;

create or replace function public.organization_trial_status(p_organization_id uuid)
returns table (is_gated boolean, is_paid boolean, trial_ends_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from passage_private.organization_trial_status(p_organization_id)
$$;

revoke all on function passage_private.can_use_gated_features(uuid) from public, anon, authenticated;
revoke all on function passage_private.organization_trial_status(uuid) from public, anon, authenticated;
revoke all on function public.can_use_gated_features(uuid) from public, anon;
revoke all on function public.organization_trial_status(uuid) from public, anon;
grant execute on function public.can_use_gated_features(uuid) to authenticated;
grant execute on function public.organization_trial_status(uuid) to authenticated;

-- create_case_from_urgent_intake_idempotent: the only place a case is
-- created in production today (case creation is always via claiming an
-- urgent intake request -- no standalone "new case" path exists yet).
-- Gate added right after the existing "not ready for a case yet" check,
-- before the insert -- errcode '55001' distinguishes it from the existing
-- '55000' ("not ready") so the frontend can show an upgrade message
-- instead of a generic conflict.
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

-- create_partner_request_idempotent: same gate, applied right after
-- director-authority is confirmed and before the vendor lookup.
create or replace function passage_private.create_partner_request_idempotent(
  p_workflow_id uuid,
  p_partner_organization_id uuid,
  p_category text,
  p_title text,
  p_details text,
  p_needed_by timestamptz,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_workflow public.workflows%rowtype;
  v_partner_org public.partner_organizations%rowtype;
  v_existing public.partner_requests%rowtype;
  v_new_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_workflow_id is null or p_partner_organization_id is null or p_request_id is null
     or p_category is null or p_category not in ('florist', 'caterer', 'restaurant', 'cemetery', 'transport', 'printer_stationery', 'memorial_products', 'other')
     or length(btrim(coalesce(p_title, ''))) not between 1 and 200
     or length(btrim(coalesce(p_details, ''))) not between 1 and 2000 then
    raise exception 'Valid request details are required' using errcode = '22023';
  end if;

  select w.* into v_workflow from public.workflows as w where w.id = p_workflow_id;
  if v_workflow.id is null then
    raise exception 'Case is unavailable' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_workflow.organization_id, v_workflow.organization_location_id) then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_workflow.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;

  if not passage_private.can_use_gated_features(v_workflow.organization_id) then
    raise exception 'Your 90-day trial has ended. Upgrade to send vendor requests.' using errcode = '55001';
  end if;

  select po.* into v_partner_org from public.partner_organizations as po
  where po.id = p_partner_organization_id and po.status = 'active';
  if v_partner_org.id is null then
    raise exception 'Vendor is unavailable' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_workflow.organization_id::text || ':partner_request_create:' || p_request_id::text, 0)
  );

  select r.* into v_existing from public.partner_requests as r
  where r.organization_id = v_workflow.organization_id and r.creation_request_id = p_request_id;
  if found then
    if v_existing.workflow_id is distinct from p_workflow_id
       or v_existing.partner_organization_id is distinct from p_partner_organization_id
       or v_existing.category is distinct from p_category
       or v_existing.title is distinct from btrim(p_title)
       or v_existing.details is distinct from btrim(p_details) then
      raise exception 'Request conflicts with an earlier command' using errcode = '22023';
    end if;
    return query select v_existing.id, v_existing.status, v_existing.version, true;
    return;
  end if;

  insert into public.partner_requests (
    organization_id, organization_location_id, workflow_id, partner_organization_id,
    created_by_organization_member_id, category, title, details, needed_by,
    status, version, creation_request_id, sent_at
  ) values (
    v_workflow.organization_id, v_workflow.organization_location_id, v_workflow.id, p_partner_organization_id,
    v_actor_member_id, p_category, btrim(p_title), btrim(p_details), p_needed_by,
    'sent', 1, p_request_id, pg_catalog.clock_timestamp()
  ) returning id into v_new_id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_organization_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_new_id, v_workflow.organization_id, p_partner_organization_id,
    v_actor_user_id, v_actor_member_id, 'partner_request.sent', null, 'sent',
    'partner_request_create:' || p_request_id::text,
    pg_catalog.jsonb_build_object('category', p_category, 'title', btrim(p_title))
  );

  return query select v_new_id, 'sent'::text, 1, false;
end
$function$;

create or replace function public.create_partner_request_idempotent(
  p_workflow_id uuid,
  p_partner_organization_id uuid,
  p_category text,
  p_title text,
  p_details text,
  p_needed_by timestamptz,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.create_partner_request_idempotent(
    p_workflow_id, p_partner_organization_id, p_category, p_title, p_details, p_needed_by, p_request_id
  )
$$;
