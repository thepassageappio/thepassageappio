-- Run after all migrations. Every fixture and grant below is rolled back.
begin;

do $$
declare f record; browser_role text;
begin
  for f in select p.oid, n.nspname, p.proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'authority_private')
      and p.proname in ('start_submission_group_v1', 'submit_submission_group_v1', 'record_submission_group_evidence_upload_v1')
  loop
    foreach browser_role in array array['anon', 'authenticated'] loop
      if has_function_privilege(browser_role, f.oid, 'EXECUTE') then
        raise exception 'Browser can execute %.% as %', f.nspname, f.proname, browser_role;
      end if;
    end loop;
    if not has_function_privilege('service_role', f.oid, 'EXECUTE') then
      raise exception 'Server cannot execute %.%', f.nspname, f.proname;
    end if;
  end loop;
end;
$$;

-- A known existing object must remain invisible even with another permissive policy.
insert into storage.objects(bucket_id, name)
values ('authority-submission-evidence', 'boundary-test/known-file.pdf');
create policy boundary_test_permissive on storage.objects for all to anon, authenticated
  using (true) with check (true);

set local role anon;
do $$
begin
  begin
    perform public.start_submission_group_v1('Boundary Test', 'boundary@example.invalid', 'other', gen_random_uuid());
    raise exception 'Anonymous caller obtained verification secret';
  exception when insufficient_privilege then null;
  end;
  if exists(select 1 from storage.objects where bucket_id = 'authority-submission-evidence') then
    raise exception 'Anonymous caller can read submission evidence';
  end if;
  begin
    insert into storage.objects(bucket_id, name) values ('authority-submission-evidence', 'boundary-test/anonymous.pdf');
    raise exception 'Anonymous caller can upload submission evidence';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role authenticated;
do $$
begin
  if exists(select 1 from storage.objects where bucket_id = 'authority-submission-evidence') then
    raise exception 'Unrelated signed-in caller can read submission evidence';
  end if;
  begin
    insert into storage.objects(bucket_id, name) values ('authority-submission-evidence', 'boundary-test/other-user.pdf');
    raise exception 'Unrelated signed-in caller can upload submission evidence';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Trusted initiation still works; only the mailed verification secret unlocks a session.
set local role service_role;
do $$
declare started jsonb;
begin
  started := public.start_submission_group_v1('Boundary Test', 'boundary@example.invalid', 'other', gen_random_uuid());
  if not (started ? 'verification_token') then raise exception 'Server initiation failed'; end if;
  perform set_config('test.verification_token', started->>'verification_token', true);
  perform set_config('test.group_id', started->>'group_id', true);
end;
$$;
reset role;

set local role anon;
do $$
declare verified jsonb; replayed jsonb; key uuid := gen_random_uuid();
begin
  verified := public.verify_requester_email_v1(current_setting('test.verification_token'), key);
  replayed := public.verify_requester_email_v1(current_setting('test.verification_token'), key);
  if not (verified ? 'session_token') or verified->>'session_token' <> replayed->>'session_token' then
    raise exception 'Verification or idempotent replay failed';
  end if;
  perform public.get_requester_session_context_v1(verified->>'session_token', current_setting('test.group_id')::uuid);
  begin
    perform public.get_requester_session_context_v1(verified->>'session_token', gen_random_uuid());
    raise exception 'Session crossed group boundary';
  exception when sqlstate 'P0002' then
    if sqlerrm <> 'requester_session_unavailable' then raise; end if;
  end;
end;
$$;
reset role;
select 'submission server boundary: PASS' as result;
rollback;
