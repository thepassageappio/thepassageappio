-- Phase I stage 2: quote approval triggers payment, verification triggers
-- vendor payout -- both automatic via Stripe, no manual money handling by
-- anyone at Passage. Founder decision (2026-08-16): payment is captured at
-- quote approval (not job completion) and held until verification, then
-- released to the vendor minus the 12% platform fee.
--
-- New state: 'quoted' sits between the vendor's response and 'in_progress'.
-- A vendor proposing a price now lands in 'quoted' (previously went straight
-- to 'in_progress'); a director approving that quote redirects to a Stripe
-- Checkout Session for the exact amount, and the webhook (not this
-- migration -- see app/api/webhooks/stripe/route.ts) moves 'quoted' ->
-- 'in_progress' once payment is confirmed. Verification (unchanged RPC)
-- still moves 'proof_submitted' -> 'verified'; the director's server action
-- then creates a Stripe Transfer to the vendor's Connect account for
-- (quote_amount_cents - platform_fee_cents), retried automatically if the
-- transfer step fails without needing to redo verification.

alter table public.partner_requests drop constraint if exists partner_requests_status_check;
alter table public.partner_requests add constraint partner_requests_status_check check (
  status in ('sent', 'quoted', 'in_progress', 'declined', 'proof_submitted', 'verified')
);

alter table public.partner_requests
  add column if not exists quoted_at timestamptz,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_transfer_id text,
  add column if not exists platform_fee_cents integer check (platform_fee_cents is null or platform_fee_cents >= 0),
  add column if not exists vendor_payout_cents integer check (vendor_payout_cents is null or vendor_payout_cents >= 0),
  add column if not exists payment_captured_at timestamptz,
  add column if not exists payout_released_at timestamptz;

-- Vendor's accept-with-a-quote action now lands in 'quoted', not
-- 'in_progress' -- a surprise charge the instant a vendor names a price
-- would not be real director acceptance. quoted_at replaces started_at
-- here; started_at is now set when payment is actually captured.
create or replace function passage_private.respond_to_partner_request_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_decision text,
  p_quote_amount_cents integer,
  p_note text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_partner_member public.partner_members%rowtype;
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
  v_next_status text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null
     or p_expected_version is null or p_expected_version < 1
     or p_decision is null or p_decision not in ('accept', 'decline')
     or (p_decision = 'accept' and (p_quote_amount_cents is null or p_quote_amount_cents < 0))
     or (p_decision = 'decline' and (v_note is null or length(v_note) > 500)) then
    raise exception 'Valid response and version are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;

  select pm.* into v_partner_member from public.partner_members as pm
  where pm.partner_organization_id = v_request.partner_organization_id
    and pm.user_id = v_actor_user_id and pm.status = 'active';
  if v_partner_member.id is null then
    raise exception 'Vendor authority for this request is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_respond:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Request changed before your response was saved' using errcode = '40001';
  end if;
  if v_request.status <> 'sent' then
    raise exception 'This request is no longer waiting for a response' using errcode = '55000';
  end if;

  v_next_status := case when p_decision = 'accept' then 'quoted' else 'declined' end;

  update public.partner_requests as pr set
    status = v_next_status,
    version = pr.version + 1,
    quote_amount_cents = case when p_decision = 'accept' then p_quote_amount_cents else pr.quote_amount_cents end,
    response_note = case when p_decision = 'accept' then v_note else pr.response_note end,
    decline_reason = case when p_decision = 'decline' then v_note else pr.decline_reason end,
    responded_at = pg_catalog.clock_timestamp(),
    quoted_at = case when p_decision = 'accept' then pg_catalog.clock_timestamp() else pr.quoted_at end,
    updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_partner_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_partner_member.id,
    case when p_decision = 'accept' then 'partner_request.quoted' else 'partner_request.declined' end,
    'sent', v_next_status, v_key,
    pg_catalog.jsonb_build_object('version', v_request.version + 1, 'quote_amount_cents', p_quote_amount_cents, 'note', coalesce(v_note, ''))
  );

  return query select v_request.id, v_next_status, v_request.version + 1, false;
