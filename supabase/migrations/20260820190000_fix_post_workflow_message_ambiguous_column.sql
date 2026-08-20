-- post_workflow_message_idempotent's RETURNING clause referenced bare
-- `occurred_at`, which is ambiguous between the function's own
-- RETURNS TABLE(..., occurred_at, ...) output parameter and the
-- workflow_messages.occurred_at column -- Postgres error 42702,
-- "column reference occurred_at is ambiguous". This broke posting a
-- message on every case, for every sender (family and staff alike),
-- 100% of the time; found live via a founder screenshot of "Passage
-- could not add this message." Fixed by aliasing the insert target and
-- qualifying both RETURNING columns.
CREATE OR REPLACE FUNCTION passage_private.post_workflow_message_idempotent(p_workflow_id uuid, p_body text, p_request_id uuid)
 RETURNS TABLE(message_id uuid, occurred_at timestamp with time zone, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor uuid := (select auth.uid());
  v_workflow public.workflows%rowtype;
  v_member public.organization_members%rowtype;
  v_estate_role text;
  v_sender_kind text;
  v_sender_member_id uuid;
  v_sender_label text;
  v_existing public.workflow_messages%rowtype;
  v_new_id uuid;
  v_occurred_at timestamp with time zone;
  v_body text := btrim(coalesce(p_body, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_workflow_id is null or p_request_id is null or length(v_body) not between 1 and 4000 then
    raise exception 'A message is required' using errcode = '22023';
  end if;

  select w.* into v_workflow from public.workflows as w where w.id = p_workflow_id;
  if v_workflow.id is null or not passage_private.can_message_workflow(p_workflow_id) then
    raise exception 'You are not authorized to message on this case' using errcode = '42501';
  end if;

  select m.* into v_member from public.organization_members as m
  where m.organization_id = v_workflow.organization_id
    and m.user_id = v_actor
    and m.status = 'active';

  if v_member.id is not null then
    v_sender_kind := 'staff';
    v_sender_member_id := v_member.id;
    v_sender_label := case when v_member.role in ('owner', 'director') then 'Director' else 'Staff member' end;
  else
    v_sender_kind := 'family';
    select ea.role into v_estate_role from public.estate_access as ea
    where ea.workflow_id = p_workflow_id and ea.user_id = v_actor
      and coalesce(ea.status, 'accepted') not in ('revoked', 'removed', 'declined')
    limit 1;
    v_sender_label := case when v_estate_role = 'owner' or v_workflow.user_id = v_actor then 'Family' else 'Family member' end;
  end if;
  v_sender_label := left(v_sender_label, 48);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_workflow_id::text || ':workflow_message_post:' || p_request_id::text, 0)
  );

  select msg.* into v_existing from public.workflow_messages as msg
  where msg.workflow_id = p_workflow_id and msg.creation_request_id = p_request_id;
  if found then
    if v_existing.sender_user_id is distinct from v_actor or v_existing.body is distinct from v_body then
      raise exception 'This request was already used for a different message' using errcode = '22023';
    end if;
    return query select v_existing.id, v_existing.occurred_at, true;
    return;
  end if;

  insert into public.workflow_messages as msg (
    workflow_id, organization_id, sender_kind, sender_user_id,
    sender_organization_member_id, sender_label, body, creation_request_id, occurred_at
  ) values (
    p_workflow_id, v_workflow.organization_id, v_sender_kind, v_actor,
    v_sender_member_id, v_sender_label, v_body, p_request_id, pg_catalog.clock_timestamp()
  ) returning msg.id, msg.occurred_at into v_new_id, v_occurred_at;

  return query select v_new_id, v_occurred_at, false;
end
$function$;
