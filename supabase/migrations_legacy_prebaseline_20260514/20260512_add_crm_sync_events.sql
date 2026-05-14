create table if not exists public.crm_sync_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_type text not null,
  source_id text,
  email text,
  company_name text,
  hubspot_contact_id text,
  hubspot_company_id text,
  hubspot_deal_id text,
  status text not null default 'pending',
  error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_sync_events_source_idx on public.crm_sync_events(source, event_type, created_at desc);
create index if not exists crm_sync_events_status_idx on public.crm_sync_events(status, created_at desc);
create index if not exists crm_sync_events_email_idx on public.crm_sync_events(email);

alter table public.crm_sync_events enable row level security;
