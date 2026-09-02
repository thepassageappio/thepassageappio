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
    when v_invitation.participant_role = 'representative'
      and v_record.status in ('evidence_required', 'ready_to_submit', 'information_requested') then 'resume'
    else 'decision'
  end;
  v_entry_status := case
    when v_invitation.status = 'accepted' then 'already_used'
    when v_invitation.status = 'expired' or v_invitation.expires_at <= now() then 'expired'
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
