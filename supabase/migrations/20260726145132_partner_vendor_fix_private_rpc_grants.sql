-- Bug fix found during live hosted QA: the public.*_idempotent wrapper
-- functions are SECURITY INVOKER (thin pass-throughs), so when authenticated
-- calls e.g. public.respond_to_partner_request_idempotent(...), the wrapper
-- executes AS authenticated -- and its call into
-- passage_private.respond_to_partner_request_idempotent(...) is therefore
-- also checked under the authenticated role, not the function owner. That
-- private function is SECURITY DEFINER (so its own body runs with elevated
-- privilege once entered), but entering it at all still requires EXECUTE on
-- the private function itself. Confirmed against the working Cycle 8
-- lineage: passage_private.start_task_idempotent and
-- passage_private.submit_task_proof_idempotent are both directly granted
-- EXECUTE to authenticated; mine were not, which is why every partner RPC
-- call failed with "denied" in the live vendor session (accept-with-quote
-- returned "This request is not available to your account").
grant execute on function passage_private.create_partner_request_idempotent(uuid, uuid, text, text, text, timestamptz, uuid) to authenticated;
grant execute on function passage_private.respond_to_partner_request_idempotent(uuid, integer, text, integer, text, uuid) to authenticated;
grant execute on function passage_private.submit_partner_request_proof_idempotent(uuid, integer, text, text, uuid) to authenticated;
grant execute on function passage_private.verify_partner_request_idempotent(uuid, integer, uuid) to authenticated;
