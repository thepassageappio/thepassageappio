-- Production vendor/partner request spine.
--
-- Ports partner_vendor_thin_slice.sql's real design (self-contained new
-- tables, no ALTER TABLE on legacy schema, only depends on already-live
-- passage_private.can_manage_location/current_active_member_id) to
-- production. Two things deliberately dropped versus the lab original:
-- - The lab-only preflight (required the Northstar fixture org and a
--   Cycle-8-lineage sentinel; would refuse outright on production).
-- - The synthetic fixture block (a seeded vendor org/request tied to
--   fixture workflow ids that don't exist here, plus a raw INSERT into
--   auth.users/auth.identities for a synthetic vendor login -- creating
--   accounts directly via SQL is not something to do outside the real
--   signup flow).

create table if not exists public.partner_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 200),
  category text not null check (category in ('florist', 'catering', 'transport', 'memorial_products', 'other')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  contact_email text check (contact_email is null or length(contact_email) <= 320),
  contact_phone text check (contact_phone is null or length(contact_phone) <= 40),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
comment on table public.partner_organizations is 'External vendor/partner companies (florists, caterers, transport, etc.) that funeral home directors can send bounded requests to.';

create table if not exists public.partner_members (
  id uuid primary key default gen_random_uuid(),
  partner_organization_id uuid not null references public.partner_organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null check (length(btrim(email)) between 3 and 320),
  display_name text not null check (length(btrim(display_name)) between 1 and 200),
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (partner_organization_id, user_id)
);
comment on table public.partner_members is 'Vendor-side users who can act for a partner organization.';

create table if not exists public.partner_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  organization_location_id uuid not null references public.organization_locations (id) on delete cascade,
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  partner_organization_id uuid not null references public.partner_organizations (id) on delete cascade,
  created_by_organization_member_id uuid not null references public.organization_members (id),
  category text not null check (category in ('florist', 'catering', 'transport', 'memorial_products', 'other')),
  title text not null check (length(btrim(title)) between 1 and 200),
  details text not null check (length(btrim(details)) between 1 and 2000),
  needed_by timestamptz,
  status text not null default 'sent' check (
    status in ('sent', 'in_progress', 'declined', 'proof_submitted', 'verified')
  ),
  version integer not null default 1 check (version > 0),
  quote_amount_cents integer check (quote_amount_cents is null or quote_amount_cents >= 0),
  response_note text check (response_note is null or length(response_note) <= 2000),
  decline_reason text check (decline_reason is null or length(decline_reason) <= 500),
  proof_summary text check (proof_summary is null or length(proof_summary) <= 2000),
  proof_reference text check (proof_reference is null or length(proof_reference) <= 240),
  proof_submitted_by_partner_member_id uuid references public.partner_members (id),
  creation_request_id uuid not null,
  sent_at timestamptz not null default clock_timestamp(),
  responded_at timestamptz,
  started_at timestamptz,
  proof_submitted_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (organization_id, creation_request_id)
);
comment on table public.partner_requests is 'One bounded request/order sent from a funeral-home case to a vendor (sent -> in_progress|declined -> proof_submitted -> verified).';

create index if not exists partner_requests_org_status_idx on public.partner_requests (organization_id, status);
create index if not exists partner_requests_partner_org_status_idx on public.partner_requests (partner_organization_id, status);
create index if not exists partner_requests_workflow_idx on public.partner_requests (workflow_id);

create table if not exists public.partner_request_events (
  id uuid primary key default gen_random_uuid(),
  partner_request_id uuid not null references public.partner_requests (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  partner_organization_id uuid not null references public.partner_organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id),
  actor_organization_member_id uuid references public.organization_members (id),
  actor_partner_member_id uuid references public.partner_members (id),
  name text not null check (length(btrim(name)) between 1 and 120),
  previous_state text,
  next_state text not null,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default clock_timestamp(),
  unique (organization_id, idempotency_key)
);
comment on table public.partner_request_events is 'Append-only audit trail for partner_requests lifecycle transitions. Mirrors the workflow_events pattern.';

create index if not exists partner_request_events_request_idx on public.partner_request_events (partner_request_id, occurred_at);

create or replace function passage_private.reject_partner_event_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'partner_request_events is append-only';
end
$$;

drop trigger if exists partner_request_events_append_only on public.partner_request_events;
create trigger partner_request_events_append_only
  before update or delete on public.partner_request_events
  for each row execute function passage_private.reject_partner_event_mutation();

