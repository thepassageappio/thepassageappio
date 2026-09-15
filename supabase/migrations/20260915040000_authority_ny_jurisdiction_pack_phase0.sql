-- Phase 0 scaffold for ENG-JURIS-NY (#124): versioned US-NY jurisdiction pack.
-- See docs/ENG-JURIS-NY-PHASE0-2026-09-15.md.

create table public.jurisdiction_packs (
  id uuid primary key default gen_random_uuid(),
  pack_key text not null check (char_length(btrim(pack_key)) between 2 and 80),
  pack_version text not null check (char_length(btrim(pack_version)) between 1 and 40),
  jurisdiction_code text not null check (jurisdiction_code ~ '^[A-Z]{2}-[A-Z]{2}$'),
  display_name text not null check (char_length(btrim(display_name)) between 2 and 160),
  status text not null default 'active' check (status in ('draft', 'active', 'retired')),
  enabled_for_live_claims boolean not null default false,
  effective_at timestamptz not null,
  retired_at timestamptz,
  default_timer_initial_business_days integer not null check (default_timer_initial_business_days between 1 and 60),
  default_timer_followup_business_days integer not null check (default_timer_followup_business_days between 1 and 60),
  default_form_class text not null default 'unknown'
    check (default_form_class in ('statutory_short', 'non_statutory', 'unknown')),
  source_citation text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pack_key, pack_version),
  check (retired_at is null or retired_at >= effective_at)
);

create index jurisdiction_packs_jurisdiction_status_idx
  on public.jurisdiction_packs(jurisdiction_code, status, effective_at desc);

comment on table public.jurisdiction_packs is
  'Versioned jurisdiction workflow packs. Metadata and timers only — Passage does not validate POAs or create authority.';

create table public.jurisdiction_reason_codes (
  id uuid primary key default gen_random_uuid(),
  pack_key text not null,
  pack_version text not null,
  code text not null check (char_length(btrim(code)) between 2 and 80),
  theme text not null check (char_length(btrim(theme)) between 2 and 80),
  label text not null check (char_length(btrim(label)) between 2 and 200),
  description text not null check (char_length(btrim(description)) between 2 and 500),
  severity text not null default 'info' check (severity in ('info', 'warn', 'block_hint')),
  is_fi_overlay boolean not null default false,
  warn_if_sole_refusal boolean not null default false,
  sort_ordinal integer not null default 100 check (sort_ordinal between 1 and 9999),
  status text not null default 'active' check (status in ('active', 'retired')),
  created_at timestamptz not null default now(),
  unique (pack_key, pack_version, code),
  foreign key (pack_key, pack_version)
    references public.jurisdiction_packs(pack_key, pack_version)
    on delete restrict
);

create index jurisdiction_reason_codes_pack_theme_idx
  on public.jurisdiction_reason_codes(pack_key, pack_version, theme, sort_ordinal);

comment on table public.jurisdiction_reason_codes is
  'Catalog of refusal / follow-up reason codes for a jurisdiction pack. FI overlay codes use is_fi_overlay=true.';

create table public.organization_jurisdiction_pack_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  pack_key text not null,
  pack_version text not null,
  timer_initial_business_days integer not null check (timer_initial_business_days between 1 and 60),
  timer_followup_business_days integer not null check (timer_followup_business_days between 1 and 60),
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  foreign key (pack_key, pack_version)
    references public.jurisdiction_packs(pack_key, pack_version)
    on delete restrict
);

comment on table public.organization_jurisdiction_pack_settings is
  'Per-institution timer defaults pinned from a jurisdiction pack. Does not auto-decide accept/refuse.';

create table public.authority_affidavit_exchanges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_record_id uuid not null references public.authority_records(id) on delete restrict,
  status text not null default 'requested' check (status in (
    'requested', 'received', 'withdrawn', 'closed_without_response'
  )),
  request_reason text not null check (char_length(btrim(request_reason)) between 3 and 500),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  response_summary text,
  response_artifact_id uuid references public.authority_evidence_artifacts(id) on delete restrict,
  responded_at timestamptz,
  closed_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'requested' and responded_at is null and response_summary is null and closed_at is null)
    or (status = 'received' and responded_at is not null and nullif(btrim(response_summary), '') is not null)
    or (status in ('withdrawn', 'closed_without_response') and closed_at is not null)
  )
);

create index authority_affidavit_exchanges_record_idx
  on public.authority_affidavit_exchanges(authority_record_id, requested_at desc);
create index authority_affidavit_exchanges_org_status_idx
  on public.authority_affidavit_exchanges(organization_id, status, requested_at desc);

comment on table public.authority_affidavit_exchanges is
  'Scaffolding for NY full-force affidavit request/response path. Stores workflow state only; not a legal determination.';

alter table public.authority_records
  add column if not exists jurisdiction_code text,
  add column if not exists jurisdiction_pack_key text,
  add column if not exists jurisdiction_pack_version text,
  add column if not exists form_class text,
  add column if not exists timer_initial_business_days integer,
  add column if not exists timer_followup_business_days integer;

