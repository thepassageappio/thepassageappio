revoke execute on function public.get_participant_evidence_context_v1(text, uuid) from public, anon, authenticated;
grant execute on function public.get_participant_evidence_context_v1(text, uuid) to service_role;

create index if not exists authority_attestations_organization_id_idx
  on public.authority_attestations(organization_id);
create index if not exists authority_attestations_requirement_id_idx
  on public.authority_attestations(requirement_id);
create index if not exists authority_evidence_artifacts_requirement_id_idx
  on public.authority_evidence_artifacts(requirement_id);
create index if not exists authority_evidence_artifacts_reviewer_user_id_idx
  on public.authority_evidence_artifacts(reviewer_user_id)
  where reviewer_user_id is not null;

comment on function public.get_participant_evidence_context_v1(text, uuid) is
  'Service-only participant evidence boundary. The private implementation validates the hashed role-bound session token and record state.';
