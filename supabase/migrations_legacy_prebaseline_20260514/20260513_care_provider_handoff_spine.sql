create table if not exists public.care_provider_applications (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  provider_type text not null default 'hospice',
  contact_name text,
  contact_email text not null,
  contact_phone text,
  website text,
  locations_count text,
  active_families_estimate text,
  message text,
  source text default 'care_provider_page',
  status text not null default 'new' check (status in ('new','contacted','discovery','pilot_proposed','pilot_active','closed_won','closed_lost','archived')),
  hubspot_contact_id text,
  hubspot_company_id text,
  hubspot_deal_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_handoffs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.workflows(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  provider_type text not null check (provider_type in ('funeral_home','hospice','assisted_living','senior_living','home_care','care_facility','vendor','other')),
  source text not null default 'manual',
  status text not null default 'draft' check (status in ('draft','requested','family_invited','family_accepted','permission_granted','in_progress','handoff_ready','completed','declined','archived')),
  requested_by uuid references auth.users(id) on delete set null,
  family_contact_name text,
  family_contact_email text,
  family_contact_phone text,
  provider_name text,
  provider_contact_name text,
  provider_contact_email text,
  provider_contact_phone text,
  location_name text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  family_permission_status text not null default 'not_requested' check (family_permission_status in ('not_requested','requested','granted','declined','revoked')),
  urgency text default 'planning',
  care_context jsonb not null default '{}'::jsonb,
  next_expected_update text,
  proof_summary text,
  hubspot_company_id text,
  hubspot_deal_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_care_provider_applications_status on public.care_provider_applications(status, created_at desc);
create index if not exists idx_provider_handoffs_workflow on public.provider_handoffs(workflow_id, provider_type, status);
create index if not exists idx_provider_handoffs_org on public.provider_handoffs(organization_id, provider_type, status);

alter table public.care_provider_applications enable row level security;
alter table public.provider_handoffs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'care_provider_applications'
      and policyname = 'service role manages care provider applications'
  ) then
    create policy "service role manages care provider applications"
      on public.care_provider_applications
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_handoffs'
      and policyname = 'service role manages provider handoffs'
  ) then
    create policy "service role manages provider handoffs"
      on public.provider_handoffs
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

