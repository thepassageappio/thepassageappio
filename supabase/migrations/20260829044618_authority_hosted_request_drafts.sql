create table public.authority_records (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default (
    'PA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  assigned_reviewer_id uuid references auth.users(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  status text not null default 'draft' check (
    status in (
      'draft', 'awaiting_principal', 'awaiting_representative', 'evidence_required',
      'ready_to_submit', 'under_review', 'information_requested', 'accepted',
      'accepted_with_limits', 'rejected', 'declined', 'withdrawn', 'revoked',
      'expired', 'canceled'
    )
  ),
  template_key text not null,
  template_version text not null,
  purpose text not null default 'Request recognition of limited financial power of attorney authority',
  account_boundary text not null check (char_length(btrim(account_boundary)) between 3 and 240),
  principal_name text not null check (char_length(btrim(principal_name)) between 2 and 160),
  principal_email_normalized text not null check (
    principal_email_normalized = lower(btrim(principal_email_normalized))
  ),
  representative_name text not null check (char_length(btrim(representative_name)) between 2 and 160),
  representative_email_normalized text not null check (
    representative_email_normalized = lower(btrim(representative_email_normalized))
  ),
  allowed_action_keys text[] not null check (
    cardinality(allowed_action_keys) > 0
    and allowed_action_keys <@ array['receive_duplicate_statements', 'discuss_service_issues']::text[]
  ),
  prohibited_action_keys text[] not null default array[
    'move_money', 'open_or_close_account', 'change_ownership', 'change_beneficiaries',
    'trade_investments', 'borrow_money', 'change_credentials'
  ]::text[],
  valid_until timestamptz not null,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (principal_email_normalized <> representative_email_normalized),
  check (
    (status = 'draft' and activated_at is null)
    or (status <> 'draft' and activated_at is not null)
  )
);

create index authority_records_org_status_updated_idx
  on public.authority_records(organization_id, status, updated_at desc);
create index authority_records_created_by_idx
  on public.authority_records(created_by, created_at desc);
create index authority_records_assigned_reviewer_idx
  on public.authority_records(assigned_reviewer_id, status, updated_at desc)
  where assigned_reviewer_id is not null;

create table public.authority_events (
  sequence_id bigint generated always as identity primary key,
  event_id uuid not null unique default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  sequence bigint not null check (sequence > 0),
  record_version bigint not null check (record_version > 0),
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete restrict,
  actor_role text not null,
  summary text not null,
  detail text not null,
  audience text[] not null default '{}'::text[],
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz not null default now(),
  unique (authority_record_id, sequence)
);

create index authority_events_org_sequence_idx
  on public.authority_events(organization_id, sequence_id desc);
create index authority_events_record_sequence_idx
  on public.authority_events(authority_record_id, sequence);
create index authority_events_actor_idx
  on public.authority_events(actor_user_id, occurred_at desc)
  where actor_user_id is not null;

create or replace function authority_private.prevent_authority_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'authority_events_are_append_only';
end;
$$;

create trigger authority_events_append_only
before update or delete on public.authority_events
for each row execute function authority_private.prevent_authority_event_mutation();

