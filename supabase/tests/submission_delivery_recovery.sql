begin;
insert into auth.users(id,email) values('12000000-0000-4000-8000-000000000010','recovery-owner@example.invalid');
insert into public.organizations(id,legal_name,display_name,organization_type,address_line_1,locality,region,postal_code,created_by,onboarding_status)
values('22000000-0000-4000-8000-000000000010','Recovery Test Bank','Recovery Test Bank','regional_bank','1 Test Way','Albany','NY','12207','12000000-0000-4000-8000-000000000010','ready');
insert into public.organization_template_selections(organization_id,template_key,template_version,selected_by)
values('22000000-0000-4000-8000-000000000010','ny_financial_poa','2026.1','12000000-0000-4000-8000-000000000010');

do $$
declare started jsonb; verified jsonb; gid uuid; result jsonb; first_job jsonb; second_job jsonb; reclaimed jsonb; key uuid:=gen_random_uuid();
begin
  started:=public.start_submission_group_v1('Synthetic Requester','recovery@example.invalid','other',gen_random_uuid());
  verified:=public.verify_requester_email_v1(started->>'verification_token',gen_random_uuid());
  gid:=(started->>'group_id')::uuid;
  update public.authority_submission_groups set principal_name='Synthetic Principal',principal_email_normalized='principal@example.invalid',
    representative_name='Synthetic Rep',representative_email_normalized='rep@example.invalid',principal_confirmation_available=true where id=gid;
  insert into public.authority_submission_group_targets(group_id,ordinal,organization_id,target_label,target_institution_type,match_status)
  values(gid,1,'22000000-0000-4000-8000-000000000010','Recovery Test Bank','regional_bank','matched'),(gid,2,null,'Unmatched Test Bank','regional_bank','unmatched');
  insert into public.authority_submission_group_evidence(group_id,requirement_key,storage_path,original_filename,media_type,byte_size,sha256_hex)
  values(gid,'power_of_attorney',gid||'/poa.pdf','synthetic.pdf','application/pdf',1,repeat('a',64)),
        (gid,'identity_evidence',gid||'/id.pdf','synthetic-id.pdf','application/pdf',1,repeat('b',64));
  result:=public.submit_submission_group_with_delivery_v1(verified->>'session_token',gid,2,'requester-attestation-2026-09-13',key);
  if current_setting('passage.submission_delivery_mode',true)='queued' then raise exception 'Queue mode leaked into legacy commands'; end if;
  if (select count(*) from authority_private.submission_delivery_jobs where group_id=gid) <> 4 then raise exception 'Atomic delivery plan missing'; end if;
  perform public.submit_submission_group_with_delivery_v1(verified->>'session_token',gid,2,'requester-attestation-2026-09-13',key);
  if (select count(*) from authority_private.submission_delivery_jobs where group_id=gid) <> 4 then raise exception 'Replay duplicated work'; end if;
  if (select count(*) from public.authority_records where origin_group_id=gid) <> 1 then raise exception 'Replay duplicated case'; end if;
  first_job:=public.claim_submission_delivery_v1(gid);
  second_job:=public.claim_submission_delivery_v1(gid);
  if first_job->>'kind'<>'copy' or second_job->>'kind'<>'copy' or first_job->>'id'=second_job->>'id' then raise exception 'Lease isolation failed'; end if;
  if public.claim_submission_delivery_v1(gid) is not null then raise exception 'Invitation bypassed copy dependency'; end if;
  perform public.finish_submission_delivery_v1((first_job->>'id')::uuid,(first_job->>'lease_token')::uuid,false,'storage_unavailable',null);
  if public.claim_submission_delivery_v1(gid) is not null then raise exception 'Backoff ignored'; end if;
  update authority_private.submission_delivery_jobs set next_attempt_at=now()-interval '1 minute' where id=(first_job->>'id')::uuid;
  reclaimed:=public.claim_submission_delivery_v1(gid);
  begin
    perform public.finish_submission_delivery_v1((first_job->>'id')::uuid,(first_job->>'lease_token')::uuid,true,null,null);
    raise exception 'Stale worker acknowledged work';
  exception when serialization_failure then null; end;
  perform public.finish_submission_delivery_v1((reclaimed->>'id')::uuid,(reclaimed->>'lease_token')::uuid,true,null,null);
  perform public.finish_submission_delivery_v1((second_job->>'id')::uuid,(second_job->>'lease_token')::uuid,true,null,null);
  first_job:=public.claim_submission_delivery_v1(gid);
  if first_job->>'kind'<>'invitation' or length(first_job->'payload'->>'token')<>64 then raise exception 'Invitation payload missing'; end if;
  perform public.finish_submission_delivery_v1((first_job->>'id')::uuid,(first_job->>'lease_token')::uuid,true,null,'synthetic-provider-id');
  second_job:=public.claim_submission_delivery_v1(gid);
  if second_job->>'id'=first_job->>'id' then raise exception 'Completed invitation repeated'; end if;
  -- A crashed worker's lease is recoverable, but not acknowledgeable by its old owner.
  update authority_private.submission_delivery_jobs set lease_until=now()-interval '1 minute' where id=(second_job->>'id')::uuid;
  reclaimed:=public.claim_submission_delivery_v1(gid);
  if reclaimed->>'id' <> second_job->>'id' or reclaimed->>'lease_token'=second_job->>'lease_token' then raise exception 'Expired lease did not recover'; end if;
  perform public.finish_submission_delivery_v1((reclaimed->>'id')::uuid,(reclaimed->>'lease_token')::uuid,false,'provider_rejected',null);
  -- An uncertain send must not retry outside the provider's deduplication window.
  insert into authority_private.submission_delivery_events(job_id,attempt,event_type,occurred_at)
    values((second_job->>'id')::uuid,1,'started',now()-interval '24 hours');
  update authority_private.submission_delivery_jobs set next_attempt_at=now()-interval '1 minute' where id=(second_job->>'id')::uuid;
  perform public.claim_submission_delivery_v1(gid);
  if (select last_error from authority_private.submission_delivery_jobs where id=(second_job->>'id')::uuid)<>'delivery_confirmation_required' then raise exception 'Old uncertain invitation retried'; end if;
  update authority_private.submission_delivery_jobs set status='pending' where id=(second_job->>'id')::uuid;
  update authority_private.submission_delivery_jobs set attempts=5,next_attempt_at=now()-interval '1 minute' where id=(second_job->>'id')::uuid;
  perform public.claim_submission_delivery_v1(gid);
  if (select status from authority_private.submission_delivery_jobs where id=(second_job->>'id')::uuid)<>'needs_attention' then raise exception 'Unbounded retries'; end if;
  result:=public.get_submission_delivery_status_v1(verified->>'session_token',gid);
  if (result->>'completed')::int<>3 or (result->>'needs_attention')::int<>1 or result::text like '%token%' then raise exception 'Unsafe or incorrect status'; end if;
  begin
    perform public.get_submission_delivery_status_v1(repeat('0',64),gid);
    raise exception 'Invalid requester session exposed status';
  exception when no_data_found then null; end;
  started:=public.start_submission_group_v1('Other Requester','other-recovery@example.invalid','other',gen_random_uuid());
  begin
    perform public.get_submission_delivery_status_v1(verified->>'session_token',(started->>'group_id')::uuid);
    raise exception 'Unrelated requester session exposed status';
  exception when no_data_found then null; end;
  begin
    update authority_private.submission_delivery_events set detail='rewritten';
    raise exception 'Delivery history mutable';
  exception when raise_exception then if sqlerrm<>'delivery_events_are_append_only' then raise; end if; end;
  if has_function_privilege('anon','public.claim_submission_delivery_v1(uuid)','EXECUTE') or has_function_privilege('authenticated','public.finish_submission_delivery_v1(uuid,uuid,boolean,text,text)','EXECUTE') or has_function_privilege('anon','public.submit_submission_group_with_delivery_v1(text,uuid,bigint,text,uuid)','EXECUTE') then raise exception 'Worker exposed to browser'; end if;
