create table public.demo_runs (
  id uuid primary key,
  run_code text not null unique,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  presenter_user_id uuid not null references auth.users(id) on delete restrict,
  fixture_version text not null check (char_length(fixture_version) between 3 and 80),
  status text not null default 'active' check (status in ('active', 'read_only', 'expired')),
  version bigint not null default 1 check (version > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index demo_runs_org_created_idx
  on public.demo_runs(organization_id, created_at desc);
create index demo_runs_presenter_created_idx
  on public.demo_runs(presenter_user_id, created_at desc);

alter table public.authority_records
  add column demo_run_id uuid references public.demo_runs(id) on delete restrict;

create unique index authority_records_demo_run_idx
  on public.authority_records(demo_run_id)
  where demo_run_id is not null;

create table public.demo_run_events (
  sequence_id bigint generated always as identity primary key,
  event_id uuid not null unique default gen_random_uuid(),
  demo_run_id uuid not null references public.demo_runs(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  sequence bigint not null check (sequence > 0),
  run_version bigint not null check (run_version > 0),
  event_type text not null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  summary text not null,
  detail text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz not null default now(),
  unique (demo_run_id, sequence)
);

create index demo_run_events_org_sequence_idx
  on public.demo_run_events(organization_id, sequence_id desc);

create or replace function authority_private.prevent_demo_run_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'demo_run_events_are_append_only';
end;
$$;

create trigger demo_run_events_append_only
before update or delete on public.demo_run_events
for each row execute function authority_private.prevent_demo_run_event_mutation();

create or replace function authority_private.provision_demo_run_v1(
  p_organization_id uuid,
  p_presenter_user_id uuid,
  p_principal_email text,
  p_representative_email text,
  p_expected_entitlement_version bigint,
  p_fixture_version text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_presenter_email text;
  v_actor_role text;
  v_principal_email text := authority_private.normalized_email(p_principal_email);
  v_representative_email text := authority_private.normalized_email(p_representative_email);
  v_organization public.organizations%rowtype;
  v_template public.organization_template_selections%rowtype;
  v_entitlement public.organization_entitlements%rowtype;
  v_existing authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_run_id uuid := gen_random_uuid();
  v_run_code text;
  v_run public.demo_runs%rowtype;
  v_record public.authority_records%rowtype;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if p_presenter_user_id is null then
    raise exception using errcode = '42501', message = 'demo_presenter_not_allowed';
  end if;
  if p_fixture_version <> 'financial-poa-demo-2026.1' then
    raise exception using errcode = '22023', message = 'demo_fixture_not_available';
  end if;
  if v_principal_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or v_representative_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or v_principal_email = v_representative_email then
    raise exception using errcode = '22023', message = 'demo_recipient_configuration_invalid';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'presenter_user_id', p_presenter_user_id,
    'principal_email', v_principal_email,
    'representative_email', v_representative_email,
    'expected_entitlement_version', p_expected_entitlement_version,
    'fixture_version', p_fixture_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(
    p_presenter_user_id::text || ':provision_demo_run:' || p_idempotency_key::text, 0
  ));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = p_presenter_user_id
    and command_name = 'provision_demo_run'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select lower(btrim(email)) into v_presenter_email
  from auth.users
  where id = p_presenter_user_id and email_confirmed_at is not null;

  if v_presenter_email is null then
    raise exception using errcode = '42501', message = 'demo_presenter_not_allowed';
  end if;

  select role into v_actor_role
  from public.organization_memberships
  where organization_id = p_organization_id
    and user_id = p_presenter_user_id
    and status = 'active';

  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'demo_presenter_not_allowed';
  end if;

  select * into v_organization
  from public.organizations
  where id = p_organization_id;

  if not found or v_organization.status <> 'active' or v_organization.onboarding_status <> 'ready' then
    raise exception using errcode = '42501', message = 'organization_not_ready';
  end if;

  select * into v_template
  from public.organization_template_selections
  where organization_id = p_organization_id;

  if not found or v_template.template_key <> 'ny_financial_poa' then
    raise exception using errcode = '22023', message = 'authority_template_not_selected';
  end if;

  select * into v_entitlement
  from public.organization_entitlements
  where organization_id = p_organization_id;

  if not found or v_entitlement.version <> p_expected_entitlement_version then
    raise exception using errcode = 'P0001', message = 'stale_demo_context';
  end if;
  if v_entitlement.status not in ('not_started', 'active')
    or (v_entitlement.period_ends_at is not null and v_entitlement.period_ends_at <= v_now)
    or (v_entitlement.transaction_limit is not null and v_entitlement.activated_count >= v_entitlement.transaction_limit) then
    raise exception using errcode = '22023', message = 'demo_entitlement_unavailable';
  end if;

  v_run_code := 'DEMO-' || to_char(v_now at time zone 'UTC', 'YYYYMMDD') || '-'
    || upper(substr(replace(v_run_id::text, '-', ''), 1, 6));

  insert into public.demo_runs (
    id, run_code, organization_id, presenter_user_id, fixture_version, status, version, expires_at
  ) values (
    v_run_id, v_run_code, p_organization_id, p_presenter_user_id,
    p_fixture_version, 'active', 1, v_now + interval '7 days'
  ) returning * into v_run;

  insert into public.authority_records (
    organization_id, created_by, demo_run_id, status, template_key, template_version,
    account_boundary, principal_name, principal_email_normalized,
    representative_name, representative_email_normalized, allowed_action_keys,
    valid_until
  ) values (
    p_organization_id, p_presenter_user_id, v_run.id, 'draft',
    v_template.template_key, v_template.template_version,
    'Sample deposit relationship ending 4405', 'Parker Quinn', v_principal_email,
    'Casey Quinn', v_representative_email,
    array['receive_duplicate_statements', 'discuss_service_issues']::text[],
    v_now + interval '1 year'
  ) returning * into v_record;

  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload, occurred_at
  ) values (
    p_organization_id, v_record.id, 1, 1, 'authority.draft_created',
    p_presenter_user_id, v_actor_role, 'Fresh demo request prepared',
    'The sample participants, scope, policy, and end date were saved without sending a message or counting a request.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object(
      'reference_code', v_record.reference_code,
      'template_key', v_record.template_key,
      'template_version', v_record.template_version,
      'allowed_action_keys', v_record.allowed_action_keys,
      'demo_run_id', v_run.id,
      'fixture_version', v_run.fixture_version
    ),
    v_now
  );

  insert into public.demo_run_events (
    demo_run_id, organization_id, sequence, run_version, event_type,
    actor_user_id, summary, detail, payload, occurred_at
  ) values (
    v_run.id, p_organization_id, 1, 1, 'demo.run_provisioned',
    p_presenter_user_id, 'Fresh demo prepared',
    'A new sample request was prepared. Earlier demo runs and organization access were not changed.',
    jsonb_build_object(
      'authority_record_id', v_record.id,
      'reference_code', v_record.reference_code,
      'fixture_version', v_run.fixture_version,
      'entitlement_version', v_entitlement.version
    ),
    v_now
  );

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload, occurred_at
  ) values (
    p_organization_id, p_presenter_user_id, 'demo.run_provisioned', 'demo_run', v_run.id,
    jsonb_build_object(
      'run_code', v_run.run_code,
      'authority_record_id', v_record.id,
      'fixture_version', v_run.fixture_version
    ),
    v_now
  );

  v_result := jsonb_build_object(
    'demo_run_id', v_run.id,
    'run_code', v_run.run_code,
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'status', v_record.status,
    'version', v_record.version
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result, created_at
  ) values (
    p_presenter_user_id, 'provision_demo_run', p_idempotency_key, v_payload_hash, v_result, v_now
  );

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.provision_demo_run_v1(
  p_organization_id uuid,
  p_presenter_user_id uuid,
  p_principal_email text,
  p_representative_email text,
  p_expected_entitlement_version bigint,
  p_fixture_version text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.provision_demo_run_v1(
    p_organization_id, p_presenter_user_id, p_principal_email, p_representative_email,
    p_expected_entitlement_version, p_fixture_version, p_idempotency_key
  );
$$;

alter table public.demo_runs enable row level security;
alter table public.demo_runs force row level security;
alter table public.demo_run_events enable row level security;
alter table public.demo_run_events force row level security;

create policy demo_runs_organization_select
on public.demo_runs for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'auditor']
)));

