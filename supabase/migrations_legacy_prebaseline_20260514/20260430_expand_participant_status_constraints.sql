alter table public.tasks
  drop constraint if exists tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
  check (status = any (array[
    'pending'::text,
    'draft'::text,
    'waiting'::text,
    'assigned'::text,
    'sent'::text,
    'delivered'::text,
    'acknowledged'::text,
    'in_progress'::text,
    'needs_review'::text,
    'blocked'::text,
    'failed'::text,
    'handled'::text,
    'completed'::text,
    'not_applicable'::text
  ]));

alter table public.workflow_actions
  drop constraint if exists workflow_actions_status_check;

alter table public.workflow_actions
  add constraint workflow_actions_status_check
  check (status = any (array[
    'pending'::text,
    'draft'::text,
    'waiting'::text,
    'assigned'::text,
    'sent'::text,
    'delivered'::text,
    'acknowledged'::text,
    'handled'::text,
    'needs_review'::text,
    'blocked'::text,
    'failed'::text,
    'cancelled'::text
  ]));
