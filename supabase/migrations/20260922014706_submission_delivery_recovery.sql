-- New submissions atomically persist their delivery work with the command receipt.
-- Historical submissions are deliberately not re-enqueued (could resend old links).
create table authority_private.submission_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.authority_submission_groups(id),
  receipt_key uuid not null,
  record_id uuid not null references public.authority_records(id),
  kind text not null check (kind in ('copy', 'invitation')),
  job_key text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','succeeded','needs_attention')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  last_error text,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(group_id, job_key)
);
create index submission_delivery_due_idx on authority_private.submission_delivery_jobs(status,next_attempt_at);
create table authority_private.submission_delivery_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references authority_private.submission_delivery_jobs(id),
  attempt integer not null,
  event_type text not null,
  detail text,
  occurred_at timestamptz not null default now()
);
alter table authority_private.submission_delivery_jobs enable row level security;
alter table authority_private.submission_delivery_events enable row level security;
revoke all on authority_private.submission_delivery_jobs, authority_private.submission_delivery_events from public, anon, authenticated, service_role;

create function authority_private.enqueue_submission_delivery() returns trigger
language plpgsql security definer set search_path = '' as $$
declare op jsonb; spawned jsonb; artifact public.authority_evidence_artifacts%rowtype; inv public.authority_participant_invitations%rowtype;
begin
  if new.command_name <> 'submit_submission_group' then return new; end if;
  for op in select value from jsonb_array_elements(new.result->'evidence_copy_operations') loop
    select * into strict artifact from public.authority_evidence_artifacts where storage_path = op->>'to_path' and storage_bucket = op->>'to_bucket';
    insert into authority_private.submission_delivery_jobs(group_id,receipt_key,record_id,kind,job_key,payload)
    values(new.group_id,new.idempotency_key,artifact.authority_record_id,'copy','copy:' || artifact.id,
      op || jsonb_build_object('sha256',artifact.sha256_hex,'media_type',artifact.media_type)) on conflict do nothing;
  end loop;
  for spawned in select value from jsonb_array_elements(new.result->'spawned') loop
    for inv in select * from public.authority_participant_invitations where authority_record_id = (spawned->>'authority_record_id')::uuid loop
      insert into authority_private.submission_delivery_jobs(group_id,receipt_key,record_id,kind,job_key,payload)
      values(new.group_id,new.idempotency_key,inv.authority_record_id,'invitation','invitation:' || inv.id,
        jsonb_build_object('invitation_id',inv.id,'invitation_version',inv.version,'role',inv.participant_role,'expires_at',inv.expires_at)) on conflict do nothing;
    end loop;
  end loop;
  return new;
end $$;
create trigger submission_delivery_enqueue after insert on authority_private.submission_group_command_receipts
for each row execute function authority_private.enqueue_submission_delivery();
revoke all on function authority_private.enqueue_submission_delivery() from public,anon,authenticated;

