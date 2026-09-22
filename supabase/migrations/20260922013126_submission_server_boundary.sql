-- Secrets returned by these commands belong only to trusted server code.
-- The requester session checks inside the functions remain in force.
revoke execute on function public.start_submission_group_v1(text, text, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.start_submission_group_v1(text, text, text, uuid) from public, anon, authenticated;
revoke execute on function public.submit_submission_group_v1(text, uuid, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.submit_submission_group_v1(text, uuid, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function public.record_submission_group_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) from public, anon, authenticated;
revoke execute on function authority_private.record_submission_group_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) from public, anon, authenticated;

grant usage on schema authority_private to service_role;
grant execute on function public.start_submission_group_v1(text, text, text, uuid) to service_role;
grant execute on function authority_private.start_submission_group_v1(text, text, text, uuid) to service_role;
grant execute on function public.submit_submission_group_v1(text, uuid, bigint, text, uuid) to service_role;
grant execute on function authority_private.submit_submission_group_v1(text, uuid, bigint, text, uuid) to service_role;
grant execute on function public.record_submission_group_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) to service_role;
grant execute on function authority_private.record_submission_group_evidence_upload_v1(text, uuid, bigint, text, uuid, text, text, text, bigint, text, uuid) to service_role;

-- Upload/copy already uses the server's service-role Storage client.
-- No requester-facing direct bucket access is needed.
drop policy if exists "requester evidence upload" on storage.objects;
drop policy if exists "requester evidence read own" on storage.objects;
create policy "submission evidence server only" on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id <> 'authority-submission-evidence')
  with check (bucket_id <> 'authority-submission-evidence');
