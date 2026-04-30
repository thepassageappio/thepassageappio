alter table public.task_status_events
  add column if not exists provider text,
  add column if not exists provider_message_id text,
  add column if not exists provider_event_id text;

alter table public.tasks
  add column if not exists reminder_4h_sent_at timestamptz,
  add column if not exists reminder_24h_sent_at timestamptz;

alter table public.workflow_actions
  add column if not exists reminder_4h_sent_at timestamptz,
  add column if not exists reminder_24h_sent_at timestamptz;

create unique index if not exists task_status_events_provider_event_uidx
  on public.task_status_events(provider, provider_event_id)
  where provider_event_id is not null;

create index if not exists tasks_status_last_action_idx
  on public.tasks(status, last_action_at desc);

create index if not exists tasks_last_action_idx
  on public.tasks(last_action_at desc);

create index if not exists task_status_events_task_idx
  on public.task_status_events(task_id, last_action_at desc);

create index if not exists task_status_events_workflow_idx
  on public.task_status_events(workflow_id, last_action_at desc);

create index if not exists workflow_actions_status_last_action_idx
  on public.workflow_actions(status, last_action_at desc);
