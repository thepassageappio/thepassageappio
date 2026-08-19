-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Fix, four minutes after 20260817000443_phase_j_role_constraint_grant_audit_staff_case_creation.sql:
-- that migration's organization_member_locations_revocation_shape_check used a bare
-- `revocation_reason <> ''` comparison. In Postgres, `x <> NULL` evaluates to NULL, and
-- a CHECK constraint treats a NULL result as SATISFIED, not violated -- so a row with
-- revoked_at/revoked_by_user_id set but revocation_reason left NULL silently passed the
-- constraint instead of being rejected, defeating its entire purpose (the whole point of
-- the constraint is "a revocation always needs a reason"). Fixed by requiring
-- revocation_reason IS NOT NULL explicitly before checking its length -- the same idiom
-- already used correctly by the sibling organization_members_revocation_shape_check
-- constraint (already committed, supabase/migrations/20260816040000_production_task_proof_spine.sql).
--
-- This exact corrected definition is independently verified live via
-- pg_get_constraintdef on 2026-08-19 (high confidence) -- unlike the previous
-- migration's reconstructed "before" state, this file's content is not a guess.

alter table public.organization_member_locations
  drop constraint organization_member_locations_revocation_shape_check;

alter table public.organization_member_locations
  add constraint organization_member_locations_revocation_shape_check
  check (
    (revoked_at is not null and revoked_by_user_id is not null and revocation_reason is not null and length(btrim(revocation_reason)) > 0)
    or
    (revoked_at is null and revoked_by_user_id is null and revocation_reason is null)
  );
