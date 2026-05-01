alter table public.tasks
  add column if not exists playbook_key text,
  add column if not exists automation_level text,
  add column if not exists execution_kind text,
  add column if not exists waiting_on text,
  add column if not exists partner_owner_role text,
  add column if not exists funeral_home_eligible boolean not null default false,
  add column if not exists proof_required text;

create index if not exists tasks_funeral_home_eligible_idx
  on public.tasks(workflow_id, funeral_home_eligible, status);

create index if not exists tasks_waiting_on_idx
  on public.tasks(workflow_id, waiting_on, status);
