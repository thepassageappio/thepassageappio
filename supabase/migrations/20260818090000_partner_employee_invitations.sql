-- Vendor/partner orgs support exactly one login today: self_serve_create_partner_organization
-- (production_vendor_category_and_signup migration) creates a single 'owner' partner_members row
-- and rejects any second signup for the same person, but nothing lets that owner add a second
-- employee -- no partner_invitations-shaped table or RPC exists anywhere, unlike funeral-home
-- orgs which have a full organization_invitations + accept_organization_invitation system
-- (cycle_7a_invited_employee_foundation migration). partner_members.unique(partner_organization_id,
-- user_id) only blocks the same user joining twice; it does not cap an org at one member, so this
-- is purely a missing-consumer gap, not a schema change. Mirrors the funeral-home invitation
-- pattern as closely as the two domains allow: no locations concept exists on the vendor side
-- (partner_organizations/partner_members carry no location join at all), so this is a strict
-- subset of the funeral-home flow, not a reduced-trust version of it.

create table if not exists public.partner_invitations (
  id uuid primary key default gen_random_uuid(),
  partner_organization_id uuid not null references public.partner_organizations (id) on delete cascade,
  invited_email text not null,
  invited_by_user_id uuid not null references auth.users (id),
  purpose text not null,
  token_digest text not null unique,
  token_hint text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users (id),
  accepted_partner_member_id uuid references public.partner_members (id),
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users (id),
  revocation_reason text,
  creation_request_id uuid,
  created_at timestamptz not null default clock_timestamp(),
  constraint partner_invitations_email_normalized_check
    check (invited_email = lower(btrim(invited_email)) and position('@' in invited_email) > 1),
  constraint partner_invitations_purpose_check check (length(btrim(purpose)) > 0),
  constraint partner_invitations_token_digest_check check (token_digest ~ '^[0-9a-f]{64}$'),
  constraint partner_invitations_token_hint_check check (token_hint ~ '^[0-9a-f]{8}$'),
  constraint partner_invitations_expiry_check check (expires_at > created_at),
  constraint partner_invitations_terminal_state_check check (not (accepted_at is not null and revoked_at is not null)),
  constraint partner_invitations_acceptance_shape_check check (
    (accepted_at is null and accepted_by_user_id is null and accepted_partner_member_id is null)
    or (accepted_at is not null and accepted_by_user_id is not null and accepted_partner_member_id is not null)
  ),
  constraint partner_invitations_revocation_shape_check check (
    (revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
    or (revoked_at is not null and revoked_by_user_id is not null and length(btrim(revocation_reason)) > 0)
  )
);

comment on table public.partner_invitations is 'Pending/accepted/revoked invitations for a second+ employee to join an existing partner (vendor) organization. Mirrors organization_invitations, minus the location scope that has no vendor-side equivalent.';

create unique index if not exists partner_invitations_creation_request_uidx
  on public.partner_invitations (partner_organization_id, creation_request_id)
  where creation_request_id is not null;

alter table public.partner_invitations enable row level security;

revoke all on table public.partner_invitations from public, anon, authenticated;
-- No direct select/insert/update grants: every access path goes through the
-- SECURITY DEFINER RPCs below (list/create/accept/revoke), same convention
-- as partner_organizations/partner_members/partner_requests already follow
-- for their write paths, and matching PR #77's own explicit reasoning for
-- why the family-participant fix used a bounded RPC instead of loosened RLS.

-- Owner-only authority check, the vendor-side equivalent of
-- passage_private.can_manage_organization(). partner_members has no
-- 'director' tier (role is 'owner' | 'member'), so this is a single-role
-- check rather than an IN (...) list.
create or replace function passage_private.can_manage_partner_organization(p_partner_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.partner_members as pm
    where pm.partner_organization_id = p_partner_organization_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'active'
      and pm.role = 'owner'
  )
$$;

revoke all on function passage_private.can_manage_partner_organization(uuid) from public, anon, authenticated;
grant execute on function passage_private.can_manage_partner_organization(uuid) to authenticated;

-- Owner-facing listing RPCs. Direct table reads aren't an option: the only
-- existing partner_members RLS policy (partner_members_self_select) scopes
-- a caller to their own row, so an owner has no way to see teammates without
-- either widening that policy (bigger blast radius) or a bounded RPC. Raises
-- on unauthorized callers rather than silently returning zero rows, matching
-- every other authority-gated RPC in this schema.
create or replace function passage_private.list_partner_team_members(p_partner_organization_id uuid)
returns table (
  member_id uuid,
  member_user_id uuid,
  member_email text,
  member_display_name text,
  member_role text,
  member_status text,
  member_created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not passage_private.can_manage_partner_organization(p_partner_organization_id) then
    raise exception 'You do not have authority to view this vendor organization''s team'
      using errcode = '42501';
  end if;

  return query
  select pm.id, pm.user_id, pm.email, pm.display_name, pm.role, pm.status, pm.created_at
  from public.partner_members as pm
  where pm.partner_organization_id = p_partner_organization_id
  order by pm.created_at, pm.id;
end
$function$;

revoke all on function passage_private.list_partner_team_members(uuid) from public, anon, authenticated;
grant execute on function passage_private.list_partner_team_members(uuid) to authenticated;

create or replace function passage_private.list_partner_team_invitations(p_partner_organization_id uuid)
returns table (
  invitation_id uuid,
  invited_email text,
  purpose text,
  token_hint text,
  expires_at timestamptz,
  created_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not passage_private.can_manage_partner_organization(p_partner_organization_id) then
    raise exception 'You do not have authority to view this vendor organization''s invitations'
      using errcode = '42501';
  end if;

  return query
  select pi.id, pi.invited_email, pi.purpose, pi.token_hint, pi.expires_at, pi.created_at, pi.accepted_at, pi.revoked_at
  from public.partner_invitations as pi
  where pi.partner_organization_id = p_partner_organization_id
    and pi.accepted_at is null
    and pi.revoked_at is null
    and pi.expires_at > pg_catalog.clock_timestamp()
  order by pi.created_at desc, pi.id;
end
$function$;

revoke all on function passage_private.list_partner_team_invitations(uuid) from public, anon, authenticated;
grant execute on function passage_private.list_partner_team_invitations(uuid) to authenticated;

-- Pre-auth preview, same shape/purpose as inspect_organization_invitation:
-- lets the (possibly signed-out) accept page show who invited them and to
-- which vendor org before requiring sign-in.
create or replace function passage_private.inspect_partner_invitation(p_raw_token text)
returns table (
  inviter_display_name text,
  partner_organization_name text,
  invitation_purpose text,
  invitation_expires_at timestamptz,
  invitation_state text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(
      (select pm.display_name from public.partner_members as pm where pm.user_id = i.invited_by_user_id and pm.partner_organization_id = i.partner_organization_id limit 1),
      'A vendor administrator'
    ) as inviter_display_name,
    o.name as partner_organization_name,
    i.purpose as invitation_purpose,
    i.expires_at as invitation_expires_at,
    case
      when i.revoked_at is not null then 'revoked'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at <= pg_catalog.clock_timestamp() then 'expired'
      else 'available'
    end as invitation_state
  from public.partner_invitations as i
  join public.partner_organizations as o on o.id = i.partner_organization_id
  where i.token_digest = passage_private.hash_invitation_token(p_raw_token)
  limit 1
$$;

revoke all on function passage_private.inspect_partner_invitation(text) from public;
grant execute on function passage_private.inspect_partner_invitation(text) to anon, authenticated;

-- Create + accept follow create_employee_invitation_idempotent /
-- accept_organization_invitation's exact conventions: advisory-lock-guarded
-- two-layer idempotency (exact replay by creation_request_id, semantic
-- dedupe by still-pending org+email) on create; re-entrant accept that
-- tolerates a pre-existing partner_members row and requires the exact
-- verified invited email.
create or replace function passage_private.create_partner_employee_invitation_idempotent(
  p_partner_organization_id uuid,
  p_invited_email text,
  p_purpose text,
  p_expires_at timestamptz,
  p_creation_request_id uuid
)
returns table (
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamptz,
  created_at timestamptz,
  invitation_purpose text,
  inviter_display_name text,
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
  v_display_name text;
  v_raw_token text;
  v_token_digest text;
  v_token_hint text;
  v_invitation_id uuid;
  v_existing public.partner_invitations%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_creation_request_id is null then
    raise exception 'A creation request id is required' using errcode = '22023';
  end if;
  if not passage_private.can_manage_partner_organization(p_partner_organization_id) then
    raise exception 'You do not have authority to invite employees for this vendor organization'
      using errcode = '42501';
  end if;
  if v_email = '' or position('@' in v_email) < 2 then
    raise exception 'Enter a valid invited email address' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_purpose, ''))) = 0 then
    raise exception 'Explain why this vendor access is needed' using errcode = '22023';
  end if;
  if p_expires_at is null or p_expires_at <= v_now then
    raise exception 'Choose a valid future expiry' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_partner_organization_id::text || ':' || v_email, 0)
  );

  select i.* into v_existing
  from public.partner_invitations as i
  where i.partner_organization_id = p_partner_organization_id
    and i.creation_request_id = p_creation_request_id;

  if not found then
    select i.* into v_existing
    from public.partner_invitations as i
    where i.partner_organization_id = p_partner_organization_id
      and i.invited_email = v_email
      and i.accepted_at is null
      and i.revoked_at is null
      and i.expires_at > v_now
    order by i.created_at
    limit 1;
  end if;

  if found then
    select coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), 'A vendor administrator') into v_display_name
    from auth.users as u where u.id = v_existing.invited_by_user_id;
    return query select v_existing.id, null::text, v_existing.token_hint, v_existing.expires_at, v_existing.created_at,
      v_existing.purpose, v_display_name, 'pending'::text, true;
    return;
  end if;

  if exists (
    select 1 from public.partner_members as pm
    where pm.partner_organization_id = p_partner_organization_id and pm.email = v_email and pm.status = 'active'
  ) then
    raise exception 'That person already has active access to this vendor organization' using errcode = '23505';
  end if;

  select coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), 'A vendor administrator') into v_display_name
  from auth.users as u where u.id = v_actor_user_id;

  v_raw_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  v_token_digest := passage_private.hash_invitation_token(v_raw_token);
  v_token_hint := right(v_raw_token, 8);
  v_invitation_id := extensions.gen_random_uuid();

  insert into public.partner_invitations (
    id, partner_organization_id, invited_email, invited_by_user_id, purpose,
    token_digest, token_hint, expires_at, creation_request_id
  ) values (
    v_invitation_id, p_partner_organization_id, v_email, v_actor_user_id, btrim(p_purpose),
    v_token_digest, v_token_hint, p_expires_at, p_creation_request_id
  );

  return query select v_invitation_id, v_raw_token, v_token_hint, p_expires_at, v_now, btrim(p_purpose), v_display_name,
    'pending'::text, false;