create policy demo_run_events_organization_select
on public.demo_run_events for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'auditor']
)));

revoke all on public.demo_runs from public, anon, authenticated;
revoke all on public.demo_run_events from public, anon, authenticated;
grant select on public.demo_runs to authenticated;
grant select on public.demo_run_events to authenticated;
grant select on public.demo_runs to service_role;
grant select on public.demo_run_events to service_role;

revoke execute on function authority_private.prevent_demo_run_event_mutation() from public, anon, authenticated;
revoke execute on function authority_private.provision_demo_run_v1(uuid, uuid, text, text, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function public.provision_demo_run_v1(uuid, uuid, text, text, bigint, text, uuid) from public, anon, authenticated;
grant execute on function authority_private.provision_demo_run_v1(uuid, uuid, text, text, bigint, text, uuid) to service_role;
grant execute on function public.provision_demo_run_v1(uuid, uuid, text, text, bigint, text, uuid) to service_role;

comment on table public.demo_runs is 'Namespaced synthetic Demo runs. Production never provisions these records.';
comment on table public.demo_run_events is 'Append-only provisioning history for namespaced synthetic Demo runs.';
comment on function public.provision_demo_run_v1(uuid, uuid, text, text, bigint, text, uuid) is
  'Service-only Demo fixture command. The application separately enforces Demo environment and exact presenter and recipient allowlists.';
