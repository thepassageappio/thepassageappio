-- Synthetic rollback-only integration test; no provider requests or surviving fixtures.
DO $test$
declare actor uuid:=gen_random_uuid(); org uuid:=gen_random_uuid(); other_org uuid:=gen_random_uuid();
 version1 uuid; version2 uuid; publish_key uuid:=gen_random_uuid(); draft_key uuid:=gen_random_uuid();
 before_id uuid; after_id uuid; invitation uuid:=gen_random_uuid(); result jsonb; replay jsonb; context jsonb; saved jsonb;
 request_snapshot jsonb; decision_snapshot jsonb; decision_hash text; old_count int;
 deadline timestamptz:=now()+interval '30 days';
begin
 begin
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values(actor,actor::text||'@local.authority.test',now(),now(),now());
  insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status)
  select id,'Publication Test Bank','Publication Test Bank','regional_bank','1 Sample Way','Albany','NY','12207',actor,'ready' from unnest(array[org,other_org]) id;
  insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role)
  values(org,actor,actor::text||'@local.authority.test','Synthetic Owner','owner');
  insert into public.organization_template_selections(organization_id,template_key,template_version,selected_by) values(org,'ny_financial_poa','2026.1',actor);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal2','role','authenticated')::text,true);
  result:=public.get_published_permission_catalog_v1(org,'financial_poa');
  version1:=(result->'published'->>'id')::uuid;
  if version1 is null or jsonb_array_length(result->'items')<>2 then raise exception 'new organization starter missing'; end if;
  result:=public.create_authority_draft_v2(org,'Casey Test','casey@local.authority.test','Parker Test','parker@local.authority.test','Synthetic account',deadline,array['receive_duplicate_statements','discuss_service_issues'],draft_key,version1);
  before_id:=(result->>'authority_record_id')::uuid;
  select governing_snapshot,requested_permissions_snapshot into saved,request_snapshot from public.authority_records where id=before_id;
  if saved->'permission_catalog'->>'id'<>version1::text or request_snapshot->>'catalog_version_id'<>version1::text then raise exception 'draft not pinned'; end if;
  if not exists(select 1 from public.authority_events where authority_record_id=before_id and event_type='authority.draft_created' and payload->'governing_snapshot'=saved and payload->'requested_permissions_snapshot'=request_snapshot) then raise exception 'creation event missing frozen rules'; end if;
  select count(*) into old_count from public.authority_participant_invitations where organization_id=org;
  -- Membership, tenant, unsupported type and MFA boundaries.
  begin perform public.get_published_permission_catalog_v1(other_org,'financial_poa'); raise exception 'foreign catalog read allowed'; exception when insufficient_privilege then null; end;
  begin perform public.publish_permission_catalog_v1(other_org,'financial_poa',version1,'Test',publish_key); raise exception 'foreign publish allowed'; exception when insufficient_privilege then null; end;
  begin perform public.publish_permission_catalog_v1(org,'trustee',version1,'Test',publish_key); raise exception 'unsupported type publish allowed'; exception when insufficient_privilege then null; end;
  update public.organization_memberships set role='reviewer' where organization_id=org;
  begin perform public.publish_permission_catalog_v1(org,'financial_poa',version1,'Test',publish_key); raise exception 'reviewer publish allowed'; exception when insufficient_privilege then null; end;
  update public.organization_memberships set role='staff' where organization_id=org;
  begin perform public.publish_permission_catalog_v1(org,'financial_poa',version1,'Test',publish_key); raise exception 'staff publish allowed'; exception when insufficient_privilege then null; end;
  update public.organization_memberships set role='owner' where organization_id=org;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal1','role','authenticated')::text,true);
  begin perform public.publish_permission_catalog_v1(org,'financial_poa',version1,'Test',publish_key); raise exception 'AAL1 publish allowed'; exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal2','role','authenticated')::text,true);
  result:=public.publish_permission_catalog_v1(org,'financial_poa',version1,'Synthetic publication',publish_key);
  version2:=(result->>'published_version_id')::uuid;
  replay:=public.publish_permission_catalog_v1(org,'financial_poa',version1,'Synthetic publication',publish_key);
  if version1=version2 or replay->>'published_version_id'<>version2::text or replay->>'replayed'<>'true' then raise exception 'publish replay mismatch'; end if;
  if (select count(*) from public.organization_audit_events where organization_id=org and event_type='policy.permissions_published')<>1 then raise exception 'duplicate publish audit'; end if;
  begin perform public.publish_permission_catalog_v1(org,'financial_poa',version1,'Changed input',publish_key); raise exception 'idempotency conflict accepted'; exception when invalid_parameter_value then if sqlerrm<>'idempotency_payload_mismatch' then raise; end if; end;
  begin perform public.publish_permission_catalog_v1(org,'financial_poa',version1,'Stale expected version',gen_random_uuid()); raise exception 'stale publication accepted'; exception when serialization_failure then null; end;
  -- A replay must succeed even after publication. A genuinely new stale form must fail.
  replay:=public.create_authority_draft_v2(org,'Casey Test','casey@local.authority.test','Parker Test','parker@local.authority.test','Synthetic account',deadline,array['receive_duplicate_statements','discuss_service_issues'],draft_key,version1);
  if replay->>'authority_record_id'<>before_id::text or replay->>'replayed'<>'true' then raise exception 'draft replay after publish failed'; end if;
  begin perform public.create_authority_draft_v2(org,'Casey Test','casey@local.authority.test','Parker Test','parker@local.authority.test','Synthetic account',deadline,array['receive_duplicate_statements','discuss_service_issues'],gen_random_uuid(),version1); raise exception 'stale form created draft'; exception when serialization_failure then null; end;
  begin perform public.create_authority_draft_v2(org,'Casey Test','casey@local.authority.test','Parker Test','parker@local.authority.test','Synthetic account',deadline,array['receive_duplicate_statements','discuss_service_issues'],draft_key,version2); raise exception 'draft replay changed version'; exception when invalid_parameter_value then null; end;
  if (select governing_snapshot from public.authority_records where id=before_id)<>saved then raise exception 'publication rewrote old draft'; end if;
  context:=public.get_authority_governing_context_v1(org,before_id);
  if context->>'stale'<>'true' then raise exception 'old draft not stale'; end if;
  begin update public.authority_records set status='awaiting_principal',activated_at=now() where id=before_id; raise exception 'stale draft activated'; exception when invalid_parameter_value then if sqlerrm<>'jurisdiction_draft_stale' then raise; end if; end;
  begin update public.authority_records set catalog_version_id=version2 where id=before_id; raise exception 'silent pin rewrite'; exception when object_not_in_prerequisite_state then null; end;
  result:=public.create_authority_draft_v2(org,'Casey New','new-casey@local.authority.test','Parker New','new-parker@local.authority.test','New account',deadline,array['discuss_service_issues','receive_duplicate_statements'],gen_random_uuid(),version2);
  after_id:=(result->>'authority_record_id')::uuid;
  if (select catalog_version_id from public.authority_records where id=after_id)<>version2 then raise exception 'new draft not using new version'; end if;
  perform public.rebase_authority_ny_draft_v1(org,before_id,1,context->>'current_hash',gen_random_uuid());
  if (select catalog_version_id from public.authority_records where id=before_id)<>version2 or not exists(select 1 from public.authority_events where authority_record_id=before_id and event_type='authority.draft_rules_rebased' and payload->'previous_snapshot'=saved and payload->'current_snapshot'=context->'current') then raise exception 'rebase missing prior/current pin history'; end if;
  if (select count(*) from public.authority_participant_invitations where organization_id=org)<>old_count then raise exception 'publish or rebase sent invitation'; end if;
  -- Activated record and receipt must retain the old version through future publications.
  update public.authority_records set status='awaiting_principal',activated_at=now() where id=before_id;
  insert into public.authority_participant_invitations(id,organization_id,authority_record_id,participant_role,email_normalized,invited_by,expires_at)
  values(invitation,org,before_id,'representative','parker@local.authority.test',actor,deadline);
  insert into public.authority_disclosures(organization_id,authority_record_id,invitation_id,record_version,text_version,disclosed_fields,acknowledged)
  values(org,before_id,invitation,1,'minimum-necessary-disclosure-2026.1',array['authority_scope'],true);
  insert into public.authority_institution_decisions(receipt_code,organization_id,authority_record_id,record_version,outcome,reason,decided_by,decided_by_role,accepted_action_keys,limitations,receipt_snapshot,receipt_sha256)
  values('POLICY-TEST-'||before_id::text,org,before_id,2,'accepted_with_limits','Synthetic only',actor,'owner',array['receive_duplicate_statements'],array['Statements only'],'{}',repeat('0',64));
  select receipt_snapshot,receipt_sha256 into decision_snapshot,decision_hash from public.authority_institution_decisions where authority_record_id=before_id;
  if decision_snapshot->'accepted_permissions_snapshot'->>'catalog_version_id'<>version2::text or decision_snapshot->'accepted_permissions_snapshot'->'items'->0->>'label'<>'Get copies of account statements' or decision_hash<>encode(extensions.digest(decision_snapshot::text,'sha256'),'hex') then raise exception 'receipt pin labels or fingerprint mismatch'; end if;
  perform public.publish_permission_catalog_v1(org,'financial_poa',version2,'Next synthetic version',gen_random_uuid());
  if (select governing_snapshot from public.authority_records where id=before_id)<>context->'current' or (select receipt_snapshot from public.authority_institution_decisions where authority_record_id=before_id)<>decision_snapshot then raise exception 'activated history changed'; end if;
  begin update public.organization_permission_items set label='Rewritten' where catalog_version_id=version2; raise exception 'published item edited'; exception when object_not_in_prerequisite_state then null; end;
  begin delete from public.organization_permission_items where catalog_version_id=version2; raise exception 'published item deleted'; exception when object_not_in_prerequisite_state then null; end;
  begin update public.organization_permission_catalog_versions set content_hash=repeat('a',64) where id=version2; raise exception 'published hash edited'; exception when object_not_in_prerequisite_state then null; end;
  begin truncate public.organization_permission_items; raise exception 'published items truncated'; exception when object_not_in_prerequisite_state then null; end;
  -- Stale unsent drafts can still be canceled without accepting the newer policy.
  update public.authority_records set status='canceled' where id=after_id;
  if (select catalog_version_id from public.authority_records where id=after_id)<>version2 then raise exception 'cancellation rewrote pin'; end if;
  if has_function_privilege('anon','public.publish_permission_catalog_v1(uuid,text,uuid,text,uuid)','execute') or has_function_privilege('anon','public.create_authority_draft_v2(uuid,text,text,text,text,text,timestamptz,text[],uuid,uuid)','execute') then raise exception 'anonymous write grant'; end if;
  raise exception using errcode='ZX001',message='rollback successful publication test';
 exception when sqlstate 'ZX001' then if sqlerrm<>'rollback successful publication test' then raise; end if;
 end;
 raise notice 'PASS publication, current/new draft binding, replay, tenant/role/MFA rejection, rebase history, cancellation, frozen receipt and immutability';
end $test$;


