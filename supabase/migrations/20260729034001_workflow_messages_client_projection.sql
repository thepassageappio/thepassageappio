-- Passage Zero: least-privilege workflow-message projection and replay hardening.
--
-- WHAT
-- - Remove authenticated SELECT access to public.workflow_messages and drop
--   its client-facing SELECT policy.
-- - Add a message-specific workflow predicate. Family-space owners,
--   updates-scoped active participants, managed-location directors, and
--   currently assigned active staff are the only allowed identities.
-- - Add one authenticated RPC that returns only the message id, sender kind,
--   plain-language sender label, body, occurred time, and server-computed
--   is_own flag after re-checking passage_private.can_view_workflow().
-- - Reduce the server-derived sender-label limit to 48 characters.
-- - Make post replay compare the authenticated actor and normalized body so a
--   reused request id with different input fails instead of returning another
--   actor's receipt or silently accepting a conflicting payload.
--
-- WHY
-- Row-level security limits rows, not columns. The original table grant let an
-- authorized browser request sender_user_id, organization-member/participant
-- ids, and creation_request_id even though the application loader did not
-- return those fields. The public RPC is the only client read surface after
-- this migration and cannot project those internal identity columns.
--
-- BREAKAGE IF SKIPPED
-- An authorized case viewer can enumerate internal identity and command ids;
-- a participant without updates permission or an unassigned staff member can
-- use broader case visibility as unintended messaging authority;
-- a colliding request id can disclose a prior receipt or hide a conflicting
-- retry; and an unbounded relationship label can damage the responsive thread.
--
-- RISK / RECOVERY
-- Existing server code that reads workflow_messages directly with the
-- authenticated role must move to list_workflow_messages_client_safe. Database
-- owners retain normal maintenance access. The migration fails closed if a
-- pre-existing sender label cannot satisfy the narrower constraint. Recovery
-- is a reviewed follow-up migration; never restore client table SELECT.

do $workflow_message_projection_preflight$
begin
  if to_regclass('public.workflow_messages') is null
     or to_regprocedure(
       'passage_private.post_workflow_message_idempotent(uuid,text,uuid)'
     ) is null
     or to_regprocedure(
       'public.post_workflow_message_idempotent(uuid,text,uuid)'
     ) is null
     or to_regprocedure('passage_private.can_view_workflow(uuid)') is null then
    raise exception using
      errcode = '55000',
      message = 'Workflow message projection refused: required messaging lineage is missing';
  end if;

  if exists (
    select 1
    from public.workflow_messages as message_row
    where length(btrim(message_row.sender_label)) > 48
  ) then
    raise exception using
      errcode = '23514',
      message = 'Workflow message projection refused: an existing sender label exceeds 48 characters';
  end if;
end
$workflow_message_projection_preflight$;

-- RLS is not column security. Remove the direct browser read surface entirely;
-- the checked RPC below is now the sole authenticated projection.
drop policy if exists workflow_messages_authorized_select
  on public.workflow_messages;
revoke select on table public.workflow_messages from authenticated;

comment on table public.workflow_messages is
  'Append-only internal workflow-message store. Authenticated clients have no direct table access; client reads use public.list_workflow_messages_client_safe, which returns a bounded projection after workflow authority is checked.';

alter table public.workflow_messages
  drop constraint if exists workflow_messages_sender_label_check;
alter table public.workflow_messages
  drop constraint if exists workflow_messages_sender_label_length_check;
alter table public.workflow_messages
  add constraint workflow_messages_sender_label_length_check
  check (length(btrim(sender_label)) between 1 and 48);

create or replace function passage_private.can_message_workflow(
  p_workflow_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.workflows as workflow_row
    where workflow_row.id = p_workflow_id
      and (
        (
          workflow_row.continuity_space_id is not null
          and exists (
            select 1
            from public.continuity_spaces as space_row
            where space_row.id = workflow_row.continuity_space_id
              and space_row.status = 'active'
              and (
                space_row.owner_user_id = (select auth.uid())
                or exists (
                  select 1
                  from public.continuity_participants as participant_row
                  where participant_row.continuity_space_id = space_row.id
                    and participant_row.user_id = (select auth.uid())
                    and participant_row.status = 'active'
                    and 'updates' = any (participant_row.category_scope)
                )
              )
          )
        )
        or (
          workflow_row.organization_id is not null
          and workflow_row.organization_location_id is not null
          and (
            passage_private.can_manage_location(
              workflow_row.organization_id,
              workflow_row.organization_location_id
            )
            or exists (
              select 1
              from public.organization_members as member_row
              join public.organization_member_locations as grant_row
                on grant_row.organization_member_id = member_row.id
               and grant_row.organization_location_id =
                 workflow_row.organization_location_id
               and grant_row.revoked_at is null
              where member_row.organization_id =
                  workflow_row.organization_id
                and member_row.user_id = (select auth.uid())
                and member_row.status = 'active'
                and member_row.role = 'staff'
                and exists (
                  select 1
                  from public.tasks as task_row
                  where task_row.workflow_id = workflow_row.id
                    and task_row.assigned_organization_member_id =
                      member_row.id
                )
            )
          )
        )
      )
  )
$function$;

revoke all on function
  passage_private.can_message_workflow(uuid)
  from public, anon, authenticated, service_role;

