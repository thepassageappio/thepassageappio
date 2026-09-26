-- Track B1: publish / "Save for new requests" for org permission sets (#129).
-- Scoped PER AUTHORITY KIND (Steve lock): publish + offered list are for one
-- authority_type_key at a time. This migration wires financial_poa only.
-- Death / vehicle / other kinds stay pack_ready=false and are never published here.
-- UI copy must never say "catalog" — use "What people may ask for" / "Save for new requests".
-- Fixed NY financial POA actions only. Creation, activation and explicit rebase
-- share the publication lock. Existing requests and receipts are not backfilled.

-- ---------------------------------------------------------------------------
-- 1. Read published offered set for a kind (members)
-- ---------------------------------------------------------------------------

create or replace function authority_private.get_published_permission_catalog_v1(
  p_organization_id uuid,
  p_authority_type_key text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_version public.organization_permission_catalog_versions%rowtype;
  v_items jsonb;
  v_pack_ready boolean;
begin
  if p_organization_id is null or nullif(btrim(p_authority_type_key), '') is null then
    raise exception using errcode = '22023', message = 'permission_publish_input_invalid';
  end if;

  if not authority_private.has_active_membership(p_organization_id) then
    raise exception using errcode = '42501', message = 'permission_catalog_read_not_allowed';
  end if;

  if p_authority_type_key <> 'financial_poa' then
    raise exception using errcode='42501', message='authority_type_publish_not_enabled';
  end if;
  select atd.pack_ready
  into v_pack_ready
  from public.authority_type_defs atd
  where atd.key = p_authority_type_key
    and atd.retired_at is null and atd.effective_at <= now()
  order by atd.effective_at desc
  limit 1;

  if not found then
    raise exception using errcode = '22023', message = 'authority_type_not_available';
  end if;
  if v_pack_ready is not true then
    raise exception using errcode='42501', message='authority_type_not_pack_ready';
  end if;

  select *
  into v_version
  from public.organization_permission_catalog_versions v
  where v.organization_id = p_organization_id
    and v.authority_type_key = p_authority_type_key
    and v.state = 'published'
  limit 1;

  if not found then
    return jsonb_build_object(
      'organization_id', p_organization_id,
      'authority_type_key', p_authority_type_key,
      'pack_ready', v_pack_ready,
      'published', null,
      'items', '[]'::jsonb
    );
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'permission_key', i.permission_key,
      'kind', i.kind,
      'source', i.source,
      'offered', i.offered,
      'label', i.label,
      'help', i.help,
      'group_key', i.group_key,
      'risk_tier', i.risk_tier,
      'availability', i.availability,
      'label_version', i.label_version
    )
    order by i.kind, i.group_key, i.permission_key
  ), '[]'::jsonb)
  into v_items
  from public.organization_permission_items i
  where i.catalog_version_id = v_version.id
    and i.offered = true
    and i.availability = 'production';

  return jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_type_key', p_authority_type_key,
    'pack_ready', v_pack_ready,
    'published', jsonb_build_object(
      'id', v_version.id,
      'version', v_version.version,
      'content_hash', v_version.content_hash,
      'platform_semantic_version', v_version.platform_semantic_version,
      'jurisdiction_package_key', v_version.jurisdiction_package_key,
      'jurisdiction_package_version', v_version.jurisdiction_package_version,
      'published_at', v_version.published_at,
      'published_by', v_version.published_by,
      'publish_reason', v_version.publish_reason
    ),
    'items', v_items
  );
end;
$$;

