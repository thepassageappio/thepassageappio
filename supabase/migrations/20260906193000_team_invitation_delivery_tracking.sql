-- Team (organization) invitation delivery tracking.
--
-- Participant invitations already get provider-delivery tracking through
-- authority_private.notification_outbox + the Resend webhook receipt
-- pipeline (see 20260829141400, 20260829142746, 20260829143717). Team
-- invitations (public.organization_invitations, sent through
-- deliverTeamInvitation) had no equivalent: a Resend API "accepted" response
-- was the only signal ever recorded, and nothing observed the delivered /
-- delivery_delayed / bounced / failed webhook events Resend already sends to
-- the same /api/webhooks/resend endpoint. A persona audit found 4 of 5 test
-- team invitations were silently dropped by Gmail filtering despite Resend
-- reporting the send as accepted, with no record anywhere in the product to
-- surface that gap.
--
-- This migration adds delivery-tracking columns directly on
-- organization_invitations (one invitation email per row, no retry/claim
-- machinery needed the way integration_outbox has, so a separate outbox
-- table would be unnecessary indirection), a service-only RPC to record the
-- initial Resend submission result, and extends the existing
-- record_resend_delivery_event_v1 webhook handler to also match team
-- invitations by provider_message_id.
--
-- Following the lesson already learned the hard way for participant
-- invitations (20260829142746_authority_delivery_receipt_semantics.sql):
-- "the provider accepted the send" and "the recipient's mail server
-- delivered it" are different facts. The initial submission RPC below
-- never writes delivery_status = 'delivered' -- only the confirmed
-- email.delivered webhook event does that. A successful Resend API call is
-- recorded as 'processing' (submitted, delivery unconfirmed).

alter table public.organization_invitations
  add column if not exists delivery_status text not null default 'pending',
  add column if not exists delivery_provider text,
  add column if not exists delivery_provider_message_id text,
  add column if not exists delivery_error_code text,
  add column if not exists delivery_attempts integer not null default 0,
  add column if not exists delivery_last_attempt_at timestamptz,
  add column if not exists delivery_confirmed_at timestamptz,
  add column if not exists delivery_last_event_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_invitations_delivery_status_check'
  ) then
    alter table public.organization_invitations
      add constraint organization_invitations_delivery_status_check
      check (delivery_status in ('pending', 'processing', 'delivered', 'failed', 'retrying'));
  end if;
end;
$$;

create index if not exists organization_invitations_delivery_message_idx
  on public.organization_invitations(delivery_provider_message_id)
  where delivery_provider_message_id is not null;

alter table authority_private.provider_webhook_events
  add column if not exists organization_invitation_id uuid references public.organization_invitations(id) on delete set null;

create index if not exists provider_webhook_events_org_invitation_idx
  on authority_private.provider_webhook_events(organization_invitation_id)
  where organization_invitation_id is not null;