create or replace function passage_private.list_workflow_messages_client_safe(
  p_workflow_id uuid
)
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
  v_actor_user_id uuid := (select auth.uid());
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_workflow_id is null
     or not passage_private.can_message_workflow(p_workflow_id) then
    raise exception 'This case is not available to your account'
      using errcode = '42501';
  end if;

  return query
  select
    message_row.id,
    message_row.sender_kind,
    message_row.sender_label,
    message_row.body,
    message_row.occurred_at,
    message_row.sender_user_id = v_actor_user_id
  from public.workflow_messages as message_row
  where message_row.workflow_id = p_workflow_id
  order by message_row.occurred_at, message_row.id;
end
$function$;

create or replace function public.list_workflow_messages_client_safe(
  p_workflow_id uuid
)
returns table (
  message_id uuid,
  sender_kind text,
  sender_label text,
  body text,
  occurred_at timestamp with time zone,
  is_own boolean
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select *
  from passage_private.list_workflow_messages_client_safe(p_workflow_id)
$function$;

revoke all on function
  passage_private.list_workflow_messages_client_safe(uuid)
  from public, anon, authenticated, service_role;
revoke all on function
  public.list_workflow_messages_client_safe(uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  passage_private.list_workflow_messages_client_safe(uuid)
  to authenticated;
grant execute on function
  public.list_workflow_messages_client_safe(uuid)
  to authenticated;

-- Preserve the original command contract while enforcing bounded labels and
-- payload-aware replay. The actor is server-derived and never accepted from a
-- client.
create or replace function passage_private.post_workflow_message_idempotent(
  p_workflow_id uuid,
  p_body text,
  p_request_id uuid
)
returns table (message_id uuid, occurred_at timestamptz, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_workflow public.workflows%rowtype;
  v_member public.organization_members%rowtype;
  v_participant public.continuity_participants%rowtype;
  v_sender_kind text;
  v_sender_member_id uuid;
  v_sender_participant_id uuid;
  v_sender_label text;
  v_existing public.workflow_messages%rowtype;
  v_new_id uuid;
  v_occurred_at timestamptz;
  v_body text := btrim(coalesce(p_body, ''));
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_workflow_id is null
     or p_request_id is null
     or length(v_body) not between 1 and 4000 then
    raise exception 'A message is required' using errcode = '22023';
  end if;

  select workflow_row.*
  into v_workflow
  from public.workflows as workflow_row
  where workflow_row.id = p_workflow_id;

  if v_workflow.id is null
     or not passage_private.can_message_workflow(p_workflow_id) then
    raise exception 'You are not authorized to message on this case'
      using errcode = '42501';
  end if;

  select member_row.*
  into v_member
  from public.organization_members as member_row
  where member_row.organization_id = v_workflow.organization_id
    and member_row.user_id = v_actor_user_id
    and member_row.status = 'active';

  if v_member.id is not null then
    v_sender_kind := 'staff';
    v_sender_member_id := v_member.id;
    v_sender_label := case
      when v_member.role in ('owner', 'director') then 'Director'
      else 'Staff member'
    end;
  elsif v_workflow.continuity_space_id is not null then
    v_sender_kind := 'family';
    select participant_row.*
    into v_participant
    from public.continuity_participants as participant_row
    where participant_row.continuity_space_id = v_workflow.continuity_space_id
      and participant_row.user_id = v_actor_user_id
      and participant_row.status = 'active';

    if v_participant.id is not null then
      v_sender_participant_id := v_participant.id;
      v_sender_label := case
        when length(btrim(coalesce(v_participant.relationship, ''))) > 0
          then 'Family — ' || initcap(btrim(v_participant.relationship))
        else 'Family'
      end;
    else
      v_sender_label := 'Family';
    end if;
  else
    raise exception 'You are not authorized to message on this case'
      using errcode = '42501';
  end if;

  v_sender_label := left(v_sender_label, 48);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_workflow_id::text
        || ':workflow_message_post:'
        || p_request_id::text,
      0
    )
  );

  select message_row.*
  into v_existing
  from public.workflow_messages as message_row
  where message_row.workflow_id = p_workflow_id
    and message_row.creation_request_id = p_request_id;

  if found then
    if v_existing.sender_user_id is distinct from v_actor_user_id
       or v_existing.body is distinct from v_body then
      raise exception 'This request was already used for a different message'
        using errcode = '22023';
    end if;
    return query
      select v_existing.id, v_existing.occurred_at, true;
    return;
  end if;

  insert into public.workflow_messages as message_row (
    workflow_id,
    organization_id,
    sender_kind,
    sender_user_id,
    sender_organization_member_id,
    sender_continuity_participant_id,
    sender_label,
    body,
    creation_request_id,
    occurred_at
  ) values (
    p_workflow_id,
    v_workflow.organization_id,
    v_sender_kind,
    v_actor_user_id,
    v_sender_member_id,
    v_sender_participant_id,
    v_sender_label,
    v_body,
    p_request_id,
    pg_catalog.clock_timestamp()
  )
  returning message_row.id, message_row.occurred_at
  into v_new_id, v_occurred_at;

  return query select v_new_id, v_occurred_at, false;
end
$function$;

revoke all on function
  passage_private.post_workflow_message_idempotent(uuid, text, uuid)
  from public, anon, authenticated, service_role;
revoke all on function
  public.post_workflow_message_idempotent(uuid, text, uuid)
  from public, anon, authenticated, service_role;
grant execute on function
  passage_private.post_workflow_message_idempotent(uuid, text, uuid)
  to authenticated;
grant execute on function
  public.post_workflow_message_idempotent(uuid, text, uuid)
  to authenticated;