create or replace function public.get_published_permission_catalog_v1(
  p_organization_id uuid,
  p_authority_type_key text
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select authority_private.get_published_permission_catalog_v1(
    p_organization_id, p_authority_type_key
  );
$$;

revoke execute on function authority_private.get_published_permission_catalog_v1(uuid, text)
  from public, anon, authenticated;
revoke execute on function public.get_published_permission_catalog_v1(uuid, text)
  from public, anon, authenticated;
grant execute on function authority_private.get_published_permission_catalog_v1(uuid, text) to authenticated;
grant execute on function public.get_published_permission_catalog_v1(uuid, text) to authenticated;

comment on function public.get_published_permission_catalog_v1(uuid, text) is
  'Returns the published offered permission set for one org + authority kind. Track B1: call with financial_poa only.';

-- Complete ordered content, including fields that do not appear in the form.
create function authority_private.permission_catalog_items_v1(p_version uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
   'key',i.permission_key,'kind',i.kind,'source',i.source,'offered',i.offered,
   'label',i.label,'help',i.help,'label_version',i.label_version,
   'group_key',i.group_key,'risk_tier',i.risk_tier,'availability',i.availability,
   'account_product_scope',i.account_product_scope,
   'platform_permission_def_id',i.platform_permission_def_id) order by i.permission_key),'[]'::jsonb)
 from public.organization_permission_items i where i.catalog_version_id=p_version;
$$;
revoke all on function authority_private.permission_catalog_items_v1(uuid) from public,anon,authenticated;

-- Existing orgs retain their original starter; new orgs get the same fixed list.
create function authority_private.ensure_financial_permission_starter_v1(p_org uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_hash text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_org::text||':publish_permission_catalog:financial_poa',0));
 if exists(select 1 from public.organization_permission_catalog_versions where organization_id=p_org and authority_type_key='financial_poa' and state='published') then return; end if;
 insert into public.organization_authority_type_offers(organization_id,authority_type_key,offered)
 values(p_org,'financial_poa',true) on conflict do nothing;
 insert into public.organization_permission_catalog_versions(organization_id,authority_type_key,version,state,content_hash,platform_semantic_version,publish_reason)
 values(p_org,'financial_poa','starter-'||gen_random_uuid()::text,'draft',repeat('0',64),'2026.9.15.1','Fixed NY starter') returning id into v_id;
 insert into public.organization_permission_items(catalog_version_id,organization_id,source,permission_key,kind,offered,label,help,group_key,risk_tier,availability,platform_permission_def_id,label_version)
 select v_id,p_org,'platform',key,kind,true,default_label,default_help,group_key,risk_tier,availability,id,1
 from public.permission_defs where authority_type_key='financial_poa' and semantic_version='2026.9.15.1'
 and key in ('receive_duplicate_statements','discuss_service_issues');
 v_hash:=encode(extensions.digest(authority_private.permission_catalog_items_v1(v_id)::text,'sha256'),'hex');
 perform set_config('passage.permission_publish_org',p_org::text,true);
 update public.organization_permission_catalog_versions set state='published',content_hash=v_hash,published_at=now() where id=v_id;
 perform set_config('passage.permission_publish_org','',true);
end $$;
revoke all on function authority_private.ensure_financial_permission_starter_v1(uuid) from public,anon,authenticated;
select authority_private.ensure_financial_permission_starter_v1(id) from public.organizations;
create function authority_private.seed_financial_permission_starter_trg()
returns trigger language plpgsql security definer set search_path='' as $$
begin perform authority_private.ensure_financial_permission_starter_v1(new.id); return new; end $$;
revoke all on function authority_private.seed_financial_permission_starter_trg() from public,anon,authenticated;
create trigger organization_permission_starter after insert on public.organizations
for each row execute function authority_private.seed_financial_permission_starter_trg();

-- Published items and metadata cannot be rewritten even through service writes.
create function authority_private.guard_permission_catalog_v1()
returns trigger language plpgsql security definer set search_path='' as $$
declare v public.organization_permission_catalog_versions%rowtype;
begin
 if tg_op='TRUNCATE' or tg_op='DELETE' then raise exception using errcode='55000',message='published_permissions_are_immutable'; end if;
 if tg_table_name='organization_permission_catalog_versions' then
   if tg_op='INSERT' and new.state='draft' then return new; end if;
   if tg_op='UPDATE' and current_setting('passage.permission_publish_org',true)=old.organization_id::text then
     if old.state='published' and new.state='superseded' and (to_jsonb(old)-'state')=(to_jsonb(new)-'state') then return new; end if;
     if old.state='draft' and new.state='published' and
       (to_jsonb(old)-array['state','content_hash','published_at','published_by'])=(to_jsonb(new)-array['state','content_hash','published_at','published_by']) then return new; end if;
   end if;
 else
   select * into v from public.organization_permission_catalog_versions where id=new.catalog_version_id;
   if tg_op='INSERT' and v.state='draft' and v.organization_id=new.organization_id then return new; end if;
 end if;
 raise exception using errcode='55000',message='published_permissions_are_immutable';
