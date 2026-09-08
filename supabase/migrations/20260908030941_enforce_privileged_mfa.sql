-- Enforce owner/admin TOTP at the database RPC boundary as well as the Next.js
-- layout and Server Action boundaries. Supabase Auth signs the immutable `aal`
-- claim into the caller JWT; aal2 means the current session completed MFA.

create or replace function authority_private.require_privileged_mfa_v1(
  p_organization_id uuid
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select membership.role
  into v_role
  from public.organization_memberships as membership
  where membership.organization_id = p_organization_id
    and membership.user_id = (select auth.uid())
    and membership.status = 'active'
  limit 1;

  if v_role in ('owner', 'admin')
    and coalesce((select auth.jwt()->>'aal'), 'aal1') <> 'aal2'
  then
    raise exception using errcode = '42501', message = 'mfa_verification_required';
  end if;
end;
$$;

revoke execute on function authority_private.require_privileged_mfa_v1(uuid)
from public, anon;
grant execute on function authority_private.require_privileged_mfa_v1(uuid)
to authenticated;

create or replace function public.invite_member_v1(
  p_organization_id uuid, p_email text, p_role text, p_idempotency_key uuid
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.invite_member_v1(p_organization_id, p_email, p_role, p_idempotency_key);
end;
$$;

create or replace function public.change_member_role_v1(
  p_organization_id uuid, p_membership_id uuid, p_role text,
  p_expected_version bigint, p_idempotency_key uuid
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.change_member_role_v1(
    p_organization_id, p_membership_id, p_role, p_expected_version, p_idempotency_key
  );
end;
$$;

create or replace function public.revoke_member_v1(
  p_organization_id uuid, p_membership_id uuid,
  p_expected_version bigint, p_idempotency_key uuid
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.revoke_member_v1(
    p_organization_id, p_membership_id, p_expected_version, p_idempotency_key
  );
end;
$$;

create or replace function public.revoke_member_invitation_v1(
  p_organization_id uuid, p_invitation_id uuid,
  p_expected_version bigint, p_idempotency_key uuid
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.revoke_member_invitation_v1(
    p_organization_id, p_invitation_id, p_expected_version, p_idempotency_key
  );
end;
$$;

create or replace function public.create_authority_draft_v1(
  p_organization_id uuid,
  p_principal_name text,
  p_principal_email text,
  p_representative_name text,
  p_representative_email text,
  p_account_boundary text,
  p_valid_until timestamptz,
  p_allowed_action_keys text[],
  p_idempotency_key uuid
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.create_authority_draft_v1(
    p_organization_id, p_principal_name, p_principal_email,
    p_representative_name, p_representative_email, p_account_boundary,
    p_valid_until, p_allowed_action_keys, p_idempotency_key
  );
end;
$$;

create or replace function public.activate_authority_request_v1(
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_result jsonb;
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  v_result := authority_private.activate_authority_request_v1(
    p_organization_id, p_authority_record_id, p_expected_version, p_idempotency_key
  );
  return (v_result - 'representative_token' - 'notifications_queued') || jsonb_build_object(
    'notifications_queued', 1,
    'representative_notification_held', true
  );
end;
$$;

create or replace function public.record_operator_participant_delivery_v1(
  p_organization_id uuid, p_invitation_id uuid, p_expected_invitation_version bigint,
  p_delivery_status text, p_provider text, p_provider_message_id text,
  p_error_code text, p_idempotency_key uuid
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.record_operator_participant_delivery_v1(
    p_organization_id, p_invitation_id, p_expected_invitation_version,
    p_delivery_status, p_provider, p_provider_message_id, p_error_code, p_idempotency_key
  );
end;
$$;

create or replace function public.reissue_participant_invitation_v1(
  p_organization_id uuid, p_authority_record_id uuid, p_participant_role text,
  p_expected_record_version bigint, p_expected_invitation_version bigint,
  p_idempotency_key uuid
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.reissue_participant_invitation_v1(
    p_organization_id, p_authority_record_id, p_participant_role,
    p_expected_record_version, p_expected_invitation_version, p_idempotency_key
  );
end;
$$;

create or replace function public.review_evidence_artifact_v1(
  p_organization_id uuid, p_authority_record_id uuid, p_artifact_id uuid,
  p_expected_record_version bigint, p_expected_artifact_version bigint,
  p_outcome text, p_note text, p_idempotency_key uuid
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.review_evidence_artifact_v1(
    p_organization_id, p_authority_record_id, p_artifact_id,
    p_expected_record_version, p_expected_artifact_version,
    p_outcome, p_note, p_idempotency_key
  );
end;
$$;

create or replace function public.request_pilot_invoice_v1(
  p_organization_id uuid, p_service_period_start date, p_service_period_end date,
  p_request_allowance integer, p_expected_entitlement_version bigint,
  p_idempotency_key uuid
)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.request_pilot_invoice_v1(
    p_organization_id, p_service_period_start, p_service_period_end,
    p_request_allowance, p_expected_entitlement_version, p_idempotency_key
  );
end;
$$;

comment on function authority_private.require_privileged_mfa_v1(uuid) is
  'Fails owner/admin organization RPC mutations unless the signed Supabase Auth JWT has aal2. Non-privileged organization roles continue through their existing capability checks.';
