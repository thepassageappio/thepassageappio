create table public.organization_entitlements (
  organization_id uuid primary key references public.organizations(id) on delete restrict,
  offer text not null default 'free_evaluation' check (offer in ('free_evaluation', 'pilot', 'enterprise')),
  status text not null default 'not_started' check (status in ('not_started', 'active', 'past_due', 'canceled', 'expired')),
  transaction_limit integer check (transaction_limit is null or transaction_limit > 0),
  activated_count integer not null default 0 check (activated_count >= 0),
  period_started_at timestamptz,
  period_ends_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (offer <> 'free_evaluation' or transaction_limit = 5),
  check (
    (status = 'not_started' and activated_count = 0 and period_started_at is null and period_ends_at is null)
    or (status <> 'not_started' and period_started_at is not null and period_ends_at is not null)
  ),
  check (period_ends_at is null or period_started_at is null or period_ends_at > period_started_at)
);

create index organization_entitlements_status_period_idx
  on public.organization_entitlements(status, period_ends_at);

create table public.authority_usage_events (
  sequence_id bigint generated always as identity primary key,
  event_id uuid not null unique default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  event_type text not null check (event_type in ('authority_activated')),
  quantity integer not null default 1 check (quantity = 1),
  entitlement_version bigint not null check (entitlement_version > 0),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  unique (authority_record_id, event_type)
);

create index authority_usage_events_org_sequence_idx
  on public.authority_usage_events(organization_id, sequence_id desc);
create index authority_usage_events_actor_idx
  on public.authority_usage_events(actor_user_id, occurred_at desc);

create table public.authority_participant_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  participant_role text not null check (participant_role in ('principal', 'representative')),
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized))),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz not null,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (authority_record_id, participant_role),
  check (expires_at > created_at),
  check (
    (status = 'pending' and accepted_at is null and revoked_at is null)
    or (status = 'accepted' and accepted_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null)
    or (status = 'expired' and accepted_at is null)
  )
);

create index authority_participant_invitations_org_status_idx
  on public.authority_participant_invitations(organization_id, status, created_at desc);
create index authority_participant_invitations_email_status_idx
  on public.authority_participant_invitations(email_normalized, status, expires_at);
create index authority_participant_invitations_invited_by_idx
  on public.authority_participant_invitations(invited_by, created_at desc);

create table authority_private.participant_invitation_secrets (
  invitation_id uuid primary key references public.authority_participant_invitations(id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create table authority_private.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  invitation_id uuid not null references public.authority_participant_invitations(id) on delete restrict,
  template_key text not null,
  recipient_email_normalized text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'delivered', 'retrying', 'failed', 'canceled')),
  attempts integer not null default 0 check (attempts >= 0),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  last_error_code text,
  next_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_id, template_key)
);

create index notification_outbox_status_attempt_idx
  on authority_private.notification_outbox(status, next_attempt_at, created_at);
create index notification_outbox_record_idx
  on authority_private.notification_outbox(authority_record_id, created_at);

create or replace function authority_private.create_default_entitlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_entitlements (
    organization_id, offer, status, transaction_limit
  ) values (
    new.id, 'free_evaluation', 'not_started', 5
  ) on conflict (organization_id) do nothing;
  return new;
end;
$$;

create trigger organizations_create_default_entitlement
after insert on public.organizations
for each row execute function authority_private.create_default_entitlement();

insert into public.organization_entitlements (
  organization_id, offer, status, transaction_limit
)
select id, 'free_evaluation', 'not_started', 5
from public.organizations
on conflict (organization_id) do nothing;

create or replace function authority_private.prevent_usage_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'authority_usage_events_are_append_only';
end;
$$;

create trigger authority_usage_events_append_only
before update or delete on public.authority_usage_events
for each row execute function authority_private.prevent_usage_event_mutation();