end $$;
revoke all on function authority_private.guard_permission_catalog_v1() from public,anon,authenticated;
create trigger permission_versions_immutable before insert or update or delete on public.organization_permission_catalog_versions for each row execute function authority_private.guard_permission_catalog_v1();
create trigger permission_versions_no_truncate before truncate on public.organization_permission_catalog_versions for each statement execute function authority_private.guard_permission_catalog_v1();
create trigger permission_items_immutable before insert or update or delete on public.organization_permission_items for each row execute function authority_private.guard_permission_catalog_v1();
create trigger permission_items_no_truncate before truncate on public.organization_permission_items for each statement execute function authority_private.guard_permission_catalog_v1();

create function public.publish_permission_catalog_v1(p_organization_id uuid,p_authority_type_key text,p_expected_published_version_id uuid,p_publish_reason text,p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=authority_private.current_actor_id(); old_version public.organization_permission_catalog_versions%rowtype;
 new_id uuid; items jsonb; payload_hash text; prior_mode text; result jsonb; receipt authority_private.command_receipts%rowtype;
begin
 perform authority_private.require_privileged_mfa_v1(p_organization_id);
 if not authority_private.has_active_membership(p_organization_id,array['owner','admin']) then raise exception using errcode='42501',message='permission_publish_not_allowed'; end if;
 if p_authority_type_key is distinct from 'financial_poa' then raise exception using errcode='42501',message='authority_type_publish_not_enabled'; end if;
 if not exists(select 1 from public.authority_type_defs where key=p_authority_type_key and pack_ready and retired_at is null and effective_at<=now()) then raise exception using errcode='42501',message='authority_type_not_pack_ready'; end if;
 if p_idempotency_key is null or p_expected_published_version_id is null or p_publish_reason is null or length(btrim(p_publish_reason)) not between 1 and 240 then raise exception using errcode='22023',message='permission_publish_input_invalid'; end if;
 payload_hash:=authority_private.payload_hash(jsonb_build_object('organization',p_organization_id,'kind',p_authority_type_key,'expected',p_expected_published_version_id,'reason',btrim(p_publish_reason)));
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':publish_permission_catalog:'||p_idempotency_key::text,0));
 select * into receipt from authority_private.command_receipts where actor_user_id=actor and command_name='publish_permission_catalog' and idempotency_key=p_idempotency_key;
 if found then
   if receipt.payload_hash<>payload_hash then raise exception using errcode='22023',message='idempotency_payload_mismatch'; end if;
   return receipt.result||jsonb_build_object('replayed',true);
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text||':publish_permission_catalog:financial_poa',0));
 select * into old_version from public.organization_permission_catalog_versions where organization_id=p_organization_id and authority_type_key='financial_poa' and state='published';
 if old_version.id is distinct from p_expected_published_version_id then raise exception using errcode='40001',message='stale_permission_published_version'; end if;
 items:=authority_private.permission_catalog_items_v1(old_version.id);
 if jsonb_array_length(items)<>2 or exists(select 1 from jsonb_array_elements(items) i where i->>'key' not in ('receive_duplicate_statements','discuss_service_issues') or i->>'kind'<>'act' or i->>'source'<>'platform' or i->>'availability'<>'production' or i->>'offered'<>'true') then raise exception using errcode='22023',message='permission_publish_items_required'; end if;
 insert into public.organization_permission_catalog_versions(organization_id,authority_type_key,version,state,content_hash,jurisdiction_package_key,jurisdiction_package_version,platform_semantic_version,publish_reason)
 values(p_organization_id,'financial_poa',to_char(clock_timestamp() at time zone 'UTC','YYYY.MM.DD.HH24MISS.US'),'draft',encode(extensions.digest(items::text,'sha256'),'hex'),old_version.jurisdiction_package_key,old_version.jurisdiction_package_version,old_version.platform_semantic_version,btrim(p_publish_reason)) returning id into new_id;
 insert into public.organization_permission_items(catalog_version_id,organization_id,source,permission_key,kind,offered,label,help,group_key,risk_tier,availability,account_product_scope,platform_permission_def_id,label_version)
 select new_id,organization_id,source,permission_key,kind,offered,label,help,group_key,risk_tier,availability,account_product_scope,platform_permission_def_id,label_version from public.organization_permission_items where catalog_version_id=old_version.id;
 prior_mode:=current_setting('passage.permission_publish_org',true);
 perform set_config('passage.permission_publish_org',p_organization_id::text,true);
 update public.organization_permission_catalog_versions set state='superseded' where id=old_version.id;
 update public.organization_permission_catalog_versions set state='published',published_at=clock_timestamp(),published_by=actor where id=new_id;
 perform set_config('passage.permission_publish_org',coalesce(prior_mode,''),true);
 insert into public.organization_audit_events(organization_id,actor_user_id,event_type,subject_type,subject_id,payload)
 values(p_organization_id,actor,'policy.permissions_published','permission_catalog',new_id,jsonb_build_object('previous_version_id',old_version.id,'published_version_id',new_id,'items',items,'reason',btrim(p_publish_reason)));
 result:=jsonb_build_object('published_version_id',new_id,'previous_version_id',old_version.id);
 insert into authority_private.command_receipts(actor_user_id,command_name,idempotency_key,payload_hash,result) values(actor,'publish_permission_catalog',p_idempotency_key,payload_hash,result);
 return result||jsonb_build_object('replayed',false);
