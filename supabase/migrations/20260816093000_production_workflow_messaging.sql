-- Production-safe port of the cross-persona workflow messaging feature
-- (PR #74, unmerged, built 2026-07-28 against greenfield/passage-zero).
-- That PR's design assumed the lab-only continuity_spaces/continuity_participants
-- system for family authorization; production never had that system ported
-- (this session used estate_access/case_family_invitations instead). Adapts
-- the messaging authorization and sender-resolution logic to use
-- estate_access + workflows.user_id, the mechanism that actually exists in
-- production, while keeping the same table shape, RPC contract, append-only
-- trigger, and least-privilege client projection design as the original PR.

create table public.workflow_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  sender_kind text not null check (sender_kind in ('staff', 'family')),
  sender_user_id uuid not null references auth.users (id),
  sender_organization_member_id uuid references public.organization_members (id),
  sender_label text not null check (length(btrim(sender_label)) between 1 and 48),
  body text not null check (length(btrim(body)) between 1 and 4000),
  creation_request_id uuid not null,
  occurred_at timestamp with time zone not null default pg_catalog.clock_timestamp(),
  created_at timestamp with time zone not null default pg_catalog.clock_timestamp(),
  unique (workflow_id, creation_request_id),
  constraint workflow_messages_sender_shape check (
    (sender_kind = 'staff' and sender_organization_member_id is not null)
    or (sender_kind = 'family' and sender_organization_member_id is null)
  )
);
comment on table public.workflow_messages is 'Append-only per-workflow message thread. No direct client table access -- client reads use public.list_workflow_messages_client_safe, which returns a bounded projection after passage_private.can_message_workflow() is checked.';

create index workflow_messages_workflow_idx on public.workflow_messages (workflow_id, occurred_at);

create or replace function passage_private.reject_workflow_message_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'workflow_messages is append-only';
end
$$;

create trigger workflow_messages_append_only
  before update or delete on public.workflow_messages
  for each row execute function passage_private.reject_workflow_message_mutation();

alter table public.workflow_messages enable row level security;
revoke all on table public.workflow_messages from public, anon, authenticated;

-- Message-specific authority: D2C case owner, active estate_access
-- participant (accepted via case_family_invitations or otherwise), managed-
-- location director/owner, or currently-assigned active staff.
create or replace function passage_private.can_message_workflow(p_workflow_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.workflows as w
    where w.id = p_workflow_id
      and (
        w.user_id = (select auth.uid())
        or exists (
          select 1 from public.estate_access as ea
          where ea.workflow_id = w.id
            and ea.user_id = (select auth.uid())
            and coalesce(ea.status, 'accepted') not in ('revoked', 'removed', 'declined')
        )
        or (
          w.organization_id is not null
          and w.organization_location_id is not null
          and (
            passage_private.can_manage_location(w.organization_id, w.organization_location_id)
            or exists (
              select 1
              from public.organization_members as m
              join public.organization_member_locations as ml
                on ml.organization_member_id = m.id
               and ml.organization_location_id = w.organization_location_id
               and ml.revoked_at is null
              where m.organization_id = w.organization_id
                and m.user_id = (select auth.uid())
                and m.status = 'active'
                and m.role = 'staff'
                and exists (
                  select 1 from public.tasks as t
                  where t.workflow_id = w.id and t.assigned_organization_member_id = m.id
                )
            )
          )
        )
      )
  )
$function$;

revoke all on function passage_private.can_message_workflow(uuid) from public, anon, authenticated, service_role;

create or replace function passage_private.list_workflow_messages_client_safe(p_workflow_id uuid)
returns table (
  message_id uuid,
  sender_kind text,
  sender_label text,
  body text,
  occurred_at timestamp with time zone,
  is_own boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_workflow_id is null or not passage_private.can_message_workflow(p_workflow_id) then
    raise exception 'This case is not available to your account' using errcode = '42501';
  end if;

  return query
  select msg.id, msg.sender_kind, msg.sender_label, msg.body, msg.occurred_at, msg.sender_user_id = v_actor
  from public.workflow_messages as msg
  where msg.workflow_id = p_workflow_id
  order by msg.occurred_at, msg.id;
end
$function$;

create or replace function public.list_workflow_messages_client_safe(p_workflow_id uuid)
returns table (
  message_id uuid, sender_kind text, sender_label text, body text,
  occurred_at timestamp with time zone, is_own boolean
)
language sql stable security invoker set search_path = ''
as $function$
  select * from passage_private.list_workflow_messages_client_safe(p_workflow_id)
$function$;

create or replace function passage_private.post_workflow_message_idempotent(
  p_workflow_id uuid,
  p_body text,
  p_request_id uuid
)
returns table (message_id uuid, occurred_at timestamp with time zone, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
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

  insert into public.workflow_messages (
    workflow_id, organization_id, sender_kind, sender_user_id,
    sender_organization_member_id, sender_label, body, creation_request_id, occurred_at
  ) values (
    p_workflow_id, v_workflow.organization_id, v_sender_kind, v_actor,
    v_sender_member_id, v_sender_label, v_body, p_request_id, pg_catalog.clock_timestamp()
  ) returning id, occurred_at into v_new_id, v_occurred_at;

  return query select v_new_id, v_occurred_at, false;
end
$function$;

create or replace function public.post_workflow_message_idempotent(
  p_workflow_id uuid, p_body text, p_request_id uuid
)
returns table (message_id uuid, occurred_at timestamp with time zone, replayed boolean)
language sql volatile security invoker set search_path = ''
as $function$
  select * from passage_private.post_workflow_message_idempotent(p_workflow_id, p_body, p_request_id)
$function$;

revoke all on function passage_private.list_workflow_messages_client_safe(uuid) from public, anon, authenticated, service_role;
revoke all on function public.list_workflow_messages_client_safe(uuid) from public, anon, authenticated, service_role;
grant execute on function passage_private.list_workflow_messages_client_safe(uuid) to authenticated;
grant execute on function public.list_workflow_messages_client_safe(uuid) to authenticated;

revoke all on function passage_private.post_workflow_message_idempotent(uuid,text,uuid) from public, anon, authenticated, service_role;
revoke all on function public.post_workflow_message_idempotent(uuid,text,uuid) from public, anon, authenticated, service_role;
grant execute on function passage_private.post_workflow_message_idempotent(uuid,text,uuid) to authenticated;
grant execute on function public.post_workflow_message_idempotent(uuid,text,uuid) to authenticated;