create function public.claim_submission_delivery_v1(p_group_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare job authority_private.submission_delivery_jobs%rowtype; spawned jsonb; rec public.authority_records%rowtype; inv public.authority_participant_invitations%rowtype; body jsonb;
begin
  select * into job from authority_private.submission_delivery_jobs j
  where (p_group_id is null or j.group_id = p_group_id)
    and ((j.status = 'pending' and j.next_attempt_at <= now()) or (j.status = 'processing' and j.lease_until < now()))
    and (j.kind = 'copy' or not exists(select 1 from authority_private.submission_delivery_jobs c where c.record_id=j.record_id and c.kind='copy' and c.status <> 'succeeded'))
  order by j.created_at,j.kind,j.id for update skip locked limit 1;
  if not found then return null; end if;
  if job.attempts >= 5 then
    update authority_private.submission_delivery_jobs set status='needs_attention',last_error='attempts_exhausted',updated_at=now() where id=job.id;
    insert into authority_private.submission_delivery_events(job_id,attempt,event_type,detail) values(job.id,job.attempts,'needs_attention','attempts_exhausted');
    return jsonb_build_object('skipped',true);
  end if;
  body := job.payload;
  if job.kind='invitation' then
    -- Resend's idempotency window is finite. After an uncertain old attempt,
    -- require operator review instead of risking an automatic duplicate send.
    if job.attempts > 0 and exists(select 1 from authority_private.submission_delivery_events where job_id=job.id and event_type='started' and occurred_at < now()-interval '23 hours') then
      update authority_private.submission_delivery_jobs set status='needs_attention',last_error='delivery_confirmation_required',updated_at=now() where id=job.id;
      insert into authority_private.submission_delivery_events(job_id,attempt,event_type,detail) values(job.id,job.attempts,'needs_attention','delivery_confirmation_required');
      return jsonb_build_object('skipped',true);
    end if;
    select * into inv from public.authority_participant_invitations where id=(body->>'invitation_id')::uuid;
    if not found or inv.version <> (body->>'invitation_version')::bigint or inv.status <> 'pending' or inv.expires_at <= now() then
      update authority_private.submission_delivery_jobs set status='needs_attention',last_error='invitation_changed_or_expired',updated_at=now() where id=job.id;
      insert into authority_private.submission_delivery_events(job_id,attempt,event_type,detail) values(job.id,job.attempts,'needs_attention','invitation_changed_or_expired');
      return jsonb_build_object('skipped',true);
    end if;
    select * into strict rec from public.authority_records where id=job.record_id;
    select s.value into strict spawned from authority_private.submission_group_command_receipts r,
      lateral jsonb_array_elements(r.result->'spawned') s(value)
      where r.group_id=job.group_id and r.command_name='submit_submission_group' and r.idempotency_key=job.receipt_key and s.value->>'authority_record_id'=job.record_id::text;
    body := body || jsonb_build_object('token',spawned->>(inv.participant_role || '_token'),
      'institution_name',spawned->>'institution_name','email',inv.email_normalized,
      'participant_name',case when inv.participant_role='principal' then rec.principal_name else rec.representative_name end,
      'other_person_name',case when inv.participant_role='principal' then rec.representative_name else rec.principal_name end,
      'purpose',rec.purpose,'account_boundary',rec.account_boundary);
  end if;
  update authority_private.submission_delivery_jobs set status='processing',attempts=attempts+1,
    lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',updated_at=now() where id=job.id returning * into job;
  insert into authority_private.submission_delivery_events(job_id,attempt,event_type) values(job.id,job.attempts,'started');
  return jsonb_build_object('id',job.id,'lease_token',job.lease_token,'kind',job.kind,'payload',body);
end $$;

create function public.finish_submission_delivery_v1(p_job_id uuid,p_lease_token uuid,p_success boolean,p_error text default null,p_message_id text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare job authority_private.submission_delivery_jobs%rowtype;
begin
  select * into job from authority_private.submission_delivery_jobs where id=p_job_id for update;
  if not found or job.status <> 'processing' or job.lease_token is distinct from p_lease_token or job.lease_until <= now() then
    raise exception using errcode='40001',message='delivery_lease_changed';
  end if;
  update authority_private.submission_delivery_jobs set status=case when p_success then 'succeeded' when attempts>=5 then 'needs_attention' else 'pending' end,
    next_attempt_at=now()+interval '1 minute' * least(60,power(2,attempts)::int),
    last_error=case when p_success then null else left(coalesce(p_error,'delivery_failed'),100) end,
    provider_message_id=case when p_success then p_message_id else provider_message_id end,
    lease_token=null,lease_until=null,updated_at=now() where id=p_job_id;
  insert into authority_private.submission_delivery_events(job_id,attempt,event_type,detail)
    values(job.id,job.attempts,case when p_success then 'succeeded' else 'failed' end,case when p_success then null else left(coalesce(p_error,'delivery_failed'),100) end);
end $$;

create function public.get_submission_delivery_status_v1(p_session_token text,p_group_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform authority_private.get_requester_session_context_v1(p_session_token,p_group_id);
  return (select jsonb_build_object('total',count(*),'completed',count(*) filter(where status='succeeded'),
    'pending',count(*) filter(where status in ('pending','processing')),'needs_attention',count(*) filter(where status='needs_attention'),
    'retry_at',min(next_attempt_at) filter(where status='pending')) from authority_private.submission_delivery_jobs where group_id=p_group_id);
end $$;

-- Only the service client can claim work or acknowledge attempts. Requesters see counts, never payloads.
revoke all on function public.claim_submission_delivery_v1(uuid) from public,anon,authenticated;
revoke all on function public.finish_submission_delivery_v1(uuid,uuid,boolean,text,text) from public,anon,authenticated;
revoke all on function public.get_submission_delivery_status_v1(text,uuid) from public,anon,authenticated;
grant execute on function public.claim_submission_delivery_v1(uuid), public.finish_submission_delivery_v1(uuid,uuid,boolean,text,text) to service_role;
grant execute on function public.get_submission_delivery_status_v1(text,uuid) to anon,authenticated,service_role;

create function authority_private.prevent_submission_delivery_event_change() returns trigger
language plpgsql set search_path='' as $$ begin raise exception 'delivery_events_are_append_only'; end $$;
create trigger submission_delivery_events_immutable before update or delete on authority_private.submission_delivery_events
for each row execute function authority_private.prevent_submission_delivery_event_change();
revoke all on function authority_private.prevent_submission_delivery_event_change() from public,anon,authenticated;