create or replace function authority_private.activate_authority_request_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
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
  v_record public.authority_records%rowtype;
  v_entitlement public.organization_entitlements%rowtype;
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_started_at timestamptz;
  v_ends_at timestamptz;
  v_principal_invitation_id uuid;
  v_representative_invitation_id uuid;
  v_principal_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_representative_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_invitation_expires_at timestamptz := now() + interval '72 hours';
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_record_id', p_authority_record_id,
    'expected_version', p_expected_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':activate', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'activate_authority_request'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object(
      'replayed', true,
      'principal_token', null,
      'representative_token', null
    );
  end if;

  v_actor_role := authority_private.assert_authority_record_operator(p_organization_id);

  select * into v_record
  from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'authority_request_not_found';
  end if;
  if v_record.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'stale_authority_version';
  end if;
  if v_record.status <> 'draft' or v_record.activated_at is not null then
    raise exception using errcode = '22023', message = 'authority_request_not_activatable';
  end if;

  select * into v_entitlement
  from public.organization_entitlements
  where organization_id = p_organization_id
  for update;

  if not found or v_entitlement.offer <> 'free_evaluation' then
    raise exception using errcode = '22023', message = 'evaluation_entitlement_unavailable';
  end if;
  if v_entitlement.status not in ('not_started', 'active') then
    raise exception using errcode = '22023', message = 'evaluation_not_active';
  end if;
  if v_entitlement.status = 'active' and v_entitlement.period_ends_at <= now() then
    raise exception using errcode = '22023', message = 'evaluation_expired';
  end if;
  if v_entitlement.activated_count >= v_entitlement.transaction_limit then
    raise exception using errcode = '22023', message = 'evaluation_limit_reached';
  end if;

  v_started_at := coalesce(v_entitlement.period_started_at, now());
  v_ends_at := coalesce(v_entitlement.period_ends_at, now() + interval '10 days');

  insert into public.authority_participant_invitations (
    organization_id, authority_record_id, participant_role, email_normalized,
    invited_by, expires_at
  ) values (
    p_organization_id, p_authority_record_id, 'principal',
    v_record.principal_email_normalized, v_actor, v_invitation_expires_at
  ) returning id into v_principal_invitation_id;

  insert into public.authority_participant_invitations (
    organization_id, authority_record_id, participant_role, email_normalized,
    invited_by, expires_at
  ) values (
    p_organization_id, p_authority_record_id, 'representative',
    v_record.representative_email_normalized, v_actor, v_invitation_expires_at
  ) returning id into v_representative_invitation_id;

  insert into authority_private.participant_invitation_secrets (invitation_id, token_hash)
  values
    (v_principal_invitation_id, encode(extensions.digest(convert_to(v_principal_token, 'UTF8'), 'sha256'), 'hex')),
    (v_representative_invitation_id, encode(extensions.digest(convert_to(v_representative_token, 'UTF8'), 'sha256'), 'hex'));

  insert into authority_private.notification_outbox (
    organization_id, authority_record_id, invitation_id, template_key,
    recipient_email_normalized, payload
  ) values
    (
      p_organization_id, p_authority_record_id, v_principal_invitation_id,
      'principal_authority_invitation', v_record.principal_email_normalized,
      jsonb_build_object('reference_code', v_record.reference_code, 'participant_role', 'principal')
    ),
    (
      p_organization_id, p_authority_record_id, v_representative_invitation_id,
      'representative_authority_invitation', v_record.representative_email_normalized,
      jsonb_build_object('reference_code', v_record.reference_code, 'participant_role', 'representative')
    );

  update public.authority_records
  set status = 'awaiting_principal', activated_at = now(),
      version = version + 1, updated_at = now()
  where id = p_authority_record_id
  returning * into v_record;

  update public.organization_entitlements
  set status = 'active', activated_count = activated_count + 1,
      period_started_at = v_started_at, period_ends_at = v_ends_at,
      version = version + 1, updated_at = now()
  where organization_id = p_organization_id
  returning * into v_entitlement;

  insert into public.authority_usage_events (
    organization_id, authority_record_id, event_type, quantity,
    entitlement_version, actor_user_id
  ) values (
    p_organization_id, p_authority_record_id, 'authority_activated', 1,
    v_entitlement.version, v_actor
  );

  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    p_organization_id, p_authority_record_id, 2, v_record.version,
    'authority.activated', v_actor, v_actor_role,
    'Authority request activated',
    'The evaluation clock started, one transaction was counted, and separate secure participant invitations were queued.',
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object(
      'activated_count', v_entitlement.activated_count,
      'transaction_limit', v_entitlement.transaction_limit,
      'period_started_at', v_entitlement.period_started_at,
      'period_ends_at', v_entitlement.period_ends_at,
      'principal_invitation_id', v_principal_invitation_id,
      'representative_invitation_id', v_representative_invitation_id
    )
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'authority.activated', 'authority_record', p_authority_record_id,
    jsonb_build_object(
      'reference_code', v_record.reference_code,
      'activated_count', v_entitlement.activated_count,
      'transaction_limit', v_entitlement.transaction_limit
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'status', v_record.status,
    'version', v_record.version,
    'event_id', v_event_id,
    'activated_count', v_entitlement.activated_count,
    'transaction_limit', v_entitlement.transaction_limit,
    'period_started_at', v_entitlement.period_started_at,
    'period_ends_at', v_entitlement.period_ends_at,
    'invitation_expires_at', v_invitation_expires_at,
    'principal_invitation_id', v_principal_invitation_id,
    'representative_invitation_id', v_representative_invitation_id,
    'notifications_queued', 2
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'activate_authority_request', p_idempotency_key, v_payload_hash, v_result
  );

  return v_result || jsonb_build_object(
    'replayed', false,
    'principal_token', v_principal_token,
    'representative_token', v_representative_token
  );
