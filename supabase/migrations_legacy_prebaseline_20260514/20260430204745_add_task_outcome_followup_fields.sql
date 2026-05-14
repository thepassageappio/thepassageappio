alter table public.tasks
  add column if not exists outcome_status text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists completed_by_email text,
  add column if not exists coordinator_notified_at timestamptz;

alter table public.workflow_actions
  add column if not exists outcome_status text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists completed_by_email text,
  add column if not exists coordinator_notified_at timestamptz;

create index if not exists idx_tasks_outcome_status on public.tasks(outcome_status);
create index if not exists idx_workflow_actions_outcome_status on public.workflow_actions(outcome_status);
create index if not exists idx_tasks_follow_up_at on public.tasks(follow_up_at);
create index if not exists idx_workflow_actions_follow_up_at on public.workflow_actions(follow_up_at);;
