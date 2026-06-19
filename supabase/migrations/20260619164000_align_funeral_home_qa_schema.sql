-- Align production schema with funeral-home QA paths exercised during live UAT.
-- This migration codifies the compatibility fixes needed by partner onboarding,
-- location lookup, family handoff links, and staff/member dashboards.

alter table if exists public.estate_events
  add column if not exists name text,
  add column if not exists "date" date,
  add column if not exists "time" time without time zone,
  add column if not exists location_name text,
  add column if not exists location_address text,
  add column if not exists notes text;

alter table if exists public.organizations
  add column if not exists support_phone text,
  add column if not exists family_portal_name text,
  add column if not exists marketplace_enabled boolean not null default false;

alter table if exists public.organization_members
  add column if not exists display_name text,
  add column if not exists title text,
  add column if not exists location_scope text not null default 'all',
  add column if not exists annual_salary numeric,
  add column if not exists hourly_cost numeric;

alter table if exists public.profiles
  add column if not exists planning_complete boolean not null default false,
  add column if not exists urgent_complete boolean not null default false,
  add column if not exists partner_onboarding_complete boolean not null default false,
  add column if not exists people_complete boolean not null default false,
  add column if not exists documents_complete boolean not null default false,
  add column if not exists vault_complete boolean not null default false,
  add column if not exists wishes_complete boolean not null default false,
  add column if not exists checkout_started boolean not null default false,
  add column if not exists checkout_completed boolean not null default false,
  add column if not exists onboarding_started boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_last_stage text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.organization_locations (
  id uuid default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  zip text,
  country text not null default 'US',
  place_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_locations
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists organization_id uuid,
  add column if not exists name text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip text,
  add column if not exists country text not null default 'US',
  add column if not exists place_id text,
  add column if not exists status text not null default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.organization_locations set id = gen_random_uuid() where id is null;
update public.organization_locations set country = 'US' where country is null;
update public.organization_locations set status = 'active' where status is null;
update public.organization_locations set created_at = now() where created_at is null;
update public.organization_locations set updated_at = now() where updated_at is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_locations'::regclass
      and conname = 'organization_locations_pkey'
  ) then
    alter table public.organization_locations add constraint organization_locations_pkey primary key (id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_locations'::regclass
      and conname = 'organization_locations_org_name_key'
  ) then
    alter table public.organization_locations add constraint organization_locations_org_name_key unique (organization_id, name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_locations'::regclass
      and conname = 'organization_locations_status_check'
  ) then
    alter table public.organization_locations add constraint organization_locations_status_check
      check (status = any (array['active'::text, 'inactive'::text, 'archived'::text]));
  end if;
end $$;

create index if not exists organization_locations_org_idx on public.organization_locations(organization_id, status, name);
create index if not exists organization_locations_place_idx on public.organization_locations(place_id) where place_id is not null;

alter table public.organization_locations enable row level security;

revoke all on table public.organization_locations from anon;
grant select on table public.organization_locations to authenticated;
grant all on table public.organization_locations to service_role;

drop policy if exists "service role manages organization locations" on public.organization_locations;
create policy "service role manages organization locations"
  on public.organization_locations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "organization members can read organization locations" on public.organization_locations;
create policy "organization members can read organization locations"
  on public.organization_locations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_locations.organization_id
        and (om.user_id = auth.uid() or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), '')))
        and coalesce(om.status, 'active') = 'active'
    )
  );

drop policy if exists "organization admins can manage organization locations" on public.organization_locations;
create policy "organization admins can manage organization locations"
  on public.organization_locations
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_locations.organization_id
        and (om.user_id = auth.uid() or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), '')))
        and coalesce(om.status, 'active') = 'active'
        and om.role = any (array['owner'::text, 'admin'::text, 'director'::text, 'manager'::text, 'location_manager'::text])
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = organization_locations.organization_id
        and (om.user_id = auth.uid() or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), '')))
        and coalesce(om.status, 'active') = 'active'
        and om.role = any (array['owner'::text, 'admin'::text, 'director'::text, 'manager'::text, 'location_manager'::text])
    )
  );