alter table public.partner_organizations enable row level security;
alter table public.partner_members enable row level security;
alter table public.partner_requests enable row level security;
alter table public.partner_request_events enable row level security;

create or replace function passage_private.is_active_partner_member_for(p_partner_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.partner_members as pm
    where pm.partner_organization_id = p_partner_organization_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'active'
  )
$$;

create or replace function passage_private.can_view_partner_request(p_partner_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.partner_requests as r
    where r.id = p_partner_request_id
      and (
        passage_private.can_manage_location(r.organization_id, r.organization_location_id)
        or passage_private.is_active_partner_member_for(r.partner_organization_id)
      )
  )
$$;

grant execute on function passage_private.is_active_partner_member_for(uuid) to authenticated;
grant execute on function passage_private.can_view_partner_request(uuid) to authenticated;

drop policy if exists partner_organizations_visible_select on public.partner_organizations;
create policy partner_organizations_visible_select on public.partner_organizations
  for select to authenticated
  using (
    passage_private.is_active_partner_member_for(id)
    or exists (
      select 1 from public.partner_requests as r
      where r.partner_organization_id = partner_organizations.id
        and passage_private.can_manage_location(r.organization_id, r.organization_location_id)
    )
  );

drop policy if exists partner_members_self_select on public.partner_members;
create policy partner_members_self_select on public.partner_members
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists partner_requests_authorized_select on public.partner_requests;
create policy partner_requests_authorized_select on public.partner_requests
  for select to authenticated
  using (passage_private.can_view_partner_request(id));

drop policy if exists partner_request_events_authorized_select on public.partner_request_events;
create policy partner_request_events_authorized_select on public.partner_request_events
  for select to authenticated
  using (passage_private.can_view_partner_request(partner_request_id));

revoke all on table public.partner_organizations from public, anon, authenticated;
revoke all on table public.partner_members from public, anon, authenticated;
revoke all on table public.partner_requests from public, anon, authenticated;
revoke all on table public.partner_request_events from public, anon, authenticated;

grant select on table public.partner_organizations to authenticated;
grant select on table public.partner_members to authenticated;
grant select on table public.partner_requests to authenticated;
grant select on table public.partner_request_events to authenticated;

create or replace function passage_private.create_partner_request_idempotent(
  p_workflow_id uuid,
  p_partner_organization_id uuid,
  p_category text,
  p_title text,
  p_details text,
  p_needed_by timestamptz,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_workflow public.workflows%rowtype;
  v_partner_org public.partner_organizations%rowtype;
  v_existing public.partner_requests%rowtype;
  v_new_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_workflow_id is null or p_partner_organization_id is null or p_request_id is null
     or p_category is null or p_category not in ('florist', 'catering', 'transport', 'memorial_products', 'other')
     or length(btrim(coalesce(p_title, ''))) not between 1 and 200
     or length(btrim(coalesce(p_details, ''))) not between 1 and 2000 then
    raise exception 'Valid request details are required' using errcode = '22023';
  end if;

  select w.* into v_workflow from public.workflows as w where w.id = p_workflow_id;
  if v_workflow.id is null then
    raise exception 'Case is unavailable' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_workflow.organization_id, v_workflow.organization_location_id) then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_workflow.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;

  select po.* into v_partner_org from public.partner_organizations as po
  where po.id = p_partner_organization_id and po.status = 'active';
  if v_partner_org.id is null then
    raise exception 'Vendor is unavailable' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_workflow.organization_id::text || ':partner_request_create:' || p_request_id::text, 0)
  );

  select r.* into v_existing from public.partner_requests as r
  where r.organization_id = v_workflow.organization_id and r.creation_request_id = p_request_id;
  if found then
    if v_existing.workflow_id is distinct from p_workflow_id
       or v_existing.partner_organization_id is distinct from p_partner_organization_id
       or v_existing.category is distinct from p_category
       or v_existing.title is distinct from btrim(p_title)
       or v_existing.details is distinct from btrim(p_details) then
      raise exception 'Request conflicts with an earlier command' using errcode = '22023';
    end if;
    return query select v_existing.id, v_existing.status, v_existing.version, true;
    return;
  end if;

  insert into public.partner_requests (
    organization_id, organization_location_id, workflow_id, partner_organization_id,
    created_by_organization_member_id, category, title, details, needed_by,
    status, version, creation_request_id, sent_at
  ) values (
    v_workflow.organization_id, v_workflow.organization_location_id, v_workflow.id, p_partner_organization_id,
    v_actor_member_id, p_category, btrim(p_title), btrim(p_details), p_needed_by,
    'sent', 1, p_request_id, pg_catalog.clock_timestamp()
  ) returning id into v_new_id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_organization_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_new_id, v_workflow.organization_id, p_partner_organization_id,
    v_actor_user_id, v_actor_member_id, 'partner_request.sent', null, 'sent',
    'partner_request_create:' || p_request_id::text,
    pg_catalog.jsonb_build_object('category', p_category, 'title', btrim(p_title))
  );

  return query select v_new_id, 'sent'::text, 1, false;
