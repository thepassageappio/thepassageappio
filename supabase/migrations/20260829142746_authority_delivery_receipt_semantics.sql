create or replace function authority_private.normalize_resend_submission_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.provider = 'resend'
     and new.status = 'delivered'
     and coalesce(new.payload->>'provider_delivery_confirmed', 'false') <> 'true' then
    new.status := 'processing';
    new.delivered_at := null;
    new.payload := new.payload || jsonb_build_object('provider_delivery_confirmed', false);
  end if;
  return new;
end;
$$;

create trigger notification_outbox_normalize_resend_submission
before insert or update on authority_private.notification_outbox
for each row execute function authority_private.normalize_resend_submission_state();

create or replace function authority_private.normalize_resend_submission_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_type = 'participant.invitation_delivered'
     and new.payload->>'delivery_status' = 'delivered' then
    new.event_type := 'participant.invitation_submitted';
    new.summary := case when new.payload->>'participant_role' = 'representative'
      then 'Representative invitation submitted to email provider'
      else 'Secure participant invitation submitted to email provider'
    end;
    new.detail := 'The email provider accepted the message. Final delivery confirmation is pending.';
    new.payload := jsonb_set(new.payload, '{delivery_status}', '"processing"'::jsonb, true);
  end if;
  return new;
end;
$$;

create trigger authority_events_normalize_resend_submission
before insert on public.authority_events
for each row execute function authority_private.normalize_resend_submission_event();

create or replace function authority_private.normalize_resend_submission_audit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.event_type = 'participant.invitation_delivered'
     and new.payload->>'delivery_status' = 'delivered' then
    new.event_type := 'participant.invitation_submitted';
    new.payload := jsonb_set(new.payload, '{delivery_status}', '"processing"'::jsonb, true);
  end if;
  return new;
end;
$$;

create trigger organization_audit_normalize_resend_submission
before insert on public.organization_audit_events
for each row execute function authority_private.normalize_resend_submission_audit();

do $$
declare
  v_outbox authority_private.notification_outbox%rowtype;
  v_record public.authority_records%rowtype;
  v_invitation public.authority_participant_invitations%rowtype;
  v_event_sequence bigint;
begin
  for v_outbox in
    select * from authority_private.notification_outbox
    where provider = 'resend' and status = 'delivered'
  loop
    select * into v_invitation from public.authority_participant_invitations where id = v_outbox.invitation_id;
    select * into v_record from public.authority_records where id = v_outbox.authority_record_id for update;

    update authority_private.notification_outbox
    set status = 'processing', delivered_at = null,
        payload = payload || jsonb_build_object('provider_delivery_confirmed', false),
        updated_at = now()
    where id = v_outbox.id;

    select coalesce(max(sequence), 0) + 1 into v_event_sequence
    from public.authority_events where authority_record_id = v_record.id;
    insert into public.authority_events (
      organization_id, authority_record_id, sequence, record_version, event_type,
      actor_user_id, actor_role, summary, detail, audience, payload
    ) values (
      v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
      'participant.invitation_delivery_corrected', null, 'system',
      'Invitation delivery status corrected',
      'Provider acceptance is recorded separately from final inbox delivery. Final delivery confirmation is pending.',
      array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
      jsonb_build_object('invitation_id', v_invitation.id, 'participant_role', v_invitation.participant_role, 'delivery_status', 'processing')
    );

    insert into public.organization_audit_events (
      organization_id, actor_user_id, event_type, subject_type, subject_id, payload
    ) values (
      v_record.organization_id, null, 'participant.invitation_delivery_corrected',
      'authority_record', v_record.id,
      jsonb_build_object('invitation_id', v_invitation.id, 'participant_role', v_invitation.participant_role, 'delivery_status', 'processing')
    );
  end loop;
end;
$$;

revoke execute on function authority_private.normalize_resend_submission_state() from public, anon, authenticated;
revoke execute on function authority_private.normalize_resend_submission_event() from public, anon, authenticated;
revoke execute on function authority_private.normalize_resend_submission_audit() from public, anon, authenticated;
