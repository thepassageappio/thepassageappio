-- Fix (PR #57 adversarial QA finding, Medium): partner_requests.category was
-- never validated against the target vendor's own partner_organizations.category
-- anywhere in the stack. Reproduced live: a transport job was saved with
-- category='florist' and accepted by a florist-only vendor with no error at
-- any layer. This patches the authoritative RPC (create_partner_request_idempotent)
-- to reject a category that doesn't match the chosen vendor's specialty.
create or replace function passage_private.create_partner_request_idempotent(
  p_workflow_id uuid,
  p_partner_organization_id uuid,
  p_category text,
  p_title text,
  p_details text,
  p_needed_by timestamptz,
  p_request_id uuid
)
returns table (partner_request_id uuid, status text, version integer, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
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
     or p_category is null or p_category not in ('florist', 'catering', 'transport', 'memorial_products', 'other')
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

  -- Fix: category must match the vendor's own declared specialty.
  if p_category is distinct from v_partner_org.category then
    raise exception 'This vendor does not handle that category of request' using errcode = 'PS001';
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

grant execute on function passage_private.create_partner_request_idempotent(uuid, uuid, text, text, text, timestamptz, uuid) to authenticated;