end $$;
revoke all on function public.publish_permission_catalog_v1(uuid,text,uuid,text,uuid) from public,anon;
grant execute on function public.publish_permission_catalog_v1(uuid,text,uuid,text,uuid) to authenticated;

-- Reuse the jurisdiction snapshot and existing explicit revision command.
alter function authority_private.current_ny_governing_snapshot(uuid) rename to ny_jurisdiction_snapshot_v1;
create function authority_private.current_ny_governing_snapshot(p_organization_id uuid)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v public.organization_permission_catalog_versions%rowtype; items jsonb; base jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text||':publish_permission_catalog:financial_poa',0));
 base:=authority_private.ny_jurisdiction_snapshot_v1(p_organization_id);
 select * into v from public.organization_permission_catalog_versions where organization_id=p_organization_id and authority_type_key='financial_poa' and state='published';
 if not found then raise exception using errcode='22023',message='permission_published_version_missing'; end if;
 items:=authority_private.permission_catalog_items_v1(v.id);
 if not exists(select 1 from public.authority_type_defs where key='financial_poa' and pack_ready and retired_at is null and effective_at<=now()) or jsonb_array_length(items)<>2 then raise exception using errcode='22023',message='jurisdiction_configuration_unavailable'; end if;
 return base||jsonb_build_object('permission_catalog',jsonb_build_object('id',v.id,'version',v.version,'content_hash',encode(extensions.digest(items::text,'sha256'),'hex'),'platform_semantic_version',v.platform_semantic_version,'effective_at',v.published_at,'items',items));
end $$;
revoke all on function authority_private.current_ny_governing_snapshot(uuid) from public,anon,authenticated;