end
$function$;

create or replace function public.create_partner_request_idempotent(
  p_workflow_id uuid,
  p_partner_organization_id uuid,
  p_category text,
  p_title text,
  p_details text,
  p_needed_by timestamptz,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.create_partner_request_idempotent(
    p_workflow_id, p_partner_organization_id, p_category, p_title, p_details, p_needed_by, p_request_id
  )
$$;

create or replace function passage_private.respond_to_partner_request_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_decision text,
  p_quote_amount_cents integer,
  p_note text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_partner_member public.partner_members%rowtype;
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
  v_next_status text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null
     or p_expected_version is null or p_expected_version < 1
     or p_decision is null or p_decision not in ('accept', 'decline')
     or (p_decision = 'accept' and (p_quote_amount_cents is null or p_quote_amount_cents < 0))
     or (p_decision = 'decline' and (v_note is null or length(v_note) > 500)) then
    raise exception 'Valid response and version are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;

  select pm.* into v_partner_member from public.partner_members as pm
  where pm.partner_organization_id = v_request.partner_organization_id
    and pm.user_id = v_actor_user_id and pm.status = 'active';
  if v_partner_member.id is null then
    raise exception 'Vendor authority for this request is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_respond:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Request changed before your response was saved' using errcode = '40001';
  end if;
  if v_request.status <> 'sent' then
    raise exception 'This request is no longer waiting for a response' using errcode = '55000';
  end if;

  v_next_status := case when p_decision = 'accept' then 'in_progress' else 'declined' end;

  update public.partner_requests as pr set
    status = v_next_status,
    version = pr.version + 1,
    quote_amount_cents = case when p_decision = 'accept' then p_quote_amount_cents else pr.quote_amount_cents end,
    response_note = case when p_decision = 'accept' then v_note else pr.response_note end,
    decline_reason = case when p_decision = 'decline' then v_note else pr.decline_reason end,
    responded_at = pg_catalog.clock_timestamp(),
    started_at = case when p_decision = 'accept' then pg_catalog.clock_timestamp() else pr.started_at end,
    updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_partner_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_partner_member.id,
    case when p_decision = 'accept' then 'partner_request.accepted' else 'partner_request.declined' end,
    'sent', v_next_status, v_key,
    pg_catalog.jsonb_build_object('version', v_request.version + 1, 'quote_amount_cents', p_quote_amount_cents, 'note', coalesce(v_note, ''))
  );

  return query select v_request.id, v_next_status, v_request.version + 1, false;
end
$function$;

create or replace function public.respond_to_partner_request_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_decision text,
  p_quote_amount_cents integer,
  p_note text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.respond_to_partner_request_idempotent(
    p_partner_request_id, p_expected_version, p_decision, p_quote_amount_cents, p_note, p_request_id
  )
$$;

create or replace function passage_private.submit_partner_request_proof_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_proof_summary text,
  p_proof_reference text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_partner_member public.partner_members%rowtype;
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
  v_reference text := nullif(btrim(coalesce(p_proof_reference, '')), '');
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null or p_expected_version is null or p_expected_version < 1
     or length(btrim(coalesce(p_proof_summary, ''))) not between 1 and 2000
     or (v_reference is not null and length(v_reference) > 240) then
    raise exception 'Valid proof and version are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;

  select pm.* into v_partner_member from public.partner_members as pm
  where pm.partner_organization_id = v_request.partner_organization_id
    and pm.user_id = v_actor_user_id and pm.status = 'active';
  if v_partner_member.id is null then
    raise exception 'Vendor authority for this request is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_proof:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Work changed before proof was saved' using errcode = '40001';
  end if;
  if v_request.status <> 'in_progress' then
    raise exception 'Only in-progress work can receive proof' using errcode = '55000';
  end if;

  update public.partner_requests as pr set
    status = 'proof_submitted',
    version = pr.version + 1,
    proof_summary = btrim(p_proof_summary),
    proof_reference = v_reference,
    proof_submitted_by_partner_member_id = v_partner_member.id,
    proof_submitted_at = pg_catalog.clock_timestamp(),
    updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_partner_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_partner_member.id, 'partner_request.proof_submitted',
    'in_progress', 'proof_submitted', v_key,
    pg_catalog.jsonb_build_object('version', v_request.version + 1)
  );

  return query select v_request.id, 'proof_submitted'::text, v_request.version + 1, false;
