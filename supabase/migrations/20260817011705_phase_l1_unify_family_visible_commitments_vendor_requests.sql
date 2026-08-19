-- Backfill: applied directly to production via the Supabase MCP tool on 2026-08-17/18,
-- never committed to git until now (2026-08-19). This file's content is the verified
-- live production definition (via pg_get_functiondef / information_schema), reconstructed
-- to close the gap tracked in docs/product/operational-readiness-roadmap.md item 10 --
-- it is NOT a re-authored guess and NOT meant to be re-applied (the version above is
-- already recorded as applied in this project's remote migration history).
--
-- Phase L.1: unify family-visible commitments -- surfaces vendor/partner request
-- status in a family's own case timeline, not just staff-assigned tasks. This is the
-- ORIGINAL creation of passage_private.get_family_visible_partner_requests.
--
-- IMPORTANT, already documented in the roadmap ("CRITICAL -- three RPC call sites were
-- silently broken in production"): this migration created only the passage_private
-- (private-schema) version. PostgREST/client.rpc() only resolves against the public
-- schema, so this function 404'd silently from day one -- "families have never
-- actually seen vendor-request status merged into their timeline, despite Phase L.1
-- being recorded as shipped and verified." The missing public.* wrapper was added
-- later by the already-committed
-- supabase/migrations/20260818070000_fix_missing_family_participant_rpcs.sql. Do not
-- add that wrapper here -- doing so would erase the very gap this history records.
--
-- RLS note: checked pg_policies for partner_requests -- the only policy present is
-- partner_requests_authorized_select (organization-staff scoped, via
-- passage_private.can_view_partner_request). No family/participant-facing RLS policy
-- exists on partner_requests; family visibility is deliberately routed entirely
-- through this SECURITY DEFINER function bypassing RLS, the same pattern used
-- throughout this codebase for cross-persona reads. No RLS policy change accompanies
-- this migration.
--
-- Verified live via pg_get_functiondef on 2026-08-19; not touched by any later
-- migration except the public-wrapper addition noted above. High confidence.

CREATE OR REPLACE FUNCTION passage_private.get_family_visible_partner_requests(p_workflow_id uuid)
 RETURNS TABLE(id uuid, category text, title text, status text, needed_by timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select r.id, r.category, r.title, r.status, r.needed_by, r.created_at, r.updated_at
  from public.partner_requests as r
  join public.workflows as w on w.id = r.workflow_id
  where r.workflow_id = p_workflow_id
    and (
      w.user_id = (select auth.uid())
      or lower(w.coordinator_email) = lower((select auth.jwt() ->> 'email'))
      or exists (
        select 1 from public.estate_access as ea
        where ea.workflow_id = w.id
          and coalesce(ea.status, 'accepted') <> 'revoked'
          and (ea.user_id = (select auth.uid()) or lower(ea.email) = lower((select auth.jwt() ->> 'email')))
      )
    )
  order by r.created_at;
$function$;
