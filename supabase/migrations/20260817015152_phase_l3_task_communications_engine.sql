-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Phase L.3: task communications engine. A prepared-then-sent, human-reviewed email
-- draft attached to a case (and optionally one task), matching the "prepared outcomes,
-- not AI theater" pattern used throughout this codebase (drafts are never silently
-- auto-sent; sending is a distinct, explicit, idempotent command).
--
-- Table shape (columns, PK, indexes, trigger) verified live via information_schema,
-- pg_indexes, and pg_trigger on 2026-08-19. All four RPCs
-- (prepare/confirm_sent/confirm_failed/get_workflow_communications) verified live via
-- pg_get_functiondef on 2026-08-19 and confirmed untouched by any later migration
-- (committed or otherwise) -- high confidence throughout.
--
-- NOTE, found and flagged rather than silently corrected: pg_policies shows ZERO RLS
-- policies on task_communications (RLS is enabled -- relrowsecurity=true -- but with
-- no policies, i.e. deny-by-default; the only read path is
-- get_workflow_communications, a SECURITY DEFINER function that bypasses RLS and
-- applies its own passage_private.can_message_workflow authority check). That part
-- matches this codebase's established pattern. What does NOT match: unlike
-- task_proofs (supabase/migrations/20260718210000_cycle_8_task_proof_loop.sql, lines
-- ~810-813, "revoke all ... from public, anon, authenticated" then "grant select ...
-- to authenticated"), this table's live grants show anon AND authenticated still hold
-- the full default INSERT/SELECT/UPDATE/DELETE table-level privilege set -- nothing
-- was ever revoked. This is safe in practice only because RLS is enabled with zero
-- policies (deny-by-default blocks direct table access regardless of GRANT), but it
-- diverges from the task_proofs revoke-then-grant-select convention this codebase
-- otherwise follows. Reproduced here to match production truth, not silently
-- "corrected" to look like the cleaner pattern -- flagged in the final report as a
-- real defense-in-depth gap worth a follow-up GRANT-hardening pass, same shape as the
-- already-committed supabase/migrations/20260718033547_cycle_7a_invitation_idempotency_acl_hardening.sql
-- did for a different table.

create table public.task_communications (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  created_by_user_id uuid not null references auth.users(id),
  subject text not null,
  body text not null,
  recipients jsonb not null,
  status text not null default 'prepared' check (status in ('prepared', 'sent', 'failed')),
  creation_request_id uuid not null,
  send_request_id uuid,
  prepared_at timestamp with time zone not null default pg_catalog.clock_timestamp(),
  sent_at timestamp with time zone,
  provider_message_ids jsonb,
  failure_reason text,
  created_at timestamp with time zone not null default pg_catalog.clock_timestamp(),
  updated_at timestamp with time zone not null default pg_catalog.clock_timestamp()
);

create unique index task_communications_prepare_idempotency_unique
  on public.task_communications (workflow_id, creation_request_id);

create index task_communications_workflow_idx
  on public.task_communications (workflow_id, prepared_at desc);

alter table public.task_communications enable row level security;

CREATE OR REPLACE FUNCTION passage_private.reject_task_communication_content_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.subject is distinct from old.subject
     or new.body is distinct from old.body
     or new.recipients is distinct from old.recipients
     or new.workflow_id is distinct from old.workflow_id
     or new.task_id is distinct from old.task_id
     or new.created_by_user_id is distinct from old.created_by_user_id
     or new.creation_request_id is distinct from old.creation_request_id then
    raise exception 'A prepared communication''s content cannot be edited, only its send status' using errcode = '55000';
  end if;
  return new;
end;
$function$;

CREATE TRIGGER task_communications_content_append_only
  BEFORE UPDATE ON public.task_communications
  FOR EACH ROW EXECUTE FUNCTION passage_private.reject_task_communication_content_mutation();

CREATE OR REPLACE FUNCTION passage_private.prepare_task_communication_idempotent(p_workflow_id uuid, p_task_id uuid, p_subject text, p_body text, p_recipients jsonb, p_request_id uuid)
 RETURNS TABLE(communication_id uuid, status text, prepared_at timestamp with time zone, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_existing public.task_communications%rowtype;
  v_recipient_count integer;
  v_new_id uuid;
  v_new_prepared_at timestamptz;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null then
    raise exception 'Request id is required' using errcode = '22023';
  end if;
  if nullif(btrim(p_subject), '') is null or nullif(btrim(p_body), '') is null then
    raise exception 'A subject and message are required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_recipients) is distinct from 'array' then
    raise exception 'Recipients must be a list' using errcode = '22023';
  end if;
  select count(*) into v_recipient_count from jsonb_array_elements(p_recipients) as r
  where nullif(btrim(r ->> 'email'), '') is not null and (r ->> 'email') like '_%@_%.__%';
  if v_recipient_count = 0 then
    raise exception 'At least one valid recipient email is required' using errcode = '22023';
  end if;

  if not passage_private.can_message_workflow(p_workflow_id) then
    raise exception 'This case is not available to your account' using errcode = '42501';
  end if;

  if p_task_id is not null and not exists (select 1 from public.tasks as t where t.id = p_task_id and t.workflow_id = p_workflow_id) then
    raise exception 'Task does not belong to this case' using errcode = '22023';
  end if;

  select c.* into v_existing from public.task_communications as c
  where c.workflow_id = p_workflow_id and c.creation_request_id = p_request_id;
  if found then
    return query select v_existing.id, v_existing.status, v_existing.prepared_at, true;
    return;
  end if;

  insert into public.task_communications (workflow_id, task_id, created_by_user_id, subject, body, recipients, creation_request_id)
  values (p_workflow_id, p_task_id, v_actor_user_id, btrim(p_subject), btrim(p_body), p_recipients, p_request_id)
  returning task_communications.id, task_communications.prepared_at into v_new_id, v_new_prepared_at;

  return query select v_new_id, 'prepared'::text, v_new_prepared_at, false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prepare_task_communication_idempotent(p_workflow_id uuid, p_task_id uuid, p_subject text, p_body text, p_recipients jsonb, p_request_id uuid)
 RETURNS TABLE(communication_id uuid, status text, prepared_at timestamp with time zone, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from passage_private.prepare_task_communication_idempotent(p_workflow_id, p_task_id, p_subject, p_body, p_recipients, p_request_id) $function$;

CREATE OR REPLACE FUNCTION passage_private.confirm_task_communication_sent_idempotent(p_communication_id uuid, p_provider_message_ids jsonb, p_request_id uuid)
 RETURNS TABLE(communication_id uuid, status text, sent_at timestamp with time zone, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_row public.task_communications%rowtype;
  v_sent_at timestamptz;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_request_id is null then
    raise exception 'Request id is required' using errcode = '22023';
  end if;

  select c.* into v_row from public.task_communications as c where c.id = p_communication_id for update;
  if not found or not passage_private.can_message_workflow(v_row.workflow_id) then
    raise exception 'This communication is not available to your account' using errcode = '42501';
  end if;

  if v_row.status = 'sent' then
    if v_row.send_request_id = p_request_id then
      return query select v_row.id, v_row.status, v_row.sent_at, true;
      return;
    end if;
    raise exception 'This communication was already sent' using errcode = '55000';
  end if;

  v_sent_at := pg_catalog.clock_timestamp();
  update public.task_communications as c
  set status = 'sent', sent_at = v_sent_at, provider_message_ids = p_provider_message_ids, send_request_id = p_request_id, failure_reason = null, updated_at = v_sent_at
  where c.id = v_row.id;

  insert into public.workflow_events (workflow_id, event_type, name, organization_id, organization_location_id, task_id, actor_user_id, actor_organization_member_id, audience, previous_state, next_state, occurred_at, metadata)
  select w.id, 'other', 'communication.sent', w.organization_id, null, v_row.task_id, v_actor_user_id, null,
    case when w.organization_id is null then 'family' else 'organization_internal' end,
    'prepared', 'sent', v_sent_at,
    jsonb_build_object('communication_id', v_row.id, 'recipient_count', jsonb_array_length(v_row.recipients), 'subject', v_row.subject)
  from public.workflows as w where w.id = v_row.workflow_id;

  return query select v_row.id, 'sent'::text, v_sent_at, false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_task_communication_sent_idempotent(p_communication_id uuid, p_provider_message_ids jsonb, p_request_id uuid)
 RETURNS TABLE(communication_id uuid, status text, sent_at timestamp with time zone, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from passage_private.confirm_task_communication_sent_idempotent(p_communication_id, p_provider_message_ids, p_request_id) $function$;

CREATE OR REPLACE FUNCTION passage_private.confirm_task_communication_failed_idempotent(p_communication_id uuid, p_failure_reason text, p_request_id uuid)
 RETURNS TABLE(communication_id uuid, status text, replayed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_actor_user_id uuid := (select auth.uid());
  v_row public.task_communications%rowtype;
begin
  if v_actor_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select c.* into v_row from public.task_communications as c where c.id = p_communication_id for update;
  if not found or not passage_private.can_message_workflow(v_row.workflow_id) then
    raise exception 'This communication is not available to your account' using errcode = '42501';
  end if;

  if v_row.status = 'sent' then
    raise exception 'This communication was already sent' using errcode = '55000';
  end if;

  update public.task_communications as c
  set status = 'failed', failure_reason = left(coalesce(p_failure_reason, 'Unknown error'), 500), send_request_id = p_request_id, updated_at = pg_catalog.clock_timestamp()
  where c.id = v_row.id;

  return query select v_row.id, 'failed'::text, false;
end;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_task_communication_failed_idempotent(p_communication_id uuid, p_failure_reason text, p_request_id uuid)
 RETURNS TABLE(communication_id uuid, status text, replayed boolean)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from passage_private.confirm_task_communication_failed_idempotent(p_communication_id, p_failure_reason, p_request_id) $function$;

-- Read RPC -- discovered via lib/communications/actions.ts (sendTaskCommunication
-- re-reads the persisted draft through this RPC rather than trusting a stale form
-- submission), not part of the founder's original hand-off list but genuinely part
-- of this same feature and verified live via pg_get_functiondef on 2026-08-19.
CREATE OR REPLACE FUNCTION passage_private.get_workflow_communications(p_workflow_id uuid)
 RETURNS TABLE(id uuid, task_id uuid, subject text, body text, recipients jsonb, status text, prepared_at timestamp with time zone, sent_at timestamp with time zone, failure_reason text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select c.id, c.task_id, c.subject, c.body, c.recipients, c.status, c.prepared_at, c.sent_at, c.failure_reason
  from public.task_communications as c
  where c.workflow_id = p_workflow_id
    and passage_private.can_message_workflow(p_workflow_id)
  order by c.prepared_at desc;
$function$;

CREATE OR REPLACE FUNCTION public.get_workflow_communications(p_workflow_id uuid)
 RETURNS TABLE(id uuid, task_id uuid, subject text, body text, recipients jsonb, status text, prepared_at timestamp with time zone, sent_at timestamp with time zone, failure_reason text)
 LANGUAGE sql
 SET search_path TO ''
AS $function$ select * from passage_private.get_workflow_communications(p_workflow_id) $function$;
