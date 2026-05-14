alter table if exists public.notification_log
  add column if not exists intended_recipient_email text,
  add column if not exists intended_recipient_phone text,
  add column if not exists actual_recipient_email text,
  add column if not exists actual_recipient_phone text,
  add column if not exists qa_override_active boolean default false,
  add column if not exists source text;

create index if not exists idx_notification_log_qa_override
  on public.notification_log (qa_override_active, created_at desc);

create index if not exists idx_notification_log_source
  on public.notification_log (source, created_at desc);