create function authority_private.freeze_request_permission_pin_v1()
returns trigger language plpgsql security definer set search_path='' as $$
declare pin jsonb; selected jsonb; expected text;
begin
 if tg_op='UPDATE' then
   if old.activated_at is not null or old.status<>'draft' then
     if row(new.catalog_version_id,new.policy_content_hash,new.requested_permissions_snapshot,new.authority_type_key) is distinct from row(old.catalog_version_id,old.policy_content_hash,old.requested_permissions_snapshot,old.authority_type_key) then raise exception using errcode='55000',message='governing_snapshot_is_locked'; end if;
     return new;
   end if;
   if row(new.catalog_version_id,new.policy_content_hash,new.requested_permissions_snapshot,new.authority_type_key) is distinct from row(old.catalog_version_id,old.policy_content_hash,old.requested_permissions_snapshot,old.authority_type_key)
      and current_setting('passage.ny_rebase_record',true) is distinct from old.id::text then raise exception using errcode='55000',message='governing_snapshot_is_locked'; end if;
   if new.governing_snapshot is not distinct from old.governing_snapshot and new.allowed_action_keys is not distinct from old.allowed_action_keys then return new; end if;
 end if;
 if new.template_key<>'ny_financial_poa' then return new; end if;
 pin:=new.governing_snapshot->'permission_catalog';
 if pin is null then return new; end if; -- legacy draft edits retain legacy provenance until explicit rebase
 expected:=current_setting('passage.expected_permission_version',true);
 if tg_op='INSERT' and nullif(expected,'') is not null and expected<>pin->>'id' then raise exception using errcode='40001',message='stale_permission_published_version'; end if;
 if exists(select 1 from unnest(new.allowed_action_keys) k where not exists(select 1 from jsonb_array_elements(pin->'items') i where i->>'key'=k and i->>'kind'='act' and i->>'availability'='production' and i->>'offered'='true')) then raise exception using errcode='22023',message='allowed_action_invalid'; end if;
 select coalesce(jsonb_agg(i||jsonb_build_object('outcome',null) order by i->>'key'),'[]'::jsonb) into selected from jsonb_array_elements(pin->'items') i where i->>'key'=any(new.allowed_action_keys);
 new.authority_type_key:='financial_poa'; new.catalog_version_id:=(pin->>'id')::uuid; new.policy_content_hash:=pin->>'content_hash';
 new.requested_permissions_snapshot:=jsonb_build_object('catalog_version_id',new.catalog_version_id,'catalog_version',pin->>'version','authority_type_key','financial_poa','content_hash',new.policy_content_hash,'legacy_provenance',false,'items',selected);
 return new;
end $$;
revoke all on function authority_private.freeze_request_permission_pin_v1() from public,anon,authenticated;
create trigger zz_authority_permission_pin before insert or update on public.authority_records for each row execute function authority_private.freeze_request_permission_pin_v1();

create function authority_private.freeze_draft_event_policy_v1()
returns trigger language plpgsql security definer set search_path='' as $$
declare rec public.authority_records%rowtype;
begin
 if new.event_type='authority.draft_created' then
   select * into rec from public.authority_records where id=new.authority_record_id and organization_id=new.organization_id;
   new.payload:=new.payload||jsonb_build_object('governing_snapshot',rec.governing_snapshot,'requested_permissions_snapshot',rec.requested_permissions_snapshot);
 end if;
 return new;
end $$;
revoke all on function authority_private.freeze_draft_event_policy_v1() from public,anon,authenticated;
create trigger authority_draft_policy_event before insert on public.authority_events for each row execute function authority_private.freeze_draft_event_policy_v1();

-- A frozen request is the source for all future decision labels, never live definitions.
alter function authority_private.freeze_decision_permission_labels_trg() rename to freeze_legacy_decision_permission_labels_trg;
create function authority_private.freeze_pinned_decision_permissions_v1()
returns trigger language plpgsql security definer set search_path='' as $$
declare rec public.authority_records%rowtype; accepted jsonb; excluded jsonb; base jsonb;
begin
 select * into rec from public.authority_records where id=new.authority_record_id and organization_id=new.organization_id;
 if rec.requested_permissions_snapshot is null then return new; end if;
 if not coalesce(new.accepted_action_keys,'{}'::text[]) <@ rec.allowed_action_keys then raise exception using errcode='22023',message='allowed_action_invalid'; end if;
 base:=rec.requested_permissions_snapshot-'items';
 select coalesce(jsonb_agg(i||jsonb_build_object('outcome',case when new.outcome='accepted_with_limits' then 'accepted_with_limits' else 'permitted' end) order by i->>'key'),'[]'::jsonb) into accepted from jsonb_array_elements(rec.requested_permissions_snapshot->'items') i where i->>'key'=any(coalesce(new.accepted_action_keys,'{}'::text[]));
 select coalesce(jsonb_agg(i||jsonb_build_object('outcome','not_included') order by i->>'key'),'[]'::jsonb) into excluded from jsonb_array_elements(rec.requested_permissions_snapshot->'items') i where not (i->>'key'=any(coalesce(new.accepted_action_keys,'{}'::text[])));
 new.accepted_permissions_snapshot:=base||jsonb_build_object('items',accepted);
 new.not_included_permissions_snapshot:=base||jsonb_build_object('items',excluded);
 new.receipt_snapshot:=new.receipt_snapshot||jsonb_build_object('requested_permissions_snapshot',rec.requested_permissions_snapshot,'accepted_permissions_snapshot',new.accepted_permissions_snapshot,'not_included_permissions_snapshot',new.not_included_permissions_snapshot);
 return new;