do $$
begin
  if to_regclass('public.partner_locations') is null then
    execute '
      create view public.partner_locations with (security_invoker=true) as
      select id, organization_id, name, address, city, state, zip, country, place_id, status, created_at, updated_at
      from public.organization_locations
    ';
    execute 'grant select, insert, update, delete on public.partner_locations to authenticated';
    execute 'grant all on public.partner_locations to service_role';
  end if;
end $$;

create table if not exists public.funeral_home_requests (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.workflows(id) on delete cascade,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  requested_by_email text,
  requested_by_name text,
  requested_provider_name text not null,
  place_id text,
  address text,
  city text,
  state text,
  zip text,
  country text,
  phone text,
  website text,
  maps_url text,
  matched_organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'requested',
  urgency text not null default 'normal',
  source text not null default 'estate',
  relationship text not null default 'family_requested',
  family_permission_to_contact boolean not null default true,
  notes text,
  estimated_case_value numeric,
  requested_at timestamptz not null default now(),
  partner_notified_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.funeral_home_requests
  add column if not exists workflow_id uuid,
  add column if not exists requested_by_user_id uuid,
  add column if not exists requested_by_email text,
  add column if not exists requested_by_name text,
  add column if not exists requested_provider_name text,
  add column if not exists place_id text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip text,
  add column if not exists country text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists maps_url text,
  add column if not exists matched_organization_id uuid,
  add column if not exists status text not null default 'requested',
  add column if not exists urgency text not null default 'normal',
  add column if not exists source text not null default 'estate',
  add column if not exists relationship text not null default 'family_requested',
  add column if not exists family_permission_to_contact boolean not null default true,
  add column if not exists notes text,
  add column if not exists estimated_case_value numeric,
  add column if not exists requested_at timestamptz not null default now(),
  add column if not exists partner_notified_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists converted_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (select 1 from pg_constraint where conrelid = 'public.funeral_home_requests'::regclass and conname = 'funeral_home_requests_status_check') then
    alter table public.funeral_home_requests drop constraint funeral_home_requests_status_check;
  end if;
  alter table public.funeral_home_requests add constraint funeral_home_requests_status_check
    check (status = any (array['requested'::text, 'matched_partner'::text, 'partner_notified'::text, 'outreach_needed'::text, 'accepted'::text, 'declined'::text, 'converted'::text, 'archived'::text]));

  if exists (select 1 from pg_constraint where conrelid = 'public.funeral_home_requests'::regclass and conname = 'funeral_home_requests_urgency_check') then
    alter table public.funeral_home_requests drop constraint funeral_home_requests_urgency_check;
  end if;
  alter table public.funeral_home_requests add constraint funeral_home_requests_urgency_check
    check (urgency = any (array['urgent'::text, 'soon'::text, 'normal'::text, 'planning'::text]));
end $$;

create index if not exists funeral_home_requests_workflow_idx on public.funeral_home_requests(workflow_id);
create index if not exists funeral_home_requests_partner_idx on public.funeral_home_requests(matched_organization_id, status, requested_at desc);
create index if not exists funeral_home_requests_status_idx on public.funeral_home_requests(status, requested_at desc);
create index if not exists funeral_home_requests_place_idx on public.funeral_home_requests(place_id);

alter table public.funeral_home_requests enable row level security;

drop policy if exists "service role manages funeral home requests" on public.funeral_home_requests;
create policy "service role manages funeral home requests"
  on public.funeral_home_requests
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Families can see funeral home requests for their workflows" on public.funeral_home_requests;
create policy "Families can see funeral home requests for their workflows"
  on public.funeral_home_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workflows w
      where w.id = funeral_home_requests.workflow_id
        and (w.user_id = auth.uid() or lower(coalesce(w.coordinator_email, '')) = lower(coalesce(auth.email(), '')))
    )
  );

