create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  category text not null check (category in (
    'florist',
    'catering',
    'memorial_printing',
    'travel_lodging',
    'transportation',
    'clergy_officiant',
    'venue',
    'legal_estate_support',
    'cemetery_monument',
    'grief_support'
  )),
  short_description text,
  zip_codes_served text[] not null default '{}',
  rush_supported boolean not null default false,
  rush_window_hours integer,
  planned_supported boolean not null default true,
  contact_email text,
  contact_phone text,
  website text,
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive', 'rejected')),
  marketplace_fee_percent numeric(5,2),
  passage_rev_share_percent numeric(5,2),
  funeral_home_rev_share_percent numeric(5,2),
  estimated_transaction_value numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funeral_home_preferred_vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  category text not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, vendor_id, category)
);

create table if not exists public.vendor_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete set null,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  task_title text,
  organization_id uuid references public.organizations(id) on delete set null,
  requested_by_user_id uuid,
  requested_by_email text,
  requested_by_name text,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'declined', 'completed')),
  urgency text not null default 'planned' check (urgency in ('rush', 'planned')),
  referral_source text not null default 'passage' check (referral_source in ('funeral_home', 'passage', 'user')),
  response_token uuid not null default gen_random_uuid(),
  request_note text,
  vendor_note text,
  marketplace_fee_percent numeric(5,2),
  passage_rev_share_percent numeric(5,2),
  funeral_home_rev_share_percent numeric(5,2),
  estimated_transaction_value numeric(10,2),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (response_token)
);

create index if not exists vendors_category_status_idx on public.vendors(category, status);
create index if not exists vendors_zip_codes_served_gin_idx on public.vendors using gin(zip_codes_served);
create index if not exists funeral_home_preferred_vendors_org_category_idx on public.funeral_home_preferred_vendors(organization_id, category, active);
create index if not exists vendor_requests_workflow_status_idx on public.vendor_requests(workflow_id, status, requested_at desc);
create index if not exists vendor_requests_vendor_status_idx on public.vendor_requests(vendor_id, status, requested_at desc);
create index if not exists vendor_requests_org_status_idx on public.vendor_requests(organization_id, status, requested_at desc);

alter table public.vendors enable row level security;
alter table public.funeral_home_preferred_vendors enable row level security;
alter table public.vendor_requests enable row level security;

drop policy if exists "active vendors visible to signed in users" on public.vendors;
create policy "active vendors visible to signed in users"
on public.vendors for select
to authenticated
using (status = 'active');

drop policy if exists "service role manages vendors" on public.vendors;
create policy "service role manages vendors"
on public.vendors for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "org staff view preferred vendors" on public.funeral_home_preferred_vendors;
create policy "org staff view preferred vendors"
on public.funeral_home_preferred_vendors for select
to authenticated
using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = funeral_home_preferred_vendors.organization_id
      and coalesce(om.status, 'active') = 'active'
      and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
  )
);

drop policy if exists "org admins manage preferred vendors" on public.funeral_home_preferred_vendors;
create policy "org admins manage preferred vendors"
on public.funeral_home_preferred_vendors for all
to authenticated
using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = funeral_home_preferred_vendors.organization_id
      and coalesce(om.status, 'active') = 'active'
      and om.role in ('owner', 'admin')
      and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
  )
)
with check (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = funeral_home_preferred_vendors.organization_id
      and coalesce(om.status, 'active') = 'active'
      and om.role in ('owner', 'admin')
      and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
  )
);

drop policy if exists "service role manages preferred vendors" on public.funeral_home_preferred_vendors;
create policy "service role manages preferred vendors"
on public.funeral_home_preferred_vendors for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "estate users view vendor requests" on public.vendor_requests;
create policy "estate users view vendor requests"
on public.vendor_requests for select
to authenticated
using (
  exists (
    select 1 from public.workflows w
    where w.id = vendor_requests.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(auth.jwt() ->> 'email')
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and coalesce(ea.status, 'active') <> 'revoked'
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(auth.jwt() ->> 'email'))
        )
        or exists (
          select 1 from public.organization_members om
          where om.organization_id = w.organization_id
            and coalesce(om.status, 'active') = 'active'
            and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
        )
      )
  )
);

drop policy if exists "service role manages vendor requests" on public.vendor_requests;
create policy "service role manages vendor requests"
on public.vendor_requests for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
