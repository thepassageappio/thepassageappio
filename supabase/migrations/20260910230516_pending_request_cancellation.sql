-- Pending cancellation is a separate immutable result, never an institution decision.
create table public.authority_request_cancellations (
  authority_record_id uuid primary key references public.authority_records(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  receipt_code text not null unique,
  receipt_snapshot jsonb not null check (jsonb_typeof(receipt_snapshot) = 'object'),
  receipt_sha256 text not null check (receipt_sha256 ~ '^[0-9a-f]{64}$')
);
create index authority_request_cancellations_org_idx on public.authority_request_cancellations(organization_id);
alter table public.authority_request_cancellations enable row level security;
alter table public.authority_request_cancellations force row level security;
create policy cancellation_read on public.authority_request_cancellations for select to authenticated
using ((select authority_private.has_active_membership(organization_id, array['owner','admin','staff','reviewer','auditor'])));
revoke all on public.authority_request_cancellations from public, anon, authenticated;
grant select on public.authority_request_cancellations to authenticated;
create trigger cancellation_append_only before update or delete on public.authority_request_cancellations
for each row execute function authority_private.prevent_authority_event_mutation();

create function authority_private.cancel_pending_request_v1(
  p_organization_id uuid, p_authority_record_id uuid, p_expected_version bigint,
  p_reason text, p_acknowledged boolean, p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_role text;
  v_record public.authority_records%rowtype;
  v_existing authority_private.command_receipts%rowtype;
  v_hash text;
  v_snapshot jsonb;
  v_result jsonb;
  v_code text := 'PAC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  v_sequence bigint;
begin
  select m.role into v_role from public.organization_memberships m
  join public.organizations o on o.id = m.organization_id
  where m.organization_id = p_organization_id and m.user_id = v_actor
    and m.status = 'active' and o.status = 'active' and o.onboarding_status = 'ready';
  if v_role is null or v_role not in ('owner','admin','staff') then
    raise exception using errcode = '42501', message = 'cancellation_not_allowed';
  end if;
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  if p_idempotency_key is null or p_expected_version is null or p_expected_version < 1
    or p_authority_record_id is null or p_acknowledged is distinct from true
    or char_length(btrim(coalesce(p_reason, ''))) not between 3 and 500 then
    raise exception using errcode = '22023', message = 'cancellation_input_invalid';
  end if;
  v_hash := authority_private.payload_hash(jsonb_build_object('organization_id', p_organization_id,
    'record_id',p_authority_record_id,'version',p_expected_version,'reason',btrim(p_reason),'acknowledged',p_acknowledged));
  -- Serialize identical keys even when a caller attempts two different records.
  perform pg_advisory_xact_lock(hashtextextended(v_actor::text || ':cancel:' || p_idempotency_key::text, 0));
  select * into v_existing from authority_private.command_receipts
  where actor_user_id = v_actor and command_name = 'cancel_pending_request' and idempotency_key = p_idempotency_key;
  if found then
    if v_existing.payload_hash <> v_hash then raise exception using errcode = '22023', message = 'idempotency_payload_mismatch'; end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;
  select * into v_record from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id for update;
  if not found then raise exception using errcode = '42501', message = 'cancellation_not_allowed'; end if;
  if v_record.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'request_changed'; end if;
  if v_record.status <> 'awaiting_principal' then raise exception using errcode = '22023', message = 'cancellation_not_available'; end if;
  if exists (select 1 from public.authority_institution_decisions where authority_record_id = v_record.id) then
    raise exception using errcode = '22023', message = 'cancellation_not_available';
  end if;
  update public.authority_records set status = 'canceled', version = version + 1, updated_at = now()
  where id = v_record.id returning * into v_record;
  v_snapshot := jsonb_build_object('receipt_code',v_code,'reference_code',v_record.reference_code,
    'record_id',v_record.id,'record_version',v_record.version,'status','canceled',
    'reason',btrim(p_reason),'canceled_at',now(),'canceled_by',v_actor,'canceled_by_role',v_role,
    'institution_name',(select display_name from public.organizations where id = p_organization_id),
    'principal_name',v_record.principal_name,'representative_name',v_record.representative_name,
    'account_boundary',v_record.account_boundary,'requested_action_keys',to_jsonb(v_record.allowed_action_keys),
    'template_key',v_record.template_key,'template_version',v_record.template_version);
  v_result := jsonb_build_object('authority_record_id',v_record.id,'record_version',v_record.version,
    'receipt_code',v_code,'receipt_sha256',authority_private.payload_hash(v_snapshot),'replayed',false);
  insert into public.authority_request_cancellations values(v_record.id,p_organization_id,v_code,v_snapshot,v_result->>'receipt_sha256');
  select coalesce(max(sequence),0)+1 into v_sequence from public.authority_events where authority_record_id=v_record.id;
  insert into public.authority_events(organization_id,authority_record_id,sequence,record_version,event_type,
    actor_user_id,actor_role,summary,detail,audience,payload)
  values(p_organization_id,v_record.id,v_sequence,v_record.version,'authority.canceled',v_actor,v_role,
    'Institution canceled the request',btrim(p_reason),array['owner','admin','staff','reviewer','auditor','principal','representative'],v_result);
  insert into public.organization_audit_events(organization_id,actor_user_id,event_type,subject_type,subject_id,payload)
  values(p_organization_id,v_actor,'authority.canceled','authority_record',v_record.id,v_result);
  -- Supersede work only. An email already accepted by a provider cannot be recalled.
  update authority_private.notification_outbox set status='canceled',next_attempt_at=null,updated_at=now()
  where authority_record_id=v_record.id and status in ('pending','processing','retrying');
  -- Existing links and sessions become read-only through the record-state checks.
  -- Receipt recovery rotates links using the existing audited reissue command.
  insert into authority_private.command_receipts(actor_user_id,command_name,idempotency_key,payload_hash,result)
  values(v_actor,'cancel_pending_request',p_idempotency_key,v_hash,v_result);
  return v_result;
end;
$$;
create function public.cancel_pending_request_v1(p_organization_id uuid,p_authority_record_id uuid,
  p_expected_version bigint,p_reason text,p_acknowledged boolean,p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.cancel_pending_request_v1(p_organization_id,p_authority_record_id,p_expected_version,p_reason,p_acknowledged,p_idempotency_key);
$$;
revoke all on function authority_private.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid) from public,anon,authenticated;
revoke all on function public.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid) from public,anon,authenticated;
grant execute on function authority_private.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid) to authenticated;
grant execute on function public.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid) to authenticated;

