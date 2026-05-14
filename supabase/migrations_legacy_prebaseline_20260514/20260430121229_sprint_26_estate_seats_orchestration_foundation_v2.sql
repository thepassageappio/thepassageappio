alter table public.users drop constraint if exists users_plan_check;
alter table public.users add constraint users_plan_check check (plan = any (array[
  'free','monthly','annual','lifetime','semiannual','survivor','funeral_home',
  'single_monthly','single_annual','single_lifetime',
  'couple_monthly','couple_annual',
  'family_monthly','family_annual',
  'addon_monthly','addon_annual','urgent'
]::text[]));

alter table public.users drop constraint if exists users_plan_status_check;
alter table public.users add constraint users_plan_status_check check (plan_status = any (array['active','lapsed','cancelled','trialing','past_due','inactive']::text[]));

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check check (plan = any (array[
  'monthly','annual','lifetime','semiannual','survivor','funeral_home',
  'single_monthly','single_annual','single_lifetime',
  'couple_monthly','couple_annual',
  'family_monthly','family_annual',
  'addon_monthly','addon_annual','urgent'
]::text[]));

alter table public.users add column if not exists estate_seats_included integer not null default 1;
alter table public.users add column if not exists estate_seats_addon integer not null default 0;
do $$ begin
  alter table public.users add column estate_seats_total integer generated always as (greatest(1, estate_seats_included + estate_seats_addon)) stored;
exception when duplicate_column then null;
end $$;
alter table public.users add column if not exists participant_discount_eligible boolean not null default false;
alter table public.users add column if not exists participant_discount_source uuid null references public.people(id) on delete set null;

alter table public.workflows add column if not exists seat_index integer;
alter table public.workflows add column if not exists seat_status text not null default 'active';
alter table public.workflows add column if not exists entitlement_source text;
alter table public.workflows add column if not exists locked_reason text;
alter table public.workflows add column if not exists setup_stage text not null default 'not_started';
alter table public.workflows add column if not exists activation_status text not null default 'draft';
alter table public.workflows add column if not exists orchestration_summary jsonb not null default '{}'::jsonb;
alter table public.workflows drop constraint if exists workflows_seat_status_check;
alter table public.workflows add constraint workflows_seat_status_check check (seat_status = any (array['active','available','locked','archived']::text[]));
alter table public.workflows drop constraint if exists workflows_setup_stage_check;
alter table public.workflows add constraint workflows_setup_stage_check check (setup_stage = any (array['not_started','in_progress','ready','active','completed']::text[]));
alter table public.workflows drop constraint if exists workflows_activation_status_check;
alter table public.workflows add constraint workflows_activation_status_check check (activation_status = any (array['draft','ready','pending_confirmation','activated','paused','completed']::text[]));

alter table public.people add column if not exists invitation_token text;
alter table public.people add column if not exists participant_status text not null default 'not_invited';
alter table public.people add column if not exists participant_discount_offered boolean not null default false;
alter table public.people add column if not exists participant_discount_used_at timestamptz;
alter table public.people add column if not exists estate_role_label text;
alter table public.people drop constraint if exists people_participant_status_check;
alter table public.people add constraint people_participant_status_check check (participant_status = any (array['not_invited','invited','accepted','declined','converted']::text[]));
create unique index if not exists people_invitation_token_key on public.people(invitation_token) where invitation_token is not null;

alter table public.tasks add column if not exists owner_kind text not null default 'unassigned';
alter table public.tasks add column if not exists playbook jsonb not null default '{}'::jsonb;
alter table public.tasks add column if not exists draft_message text;
alter table public.tasks add column if not exists approval_status text not null default 'not_required';
alter table public.tasks drop constraint if exists tasks_owner_kind_check;
alter table public.tasks add constraint tasks_owner_kind_check check (owner_kind = any (array['unassigned','self','person','vendor']::text[]));
alter table public.tasks drop constraint if exists tasks_approval_status_check;
alter table public.tasks add constraint tasks_approval_status_check check (approval_status = any (array['not_required','draft','needs_review','approved','rejected']::text[]));

