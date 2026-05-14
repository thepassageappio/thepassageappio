alter table public.documents
  add column if not exists workflow_id uuid references public.workflows(id) on delete set null;

alter table public.scheduled_deliveries
  add column if not exists workflow_id uuid references public.workflows(id) on delete set null;

create index if not exists documents_workflow_id_idx on public.documents(workflow_id);
create index if not exists scheduled_deliveries_workflow_id_idx on public.scheduled_deliveries(workflow_id);
;
