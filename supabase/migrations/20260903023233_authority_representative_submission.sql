create table public.authority_disclosures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null unique references public.authority_records(id) on delete restrict,
  invitation_id uuid not null references public.authority_participant_invitations(id) on delete restrict,
  record_version bigint not null check (record_version > 0),
  text_version text not null check (text_version = 'minimum-necessary-disclosure-2026.1'),
  disclosed_fields text[] not null check (cardinality(disclosed_fields) > 0),
  acknowledged boolean not null check (acknowledged),
  submitted_at timestamptz not null default now()
);

create index authority_disclosures_org_submitted_idx
  on public.authority_disclosures(organization_id, submitted_at desc);
create index authority_disclosures_invitation_idx
  on public.authority_disclosures(invitation_id);

create or replace function authority_private.prevent_authority_disclosure_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '55000', message = 'authority_disclosures_are_append_only';
end;
$$;

create trigger authority_disclosures_append_only
before update or delete on public.authority_disclosures
for each row execute function authority_private.prevent_authority_disclosure_mutation();

alter table public.authority_disclosures enable row level security;
alter table public.authority_disclosures force row level security;

create policy authority_disclosures_organization_select
on public.authority_disclosures for select to authenticated
using ((select authority_private.has_active_membership(organization_id)));

revoke all on public.authority_disclosures from public, anon, authenticated;
grant select on public.authority_disclosures to authenticated;

create or replace function authority_private.submit_authority_for_review_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_acknowledged boolean,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_hash text;
  v_session authority_private.participant_sessions%rowtype;
  v_record public.authority_records%rowtype;
  v_receipt authority_private.participant_command_receipts%rowtype;
  v_disclosure public.authority_disclosures%rowtype;
  v_disclosed_fields text[] := array[
    'participant_names',
    'authority_scope',
    'account_boundary',
    'policy_requirement_results',
    'source_metadata',
    'representative_certification'
  ]::text[];
  v_payload_hash text;
  v_event_sequence bigint;
  v_event_id uuid;
  v_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'idempotency_key_required';
  end if;
  if not coalesce(p_acknowledged, false) then
    raise exception using errcode = '22023', message = 'submission_acknowledgment_required';
  end if;
  if lower(btrim(coalesce(p_session_token, ''))) !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  v_token_hash := encode(extensions.digest(convert_to(lower(btrim(p_session_token)), 'UTF8'), 'sha256'), 'hex');
  select * into v_session
  from authority_private.participant_sessions
  where token_hash = v_token_hash
    and authority_record_id = p_authority_record_id
    and participant_role = 'representative'
    and status = 'active'
    and expires_at > now();
  if not found then
    raise exception using errcode = 'P0002', message = 'participant_session_unavailable';
  end if;

  v_payload_hash := authority_private.payload_hash(jsonb_build_object(
    'authority_record_id', p_authority_record_id,
    'expected_version', p_expected_version,
    'acknowledged', true,
    'text_version', 'minimum-necessary-disclosure-2026.1',
    'disclosed_fields', to_jsonb(v_disclosed_fields)
  ));

  perform pg_advisory_xact_lock(hashtextextended(p_authority_record_id::text || ':representative_submission', 0));
  select * into v_receipt
  from authority_private.participant_command_receipts
  where invitation_id = v_session.invitation_id
    and command_name = 'submit_authority_for_review'
    and idempotency_key = p_idempotency_key;
  if found then
    if v_receipt.payload_hash <> v_payload_hash then
      raise exception using errcode = '22023', message = 'idempotency_payload_mismatch';
    end if;
    return v_receipt.result || jsonb_build_object('replayed', true);
  end if;

  select * into v_record
  from public.authority_records
  where id = p_authority_record_id and organization_id = v_session.organization_id
  for update;
  if not found then raise exception using errcode = 'P0002', message = 'authority_request_not_found'; end if;
  if v_record.version <> p_expected_version then raise exception using errcode = 'P0001', message = 'participant_record_changed'; end if;
  if v_record.status <> 'ready_to_submit' then raise exception using errcode = '42501', message = 'submission_not_available'; end if;
  if v_record.valid_until <= now() then raise exception using errcode = '22023', message = 'submission_request_expired'; end if;
  if not exists (
    select 1 from public.authority_requirements r where r.authority_record_id = v_record.id
  ) or exists (
    select 1 from public.authority_requirements r
    where r.authority_record_id = v_record.id and r.status <> 'completed'
  ) then raise exception using errcode = '42501', message = 'submission_requirements_incomplete'; end if;
  if exists (
    select 1 from public.authority_disclosures d where d.authority_record_id = v_record.id
  ) then raise exception using errcode = '22023', message = 'submission_already_recorded'; end if;

  update public.authority_records
  set status = 'under_review', version = version + 1, updated_at = now()
  where id = v_record.id
  returning * into v_record;

  insert into public.authority_disclosures (
    organization_id, authority_record_id, invitation_id, record_version,
    text_version, disclosed_fields, acknowledged
  ) values (
    v_record.organization_id, v_record.id, v_session.invitation_id, v_record.version,
    'minimum-necessary-disclosure-2026.1', v_disclosed_fields, true
  ) returning * into v_disclosure;

  select coalesce(max(sequence), 0) + 1 into v_event_sequence
  from public.authority_events where authority_record_id = v_record.id;
  insert into public.authority_events (
    organization_id, authority_record_id, sequence, record_version, event_type,
    actor_user_id, actor_role, summary, detail, audience, payload
  ) values (
    v_record.organization_id, v_record.id, v_event_sequence, v_record.version,
    'representative.submitted', null, 'representative',
    'Representative sent the request for institution review',
    'The representative confirmed the minimum-necessary disclosure and sent the completed request to the institution.',
    array['owner','admin','staff','reviewer','auditor','principal','representative']::text[],
    jsonb_build_object(
      'disclosure_id', v_disclosure.id,
      'text_version', v_disclosure.text_version,
      'disclosed_fields', to_jsonb(v_disclosure.disclosed_fields)
    )
  ) returning event_id into v_event_id;

  insert into public.organization_audit_events (
    organization_id, actor_user_id, event_type, subject_type, subject_id, payload
  ) values (
    v_record.organization_id, null, 'representative.submitted', 'authority_record', v_record.id,
    jsonb_build_object('disclosure_id', v_disclosure.id, 'event_id', v_event_id)
  );

  v_result := jsonb_build_object(
    'authority_record_id', v_record.id,
    'version', v_record.version,
    'status', v_record.status,
    'disclosure_id', v_disclosure.id,
    'event_id', v_event_id
  );
  insert into authority_private.participant_command_receipts (
    invitation_id, command_name, idempotency_key, payload_hash, result
  ) values (
    v_session.invitation_id, 'submit_authority_for_review', p_idempotency_key, v_payload_hash, v_result
  );
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

