-- Passage Authority V2 commercial foundation.
-- Provider payloads and commercial history are server-only. The browser receives
-- only the existing organization_entitlements projection.

create table authority_private.commercial_accounts (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (length(btrim(legal_name)) between 2 and 200),
  display_name text not null check (length(btrim(display_name)) between 2 and 120),
  account_type text not null check (account_type in ('financial_institution', 'law_firm', 'authorized_service_organization', 'fintech_partner', 'other')),
  status text not null default 'evaluating' check (status in ('evaluating', 'pilot', 'customer', 'past_due', 'churned', 'closed')),
  reporting_currency text not null default 'usd' check (reporting_currency ~ '^[a-z]{3}$'),
  parent_account_id uuid references authority_private.commercial_accounts(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table authority_private.commercial_account_workspaces (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references authority_private.commercial_accounts(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  relationship_type text not null default 'owner' check (relationship_type in ('owner', 'affiliate', 'service_provider')),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);

create unique index commercial_account_workspaces_one_active_owner
  on authority_private.commercial_account_workspaces(organization_id)
  where relationship_type = 'owner' and effective_to is null;
create index commercial_account_workspaces_account_idx
  on authority_private.commercial_account_workspaces(account_id, effective_from desc);

create table authority_private.commercial_contracts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references authority_private.commercial_accounts(id) on delete restrict,
  contract_number text not null unique,
  status text not null check (status in ('draft', 'pending_payment', 'active', 'ended', 'canceled')),
  signed_at timestamptz,
  service_period_start date not null,
  service_period_end date not null,
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  committed_amount_minor bigint not null check (committed_amount_minor >= 0),
  payment_terms text not null default 'due_on_receipt',
  predecessor_contract_id uuid references authority_private.commercial_contracts(id) on delete restrict,
  source_deal_external_id text,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (service_period_end > service_period_start)
);

create table authority_private.commercial_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references authority_private.commercial_accounts(id) on delete restrict,
  contract_id uuid not null references authority_private.commercial_contracts(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  plan_bucket text not null check (plan_bucket in ('founding_pilot', 'core', 'scale', 'enterprise')),
  status text not null check (status in ('pending', 'active', 'grace', 'past_due', 'canceled', 'expired')),
  starts_on date not null,
  ends_on date not null,
  recurring_amount_minor bigint not null check (recurring_amount_minor >= 0),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  predecessor_subscription_id uuid references authority_private.commercial_subscriptions(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on > starts_on)
);

create unique index commercial_subscriptions_one_active_per_workspace
  on authority_private.commercial_subscriptions(organization_id)
  where status in ('pending', 'active', 'grace', 'past_due');

create table authority_private.commercial_orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references authority_private.commercial_accounts(id) on delete restrict,
  subscription_id uuid references authority_private.commercial_subscriptions(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  order_type text not null check (order_type in ('pilot', 'annual_base', 'top_up')),
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'paid', 'failed', 'refunded', 'canceled')),
  quantity integer not null check (quantity > 0),
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  service_period_start date not null,
  service_period_end date not null,
  stripe_customer_id text,
  stripe_invoice_id text unique,
  hubspot_deal_id text unique,
  idempotency_key uuid not null unique,
  paid_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (service_period_end > service_period_start),
  check ((status = 'paid' and paid_at is not null) or status <> 'paid')
);

create table authority_private.commercial_allowance_lots (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references authority_private.commercial_subscriptions(id) on delete restrict,
  source_order_id uuid not null references authority_private.commercial_orders(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  units_granted integer not null check (units_granted > 0),
  effective_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('pending', 'active', 'exhausted', 'expired', 'reversed')),
  created_at timestamptz not null default now(),
  unique (source_order_id),
  check (expires_at > effective_at)
);

create table authority_private.commercial_usage_allocations (
  id uuid primary key default gen_random_uuid(),
  allowance_lot_id uuid not null references authority_private.commercial_allowance_lots(id) on delete restrict,
  authority_usage_event_id uuid not null references public.authority_usage_events(event_id) on delete restrict,
  quantity integer not null default 1 check (quantity = 1),
  allocated_at timestamptz not null default now(),
  unique (authority_usage_event_id)
);

