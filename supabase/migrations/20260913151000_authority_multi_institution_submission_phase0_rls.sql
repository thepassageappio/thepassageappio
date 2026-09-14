-- Security advisor flagged the 3 new public tables as RLS-disabled-in-public
-- (ERROR level). They should only ever be touched through the security-definer
-- RPCs above (which run as the table owner and are unaffected by RLS), never
-- directly by anon/authenticated via PostgREST. Enable RLS with zero policies
-- - the same default-deny pattern already used for authority_private tables -
-- and explicitly revoke any direct table grants for defense in depth.

alter table public.authority_submission_groups enable row level security;
alter table public.authority_submission_group_targets enable row level security;
alter table public.authority_submission_group_evidence enable row level security;

revoke all on public.authority_submission_groups from anon, authenticated;
revoke all on public.authority_submission_group_targets from anon, authenticated;
revoke all on public.authority_submission_group_evidence from anon, authenticated;

comment on table public.authority_submission_groups is
  'Demo-only Phase 0 prototype. One row per requester submission event that fans out to N institutions. Not owned by an organization_id by design. RLS enabled, no policies: reachable only via the security-definer RPC surface, never direct PostgREST access.';
comment on table public.authority_submission_group_targets is
  'Demo-only Phase 0 prototype. One row per institution a requester named. match_status/organization_id/authority_record_id stay nullable-by-design for the not-yet-on-Passage case. RLS enabled, no policies: RPC surface only.';
comment on table public.authority_submission_group_evidence is
  'Demo-only Phase 0 prototype. The one shared upload per requirement the requester provides once. Copied (never referenced) into per-institution authority_evidence_artifacts rows at spawn time. RLS enabled, no policies: RPC surface only.';
