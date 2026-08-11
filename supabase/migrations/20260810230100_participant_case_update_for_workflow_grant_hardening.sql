-- CREATE FUNCTION grants EXECUTE to PUBLIC by default, which also covers anon.
-- Every other participant/messaging RPC in this schema explicitly restricts to
-- authenticated only (see list_participant_family_updates, list_workflow_messages_client_safe).
-- Match that pattern for the new get_family_case_update_for_workflow function added
-- in the participant_case_update_for_workflow migration.
revoke execute on function public.get_family_case_update_for_workflow(uuid) from public;
revoke execute on function public.get_family_case_update_for_workflow(uuid) from anon;
grant execute on function public.get_family_case_update_for_workflow(uuid) to authenticated;
