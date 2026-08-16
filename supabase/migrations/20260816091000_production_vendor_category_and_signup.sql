-- Reconciles the vendor category taxonomy with the founder's new HubSpot
-- "Vendor Category" property (Florist, Caterer, Restaurant, Cemetery,
-- Transport, Printer/Stationery, Memorial Products, Other) and adds the
-- self-serve vendor sign-up flow that was entirely missing -- confirmed no
-- app code anywhere creates a partner_organizations row; every vendor org
-- that exists was created directly in the database. Both category-check
-- tables are empty in production, so widening the constraint is safe.

alter table public.partner_organizations drop constraint partner_organizations_category_check;
alter table public.partner_organizations add constraint partner_organizations_category_check
  check (category in ('florist', 'caterer', 'restaurant', 'cemetery', 'transport', 'printer_stationery', 'memorial_products', 'other'));

alter table public.partner_requests drop constraint partner_requests_category_check;
alter table public.partner_requests add constraint partner_requests_category_check
  check (category in ('florist', 'caterer', 'restaurant', 'cemetery', 'transport', 'printer_stationery', 'memorial_products', 'other'));

create or replace function passage_private.create_partner_request_idempotent(p_workflow_id uuid, p_partner_organization_id uuid, p_category text, p_title text, p_details text, p_needed_by timestamp with time zone, p_request_id uuid)
 RETURNS TABLE(partner_request_id uuid, status text, version integer, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_actor_member_id uuid;
  v_workflow public.workflows%rowtype;
  v_partner_org public.partner_organizations%rowtype;
  v_existing public.partner_requests%rowtype;
  v_new_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_workflow_id is null or p_partner_organization_id is null or p_request_id is null
     or p_category is null or p_category not in ('florist', 'caterer', 'restaurant', 'cemetery', 'transport', 'printer_stationery', 'memorial_products', 'other')
     or length(btrim(coalesce(p_title, ''))) not between 1 and 200
     or length(btrim(coalesce(p_details, ''))) not between 1 and 2000 then
    raise exception 'Valid request details are required' using errcode = '22023';
  end if;

  select w.* into v_workflow from public.workflows as w where w.id = p_workflow_id;
  if v_workflow.id is null then
    raise exception 'Case is unavailable' using errcode = '42501';
  end if;
  if not passage_private.can_manage_location(v_workflow.organization_id, v_workflow.organization_location_id) then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;
  v_actor_member_id := passage_private.current_active_member_id(v_workflow.organization_id);
  if v_actor_member_id is null then
    raise exception 'Director authority for this case is required' using errcode = '42501';
  end if;

  select po.* into v_partner_org from public.partner_organizations as po
  where po.id = p_partner_organization_id and po.status = 'active';
  if v_partner_org.id is null then
    raise exception 'Vendor is unavailable' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_workflow.organization_id::text || ':partner_request_create:' || p_request_id::text, 0)
  );

  select r.* into v_existing from public.partner_requests as r
  where r.organization_id = v_workflow.organization_id and r.creation_request_id = p_request_id;
  if found then
    if v_existing.workflow_id is distinct from p_workflow_id
       or v_existing.partner_organization_id is distinct from p_partner_organization_id
       or v_existing.category is distinct from p_category
       or v_existing.title is distinct from btrim(p_title)
       or v_existing.details is distinct from btrim(p_details) then
      raise exception 'Request conflicts with an earlier command' using errcode = '22023';
    end if;
    return query select v_existing.id, v_existing.status, v_existing.version, true;
    return;
  end if;

  insert into public.partner_requests (
    organization_id, organization_location_id, workflow_id, partner_organization_id,
    created_by_organization_member_id, category, title, details, needed_by,
    status, version, creation_request_id, sent_at
  ) values (
    v_workflow.organization_id, v_workflow.organization_location_id, v_workflow.id, p_partner_organization_id,
    v_actor_member_id, p_category, btrim(p_title), btrim(p_details), p_needed_by,
    'sent', 1, p_request_id, pg_catalog.clock_timestamp()
  ) returning id into v_new_id;

  insert into public.partner_request_events (
    partner_request_id, organization_id, partner_organization_id,
    actor_user_id, actor_organization_member_id, name, previous_state, next_state,
    idempotency_key, metadata
  ) values (
    v_new_id, v_workflow.organization_id, p_partner_organization_id,
    v_actor_user_id, v_actor_member_id, 'partner_request.sent', null, 'sent',
    'partner_request_create:' || p_request_id::text,
    pg_catalog.jsonb_build_object('category', p_category, 'title', btrim(p_title))
  );

  return query select v_new_id, 'sent'::text, 1, false;
end
$function$;

-- Self-serve vendor sign-up, mirroring self_serve_create_organization's
-- pattern: an authenticated user with no existing active vendor membership
-- becomes the founding owner of a new partner organization.
create or replace function passage_private.self_serve_create_partner_organization(
  p_organization_name text,
  p_category text,
  p_contact_email text,
  p_contact_phone text
)
returns table (partner_organization_id uuid, partner_member_id uuid)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_email text := passage_private.current_verified_email();
  v_display_name text;
  v_org public.partner_organizations%rowtype;
  v_member_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_email is null then
    raise exception 'A verified email address is required' using errcode = '42501';
  end if;
  if exists (select 1 from public.partner_members where user_id = v_actor and status = 'active') then
    raise exception 'This account already belongs to an active vendor organization' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_organization_name, ''))) not between 1 and 200
     or p_category is null or p_category not in ('florist', 'caterer', 'restaurant', 'cemetery', 'transport', 'printer_stationery', 'memorial_products', 'other') then
    raise exception 'Review the organization name and category' using errcode = '22023';
  end if;

  select coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), v_email) into v_display_name
  from auth.users as u where u.id = v_actor;

  insert into public.partner_organizations (name, category, contact_email, contact_phone)
  values (btrim(p_organization_name), p_category, nullif(btrim(coalesce(p_contact_email, '')), ''), nullif(btrim(coalesce(p_contact_phone, '')), ''))
  returning * into v_org;

  insert into public.partner_members (partner_organization_id, user_id, email, display_name, role)
  values (v_org.id, v_actor, v_email, v_display_name, 'owner')
  returning id into v_member_id;

  return query select v_org.id, v_member_id;
end
$function$;

create or replace function public.self_serve_create_partner_organization(
  p_organization_name text, p_category text, p_contact_email text, p_contact_phone text
)
returns table (partner_organization_id uuid, partner_member_id uuid)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.self_serve_create_partner_organization(p_organization_name, p_category, p_contact_email, p_contact_phone)
$function$;

revoke all on function passage_private.self_serve_create_partner_organization(text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function passage_private.self_serve_create_partner_organization(text, text, text, text) to authenticated;
revoke all on function public.self_serve_create_partner_organization(text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.self_serve_create_partner_organization(text, text, text, text) to authenticated;
