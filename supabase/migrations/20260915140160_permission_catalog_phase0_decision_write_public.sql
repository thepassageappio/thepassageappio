-- Phase 0: public wrapper for institution decision with frozen permission labels (#129).

create or replace function public.record_institution_decision_service_v2(
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_outcome text,
  p_reason text,
  p_accepted_action_keys text[],
  p_limitations text[],
  p_acknowledged boolean,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.record_institution_decision_service_v2(
    p_actor_user_id, p_organization_id, p_authority_record_id,
    p_expected_version, p_outcome, p_reason, p_accepted_action_keys,
    p_limitations, p_acknowledged, p_idempotency_key
  );
$$;

revoke execute on function authority_private.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) from public, anon, authenticated;
revoke execute on function public.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) from public, anon, authenticated;
grant execute on function authority_private.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) to service_role;
grant execute on function public.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) to service_role;

comment on function public.record_institution_decision_service_v2(uuid, uuid, uuid, bigint, text, text, text[], text[], boolean, uuid) is
  'Server-only institution decision command with explicit accepted-action scope, frozen permission label snapshots, immutable receipt, and idempotency.';
