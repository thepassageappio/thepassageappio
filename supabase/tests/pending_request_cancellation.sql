-- Single statement, local synthetic fixtures, always rolls back fixture writes on success.
DO $test$
declare
  actor uuid := gen_random_uuid(); org uuid := gen_random_uuid(); other_org uuid := gen_random_uuid();
  rec uuid := gen_random_uuid(); inv uuid; key uuid := gen_random_uuid(); result jsonb; replay jsonb;
  receipt jsonb; session_result jsonb; fresh jsonb; role_name text; participant text;
  failure text; before_snapshot jsonb; events_before bigint; invite_version bigint;
begin
 begin
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values(actor,actor::text||'@local.authority.test',now(),now(),now());
  insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status)
  select id,'Cancellation Test Bank','Cancellation Test Bank','regional_bank','1 Sample Way','Albany','NY','12207',actor,'ready' from unnest(array[org,other_org]) as id;
  insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role)
  values(org,actor,actor::text||'@local.authority.test','Synthetic Owner','owner');
  insert into public.authority_records(id,organization_id,created_by,status,template_key,template_version,account_boundary,principal_name,principal_email_normalized,representative_name,representative_email_normalized,allowed_action_keys,valid_until,activated_at)
  values(rec,org,actor,'awaiting_principal','ny_financial_poa','2026.1','Sample account','Casey','casey@local.authority.test','Parker','parker@local.authority.test',array['receive_duplicate_statements'],now()+interval '30 days',now());
  select to_jsonb(r)-'status'-'version'-'updated_at' into before_snapshot from public.authority_records r where id=rec;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal2','role','authenticated')::text,true);
  if has_function_privilege('anon','public.cancel_pending_request_v1(uuid,uuid,bigint,text,boolean,uuid)','execute') then raise exception 'anonymous command ACL'; end if;
  if has_table_privilege('authenticated','public.authority_request_cancellations','insert') then raise exception 'browser insert ACL'; end if;
  foreach role_name in array array['reviewer','auditor','developer'] loop
    update public.organization_memberships set role=role_name where organization_id=org;
    begin perform public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,key); raise exception 'wrong role accepted';
    exception when insufficient_privilege then if sqlerrm <> 'cancellation_not_allowed' then raise; end if; end;
  end loop;
  update public.organization_memberships set role='owner' where organization_id=org;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal1')::text,true);
  begin perform public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,key); raise exception 'AAL1 accepted';
  exception when insufficient_privilege then if sqlerrm <> 'mfa_verification_required' then raise; end if; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal2')::text,true);
  begin perform public.cancel_pending_request_v1(other_org,rec,1,'Duplicate request',true,key); raise exception 'other tenant accepted';
  exception when insufficient_privilege then null; end;
  update public.organization_memberships set status='revoked',revoked_at=now(),revoked_by=actor where organization_id=org;
  begin perform public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,key); raise exception 'inactive member accepted';
  exception when insufficient_privilege then null; end;
  update public.organization_memberships set status='active',revoked_at=null,revoked_by=null where organization_id=org;
  update auth.users set email_confirmed_at=null where id=actor;
  begin perform public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,key); raise exception 'unconfirmed accepted';
  exception when insufficient_privilege then null; end;
  update auth.users set email_confirmed_at=now() where id=actor;
  begin perform public.cancel_pending_request_v1(org,rec,2,'Duplicate request',true,key); raise exception 'stale version accepted';
  exception when sqlstate 'P0001' then if sqlerrm <> 'request_changed' then raise; end if; end;
  begin perform public.cancel_pending_request_v1(org,rec,1,' ',true,key); raise exception 'blank reason accepted';
  exception when invalid_parameter_value then null; end;
  begin perform public.cancel_pending_request_v1(org,rec,1,'Duplicate request',null,key); raise exception 'null acknowledgment accepted';
  exception when invalid_parameter_value then null; end;
  begin perform public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,null); raise exception 'null key accepted';
  exception when invalid_parameter_value then null; end;
  foreach role_name in array array['draft','awaiting_representative','evidence_required','ready_to_submit','under_review','information_requested','accepted','accepted_with_limits','rejected','declined','withdrawn','revoked','expired','canceled'] loop
    update public.authority_records set status=role_name,activated_at=case when role_name='draft' then null else now() end where id=rec;
    begin perform public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,key); raise exception 'nonpending state accepted';
    exception when invalid_parameter_value then if sqlerrm <> 'cancellation_not_available' then raise; end if; end;
  end loop;
  update public.authority_records set status='awaiting_principal',activated_at=(before_snapshot->>'activated_at')::timestamptz where id=rec;
  foreach participant in array array['principal','representative'] loop
    inv:=gen_random_uuid();
    insert into public.authority_participant_invitations(id,organization_id,authority_record_id,participant_role,email_normalized,invited_by,expires_at)
    values(inv,org,rec,participant,participant||'@local.authority.test',actor,now()+interval '3 days');
    insert into authority_private.participant_invitation_secrets values(inv,encode(extensions.digest(convert_to(case when participant='principal' then repeat('c',64) else repeat('d',64) end,'UTF8'),'sha256'),'hex'),now());
    insert into authority_private.notification_outbox(organization_id,authority_record_id,invitation_id,template_key,recipient_email_normalized,status,send_sequence)
    select org,rec,inv,'cancellation_test',participant||'@local.authority.test',s,n from unnest(array['pending','processing','retrying','delivered','failed']) with ordinality as t(s,n);
  end loop;
  result:=public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,key);
  foreach role_name in array array['admin','staff'] loop
    update public.organization_memberships set role=role_name where organization_id=org;
    perform public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,key);
  end loop;
  update public.organization_memberships set role='auditor' where organization_id=org;
  perform public.get_authority_notification_status_v1(org,rec);
  update public.organization_memberships set role='developer' where organization_id=org;
  begin perform public.get_authority_notification_status_v1(org,rec); raise exception 'developer reads delivery status';
  exception when insufficient_privilege then null; end;
  update public.organization_memberships set role='owner' where organization_id=org;
  replay:=public.cancel_pending_request_v1(org,rec,1,'Duplicate request',true,key);
  if replay->>'replayed'<>'true' or result->>'receipt_code'<>replay->>'receipt_code' then raise exception 'bad replay'; end if;
  begin perform public.cancel_pending_request_v1(org,rec,1,'Different reason',true,key); raise exception 'payload mismatch accepted';
  exception when invalid_parameter_value then if sqlerrm <> 'idempotency_payload_mismatch' then raise; end if; end;
  if (select count(*) from public.authority_events where authority_record_id=rec and event_type='authority.canceled')<>1 then raise exception 'duplicate event'; end if;
  if (select count(*) from public.authority_request_cancellations where authority_record_id=rec)<>1 then raise exception 'duplicate receipt'; end if;
  if exists(select 1 from public.authority_institution_decisions where authority_record_id=rec) then raise exception 'fabricated decision'; end if;
  if (select to_jsonb(r)-'status'-'version'-'updated_at' from public.authority_records r where id=rec)<>before_snapshot then raise exception 'snapshot changed'; end if;
  if (select activated_count from public.organization_entitlements where organization_id=org)<>0 then raise exception 'usage changed'; end if;
  if (select count(*) from authority_private.notification_outbox where authority_record_id=rec and status='canceled')<>6 then raise exception 'queued invitations not stopped'; end if;
  if (select count(*) from authority_private.notification_outbox where authority_record_id=rec and status in ('delivered','failed'))<>4 then raise exception 'send history changed'; end if;
  select jsonb_build_object('receipt_snapshot',receipt_snapshot,'receipt_sha256',receipt_sha256) into receipt from public.authority_request_cancellations where authority_record_id=rec;
  if receipt->>'receipt_sha256'<>authority_private.payload_hash(receipt->'receipt_snapshot') then raise exception 'receipt hash mismatch'; end if;
  begin update public.authority_request_cancellations set receipt_code='changed' where authority_record_id=rec; raise exception 'mutable receipt';
  exception when sqlstate '55000' then null; end;
  foreach participant in array array['principal','representative'] loop
    if authority_private.preview_participant_invitation_v1(case when participant='principal' then repeat('c',64) else repeat('d',64) end)->>'access_purpose'<>'receipt' then raise exception 'wrong link purpose'; end if;
    session_result:=authority_private.exchange_participant_invitation_v1(case when participant='principal' then repeat('c',64) else repeat('d',64) end,gen_random_uuid());
    if authority_private.get_participant_cancellation_v1(session_result->>'session_token',rec) is distinct from receipt then raise exception 'participant receipt mismatch'; end if;
    if authority_private.get_participant_cancellation_v1(session_result->>'session_token',gen_random_uuid()) is not null then raise exception 'cross request leak'; end if;
    begin perform authority_private.submit_participant_decision_v1(session_result->>'session_token',rec,2,case when participant='principal' then 'principal_confirm' else 'representative_accept' end,true,'',gen_random_uuid()); raise exception 'participant action after cancellation';
    exception when sqlstate '22023' or sqlstate '42501' then null; end;
    select version into invite_version from public.authority_participant_invitations where authority_record_id=rec and participant_role=participant;
    fresh:=public.reissue_participant_invitation_v1(org,rec,participant,2,invite_version,gen_random_uuid());
    if authority_private.get_participant_cancellation_v1(session_result->>'session_token',rec) is not null then raise exception 'old session survived reissue'; end if;
    session_result:=authority_private.exchange_participant_invitation_v1(fresh->>'invitation_token',gen_random_uuid());
    if authority_private.get_participant_cancellation_v1(session_result->>'session_token',rec) is distinct from receipt then raise exception 'fresh receipt mismatch'; end if;
  end loop;
  if authority_private.get_participant_cancellation_v1(repeat('f',64),rec) is not null then raise exception 'bad token accepted'; end if;
  execute 'set local role authenticated';
  if (select count(*) from public.authority_request_cancellations where authority_record_id=rec)<>1 then raise exception 'owner cannot read cancellation'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'aal','aal2')::text,true);
  if exists(select 1 from public.authority_request_cancellations where authority_record_id=rec) then raise exception 'RLS cross-tenant receipt leak'; end if;
  execute 'reset role';
  -- All fixture writes, including append-only records, roll back together.
  raise exception using errcode='ZX001',message='cancellation assertions passed; roll back fixtures';
 exception when sqlstate 'ZX001' then null;
 end;
end;
$test$;
