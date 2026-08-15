-- Cycle 7A isolated hosted-QA idempotent invitation ACL hardening.
--
-- WHAT: use the established public SECURITY INVOKER -> private checked-function
-- privilege chain for the new idempotent creation RPC.
-- WHY: the private implementation explicitly verifies Auth and organization,
-- location, and replay scope; a public SECURITY DEFINER wrapper is unnecessary
-- and produces a security-advisor warning.
-- BREAKAGE IF SKIPPED: the public wrapper retains broader execution posture.
-- BREAKAGE IF MISAPPLIED: missing the new private grant makes the public wrapper
-- fail closed; restoring either superseded old grant reopens duplicate bypass.
--
-- ISOLATED LAB ONLY: apply through Supabase migration tooling only to
-- uyacxqtsiwlvtmhxvoxr. Never apply to production qsveqfchwylsbncsfgxe.

alter function public.create_employee_invitation_idempotent(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) security invoker;

grant execute on function passage_private.create_employee_invitation_idempotent(
  uuid, text, uuid[], text, timestamp with time zone, uuid
) to authenticated;

revoke execute on function public.create_employee_invitation(
  uuid, text, uuid[], text, timestamp with time zone
) from authenticated;

revoke execute on function passage_private.create_employee_invitation(
  uuid, text, uuid[], text, timestamp with time zone
) from authenticated;
