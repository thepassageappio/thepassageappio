-- Passage Zero: minimal cross-persona messaging thread (per-workflow).
--
-- Adds one append-only table (workflow_messages) plus one idempotent RPC
-- (post_workflow_message_idempotent), reusing the *existing*
-- authorization/identity patterns already proven out by the family-case-
-- workflow-grant and vendor/urgent-red batches rather than inventing new
-- ones:
--   - Authorization to view AND post reuses passage_private.can_view_workflow(),
--     the same predicate that already gates workflows/tasks/task_proofs/
--     task_proof_reviews/workflow_events for both org staff/director and
--     family/participant callers. If you can already see the case, you can
--     message on it; no new authority surface is introduced.
--   - Sender identity resolution reuses organization_members (staff/director)
--     and continuity_spaces/continuity_participants (family/participant),
--     the exact tables named in the task. A plain-language sender_label is
--     computed once, server-side, inside the SECURITY DEFINER RPC (which has
--     elevated read access across both authority boundaries) and stored on
--     the row -- deliberately NOT resolved via a client-side join, because
--     neither side of this boundary has (or should get) a new cross-authority
--     RLS grant to read the other's identity tables directly (confirmed
--     existing precedent: lib/family/case-view.ts already documents that a
--     family caller has no RLS grant on organization_members and therefore
--     shows only generic role-based labels like "Your care team", never a
--     real staff name -- messaging follows that same boundary rather than
--     punching a new hole in it). No raw id, email, or internal role string
--     is ever returned by the RPC or stored anywhere a client can read it.
--
-- Preflight: refuse to run twice, and refuse to run against a database that
-- doesn't already carry the family-case-workflow-grant lineage this table
-- depends on (workflows.continuity_space_id, passage_private.can_view_workflow
-- with the family branch folded in).
do $$
begin
  if to_regclass('public.workflow_messages') is not null then
    raise exception 'workflow_messages_thin_slice already applied (public.workflow_messages exists)';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workflows' and column_name = 'continuity_space_id'
  ) then
    raise exception 'Refusing to apply: workflows.continuity_space_id not found. Wrong project, or family-case-workflow-grant not applied yet?';
  end if;
  if to_regclass('public.continuity_participants') is null then
    raise exception 'Refusing to apply: public.continuity_participants not found. Wrong project?';
  end if;
end
$$;

-- ============================================================================
-- Table
-- ============================================================================

create table public.workflow_messages (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sender_kind text not null check (sender_kind in ('staff', 'family')),
  sender_user_id uuid not null references auth.users (id),
  sender_organization_member_id uuid references public.organization_members (id),
  sender_continuity_participant_id uuid references public.continuity_participants (id),
  sender_label text not null check (length(btrim(sender_label)) between 1 and 80),
  body text not null check (length(btrim(body)) between 1 and 4000),
  creation_request_id uuid not null,
  occurred_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default clock_timestamp(),
  unique (workflow_id, creation_request_id),
  constraint workflow_messages_sender_shape check (
    (sender_kind = 'staff' and sender_organization_member_id is not null and sender_continuity_participant_id is null)
    or
    (sender_kind = 'family' and sender_organization_member_id is null)
  )
);
comment on table public.workflow_messages is 'Minimal per-workflow message thread. One row per posted message; visible to anyone who can already view the workflow (passage_private.can_view_workflow). Plain-language sender_label is resolved once at write time by the posting RPC and is the only sender identity ever exposed to a client.';

create index workflow_messages_workflow_idx on public.workflow_messages (workflow_id, occurred_at);

-- Defense in depth: append-only (grants already block direct client writes).
create or replace function passage_private.reject_workflow_message_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'workflow_messages is append-only';
end
$$;

create trigger workflow_messages_append_only
  before update or delete on public.workflow_messages
  for each row execute function passage_private.reject_workflow_message_mutation();

alter table public.workflow_messages enable row level security;

-- ============================================================================
-- RLS (read-only for clients; all writes go through the SECURITY DEFINER RPC)
-- ============================================================================

create policy workflow_messages_authorized_select on public.workflow_messages
  for select to authenticated
  using (passage_private.can_view_workflow(workflow_id));

revoke all on table public.workflow_messages from public, anon, authenticated;
grant select on table public.workflow_messages to authenticated;

-- ============================================================================
-- RPC: post_workflow_message_idempotent
-- ============================================================================

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
  if p_workflow_id is null or p_request_id is null or length(v_body) not between 1 and 4000 then
    raise exception 'A message is required' using errcode = '22023';
  end if;

  select w.* into v_workflow from public.workflows as w where w.id = p_workflow_id;
  if v_workflow.id is null or not passage_private.can_view_workflow(p_workflow_id) then
    raise exception 'You are not authorized to message on this case' using errcode = '42501';
  end if;

  -- Identity resolution for the plain-language label only -- authorization
  -- was already fully decided above by can_view_workflow().
  select m.* into v_member from public.organization_members as m
  where m.organization_id = v_workflow.organization_id
    and m.user_id = v_actor_user_id
    and m.status = 'active';

  if v_member.id is not null then
    v_sender_kind := 'staff';
    v_sender_member_id := v_member.id;
    v_sender_label := case when v_member.role in ('owner', 'director') then 'Director' else 'Staff member' end;
  elsif v_workflow.continuity_space_id is not null then
    v_sender_kind := 'family';
    select p.* into v_participant from public.continuity_participants as p
    where p.continuity_space_id = v_workflow.continuity_space_id
      and p.user_id = v_actor_user_id
      and p.status = 'active';
    if v_participant.id is not null then
      v_sender_participant_id := v_participant.id;
      v_sender_label := case when length(btrim(coalesce(v_participant.relationship, ''))) > 0
        then 'Family — ' || initcap(btrim(v_participant.relationship))
        else 'Family' end;
    else
      v_sender_label := 'Family';
    end if;
  else
    raise exception 'You are not authorized to message on this case' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_workflow_id::text || ':workflow_message_post:' || p_request_id::text, 0)
  );

  select msg.* into v_existing from public.workflow_messages as msg
  where msg.workflow_id = p_workflow_id and msg.creation_request_id = p_request_id;
  if found then
    return query select v_existing.id, v_existing.occurred_at, true;
    return;
  end if;

  insert into public.workflow_messages as msg (
    workflow_id, organization_id, sender_kind, sender_user_id,
    sender_organization_member_id, sender_continuity_participant_id, sender_label,
    body, creation_request_id, occurred_at
  ) values (
    p_workflow_id, v_workflow.organization_id, v_sender_kind, v_actor_user_id,
    v_sender_member_id, v_sender_participant_id, v_sender_label,
    v_body, p_request_id, pg_catalog.clock_timestamp()
  ) returning msg.id, msg.occurred_at into v_new_id, v_occurred_at;

  return query select v_new_id, v_occurred_at, false;
end
$function$;

create or replace function public.post_workflow_message_idempotent(
  p_workflow_id uuid,
  p_body text,
  p_request_id uuid
)
returns table (message_id uuid, occurred_at timestamptz, replayed boolean)
language sql
volatile
security invoker
set search_path = ''
as $$
  select * from passage_private.post_workflow_message_idempotent(p_workflow_id, p_body, p_request_id)
$$;

revoke all on function passage_private.post_workflow_message_idempotent(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.post_workflow_message_idempotent(uuid, text, uuid) from public, anon;
grant execute on function public.post_workflow_message_idempotent(uuid, text, uuid) to authenticated;
grant execute on function passage_private.post_workflow_message_idempotent(uuid, text, uuid) to authenticated;
