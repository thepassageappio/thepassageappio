create table public.authority_participant_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  invitation_id uuid not null references public.authority_participant_invitations(id) on delete restrict,
  participant_role text not null check (participant_role in ('principal', 'representative')),
  decision text not null check (decision in ('confirmed', 'accepted', 'declined')),
  acknowledgment_text_version text not null,
  reason text,
  record_version bigint not null check (record_version > 0),
  decided_at timestamptz not null default now(),
  unique (authority_record_id, participant_role),
  check (
    (participant_role = 'principal' and decision in ('confirmed', 'declined'))
    or (participant_role = 'representative' and decision in ('accepted', 'declined'))
  ),
  check (
    (decision = 'declined' and char_length(btrim(reason)) between 3 and 500)
    or (decision <> 'declined' and reason is null)
  )
);

create index authority_participant_decisions_organization_id_idx
  on public.authority_participant_decisions(organization_id, decided_at desc);
create index authority_participant_decisions_invitation_id_idx
  on public.authority_participant_decisions(invitation_id);

create or replace function authority_private.prevent_participant_decision_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'authority_participant_decisions_are_append_only';
end;
$$;

create trigger authority_participant_decisions_append_only
before update or delete on public.authority_participant_decisions
for each row execute function authority_private.prevent_participant_decision_mutation();

update authority_private.notification_outbox o
set status = 'canceled', updated_at = now()
from public.authority_participant_invitations i,
     public.authority_records r
where o.invitation_id = i.id
  and r.id = i.authority_record_id
  and i.participant_role = 'representative'
  and r.status = 'awaiting_principal'
  and o.status in ('pending', 'processing', 'retrying');

create or replace function authority_private.hold_representative_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.template_key = 'representative_authority_invitation' then
    new.status := 'canceled';
    new.next_attempt_at := null;
  end if;
  return new;
end;
$$;

create trigger notification_outbox_hold_representative
before insert on authority_private.notification_outbox
for each row execute function authority_private.hold_representative_notification();