-- Server-only receipt for the initial Resend submission result, called from
-- inviteTeamMemberAction right after deliverTeamInvitation() returns. Mirrors
-- record_operator_participant_delivery_service_v1's shape (explicit
-- p_actor_user_id since this runs through the service-role admin client,
-- outside any authenticated request's auth.uid()).
create or replace function authority_private.record_team_invitation_delivery_service_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_invitation_id uuid,
  p_delivery_status text,
  p_provider text,
  p_provider_message_id text,
  p_error_code text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := p_actor_user_id;
  v_actor_role text;
  v_invitation public.organization_invitations%rowtype;
  v_receipt authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_stored_status text;
  v_event_type text;
  v_summary text;
  v_detail text;
  v_event_id uuid;
  v_result jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select m.role into v_actor_role
  from public.organization_memberships m
  join auth.users u on u.id = m.user_id and u.email_confirmed_at is not null
  where m.organization_id = p_organization_id
    and m.user_id = v_actor
    and m.status = 'active';

  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then
    raise exception using errcode = '42501', message = 'member_management_not_allowed';
  end if;
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if p_delivery_status not in ('delivered', 'failed') or p_provider <> 'resend' then
    raise exception using errcode = '22023', message = 'team_invitation_delivery_result_invalid';
  end if;
  if p_delivery_status = 'delivered' and nullif(btrim(coalesce(p_provider_message_id, '')), '') is null then
    raise exception using errcode = '22023', message = 'team_invitation_delivery_result_invalid';
  end if;
  if p_delivery_status = 'failed' and nullif(btrim(coalesce(p_error_code, '')), '') is null then
    raise exception using errcode = '22023', message = 'team_invitation_delivery_result_invalid';
  end if;

  -- "delivered" here means "Resend's API accepted the send", not final
  -- inbox delivery -- store it as 'processing' and wait for the webhook.
  v_stored_status := case when p_delivery_status = 'delivered' then 'processing' else 'failed' end;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'actor_user_id', v_actor,
    'organization_id', p_organization_id,
    'invitation_id', p_invitation_id,
    'delivery_status', p_delivery_status,
    'provider', p_provider,
    'provider_message_id', nullif(btrim(coalesce(p_provider_message_id, '')), ''),
    'error_code', nullif(btrim(coalesce(p_error_code, '')), '')
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_invitation_id::text || ':team_delivery', 0));

  select * into v_receipt
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'record_team_invitation_delivery'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_invitation
  from public.organization_invitations
  where id = p_invitation_id and organization_id = p_organization_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'invitation_not_available';
  end if;

  update public.organization_invitations
  set delivery_status = v_stored_status,
      delivery_provider = p_provider,
      delivery_provider_message_id = case when v_stored_status = 'processing' then btrim(p_provider_message_id) else delivery_provider_message_id end,
      delivery_error_code = case when v_stored_status = 'failed' then btrim(p_error_code) else null end,
      delivery_attempts = delivery_attempts + 1,
      delivery_last_attempt_at = now(),
      updated_at = now()
  where id = v_invitation.id
  returning * into v_invitation;

  if v_stored_status = 'processing' then
    v_event_type := 'membership.invitation_submitted';
    v_summary := 'Team invitation submitted to email provider';
    v_detail := 'The email provider accepted the message. Final delivery confirmation is pending.';
  else
    v_event_type := 'membership.invitation_delivery_failed';
    v_summary := 'Team invitation could not be sent';
    v_detail := 'The email provider rejected the message. A fresh invitation can be sent.';
  end if;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, v_event_type, 'organization_invitation', v_invitation.id,
    jsonb_build_object('email', v_invitation.email_normalized, 'role', v_invitation.role, 'delivery_status', v_invitation.delivery_status, 'attempts', v_invitation.delivery_attempts, 'summary', v_summary, 'detail', v_detail)
  ) returning event_id into v_event_id;

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'invitation_id', v_invitation.id,
    'delivery_status', v_invitation.delivery_status,
    'attempts', v_invitation.delivery_attempts,
    'event_id', v_event_id
  );
  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'record_team_invitation_delivery', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.record_team_invitation_delivery_service_v1(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_invitation_id uuid,
  p_delivery_status text,
  p_provider text,
  p_provider_message_id text,
  p_error_code text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select authority_private.record_team_invitation_delivery_service_v1(
    p_actor_user_id, p_organization_id, p_invitation_id,
    p_delivery_status, p_provider, p_provider_message_id, p_error_code, p_idempotency_key
  );
$$;

revoke execute on function authority_private.record_team_invitation_delivery_service_v1(uuid, uuid, uuid, text, text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.record_team_invitation_delivery_service_v1(uuid, uuid, uuid, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_team_invitation_delivery_service_v1(uuid, uuid, uuid, text, text, text, text, uuid) to service_role;

comment on function public.record_team_invitation_delivery_service_v1(uuid, uuid, uuid, text, text, text, text, uuid) is 'Server-only Resend submission receipt for a team (organization) invitation.';

-- Extend the shared Resend webhook receipt handler so email.delivered /
-- email.delivery_delayed / email.failed / email.bounced events also match
-- team invitations by provider_message_id, in addition to the existing
-- participant notification_outbox match. src/app/api/webhooks/resend/route.ts
-- is unchanged -- it already calls this same function name for every event.
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
  v_invitation public.organization_invitations%rowtype;
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
      'authority_record_id', v_existing.authority_record_id,
      'organization_invitation_id', v_existing.organization_invitation_id
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

  if found then
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
  end if;

  -- No participant match -- try a team invitation before giving up as unmatched.
  select * into v_invitation
  from public.organization_invitations
  where delivery_provider = 'resend' and delivery_provider_message_id = btrim(p_provider_message_id)
  for update;

  if found then
    if v_invitation.delivery_last_event_at is not null
       and p_event_occurred_at < v_invitation.delivery_last_event_at then
      v_processing_result := 'ignored';
    else
      update public.organization_invitations
      set delivery_status = v_status,
          delivery_confirmed_at = case when v_status = 'delivered' then p_event_occurred_at else delivery_confirmed_at end,
          delivery_error_code = case when v_status = 'failed' then coalesce(nullif(btrim(p_failure_reason), ''), p_event_type) else delivery_error_code end,
          delivery_last_event_at = p_event_occurred_at,
          updated_at = now()
      where id = v_invitation.id
      returning * into v_invitation;

      if v_status = 'delivered' then
        v_event_type := 'membership.invitation_delivered';
        v_summary := 'Team invitation delivery confirmed';
        v_detail := 'The recipient mail server accepted the team invitation.';
      elsif v_status = 'retrying' then
        v_event_type := 'membership.invitation_delivery_delayed';
        v_summary := 'Team invitation delivery delayed';
        v_detail := 'The recipient mail server reported a temporary delay. Delivery remains in progress.';
      else
        v_event_type := 'membership.invitation_delivery_failed';
        v_summary := 'Team invitation delivery needs attention';
        v_detail := 'The recipient mail server did not accept the invitation. A fresh invitation can be sent.';
      end if;

      insert into public.organization_audit_events (
        organization_id, actor_user_id, event_type, subject_type, subject_id, payload
      ) values (
        v_invitation.organization_id, null, v_event_type, 'organization_invitation', v_invitation.id,
        jsonb_build_object(
          'invitation_id', v_invitation.id,
          'delivery_status', v_status,
          'provider_event_id', btrim(p_provider_event_id),
          'provider_event_type', p_event_type,
          'summary', v_summary,
          'detail', v_detail
        )
      );
    end if;

    insert into authority_private.provider_webhook_events (
      provider_event_id, provider, event_type, provider_message_id, outbox_id,
      authority_record_id, organization_invitation_id, event_occurred_at, payload_hash, processing_result
    ) values (
      btrim(p_provider_event_id), 'resend', p_event_type, btrim(p_provider_message_id), null,
      null, v_invitation.id, p_event_occurred_at, lower(btrim(p_payload_hash)), v_processing_result
    );

    return jsonb_build_object(
      'received', true,
      'replayed', false,
      'processing_result', v_processing_result,
      'organization_invitation_id', v_invitation.id,
      'delivery_status', v_invitation.delivery_status
    );
  end if;

  insert into authority_private.provider_webhook_events (
    provider_event_id, provider, event_type, provider_message_id,
    event_occurred_at, payload_hash, processing_result
  ) values (
    btrim(p_provider_event_id), 'resend', p_event_type, btrim(p_provider_message_id),
    p_event_occurred_at, lower(btrim(p_payload_hash)), 'unmatched'
  );
  return jsonb_build_object('received', true, 'replayed', false, 'processing_result', 'unmatched');
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

revoke execute on function authority_private.record_resend_delivery_event_v1(text, text, text, timestamptz, text, text) from public, anon, authenticated;
revoke execute on function public.record_resend_delivery_event_v1(text, text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.record_resend_delivery_event_v1(text, text, text, timestamptz, text, text) to service_role;

notify pgrst, 'reload schema';
