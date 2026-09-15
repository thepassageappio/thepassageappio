-- Track B1 (cont): publish / "Save for new requests" RPC (#129).
-- Per authority kind; financial_poa only; owner/admin AAL2; no in-flight pin rewrite.
-- ---------------------------------------------------------------------------
-- 2. Publish ("Save for new requests") for one kind — owner/admin AAL2
-- ---------------------------------------------------------------------------

create or replace function authority_private.publish_permission_catalog_v1(
  p_organization_id uuid,
  p_authority_type_key text,
  p_expected_published_version_id uuid,
  p_publish_reason text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_payload_hash text;
  v_existing authority_private.command_receipts%rowtype;
  v_pack_ready boolean;
  v_platform_semantic text;
  v_current public.organization_permission_catalog_versions%rowtype;
  v_new public.organization_permission_catalog_versions%rowtype;
  v_next_version text;
  v_content_hash text;
  v_item_count int;
  v_reason text := nullif(btrim(coalesce(p_publish_reason, '')), '');
  v_result jsonb;
  v_items jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;

  if p_organization_id is null or nullif(btrim(p_authority_type_key), '') is null then
    raise exception using errcode = '22023', message = 'permission_publish_input_invalid';
  end if;

  -- Owner/admin only (policy.manage equivalent). MFA enforced on public wrapper.
  if not authority_private.has_active_membership(p_organization_id, array['owner', 'admin']) then
    raise exception using errcode = '42501', message = 'permission_publish_not_allowed';
  end if;

  -- Steve lock: only pack_ready kinds may be published. Track B1 callers use financial_poa.
  select atd.pack_ready, atd.semantic_version
  into v_pack_ready, v_platform_semantic
  from public.authority_type_defs atd
  where atd.key = p_authority_type_key
    and atd.retired_at is null
  order by atd.effective_at desc
  limit 1;

  if not found then
    raise exception using errcode = '22023', message = 'authority_type_not_available';
  end if;

  if v_pack_ready is not true then
    raise exception using errcode = '42501', message = 'authority_type_not_pack_ready';
  end if;

  -- Track B1 hard scope: financial_poa only. Prevents accidental death/vehicle publish.
  if p_authority_type_key <> 'financial_poa' then
    raise exception using errcode = '42501', message = 'authority_type_publish_not_enabled';
  end if;

  if v_reason is not null and char_length(v_reason) > 240 then
    raise exception using errcode = '22023', message = 'permission_publish_reason_invalid';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_type_key', p_authority_type_key,
    'expected_published_version_id', p_expected_published_version_id,
    'publish_reason', v_reason
  ));

  perform pg_advisory_xact_lock(hashtextextended(
    p_organization_id::text || ':publish_permission_catalog:' || p_authority_type_key, 0
  ));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'publish_permission_catalog'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select *
  into v_current
  from public.organization_permission_catalog_versions v
  where v.organization_id = p_organization_id
    and v.authority_type_key = p_authority_type_key
    and v.state = 'published'
  limit 1;

  if not found then
    raise exception using errcode = '22023', message = 'permission_published_version_missing';
  end if;

  if p_expected_published_version_id is null
    or v_current.id <> p_expected_published_version_id then
    raise exception using errcode = '22023', message = 'stale_permission_published_version';
  end if;

  -- Ensure current published row has at least one production offered act for this kind.
  select count(*)::int
  into v_item_count
  from public.organization_permission_items i
  where i.catalog_version_id = v_current.id
    and i.offered = true
    and i.availability = 'production'
    and i.kind = 'act';

  if v_item_count is null or v_item_count < 1 then
    raise exception using errcode = '22023', message = 'permission_publish_items_required';
  end if;

  -- Canonical content hash from ordered offered production items (this kind only).
  select encode(extensions.digest(convert_to(
    coalesce(string_agg(
      i.permission_key || ':' || i.kind || ':' || i.source || ':' || i.label || ':' || i.help
        || ':' || i.label_version::text || ':' || i.availability,
      '|' order by i.permission_key
    ), ''),
    'UTF8'
  ), 'sha256'), 'hex')
  into v_content_hash
  from public.organization_permission_items i
  where i.catalog_version_id = v_current.id
    and i.offered = true
    and i.availability = 'production';

  -- Org-local dated bump matching Phase 0 seed style (e.g. 2026.9.15.1 → .2).
  if v_current.version ~ '^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}\.[0-9]+$' then
    v_next_version := regexp_replace(v_current.version, '\.[0-9]+$', '')
      || '.' || ((regexp_replace(v_current.version, '^.*\.', ''))::int + 1)::text;
  else
    v_next_version := to_char((timezone('utc', now()))::date, 'YYYY')
      || '.' || (extract(month from timezone('utc', now()))::int)::text
      || '.' || (extract(day from timezone('utc', now()))::int)::text
      || '.1';
  end if;

  -- Supersede first so the one-published partial unique index stays satisfied.
  update public.organization_permission_catalog_versions
  set state = 'superseded'
  where id = v_current.id
    and state = 'published';

  insert into public.organization_permission_catalog_versions (
    organization_id, authority_type_key, version, state, content_hash,
    jurisdiction_package_key, jurisdiction_package_version, platform_semantic_version,
    published_at, published_by, publish_reason
  ) values (
    p_organization_id,
    p_authority_type_key,
    v_next_version,
    'published',
    v_content_hash,
    v_current.jurisdiction_package_key,
    v_current.jurisdiction_package_version,
    coalesce(v_platform_semantic, v_current.platform_semantic_version),
    now(),
    v_actor,
    coalesce(v_reason, 'Save for new requests')
  )
  returning * into v_new;

  -- Copy all items from prior published version (offered + not) so history is complete;
  -- new requests only surface offered=true production rows via get_published_*.
  insert into public.organization_permission_items (
    catalog_version_id, organization_id, source, permission_key, kind, offered,
    label, help, group_key, risk_tier, availability, account_product_scope,
    platform_permission_def_id, label_version
  )
  select
    v_new.id, i.organization_id, i.source, i.permission_key, i.kind, i.offered,
    i.label, i.help, i.group_key, i.risk_tier, i.availability, i.account_product_scope,
    i.platform_permission_def_id, i.label_version
  from public.organization_permission_items i
  where i.catalog_version_id = v_current.id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'permission_key', i.permission_key,
      'kind', i.kind,
      'label', i.label,
      'help', i.help,
      'offered', i.offered,
      'availability', i.availability
    )
    order by i.permission_key
  ), '[]'::jsonb)
  into v_items
  from public.organization_permission_items i
  where i.catalog_version_id = v_new.id
    and i.offered = true
    and i.availability = 'production';

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'organization.permission_set_published', 'organization', p_organization_id,
    jsonb_build_object(
      'authority_type_key', p_authority_type_key,
      'previous_version_id', v_current.id,
      'previous_version', v_current.version,
      'published_version_id', v_new.id,
      'published_version', v_new.version,
      'content_hash', v_new.content_hash,
      'offered_item_count', jsonb_array_length(v_items)
    )
  );

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'authority_type_key', p_authority_type_key,
    'published_version_id', v_new.id,
    'published_version', v_new.version,
    'content_hash', v_new.content_hash,
    'previous_version_id', v_current.id,
    'previous_version', v_current.version,
    'items', v_items
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'publish_permission_catalog', p_idempotency_key, v_payload_hash, v_result
  );

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.publish_permission_catalog_v1(
  p_organization_id uuid,
  p_authority_type_key text,
  p_expected_published_version_id uuid,
  p_publish_reason text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.publish_permission_catalog_v1(
    p_organization_id,
    p_authority_type_key,
    p_expected_published_version_id,
    p_publish_reason,
    p_idempotency_key
  );
end;
$$;

revoke execute on function authority_private.publish_permission_catalog_v1(uuid, text, uuid, text, uuid)
  from public, anon, authenticated;
revoke execute on function public.publish_permission_catalog_v1(uuid, text, uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function authority_private.publish_permission_catalog_v1(uuid, text, uuid, text, uuid) to authenticated;
grant execute on function public.publish_permission_catalog_v1(uuid, text, uuid, text, uuid) to authenticated;

comment on function public.publish_permission_catalog_v1(uuid, text, uuid, text, uuid) is
  'Save for new requests: publish an immutable offered permission set for one org + authority kind. Track B1 enables financial_poa only; requires owner/admin AAL2. Does not rewrite in-flight draft pins.';
