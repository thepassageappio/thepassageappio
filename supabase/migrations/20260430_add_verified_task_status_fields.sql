alter table public.tasks
  add column if not exists last_action_at timestamptz,
  add column if not exists last_actor text,
  add column if not exists channel text,
  add column if not exists recipient text,
  add column if not exists delivered_at timestamptz,
  add column if not exists acknowledged_at timestamptz;

alter table public.workflow_actions
  add column if not exists last_action_at timestamptz,
  add column if not exists last_actor text,
  add column if not exists channel text,
  add column if not exists recipient text,
  add column if not exists acknowledged_at timestamptz;

create table if not exists public.task_status_events (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid,
  task_id uuid,
  action_id uuid,
  status text not null,
  last_action_at timestamptz not null default now(),
  last_actor text,
  channel text,
  recipient text,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.task_status_events enable row level security;

drop policy if exists "Estate users can view task status events" on public.task_status_events;
create policy "Estate users can view task status events" on public.task_status_events
for select using (
  auth.uid() is not null and exists (
    select 1 from public.workflows w
    where w.id = task_status_events.workflow_id and w.user_id = auth.uid()
  )
  or auth.uid() is not null and exists (
    select 1 from public.estate_access ea
    where ea.workflow_id = task_status_events.workflow_id
      and lower(ea.email) = lower(auth.jwt() ->> 'email')
      and coalesce(ea.status, 'active') <> 'revoked'
  )
);

drop policy if exists "Service role can manage task status events" on public.task_status_events;
create policy "Service role can manage task status events" on public.task_status_events
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
