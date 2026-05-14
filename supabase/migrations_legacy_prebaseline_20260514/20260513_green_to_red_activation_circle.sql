create table if not exists public.activation_witnesses (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  email text not null,
  name text,
  role text default 'activation_witness',
  source text default 'manual',
  source_id text,
  status text not null default 'active' check (status in ('active', 'removed')),
  invited_at timestamptz,
  last_notified_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workflow_id, email)
);

create table if not exists public.activation_requests (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  requested_by_user_id uuid references auth.users(id),
  requested_by_email text,
  requested_by_name text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'expired')),
  reason text,
  proof_source text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activation_confirmations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.activation_requests(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  witness_id uuid references public.activation_witnesses(id) on delete set null,
  confirmed_by_user_id uuid references auth.users(id),
  confirmed_by_email text not null,
  confirmed_by_name text,
  confirmation_role text default 'activation_witness',
  note text,
  created_at timestamptz not null default now(),
  unique(request_id, confirmed_by_email)
);

create index if not exists activation_witnesses_workflow_idx
  on public.activation_witnesses(workflow_id, status);

create index if not exists activation_requests_workflow_idx
  on public.activation_requests(workflow_id, status, created_at desc);

create index if not exists activation_confirmations_request_idx
  on public.activation_confirmations(request_id, created_at);

alter table public.activation_witnesses enable row level security;
alter table public.activation_requests enable row level security;
alter table public.activation_confirmations enable row level security;

drop policy if exists "activation witnesses visible to estate users" on public.activation_witnesses;
create policy "activation witnesses visible to estate users"
on public.activation_witnesses for select
using (
  exists (
    select 1 from public.workflows w
    where w.id = activation_witnesses.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
            and coalesce(ea.status, 'active') <> 'revoked'
        )
      )
  )
);

drop policy if exists "activation requests visible to estate users" on public.activation_requests;
create policy "activation requests visible to estate users"
on public.activation_requests for select
using (
  exists (
    select 1 from public.workflows w
    where w.id = activation_requests.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
            and coalesce(ea.status, 'active') <> 'revoked'
        )
        or exists (
          select 1 from public.activation_witnesses aw
          where aw.workflow_id = w.id
            and lower(aw.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
            and aw.status = 'active'
        )
      )
  )
);

drop policy if exists "activation confirmations visible to estate users" on public.activation_confirmations;
create policy "activation confirmations visible to estate users"
on public.activation_confirmations for select
using (
  exists (
    select 1 from public.workflows w
    where w.id = activation_confirmations.workflow_id
      and (
        w.user_id = auth.uid()
        or lower(w.coordinator_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        or exists (
          select 1 from public.estate_access ea
          where ea.workflow_id = w.id
            and (ea.user_id = auth.uid() or lower(ea.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
            and coalesce(ea.status, 'active') <> 'revoked'
        )
        or exists (
          select 1 from public.activation_witnesses aw
          where aw.workflow_id = w.id
            and lower(aw.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
            and aw.status = 'active'
        )
      )
  )
);
