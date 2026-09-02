-- Participant invitation pages are intentionally available before Supabase sign-in.
-- The bearer token is validated inside the private security-definer functions.
-- Keep the anonymous role restricted to only the four participant boundaries.

grant usage on schema authority_private to anon;

revoke all on all tables in schema authority_private from anon;
revoke all on all sequences in schema authority_private from anon;
revoke execute on all functions in schema authority_private from public, anon;

grant execute on function authority_private.preview_participant_invitation_v1(text) to anon;
grant execute on function authority_private.exchange_participant_invitation_v1(text, uuid) to anon;
grant execute on function authority_private.get_participant_session_context_v1(text, uuid) to anon;
grant execute on function authority_private.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid) to anon;

alter default privileges in schema authority_private revoke execute on functions from public, anon;
