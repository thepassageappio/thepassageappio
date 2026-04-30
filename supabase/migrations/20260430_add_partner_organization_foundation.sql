create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'funeral_home',
  name text not null,
  slug text unique,
  logo_url text,
  primary_color text,
  support_email text,
  from_name text,
  white_label_enabled boolean not null default false,
  stripe_customer_id text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  email text not null,
  role text not null default 'staff',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

alter table public.workflows
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists organization_case_reference text,
  add column if not exists partner_created_by uuid;

create index if not exists organizations_slug_idx on public.organizations(slug);
create index if not exists organization_members_email_idx on public.organization_members(lower(email));
create index if not exists organization_members_org_idx on public.organization_members(organization_id);
create index if not exists workflows_organization_idx on public.workflows(organization_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "Organization members can view organizations" on public.organizations;
create policy "Organization members can view organizations" on public.organizations
for select using (
  auth.uid() is not null and (
    created_by = auth.uid()
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and coalesce(om.status, 'active') = 'active'
        and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
    )
  )
);

drop policy if exists "Organization owners can manage organizations" on public.organizations;
create policy "Organization owners can manage organizations" on public.organizations
for all using (
  auth.uid() is not null and (
    created_by = auth.uid()
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and coalesce(om.status, 'active') = 'active'
        and om.role in ('owner', 'admin')
        and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
    )
  )
) with check (
  auth.uid() is not null and (
    created_by = auth.uid()
    or exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and coalesce(om.status, 'active') = 'active'
        and om.role in ('owner', 'admin')
        and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
    )
  )
);

drop policy if exists "Organization members can view membership" on public.organization_members;
create policy "Organization members can view membership" on public.organization_members
for select using (
  auth.uid() is not null and exists (
    select 1 from public.organization_members om
    where om.organization_id = organization_members.organization_id
      and coalesce(om.status, 'active') = 'active'
      and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
  )
);

drop policy if exists "Organization admins can manage membership" on public.organization_members;
create policy "Organization admins can manage membership" on public.organization_members
for all using (
  auth.uid() is not null and exists (
    select 1 from public.organization_members om
    where om.organization_id = organization_members.organization_id
      and coalesce(om.status, 'active') = 'active'
      and om.role in ('owner', 'admin')
      and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
  )
) with check (
  auth.uid() is not null and exists (
    select 1 from public.organization_members om
    where om.organization_id = organization_members.organization_id
      and coalesce(om.status, 'active') = 'active'
      and om.role in ('owner', 'admin')
      and (om.user_id = auth.uid() or lower(om.email) = lower(auth.jwt() ->> 'email'))
  )
);
