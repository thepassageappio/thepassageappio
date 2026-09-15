-- Phase 0 permission catalog: participant receipt returns frozen label snapshots (#129).
-- UI: "What the bank said yes to" — never say catalog in buyer UI.

-- ---------------------------------------------------------------------------

create or replace function authority_private.get_participant_decision_receipt_v1(
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
  v_decision public.authority_institution_decisions%rowtype;
  v_lifecycle public.authority_events%rowtype;
begin
  if v_token !~ '^[0-9a-f]{64}$' or p_authority_record_id is null then
    raise exception using errcode = '22023', message = 'participant_receipt_unavailable';
  end if;
  v_token_hash := encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex');
  select * into v_session
  from authority_private.participant_sessions
  where token_hash = v_token_hash
    and authority_record_id = p_authority_record_id
    and participant_role in ('principal', 'representative')
    and status = 'active'
    and expires_at > now();
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_receipt_unavailable';
  end if;

  select * into v_record from public.authority_records where id = v_session.authority_record_id;
  select * into v_organization from public.organizations
  where id = v_session.organization_id and status = 'active';
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_receipt_unavailable';
  end if;
  select * into v_decision from public.authority_institution_decisions
  where authority_record_id = v_record.id and organization_id = v_record.organization_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_receipt_unavailable';
  end if;

  select * into v_lifecycle
  from public.authority_events
  where authority_record_id = v_record.id
    and event_type in ('authority.revocation_recorded', 'authority.expiration_recorded', 'representative.withdrawn')
  order by sequence desc
  limit 1;

  return jsonb_build_object(
    'receipt_code', v_decision.receipt_code,
    'reference_code', v_record.reference_code,
    'institution_name', v_organization.display_name,
    'participant_role', v_session.participant_role,
    'participant_name', case when v_session.participant_role = 'principal' then v_record.principal_name else v_record.representative_name end,
    'other_person_name', case when v_session.participant_role = 'principal' then v_record.representative_name else v_record.principal_name end,
    'current_status', v_record.status,
    'current_version', v_record.version,
    'decision_record_version', v_decision.record_version,
    'purpose', v_record.purpose,
    'account_boundary', v_record.account_boundary,
    'requested_action_keys', to_jsonb(v_record.allowed_action_keys),
    'decision_outcome', v_decision.outcome,
    'decision_reason', v_decision.reason,
    'accepted_action_keys', to_jsonb(v_decision.accepted_action_keys),
    'accepted_permissions_snapshot', coalesce(
      v_decision.accepted_permissions_snapshot,
      v_decision.receipt_snapshot -> 'accepted_permissions_snapshot'
    ),
    'not_included_permissions_snapshot', coalesce(
      v_decision.not_included_permissions_snapshot,
      v_decision.receipt_snapshot -> 'not_included_permissions_snapshot'
    ),
    'limitations', to_jsonb(v_decision.limitations),
    'decided_at', v_decision.decided_at,
    'valid_until', v_record.valid_until,
    'receipt_sha256', v_decision.receipt_sha256,
    'lifecycle_summary', case when v_lifecycle.event_id is null then null else v_lifecycle.summary end,
    'lifecycle_reason', case when v_lifecycle.event_id is null then null else nullif(v_lifecycle.payload ->> 'reason', '') end,
    'lifecycle_effective_at', case when v_lifecycle.event_id is null then null else v_lifecycle.payload ->> 'effective_at' end
  );
end;
$$;

create or replace function public.get_participant_decision_receipt_v1(
  p_session_token text,
  p_authority_record_id uuid
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select authority_private.get_participant_decision_receipt_v1(p_session_token, p_authority_record_id);
$$;

revoke execute on function authority_private.get_participant_decision_receipt_v1(text, uuid) from public, anon, authenticated;
revoke execute on function public.get_participant_decision_receipt_v1(text, uuid) from public, anon, authenticated;
grant execute on function authority_private.get_participant_decision_receipt_v1(text, uuid) to service_role;
grant execute on function public.get_participant_decision_receipt_v1(text, uuid) to service_role;

select pg_notify('pgrst', 'reload schema');