end $$;
revoke all on function authority_private.freeze_pinned_decision_permissions_v1() from public,anon,authenticated;
create trigger zy_freeze_pinned_permissions before insert on public.authority_institution_decisions for each row execute function authority_private.freeze_pinned_decision_permissions_v1();

create function public.create_authority_draft_v2(p_organization_id uuid,p_principal_name text,p_principal_email text,p_representative_name text,p_representative_email text,p_account_boundary text,p_valid_until timestamptz,p_allowed_action_keys text[],p_idempotency_key uuid,p_expected_published_version_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=authority_private.current_actor_id(); fingerprint text; receipt authority_private.command_receipts%rowtype; result jsonb; prior_mode text;
begin
 perform authority_private.require_privileged_mfa_v1(p_organization_id);
 if authority_private.assert_authority_record_operator(p_organization_id) not in ('owner','admin','staff') then raise exception using errcode='42501',message='authority_request_creation_not_allowed'; end if;
 if p_idempotency_key is null or p_expected_published_version_id is null then raise exception using errcode='22023',message='permission_publish_input_invalid'; end if;
 fingerprint:=authority_private.payload_hash(jsonb_build_object('org',p_organization_id,'principal',p_principal_name,'principal_email',p_principal_email,'representative',p_representative_name,'representative_email',p_representative_email,'account',p_account_boundary,'until',p_valid_until,'actions',p_allowed_action_keys,'expected',p_expected_published_version_id));
 perform pg_advisory_xact_lock(hashtextextended(actor::text||':create_authority_draft_v2:'||p_idempotency_key::text,0));
 select * into receipt from authority_private.command_receipts where actor_user_id=actor and command_name='create_authority_draft_v2' and idempotency_key=p_idempotency_key;
 if found then
   if receipt.payload_hash<>fingerprint then raise exception using errcode='22023',message='idempotency_payload_mismatch'; end if;
   return receipt.result||jsonb_build_object('replayed',true);
 end if;
 -- Do not allow v1 command keys to replay an unrelated draft through v2.
 if exists(select 1 from authority_private.command_receipts where actor_user_id=actor and command_name='create_authority_draft' and idempotency_key=p_idempotency_key) then raise exception using errcode='22023',message='idempotency_payload_mismatch'; end if;
 prior_mode:=current_setting('passage.expected_permission_version',true);
 perform set_config('passage.expected_permission_version',p_expected_published_version_id::text,true);
 result:=public.create_authority_draft_v1(p_organization_id,p_principal_name,p_principal_email,p_representative_name,p_representative_email,p_account_boundary,p_valid_until,p_allowed_action_keys,p_idempotency_key);
 perform set_config('passage.expected_permission_version',coalesce(prior_mode,''),true);
 insert into authority_private.command_receipts(actor_user_id,command_name,idempotency_key,payload_hash,result) values(actor,'create_authority_draft_v2',p_idempotency_key,fingerprint,result);
 return result;
end $$;
revoke all on function public.create_authority_draft_v2(uuid,text,text,text,text,text,timestamptz,text[],uuid,uuid) from public,anon;
grant execute on function public.create_authority_draft_v2(uuid,text,text,text,text,text,timestamptz,text[],uuid,uuid) to authenticated;

create or replace function authority_private.guard_ny_governing_snapshot() returns trigger
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
  if old.status='draft' and new.status not in ('draft','canceled') and new.template_key='ny_financial_poa' then
    current_snapshot:=authority_private.current_ny_governing_snapshot(new.organization_id);
    if new.governing_snapshot is distinct from current_snapshot then
      raise exception using errcode='22023',message='jurisdiction_draft_stale';
    end if;
  end if;
  return new;
end $$;
