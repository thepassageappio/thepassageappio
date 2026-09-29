-- Team invitation recovery: "Resend invite" and "Copy invite link" on /app/team.
--
-- Team invitation tokens are stored only as a SHA-256 hash in
-- authority_private.organization_invitation_secrets and the raw token is
-- returned exactly once by invite_member_v1. If that one email is never sent
-- (for example, the Demo recipient allowlist skips it) or lands in spam, the
-- invitee cannot join and nobody can recover the link.
--
-- reissue_member_invitation_v1 mints a fresh token for a pending, unexpired
-- invitation, replaces the stored hash (so every earlier link stops working),
-- restarts the same seven-day window a new invitation gets, resets delivery
-- tracking, and appends one organization_audit_events row, all in one
-- transaction. The raw token is returned once; an idempotent replay returns
-- token = null, like invite_member_v1. The old token is never read back.
--
-- Guards:
--   * owner/admin only (assert_member_manager), and owner/admin need aal2
--     (require_privileged_mfa_v1 in the public wrapper);
--   * an administrator cannot reissue an administrator invitation, matching
--     invite_member_v1 and revoke_member_invitation_v1;
--   * expected version (stale pages fail closed);
--   * at most 5 new links per invitation in any rolling hour.
--
-- organization_audit_events is append-only (20260928120100): INSERT only.
-- Idempotent: create or replace, and grants are re-runnable.

create or replace function authority_private.reissue_member_invitation_v1(
  p_organization_id uuid,
  p_invitation_id uuid,
  p_expected_version bigint,
  p_purpose text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_actor_role text := authority_private.assert_member_manager(p_organization_id);
  v_invitation public.organization_invitations%rowtype;
  v_existing authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at timestamptz := now() + interval '7 days';
  v_previous_version bigint;
  v_previous_expires_at timestamptz;
  v_recent_count integer;
  v_event_type text;
  v_summary text;
  v_detail text;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if p_purpose is null or p_purpose not in ('resend', 'copy_link') then
    raise exception using errcode = '22023', message = 'invitation_reissue_purpose_invalid';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'invitation_id', p_invitation_id,
    'expected_version', p_expected_version,
    'purpose', p_purpose
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_invitation_id::text || ':invitation_reissue', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'reissue_member_invitation'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    -- The raw token is returned once only.
    return v_existing.result || jsonb_build_object('replayed', true, 'token', null);
  end if;

  select * into v_invitation
  from public.organization_invitations
  where id = p_invitation_id and organization_id = p_organization_id
  for update;

  if not found or v_invitation.status <> 'pending' then
    raise exception using errcode = '22023', message = 'invitation_not_available';
  end if;
  if v_invitation.expires_at <= now() then
    raise exception using errcode = '22023', message = 'invitation_expired';
  end if;
  if v_invitation.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'stale_invitation_version';
  end if;
  if v_actor_role = 'admin' and v_invitation.role = 'admin' then
    raise exception using errcode = '42501', message = 'member_management_not_allowed';
  end if;

  select count(*) into v_recent_count
  from public.organization_audit_events e
  where e.subject_type = 'organization_invitation'
    and e.subject_id = v_invitation.id
    and e.event_type in ('membership.invitation_resent', 'membership.invitation_link_copied')
    and e.occurred_at > now() - interval '1 hour';
  if v_recent_count >= 5 then
    raise exception using errcode = 'P0001', message = 'invitation_reissue_limit_reached';
  end if;

  v_previous_version := v_invitation.version;
  v_previous_expires_at := v_invitation.expires_at;

  -- Replace the stored hash. The earlier token can no longer match in
  -- accept_member_invitation_v1. The old hash is overwritten, never returned.
  insert into authority_private.organization_invitation_secrets (invitation_id, token_hash, created_at)
  values (v_invitation.id, encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'), now())
  on conflict (invitation_id) do update
  set token_hash = excluded.token_hash,
      created_at = excluded.created_at;

  -- Clearing delivery_provider_message_id also stops late webhook events for
  -- the earlier email from changing this row.
  update public.organization_invitations
  set version = version + 1,
      expires_at = v_expires_at,
      delivery_status = 'pending',
      delivery_provider = case when p_purpose = 'copy_link' then 'manual_link' else null end,
      delivery_provider_message_id = null,
      delivery_error_code = null,
      delivery_confirmed_at = null,
      delivery_last_event_at = null,
      updated_at = now()
  where id = v_invitation.id
  returning * into v_invitation;

  if p_purpose = 'copy_link' then
    v_event_type := 'membership.invitation_link_copied';
    v_summary := 'New team invite link made to share by hand';
    v_detail := 'A new invite link was made. Earlier links for this invite no longer work.';
  else
    v_event_type := 'membership.invitation_resent';
    v_summary := 'New team invite link made for a new email';
    v_detail := 'A new invite link was made for a new email. Earlier links for this invite no longer work.';
  end if;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, v_event_type, 'organization_invitation', v_invitation.id,
    jsonb_build_object(
      'email', v_invitation.email_normalized,
      'role', v_invitation.role,
      'purpose', p_purpose,
      'previous_version', v_previous_version,
      'version', v_invitation.version,
      'previous_expires_at', v_previous_expires_at,
      'expires_at', v_invitation.expires_at,
      'summary', v_summary,
      'detail', v_detail
    )
  ) returning event_id into v_event_id;

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'invitation_id', v_invitation.id,
    'email', v_invitation.email_normalized,
    'role', v_invitation.role,
    'version', v_invitation.version,
    'expires_at', v_invitation.expires_at,
    'purpose', p_purpose,
    'event_id', v_event_id
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (v_actor, 'reissue_member_invitation', p_idempotency_key, v_payload_hash, v_result);

  return v_result || jsonb_build_object('replayed', false, 'token', v_token);
end;
$$;

create or replace function public.reissue_member_invitation_v1(
  p_organization_id uuid,
  p_invitation_id uuid,
  p_expected_version bigint,
  p_purpose text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.reissue_member_invitation_v1(
    p_organization_id, p_invitation_id, p_expected_version, p_purpose, p_idempotency_key
  );
end;
$$;

revoke execute on function authority_private.reissue_member_invitation_v1(uuid, uuid, bigint, text, uuid) from public, anon;
revoke execute on function public.reissue_member_invitation_v1(uuid, uuid, bigint, text, uuid) from public, anon;
grant execute on function authority_private.reissue_member_invitation_v1(uuid, uuid, bigint, text, uuid) to authenticated;
grant execute on function public.reissue_member_invitation_v1(uuid, uuid, bigint, text, uuid) to authenticated;

notify pgrst, 'reload schema';
