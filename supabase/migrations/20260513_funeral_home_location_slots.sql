alter table if exists public.funeral_home_partners
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists included_location_slots integer not null default 1,
  add column if not exists additional_location_fee_cents integer not null default 9900,
  add column if not exists active_case_limit integer,
  add column if not exists location_slots_status text not null default 'included';

create index if not exists funeral_home_partners_organization_id_idx
  on public.funeral_home_partners(organization_id);

alter table if exists public.organizations
  add column if not exists partner_plan text,
  add column if not exists included_location_slots integer not null default 1,
  add column if not exists additional_location_fee_cents integer not null default 9900,
  add column if not exists active_case_limit integer,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_subscription_id text;