create function authority_private.get_participant_cancellation_v1(p_session_token text,p_authority_record_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if coalesce(p_session_token,'') !~ '^[0-9a-f]{64}$' then return null; end if;
  select jsonb_build_object('receipt_snapshot',c.receipt_snapshot,'receipt_sha256',c.receipt_sha256)
  into v_result from authority_private.participant_sessions s
  join public.authority_request_cancellations c on c.authority_record_id=s.authority_record_id and c.organization_id=s.organization_id
  join public.organizations o on o.id=c.organization_id and o.status='active'
  where s.authority_record_id=p_authority_record_id and s.token_hash=encode(extensions.digest(convert_to(p_session_token,'UTF8'),'sha256'),'hex')
    and s.status='active' and s.expires_at>now() and s.participant_role in ('principal','representative');
  return v_result;
end;
$$;
create function public.get_participant_cancellation_v1(p_session_token text,p_authority_record_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select authority_private.get_participant_cancellation_v1(p_session_token,p_authority_record_id);
$$;
revoke all on function authority_private.get_participant_cancellation_v1(text,uuid) from public,anon,authenticated;
revoke all on function public.get_participant_cancellation_v1(text,uuid) from public,anon,authenticated;
grant execute on function authority_private.get_participant_cancellation_v1(text,uuid) to service_role;
grant execute on function public.get_participant_cancellation_v1(text,uuid) to service_role;

create or replace function authority_private.preview_participant_invitation_v1(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_token text := lower(btrim(coalesce(p_token, '')));
  v_token_hash text;
  v_invitation public.authority_participant_invitations%rowtype;
  v_record public.authority_records%rowtype;
  v_organization public.organizations%rowtype;
  v_entry_status text;
  v_access_purpose text;
begin
  if v_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'participant_invitation_unavailable';
  end if;
  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
  select i.* into v_invitation
  from public.authority_participant_invitations i
  join authority_private.participant_invitation_secrets s on s.invitation_id = i.id
  where s.token_hash = v_token_hash;
  if not found or v_invitation.status = 'revoked' then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;
  select * into v_record from public.authority_records where id = v_invitation.authority_record_id;
  select * into v_organization from public.organizations
  where id = v_invitation.organization_id and status = 'active';
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;

  v_access_purpose := case
    when v_record.status in ('accepted', 'accepted_with_limits', 'rejected', 'revoked', 'expired', 'canceled') then 'receipt'
    when v_invitation.participant_role = 'representative'
      and v_record.status in ('evidence_required', 'ready_to_submit', 'information_requested') then 'resume'
    else 'decision'
  end;
  v_entry_status := case
    when v_invitation.status = 'accepted' then 'already_used'
    when v_invitation.status = 'expired' or v_invitation.expires_at <= now() then 'expired'
    when v_record.status in ('accepted', 'accepted_with_limits', 'rejected', 'revoked', 'expired', 'canceled') then 'ready'
    when v_invitation.participant_role = 'principal' and v_record.status = 'awaiting_principal' then 'ready'
    when v_invitation.participant_role = 'representative' and v_record.status = 'awaiting_principal' then 'waiting'
    when v_invitation.participant_role = 'representative'
      and v_record.status in ('awaiting_representative', 'evidence_required', 'ready_to_submit', 'information_requested') then 'ready'
    else 'unavailable'
  end;
  if v_entry_status in ('already_used', 'unavailable') then
    return jsonb_build_object('entry_status', v_entry_status, 'access_purpose', v_access_purpose);
  end if;
  return jsonb_build_object(
    'entry_status', v_entry_status,
    'access_purpose', v_access_purpose,
    'institution_name', v_organization.display_name,
    'reference_code', v_record.reference_code,
    'participant_role', v_invitation.participant_role,
    'participant_name', case when v_invitation.participant_role = 'principal' then v_record.principal_name else v_record.representative_name end,
    'other_person_name', case when v_invitation.participant_role = 'principal' then v_record.representative_name else v_record.principal_name end,
    'purpose', v_record.purpose,
    'account_boundary', v_record.account_boundary,
    'allowed_action_keys', to_jsonb(v_record.allowed_action_keys),
    'valid_until', v_record.valid_until,
    'invitation_expires_at', v_invitation.expires_at
  );
end;
$$;

create or replace function authority_private.exchange_participant_invitation_v1(
  p_token text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := lower(btrim(coalesce(p_token, '')));
  v_token_hash text;
  v_invitation_id uuid;
  v_invitation public.authority_participant_invitations%rowtype;
  v_record public.authority_records%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_payload_hash text;
  v_session_token text;
  v_session_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_session_expires_at timestamptz;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
  v_is_resume boolean;
  v_is_receipt boolean;
  v_access_purpose text;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if v_token !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'participant_invitation_unavailable';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
  select s.invitation_id into v_invitation_id
  from authority_private.participant_invitation_secrets s
  where s.token_hash = v_token_hash;
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_invitation_id::text || ':participant_exchange', 0));
  select * into v_invitation from public.authority_participant_invitations where id = v_invitation_id;
  select * into v_record from public.authority_records where id = v_invitation.authority_record_id for update;
  select * into v_invitation from public.authority_participant_invitations where id = v_invitation_id for update;

  v_is_resume := v_invitation.participant_role = 'representative'
    and v_record.status in ('evidence_required', 'ready_to_submit', 'information_requested');
  v_is_receipt := v_record.status in ('accepted', 'accepted_with_limits', 'rejected', 'revoked', 'expired', 'canceled');
  v_access_purpose := case when v_is_receipt then 'receipt' when v_is_resume then 'resume' else 'decision' end;
  v_payload_hash := authority_private.payload_hash(jsonb_build_object('invitation_id', v_invitation.id));
  v_session_token := encode(extensions.digest(convert_to(
    v_token || ':' || p_idempotency_key::text || ':' || v_invitation.id::text,
    'UTF8'
  ), 'sha256'), 'hex');
  v_session_hash := encode(extensions.digest(convert_to(v_session_token, 'UTF8'), 'sha256'), 'hex');

  select * into v_receipt
  from authority_private.participant_command_receipts
  where invitation_id = v_invitation.id
    and command_name = 'exchange_participant_invitation'
    and idempotency_key = p_idempotency_key;
  if found then
    select * into v_session from authority_private.participant_sessions
    where invitation_id = v_invitation.id and token_hash = v_session_hash
      and status = 'active' and expires_at > now();
    if not found then
      raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true, 'session_token', v_session_token);
  end if;

  if v_invitation.status = 'accepted' then
    raise exception using errcode = '22023', message = 'participant_invitation_already_used';
  end if;
  if v_invitation.status = 'revoked' then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;
  if v_invitation.status = 'expired' or v_invitation.expires_at <= now() then
    raise exception using errcode = '22023', message = 'participant_invitation_expired';
  end if;
  if v_invitation.status <> 'pending' then
    raise exception using errcode = 'P0002', message = 'participant_invitation_unavailable';
  end if;
  if not v_is_receipt and v_invitation.participant_role = 'principal' and v_record.status <> 'awaiting_principal' then
    raise exception using errcode = '22023', message = 'participant_invitation_not_ready';
  end if;
  if not v_is_receipt and v_invitation.participant_role = 'representative'
    and v_record.status not in ('awaiting_representative', 'evidence_required', 'ready_to_submit', 'information_requested') then
    raise exception using errcode = '22023', message = 'participant_invitation_not_ready';
  end if;

  v_session_expires_at := least(v_invitation.expires_at, now() + interval '30 minutes');
  update public.authority_participant_invitations
  set status = 'accepted', accepted_at = now(), version = version + 1, updated_at = now()
  where id = v_invitation.id returning * into v_invitation;
  insert into authority_private.participant_sessions (
    invitation_id, organization_id, authority_record_id, participant_role,
    token_hash, status, expires_at
  ) values (
    v_invitation.id, v_invitation.organization_id, v_invitation.authority_record_id,
    v_invitation.participant_role, v_session_hash, 'active', v_session_expires_at
  ) returning * into v_session;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    case
      when v_is_receipt then 'participant.receipt_access_established'
      when v_is_resume then 'participant.access_resumed'
      else 'participant.access_established'
    end,
    null, v_invitation.participant_role,
    case
      when v_is_receipt and v_invitation.participant_role = 'principal' then 'Person granting authority opened the request receipt'
      when v_is_receipt then 'Representative opened the request receipt'
      when v_is_resume then 'Representative resumed secure access'
      when v_invitation.participant_role = 'principal' then 'Person granting authority opened secure access'
      else 'Representative opened secure access'
    end,
    case
      when v_is_receipt then 'A role-bound session was established for the immutable request receipt.'
      when v_is_resume then 'A new role-bound session was established without changing the saved authority decision.'
      else 'A role-bound participant session was established from a valid one-time invitation.'
    end,
    array['owner', 'admin', 'staff', 'reviewer', 'auditor', v_invitation.participant_role]::text[],
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'session_expires_at', v_session_expires_at,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, null,
    case
      when v_is_receipt then 'participant.receipt_access_established'
      when v_is_resume then 'participant.access_resumed'
      else 'participant.access_established'
    end,
    'authority_record', v_record.id,
    jsonb_build_object(
      'participant_role', v_invitation.participant_role,
      'invitation_id', v_invitation.id,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'participant_role', v_invitation.participant_role,
    'session_expires_at', v_session_expires_at,
    'event_id', v_event_id,
    'resume', v_is_resume,
    'receipt', v_is_receipt,
    'access_purpose', v_access_purpose
  );
  insert into authority_private.participant_command_receipts (
    invitation_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_invitation.id, 'exchange_participant_invitation', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false, 'session_token', v_session_token);
end;
$$;

create or replace function authority_private.reissue_participant_invitation_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_participant_role text,
  p_expected_record_version bigint,
  p_expected_invitation_version bigint,
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
  v_invitation public.authority_participant_invitations%rowtype;
  v_receipt authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
  v_is_resume boolean;
  v_is_receipt boolean;
  v_access_purpose text;
  v_template_key text;
  v_next_send_sequence integer;
begin
  if p_idempotency_key is null or p_participant_role not in ('principal', 'representative') then
    raise exception using errcode = '22023', message = 'participant_invitation_reissue_invalid';
  end if;
  v_actor_role := authority_private.assert_authority_record_operator(p_organization_id);
  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_record_id', p_authority_record_id,
    'participant_role', p_participant_role,
    'expected_record_version', p_expected_record_version,
    'expected_invitation_version', p_expected_invitation_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':invitation_reissue:' || p_participant_role, 0));
  select * into v_receipt from authority_private.command_receipts
  where actor_user_id = v_actor and command_name = 'reissue_participant_invitation'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true, 'invitation_token', null);
  end if;

  select * into v_record from public.authority_records
  where id = p_authority_record_id and organization_id = p_organization_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'authority_request_not_found'; end if;
  if v_record.version <> p_expected_record_version then
    raise exception using errcode = 'P0001', message = 'participant_record_changed';
  end if;
  v_is_resume := p_participant_role = 'representative'
    and v_record.status in ('evidence_required', 'ready_to_submit', 'information_requested');
  v_is_receipt := v_record.status in ('accepted', 'accepted_with_limits', 'rejected', 'revoked', 'expired', 'canceled');
  v_access_purpose := case when v_is_receipt then 'receipt' when v_is_resume then 'resume' else 'decision' end;
  if not v_is_receipt and (
    (p_participant_role = 'principal' and v_record.status <> 'awaiting_principal')
    or (p_participant_role = 'representative'
      and v_record.status not in ('awaiting_representative', 'evidence_required', 'ready_to_submit', 'information_requested'))
  ) then
    raise exception using errcode = '22023', message = 'participant_invitation_reissue_not_allowed';
  end if;

  select * into v_invitation from public.authority_participant_invitations
  where authority_record_id = v_record.id and participant_role = p_participant_role for update;
  if not found or v_invitation.version <> p_expected_invitation_version then
    raise exception using errcode = 'P0001', message = 'participant_invitation_changed';
  end if;
  update authority_private.participant_sessions set status = 'revoked', updated_at = now()
  where invitation_id = v_invitation.id and status = 'active';
  update authority_private.participant_invitation_secrets
  set token_hash = encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'), created_at = now()
  where invitation_id = v_invitation.id;
  update public.authority_participant_invitations
  set status = 'pending', accepted_at = null, revoked_at = null,
    expires_at = now() + interval '72 hours', version = version + 1, updated_at = now()
  where id = v_invitation.id returning * into v_invitation;

  v_template_key := case when p_participant_role = 'principal'
    then 'principal_authority_invitation' else 'representative_authority_invitation' end;

  -- Every send gets its own tracked row. Any prior row for this invitation
  -- that never reached a terminal state is superseded by this new send and
  -- marked canceled; any row that already recorded a real delivered/failed
  -- outcome is left exactly as it was.
  update authority_private.notification_outbox
  set status = 'canceled', next_attempt_at = null, updated_at = now()
  where invitation_id = v_invitation.id
    and status in ('pending', 'processing', 'retrying');

  select coalesce(max(send_sequence), 0) + 1 into v_next_send_sequence
  from authority_private.notification_outbox
  where invitation_id = v_invitation.id;

  insert into authority_private.notification_outbox (
    organization_id, authority_record_id, invitation_id, template_key,
    recipient_email_normalized, send_sequence, payload
  ) values (
    p_organization_id, v_record.id, v_invitation.id, v_template_key,
    v_invitation.email_normalized, v_next_send_sequence,
    jsonb_build_object(
      'reference_code', v_record.reference_code,
      'participant_role', p_participant_role,
      'invitation_version', v_invitation.version,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  );

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    case
      when v_is_receipt then 'participant.receipt_invitation_prepared'
      when v_is_resume then 'participant.resume_invitation_prepared'
      else 'participant.invitation_reissued'
    end,
    v_actor, v_actor_role,
    case
      when v_is_receipt and p_participant_role = 'principal' then 'Secure principal request receipt prepared'
      when v_is_receipt then 'Secure representative request receipt prepared'
      when v_is_resume then 'Secure representative resume link prepared'
      when p_participant_role = 'principal' then 'Fresh principal invitation prepared'
      else 'Fresh representative invitation prepared'
    end,
    case
      when v_is_receipt then 'Prior sessions were revoked. A new single-use link is ready for the immutable request receipt.'
      when v_is_resume then 'Prior sessions were revoked. The saved authority decision was preserved and a new single-use evidence link is ready.'
      else 'The previous link and active session were revoked. A new single-use link is ready for delivery.'
    end,
    array['owner', 'admin', 'staff', 'reviewer', 'auditor']::text[],
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'participant_role', p_participant_role,
      'invitation_version', v_invitation.version,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  ) returning event_id into v_event_id;
  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, v_actor,
    case
      when v_is_receipt then 'participant.receipt_invitation_prepared'
      when v_is_resume then 'participant.resume_invitation_prepared'
      else 'participant.invitation_reissued'
    end,
    'authority_record', v_record.id,
    jsonb_build_object(
      'invitation_id', v_invitation.id,
      'participant_role', p_participant_role,
      'invitation_version', v_invitation.version,
      'event_id', v_event_id,
      'resume', v_is_resume,
      'receipt', v_is_receipt,
      'access_purpose', v_access_purpose
    )
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'reference_code', v_record.reference_code,
    'invitation_id', v_invitation.id,
    'invitation_version', v_invitation.version,
    'participant_role', v_invitation.participant_role,
    'email', v_invitation.email_normalized,
    'expires_at', v_invitation.expires_at,
    'event_id', v_event_id,
    'resume', v_is_resume,
    'receipt', v_is_receipt,
    'access_purpose', v_access_purpose
  );
  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'reissue_participant_invitation', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false, 'invitation_token', v_token);
