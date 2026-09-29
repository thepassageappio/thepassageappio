-- Phase 2 of the security definer lockdown (audit 2026-09-28).
--
-- APPLY ONLY AFTER the app deploy in which submitParticipantDecisionAction calls
-- submit_participant_decision_v1 through createAuthorityAdminClient() is live. Applying it
-- earlier makes the old deployment's participant decisions fail with permission denied.
--
-- Closes the BLOCKER: anon/authenticated could call this RPC directly with a principal's
-- session cookie and receive the representative's raw invitation token in the response.
-- The session token is still verified inside the function; only the caller role changes.
revoke execute on function public.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid)
  from public, anon, authenticated;
grant execute on function public.submit_participant_decision_v1(text, uuid, bigint, text, boolean, text, uuid)
  to service_role;

do $$
begin
  if has_function_privilege('anon', 'public.submit_participant_decision_v1(text,uuid,bigint,text,boolean,text,uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.submit_participant_decision_v1(text,uuid,bigint,text,boolean,text,uuid)', 'execute') then
    raise exception 'submit_participant_decision_v1 is still executable by a client role';
  end if;
end;
$$;