alter table public.authority_evidence_artifacts
  add column if not exists attorney_certified_copy boolean;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'authority_records_form_class_check'
  ) then
    alter table public.authority_records
      add constraint authority_records_form_class_check
      check (
        form_class is null
        or form_class in ('statutory_short', 'non_statutory', 'unknown')
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'authority_records_timer_initial_check'
  ) then
    alter table public.authority_records
      add constraint authority_records_timer_initial_check
      check (
        timer_initial_business_days is null
        or timer_initial_business_days between 1 and 60
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'authority_records_timer_followup_check'
  ) then
    alter table public.authority_records
      add constraint authority_records_timer_followup_check
      check (
        timer_followup_business_days is null
        or timer_followup_business_days between 1 and 60
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'authority_records_jurisdiction_code_check'
  ) then
    alter table public.authority_records
      add constraint authority_records_jurisdiction_code_check
      check (
        jurisdiction_code is null
        or jurisdiction_code ~ '^[A-Z]{2}-[A-Z]{2}$'
      );
  end if;
end $$;

comment on column public.authority_records.jurisdiction_pack_key is
  'Pinned jurisdiction pack key recorded on the request. Null on legacy rows until backfilled.';
comment on column public.authority_records.form_class is
  'Recorded form class: statutory_short | non_statutory | unknown. Institution-entered; Passage does not validate.';
comment on column public.authority_records.timer_initial_business_days is
  'Recorded initial timer (business days) from FI pack settings at pin time. Illustrative workflow metadata only.';
comment on column public.authority_records.timer_followup_business_days is
  'Recorded follow-up timer (business days) after affidavit/response. Illustrative workflow metadata only.';
comment on column public.authority_evidence_artifacts.attorney_certified_copy is
  'Optional flag that the uploaded instrument was presented as an attorney-certified copy. Not a validity finding.';

insert into public.jurisdiction_packs (
  pack_key, pack_version, jurisdiction_code, display_name, status,
  enabled_for_live_claims, effective_at,
  default_timer_initial_business_days, default_timer_followup_business_days,
  default_form_class, source_citation, notes
) values (
  'us_ny_financial_poa',
  '2026.1',
  'US-NY',
  'New York financial power of attorney',
  'active',
  true,
  '2026-01-01T00:00:00Z',
  10,
  7,
  'unknown',
  'N.Y. GOL Title 15, esp. §5-1504',
  'Phase 0 reference pack. Timers are institution-configurable recorded metadata. Passage does not auto-decide honor/refuse.'
)
on conflict (pack_key, pack_version) do nothing;

insert into public.jurisdiction_reason_codes (
  pack_key, pack_version, code, theme, label, description, severity,
  is_fi_overlay, warn_if_sole_refusal, sort_ordinal
) values
  ('us_ny_financial_poa', '2026.1', 'ny.reasonable_cause.genuineness', 'reasonable_cause',
   'Concern about genuineness', 'Institution recorded concern about whether the instrument is genuine.', 'info', false, false, 10),
  ('us_ny_financial_poa', '2026.1', 'ny.reasonable_cause.revocation', 'reasonable_cause',
   'Concern about revocation', 'Institution recorded concern that the authority may have been revoked.', 'info', false, false, 20),
  ('us_ny_financial_poa', '2026.1', 'ny.reasonable_cause.death_or_incapacity', 'reasonable_cause',
   'Concern about death or incapacity at execution', 'Institution recorded concern about the principal''s status at execution.', 'info', false, false, 30),
  ('us_ny_financial_poa', '2026.1', 'ny.reasonable_cause.scope', 'reasonable_cause',
   'Requested action outside instrument scope', 'Institution recorded that the requested action appears outside the powers shown.', 'info', false, false, 40),
  ('us_ny_financial_poa', '2026.1', 'ny.followup.affidavit_requested', 'followup',
   'Full-force affidavit requested', 'Institution requested a full-force affidavit under the NY pack path.', 'info', false, false, 50),
  ('us_ny_financial_poa', '2026.1', 'ny.followup.opinion_of_counsel', 'followup',
   'Opinion of counsel requested', 'Institution requested a written opinion of counsel as supplemental material.', 'info', false, false, 60),
  ('us_ny_financial_poa', '2026.1', 'ny.warn.not_our_form_alone', 'refusal_warning',
   'Refusal is only not our form', 'Warn when the only recorded refusal reason is that the instrument is not the institution''s form.', 'warn', false, true, 70),
  ('us_ny_financial_poa', '2026.1', 'ny.warn.age_alone', 'refusal_warning',
   'Refusal is age alone', 'Warn when the only recorded refusal reason is the age of a statutory short form.', 'warn', false, true, 80),
  ('us_ny_financial_poa', '2026.1', 'ny.fi.custom_overlay', 'fi_overlay',
   'Institution custom reason', 'Placeholder for FI-editable overlay codes in a later PR.', 'info', true, false, 900)
on conflict (pack_key, pack_version, code) do nothing;

update public.authority_records
set
  jurisdiction_code = coalesce(jurisdiction_code, 'US-NY'),
  jurisdiction_pack_key = coalesce(jurisdiction_pack_key, 'us_ny_financial_poa'),
  jurisdiction_pack_version = coalesce(jurisdiction_pack_version, '2026.1'),
  form_class = coalesce(form_class, 'unknown'),
  timer_initial_business_days = coalesce(timer_initial_business_days, 10),
  timer_followup_business_days = coalesce(timer_followup_business_days, 7)
where template_key = 'ny_financial_poa';

insert into public.organization_jurisdiction_pack_settings (
  organization_id, pack_key, pack_version,
  timer_initial_business_days, timer_followup_business_days,
  updated_by, updated_at, version
)
select
  s.organization_id,
  'us_ny_financial_poa',
  '2026.1',
  10,
  7,
  s.selected_by,
  now(),
  1
from public.organization_template_selections s
where s.template_key = 'ny_financial_poa'
on conflict (organization_id) do nothing;