end
$function$;

revoke all on function passage_private.create_partner_employee_invitation_idempotent(uuid, text, text, timestamptz, uuid) from public, anon, authenticated;
grant execute on function passage_private.create_partner_employee_invitation_idempotent(uuid, text, text, timestamptz, uuid) to authenticated;

create or replace function passage_private.accept_partner_invitation(p_raw_token text)
returns table (
  partner_member_id uuid,
  partner_organization_id uuid,
  member_role text,
  accepted_at timestamptz,
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
  v_invitation public.partner_invitations%rowtype;
  v_member public.partner_members%rowtype;
  v_member_count integer;
  v_accepted_at timestamptz;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if length(coalesce(p_raw_token, '')) < 32 then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  v_verified_email := passage_private.current_verified_email();
  select coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), nullif(btrim(u.raw_user_meta_data ->> 'name'), ''), split_part(v_verified_email, '@', 1))
    into v_display_name from auth.users as u where u.id = v_actor_user_id;

  select i.* into v_invitation from public.partner_invitations as i
    where i.token_digest = passage_private.hash_invitation_token(p_raw_token) for update;
  if not found then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;

  if v_invitation.accepted_at is not null then
    if v_invitation.accepted_by_user_id <> v_actor_user_id then
      raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
    end if;
    return query select v_invitation.accepted_partner_member_id, v_invitation.partner_organization_id, 'member'::text,
      v_invitation.accepted_at, true;
    return;
  end if;

  if v_invitation.revoked_at is not null or v_invitation.expires_at <= pg_catalog.clock_timestamp() then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  if v_invitation.invited_email <> v_verified_email then
    raise exception 'Sign in with the verified email address that received this invitation' using errcode = '42501';
  end if;

  perform pm.id from public.partner_members as pm
    where pm.partner_organization_id = v_invitation.partner_organization_id
      and (pm.user_id = v_actor_user_id or lower(btrim(pm.email)) = v_verified_email) for update;
  select count(*)::integer into v_member_count from public.partner_members as pm
    where pm.partner_organization_id = v_invitation.partner_organization_id
      and (pm.user_id = v_actor_user_id or lower(btrim(pm.email)) = v_verified_email);
  if v_member_count > 1 then
    raise exception 'Membership needs administrator review before this invitation can be accepted' using errcode = '23505';
  end if;

  -- A user already belonging to a different active vendor org can't also
  -- join this one -- partner_members has no cross-org multi-membership
  -- concept anywhere else in the app (self_serve_create_partner_organization
  -- enforces the same single-org rule at signup time).
  if exists (
    select 1 from public.partner_members as pm
    where pm.user_id = v_actor_user_id and pm.status = 'active' and pm.partner_organization_id <> v_invitation.partner_organization_id
  ) then
    raise exception 'This account already belongs to a different active vendor organization' using errcode = '23505';
  end if;

  v_accepted_at := pg_catalog.clock_timestamp();
  if v_member_count = 1 then
    select pm.* into v_member from public.partner_members as pm
      where pm.partner_organization_id = v_invitation.partner_organization_id
        and (pm.user_id = v_actor_user_id or lower(btrim(pm.email)) = v_verified_email) limit 1;
    if v_member.user_id is not null and v_member.user_id <> v_actor_user_id then
      raise exception 'Membership is already bound to another account' using errcode = '42501';
    end if;
    update public.partner_members as pm set user_id = v_actor_user_id, email = v_verified_email, status = 'active',
      display_name = coalesce(nullif(pm.display_name, ''), v_display_name), updated_at = v_accepted_at
      where pm.id = v_member.id returning pm.* into v_member;
  else
    insert into public.partner_members (
      partner_organization_id, user_id, email, display_name, role, status, created_at, updated_at
    ) values (
      v_invitation.partner_organization_id, v_actor_user_id, v_verified_email, v_display_name, 'member', 'active', v_accepted_at, v_accepted_at
    ) returning * into v_member;
  end if;

  update public.partner_invitations as i set accepted_at = v_accepted_at, accepted_by_user_id = v_actor_user_id,
    accepted_partner_member_id = v_member.id
    where i.id = v_invitation.id and i.accepted_at is null and i.revoked_at is null;
  if not found then
    raise exception 'Invitation changed while it was being accepted' using errcode = '40001';
  end if;

  return query select v_member.id, v_invitation.partner_organization_id, v_member.role, v_accepted_at, false;
