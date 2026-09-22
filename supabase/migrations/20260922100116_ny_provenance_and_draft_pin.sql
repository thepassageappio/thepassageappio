-- Existing metadata is not evidence of the rules that governed old requests.
-- Do not rewrite any historical row, event, decision, or receipt.
alter table public.authority_records
  add column governing_snapshot jsonb,
  add column governing_provenance text not null default 'legacy_unverified'
    check(governing_provenance in ('legacy_unverified','captured_at_creation','explicit_draft_rebase'));

-- Configuration publication and snapshot capture share a transaction lock.
-- Publication UI is outside this fixed NY workflow; even privileged SQL must
-- create a new draft version rather than edit a published definition in place.
create function authority_private.lock_ny_configuration_write() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('passage.ny.configuration',0));
  return null;
end $$;
create trigger lock_ny_configuration before insert or update or delete on public.jurisdiction_packs
for each statement execute function authority_private.lock_ny_configuration_write();
create trigger lock_ny_configuration before insert or update or delete on public.jurisdiction_reason_codes
for each statement execute function authority_private.lock_ny_configuration_write();
create trigger lock_ny_configuration before insert or update or delete on public.organization_jurisdiction_pack_settings
for each statement execute function authority_private.lock_ny_configuration_write();
create trigger lock_ny_configuration before insert or update or delete on public.organization_template_selections
for each statement execute function authority_private.lock_ny_configuration_write();
revoke all on function authority_private.lock_ny_configuration_write() from public,anon,authenticated;

create function authority_private.guard_published_ny_definition() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='jurisdiction_packs' then
    if tg_op='INSERT' then
      if new.status<>'draft' then raise exception using errcode='55000',message='jurisdiction_publish_from_draft_required'; end if;
    elsif old.status<>'draft' then
      if tg_op='DELETE' then raise exception using errcode='55000',message='published_jurisdiction_is_immutable'; end if;
      if (to_jsonb(new)-'status'-'retired_at'-'updated_at') is distinct from (to_jsonb(old)-'status'-'retired_at'-'updated_at')
        or new.status not in ('active','retired') or (old.status='retired' and new.status<>'retired') then
        raise exception using errcode='55000',message='published_jurisdiction_is_immutable';
      end if;
    end if;
  else
    if tg_op<>'INSERT' and exists(select 1 from public.jurisdiction_packs where pack_key=old.pack_key and pack_version=old.pack_version and status<>'draft') then
      raise exception using errcode='55000',message='published_jurisdiction_is_immutable';
    end if;
    if tg_op<>'DELETE' and exists(select 1 from public.jurisdiction_packs where pack_key=new.pack_key and pack_version=new.pack_version and status<>'draft') then
      raise exception using errcode='55000',message='published_jurisdiction_is_immutable';
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger guard_published_definition before insert or update or delete on public.jurisdiction_packs
for each row execute function authority_private.guard_published_ny_definition();
create trigger guard_published_definition before insert or update or delete on public.jurisdiction_reason_codes
for each row execute function authority_private.guard_published_ny_definition();
revoke all on function authority_private.guard_published_ny_definition() from public,anon,authenticated;

