-- Captures city/state on a funeral home's first location at self-serve
-- signup time. Currently every real organization in production has a null
-- city/state on its location, because nothing ever asked for it -- found
-- while scoping a future public funeral-home directory: there is no location
-- data to show yet, and this is the actual blocker. Optional (defaults to
-- null) so existing behavior for a visitor who skips it is unchanged.

create or replace function passage_private.self_serve_create_organization(
  p_organization_name text,
  p_location_name text,
  p_city text default null,
  p_state text default null
)
returns table(
  organization_id uuid,
  organization_location_id uuid,
  organization_member_id uuid
)
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_email text;
  v_org_name text := btrim(coalesce(p_organization_name, ''));
  v_location_name text := btrim(coalesce(p_location_name, ''));
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_state text := nullif(btrim(coalesce(p_state, '')), '');
  v_org_id uuid;
  v_location_id uuid;
  v_member_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select email into v_actor_email from auth.users where id = v_actor_user_id;
  if v_actor_email is null then
    raise exception 'A verified account email is required' using errcode = '28000';
  end if;

  if v_org_name = '' or length(v_org_name) > 200 then
    raise exception 'A valid organization name is required' using errcode = '22023';
  end if;
  if v_location_name = '' or length(v_location_name) > 200 then
    raise exception 'A valid first location name is required' using errcode = '22023';
  end if;
  if v_city is not null and length(v_city) > 100 then
    raise exception 'City is too long' using errcode = '22023';
  end if;
  if v_state is not null and length(v_state) > 56 then
    raise exception 'State is too long' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.organization_members
    where user_id = v_actor_user_id and status = 'active'
  ) then
    raise exception 'This account already belongs to an active organization' using errcode = '22023';
  end if;

  insert into public.organizations (name, created_by)
  values (v_org_name, v_actor_user_id)
  returning id into v_org_id;

  insert into public.organization_locations (organization_id, name, city, state)
  values (v_org_id, v_location_name, v_city, v_state)
  returning id into v_location_id;

  insert into public.organization_members (organization_id, user_id, email, role, status, accepted_at)
  values (v_org_id, v_actor_user_id, v_actor_email, 'owner', 'active', now())
  returning id into v_member_id;

  insert into public.organization_member_locations (organization_member_id, organization_location_id, granted_by_user_id)
  values (v_member_id, v_location_id, v_actor_user_id);

  return query select v_org_id, v_location_id, v_member_id;
end;
$$;

create or replace function public.self_serve_create_organization(
  p_organization_name text,
  p_location_name text,
  p_city text default null,
  p_state text default null
)
returns table(
  organization_id uuid,
  organization_location_id uuid,
  organization_member_id uuid
)
language sql
set search_path to ''
as $$
  select * from passage_private.self_serve_create_organization(p_organization_name, p_location_name, p_city, p_state)
$$;
