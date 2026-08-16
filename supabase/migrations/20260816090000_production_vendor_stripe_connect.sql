-- Phase I stage 1: vendor Stripe Connect onboarding infrastructure.
--
-- Founder decisions (2026-08-16): payment for a vendor order is captured at
-- quote-approval time and held until the vendor's proof is verified, then
-- released minus a 12% platform fee (stage 2, not built here). A vendor
-- cannot receive any requests at all until they have completed Stripe
-- Connect onboarding -- this migration is what makes that gate possible.

alter table public.partner_organizations
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_charges_enabled boolean not null default false,
  add column if not exists stripe_connect_payouts_enabled boolean not null default false,
  add column if not exists stripe_connect_details_submitted boolean not null default false;

create unique index partner_organizations_stripe_connect_account_unique
  on public.partner_organizations (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

-- One-time account linkage: a vendor owner starts Connect onboarding, the
-- server action creates the Stripe Express account, and this records the
-- resulting account id against their organization. Refuses to silently
-- overwrite an existing different account id (would orphan whatever the
-- first account was).
create or replace function passage_private.create_partner_connect_account_idempotent(
  p_partner_organization_id uuid,
  p_stripe_connect_account_id text
)
returns table (stripe_connect_account_id text, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_org public.partner_organizations%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.partner_members as m
    where m.partner_organization_id = p_partner_organization_id
      and m.user_id = v_actor and m.status = 'active' and m.role = 'owner'
  ) then
    raise exception 'Vendor owner authority is required' using errcode = '42501';
  end if;
  if nullif(btrim(coalesce(p_stripe_connect_account_id, '')), '') is null then
    raise exception 'A Stripe Connect account id is required' using errcode = '22023';
  end if;

  select * into v_org from public.partner_organizations where id = p_partner_organization_id for update;
  if v_org.stripe_connect_account_id is not null then
    if v_org.stripe_connect_account_id is distinct from p_stripe_connect_account_id then
      raise exception 'This vendor already has a different payout account on file' using errcode = '23505';
    end if;
    return query select v_org.stripe_connect_account_id, true;
    return;
  end if;

  update public.partner_organizations
  set stripe_connect_account_id = p_stripe_connect_account_id, updated_at = pg_catalog.clock_timestamp()
  where id = p_partner_organization_id;

  return query select p_stripe_connect_account_id, false;
end
$function$;

-- Self-service status refresh, called by the vendor's own return-from-Stripe
-- page load (so status is current the moment they land back, not stale until
-- the account.updated webhook arrives) -- resolves "my org" from the caller's
-- own active owner membership, no organization id taken as input.
create or replace function passage_private.sync_own_partner_connect_status(
  p_charges_enabled boolean,
  p_payouts_enabled boolean,
  p_details_submitted boolean
)
returns table (partner_organization_id uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_org_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select m.partner_organization_id into v_org_id
  from public.partner_members as m
  where m.user_id = v_actor and m.status = 'active' and m.role = 'owner'
  limit 1;
  if v_org_id is null then
    raise exception 'Vendor owner authority is required' using errcode = '42501';
  end if;

  update public.partner_organizations
  set stripe_connect_charges_enabled = p_charges_enabled,
      stripe_connect_payouts_enabled = p_payouts_enabled,
      stripe_connect_details_submitted = p_details_submitted,
      updated_at = pg_catalog.clock_timestamp()
  where id = v_org_id;

  return query select v_org_id;
end
$function$;

create or replace function public.create_partner_connect_account_idempotent(
  p_partner_organization_id uuid, p_stripe_connect_account_id text
)
returns table (stripe_connect_account_id text, replayed boolean)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.create_partner_connect_account_idempotent(p_partner_organization_id, p_stripe_connect_account_id)
$function$;

create or replace function public.sync_own_partner_connect_status(
  p_charges_enabled boolean, p_payouts_enabled boolean, p_details_submitted boolean
)
returns table (partner_organization_id uuid)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.sync_own_partner_connect_status(p_charges_enabled, p_payouts_enabled, p_details_submitted)
$function$;

revoke all on function passage_private.create_partner_connect_account_idempotent(uuid, text) from public, anon, authenticated, service_role;
revoke all on function passage_private.sync_own_partner_connect_status(boolean, boolean, boolean) from public, anon, authenticated, service_role;
grant execute on function passage_private.create_partner_connect_account_idempotent(uuid, text) to authenticated;
grant execute on function passage_private.sync_own_partner_connect_status(boolean, boolean, boolean) to authenticated;

revoke all on function public.create_partner_connect_account_idempotent(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.sync_own_partner_connect_status(boolean, boolean, boolean) from public, anon, authenticated, service_role;
grant execute on function public.create_partner_connect_account_idempotent(uuid, text) to authenticated;
grant execute on function public.sync_own_partner_connect_status(boolean, boolean, boolean) to authenticated;
