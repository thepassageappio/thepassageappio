-- Cycle 7A isolated hosted-QA invitation creation idempotency.
--
-- WHAT: persist a client request UUID and expose an additive idempotent creation
-- RPC that serializes live pending invitations by organization and normalized
-- email. Replays return the existing id/hint/expiry without reconstructing the
-- raw invitation credential.
-- WHY: UI pending state cannot prevent lost-response, reload, multi-tab, or
-- concurrent duplicate invitation/event effects.
-- BREAKAGE IF SKIPPED: the director UI can claim one invitation while durable
-- invitation and audit-event cardinality is greater than one.
--
-- ISOLATED LAB ONLY: apply through Supabase migration tooling only to
-- uyacxqtsiwlvtmhxvoxr. Never apply to production qsveqfchwylsbncsfgxe.

alter table public.organization_invitations
  add column if not exists creation_request_id uuid;

create unique index if not exists organization_invitations_creation_request_uidx
  on public.organization_invitations (organization_id, creation_request_id)
  where creation_request_id is not null;

create or replace function passage_private.create_employee_invitation_idempotent(
  p_organization_id uuid,
  p_invited_email text,
  p_organization_location_ids uuid[],
  p_purpose text,
  p_expires_at timestamp with time zone,
  p_creation_request_id uuid
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamp with time zone,
  invitation_purpose text,
  inviter_display_name text,
  organization_location_ids uuid[],
  invitation_state text,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_email text := lower(btrim(coalesce(p_invited_email, '')));
  v_existing public.organization_invitations%rowtype;
  v_created record;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if not passage_private.can_manage_organization(p_organization_id) then
    raise exception 'You do not have authority to invite employees for this organization'
      using errcode = '42501';
  end if;
  if p_creation_request_id is null then
    raise exception 'A creation request id is required' using errcode = '22023';
  end if;
  if length(v_email) > 320 or position('@' in v_email) <= 1 then
    raise exception 'A valid invited email address is required' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':' || v_email, 0)
  );

  select invitation.* into v_existing
  from public.organization_invitations as invitation
  where invitation.organization_id = p_organization_id
    and invitation.creation_request_id = p_creation_request_id;

  if found then
    if not passage_private.can_manage_invitation(v_existing.id) then
      raise exception 'You do not have authority for the existing invitation scope'
        using errcode = '42501';
    end if;
    if v_existing.invited_email <> v_email then
      raise exception 'Creation request id is already bound to another invitation'
        using errcode = '23505';
    end if;
    return query select
      v_existing.id,
      null::text,
      v_existing.token_hint,
      v_existing.expires_at,
      v_existing.purpose,
      coalesce((
        select member.display_name
        from public.organization_members as member
        where member.organization_id = v_existing.organization_id
          and member.user_id = v_existing.invited_by_user_id
        order by member.created_at
        limit 1
      ), 'Authorized director'),
      array(
        select link.organization_location_id
        from public.organization_invitation_locations as link
        where link.invitation_id = v_existing.id
        order by link.organization_location_id
      ),
      case
        when v_existing.accepted_at is not null then 'accepted'
        when v_existing.revoked_at is not null then 'revoked'
        when v_existing.expires_at <= pg_catalog.clock_timestamp() then 'expired'
        else 'pending'
      end,
      true;
    return;
  end if;

  select invitation.* into v_existing
  from public.organization_invitations as invitation
  where invitation.organization_id = p_organization_id
    and invitation.invited_email = v_email
    and invitation.accepted_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > pg_catalog.clock_timestamp()
  order by invitation.created_at
  limit 1;

  if found then
    if not passage_private.can_manage_invitation(v_existing.id) then
      raise exception 'You do not have authority for the existing invitation scope'
        using errcode = '42501';
    end if;
    return query select
      v_existing.id,
      null::text,
      v_existing.token_hint,
      v_existing.expires_at,
      v_existing.purpose,
      coalesce((
        select member.display_name
        from public.organization_members as member
        where member.organization_id = v_existing.organization_id
          and member.user_id = v_existing.invited_by_user_id
        order by member.created_at
        limit 1
      ), 'Authorized director'),
      array(
        select link.organization_location_id
        from public.organization_invitation_locations as link
        where link.invitation_id = v_existing.id
        order by link.organization_location_id
      ),
      'pending'::text,
      true;
    return;
  end if;

  select * into strict v_created
  from passage_private.create_employee_invitation(
    p_organization_id,
    v_email,
    p_organization_location_ids,
    p_purpose,
    p_expires_at
  );

  update public.organization_invitations as invitation
  set creation_request_id = p_creation_request_id
  where invitation.id = v_created.invitation_id;

  return query select
    v_created.invitation_id::uuid,
    v_created.raw_token::text,
    v_created.token_hint::text,
    v_created.expires_at::timestamp with time zone,
    btrim(p_purpose),
    coalesce((
      select member.display_name
      from public.organization_members as member
      where member.organization_id = p_organization_id
        and member.user_id = v_actor_user_id
      order by member.created_at
      limit 1
    ), 'Authorized director'),
    array(
      select distinct requested.location_id
      from unnest(p_organization_location_ids) as requested(location_id)
      order by requested.location_id
    ),
    'pending'::text,
    false;
end
$function$;

create or replace function public.create_employee_invitation_idempotent(
  p_organization_id uuid,
  p_invited_email text,
  p_organization_location_ids uuid[],
  p_purpose text,
  p_expires_at timestamp with time zone,
  p_creation_request_id uuid
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamp with time zone,
  invitation_purpose text,
  inviter_display_name text,
  organization_location_ids uuid[],
  invitation_state text,
  replayed boolean
)
language sql
volatile
security definer
set search_path = ''
as $function$
  select * from passage_private.create_employee_invitation_idempotent(
    p_organization_id,
    p_invited_email,
    p_organization_location_ids,
    p_purpose,
    p_expires_at,
    p_creation_request_id
  )
$function$;

revoke all on function passage_private.create_employee_invitation_idempotent(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) from public, anon, authenticated;

revoke all on function public.create_employee_invitation_idempotent(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) from public, anon;

grant execute on function public.create_employee_invitation_idempotent(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) to authenticated;

-- Close the superseded non-idempotent client entrypoints. The new private
-- function remains able to call the old private implementation as its owner.
revoke execute on function public.create_employee_invitation(
  uuid, text, uuid[], text, timestamp with time zone
) from authenticated;

revoke execute on function passage_private.create_employee_invitation(
  uuid, text, uuid[], text, timestamp with time zone
) from authenticated;
