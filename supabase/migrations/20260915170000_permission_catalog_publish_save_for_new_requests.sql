-- Track B1: publish / "Save for new requests" for org permission sets (#129).
-- Scoped PER AUTHORITY KIND (Steve lock): publish + offered list are for one
-- authority_type_key at a time. This migration wires financial_poa only.
-- Death / vehicle / other kinds stay pack_ready=false and are never published here.
-- UI copy must never say "catalog" — use "What people may ask for" / "Save for new requests".
-- Do not unlock multi-state, buyer configure, custom CRUD, channels, or draft rebase (those are later tracks).
-- In-flight drafts keep their pinned catalog_version_id; publish never mutates prior version rows.

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

  -- Kind must exist on the platform registry. Non-ready kinds may be read as empty
  -- only when an accidental published row exists; Track B1 never creates them.
  select atd.pack_ready
  into v_pack_ready
  from public.authority_type_defs atd
  where atd.key = p_authority_type_key
    and atd.retired_at is null
  order by atd.effective_at desc
  limit 1;

  if not found then
    raise exception using errcode = '22023', message = 'authority_type_not_available';
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
