-- Checkpoint 10 / A16: family funeral-home discovery and durable confirmation.
-- Non-production target only. This migration adds no external provider traffic,
-- invitation, membership, workflow, task, case, or Production data.
-- Supabase project uyacxqtsiwlvtmhxvoxr is positively bound to PostgreSQL
-- system_identifier 7656983981618135123. The immutable cluster identifier is
-- checked in addition to migration markers, exact cardinality, and stable IDs.

do $preflight$
begin
  if (
    select system_identifier
    from pg_catalog.pg_control_system()
  ) is distinct from 7656983981618135123::bigint then
    raise exception using
      errcode = '42501',
      message = 'Provider discovery refused: exact isolated cluster attestation failed';
  end if;

  if to_regclass('public.continuity_spaces') is null
     or to_regclass('public.continuity_participants') is null
     or to_regclass('public.workflow_events') is null
     or to_regclass('public.organizations') is null
     or to_regclass('public.organization_locations') is null
     or to_regprocedure('passage_private.current_verified_email()') is null
     or to_regprocedure('passage_private.can_view_continuity_space(uuid)') is null
     or to_regprocedure('passage_private.can_manage_continuity_space(uuid)') is null then
    raise exception using
      errcode = '55000',
      message = 'Provider discovery refused: reviewed continuity-space authority is missing';
  end if;

  if not exists (
       select 1
       from supabase_migrations.schema_migrations
       where name = 'participant_advisor_hardening'
     )
     or (select count(*) from public.organizations) <> 1
     or (select count(*) from public.organization_locations) <> 1
     or (select count(*) from public.workflows) <> 2
     or (select count(*) from public.tasks) <> 3
     or (select count(*) from public.workflow_events) <> 8
     or (select count(*) from public.organization_invitations) <> 2
     or (select count(*) from public.organization_invitation_locations) <> 2
     or (select count(*) from public.organization_members
         where status = 'active') <> 2
     or (select count(*) from public.organization_members
         where status = 'revoked') <> 1
     or (select count(*) from public.organization_member_locations
         where revoked_at is null) <> 2
     or exists (select 1 from public.continuity_spaces)
     or exists (select 1 from public.continuity_participants)
     or exists (select 1 from public.participant_invitations)
     or exists (
       select 1
       from public.workflow_events
       where continuity_space_id is not null
          or participant_invitation_id is not null
          or continuity_participant_id is not null
     ) then
    raise exception using
      errcode = '42501',
      message = 'Provider discovery refused: exact isolated baseline or dependency drifted';
  end if;

  if (select count(*) from public.workflows
      where id in (
        'c7b10001-7b00-47b0-87b0-000000000001',
        'c7b10002-7b00-47b0-87b0-000000000002'
      )) <> 2
     or (select count(*) from public.tasks
         where id in (
           'c7b20001-7b00-47b0-87b0-000000000001',
           'c7b20002-7b00-47b0-87b0-000000000002',
           'c7b20003-7b00-47b0-87b0-000000000003'
         )) <> 3 then
    raise exception using
      errcode = '42501',
      message = 'Provider discovery refused: exact isolated workflow identities are missing';
  end if;

  if (select count(*)
      from pg_policies
      where schemaname = 'public'
        and tablename = 'workflow_events'
        and permissive = 'PERMISSIVE'
        and cmd = 'SELECT') <> 1
     or not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'workflow_events'
         and policyname = 'workflow_events_authorized_select'
         and roles = array['authenticated']::name[]
         and qual like '%can_view_workflow_event(id)%'
         and qual like '%can_manage_continuity_space(continuity_space_id)%'
     ) then
    raise exception using
      errcode = '55000',
      message = 'Provider discovery refused: consolidated workflow-event policy is missing';
  end if;

  if not exists (
    select 1
    from pg_trigger as t
    where t.tgrelid = 'public.workflow_events'::regclass
      and t.tgname = 'workflow_events_cycle_7b_append_only'
      and not t.tgisinternal
  ) then
    raise exception using
      errcode = '55000',
      message = 'Provider discovery refused: append-only workflow-event proof is missing';
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = 'c7a00001-7a00-47a0-87a0-000000000001'
  ) or not exists (
    select 1
    from public.organization_locations as l
    where l.id = 'c7a00002-7a00-47a0-87a0-000000000002'
      and l.organization_id = 'c7a00001-7a00-47a0-87a0-000000000001'
      and l.status = 'active'
  ) then
    raise exception using
      errcode = '55000',
      message = 'Provider discovery refused: isolated Northstar handoff target is missing';
  end if;

  if to_regclass('public.family_provider_selections') is not null
     or to_regclass('passage_private.synthetic_provider_directory') is not null then
    raise exception using
      errcode = '42P07',
      message = 'Provider discovery refused: target relations already exist';
  end if;