end;
$$;

create or replace function public.activate_authority_request_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.activate_authority_request_v1(
    p_organization_id, p_authority_record_id, p_expected_version, p_idempotency_key
  );
$$;

alter table public.organization_entitlements enable row level security;
alter table public.organization_entitlements force row level security;
alter table public.authority_usage_events enable row level security;
alter table public.authority_usage_events force row level security;
alter table public.authority_participant_invitations enable row level security;
alter table public.authority_participant_invitations force row level security;

create policy organization_entitlements_member_select
on public.organization_entitlements for select to authenticated
using ((select authority_private.has_active_membership(organization_id)));

create policy authority_usage_events_authorized_select
on public.authority_usage_events for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'reviewer', 'auditor']
)));

create policy authority_participant_invitations_authorized_select
on public.authority_participant_invitations for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'staff', 'reviewer', 'auditor']
)));

revoke all on public.organization_entitlements from public, anon, authenticated;
revoke all on public.authority_usage_events from public, anon, authenticated;
revoke all on public.authority_participant_invitations from public, anon, authenticated;
grant select on public.organization_entitlements to authenticated;
grant select on public.authority_usage_events to authenticated;
grant select on public.authority_participant_invitations to authenticated;

revoke all on authority_private.participant_invitation_secrets from public, anon, authenticated;
revoke all on authority_private.notification_outbox from public, anon, authenticated;

revoke execute on function authority_private.create_default_entitlement() from public, anon, authenticated;
revoke execute on function authority_private.prevent_usage_event_mutation() from public, anon, authenticated;
revoke execute on function authority_private.activate_authority_request_v1(uuid, uuid, bigint, uuid) from public, anon, authenticated;
revoke execute on function public.activate_authority_request_v1(uuid, uuid, bigint, uuid) from public, anon, authenticated;
grant execute on function authority_private.activate_authority_request_v1(uuid, uuid, bigint, uuid) to authenticated;
grant execute on function public.activate_authority_request_v1(uuid, uuid, bigint, uuid) to authenticated;

comment on table public.organization_entitlements is 'Organization commercial access and activated transaction usage.';
comment on table public.authority_usage_events is 'Append-only activated transaction accounting.';
comment on table public.authority_participant_invitations is 'Hashed, expiring role invitations for authority request participants.';
comment on table authority_private.notification_outbox is 'Non-exposed participant notification delivery queue. Raw invitation tokens are not stored.';