end
$function$;

create or replace function public.respond_to_partner_request_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_decision text,
  p_quote_amount_cents integer,
  p_note text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.respond_to_partner_request_idempotent(
    p_partner_request_id, p_expected_version, p_decision, p_quote_amount_cents, p_note, p_request_id
  )
$$;

-- Director declines a priced quote outright (distinct from the vendor's own
-- decline in respond_to_partner_request_idempotent) -- a director is never
-- obligated to pay a quote just because one was sent.
create or replace function passage_private.reject_partner_quote_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_reason text,
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
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null or p_expected_version is null or p_expected_version < 1
     or v_reason is null or length(v_reason) > 500 then
    raise exception 'A reason and valid version are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_request.organization_id, v_request.organization_location_id) then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_request.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_reject_quote:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'This quote changed before it was declined' using errcode = '40001';
  end if;
  if v_request.status <> 'quoted' then
    raise exception 'This request is not a quote waiting for approval' using errcode = '55000';
  end if;

  update public.partner_requests as pr set
    status = 'declined', version = pr.version + 1, decline_reason = v_reason, updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_organization_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_actor_member_id, 'partner_request.quote_declined',
    'quoted', 'declined', v_key, pg_catalog.jsonb_build_object('version', v_request.version + 1, 'reason', v_reason)
  );

  return query select v_request.id, 'declined'::text, v_request.version + 1, false;
end
$function$;

create or replace function public.reject_partner_quote_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_reason text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.reject_partner_quote_idempotent(
    p_partner_request_id, p_expected_version, p_reason, p_request_id
  )
$$;

-- Records the outcome of an automatic Stripe Transfer to the vendor once a
-- request is verified. Called by the director's own server action right
-- after the transfer succeeds -- separated from verify_partner_request_idempotent
-- itself so a transient Stripe failure never blocks the (already-durable)
-- verification from being recorded, and so the transfer can be retried
-- independently without redoing verification.
create or replace function passage_private.record_partner_request_payout_idempotent(
  p_partner_request_id uuid,
  p_stripe_transfer_id text,
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
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null
     or nullif(btrim(coalesce(p_stripe_transfer_id, '')), '') is null then
    raise exception 'A transfer id is required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_request.organization_id, v_request.organization_location_id) then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_request.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_payout:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_request.status, v_request.version, true;
    return;
  end if;

  if v_request.status <> 'verified' then
    raise exception 'Only a verified request can record a payout' using errcode = '55000';
  end if;
  if v_request.payout_released_at is not null then
    return query select v_request.id, v_request.status, v_request.version, true;
    return;
  end if;

  update public.partner_requests as pr set
    stripe_transfer_id = p_stripe_transfer_id,
    payout_released_at = pg_catalog.clock_timestamp(),
    version = pr.version + 1,
    updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_organization_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_actor_member_id, 'partner_request.payout_released',
    'verified', 'verified', v_key, pg_catalog.jsonb_build_object('version', v_request.version + 1, 'stripe_transfer_id', p_stripe_transfer_id)
  );

  return query select v_request.id, 'verified'::text, v_request.version + 1, false;
end
$function$;

create or replace function public.record_partner_request_payout_idempotent(
  p_partner_request_id uuid,
  p_stripe_transfer_id text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.record_partner_request_payout_idempotent(
    p_partner_request_id, p_stripe_transfer_id, p_request_id
  )
$$;

revoke all on function passage_private.reject_partner_quote_idempotent(uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function passage_private.record_partner_request_payout_idempotent(uuid, text, uuid) from public, anon, authenticated;

revoke all on function public.reject_partner_quote_idempotent(uuid, integer, text, uuid) from public, anon;
revoke all on function public.record_partner_request_payout_idempotent(uuid, text, uuid) from public, anon;

grant execute on function public.reject_partner_quote_idempotent(uuid, integer, text, uuid) to authenticated;
grant execute on function public.record_partner_request_payout_idempotent(uuid, text, uuid) to authenticated;
