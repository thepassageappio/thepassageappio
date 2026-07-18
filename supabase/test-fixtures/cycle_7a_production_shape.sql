-- TEST-ONLY Cycle 7A production-shape fixture.
--
-- This file exists only to give the isolated Supabase safety-lab project the
-- minimum legacy relations that the Cycle 7A additive migration expects.
-- It is synthetic scaffolding: it is not a production dump, branch copy,
-- backup, demo-instance seed, or proof that production data will migrate.
-- Apply it only to the isolated test project before applying the Cycle 7A
-- migration. Never apply it to production.

create table public.organizations (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.organization_locations (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  status text not null default 'active',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.organization_members (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid,
  email text not null,
  role text not null,
  status text not null default 'active',
  display_name text,
  title text,
  location_scope text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.workflows (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id),
  organization_id uuid references public.organizations(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.workflow_events (
  id uuid primary key default extensions.gen_random_uuid(),
  workflow_id uuid references public.workflows(id),
  event_type text not null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.organizations enable row level security;
alter table public.organization_locations enable row level security;
alter table public.organization_members enable row level security;
alter table public.workflows enable row level security;
alter table public.tasks enable row level security;
alter table public.workflow_events enable row level security;

-- Supabase projects may have default privileges that expose new public tables
-- to Data API roles. Keep this synthetic baseline explicitly fail-closed.
revoke all on table public.organizations from public, anon, authenticated;
revoke all on table public.organization_locations from public, anon, authenticated;
revoke all on table public.organization_members from public, anon, authenticated;
revoke all on table public.workflows from public, anon, authenticated;
revoke all on table public.tasks from public, anon, authenticated;
revoke all on table public.workflow_events from public, anon, authenticated;

-- Deliberately no permissive legacy policies or table grants are installed.
-- The Cycle 7A migration does not depend on them, and a blank RLS policy set
-- keeps this safety-lab baseline fail-closed.
--
-- Deliberately no auth.users rows are inserted. Supabase Auth owns that table;
-- persona fixtures must create users through supported Auth tooling before
-- exercising authenticated invitation acceptance.