end
$preflight$;

create table passage_private.synthetic_provider_directory (
  source_key text primary key,
  dataset_version text not null,
  display_name text not null,
  address_line1 text not null,
  address_line2 text,
  locality text not null,
  administrative_area text not null,
  postal_code text not null,
  country_code text not null default 'US',
  organization_id uuid references public.organizations(id),
  organization_location_id uuid references public.organization_locations(id),
  created_at timestamp with time zone not null default now(),
  constraint synthetic_provider_source_key_check
    check (source_key = lower(source_key) and source_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint synthetic_provider_dataset_version_check
    check (char_length(btrim(dataset_version)) between 1 and 80),
  constraint synthetic_provider_display_name_check
    check (char_length(btrim(display_name)) between 2 and 160),
  constraint synthetic_provider_address_check
    check (
      char_length(btrim(address_line1)) between 2 and 160
      and (address_line2 is null or char_length(btrim(address_line2)) between 1 and 160)
      and char_length(btrim(locality)) between 2 and 100
      and char_length(btrim(administrative_area)) between 2 and 80
      and char_length(btrim(postal_code)) between 3 and 20
      and country_code ~ '^[A-Z]{2}$'
    ),
  constraint synthetic_provider_handoff_shape_check
    check (
      (organization_id is null and organization_location_id is null)
      or (organization_id is not null and organization_location_id is not null)
    )
);

create index synthetic_provider_directory_name_idx
  on passage_private.synthetic_provider_directory (lower(display_name), source_key);
create index synthetic_provider_directory_location_idx
  on passage_private.synthetic_provider_directory
    (lower(locality), lower(administrative_area), postal_code);

insert into passage_private.synthetic_provider_directory (
  source_key, dataset_version, display_name, address_line1, locality,
  administrative_area, postal_code, country_code,
  organization_id, organization_location_id
) values
  (
    'northstar-portland', '2026-07-a16-v1', 'Northstar Funeral Home',
    '7421 SE Division Street', 'Portland', 'OR', '97206', 'US',
    'c7a00001-7a00-47a0-87a0-000000000001',
    'c7a00002-7a00-47a0-87a0-000000000002'
  ),
  (
    'northstar-beaverton', '2026-07-a16-v1', 'Northstar Funeral Home',
    '12600 SW Crescent Street', 'Beaverton', 'OR', '97005', 'US', null, null
  ),
  (
    'cedar-stone-beaverton', '2026-07-a16-v1', 'Cedar & Stone Memorial',
    '4800 SW Watson Avenue', 'Beaverton', 'OR', '97005', 'US', null, null
  ),
  (
    'riverbend-salem', '2026-07-a16-v1', 'Riverbend Funeral Care',
    '955 Liberty Street SE', 'Salem', 'OR', '97302', 'US', null, null
  ),
  (
    'evergold-eugene', '2026-07-a16-v1', 'Evergold Memorial Home',
    '2125 Willamette Street', 'Eugene', 'OR', '97405', 'US', null, null
  ),
  (
    'harbor-light-astoria', '2026-07-a16-v1', 'Harbor Light Funeral Home',
    '1145 Marine Drive', 'Astoria', 'OR', '97103', 'US', null, null
  );

create table public.family_provider_selections (
  id uuid primary key default extensions.gen_random_uuid(),
  continuity_space_id uuid not null references public.continuity_spaces(id),
  source_kind text not null,
  source_key text,
  dataset_version text not null,
  provider_name text not null,
  address_line1 text not null,
  address_line2 text,
  locality text not null,
  administrative_area text not null,
  postal_code text not null,
  country_code text not null,
  formatted_address text not null,
  address_review_required boolean not null,
  handoff_available boolean not null,
  provider_organization_id uuid references public.organizations(id),
  provider_location_id uuid references public.organization_locations(id),
  selected_by_user_id uuid not null references auth.users(id),
  selected_at timestamp with time zone not null default now(),
  state text not null default 'active',
  superseded_at timestamp with time zone,
  superseded_by_selection_id uuid references public.family_provider_selections(id),
  selection_request_id uuid not null,
  request_digest text not null,
  constraint family_provider_source_kind_check
    check (source_kind in ('synthetic_directory', 'manual')),
  constraint family_provider_source_shape_check
    check (
      (source_kind = 'synthetic_directory' and source_key is not null
        and address_review_required = false)
      or
      (source_kind = 'manual' and source_key is null
        and dataset_version = 'manual-v1'
        and handoff_available = false)
    ),
  constraint family_provider_text_check
    check (
      char_length(btrim(provider_name)) between 2 and 160
      and char_length(address_line1) <= 160
      and (address_line2 is null or char_length(btrim(address_line2)) between 1 and 160)
      and char_length(locality) <= 100
      and char_length(administrative_area) <= 80
      and char_length(postal_code) <= 20
      and (
        source_kind = 'synthetic_directory'
        or nullif(btrim(address_line1), '') is not null
        or nullif(btrim(locality), '') is not null
        or nullif(btrim(postal_code), '') is not null
      )
      and country_code ~ '^[A-Z]{2}$'
      and char_length(btrim(formatted_address)) between 2 and 600
      and char_length(request_digest) = 64
    ),
  constraint family_provider_handoff_shape_check
    check (
      (handoff_available = false
        and provider_organization_id is null and provider_location_id is null)
      or
      (handoff_available = true
        and provider_organization_id is not null and provider_location_id is not null)
    ),
  constraint family_provider_state_check
    check (state in ('active', 'superseded')),
  constraint family_provider_supersession_shape_check
    check (
      (state = 'active' and superseded_at is null and superseded_by_selection_id is null)
      or
      (state = 'superseded' and superseded_at is not null)
    ),
  constraint family_provider_request_unique
    unique (continuity_space_id, selection_request_id)
);

create unique index family_provider_one_active_per_space
  on public.family_provider_selections (continuity_space_id)
  where state = 'active';
create index family_provider_space_history_idx
  on public.family_provider_selections (continuity_space_id, selected_at desc, id);
create index family_provider_selected_by_idx
  on public.family_provider_selections (selected_by_user_id, selected_at desc);
create index family_provider_superseded_by_idx
  on public.family_provider_selections (superseded_by_selection_id)
  where superseded_by_selection_id is not null;
create index family_provider_organization_idx
  on public.family_provider_selections (provider_organization_id)
  where provider_organization_id is not null;
create index family_provider_location_idx
  on public.family_provider_selections (provider_location_id)
  where provider_location_id is not null;

alter table public.workflow_events
  add column family_provider_selection_id uuid,
  add column previous_family_provider_selection_id uuid;

alter table public.workflow_events
  add constraint workflow_events_family_provider_selection_id_fkey
    foreign key (family_provider_selection_id)
      references public.family_provider_selections(id),
  add constraint workflow_events_previous_family_provider_selection_id_fkey
    foreign key (previous_family_provider_selection_id)
      references public.family_provider_selections(id);

create index workflow_events_family_provider_selection_idx
  on public.workflow_events (family_provider_selection_id, occurred_at desc)
  where family_provider_selection_id is not null;
create index workflow_events_previous_family_provider_selection_idx
  on public.workflow_events (previous_family_provider_selection_id, occurred_at desc)
  where previous_family_provider_selection_id is not null;

create or replace function passage_private.confirm_family_provider_selection(
  p_continuity_space_id uuid,
  p_request_id uuid,
  p_expected_active_selected_at timestamp with time zone,
  p_source_kind text,
  p_source_key text,
  p_provider_name text,
  p_address_line1 text,
  p_address_line2 text,
  p_locality text,
  p_administrative_area text,
  p_postal_code text,
  p_country_code text
)
returns table (
  provider_name text,
  address_line1 text,
  address_line2 text,
  locality text,
  administrative_area text,
  postal_code text,
  country_code text,
  formatted_address text,
  address_review_required boolean,
  handoff_available boolean,
  selected_at timestamp with time zone,
  event_id uuid,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_source passage_private.synthetic_provider_directory%rowtype;
  v_active public.family_provider_selections%rowtype;
  v_existing public.family_provider_selections%rowtype;
  v_selection public.family_provider_selections%rowtype;
  v_event public.workflow_events%rowtype;
  v_name text;
  v_line1 text;
  v_line2 text;
  v_locality text;
  v_area text;
  v_postal text;
  v_country text;
  v_dataset text;
  v_formatted text;
  v_review boolean;
  v_handoff boolean;
  v_org uuid;
  v_location uuid;
  v_digest text;
  v_event_name text;
  v_previous_state text;
  v_occurred_at timestamp with time zone := pg_catalog.clock_timestamp();
begin
  if v_actor is null or passage_private.current_verified_email() is null then
    raise exception 'Sign in with a verified email address to save a funeral home'
      using errcode = '42501';
  end if;
  if p_continuity_space_id is null or p_request_id is null
     or p_source_kind not in ('synthetic_directory', 'manual') then
    raise exception 'Choose a valid funeral-home confirmation'
      using errcode = '22023';
  end if;
  if not passage_private.can_manage_continuity_space(p_continuity_space_id) then
    raise exception 'Only the family coordinator can change the funeral home'
      using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_continuity_space_id::text || ':family-provider-selection', 0
    )
  );

  if p_source_kind = 'synthetic_directory' then
    if nullif(btrim(p_source_key), '') is null then
      raise exception 'Choose a funeral home from the list'
        using errcode = '22023';
    end if;
    select d.* into v_source
    from passage_private.synthetic_provider_directory as d
    where d.source_key = btrim(p_source_key);
    if not found then
      raise exception 'That funeral home is no longer available. Search again.'
        using errcode = 'P0002';
    end if;
    v_name := v_source.display_name;
    v_line1 := v_source.address_line1;
    v_line2 := v_source.address_line2;
    v_locality := v_source.locality;
    v_area := v_source.administrative_area;
    v_postal := v_source.postal_code;
    v_country := v_source.country_code;
    v_dataset := v_source.dataset_version;
    v_review := false;
    v_org := v_source.organization_id;
    v_location := v_source.organization_location_id;
    v_handoff := v_org is not null and v_location is not null;
  else
    v_name := nullif(btrim(p_provider_name), '');
    v_line1 := coalesce(nullif(btrim(p_address_line1), ''), '');
    v_line2 := nullif(btrim(p_address_line2), '');
    v_locality := coalesce(nullif(btrim(p_locality), ''), '');
    v_area := coalesce(nullif(btrim(p_administrative_area), ''), '');
    v_postal := coalesce(nullif(btrim(p_postal_code), ''), '');
    v_country := upper(coalesce(nullif(btrim(p_country_code), ''), 'US'));
    if v_name is null or char_length(v_name) not between 2 and 160
       or not (
         nullif(v_line1, '') is not null
         or nullif(v_locality, '') is not null
         or nullif(v_postal, '') is not null
       )
       or char_length(v_line1) > 160
       or char_length(v_locality) > 100
       or char_length(v_area) > 80
       or char_length(v_postal) > 20
       or v_country !~ '^[A-Z]{2}$' then
      raise exception 'Enter the funeral-home name and at least a street, city, or postal code'
        using errcode = '22023';
    end if;
    v_dataset := 'manual-v1';
    v_review := v_line1 = '' or v_locality = '' or v_area = '' or v_postal = '';
    v_handoff := false;
    v_org := null;
    v_location := null;
  end if;

  v_formatted := concat_ws(
    ' ',
    nullif(v_line1, ''),
    v_line2,
    case when v_locality <> '' then v_locality || ',' end,
    nullif(v_area, ''),
    nullif(v_postal, ''),
    v_country
  );
  v_digest := encode(
    extensions.digest(
      pg_catalog.convert_to(
        pg_catalog.jsonb_build_object(
          'source_kind', p_source_kind,
          'source_key', case when p_source_kind = 'synthetic_directory'
            then v_source.source_key else null end,
          'dataset_version', v_dataset,
          'provider_name', v_name,
          'address_line1', v_line1,
          'address_line2', v_line2,
          'locality', v_locality,
          'administrative_area', v_area,
          'postal_code', v_postal,
          'country_code', v_country
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  select s.* into v_existing
  from public.family_provider_selections as s
  where s.continuity_space_id = p_continuity_space_id
    and s.selection_request_id = p_request_id;
  if found then
    if v_existing.request_digest is distinct from v_digest
       or v_existing.selected_by_user_id is distinct from v_actor then
      raise exception 'This save request conflicts with an earlier choice'
        using errcode = '22023';
    end if;
    select e.* into strict v_event
    from public.workflow_events as e
    where e.continuity_space_id = p_continuity_space_id
      and e.idempotency_key = 'family-provider-selection:' || p_request_id::text;
    return query select
      v_existing.provider_name, v_existing.address_line1,
      v_existing.address_line2,
      v_existing.locality, v_existing.administrative_area,
      v_existing.postal_code, v_existing.country_code,
      v_existing.formatted_address, v_existing.address_review_required,
      v_existing.handoff_available, v_existing.selected_at,
      v_event.id, true;
    return;
  end if;

  select s.* into v_active
  from public.family_provider_selections as s
  where s.continuity_space_id = p_continuity_space_id
    and s.state = 'active'
  for update;

  if (
    (v_active.id is null) is distinct from
      (p_expected_active_selected_at is null)
  ) or (
    v_active.id is not null
    and v_active.selected_at is distinct from p_expected_active_selected_at
  ) then
    raise exception 'The saved funeral home changed. Reload before choosing another.'
      using errcode = '40001';
  end if;

  if v_active.id is not null then
    update public.family_provider_selections
    set state = 'superseded', superseded_at = v_occurred_at
    where id = v_active.id;
  end if;

  insert into public.family_provider_selections (
    continuity_space_id, source_kind, source_key, dataset_version,
    provider_name, address_line1, address_line2, locality,
    administrative_area, postal_code, country_code, formatted_address,
    address_review_required, handoff_available, provider_organization_id,
    provider_location_id, selected_by_user_id, selected_at,
    selection_request_id, request_digest
  ) values (
    p_continuity_space_id, p_source_kind,
    case when p_source_kind = 'synthetic_directory' then v_source.source_key end,
    v_dataset, v_name, v_line1, v_line2, v_locality, v_area, v_postal,
    v_country, v_formatted, v_review, v_handoff, v_org, v_location,
    v_actor, v_occurred_at, p_request_id, v_digest
  )
  returning * into v_selection;

  if v_active.id is not null then
    update public.family_provider_selections
    set superseded_by_selection_id = v_selection.id
    where id = v_active.id;
  end if;

  v_event_name := case when v_active.id is null
    then 'family_provider_selection.confirmed'
    else 'family_provider_selection.superseded'
  end;
  v_previous_state := case when v_active.id is null then null else 'active' end;

  insert into public.workflow_events (
    workflow_id, event_type, name, actor_user_id, idempotency_key,
    audience, previous_state, next_state, occurred_at, metadata,
    continuity_space_id, family_provider_selection_id,
    previous_family_provider_selection_id
  ) values (
    null, 'other', v_event_name, v_actor,
    'family-provider-selection:' || p_request_id::text,
    'family_space', v_previous_state, 'active', v_occurred_at,
    pg_catalog.jsonb_build_object(
      'event_kind', v_event_name,
      'proof_destination', 'family_provider_history',
      'source_kind', p_source_kind,
      'handoff_available', v_handoff,
      'address_review_required', v_review
    ),
    p_continuity_space_id, v_selection.id, v_active.id
  )
  returning * into v_event;

  return query select
    v_selection.provider_name, v_selection.address_line1,
    v_selection.address_line2,
    v_selection.locality, v_selection.administrative_area,
    v_selection.postal_code, v_selection.country_code,
    v_selection.formatted_address, v_selection.address_review_required,
    v_selection.handoff_available, v_selection.selected_at,
    v_event.id, false;
end
$function$;

create or replace function passage_private.get_family_provider_selection_projection(
  p_continuity_space_id uuid
)
returns table (
  provider_name text,
  address_line1 text,
  address_line2 text,
  locality text,
  administrative_area text,
  postal_code text,
  country_code text,
  formatted_address text,
  address_review_required boolean,
  handoff_available boolean,
  selected_at timestamp with time zone,
  viewer_count integer
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    s.provider_name, s.address_line1, s.address_line2,
    s.locality, s.administrative_area, s.postal_code, s.country_code,
    s.formatted_address, s.address_review_required, s.handoff_available,
    s.selected_at,
    (
      1 + (
        select count(*)::integer
        from public.continuity_participants as p
        where p.continuity_space_id = s.continuity_space_id
          and p.status = 'active'
      )
    )::integer
  from public.family_provider_selections as s
  where s.continuity_space_id = p_continuity_space_id
    and s.state = 'active'
    and passage_private.can_view_continuity_space(s.continuity_space_id)
$function$;

create or replace function public.confirm_family_provider_selection(
  p_continuity_space_id uuid,
  p_request_id uuid,
  p_expected_active_selected_at timestamp with time zone,
  p_source_kind text,
  p_source_key text,
  p_provider_name text,
  p_address_line1 text,
  p_address_line2 text,
  p_locality text,
  p_administrative_area text,
  p_postal_code text,
  p_country_code text
)
returns table (
  provider_name text, address_line1 text, address_line2 text, locality text,
  administrative_area text, postal_code text, country_code text,
  formatted_address text, address_review_required boolean,
  handoff_available boolean, selected_at timestamp with time zone, replayed boolean
)
language sql volatile security invoker set search_path = ''
as $function$
  select
    confirmed.provider_name, confirmed.address_line1,
    confirmed.address_line2, confirmed.locality,
    confirmed.administrative_area, confirmed.postal_code,
    confirmed.country_code, confirmed.formatted_address,
    confirmed.address_review_required, confirmed.handoff_available,
    confirmed.selected_at, confirmed.replayed
  from passage_private.confirm_family_provider_selection(
    p_continuity_space_id, p_request_id, p_expected_active_selected_at,
    p_source_kind, p_source_key, p_provider_name, p_address_line1,
    p_address_line2, p_locality, p_administrative_area, p_postal_code,
    p_country_code
  ) as confirmed
$function$;

create or replace function public.get_family_provider_selection_projection(
  p_continuity_space_id uuid
)
returns table (
  provider_name text, address_line1 text, address_line2 text, locality text,
  administrative_area text, postal_code text, country_code text,
  formatted_address text, address_review_required boolean,
  handoff_available boolean, selected_at timestamp with time zone,
  viewer_count integer
)
language sql stable security invoker set search_path = ''
as $function$
  select *
  from passage_private.get_family_provider_selection_projection(
    p_continuity_space_id
  )
$function$;

alter table public.family_provider_selections enable row level security;

create policy family_provider_selection_authorized_select
  on public.family_provider_selections for select to authenticated
  using (passage_private.can_view_continuity_space(continuity_space_id));

drop policy workflow_events_authorized_select on public.workflow_events;
create policy workflow_events_authorized_select
  on public.workflow_events for select to authenticated
  using (
    passage_private.can_view_workflow_event(id)
    or (
      continuity_space_id is not null
      and (
        passage_private.can_manage_continuity_space(continuity_space_id)
        or (
          family_provider_selection_id is not null
          and passage_private.can_view_continuity_space(continuity_space_id)
        )
      )
    )
  );

revoke all on table passage_private.synthetic_provider_directory
  from public, anon, authenticated;
revoke all on table public.family_provider_selections
  from public, anon, authenticated;

revoke all on function
  passage_private.confirm_family_provider_selection(
    uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text
  ) from public, anon, authenticated, service_role;
revoke all on function
  passage_private.get_family_provider_selection_projection(uuid)
  from public, anon, authenticated, service_role;
revoke all on function
  public.confirm_family_provider_selection(
    uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text
  ) from public, anon, authenticated, service_role;
revoke all on function
  public.get_family_provider_selection_projection(uuid)
  from public, anon, authenticated, service_role;

grant execute on function
  passage_private.confirm_family_provider_selection(
    uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text
  ) to authenticated;
grant execute on function
  passage_private.get_family_provider_selection_projection(uuid)
  to authenticated;
grant execute on function
  public.confirm_family_provider_selection(
    uuid,uuid,timestamp with time zone,text,text,text,text,text,text,text,text,text
  ) to authenticated;
grant execute on function
  public.get_family_provider_selection_projection(uuid)
  to authenticated;

do $provider_discovery_postflight$
begin
  if (select count(*)
      from pg_policies
      where schemaname = 'public'
        and tablename = 'workflow_events'
        and permissive = 'PERMISSIVE'
        and cmd = 'SELECT') <> 1
     or not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'workflow_events'
         and policyname = 'workflow_events_authorized_select'
         and roles = array['authenticated']::name[]
         and qual like '%can_view_workflow_event(id)%'
         and qual like '%can_manage_continuity_space(continuity_space_id)%'
         and qual like '%family_provider_selection_id%'
         and qual like '%can_view_continuity_space(continuity_space_id)%'
     ) then
    raise exception 'Provider discovery failed: workflow-event policy is not singular and complete';
  end if;

  if exists (
       select 1
       from pg_proc as p
       join pg_namespace as n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in (
           'confirm_family_provider_selection',
           'get_family_provider_selection_projection'
         )
         and p.prosecdef
     )
     or not exists (
       select 1
       from pg_proc as p
       join pg_namespace as n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'confirm_family_provider_selection'
         and not p.prosecdef
         and p.proconfig = array['search_path=""']
         and has_function_privilege('authenticated', p.oid, 'EXECUTE')
         and not has_function_privilege('anon', p.oid, 'EXECUTE')
         and not has_function_privilege('service_role', p.oid, 'EXECUTE')
     )
     or not exists (
       select 1
       from pg_proc as p
       join pg_namespace as n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'get_family_provider_selection_projection'
         and not p.prosecdef
         and p.proconfig = array['search_path=""']
         and has_function_privilege('authenticated', p.oid, 'EXECUTE')
         and not has_function_privilege('anon', p.oid, 'EXECUTE')
         and not has_function_privilege('service_role', p.oid, 'EXECUTE')
     ) then
    raise exception 'Provider discovery failed: public wrappers are not narrow SECURITY INVOKER functions';
  end if;

  if has_table_privilege(
       'authenticated', 'public.family_provider_selections', 'SELECT'
     )
     or has_table_privilege(
       'authenticated', 'public.family_provider_selections',
       'INSERT,UPDATE,DELETE'
     )
     or has_table_privilege(
       'authenticated',
       'passage_private.synthetic_provider_directory',
       'SELECT,INSERT,UPDATE,DELETE'
     )
     or exists (
       select 1
       from pg_proc as p
       join pg_namespace as n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in (
           'confirm_family_provider_selection',
           'get_family_provider_selection_projection'
         )
         and lower(pg_catalog.pg_get_function_result(p.oid))
           ~ '(selection_id|continuity_space_id|source_kind|source_key|dataset_version|request_digest|event_id)'
     ) then
    raise exception 'Provider discovery failed: direct tables or internal projection fields are exposed';
  end if;

  if (select count(*) from passage_private.synthetic_provider_directory) <> 6
     or (select count(*) from passage_private.synthetic_provider_directory
         where organization_id is not null
           and organization_location_id is not null) <> 1
     or exists (select 1 from public.family_provider_selections)
     or (select count(*) from public.workflow_events) <> 8 then
    raise exception 'Provider discovery failed: isolated baseline cardinality drifted';
  end if;
end
$provider_discovery_postflight$;
