update public.tasks
set status = 'needs_review', updated_at = now()
where status = 'failed';

update public.workflow_actions
set status = 'needs_review', updated_at = now()
where status = 'failed';

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status = any (array[
    'pending'::text,
    'waiting'::text,
    'assigned'::text,
    'in_progress'::text,
    'needs_review'::text,
    'handled'::text,
    'completed'::text,
    'not_applicable'::text
  ]));

alter table public.workflow_actions drop constraint if exists workflow_actions_status_check;
alter table public.workflow_actions add constraint workflow_actions_status_check
  check (status = any (array[
    'pending'::text,
    'waiting'::text,
    'assigned'::text,
    'sent'::text,
    'handled'::text,
    'needs_review'::text
  ]));;