end
$function$;

create or replace function public.submit_partner_request_proof_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_proof_summary text,
  p_proof_reference text,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.submit_partner_request_proof_idempotent(
    p_partner_request_id, p_expected_version, p_proof_summary, p_proof_reference, p_request_id
  )
$$;

create or replace function passage_private.verify_partner_request_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_request public.partner_requests%rowtype;
  v_existing_event public.partner_request_events%rowtype;
  v_key text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_partner_request_id is null or p_request_id is null or p_expected_version is null or p_expected_version < 1 then
    raise exception 'Valid request and version are required' using errcode = '22023';
  end if;

  select r.* into v_request from public.partner_requests as r where r.id = p_partner_request_id for update;
  if v_request.id is null then
    raise exception 'Request is unavailable' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_request.organization_id, v_request.organization_location_id) then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_request.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;

  v_key := 'partner_request_verify:' || p_request_id::text;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_request.organization_id::text || ':' || v_key, 0));

  select e.* into v_existing_event from public.partner_request_events as e
  where e.organization_id = v_request.organization_id and e.idempotency_key = v_key;
  if found then
    return query select v_request.id, v_existing_event.next_state, (v_existing_event.metadata ->> 'version')::integer, true;
    return;
  end if;

  if v_request.version <> p_expected_version then
    raise exception 'Request changed before it was verified' using errcode = '40001';
  end if;
  if v_request.status <> 'proof_submitted' then
    raise exception 'No proof is waiting for review' using errcode = '55000';
  end if;

  update public.partner_requests as pr set
    status = 'verified', version = pr.version + 1, verified_at = pg_catalog.clock_timestamp(), updated_at = pg_catalog.clock_timestamp()
  where pr.id = v_request.id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_organization_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_request.id, v_request.organization_id, v_request.partner_organization_id,
    v_actor_user_id, v_actor_member_id, 'partner_request.verified',
    'proof_submitted', 'verified', v_key, pg_catalog.jsonb_build_object('version', v_request.version + 1)
  );

  return query select v_request.id, 'verified'::text, v_request.version + 1, false;
end
$function$;

create or replace function public.verify_partner_request_idempotent(
  p_partner_request_id uuid,
  p_expected_version integer,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.verify_partner_request_idempotent(
    p_partner_request_id, p_expected_version, p_request_id
  )
$$;

revoke all on function passage_private.create_partner_request_idempotent(uuid, uuid, text, text, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function passage_private.respond_to_partner_request_idempotent(uuid, integer, text, integer, text, uuid) from public, anon, authenticated;
revoke all on function passage_private.submit_partner_request_proof_idempotent(uuid, integer, text, text, uuid) from public, anon, authenticated;
revoke all on function passage_private.verify_partner_request_idempotent(uuid, integer, uuid) from public, anon, authenticated;

revoke all on function public.create_partner_request_idempotent(uuid, uuid, text, text, text, timestamptz, uuid) from public, anon;
revoke all on function public.respond_to_partner_request_idempotent(uuid, integer, text, integer, text, uuid) from public, anon;
revoke all on function public.submit_partner_request_proof_idempotent(uuid, integer, text, text, uuid) from public, anon;
revoke all on function public.verify_partner_request_idempotent(uuid, integer, uuid) from public, anon;

grant execute on function public.create_partner_request_idempotent(uuid, uuid, text, text, text, timestamptz, uuid) to authenticated;
grant execute on function public.respond_to_partner_request_idempotent(uuid, integer, text, integer, text, uuid) to authenticated;
grant execute on function public.submit_partner_request_proof_idempotent(uuid, integer, text, text, uuid) to authenticated;
grant execute on function public.verify_partner_request_idempotent(uuid, integer, uuid) to authenticated;
