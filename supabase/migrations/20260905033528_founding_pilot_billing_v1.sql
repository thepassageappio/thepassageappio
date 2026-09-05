-- Founding-pilot invoice command, Stripe outbox, and signed-event application (Demo).
-- Provider payloads and invoice identifiers remain in authority_private.

alter table authority_private.commercial_orders
  add column if not exists billing_email text,
  add column if not exists hosted_invoice_url text,
  add column if not exists invoice_number text;

create or replace function authority_private.request_pilot_invoice_v1(
  p_organization_id uuid,
  p_service_period_start date,
  p_service_period_end date,
  p_request_allowance integer,
  p_expected_entitlement_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_email text := authority_private.current_actor_email();
  v_org public.organizations%rowtype;
  v_entitlement public.organization_entitlements%rowtype;
  v_account_id uuid;
  v_contract_id uuid := gen_random_uuid();
  v_subscription_id uuid := gen_random_uuid();
  v_order_id uuid := gen_random_uuid();
  v_outbox_id uuid;
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if not authority_private.has_active_membership(p_organization_id, array['owner','admin']) then
    raise exception using errcode = '42501', message = 'pilot_invoice_not_allowed';
  end if;
  if p_service_period_start is null or p_service_period_end is null
     or p_service_period_end - p_service_period_start not between 60 and 90
     or p_service_period_start < current_date then
    raise exception using errcode = '22023', message = 'pilot_service_period_invalid';
  end if;
  if p_request_allowance not between 1 and 500 then
    raise exception using errcode = '22023', message = 'pilot_allowance_invalid';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'service_period_start', p_service_period_start,
    'service_period_end', p_service_period_end,
    'request_allowance', p_request_allowance,
    'expected_entitlement_version', p_expected_entitlement_version
  ));
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':pilot_invoice', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'request_pilot_invoice'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_org from public.organizations where id = p_organization_id and status = 'active';
  if v_org.id is null or v_org.onboarding_status <> 'ready' then
    raise exception using errcode = '22023', message = 'organization_not_ready';
  end if;
  select * into v_entitlement
  from public.organization_entitlements
  where organization_id = p_organization_id
  for update;
  if v_entitlement.organization_id is null or v_entitlement.version <> p_expected_entitlement_version then
    raise exception using errcode = '40001', message = 'stale_entitlement_version';
  end if;
  if v_entitlement.offer <> 'free_evaluation' then
    raise exception using errcode = '22023', message = 'pilot_invoice_not_allowed';
  end if;
  if exists (
    select 1 from authority_private.commercial_orders
    where organization_id = p_organization_id and status in ('pending','invoiced','paid')
  ) then
    raise exception using errcode = '55000', message = 'pilot_order_already_open';
  end if;

  select workspace.account_id into v_account_id
  from authority_private.commercial_account_workspaces workspace
  where workspace.organization_id = p_organization_id
    and workspace.relationship_type = 'owner'
    and workspace.effective_to is null;
  if v_account_id is null then
    insert into authority_private.commercial_accounts (legal_name, display_name, account_type)
    values (
      v_org.legal_name,
      v_org.display_name,
      case v_org.organization_type
        when 'regional_bank' then 'financial_institution'
        when 'credit_union' then 'financial_institution'
        when 'elder_law_firm' then 'law_firm'
        when 'authorized_service_organization' then 'authorized_service_organization'
        else 'other'
      end
    ) returning id into v_account_id;
    insert into authority_private.commercial_account_workspaces (account_id, organization_id)
    values (v_account_id, p_organization_id);
  end if;

  insert into authority_private.commercial_contracts (
    id, account_id, contract_number, status, service_period_start,
    service_period_end, committed_amount_minor, payment_terms
  ) values (
    v_contract_id, v_account_id, 'PILOT-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 12)),
    'pending_payment', p_service_period_start, p_service_period_end, 500000, 'net_30'
  );
  insert into authority_private.commercial_subscriptions (
    id, account_id, contract_id, organization_id, plan_bucket, status,
    starts_on, ends_on, recurring_amount_minor
  ) values (
    v_subscription_id, v_account_id, v_contract_id, p_organization_id,
    'founding_pilot', 'pending', p_service_period_start, p_service_period_end, 0
  );
  insert into authority_private.commercial_orders (
    id, account_id, subscription_id, organization_id, order_type, status,
    quantity, amount_minor, service_period_start, service_period_end,
    billing_email, idempotency_key
  ) values (
    v_order_id, v_account_id, v_subscription_id, p_organization_id, 'pilot', 'pending',
    p_request_allowance, 500000, p_service_period_start, p_service_period_end,
    v_actor_email, p_idempotency_key
  );
  insert into authority_private.integration_outbox (
    destination, operation, subject_type, subject_id, projection_version,
    idempotency_key, payload
  ) values (
    'stripe', 'create_pilot_invoice', 'commercial_order', v_order_id, 1,
    'stripe-pilot-invoice:' || v_order_id::text,
    jsonb_build_object(
      'order_id', v_order_id,
      'organization_id', p_organization_id,
      'organization_name', v_org.legal_name,
      'billing_email', v_actor_email,
      'service_period_start', p_service_period_start,
      'service_period_end', p_service_period_end,
      'request_allowance', p_request_allowance,
      'amount_minor', 500000,
      'currency', 'usd'
    )
  ) returning id into v_outbox_id;

  insert into authority_private.commercial_event_ledger (
    aggregate_type, aggregate_id, event_type, occurred_at, correlation_id,
    idempotency_key, payload
  ) values (
    'commercial_order', v_order_id, 'commercial.pilot_invoice_requested', now(), p_idempotency_key,
    'pilot-invoice-requested:' || v_order_id::text,
    jsonb_build_object('organization_id', p_organization_id, 'outbox_id', v_outbox_id)
  );
  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'billing.pilot_invoice_requested', 'commercial_order', v_order_id,
    jsonb_build_object('service_period_start', p_service_period_start, 'service_period_end', p_service_period_end, 'request_allowance', p_request_allowance)
  );

  v_result := jsonb_build_object('order_id', v_order_id, 'outbox_id', v_outbox_id, 'status', 'pending');
  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'request_pilot_invoice', p_idempotency_key, v_payload_hash, v_result);
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function authority_private.claim_stripe_pilot_outbox_v1()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_job authority_private.integration_outbox%rowtype;
begin
  with candidate as (
    select id from authority_private.integration_outbox
    where destination = 'stripe' and operation = 'create_pilot_invoice'
      and ((status in ('pending','retrying') and coalesce(next_attempt_at, now()) <= now())
        or (status = 'processing' and updated_at < now() - interval '15 minutes'))
    order by created_at for update skip locked limit 1
  )
  update authority_private.integration_outbox outbox
  set status = 'processing', attempts = attempts + 1, updated_at = now(), last_error_code = null
  from candidate where outbox.id = candidate.id returning outbox.* into v_job;
  if v_job.id is null then return null; end if;
  return jsonb_build_object('id', v_job.id, 'attempts', v_job.attempts, 'idempotency_key', v_job.idempotency_key, 'payload', v_job.payload);