create function authority_private.current_ny_governing_snapshot(p_organization_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare pack public.jurisdiction_packs%rowtype; settings public.organization_jurisdiction_pack_settings%rowtype; selection public.organization_template_selections%rowtype; reasons jsonb;
begin
  perform pg_advisory_xact_lock_shared(hashtextextended('passage.ny.configuration',0));
  select * into selection from public.organization_template_selections where organization_id=p_organization_id;
  if found and (selection.template_key<>'ny_financial_poa' or selection.template_version<>'2026.1') then
    raise exception using errcode='22023',message='jurisdiction_configuration_unavailable';
  end if;
  select * into settings from public.organization_jurisdiction_pack_settings where organization_id=p_organization_id;
  if found then
    select * into pack from public.jurisdiction_packs where pack_key=settings.pack_key and pack_version=settings.pack_version and status='active' and effective_at<=now();
  else
    select * into pack from public.jurisdiction_packs where pack_key='us_ny_financial_poa' and status='active' and effective_at<=now() order by effective_at desc,pack_version desc limit 1;
  end if;
  if pack.id is null or pack.jurisdiction_code<>'US-NY' then raise exception using errcode='22023',message='jurisdiction_configuration_unavailable'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('code',code,'theme',theme,'label',label,'description',description,'severity',severity,'institution_overlay',is_fi_overlay,'warn_if_sole_refusal',warn_if_sole_refusal) order by code),'[]'::jsonb)
    into reasons from public.jurisdiction_reason_codes where pack_key=pack.pack_key and pack_version=pack.pack_version and status='active';
  return jsonb_build_object('schema_version',1,'template_key','ny_financial_poa','template_version','2026.1',
    'jurisdiction_code',pack.jurisdiction_code,'pack_key',pack.pack_key,'pack_version',pack.pack_version,'display_name',pack.display_name,'effective_at',pack.effective_at,
    'source_citation',pack.source_citation,'notes',pack.notes,'default_form_class',pack.default_form_class,
    'initial_business_days',coalesce(settings.timer_initial_business_days,pack.default_timer_initial_business_days),
    'followup_business_days',coalesce(settings.timer_followup_business_days,pack.default_timer_followup_business_days),
    'reason_codes',reasons,'supported_actions',jsonb_build_array('discuss_service_issues','receive_duplicate_statements'),
    'required_evidence',jsonb_build_array('power_of_attorney','identity_evidence','representative_certification'),
    'principal_confirmation_required',true);
end $$;
revoke all on function authority_private.current_ny_governing_snapshot(uuid) from public,anon,authenticated;

create function authority_private.guard_ny_governing_snapshot() returns trigger
language plpgsql security definer set search_path='' as $$
declare current_snapshot jsonb;
begin
  if tg_op='INSERT' then
    if new.template_key<>'ny_financial_poa' then return new; end if;
    new.governing_snapshot:=authority_private.current_ny_governing_snapshot(new.organization_id);
    if new.template_version<>new.governing_snapshot->>'template_version' then raise exception using errcode='22023',message='jurisdiction_configuration_unavailable'; end if;
    new.governing_provenance:='captured_at_creation';
    new.jurisdiction_code:=new.governing_snapshot->>'jurisdiction_code';
    new.jurisdiction_pack_key:=new.governing_snapshot->>'pack_key';
    new.jurisdiction_pack_version:=new.governing_snapshot->>'pack_version';
    new.form_class:=coalesce(new.form_class,new.governing_snapshot->>'default_form_class');
    new.timer_initial_business_days:=(new.governing_snapshot->>'initial_business_days')::integer;
    new.timer_followup_business_days:=(new.governing_snapshot->>'followup_business_days')::integer;
    return new;
  end if;
  if row(new.governing_snapshot,new.governing_provenance,new.jurisdiction_code,new.jurisdiction_pack_key,new.jurisdiction_pack_version,new.timer_initial_business_days,new.timer_followup_business_days,new.template_key,new.template_version)
    is distinct from row(old.governing_snapshot,old.governing_provenance,old.jurisdiction_code,old.jurisdiction_pack_key,old.jurisdiction_pack_version,old.timer_initial_business_days,old.timer_followup_business_days,old.template_key,old.template_version) then
    if old.status<>'draft' or current_setting('passage.ny_rebase_record',true) is distinct from old.id::text then
      raise exception using errcode='55000',message='governing_snapshot_is_locked';
    end if;
  end if;
  if old.status='draft' and new.status<>'draft' and new.template_key='ny_financial_poa' then
    current_snapshot:=authority_private.current_ny_governing_snapshot(new.organization_id);
    if new.governing_snapshot is distinct from current_snapshot then
      raise exception using errcode='22023',message='jurisdiction_draft_stale';
    end if;
  end if;
  return new;