end;
$$;

-- Read-only status uses request-reader roles, including auditors.
create or replace function authority_private.get_authority_notification_status_v1(
  p_organization_id uuid,
  p_authority_record_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform authority_private.current_actor_id();
  if not authority_private.has_active_membership(p_organization_id, array['owner','admin','staff','reviewer','auditor']) then
    raise exception using errcode = '42501', message = 'authority_request_not_found';
  end if;
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  if not exists (
    select 1 from public.authority_records
    where id = p_authority_record_id and organization_id = p_organization_id
  ) then
    raise exception using errcode = 'P0002', message = 'authority_request_not_found';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'invitation_id', i.id,
      'invitation_version', i.version,
      'participant_role', i.participant_role,
      'invitation_status', i.status,
      'delivery_status', latest.status,
      'attempts', latest.attempts,
      'delivered_at', latest.delivered_at,
      'last_error_code', latest.last_error_code,
      'send_count', latest.send_count
    ) order by i.participant_role)
    from public.authority_participant_invitations i
    join lateral (
      select o.status, o.attempts, o.delivered_at, o.last_error_code,
        (select count(*) from authority_private.notification_outbox c where c.invitation_id = i.id) as send_count
      from authority_private.notification_outbox o
      where o.invitation_id = i.id
      order by o.send_sequence desc
      limit 1
    ) latest on true
    where i.organization_id = p_organization_id
      and i.authority_record_id = p_authority_record_id
  ), '[]'::jsonb);
end;
$$;
notify pgrst, 'reload schema';
