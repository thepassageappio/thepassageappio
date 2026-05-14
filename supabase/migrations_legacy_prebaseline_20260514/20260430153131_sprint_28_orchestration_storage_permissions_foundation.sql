-- Sprint 28: storage + orchestration status foundation

-- Storage buckets used by the app. Private buckets; access is mediated by RLS and signed URLs later.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('passage-documents', 'passage-documents', false, 52428800, null),
  ('passage-memories', 'passage-memories', false, 52428800, null),
  ('passage-photos', 'passage-photos', false, 52428800, null),
  ('passage-voice-notes', 'passage-voice-notes', false, 52428800, null)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

-- Allow owners to upload/read their own bucket paths: bucket/user_id/file.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'passage owners read own storage') then
    create policy "passage owners read own storage" on storage.objects for select to authenticated
      using (bucket_id in ('passage-documents','passage-memories','passage-photos','passage-voice-notes') and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'passage owners insert own storage') then
    create policy "passage owners insert own storage" on storage.objects for insert to authenticated
      with check (bucket_id in ('passage-documents','passage-memories','passage-photos','passage-voice-notes') and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'passage owners update own storage') then
    create policy "passage owners update own storage" on storage.objects for update to authenticated
      using (bucket_id in ('passage-documents','passage-memories','passage-photos','passage-voice-notes') and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id in ('passage-documents','passage-memories','passage-photos','passage-voice-notes') and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- Normalize status vocabulary for the execution model while tolerating legacy data.
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.tasks'::regclass and conname ilike '%status%check%' loop
    execute format('alter table public.tasks drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.tasks
  add constraint tasks_status_check check (status in ('pending','waiting','assigned','in_progress','needs_review','handled','completed','failed'));

alter table public.tasks
  add column if not exists handled_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists help_requested_at timestamptz,
  add column if not exists execution_recipient_email text,
  add column if not exists execution_subject text,
  add column if not exists execution_draft text,
  add column if not exists execution_link text;

-- Participant memberships support owner/participant/read-only roles.
create table if not exists public.estate_access (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.workflows(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role text not null default 'participant',
  status text not null default 'invited',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(workflow_id, user_id),
  constraint estate_access_role_check check (role in ('owner','participant','read_only','operator')),
  constraint estate_access_status_check check (status in ('invited','accepted','revoked'))
);

alter table public.estate_access enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'estate_access' and policyname = 'owners manage estate access') then
    create policy "owners manage estate access" on public.estate_access for all to authenticated
      using (exists (select 1 from public.workflows w where w.id = estate_access.workflow_id and w.user_id = auth.uid()))
      with check (exists (select 1 from public.workflows w where w.id = estate_access.workflow_id and w.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'estate_access' and policyname = 'participants read own estate access') then
    create policy "participants read own estate access" on public.estate_access for select to authenticated
      using (user_id = auth.uid() or lower(email) = lower((auth.jwt() ->> 'email')));
  end if;
end $$;

create index if not exists estate_access_workflow_id_idx on public.estate_access(workflow_id);
create index if not exists estate_access_email_idx on public.estate_access(lower(email));

-- Status updates for workflow actions also need human-safe statuses.
do $$
declare r record;
begin
  if to_regclass('public.workflow_actions') is not null then
    for r in select conname from pg_constraint where conrelid = 'public.workflow_actions'::regclass and conname ilike '%status%check%' loop
      execute format('alter table public.workflow_actions drop constraint if exists %I', r.conname);
    end loop;
    alter table public.workflow_actions add constraint workflow_actions_status_check check (status in ('pending','waiting','assigned','sent','handled','needs_review','failed'));
    alter table public.workflow_actions add column if not exists accepted_at timestamptz;
    alter table public.workflow_actions add column if not exists handled_at timestamptz;
    alter table public.workflow_actions add column if not exists help_requested_at timestamptz;
  end if;
end $$;;