create table authority_private.commercial_event_ledger (
  sequence_id bigint generated always as identity primary key,
  event_id uuid not null unique default gen_random_uuid(),
  schema_version integer not null default 1 check (schema_version > 0),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  correlation_id uuid,
  causation_id uuid,
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object')
);

create table authority_private.provider_event_inbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'hubspot')),
  provider_event_id text not null,
  signature_status text not null check (signature_status in ('valid', 'invalid')),
  body_sha256 text not null check (body_sha256 ~ '^[0-9a-f]{64}$'),
  provider_created_at timestamptz,
  status text not null default 'received' check (status in ('received', 'processing', 'applied', 'ignored', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error_code text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create table authority_private.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  destination text not null check (destination in ('stripe', 'hubspot')),
  operation text not null,
  subject_type text not null,
  subject_id uuid not null,
  projection_version bigint not null check (projection_version > 0),
  idempotency_key text not null unique,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'retrying', 'applied', 'failed', 'canceled')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index integration_outbox_work_idx
  on authority_private.integration_outbox(status, next_attempt_at, created_at);

create table authority_private.commercial_adjustments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references authority_private.commercial_accounts(id) on delete restrict,
  order_id uuid references authority_private.commercial_orders(id) on delete restrict,
  adjustment_type text not null check (adjustment_type in ('refund', 'credit', 'dispute', 'write_off')),
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  provider_reference text unique,
  occurred_at timestamptz not null,
  reason_code text not null,
  created_at timestamptz not null default now()
);

create or replace function authority_private.ingest_stripe_event_v1(
  p_provider_event_id text,
  p_provider_created_at timestamptz,
  p_body_sha256 text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if length(btrim(coalesce(p_provider_event_id, ''))) = 0
     or p_body_sha256 !~ '^[0-9a-f]{64}$'
     or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'stripe_event_invalid';
  end if;

  insert into authority_private.provider_event_inbox (
    provider, provider_event_id, signature_status, body_sha256,
    provider_created_at, payload
  ) values (
    'stripe', p_provider_event_id, 'valid', p_body_sha256,
    p_provider_created_at, p_payload
  )
  on conflict (provider, provider_event_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from authority_private.provider_event_inbox
    where provider = 'stripe' and provider_event_id = p_provider_event_id;
    return jsonb_build_object('received', true, 'replayed', true, 'inbox_id', v_id);
  end if;

  return jsonb_build_object('received', true, 'replayed', false, 'inbox_id', v_id);
end;
$$;

create or replace function public.ingest_stripe_event_v1(
  p_provider_event_id text,
  p_provider_created_at timestamptz,
  p_body_sha256 text,
  p_payload jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.ingest_stripe_event_v1(
    p_provider_event_id, p_provider_created_at, p_body_sha256, p_payload
  );
$$;

create or replace function authority_private.prevent_commercial_history_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'commercial_history_is_append_only';
end;
$$;

create trigger commercial_event_ledger_append_only
before update or delete on authority_private.commercial_event_ledger
for each row execute function authority_private.prevent_commercial_history_mutation();

create trigger commercial_adjustments_append_only
before update or delete on authority_private.commercial_adjustments
for each row execute function authority_private.prevent_commercial_history_mutation();

revoke all on all tables in schema authority_private from public, anon, authenticated;
revoke execute on function authority_private.prevent_commercial_history_mutation() from public, anon, authenticated;
revoke execute on function authority_private.ingest_stripe_event_v1(text, timestamptz, text, jsonb) from public, anon, authenticated;
revoke execute on function public.ingest_stripe_event_v1(text, timestamptz, text, jsonb) from public, anon, authenticated;
grant execute on function authority_private.ingest_stripe_event_v1(text, timestamptz, text, jsonb) to service_role;
grant execute on function public.ingest_stripe_event_v1(text, timestamptz, text, jsonb) to service_role;

comment on table authority_private.commercial_accounts is 'Server-only legal customer and revenue relationship; never contains authority participant data.';
comment on table authority_private.commercial_orders is 'Idempotent pilot, annual, and top-up order records awaiting verified provider events.';
comment on table authority_private.provider_event_inbox is 'Durable signed provider event evidence; provider payloads remain server-only.';
comment on table authority_private.integration_outbox is 'Retryable provider projection commands that cannot alter authority records directly.';