create or replace function authority_private.assert_authority_record_operator(
  p_organization_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_role text;
begin
  select role into v_role
  from public.organization_memberships
  where organization_id = p_organization_id
    and user_id = v_actor
    and status = 'active';

  if v_role is null or v_role not in ('owner', 'admin', 'staff', 'reviewer') then
    raise exception using errcode = '42501', message = 'authority_request_creation_not_allowed';
  end if;

  return v_role;
end;
$$;

create or replace function authority_private.create_authority_draft_v1(
  p_organization_id uuid,
  p_principal_name text,
  p_principal_email text,
  p_representative_name text,
  p_representative_email text,
  p_account_boundary text,
  p_valid_until timestamptz,
  p_allowed_action_keys text[],
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_role text;
  v_organization public.organizations%rowtype;
  v_template public.organization_template_selections%rowtype;
  v_principal_email text := authority_private.normalized_email(p_principal_email);
  v_representative_email text := authority_private.normalized_email(p_representative_email);
  v_action_keys text[];
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_record public.authority_records%rowtype;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  select array_agg(distinct action_key order by action_key) into v_action_keys
  from unnest(coalesce(p_allowed_action_keys, '{}'::text[])) as action_key;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'principal_name', btrim(p_principal_name),
    'principal_email', v_principal_email,
    'representative_name', btrim(p_representative_name),
    'representative_email', v_representative_email,
    'account_boundary', btrim(p_account_boundary),
    'valid_until', p_valid_until,
    'allowed_action_keys', v_action_keys
  ));

  perform pg_advisory_xact_lock(hashtextextended(v_actor::text || ':create_authority_draft:' || p_idempotency_key::text, 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'create_authority_draft'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_organization
  from public.organizations
  where id = p_organization_id;

  if not found or v_organization.status <> 'active' or v_organization.onboarding_status <> 'ready' then
    raise exception using errcode = '42501', message = 'organization_not_ready';
  end if;

  v_actor_role := authority_private.assert_authority_record_operator(p_organization_id);

  select * into v_template
  from public.organization_template_selections
  where organization_id = p_organization_id;

  if not found or v_template.template_key <> 'ny_financial_poa' then
    raise exception using errcode = '22023', message = 'authority_template_not_selected';
  end if;

  if nullif(btrim(p_principal_name), '') is null or char_length(btrim(p_principal_name)) not between 2 and 160
    or nullif(btrim(p_representative_name), '') is null or char_length(btrim(p_representative_name)) not between 2 and 160 then
    raise exception using errcode = '22023', message = 'participant_name_invalid';
  end if;
  if v_principal_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or v_representative_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = '22023', message = 'participant_email_invalid';
  end if;
  if v_principal_email = v_representative_email then
    raise exception using errcode = '22023', message = 'participant_roles_must_be_distinct';
  end if;
  if nullif(btrim(p_account_boundary), '') is null or char_length(btrim(p_account_boundary)) not between 3 and 240 then
    raise exception using errcode = '22023', message = 'account_boundary_invalid';
  end if;
  if p_valid_until is null or p_valid_until <= now() or p_valid_until > now() + interval '5 years' then
    raise exception using errcode = '22023', message = 'valid_until_invalid';
  end if;
  if v_action_keys is null or cardinality(v_action_keys) = 0
    or not (v_action_keys <@ array['receive_duplicate_statements', 'discuss_service_issues']::text[]) then
    raise exception using errcode = '22023', message = 'allowed_action_invalid';
  end if;

  insert into public.authority_records (
    organization_id, created_by, status, template_key, template_version,
    account_boundary, principal_name, principal_email_normalized,
    representative_name, representative_email_normalized, allowed_action_keys,
    valid_until
  ) values (
    p_organization_id, v_actor, 'draft', v_template.template_key, v_template.template_version,
    btrim(p_account_boundary), btrim(p_principal_name), v_principal_email,
    btrim(p_representative_name), v_representative_email, v_action_keys,
    p_valid_until
  ) returning * into v_record;

  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    p_organization_id, v_record.id, 1, 1, 'authority.draft_created',
    v_actor, v_actor_role, 'Authority request draft created',
    'The institution saved participant, scope, policy, and end-date details without sending invitations or using a transaction.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object(
      'reference_code', v_record.reference_code,
      'template_key', v_record.template_key,
      'template_version', v_record.template_version,
      'allowed_action_keys', v_record.allowed_action_keys
    )
  );

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'authority.draft_created', 'authority_record', v_record.id,
    jsonb_build_object('reference_code', v_record.reference_code, 'status', v_record.status)
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'status', v_record.status,
    'version', v_record.version
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'create_authority_draft', p_idempotency_key, v_payload_hash, v_result
  );

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.create_authority_draft_v1(
  p_organization_id uuid,
  p_principal_name text,
  p_principal_email text,
  p_representative_name text,
  p_representative_email text,
  p_account_boundary text,
  p_valid_until timestamptz,
  p_allowed_action_keys text[],
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.create_authority_draft_v1(
    p_organization_id, p_principal_name, p_principal_email,
    p_representative_name, p_representative_email, p_account_boundary,
    p_valid_until, p_allowed_action_keys, p_idempotency_key
  );
$$;

alter table public.authority_records enable row level security;
alter table public.authority_records force row level security;
alter table public.authority_events enable row level security;
alter table public.authority_events force row level security;

create policy authority_records_organization_select
on public.authority_records for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'staff', 'reviewer', 'auditor']
)));

create policy authority_events_organization_select
on public.authority_events for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'staff', 'reviewer', 'auditor']
)));

revoke all on public.authority_records from public, anon, authenticated;
revoke all on public.authority_events from public, anon, authenticated;
grant select on public.authority_records to authenticated;
grant select on public.authority_events to authenticated;

revoke execute on function authority_private.prevent_authority_event_mutation() from public, anon, authenticated;
revoke execute on function authority_private.assert_authority_record_operator(uuid) from public, anon, authenticated;
revoke execute on function authority_private.create_authority_draft_v1(uuid, text, text, text, text, text, timestamptz, text[], uuid) from public, anon, authenticated;
revoke execute on function public.create_authority_draft_v1(uuid, text, text, text, text, text, timestamptz, text[], uuid) from public, anon, authenticated;

grant execute on function authority_private.assert_authority_record_operator(uuid) to authenticated;
grant execute on function authority_private.create_authority_draft_v1(uuid, text, text, text, text, text, timestamptz, text[], uuid) to authenticated;
grant execute on function public.create_authority_draft_v1(uuid, text, text, text, text, text, timestamptz, text[], uuid) to authenticated;

comment on table public.authority_records is 'Organization-owned authority requests. Browser clients have read-only access through RLS.';
comment on table public.authority_events is 'Append-only authority request history for authorized organization users.';