end $$;
create trigger authority_records_governing_snapshot before insert or update on public.authority_records
for each row execute function authority_private.guard_ny_governing_snapshot();
revoke all on function authority_private.guard_ny_governing_snapshot() from public,anon,authenticated;

create function public.get_authority_governing_context_v1(p_organization_id uuid,p_authority_record_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare rec public.authority_records%rowtype; current_snapshot jsonb;
begin
  if not exists(select 1 from public.organization_memberships where organization_id=p_organization_id and user_id=auth.uid() and status='active') then
    raise exception using errcode='42501',message='authority_request_not_found';
  end if;
  select * into rec from public.authority_records where id=p_authority_record_id and organization_id=p_organization_id;
  if not found then raise exception using errcode='P0002',message='authority_request_not_found'; end if;
  if rec.status='draft' and rec.template_key='ny_financial_poa' then
    current_snapshot:=authority_private.current_ny_governing_snapshot(p_organization_id);
  end if;
  return jsonb_build_object('saved',rec.governing_snapshot,'provenance',rec.governing_provenance,'current',current_snapshot,
    'stale',rec.status='draft' and rec.template_key='ny_financial_poa' and rec.governing_snapshot is distinct from current_snapshot,
    'current_hash',case when current_snapshot is null then null else encode(extensions.digest(current_snapshot::text,'sha256'),'hex') end);
end $$;
revoke all on function public.get_authority_governing_context_v1(uuid,uuid) from public,anon;
grant execute on function public.get_authority_governing_context_v1(uuid,uuid) to authenticated;

create function public.rebase_authority_ny_draft_v1(p_organization_id uuid,p_authority_record_id uuid,p_expected_version bigint,p_current_hash text,p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=authority_private.current_actor_id(); actor_role text; rec public.authority_records%rowtype; current_snapshot jsonb; prior_snapshot jsonb; prior_mode text; existing authority_private.command_receipts%rowtype; fingerprint text; result jsonb; seq bigint;
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  actor_role:=authority_private.assert_authority_record_operator(p_organization_id);
  if actor_role not in ('owner','admin','staff') then raise exception using errcode='42501',message='authority_request_creation_not_allowed'; end if;
  if p_idempotency_key is null or p_expected_version is null or p_current_hash is null then raise exception using errcode='22023',message='draft_update_input_invalid'; end if;
  fingerprint:=authority_private.payload_hash(jsonb_build_object('organization_id',p_organization_id,'record_id',p_authority_record_id,'expected_version',p_expected_version,'current_hash',p_current_hash));
  perform pg_advisory_xact_lock(hashtextextended(actor::text||':rebase_authority_ny_draft:'||p_idempotency_key::text,0));
  select * into existing from authority_private.command_receipts where actor_user_id=actor and command_name='rebase_authority_ny_draft' and idempotency_key=p_idempotency_key;
  if found then
    if existing.payload_hash<>fingerprint then raise exception using errcode='22023',message='idempotency_payload_mismatch'; end if;
    return existing.result||jsonb_build_object('replayed',true);
  end if;
  select * into rec from public.authority_records where id=p_authority_record_id and organization_id=p_organization_id for update;
  if not found then raise exception using errcode='P0002',message='authority_request_not_found'; end if;
  if rec.status<>'draft' or rec.template_key<>'ny_financial_poa' then raise exception using errcode='22023',message='draft_update_not_available'; end if;
  if rec.version<>p_expected_version then raise exception using errcode='40001',message='request_changed'; end if;
  current_snapshot:=authority_private.current_ny_governing_snapshot(p_organization_id);
  if encode(extensions.digest(current_snapshot::text,'sha256'),'hex')<>p_current_hash then raise exception using errcode='40001',message='jurisdiction_draft_changed'; end if;
  if not rec.allowed_action_keys <@ array(select jsonb_array_elements_text(current_snapshot->'supported_actions')) then raise exception using errcode='22023',message='jurisdiction_configuration_unavailable'; end if;
  prior_snapshot:=rec.governing_snapshot;
  if prior_snapshot is not distinct from current_snapshot then
    result:=jsonb_build_object('authority_record_id',rec.id,'version',rec.version,'unchanged',true);
    insert into authority_private.command_receipts(actor_user_id,command_name,idempotency_key,payload_hash,result)
    values(actor,'rebase_authority_ny_draft',p_idempotency_key,fingerprint,result);
    return result||jsonb_build_object('replayed',false);
  end if;
  prior_mode:=current_setting('passage.ny_rebase_record',true);
  perform set_config('passage.ny_rebase_record',rec.id::text,true);
  update public.authority_records set governing_snapshot=current_snapshot,governing_provenance='explicit_draft_rebase',
    jurisdiction_code=current_snapshot->>'jurisdiction_code',jurisdiction_pack_key=current_snapshot->>'pack_key',jurisdiction_pack_version=current_snapshot->>'pack_version',
    template_key=current_snapshot->>'template_key',template_version=current_snapshot->>'template_version',
    timer_initial_business_days=(current_snapshot->>'initial_business_days')::integer,timer_followup_business_days=(current_snapshot->>'followup_business_days')::integer,
    version=version+1,updated_at=now() where id=rec.id returning * into rec;
  perform set_config('passage.ny_rebase_record',coalesce(prior_mode,''),true);
  select coalesce(max(sequence),0)+1 into seq from public.authority_events where authority_record_id=rec.id;
  insert into public.authority_events(organization_id,authority_record_id,sequence,record_version,event_type,actor_user_id,actor_role,summary,detail,audience,payload)
  values(p_organization_id,rec.id,seq,rec.version,'authority.draft_rules_rebased',actor,actor_role,'Draft rules reviewed and updated','The prior draft rules remain in the saved history. Nothing was sent.',array['owner','admin','staff','reviewer','auditor'],jsonb_build_object('previous_snapshot',prior_snapshot,'current_snapshot',current_snapshot));
  insert into public.organization_audit_events(organization_id,actor_user_id,event_type,subject_type,subject_id,payload)
  values(p_organization_id,actor,'authority.draft_rules_rebased','authority_record',rec.id,jsonb_build_object('version',rec.version,'previous_snapshot',prior_snapshot,'current_snapshot',current_snapshot));
  result:=jsonb_build_object('authority_record_id',rec.id,'version',rec.version);
  insert into authority_private.command_receipts(actor_user_id,command_name,idempotency_key,payload_hash,result)
  values(actor,'rebase_authority_ny_draft',p_idempotency_key,fingerprint,result);
  return result||jsonb_build_object('replayed',false);
end $$;
revoke all on function public.rebase_authority_ny_draft_v1(uuid,uuid,bigint,text,uuid) from public,anon;
grant execute on function public.rebase_authority_ny_draft_v1(uuid,uuid,bigint,text,uuid) to authenticated;

-- Freeze provenance on future decisions; existing receipt bodies/hashes are untouched.
create function authority_private.freeze_ny_decision_snapshot() returns trigger
language plpgsql security definer set search_path='' as $$
declare rec public.authority_records%rowtype;
begin
  select * into rec from public.authority_records where id=new.authority_record_id;
  if rec.template_key='ny_financial_poa' then
    new.receipt_snapshot:=new.receipt_snapshot||jsonb_build_object('governing_snapshot',rec.governing_snapshot,'governing_provenance',rec.governing_provenance,'governing_form_class',rec.form_class);
    new.receipt_sha256:=encode(extensions.digest(new.receipt_snapshot::text,'sha256'),'hex');
  end if;
  return new;
end $$;
create trigger zz_freeze_ny_decision_snapshot before insert on public.authority_institution_decisions
for each row execute function authority_private.freeze_ny_decision_snapshot();
revoke all on function authority_private.freeze_ny_decision_snapshot() from public,anon,authenticated;
