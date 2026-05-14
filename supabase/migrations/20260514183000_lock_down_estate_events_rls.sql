-- Tighten estate event trail access.
-- The baseline contained legacy public allow-all policies for estate_events.
-- Estate events can include sensitive family, task, provider, notification,
-- and proof context, so access must stay scoped to estate users and service
-- role operations.

drop policy if exists "estate_events_select_all" on public.estate_events;
drop policy if exists "estate_events_insert_all" on public.estate_events;

alter table if exists public.estate_events enable row level security;