drop policy if exists "Families can create funeral home requests for their workflows" on public.funeral_home_requests;
create policy "Families can create funeral home requests for their workflows"
  on public.funeral_home_requests
  for insert
  to authenticated
  with check (
    requested_by_user_id = auth.uid()
    and exists (
      select 1 from public.workflows w
      where w.id = funeral_home_requests.workflow_id
        and (w.user_id = auth.uid() or lower(coalesce(w.coordinator_email, '')) = lower(coalesce(auth.email(), '')))
    )
  );

drop policy if exists "Partner members can see matched funeral home requests" on public.funeral_home_requests;
create policy "Partner members can see matched funeral home requests"
  on public.funeral_home_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = funeral_home_requests.matched_organization_id
        and (om.user_id = auth.uid() or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), '')))
        and coalesce(om.status, 'active') = 'active'
    )
  );

drop policy if exists "Partner members can update matched funeral home requests" on public.funeral_home_requests;
create policy "Partner members can update matched funeral home requests"
  on public.funeral_home_requests
  for update
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = funeral_home_requests.matched_organization_id
        and (om.user_id = auth.uid() or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), '')))
        and coalesce(om.status, 'active') = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = funeral_home_requests.matched_organization_id
        and (om.user_id = auth.uid() or lower(coalesce(om.email, '')) = lower(coalesce(auth.email(), '')))
        and coalesce(om.status, 'active') = 'active'
    )
  );

alter table if exists public.estate_access drop constraint if exists estate_access_status_check;
alter table if exists public.estate_access add constraint estate_access_status_check
  check (status = any (array['invited'::text, 'accepted'::text, 'revoked'::text, 'active'::text, 'pending'::text, 'prepared'::text, 'expired'::text]));

do $$
declare
  v_generated text;
begin
  if to_regclass('public.estate_participants') is not null then
    alter table public.estate_participants add column if not exists task_id uuid;

    select is_generated into v_generated
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'estate_participants'
      and column_name = 'workflow_id';

    if v_generated is null then
      alter table public.estate_participants add column workflow_id uuid;
    elsif v_generated <> 'NEVER' then
      alter table public.estate_participants drop column workflow_id;
      alter table public.estate_participants add column workflow_id uuid;
    end if;
  end if;
end $$;

update public.estate_participants
set workflow_id = estate_id
where workflow_id is null and estate_id is not null;

update public.estate_participants
set estate_id = workflow_id
where estate_id is null and workflow_id is not null;

alter table if exists public.estate_participants drop constraint if exists estate_participants_invite_status_check;
alter table if exists public.estate_participants add constraint estate_participants_invite_status_check
  check (invite_status = any (array['draft'::text, 'prepared'::text, 'sent'::text, 'accepted'::text, 'declined'::text, 'bounced'::text, 'invited'::text, 'pending'::text, 'revoked'::text]));

create index if not exists estate_participants_workflow_idx on public.estate_participants(workflow_id);
create index if not exists estate_participants_task_idx on public.estate_participants(task_id) where task_id is not null;

drop policy if exists "estate_participants_token_lookup" on public.estate_participants;
create policy "estate_participants_token_lookup"
  on public.estate_participants
  for select
  using (invite_token is not null and invite_status = any (array['draft'::text, 'prepared'::text, 'sent'::text, 'accepted'::text]));

create or replace function public.sync_estate_participant_workflow_ids()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estate_id is null and new.workflow_id is not null then
    new.estate_id := new.workflow_id;
  end if;

  if new.workflow_id is null and new.estate_id is not null then
    new.workflow_id := new.estate_id;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists estate_participants_sync_workflow_ids on public.estate_participants;
create trigger estate_participants_sync_workflow_ids
  before insert or update on public.estate_participants
  for each row
  execute function public.sync_estate_participant_workflow_ids();