end;
$$;

create or replace function authority_private.complete_stripe_pilot_outbox_v1(p_outbox_id uuid, p_provider_result jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job authority_private.integration_outbox%rowtype;
  v_order authority_private.commercial_orders%rowtype;
  v_url text := p_provider_result->>'hosted_invoice_url';
begin
  if p_outbox_id is null or jsonb_typeof(p_provider_result) <> 'object'
     or nullif(btrim(p_provider_result->>'stripe_customer_id'), '') is null
     or nullif(btrim(p_provider_result->>'stripe_invoice_id'), '') is null
     or v_url !~ '^https://invoice[.]stripe[.]com/' then
    raise exception using errcode = '22023', message = 'stripe_invoice_result_invalid';
  end if;
  select * into v_job from authority_private.integration_outbox where id = p_outbox_id for update;
  if v_job.id is null then raise exception using errcode = 'P0002', message = 'stripe_job_not_found'; end if;
  if v_job.status = 'applied' then
    return jsonb_build_object('outbox_id', v_job.id, 'status', 'applied', 'replayed', true, 'hosted_invoice_url', v_job.provider_result->>'hosted_invoice_url');
  end if;
  if v_job.status <> 'processing' then raise exception using errcode = '55000', message = 'stripe_job_not_claimed'; end if;
  select * into v_order from authority_private.commercial_orders where id = v_job.subject_id for update;
  if v_order.id is null or v_order.status <> 'pending' then raise exception using errcode = '55000', message = 'stripe_order_not_pending'; end if;

  update authority_private.commercial_orders
  set status = 'invoiced', stripe_customer_id = p_provider_result->>'stripe_customer_id',
      stripe_invoice_id = p_provider_result->>'stripe_invoice_id', hosted_invoice_url = v_url,
      invoice_number = nullif(btrim(p_provider_result->>'invoice_number'), ''), version = version + 1, updated_at = now()
  where id = v_order.id;
  update authority_private.commercial_subscriptions
  set stripe_customer_id = p_provider_result->>'stripe_customer_id', version = version + 1, updated_at = now()
  where id = v_order.subscription_id;
  update authority_private.integration_outbox
  set status = 'applied', provider_result = p_provider_result, updated_at = now(), next_attempt_at = null
  where id = v_job.id;
  insert into authority_private.commercial_event_ledger (
    aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
  ) values (
    'commercial_order', v_order.id, 'commercial.stripe_invoice_created', now(),
    'stripe-invoice-created:' || v_order.id::text,
    jsonb_build_object('outbox_id', v_job.id, 'stripe_invoice_id', p_provider_result->>'stripe_invoice_id')
  ) on conflict (idempotency_key) do nothing;
  return jsonb_build_object('outbox_id', v_job.id, 'order_id', v_order.id, 'status', 'applied', 'replayed', false, 'hosted_invoice_url', v_url);
end;
$$;

create or replace function authority_private.fail_stripe_pilot_outbox_v1(p_outbox_id uuid, p_error_code text, p_retryable boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_job authority_private.integration_outbox%rowtype; v_status text;
begin
  if p_outbox_id is null or btrim(coalesce(p_error_code, '')) !~ '^[a-z0-9_]{3,80}$' then
    raise exception using errcode = '22023', message = 'stripe_failure_invalid';
  end if;
  select * into v_job from authority_private.integration_outbox where id = p_outbox_id for update;
  if v_job.id is null then raise exception using errcode = 'P0002', message = 'stripe_job_not_found'; end if;
  if v_job.status = 'applied' then return jsonb_build_object('outbox_id', v_job.id, 'status', 'applied'); end if;
  if v_job.status <> 'processing' then raise exception using errcode = '55000', message = 'stripe_job_not_claimed'; end if;
  v_status := case when p_retryable and v_job.attempts < 8 then 'retrying' else 'failed' end;
  update authority_private.integration_outbox
  set status = v_status, last_error_code = btrim(p_error_code),
      next_attempt_at = case when v_status = 'retrying' then now() + make_interval(secs => least(3600, (15 * power(2, greatest(0, v_job.attempts - 1)))::integer)) else null end,
      updated_at = now()
  where id = v_job.id;
  return jsonb_build_object('outbox_id', v_job.id, 'status', v_status, 'attempts', v_job.attempts);
end;
$$;

create or replace function authority_private.get_organization_billing_status_v1(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_order authority_private.commercial_orders%rowtype;
begin
  if not authority_private.has_active_membership(p_organization_id, array['owner','admin','auditor']) then
    raise exception using errcode = '42501', message = 'billing_view_not_allowed';
  end if;
  select * into v_order from authority_private.commercial_orders
  where organization_id = p_organization_id order by created_at desc limit 1;
  if v_order.id is null then return null; end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'order_id', v_order.id, 'status', v_order.status,
    'hosted_invoice_url', v_order.hosted_invoice_url, 'invoice_number', v_order.invoice_number,
    'service_period_start', v_order.service_period_start, 'service_period_end', v_order.service_period_end,
    'request_allowance', v_order.quantity, 'amount_minor', v_order.amount_minor, 'currency', v_order.currency
  ));
end;
$$;

create or replace function authority_private.ingest_and_apply_stripe_event_v2(
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
  v_inbox authority_private.provider_event_inbox%rowtype;
  v_event_type text := p_payload->>'type';
  v_object jsonb := p_payload#>'{data,object}';
  v_invoice_id text;
  v_order authority_private.commercial_orders%rowtype;
  v_order_hint text;
  v_first_transition boolean := false;
  v_refund_amount bigint;
begin
  if length(btrim(coalesce(p_provider_event_id, ''))) = 0
     or p_body_sha256 !~ '^[0-9a-f]{64}$' or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'stripe_event_invalid';
  end if;
  insert into authority_private.provider_event_inbox (
    provider, provider_event_id, signature_status, body_sha256, provider_created_at, payload
  ) values ('stripe', p_provider_event_id, 'valid', p_body_sha256, p_provider_created_at, p_payload)
  on conflict (provider, provider_event_id) do nothing;
  select * into v_inbox from authority_private.provider_event_inbox
  where provider = 'stripe' and provider_event_id = p_provider_event_id for update;
  if v_inbox.status in ('applied','ignored') then
    return jsonb_build_object('received', true, 'replayed', true, 'applied', v_inbox.status = 'applied', 'inbox_id', v_inbox.id);
  end if;
  update authority_private.provider_event_inbox set status = 'processing', attempts = attempts + 1 where id = v_inbox.id;

  if coalesce((p_payload->>'livemode')::boolean, false) or v_event_type not in ('invoice.paid','invoice.payment_failed','charge.refunded') then
    update authority_private.provider_event_inbox set status = 'ignored', processed_at = now() where id = v_inbox.id;
    return jsonb_build_object('received', true, 'replayed', false, 'applied', false, 'ignored', true, 'inbox_id', v_inbox.id);
  end if;

  if v_event_type in ('invoice.paid','invoice.payment_failed') then
    v_invoice_id := v_object->>'id';
    v_order_hint := v_object#>>'{metadata,passage_order_id}';
  else
    v_invoice_id := v_object->>'invoice';
  end if;
  select * into v_order from authority_private.commercial_orders where stripe_invoice_id = v_invoice_id for update;
  if v_order.id is null and v_order_hint ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select * into v_order from authority_private.commercial_orders where id = v_order_hint::uuid for update;
  end if;
  if v_order.id is null then
    update authority_private.provider_event_inbox set status = 'ignored', processed_at = now() where id = v_inbox.id;
    return jsonb_build_object('received', true, 'replayed', false, 'applied', false, 'ignored', true, 'inbox_id', v_inbox.id);
  end if;

  if v_event_type = 'invoice.paid' then
    update authority_private.commercial_orders
    set status = 'paid', paid_at = coalesce(p_provider_created_at, now()), version = version + 1, updated_at = now()
    where id = v_order.id and status in ('pending','invoiced','failed');
    v_first_transition := found;
    if v_first_transition then
      update authority_private.commercial_subscriptions
      set status = 'active', version = version + 1, updated_at = now() where id = v_order.subscription_id;
      update authority_private.commercial_contracts
      set status = 'active', version = version + 1, updated_at = now()
      where id = (select contract_id from authority_private.commercial_subscriptions where id = v_order.subscription_id);
      insert into authority_private.commercial_allowance_lots (
        subscription_id, source_order_id, organization_id, units_granted, effective_at, expires_at
      ) values (
        v_order.subscription_id, v_order.id, v_order.organization_id, v_order.quantity,
        v_order.service_period_start::timestamptz, v_order.service_period_end::timestamptz
      ) on conflict (source_order_id) do nothing;
      update public.organization_entitlements
      set offer = 'pilot', status = 'active', transaction_limit = v_order.quantity, activated_count = 0,
          period_started_at = v_order.service_period_start::timestamptz,
          period_ends_at = v_order.service_period_end::timestamptz,
          version = version + 1, updated_at = now()
      where organization_id = v_order.organization_id;
      insert into public.organization_audit_events (
        organization_id, event_type, subject_type, subject_id, payload
      ) values (
        v_order.organization_id, 'billing.pilot_activated', 'commercial_order', v_order.id,
        jsonb_build_object('request_allowance', v_order.quantity, 'service_period_start', v_order.service_period_start, 'service_period_end', v_order.service_period_end)
      );
    end if;
    insert into authority_private.commercial_event_ledger (
      aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
    ) values (
      'commercial_order', v_order.id, 'commercial.stripe_invoice_paid', coalesce(p_provider_created_at, now()),
      'stripe-invoice-paid:' || v_invoice_id, jsonb_build_object('provider_event_id', p_provider_event_id)
    ) on conflict (idempotency_key) do nothing;
  elsif v_event_type = 'invoice.payment_failed' then
    update authority_private.commercial_orders set status = 'failed', version = version + 1, updated_at = now()
    where id = v_order.id and status in ('pending','invoiced');
    insert into authority_private.commercial_event_ledger (
      aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
    ) values (
      'commercial_order', v_order.id, 'commercial.stripe_invoice_payment_failed', coalesce(p_provider_created_at, now()),
      'stripe-invoice-failed:' || p_provider_event_id, jsonb_build_object('stripe_invoice_id', v_invoice_id)
    ) on conflict (idempotency_key) do nothing;
  else
    v_refund_amount := coalesce((v_object->>'amount_refunded')::bigint, 0);
    if v_refund_amount > 0 then
      insert into authority_private.commercial_adjustments (
        account_id, order_id, adjustment_type, amount_minor, currency, provider_reference, occurred_at, reason_code
      ) values (
        v_order.account_id, v_order.id, 'refund', v_refund_amount, v_order.currency,
        p_provider_event_id, coalesce(p_provider_created_at, now()), 'stripe_charge_refunded'
      ) on conflict (provider_reference) do nothing;
    end if;
    if v_refund_amount >= v_order.amount_minor and v_order.status = 'paid' then
      update authority_private.commercial_orders set status = 'refunded', version = version + 1, updated_at = now() where id = v_order.id;
      update authority_private.commercial_allowance_lots set status = 'reversed' where source_order_id = v_order.id and status in ('pending','active');
      update authority_private.commercial_subscriptions set status = 'canceled', version = version + 1, updated_at = now() where id = v_order.subscription_id;
      update public.organization_entitlements set status = 'canceled', version = version + 1, updated_at = now()
      where organization_id = v_order.organization_id and offer = 'pilot';
    end if;
    insert into authority_private.commercial_event_ledger (
      aggregate_type, aggregate_id, event_type, occurred_at, idempotency_key, payload
    ) values (
      'commercial_order', v_order.id, 'commercial.stripe_charge_refunded', coalesce(p_provider_created_at, now()),
      'stripe-charge-refunded:' || p_provider_event_id, jsonb_build_object('amount_refunded', v_refund_amount)
    ) on conflict (idempotency_key) do nothing;
  end if;

  update authority_private.provider_event_inbox
  set status = 'applied', processed_at = now(), last_error_code = null where id = v_inbox.id;
  return jsonb_build_object('received', true, 'replayed', not v_first_transition and v_event_type = 'invoice.paid', 'applied', true, 'inbox_id', v_inbox.id, 'order_id', v_order.id);
exception when others then
  if v_inbox.id is not null then
    update authority_private.provider_event_inbox
    set status = 'failed', last_error_code = 'stripe_event_apply_failed', processed_at = now()
    where id = v_inbox.id;
  end if;
  raise;
end;
$$;

create or replace function public.request_pilot_invoice_v1(
  p_organization_id uuid, p_service_period_start date, p_service_period_end date,
  p_request_allowance integer, p_expected_entitlement_version bigint, p_idempotency_key uuid
)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.request_pilot_invoice_v1(p_organization_id, p_service_period_start, p_service_period_end, p_request_allowance, p_expected_entitlement_version, p_idempotency_key); $$;

create or replace function public.get_organization_billing_status_v1(p_organization_id uuid)
returns jsonb language sql stable security invoker set search_path = ''
as $$ select authority_private.get_organization_billing_status_v1(p_organization_id); $$;

create or replace function public.claim_stripe_pilot_outbox_v1()
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.claim_stripe_pilot_outbox_v1(); $$;

create or replace function public.complete_stripe_pilot_outbox_v1(p_outbox_id uuid, p_provider_result jsonb)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.complete_stripe_pilot_outbox_v1(p_outbox_id, p_provider_result); $$;

create or replace function public.fail_stripe_pilot_outbox_v1(p_outbox_id uuid, p_error_code text, p_retryable boolean)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.fail_stripe_pilot_outbox_v1(p_outbox_id, p_error_code, p_retryable); $$;

create or replace function public.ingest_and_apply_stripe_event_v2(
  p_provider_event_id text, p_provider_created_at timestamptz, p_body_sha256 text, p_payload jsonb
)
returns jsonb language sql security invoker set search_path = ''
as $$ select authority_private.ingest_and_apply_stripe_event_v2(p_provider_event_id, p_provider_created_at, p_body_sha256, p_payload); $$;

revoke execute on function authority_private.request_pilot_invoice_v1(uuid,date,date,integer,bigint,uuid) from public, anon;
revoke execute on function authority_private.get_organization_billing_status_v1(uuid) from public, anon;
grant execute on function authority_private.request_pilot_invoice_v1(uuid,date,date,integer,bigint,uuid) to authenticated;
grant execute on function authority_private.get_organization_billing_status_v1(uuid) to authenticated;

revoke execute on function public.request_pilot_invoice_v1(uuid,date,date,integer,bigint,uuid) from public, anon;
revoke execute on function public.get_organization_billing_status_v1(uuid) from public, anon;
grant execute on function public.request_pilot_invoice_v1(uuid,date,date,integer,bigint,uuid) to authenticated;
grant execute on function public.get_organization_billing_status_v1(uuid) to authenticated;

revoke execute on function authority_private.claim_stripe_pilot_outbox_v1() from public, anon, authenticated;
revoke execute on function authority_private.complete_stripe_pilot_outbox_v1(uuid,jsonb) from public, anon, authenticated;
revoke execute on function authority_private.fail_stripe_pilot_outbox_v1(uuid,text,boolean) from public, anon, authenticated;
revoke execute on function authority_private.ingest_and_apply_stripe_event_v2(text,timestamptz,text,jsonb) from public, anon, authenticated;
revoke execute on function public.claim_stripe_pilot_outbox_v1() from public, anon, authenticated;
revoke execute on function public.complete_stripe_pilot_outbox_v1(uuid,jsonb) from public, anon, authenticated;
revoke execute on function public.fail_stripe_pilot_outbox_v1(uuid,text,boolean) from public, anon, authenticated;
revoke execute on function public.ingest_and_apply_stripe_event_v2(text,timestamptz,text,jsonb) from public, anon, authenticated;
grant execute on function authority_private.claim_stripe_pilot_outbox_v1() to service_role;
grant execute on function authority_private.complete_stripe_pilot_outbox_v1(uuid,jsonb) to service_role;
grant execute on function authority_private.fail_stripe_pilot_outbox_v1(uuid,text,boolean) to service_role;
grant execute on function authority_private.ingest_and_apply_stripe_event_v2(text,timestamptz,text,jsonb) to service_role;
grant execute on function public.claim_stripe_pilot_outbox_v1() to service_role;
grant execute on function public.complete_stripe_pilot_outbox_v1(uuid,jsonb) to service_role;
grant execute on function public.fail_stripe_pilot_outbox_v1(uuid,text,boolean) to service_role;
grant execute on function public.ingest_and_apply_stripe_event_v2(text,timestamptz,text,jsonb) to service_role;
notify pgrst, 'reload schema';
