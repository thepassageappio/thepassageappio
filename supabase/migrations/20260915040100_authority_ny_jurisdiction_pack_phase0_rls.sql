-- Phase 0b: RLS + grants for ENG-JURIS-NY (#124). Continues 20260915040000.

alter table public.jurisdiction_packs enable row level security;
alter table public.jurisdiction_packs force row level security;
alter table public.jurisdiction_reason_codes enable row level security;
alter table public.jurisdiction_reason_codes force row level security;
alter table public.organization_jurisdiction_pack_settings enable row level security;
alter table public.organization_jurisdiction_pack_settings force row level security;
alter table public.authority_affidavit_exchanges enable row level security;
alter table public.authority_affidavit_exchanges force row level security;

create policy jurisdiction_packs_authenticated_select
  on public.jurisdiction_packs for select to authenticated
  using (true);

create policy jurisdiction_reason_codes_authenticated_select
  on public.jurisdiction_reason_codes for select to authenticated
  using (true);

create policy organization_jurisdiction_pack_settings_member_select
  on public.organization_jurisdiction_pack_settings for select to authenticated
  using (authority_private.has_active_membership(organization_id));

create policy authority_affidavit_exchanges_member_select
  on public.authority_affidavit_exchanges for select to authenticated
  using (authority_private.has_active_membership(
    organization_id, array['owner', 'admin', 'staff', 'reviewer', 'auditor']
  ));

revoke all on public.jurisdiction_packs from public, anon, authenticated;
revoke all on public.jurisdiction_reason_codes from public, anon, authenticated;
revoke all on public.organization_jurisdiction_pack_settings from public, anon, authenticated;
revoke all on public.authority_affidavit_exchanges from public, anon, authenticated;

grant select on public.jurisdiction_packs to authenticated;
grant select on public.jurisdiction_reason_codes to authenticated;
grant select on public.organization_jurisdiction_pack_settings to authenticated;
grant select on public.authority_affidavit_exchanges to authenticated;