create or replace function authority_private.submit_participant_decision_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_decision text,
  p_acknowledged boolean,
  p_reason text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := lower(btrim(coalesce(p_session_token, '')));
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_invitation public.authority_participant_invitations%rowtype;
  v_record public.authority_records%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_command_name text;
  v_payload_hash text;
  v_next_status text;
  v_saved_decision text;
  v_text_version text;
  v_event_type text;
  v_summary text;
  v_detail text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_representative_invitation public.authority_participant_invitations%rowtype;
  v_representative_token text;
  v_representative_token_hash text;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if v_token !~ '^[0-9a-f]{64}$' or p_authority_record_id is null then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;
  if p_expected_version is null or p_expected_version < 1 then
    raise exception using errcode = '22023', message = 'participant_record_version_required';
  end if;
  if p_decision not in ('principal_confirm', 'principal_decline', 'representative_accept', 'representative_decline') then
    raise exception using errcode = '22023', message = 'participant_decision_invalid';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');

  select * into v_session
  from authority_private.participant_sessions
  where token_hash = v_token_hash
    and authority_record_id = p_authority_record_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  v_command_name := 'participant_decision:' || p_decision;
  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'authority_record_id', p_authority_record_id,
    'expected_version', p_expected_version,
    'decision', p_decision,
    'acknowledged', coalesce(p_acknowledged, false),
    'reason', nullif(btrim(coalesce(p_reason, '')), '')
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':participant_decision', 0));

  select * into v_record
  from public.authority_records
  where id = p_authority_record_id
  for update;

  select * into v_invitation
  from public.authority_participant_invitations
  where id = v_session.invitation_id
  for update;

  select * into v_receipt
  from authority_private.participant_command_receipts
  where invitation_id = v_invitation.id
    and command_name = v_command_name
    and idempotency_key = p_idempotency_key;

  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    v_result := v_receipt.result || jsonb_build_object('replayed', true);
    if p_decision = 'principal_confirm' then
      select * into v_representative_invitation
      from public.authority_participant_invitations
      where authority_record_id = p_authority_record_id
        and participant_role = 'representative';
      v_representative_token := encode(extensions.digest(convert_to(
        v_token || ':' || p_idempotency_key::text || ':' || v_representative_invitation.id::text,
        'UTF8'
      ), 'sha256'), 'hex');
      v_result := v_result || jsonb_build_object('representative_invitation_token', v_representative_token);
    end if;
    return v_result;
  end if;

  if v_session.status <> 'active' or v_session.expires_at <= now() then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;
  if v_invitation.status <> 'accepted' then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;
  if v_record.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'participant_record_changed';
  end if;
  if not coalesce(p_acknowledged, false) then
    raise exception using errcode = '22023', message = 'participant_acknowledgment_required';
  end if;
  if p_decision in ('principal_decline', 'representative_decline')
     and char_length(btrim(coalesce(p_reason, ''))) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'participant_decline_reason_required';
  end if;
  if p_decision not in ('principal_decline', 'representative_decline')
     and nullif(btrim(coalesce(p_reason, '')), '') is not null then
    raise exception using errcode = '22023', message = 'participant_decision_invalid';
  end if;

  if v_invitation.participant_role = 'principal'
     and v_record.status = 'awaiting_principal'
     and p_decision = 'principal_confirm' then
    v_next_status := 'awaiting_representative';
    v_saved_decision := 'confirmed';
    v_text_version := 'limited-authority-confirmation-v1';
    v_event_type := 'principal.confirmed';
    v_summary := v_record.principal_name || ' confirmed the authority request';
    v_detail := v_record.representative_name || ' may now review the requested role and decide whether to accept responsibility.';

    select * into v_representative_invitation
    from public.authority_participant_invitations
    where authority_record_id = v_record.id
      and participant_role = 'representative'
    for update;

    if not found or v_representative_invitation.status <> 'pending' then
      raise exception using errcode = 'P0002', message = 'representative_invitation_unavailable';
    end if;

    v_representative_token := encode(extensions.digest(convert_to(
      v_token || ':' || p_idempotency_key::text || ':' || v_representative_invitation.id::text,
      'UTF8'
    ), 'sha256'), 'hex');
    v_representative_token_hash := encode(extensions.digest(convert_to(v_representative_token, 'UTF8'), 'sha256'), 'hex');

    update authority_private.participant_invitation_secrets
    set token_hash = v_representative_token_hash, created_at = now()
    where invitation_id = v_representative_invitation.id;

    update public.authority_participant_invitations
    set expires_at = now() + interval '72 hours', version = version + 1, updated_at = now()
    where id = v_representative_invitation.id
    returning * into v_representative_invitation;

    update authority_private.notification_outbox
    set status = 'pending', attempts = 0,
        payload = payload || jsonb_build_object('invitation_version', v_representative_invitation.version),
        last_error_code = null, next_attempt_at = now(), delivered_at = null, updated_at = now()
    where invitation_id = v_representative_invitation.id
      and template_key = 'representative_authority_invitation';
  elsif v_invitation.participant_role = 'principal'
     and v_record.status = 'awaiting_principal'
     and p_decision = 'principal_decline' then
    v_next_status := 'declined';
    v_saved_decision := 'declined';
    v_text_version := 'limited-authority-decline-v1';
    v_event_type := 'principal.declined';
    v_summary := v_record.principal_name || ' declined the authority request';
    v_detail := btrim(p_reason);

    update public.authority_participant_invitations
    set status = 'revoked', revoked_at = now(), version = version + 1, updated_at = now()
    where authority_record_id = v_record.id
      and participant_role = 'representative'
      and status = 'pending';

    update authority_private.notification_outbox
    set status = 'canceled', next_attempt_at = null, updated_at = now()
    where authority_record_id = v_record.id
      and status in ('pending', 'processing', 'retrying');
  elsif v_invitation.participant_role = 'representative'
     and v_record.status = 'awaiting_representative'
     and p_decision = 'representative_accept' then
    v_next_status := 'evidence_required';
    v_saved_decision := 'accepted';
    v_text_version := 'representative-responsibility-acceptance-v1';
    v_event_type := 'representative.accepted';
    v_summary := v_record.representative_name || ' accepted the responsibility';
    v_detail := 'The remaining policy requirements are now available.';
  elsif v_invitation.participant_role = 'representative'
     and v_record.status = 'awaiting_representative'
     and p_decision = 'representative_decline' then
    v_next_status := 'declined';
    v_saved_decision := 'declined';
    v_text_version := 'representative-responsibility-decline-v1';
    v_event_type := 'representative.declined';
    v_summary := v_record.representative_name || ' declined the responsibility';
    v_detail := btrim(p_reason);
  else
    raise exception using errcode = '42501', message = 'participant_decision_not_allowed';
  end if;

  update public.authority_records
  set status = v_next_status, version = version + 1, updated_at = now()
  where id = v_record.id
  returning * into v_record;

  insert into public.authority_participant_decisions (
    organization_id, authority_record_id, invitation_id, participant_role,
    decision, acknowledgment_text_version, reason, record_version
  ) values (
    v_record.organization_id, v_record.id, v_invitation.id, v_invitation.participant_role,
    v_saved_decision, v_text_version,
    case when v_saved_decision = 'declined' then btrim(p_reason) else null end,
    v_record.version
  );

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events
  where authority_record_id = v_record.id;

  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version, v_event_type,
    null, v_invitation.participant_role, v_summary, v_detail,
    array['owner', 'admin', 'staff', 'reviewer', 'auditor', 'principal', 'representative']::text[],
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'decision', v_saved_decision,
      'acknowledgment_text_version', v_text_version,
      'next_status', v_next_status
    )
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, null, v_event_type, 'authority_record', v_record.id,
    jsonb_build_object(
      'participant_role', v_invitation.participant_role,
      'decision', v_saved_decision,
      'record_version', v_record.version,
      'event_id', v_event_id
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'participant_role', v_invitation.participant_role,
    'decision', v_saved_decision,
    'status', v_record.status,
    'version', v_record.version,
    'event_id', v_event_id,
    'representative_invitation_id', case when p_decision = 'principal_confirm' then v_representative_invitation.id else null end,
    'representative_invitation_expires_at', case when p_decision = 'principal_confirm' then v_representative_invitation.expires_at else null end
  );

  insert into authority_private.participant_command_receipts (
    invitation_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_invitation.id, v_command_name, p_idempotency_key, v_payload_hash, v_result
  );

  if p_decision = 'principal_confirm' then
    return v_result || jsonb_build_object(
      'replayed', false,
      'representative_invitation_token', v_representative_token
    );
  end if;
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.submit_participant_decision_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_decision text,
  p_acknowledged boolean,
  p_reason text,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.submit_participant_decision_v1(
    p_session_token, p_authority_record_id, p_expected_version, p_decision,
    p_acknowledged, p_reason, p_idempotency_key
  );
