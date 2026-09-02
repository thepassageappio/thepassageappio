alter table authority_private.notification_outbox
  add column if not exists last_provider_event_at timestamptz;

create table if not exists authority_private.provider_webhook_events (
  provider_event_id text primary key,
  provider text not null,
  event_type text not null,
  provider_message_id text not null,
  outbox_id uuid references authority_private.notification_outbox(id) on delete set null,
  authority_record_id uuid references public.authority_records(id) on delete set null,
  event_occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  payload_hash text not null,
  processing_result text not null,
  constraint provider_webhook_events_provider_check check (provider in ('resend')),
  constraint provider_webhook_events_processing_result_check check (processing_result in ('applied', 'ignored', 'unmatched'))
);

create index if not exists provider_webhook_events_outbox_idx
  on authority_private.provider_webhook_events(outbox_id)
  where outbox_id is not null;

create index if not exists provider_webhook_events_record_received_idx
  on authority_private.provider_webhook_events(authority_record_id, received_at desc)
  where authority_record_id is not null;

create or replace function authority_private.record_resend_delivery_event_v1(
  p_provider_event_id text,
  p_event_type text,
  p_provider_message_id text,
  p_event_occurred_at timestamptz,
  p_failure_reason text,
  p_payload_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing authority_private.provider_webhook_events%rowtype;
  v_outbox authority_private.notification_outbox%rowtype;
  v_record public.authority_records%rowtype;
  v_status text;
  v_processing_result text := 'applied';
  v_event_type text;
  v_summary text;
  v_detail text;
  v_sequence bigint;
  v_event_id uuid;
begin
  if nullif(btrim(p_provider_event_id), '') is null
     or nullif(btrim(p_provider_message_id), '') is null
     or nullif(btrim(p_payload_hash), '') is null
     or lower(btrim(p_payload_hash)) !~ '^[0-9a-f]{64}$'
     or p_event_occurred_at is null then
    raise exception using errcode = '22023', message = 'resend_webhook_invalid';
  end if;

  select * into v_existing
  from authority_private.provider_webhook_events
  where provider_event_id = btrim(p_provider_event_id);
  if found then
    return jsonb_build_object(
      'received', true,
      'replayed', true,
      'processing_result', v_existing.processing_result,
      'authority_record_id', v_existing.authority_record_id
    );
  end if;

  v_status := case p_event_type
    when 'email.delivered' then 'delivered'
    when 'email.delivery_delayed' then 'retrying'
    when 'email.failed' then 'failed'
    when 'email.bounced' then 'failed'
    else null
  end;
  if v_status is null then
    raise exception using errcode = '22023', message = 'resend_webhook_event_unsupported';
  end if;

  select * into v_outbox
  from authority_private.notification_outbox
  where provider = 'resend' and provider_message_id = btrim(p_provider_message_id)
  for update;

  if not found then
    insert into authority_private.provider_webhook_events (
      provider_event_id, provider, event_type, provider_message_id,
      event_occurred_at, payload_hash, processing_result
    ) values (
      btrim(p_provider_event_id), 'resend', p_event_type, btrim(p_provider_message_id),
      p_event_occurred_at, lower(btrim(p_payload_hash)), 'unmatched'
    );
    return jsonb_build_object('received', true, 'replayed', false, 'processing_result', 'unmatched');
  end if;

  select * into v_record
  from public.authority_records
  where id = v_outbox.authority_record_id
  for update;

  if v_outbox.last_provider_event_at is not null
     and p_event_occurred_at < v_outbox.last_provider_event_at then
    v_processing_result := 'ignored';
  else
    update authority_private.notification_outbox
    set status = v_status,
        delivered_at = case when v_status = 'delivered' then p_event_occurred_at else null end,
        last_error_code = case when v_status = 'failed' then coalesce(nullif(btrim(p_failure_reason), ''), p_event_type) else null end,
        next_attempt_at = case when v_status = 'retrying' then now() + interval '5 minutes' else null end,
        last_provider_event_at = p_event_occurred_at,
        payload = payload || jsonb_build_object(
          'provider_delivery_confirmed', v_status = 'delivered',
          'provider_event_type', p_event_type
        ),
        updated_at = now()
    where id = v_outbox.id
    returning * into v_outbox;

    if v_status = 'delivered' then
      v_event_type := 'participant.invitation_delivery_confirmed';
      v_summary := 'Secure invitation delivery confirmed';
      v_detail := 'The recipient mail server accepted the secure invitation.';
    elsif v_status = 'retrying' then
      v_event_type := 'participant.invitation_delivery_delayed';
      v_summary := 'Secure invitation delivery delayed';
      v_detail := 'The recipient mail server reported a temporary delay. Delivery remains in progress.';
    else
      v_event_type := 'participant.invitation_delivery_failed';
      v_summary := 'Secure invitation delivery needs attention';
      v_detail := 'The recipient mail server did not accept the invitation. A fresh secure link can be sent.';
    end if;

    select coalesce(max(sequence), 0) + 1 into v_sequence
    from public.authority_events where authority_record_id = v_record.id;
    insert into public.authority_events (
      organization_id, authority_record_id, sequence, record_version, event_type,
      actor_user_id, actor_role, summary, detail, audience, payload
    ) values (
      v_record.organization_id, v_record.id, v_sequence, v_record.version, v_event_type,
      null, 'system', v_summary, v_detail,
      array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
      jsonb_build_object(
        'invitation_id', v_outbox.invitation_id,
        'delivery_status', v_status,
        'provider_event_id', btrim(p_provider_event_id),
        'provider_event_type', p_event_type
      )
    ) returning event_id into v_event_id;

    insert into public.organization_audit_events (
      organization_id, actor_user_id, event_type, subject_type, subject_id, payload
    ) values (
      v_record.organization_id, null, v_event_type, 'authority_record', v_record.id,
      jsonb_build_object(
        'invitation_id', v_outbox.invitation_id,
        'delivery_status', v_status,
        'provider_event_id', btrim(p_provider_event_id),
        'provider_event_type', p_event_type,
        'event_id', v_event_id
      )
    );
  end if;

  insert into authority_private.provider_webhook_events (
    provider_event_id, provider, event_type, provider_message_id, outbox_id,
    authority_record_id, event_occurred_at, payload_hash, processing_result
  ) values (
    btrim(p_provider_event_id), 'resend', p_event_type, btrim(p_provider_message_id), v_outbox.id,
    v_outbox.authority_record_id, p_event_occurred_at, lower(btrim(p_payload_hash)), v_processing_result
  );

  return jsonb_build_object(
    'received', true,
    'replayed', false,
    'processing_result', v_processing_result,
    'authority_record_id', v_outbox.authority_record_id,
    'delivery_status', v_outbox.status
  );
end;
$$;

create or replace function public.record_resend_delivery_event_v1(
  p_provider_event_id text,
  p_event_type text,
  p_provider_message_id text,
  p_event_occurred_at timestamptz,
  p_failure_reason text,
  p_payload_hash text
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select authority_private.record_resend_delivery_event_v1(
    p_provider_event_id,
    p_event_type,
    p_provider_message_id,
    p_event_occurred_at,
    p_failure_reason,
    p_payload_hash
  );
$$;

revoke all on authority_private.provider_webhook_events from public, anon, authenticated;
revoke execute on function authority_private.record_resend_delivery_event_v1(text, text, text, timestamptz, text, text) from public, anon, authenticated;
revoke execute on function public.record_resend_delivery_event_v1(text, text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.record_resend_delivery_event_v1(text, text, text, timestamptz, text, text) to service_role;
