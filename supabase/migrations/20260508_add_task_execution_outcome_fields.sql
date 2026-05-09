alter table public.tasks
  add column if not exists notes text,
  add column if not exists outcome_status text,
  add column if not exists follow_up_at timestamptz;