$$;

create or replace function authority_private.get_participant_session_context_v1(
  p_session_token text,
  p_authority_record_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_token text := lower(btrim(coalesce(p_session_token, '')));
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_organization public.organizations%rowtype;
begin
  if v_token !~ '^[0-9a-f]{64}$' or p_authority_record_id is null then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');

  select * into v_session
  from authority_private.participant_sessions
  where token_hash = v_token_hash
    and authority_record_id = p_authority_record_id
    and status = 'active'
    and expires_at > now();

  if not found then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  select * into v_record from public.authority_records where id = v_session.authority_record_id;
  select * into v_organization from public.organizations where id = v_session.organization_id and status = 'active';

  if not found then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  return jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'institution_name', v_organization.display_name,
    'participant_role', v_session.participant_role,
    'participant_name', case when v_session.participant_role = 'principal' then v_record.principal_name else v_record.representative_name end,
    'other_person_name', case when v_session.participant_role = 'principal' then v_record.representative_name else v_record.principal_name end,
    'record_version', v_record.version,
    'status', v_record.status,
    'purpose', v_record.purpose,
    'account_boundary', v_record.account_boundary,
    'allowed_action_keys', to_jsonb(v_record.allowed_action_keys),
    'prohibited_action_keys', to_jsonb(v_record.prohibited_action_keys),
    'valid_until', v_record.valid_until,
    'session_expires_at', v_session.expires_at
  );
end;
$$;

alter table public.authority_participant_decisions enable row level security;
alter table public.authority_participant_decisions force row level security;

create policy authority_participant_decisions_authorized_select
on public.authority_participant_decisions for select to authenticated
using ((select authority_private.has_active_membership(
  organization_id, array['owner', 'admin', 'staff', 'reviewer', 'auditor']
)));

revoke all on public.authority_participant_decisions from public, anon, authenticated;
grant select on public.authority_participant_decisions to authenticated;

revoke execute on function authority_private.prevent_participant_decision_mutation() from public, anon, authenticated;
revoke execute on function authority_private.hold_representative_notification() from public, anon, authenticated;
revoke execute on function authority_private.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid) from public, anon, authenticated;
revoke execute on function public.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid) from public, anon, authenticated;
grant execute on function authority_private.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid) to anon, authenticated;
grant execute on function public.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid) to anon, authenticated;

comment on table public.authority_participant_decisions is 'Append-only explicit participant decisions and acknowledgment versions.';