end
$function$;

revoke all on function passage_private.accept_partner_invitation(text) from public, anon, authenticated;
grant execute on function passage_private.accept_partner_invitation(text) to authenticated;

create or replace function passage_private.revoke_partner_invitation(p_invitation_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_invitation public.partner_invitations%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'A revocation reason is required' using errcode = '22023';
  end if;

  select i.* into v_invitation from public.partner_invitations as i where i.id = p_invitation_id for update;
  if not found then
    raise exception 'Invitation is invalid or unavailable' using errcode = '22023';
  end if;
  if not passage_private.can_manage_partner_organization(v_invitation.partner_organization_id) then
    raise exception 'You do not have authority to revoke this invitation' using errcode = '42501';
  end if;
  if v_invitation.accepted_at is not null or v_invitation.revoked_at is not null then
    return;
  end if;

  update public.partner_invitations set revoked_at = pg_catalog.clock_timestamp(), revoked_by_user_id = v_actor_user_id,
    revocation_reason = btrim(p_reason)
    where id = p_invitation_id and accepted_at is null and revoked_at is null;
end
$function$;

revoke all on function passage_private.revoke_partner_invitation(uuid, text) from public, anon, authenticated;
grant execute on function passage_private.revoke_partner_invitation(uuid, text) to authenticated;

-- Thin SQL wrappers matching the funeral-home pattern (security invoker,
-- search_path='') so client.rpc() calls resolve in the public schema.
create or replace function public.can_manage_partner_organization(partner_organization_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select passage_private.can_manage_partner_organization(partner_organization_id)
$$;

create or replace function public.list_partner_team_members(partner_organization_id uuid)
returns table (member_id uuid, member_user_id uuid, member_email text, member_display_name text, member_role text, member_status text, member_created_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select * from passage_private.list_partner_team_members(partner_organization_id)
$$;

create or replace function public.list_partner_team_invitations(partner_organization_id uuid)
returns table (invitation_id uuid, invited_email text, purpose text, token_hint text, expires_at timestamptz, created_at timestamptz, accepted_at timestamptz, revoked_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select * from passage_private.list_partner_team_invitations(partner_organization_id)
$$;

create or replace function public.inspect_partner_invitation(raw_token text)
returns table (inviter_display_name text, partner_organization_name text, invitation_purpose text, invitation_expires_at timestamptz, invitation_state text)
language sql stable security invoker set search_path = '' as $$
  select * from passage_private.inspect_partner_invitation(raw_token)
$$;

create or replace function public.create_partner_employee_invitation_idempotent(
  p_partner_organization_id uuid, p_invited_email text, p_purpose text, p_expires_at timestamptz, p_creation_request_id uuid
)
returns table (invitation_id uuid, raw_token text, token_hint text, expires_at timestamptz, created_at timestamptz, invitation_purpose text, inviter_display_name text, invitation_state text, replayed boolean)
language sql security invoker set search_path = '' as $$
  select * from passage_private.create_partner_employee_invitation_idempotent(p_partner_organization_id, p_invited_email, p_purpose, p_expires_at, p_creation_request_id)
$$;

create or replace function public.accept_partner_invitation(raw_token text)
returns table (partner_member_id uuid, partner_organization_id uuid, member_role text, accepted_at timestamptz, replayed boolean)
language sql security invoker set search_path = '' as $$
  select * from passage_private.accept_partner_invitation(raw_token)
$$;

create or replace function public.revoke_partner_invitation(invitation_id uuid, reason text)
returns void language sql security invoker set search_path = '' as $$
  select passage_private.revoke_partner_invitation(invitation_id, reason)
$$;

revoke all on function public.can_manage_partner_organization(uuid) from public, anon;
revoke all on function public.list_partner_team_members(uuid) from public, anon;
revoke all on function public.list_partner_team_invitations(uuid) from public, anon;
revoke all on function public.inspect_partner_invitation(text) from public;
revoke all on function public.create_partner_employee_invitation_idempotent(uuid, text, text, timestamptz, uuid) from public, anon;
revoke all on function public.accept_partner_invitation(text) from public, anon;
revoke all on function public.revoke_partner_invitation(uuid, text) from public, anon;

grant execute on function public.can_manage_partner_organization(uuid) to authenticated;
grant execute on function public.list_partner_team_members(uuid) to authenticated;
grant execute on function public.list_partner_team_invitations(uuid) to authenticated;
grant execute on function public.inspect_partner_invitation(text) to anon, authenticated;
grant execute on function public.create_partner_employee_invitation_idempotent(uuid, text, text, timestamptz, uuid) to authenticated;
grant execute on function public.accept_partner_invitation(text) to authenticated;
grant execute on function public.revoke_partner_invitation(uuid, text) to authenticated;