end $$;
-- A still-running old application must not create queue work and also send inline.
do $$
declare started jsonb; verified jsonb; gid uuid;
begin
  started:=public.start_submission_group_v1('Legacy Requester','legacy-recovery@example.invalid','other',gen_random_uuid());
  verified:=public.verify_requester_email_v1(started->>'verification_token',gen_random_uuid());
  gid:=(started->>'group_id')::uuid;
  update public.authority_submission_groups set principal_name='Synthetic Principal',principal_email_normalized='principal@example.invalid',representative_name='Synthetic Rep',representative_email_normalized='rep@example.invalid',principal_confirmation_available=true where id=gid;
  insert into public.authority_submission_group_targets(group_id,ordinal,organization_id,target_label,target_institution_type,match_status)
    values(gid,1,'22000000-0000-4000-8000-000000000010','Recovery Test Bank','regional_bank','matched'),(gid,2,null,'Legacy Unmatched Bank','regional_bank','unmatched');
  insert into public.authority_submission_group_evidence(group_id,requirement_key,storage_path,original_filename,media_type,byte_size,sha256_hex)
    values(gid,'power_of_attorney',gid||'/poa.pdf','synthetic.pdf','application/pdf',1,repeat('a',64)),(gid,'identity_evidence',gid||'/id.pdf','synthetic-id.pdf','application/pdf',1,repeat('b',64));
  perform public.submit_submission_group_v1(verified->>'session_token',gid,2,'requester-attestation-2026-09-13',gen_random_uuid());
  if exists(select 1 from authority_private.submission_delivery_jobs where group_id=gid) then raise exception 'Legacy inline sender also queued invitations'; end if;
  if (select count(*) from public.authority_records where origin_group_id=gid)<>1 then raise exception 'Legacy handover lost request'; end if;
end $$;
select 'submission delivery recovery: PASS' as result;
rollback;
