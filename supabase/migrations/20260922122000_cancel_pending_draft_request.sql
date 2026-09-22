-- Allow staff to cancel unsaved drafts with the same cancel_pending_request_v1 path.
-- First supported transitions: draft|awaiting_principal -> canceled.
create or replace function authority_private.cancel_pending_request_v1(
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
  if v_record.status not in ('draft', 'awaiting_principal') then raise exception using errcode = '22023', message = 'cancellation_not_available'; end if;
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

create or replace function public.cancel_pending_request_v1(p_organization_id uuid,p_authority_record_id uuid,
  p_expected_version bigint,p_reason text,p_acknowledged boolean,p_idempotency_key uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select authority_private.cancel_pending_request_v1(p_organization_id,p_authority_record_id,p_expected_version,p_reason,p_acknowledged,p_idempotency_key);
$$;
revoke all on function authority_private.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid) from public,anon,authenticated;
revoke all on function public.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid) from public,anon,authenticated;
grant execute on function authority_private.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid) to authenticated;
grant execute on function public.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid) to authenticated;
notify pgrst, 'reload schema';
