-- Harden public intake and abuse controls.
-- Lead intake must run through server APIs so validation, bot controls, and durable rate limits apply.

drop policy if exists "lead intake can create leads" on public.leads;
drop policy if exists "service role manages leads" on public.leads;

alter table if exists public.leads enable row level security;

create policy "service role manages leads"
  on public.leads
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

revoke all on table public.leads from anon;
revoke all on table public.leads from authenticated;
grant all on table public.leads to service_role;

create table if not exists public.rate_limit_buckets (
  key text primary key,
  count integer not null default 0 check (count >= 0),
  reset_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rate_limit_buckets enable row level security;

drop policy if exists "service role manages rate limit buckets" on public.rate_limit_buckets;

create policy "service role manages rate limit buckets"
  on public.rate_limit_buckets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

revoke all on table public.rate_limit_buckets from anon;
revoke all on table public.rate_limit_buckets from authenticated;
grant all on table public.rate_limit_buckets to service_role;

create index if not exists rate_limit_buckets_reset_at_idx on public.rate_limit_buckets(reset_at);