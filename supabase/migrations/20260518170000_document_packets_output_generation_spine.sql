-- Passage output generation spine.
-- Active migration for reviewed packets generated from the family/task record.

create table if not exists public.document_packets (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid references public.workflows(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  type text not null,
  version integer not null default 1,
  generated_at timestamptz not null default now(),
  generated_by uuid references auth.users(id),
  data jsonb not null,
  file_path text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create index if not exists document_packets_estate_generated_idx
  on public.document_packets (estate_id, generated_at desc);

create index if not exists document_packets_task_generated_idx
  on public.document_packets (task_id, generated_at desc);

create index if not exists document_packets_type_idx
  on public.document_packets (type);

alter table public.document_packets enable row level security;