create table if not exists public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  plan_id text not null,
  source text not null default 'stripe',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_session_id text,
  estate_seats integer not null default 1,
  addon_seats integer not null default 0,
  status text not null default 'active' check (status = any (array['active','trialing','past_due','cancelled','lapsed']::text[])),
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.account_entitlements enable row level security;
drop policy if exists account_entitlements_select_own on public.account_entitlements;
drop policy if exists account_entitlements_insert_own on public.account_entitlements;
drop policy if exists account_entitlements_update_own on public.account_entitlements;
create policy account_entitlements_select_own on public.account_entitlements for select using (auth.uid() = user_id);
create policy account_entitlements_insert_own on public.account_entitlements for insert with check (auth.uid() = user_id);
create policy account_entitlements_update_own on public.account_entitlements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists account_entitlements_user_status_idx on public.account_entitlements(user_id, status);
create index if not exists account_entitlements_stripe_subscription_idx on public.account_entitlements(stripe_subscription_id);

create table if not exists public.estate_participants (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid references public.workflows(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  linked_user_id uuid references public.users(id) on delete set null,
  role text not null default 'participant',
  can_view boolean not null default true,
  can_complete_tasks boolean not null default true,
  invite_status text not null default 'draft' check (invite_status = any (array['draft','sent','accepted','declined','bounced']::text[])),
  invite_token text unique default (gen_random_uuid())::text,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.estate_participants enable row level security;
drop policy if exists estate_participants_select_owner_or_linked on public.estate_participants;
drop policy if exists estate_participants_insert_owner on public.estate_participants;
drop policy if exists estate_participants_update_owner_or_linked on public.estate_participants;
create policy estate_participants_select_owner_or_linked on public.estate_participants for select using (
  linked_user_id = auth.uid() or exists (select 1 from public.workflows w where w.id = estate_id and w.user_id = auth.uid())
);
create policy estate_participants_insert_owner on public.estate_participants for insert with check (
  exists (select 1 from public.workflows w where w.id = estate_id and w.user_id = auth.uid())
);
create policy estate_participants_update_owner_or_linked on public.estate_participants for update using (
  linked_user_id = auth.uid() or exists (select 1 from public.workflows w where w.id = estate_id and w.user_id = auth.uid())
) with check (
  linked_user_id = auth.uid() or exists (select 1 from public.workflows w where w.id = estate_id and w.user_id = auth.uid())
);
create index if not exists estate_participants_estate_idx on public.estate_participants(estate_id);
create index if not exists estate_participants_linked_user_idx on public.estate_participants(linked_user_id);

create table if not exists public.impact_commitments (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.workflows(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  source_plan_id text not null,
  source_amount_cents integer not null default 0,
  pledge_percent numeric(5,2),
  pledge_amount_cents integer not null default 0,
  honoree_name text,
  charity_category text not null default 'grief_support',
  charity_name text,
  status text not null default 'pledged' check (status = any (array['pledged','queued','sent','cancelled']::text[])),
  created_at timestamptz default now(),
  fulfilled_at timestamptz
);
alter table public.impact_commitments enable row level security;
drop policy if exists impact_commitments_select_own on public.impact_commitments;
drop policy if exists impact_commitments_insert_own on public.impact_commitments;
create policy impact_commitments_select_own on public.impact_commitments for select using (auth.uid() = user_id);
create policy impact_commitments_insert_own on public.impact_commitments for insert with check (auth.uid() = user_id);
create index if not exists impact_commitments_user_idx on public.impact_commitments(user_id, status);
create index if not exists impact_commitments_workflow_idx on public.impact_commitments(workflow_id);

create or replace view public.user_estate_capacity with (security_invoker = true) as
select
  u.id as user_id,
  u.estate_seats_total as total_seats,
  count(w.id) filter (where w.status <> 'archived' and coalesce(w.seat_status,'active') <> 'archived' and w.path = 'green') as used_green_seats,
  greatest(0, u.estate_seats_total - count(w.id) filter (where w.status <> 'archived' and coalesce(w.seat_status,'active') <> 'archived' and w.path = 'green')) as available_green_seats
from public.users u
left join public.workflows w on w.user_id = u.id and w.path = 'green'
group by u.id, u.estate_seats_total;

grant select on public.user_estate_capacity to authenticated;;
