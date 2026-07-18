-- Follow-up only: preserve the accepted invitation transaction and name the
-- existing member-location primary-key constraint to avoid PL/pgSQL output
-- column ambiguity in the upsert conflict target.
create or replace function passage_private.accept_organization_invitation(p_raw_token text)
returns table (
  organization_member_id uuid,
  organization_id uuid,
  member_role text,
  organization_location_ids uuid[],
  landing_path text,
  accepted_at timestamp with time zone,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_verified_email text;
  v_display_name text;
  v_invitation public.organization_invitations%rowtype;
  v_member public.organization_members%rowtype;
  v_member_count integer;
  v_location_ids uuid[];
  v_accepted_at timestamp with time zone;
  v_event_location_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if length(coalesce(p_raw_token, '')) < 32 then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  v_verified_email := passage_private.current_verified_email();

  select coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(v_verified_email, '@', 1)
  )
    into v_display_name
  from auth.users as u
  where u.id = v_actor_user_id;

  select i.* into v_invitation
  from public.organization_invitations as i
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  for update;

  if not found then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  select coalesce(array_agg(il.organization_location_id order by il.organization_location_id), '{}'::uuid[])
    into v_location_ids
  from public.organization_invitation_locations as il
  where il.invitation_id = v_invitation.id;

  if cardinality(v_location_ids) = 0 then
    raise exception 'Invitation has no valid location scope' using errcode = '22023';
  end if;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by_user_id <> v_actor_user_id then
      raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
    end if;

    return query
    select
      v_invitation.accepted_organization_member_id,
      v_invitation.organization_id,
      v_invitation.role,
      v_location_ids,
      '/staff'::text,
      v_invitation.accepted_at,
      true;
    return;
  end if;

  if v_invitation.revoked_at is not null
     or v_invitation.expires_at <= pg_catalog.clock_timestamp() then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  if v_invitation.invited_email <> v_verified_email then
    raise exception 'Sign in with the verified email address that received this invitation'
      using errcode = '42501';
  end if;

  perform m.id
  from public.organization_members as m
  where m.organization_id = v_invitation.organization_id
    and (
      m.user_id = v_actor_user_id
      or lower(btrim(m.email)) = v_verified_email
    )
  for update;

  select count(*)::integer
    into v_member_count
  from public.organization_members as m
  where m.organization_id = v_invitation.organization_id
    and (
      m.user_id = v_actor_user_id
      or lower(btrim(m.email)) = v_verified_email
    );

  if v_member_count > 1 then
    raise exception 'Membership needs administrator review before this invitation can be accepted'
      using errcode = '23505';
  end if;

  v_accepted_at := pg_catalog.clock_timestamp();

  if v_member_count = 1 then
    select m.* into v_member
    from public.organization_members as m
    where m.organization_id = v_invitation.organization_id
      and (
        m.user_id = v_actor_user_id
        or lower(btrim(m.email)) = v_verified_email
      )
    limit 1;

    if v_member.user_id is not null and v_member.user_id <> v_actor_user_id then
      raise exception 'Membership is already bound to another account' using errcode = '42501';
    end if;

    if v_member.role <> v_invitation.role then
      raise exception 'Membership role needs administrator review before acceptance'
        using errcode = '42501';
    end if;

    update public.organization_members as m
    set user_id = v_actor_user_id,
        email = v_verified_email,
        status = 'active',
        accepted_at = v_accepted_at,
        display_name = coalesce(nullif(m.display_name, ''), v_display_name),
        updated_at = v_accepted_at
    where m.id = v_member.id
    returning m.* into v_member;
  else
    insert into public.organization_members (
      organization_id,
      user_id,
      email,
      role,
      status,
      display_name,
      accepted_at,
      created_at,
      updated_at
    ) values (
      v_invitation.organization_id,
      v_actor_user_id,
      v_verified_email,
      v_invitation.role,
      'active',
      v_display_name,
      v_accepted_at,
      v_accepted_at,
      v_accepted_at
    )
    returning * into v_member;
  end if;

  update public.organization_member_locations as ml
  set revoked_at = v_accepted_at
  where ml.organization_member_id = v_member.id
    and ml.revoked_at is null
    and not (ml.organization_location_id = any(v_location_ids));

  insert into public.organization_member_locations as existing_scope (
    organization_member_id,
    organization_location_id,
    granted_by_user_id,
    granted_at,
    revoked_at
  )
  select
    v_member.id,
    requested.location_id,
    v_invitation.invited_by_user_id,
    v_accepted_at,
    null
  from unnest(v_location_ids) as requested(location_id)
  on conflict on constraint organization_member_locations_pkey
  do update set
    granted_by_user_id = excluded.granted_by_user_id,
    granted_at = case
      when existing_scope.revoked_at is null
        then existing_scope.granted_at
      else excluded.granted_at
    end,
    revoked_at = null;

  update public.organization_invitations as i
  set accepted_at = v_accepted_at,
      accepted_by_user_id = v_actor_user_id,
      accepted_organization_member_id = v_member.id
  where i.id = v_invitation.id
    and i.accepted_at is null
    and i.revoked_at is null;

  if not found then
    raise exception 'Invitation changed while it was being accepted' using errcode = '40001';
  end if;

  if cardinality(v_location_ids) = 1 then
    v_event_location_id := v_location_ids[1];
  end if;

  perform passage_private.append_invitation_event(
    v_invitation.organization_id,
    v_event_location_id,
    v_actor_user_id,
    v_member.id,
    v_invitation.id,
    'organization_invitation:' || v_invitation.id::text || ':accepted',
    'organization_invitation.accepted',
    'pending_acceptance',
    'accepted',
    pg_catalog.jsonb_build_object(
      'invitation_role', v_invitation.role,
      'location_ids', pg_catalog.to_jsonb(v_location_ids),
      'next_action', 'Open assigned work',
      'landing_path', '/staff'
    )
  );

  return query
  select
    v_member.id,
    v_invitation.organization_id,
    v_invitation.role,
    v_location_ids,
    '/staff'::text,
    v_accepted_at,
    false;
end
$function$;
