create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  external_id text,
  provider_event_id text,
  workflow_id uuid,
  task_id uuid,
  action_id uuid,
  payload jsonb,
  status text not null default 'received',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists webhook_events_provider_event_uidx
  on public.webhook_events(provider, provider_event_id)
  where provider_event_id is not null;

create index if not exists webhook_events_external_idx
  on public.webhook_events(provider, external_id);

create index if not exists webhook_events_workflow_idx
  on public.webhook_events(workflow_id, created_at desc);

alter table public.webhook_events enable row level security;

drop policy if exists "Estate users can view webhook events" on public.webhook_events;
create policy "Estate users can view webhook events" on public.webhook_events
for select using (
  auth.uid() is not null and exists (
    select 1 from public.workflows w
    where w.id = webhook_events.workflow_id and w.user_id = auth.uid()
  )
  or auth.uid() is not null and exists (
    select 1 from public.estate_access ea
    where ea.workflow_id = webhook_events.workflow_id
      and lower(ea.email) = lower(auth.jwt() ->> 'email')
      and coalesce(ea.status, 'active') <> 'revoked'
  )
);

drop policy if exists "Service role can manage webhook events" on public.webhook_events;
create policy "Service role can manage webhook events" on public.webhook_events
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
