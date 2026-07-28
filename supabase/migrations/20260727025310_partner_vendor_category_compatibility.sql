-- Passage Zero Release Packet 1: vendor category/specialty compatibility.
--
-- What changes:
-- - every partner request must use the active vendor organization's category;
-- - a table trigger blocks direct writes that bypass the command;
-- - the existing idempotent command resolves replay before checking mutable
--   current vendor state, then rejects a mismatched category for new work.
--
-- Why the UI needs it:
-- the director chooses a vendor, and the request service is derived from that
-- vendor. Without this database check, a manipulated form/RPC can silently
-- route a request to a vendor that does not provide that service. Resolving an
-- existing request first also keeps an exact replay stable after a vendor
-- changes specialty or availability.
--
-- Recovery:
-- drop the trigger/function and restore the prior command definition. No row
-- rewrite occurs. Historical requests intentionally keep the category that was
-- authoritative when they were sent, even if the vendor later changes specialty.
--
-- Data boundary:
-- additive DDL/function replacement only. No customer/Production data, auth
-- credential, external message, or fixture row is created.

do $partner_category_preflight$
begin
  if to_regclass('public.partner_organizations') is null
     or to_regclass('public.partner_requests') is null
     or to_regprocedure('passage_private.create_partner_request_idempotent(uuid,uuid,text,text,text,timestamptz,uuid)') is null then
    raise exception 'Partner category compatibility requires the vendor thin slice'
      using errcode = '55000';
  end if;

end
$partner_category_preflight$;

create or replace function passage_private.enforce_partner_request_category()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_category text;
  v_status text;
begin
  select organization.category, organization.status
    into v_category, v_status
  from public.partner_organizations as organization
  where organization.id = new.partner_organization_id;

  if v_category is null or v_status <> 'active' then
    raise exception 'Vendor is unavailable' using errcode = 'PS001';
  end if;
  if new.category is distinct from v_category then
    raise exception 'Request service does not match the selected vendor'
      using errcode = '23514';
  end if;
  return new;
end
$function$;

revoke all
on function passage_private.enforce_partner_request_category()
from public, anon, authenticated, service_role;

drop trigger if exists partner_requests_category_guard on public.partner_requests;
create trigger partner_requests_category_guard
  before insert or update of partner_organization_id, category
  on public.partner_requests
  for each row execute function passage_private.enforce_partner_request_category();

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

  select workflow.* into v_workflow
  from public.workflows as workflow
  where workflow.id = p_workflow_id;
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_workflow.organization_id::text || ':partner_request_create:' || p_request_id::text, 0)
  );

  select request.* into v_existing
  from public.partner_requests as request
  where request.organization_id = v_workflow.organization_id
    and request.creation_request_id = p_request_id;
  if found then
    if v_existing.workflow_id is distinct from p_workflow_id
       or v_existing.partner_organization_id is distinct from p_partner_organization_id
       or v_existing.category is distinct from p_category
       or v_existing.title is distinct from btrim(p_title)
       or v_existing.details is distinct from btrim(p_details)
       or v_existing.needed_by is distinct from p_needed_by then
      raise exception 'Request conflicts with an earlier command' using errcode = '22023';
    end if;
    return query select v_existing.id, v_existing.status, v_existing.version, true;
    return;
  end if;

  select organization.* into v_partner_org
  from public.partner_organizations as organization
  where organization.id = p_partner_organization_id
    and organization.status = 'active';
  if v_partner_org.id is null then
    raise exception 'Vendor is unavailable' using errcode = 'PS001';
  end if;
  if v_partner_org.category is distinct from p_category then
    raise exception 'Request service does not match the selected vendor'
      using errcode = '23514';
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
