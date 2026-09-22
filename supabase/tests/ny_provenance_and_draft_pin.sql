-- Synthetic transaction: leaves no users, requests, settings or messages behind.
DO $test$
declare actor uuid:=gen_random_uuid(); org uuid:=gen_random_uuid(); rec uuid:=gen_random_uuid(); inv uuid:=gen_random_uuid();
  snap jsonb; context jsonb; result jsonb; replay jsonb; key uuid:=gen_random_uuid(); count_before bigint;
begin
 begin
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at) values(actor,actor::text||'@local.authority.test',now(),now(),now());
  insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status)
  values(org,'NY Snapshot Test Bank','NY Snapshot Test Bank','regional_bank','1 Sample Way','Albany','NY','12207',actor,'ready');
  insert into public.organization_memberships(organization_id,user_id,email_normalized,display_name,role)
  values(org,actor,actor::text||'@local.authority.test','Synthetic Owner','owner');
  insert into public.authority_records(id,organization_id,created_by,status,template_key,template_version,account_boundary,principal_name,principal_email_normalized,representative_name,representative_email_normalized,allowed_action_keys,valid_until)
  values(rec,org,actor,'draft','ny_financial_poa','2026.1','Synthetic account','Casey','casey@local.authority.test','Parker','parker@local.authority.test',array['receive_duplicate_statements'],now()+interval '30 days');
  select governing_snapshot into snap from public.authority_records where id=rec;
  if snap is null or not snap ? 'reason_codes' then raise exception 'new draft missing governing snapshot'; end if;
  begin update public.jurisdiction_packs set display_name='Changed old label' where pack_key=snap->>'pack_key' and pack_version=snap->>'pack_version'; raise exception 'published pack editable';
  exception when object_not_in_prerequisite_state then if sqlerrm<>'published_jurisdiction_is_immutable' then raise; end if; end;
  begin update public.jurisdiction_reason_codes set label='Changed old reason' where pack_key=snap->>'pack_key' and pack_version=snap->>'pack_version'; raise exception 'published reason editable';
  exception when object_not_in_prerequisite_state then if sqlerrm<>'published_jurisdiction_is_immutable' then raise; end if; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal2','role','authenticated')::text,true);
  context:=public.get_authority_governing_context_v1(org,rec);
  if (context->>'stale')::boolean then raise exception 'fresh draft stale'; end if;
  insert into public.organization_jurisdiction_pack_settings(organization_id,pack_key,pack_version,timer_initial_business_days,timer_followup_business_days,updated_by)
  values(org,snap->>'pack_key',snap->>'pack_version',(snap->>'initial_business_days')::int+1,(snap->>'followup_business_days')::int,actor);
  context:=public.get_authority_governing_context_v1(org,rec);
  if not (context->>'stale')::boolean or context->'saved'<>snap then raise exception 'settings silently changed draft'; end if;
  begin update public.authority_records set status='awaiting_principal',activated_at=now() where id=rec; raise exception 'stale activation accepted';
  exception when invalid_parameter_value then if sqlerrm<>'jurisdiction_draft_stale' then raise; end if; end;
  begin perform public.rebase_authority_ny_draft_v1(org,rec,1,repeat('0',64),key); raise exception 'changed configuration accepted';
  exception when serialization_failure then if sqlerrm<>'jurisdiction_draft_changed' then raise; end if; end;
  begin perform public.rebase_authority_ny_draft_v1(org,rec,2,context->>'current_hash',key); raise exception 'stale version accepted';
  exception when serialization_failure then if sqlerrm<>'request_changed' then raise; end if; end;
  update public.organization_memberships set role='reviewer' where organization_id=org;
  begin perform public.rebase_authority_ny_draft_v1(org,rec,1,context->>'current_hash',key); raise exception 'reviewer rebase accepted';
  exception when insufficient_privilege then null; end;
  update public.organization_memberships set role='owner' where organization_id=org;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal1')::text,true);
  begin perform public.rebase_authority_ny_draft_v1(org,rec,1,context->>'current_hash',key); raise exception 'owner without MFA accepted';
  exception when insufficient_privilege then if sqlerrm<>'mfa_verification_required' then raise; end if; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'aal','aal2')::text,true);
  begin perform public.get_authority_governing_context_v1(gen_random_uuid(),rec); raise exception 'other tenant read accepted';
  exception when insufficient_privilege then null; end;
  result:=public.rebase_authority_ny_draft_v1(org,rec,1,context->>'current_hash',key);
  replay:=public.rebase_authority_ny_draft_v1(org,rec,1,context->>'current_hash',key);
  if result->>'version'<>'2' or not (replay->>'replayed')::boolean then raise exception 'revision or replay mismatch'; end if;
  select count(*) into count_before from public.authority_events where authority_record_id=rec and event_type='authority.draft_rules_rebased' and payload->'previous_snapshot'=snap and payload->'current_snapshot'=context->'current';
  if count_before<>1 then raise exception 'prior snapshot or single event missing'; end if;
  if exists(select 1 from public.authority_participant_invitations where authority_record_id=rec) then raise exception 'rebase sent invitations'; end if;
  update public.authority_records set status='awaiting_principal',activated_at=now() where id=rec;
  begin update public.authority_records set governing_snapshot='{}' where id=rec; raise exception 'activated snapshot editable';
  exception when object_not_in_prerequisite_state then if sqlerrm<>'governing_snapshot_is_locked' then raise; end if; end;
  update public.organization_jurisdiction_pack_settings set timer_initial_business_days=timer_initial_business_days+1 where organization_id=org;
  if (select governing_snapshot from public.authority_records where id=rec)<>context->'current' then raise exception 'activated history changed'; end if;
  insert into public.authority_participant_invitations(id,organization_id,authority_record_id,participant_role,email_normalized,invited_by,expires_at)
  values(inv,org,rec,'representative','parker@local.authority.test',actor,now()+interval '3 days');
  insert into public.authority_disclosures(organization_id,authority_record_id,invitation_id,record_version,text_version,disclosed_fields,acknowledged)
  values(org,rec,inv,1,'minimum-necessary-disclosure-2026.1',array['authority_scope'],true);
  insert into public.authority_institution_decisions(receipt_code,organization_id,authority_record_id,record_version,outcome,reason,decided_by,decided_by_role,receipt_snapshot,receipt_sha256)
  values('NY-TEST-'||rec::text,org,rec,2,'rejected','Synthetic test only',actor,'owner','{}',repeat('0',64));
  if not exists(select 1 from public.authority_institution_decisions where authority_record_id=rec
    and receipt_snapshot->'governing_snapshot'=context->'current'
    and receipt_snapshot->>'governing_provenance'='explicit_draft_rebase'
    and receipt_snapshot ? 'governing_form_class'
    and receipt_sha256=encode(extensions.digest(receipt_snapshot::text,'sha256'),'hex')) then raise exception 'decision snapshot or hash mismatch'; end if;
  if has_function_privilege('anon','public.rebase_authority_ny_draft_v1(uuid,uuid,bigint,text,uuid)','execute') then raise exception 'anonymous rebase ACL'; end if;
  raise exception using errcode='ZX001',message='rollback successful test';
 exception when sqlstate 'ZX001' then null;
 end;
 raise notice 'NY snapshot, stale activation, explicit revision, history, idempotency, tenant, role and MFA checks passed';
end $test$;
