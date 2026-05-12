create table if not exists public.funeral_home_requests (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.workflows(id) on delete cascade,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  requested_by_email text,
  requested_by_name text,
  requested_provider_name text not null,
  place_id text,
  address text,
  city text,
  state text,
  zip text,
  country text,
  phone text,
  website text,
  maps_url text,
  matched_organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'requested' check (status in (
    'requested',
    'matched_partner',
    'partner_notified',
    'outreach_needed',
    'accepted',
    'declined',
    'converted',
    'archived'
  )),
  urgency text not null default 'normal' check (urgency in ('urgent', 'soon', 'normal', 'planning')),
  source text not null default 'estate',
  relationship text not null default 'family_requested',
  family_permission_to_contact boolean not null default true,
  notes text,
  estimated_case_value numeric,
  requested_at timestamptz not null default now(),
  partner_notified_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists funeral_home_requests_workflow_idx on public.funeral_home_requests(workflow_id);
create index if not exists funeral_home_requests_partner_idx on public.funeral_home_requests(matched_organization_id, status, requested_at desc);
create index if not exists funeral_home_requests_status_idx on public.funeral_home_requests(status, requested_at desc);
create index if not exists funeral_home_requests_place_idx on public.funeral_home_requests(place_id);

alter table public.funeral_home_requests enable row level security;

drop policy if exists "Families can see funeral home requests for their workflows" on public.funeral_home_requests;
create policy "Families can see funeral home requests for their workflows"
on public.funeral_home_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.workflows w
    where w.id = funeral_home_requests.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(coalesce(w.coordinator_email, '')) = lower(coalesce(auth.email(), ''))
      )
  )
);

drop policy if exists "Families can create funeral home requests for their workflows" on public.funeral_home_requests;
create policy "Families can create funeral home requests for their workflows"
on public.funeral_home_requests
for insert
to authenticated
with check (
  requested_by_user_id = auth.uid()
  and exists (
    select 1
    from public.workflows w
    where w.id = funeral_home_requests.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(coalesce(w.coordinator_email, '')) = lower(coalesce(auth.email(), ''))
      )
  )
);

drop policy if exists "Partner members can see matched funeral home requests" on public.funeral_home_requests;
create policy "Partner members can see matched funeral home requests"
on public.funeral_home_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = funeral_home_requests.matched_organization_id
      and (
        om.user_id = auth.uid()
        or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), ''))
      )
      and coalesce(om.status, 'active') = 'active'
  )
);

drop policy if exists "Partner members can update matched funeral home requests" on public.funeral_home_requests;
create policy "Partner members can update matched funeral home requests"
on public.funeral_home_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = funeral_home_requests.matched_organization_id
      and (
        om.user_id = auth.uid()
        or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), ''))
      )
      and coalesce(om.status, 'active') = 'active'
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = funeral_home_requests.matched_organization_id
      and (
        om.user_id = auth.uid()
        or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), ''))
      )
      and coalesce(om.status, 'active') = 'active'
  )
);
