-- Platform admin org bootstrap.
--
-- Nothing in this codebase creates a new organization: every RPC that
-- touches organizations, locations, or invitations requires an existing
-- active member of that organization (passage_private.can_manage_organization).
-- That's correct for steady-state operation but leaves no path at all for
-- onboarding a brand-new funeral home - not even an admin-only one. This
-- migration adds the minimum needed: a platform_admins allowlist and a
-- SECURITY DEFINER function that creates the organization, its first
-- location, and a director invitation in one transaction. The invitation
-- reuses the existing organization_invitations / accept_organization_invitation
-- machinery rather than inserting organization_members directly, so
-- acceptance, location scoping, and audit history all behave exactly like
-- a normal staff invitation - just with role='director' on a fresh org.

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
-- No policies: this table is only ever read via SECURITY DEFINER functions.

insert into public.platform_admins (user_id)
values ('04a39efc-306d-41e3-b7cd-41bfdb352517')
on conflict (user_id) do nothing;

create or replace function passage_private.admin_bootstrap_organization(
  p_organization_name text,
  p_location_name text,
  p_director_email text,
  p_purpose text default 'New funeral home onboarding.',
  p_expires_at timestamptz default (now() + interval '14 days')
)
returns table(
  organization_id uuid,
  organization_location_id uuid,
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_org_name text := btrim(coalesce(p_organization_name, ''));
  v_location_name text := btrim(coalesce(p_location_name, ''));
  v_email text := lower(btrim(coalesce(p_director_email, '')));
  v_org_id uuid;
  v_location_id uuid;
  v_invitation_id uuid;
  v_raw_token text;
  v_token_digest text;
  v_token_hint text;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (select 1 from public.platform_admins where user_id = v_actor_user_id) then
    raise exception 'Platform admin authority is required' using errcode = '42501';
  end if;

  if v_org_name = '' or length(v_org_name) > 200 then
    raise exception 'A valid organization name is required' using errcode = '22023';
  end if;
  if v_location_name = '' or length(v_location_name) > 200 then
    raise exception 'A valid first location name is required' using errcode = '22023';
  end if;
  if length(v_email) > 320 or position('@' in v_email) <= 1 then
    raise exception 'A valid director email address is required' using errcode = '22023';
  end if;
  if p_expires_at is null
     or p_expires_at <= clock_timestamp() + interval '15 minutes'
     or p_expires_at > clock_timestamp() + interval '30 days' then
    raise exception 'Invitation expiry must be between 15 minutes and 30 days from now' using errcode = '22023';
  end if;

  insert into public.organizations (name)
  values (v_org_name)
  returning id into v_org_id;

  insert into public.organization_locations (organization_id, name)
  values (v_org_id, v_location_name)
  returning id into v_location_id;

  v_raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_digest := passage_private.hash_invitation_token(v_raw_token);
  v_token_hint := right(v_raw_token, 8);
  v_invitation_id := extensions.gen_random_uuid();

  insert into public.organization_invitations (
    id, organization_id, invited_email, role, purpose,
    invited_by_user_id, token_digest, token_hint, expires_at
  ) values (
    v_invitation_id, v_org_id, v_email, 'director', btrim(coalesce(p_purpose, 'New funeral home onboarding.')),
    v_actor_user_id, v_token_digest, v_token_hint, p_expires_at
  );

  insert into public.organization_invitation_locations (invitation_id, organization_location_id)
  values (v_invitation_id, v_location_id);

  return query select v_org_id, v_location_id, v_invitation_id, v_raw_token, v_token_hint, p_expires_at;
end;
$$;

create or replace function public.admin_bootstrap_organization(
  p_organization_name text,
  p_location_name text,
  p_director_email text,
  p_purpose text default 'New funeral home onboarding.',
  p_expires_at timestamptz default (now() + interval '14 days')
)
returns table(
  organization_id uuid,
  organization_location_id uuid,
  invitation_id uuid,
  raw_token text,
  token_hint text,
  expires_at timestamptz
)
language sql
set search_path to ''
as $$
  select * from passage_private.admin_bootstrap_organization(
    p_organization_name, p_location_name, p_director_email, p_purpose, p_expires_at
  )
$$;
