-- Public multi-institution listing opt-in.
--
-- Default OFF. No backfill to listed=true (CoS/Steve: explicit opt-in, not
-- auto-on). Existing rows become false after ADD COLUMN ... DEFAULT false.
-- Owners/admins toggle via set_organization_public_listing_v1.
--
-- Known gap (out of scope): add_submission_target_v1 still accepts an unlisted
-- organization id from a crafted call. Search is the requester UI gate.
--
-- Idempotent: add column if not exists; create or replace functions; re-grant.

alter table public.organizations
  add column if not exists listed_for_public_requests boolean not null default false;

comment on column public.organizations.listed_for_public_requests is
  'Opt-in for requester multi-institution search. Default off. Owners toggle via set_organization_public_listing_v1.';

create or replace function authority_private.search_institutions_v1(p_query text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'organization_id', o.id, 'display_name', o.display_name, 'organization_type', o.organization_type
  ) order by o.display_name), '[]'::jsonb)
  from public.organizations o
  where o.status = 'active'
    and o.onboarding_status = 'ready'
    and o.listed_for_public_requests
    and char_length(btrim(coalesce(p_query, ''))) >= 2
    and o.display_name ilike '%' || btrim(p_query) || '%'
  limit 10;
$$;

create or replace function authority_private.set_organization_public_listing_v1(
  p_organization_id uuid,
  p_listed boolean,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := authority_private.current_actor_id();
  v_organization public.organizations%rowtype;
  v_existing authority_private.command_receipts%rowtype;
  v_payload_hash text;
  v_previous boolean;
  v_previous_version bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  -- Owner/admin only (assert_member_manager). Public wrapper also requires MFA.
  perform authority_private.assert_member_manager(p_organization_id);

  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if p_listed is null then
    raise exception using errcode = '22023', message = 'listed_required';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'organization_id', p_organization_id,
    'listed', p_listed,
    'expected_version', p_expected_version
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text || ':organization_public_listing', 0));

  select * into v_existing
  from authority_private.command_receipts
  where actor_user_id = v_actor
    and command_name = 'set_organization_public_listing'
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_existing.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_organization
  from public.organizations
  where id = p_organization_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'organization_not_available';
  end if;
  if v_organization.version <> p_expected_version then
    raise exception using errcode = 'P0001', message = 'stale_organization_version';
  end if;

  v_previous := v_organization.listed_for_public_requests;
  v_previous_version := v_organization.version;

  -- No-op: already at the desired value. Succeed without bumping version or
  -- writing audit; still record a receipt so retries with the same key replay.
  if v_previous is not distinct from p_listed then
    v_result := jsonb_build_object(
      'organization_id', p_organization_id,
      'listed', p_listed,
      'version', v_organization.version,
      'event_id', null
    );
    insert into authority_private.command_receipts (
      actor_user_id, command_name, idempotency_key, payload_hash, result
    ) values (
      v_actor, 'set_organization_public_listing', p_idempotency_key, v_payload_hash, v_result
    );
    return v_result || jsonb_build_object('replayed', false);
  end if;

  update public.organizations
  set listed_for_public_requests = p_listed,
      version = version + 1,
      updated_at = now()
  where id = p_organization_id
  returning * into v_organization;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    p_organization_id, v_actor, 'organization_public_listing_changed', 'organization', p_organization_id,
    jsonb_build_object(
      'listed', p_listed,
      'previous', v_previous,
      'version', v_organization.version,
      'previous_version', v_previous_version
    )
  ) returning event_id into v_event_id;

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'listed', p_listed,
    'version', v_organization.version,
    'event_id', v_event_id
  );

  insert into authority_private.command_receipts (
    actor_user_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_actor, 'set_organization_public_listing', p_idempotency_key, v_payload_hash, v_result
  );

  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.set_organization_public_listing_v1(
  p_organization_id uuid,
  p_listed boolean,
  p_expected_version bigint,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform authority_private.require_privileged_mfa_v1(p_organization_id);
  return authority_private.set_organization_public_listing_v1(
    p_organization_id, p_listed, p_expected_version, p_idempotency_key
  );
end;
$$;

-- Search grants match 20260913150500 (create or replace keeps grants; re-assert for safety).
revoke execute on function authority_private.search_institutions_v1(text) from public, anon, authenticated;
revoke execute on function public.search_institutions_v1(text) from public, anon, authenticated;
grant execute on function authority_private.search_institutions_v1(text) to anon, authenticated;
grant execute on function public.search_institutions_v1(text) to anon, authenticated;

revoke execute on function authority_private.set_organization_public_listing_v1(uuid, boolean, bigint, uuid) from public, anon;
revoke execute on function public.set_organization_public_listing_v1(uuid, boolean, bigint, uuid) from public, anon;
grant execute on function authority_private.set_organization_public_listing_v1(uuid, boolean, bigint, uuid) to authenticated;
grant execute on function public.set_organization_public_listing_v1(uuid, boolean, bigint, uuid) to authenticated;

notify pgrst, 'reload schema';
