create table if not exists public.vendor_team_members (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  status text not null default 'invited' check (status in ('invited', 'active', 'inactive', 'revoked')),
  invited_by_user_id uuid,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, email)
);

create index if not exists vendor_team_members_vendor_idx
  on public.vendor_team_members(vendor_id, status);

create index if not exists vendor_team_members_email_idx
  on public.vendor_team_members(lower(email), status);

alter table public.vendor_team_members enable row level security;

drop policy if exists "service role manages vendor team members" on public.vendor_team_members;
create policy "service role manages vendor team members"
on public.vendor_team_members for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