create or replace function public.submit_authority_for_review_v1(
  p_session_token text,
  p_authority_record_id uuid,
  p_expected_version bigint,
  p_acknowledged boolean,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select authority_private.submit_authority_for_review_v1(
    p_session_token, p_authority_record_id, p_expected_version, p_acknowledged, p_idempotency_key
  );
$$;

create or replace function authority_private.require_disclosure_before_institution_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_disclosure public.authority_disclosures%rowtype;
begin
  select * into v_disclosure
  from public.authority_disclosures
  where authority_record_id = new.authority_record_id;
  if not found or v_disclosure.record_version + 1 <> new.record_version then
    raise exception using errcode = '42501', message = 'institution_decision_submission_required';
  end if;

  new.receipt_snapshot := new.receipt_snapshot || jsonb_build_object(
    'disclosure', jsonb_build_object(
      'id', v_disclosure.id,
      'text_version', v_disclosure.text_version,
      'disclosed_fields', to_jsonb(v_disclosure.disclosed_fields),
      'submitted_at', v_disclosure.submitted_at
    )
  );
  new.receipt_sha256 := encode(extensions.digest(convert_to(new.receipt_snapshot::text, 'UTF8'), 'sha256'), 'hex');
  return new;
end;
$$;

create trigger authority_institution_decisions_require_disclosure
before insert on public.authority_institution_decisions
for each row execute function authority_private.require_disclosure_before_institution_decision();

revoke execute on function authority_private.prevent_authority_disclosure_mutation() from public, anon, authenticated;
revoke execute on function authority_private.submit_authority_for_review_v1(text,uuid,bigint,boolean,uuid) from public, anon, authenticated;
revoke execute on function public.submit_authority_for_review_v1(text,uuid,bigint,boolean,uuid) from public, anon, authenticated;
revoke execute on function authority_private.require_disclosure_before_institution_decision() from public, anon, authenticated;

grant execute on function authority_private.submit_authority_for_review_v1(text,uuid,bigint,boolean,uuid) to service_role;
grant execute on function public.submit_authority_for_review_v1(text,uuid,bigint,boolean,uuid) to service_role;

comment on table public.authority_disclosures is 'Append-only representative acknowledgment of the minimum-necessary disclosure sent for institution review.';
comment on function public.submit_authority_for_review_v1(text,uuid,bigint,boolean,uuid) is 'Server-only representative submission command with role-bound session, version, acknowledgment, idempotency, disclosure, state, and event evidence.';

notify pgrst, 'reload schema';
