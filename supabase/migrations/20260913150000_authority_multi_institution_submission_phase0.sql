-- Phase 0: user-initiated, multi-institution submission. Demo-only prototype.
-- Additive on top of the existing single-org authority_records model, which is
-- otherwise unchanged. See:
--   docs/USER-INITIATED-MULTI-INSTITUTION-SCOPE-2026-09-13.md
--   docs/PARTICIPANT-AUTHORITY-PORTFOLIO-STRATEGY-2026-09-08.md
--
-- Exactly one touch to an existing table:
--   public.authority_records.origin_group_id (nullable) - traceability back
--   to the submission group that spawned a record. Null for every
--   institution-initiated record, exactly as before. No other change to
--   authority_records' shape.
--
-- authority_records.created_by and authority_participant_invitations.invited_by
-- both stay NOT NULL, unchanged, referencing auth.users(id) - system-spawned
-- rows attribute to a single, clearly-labeled synthetic system actor (inserted
-- below) rather than relaxing either constraint. That keeps every existing
-- "who did this" query and audit trail meaningful without widening either
-- column's contract.
--
-- authority_institution_decisions is completely untouched. Nothing here
-- weakens its `authority_record_id unique` guarantee.

-- ---------------------------------------------------------------------------
-- 0. Storage bucket for shared (pre-spawn) submission evidence.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('authority-submission-evidence', 'authority-submission-evidence', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 0b. Synthetic system actor of record for system-spawned rows.
-- Demo-only. Never signs in; exists solely so created_by/invited_by keep
-- their existing NOT NULL auth.users FK contract unchanged for records and
-- invitations spawned by a multi-institution submission rather than by a
-- human institution staff member.
-- ---------------------------------------------------------------------------

insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'system+multi-institution-submission@thepassageapp.io',
  now(),
  '{"provider": "system"}'::jsonb,
  '{"full_name": "Passage System - Multi-Institution Submission", "system_actor": true}'::jsonb,
  false, false, now(), now()
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 1. New tables: submission groups, targets, shared evidence.
-- ---------------------------------------------------------------------------

create table public.authority_submission_groups (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default ('PG-' || upper(substr(replace((gen_random_uuid())::text, '-', ''), 1, 10))),
  status text not null default 'draft' check (status in (
    'draft', 'email_pending', 'ready', 'submitted', 'fanned_out', 'withdrawn'
  )),
  requester_name text not null check (char_length(btrim(requester_name)) between 2 and 160),
  requester_email_normalized text not null check (requester_email_normalized = lower(btrim(requester_email_normalized))),
  requester_relationship text not null check (requester_relationship in ('representative', 'principal_self', 'other')),
  principal_name text,
  principal_email_normalized text,
  representative_name text,
  representative_email_normalized text,
  principal_confirmation_available boolean,
  principal_confirmation_unavailable_reason text,
  review_flag text not null default 'standard' check (review_flag in ('standard', 'light_review')),
  requester_attestation_text_version text,
  requester_attestation_acknowledged_at timestamptz,
  submitted_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    principal_confirmation_available is not false
    or nullif(btrim(principal_confirmation_unavailable_reason), '') is not null
  )
);

create index authority_submission_groups_requester_email_idx
  on public.authority_submission_groups(requester_email_normalized);
create index authority_submission_groups_status_idx
  on public.authority_submission_groups(status);

comment on table public.authority_submission_groups is
  'Demo-only Phase 0 prototype. One row per requester submission event that fans out to N institutions. Not owned by an organization_id by design.';

create table public.authority_submission_group_targets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.authority_submission_groups(id) on delete restrict,
  ordinal int not null check (ordinal between 1 and 5),
  organization_id uuid references public.organizations(id) on delete restrict,
  target_label text not null check (char_length(btrim(target_label)) between 2 and 160),
  target_institution_type text not null check (char_length(btrim(target_institution_type)) between 2 and 80),
  match_status text not null default 'unmatched' check (match_status in (
    'matched', 'unmatched', 'invited_to_join', 'declined_to_join'
  )),
  authority_record_id uuid references public.authority_records(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, ordinal)
);

create unique index authority_submission_group_targets_group_org_idx
  on public.authority_submission_group_targets(group_id, organization_id)
  where organization_id is not null;
create index authority_submission_group_targets_group_id_idx
  on public.authority_submission_group_targets(group_id);
create index authority_submission_group_targets_authority_record_id_idx
  on public.authority_submission_group_targets(authority_record_id);

comment on table public.authority_submission_group_targets is
  'Demo-only Phase 0 prototype. One row per institution a requester named. match_status/organization_id/authority_record_id stay nullable-by-design for the not-yet-on-Passage case.';

create table public.authority_submission_group_evidence (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.authority_submission_groups(id) on delete restrict,
  requirement_key text not null check (requirement_key in ('power_of_attorney', 'identity_evidence')),
  storage_bucket text not null default 'authority-submission-evidence',
  storage_path text not null,
  original_filename text not null,
  media_type text not null check (media_type in ('application/pdf', 'image/jpeg', 'image/png')),
  byte_size bigint not null check (byte_size between 1 and 10485760),
  sha256_hex text not null check (sha256_hex ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (group_id, requirement_key)
);

comment on table public.authority_submission_group_evidence is
  'Demo-only Phase 0 prototype. The one shared upload per requirement the requester provides once. Copied (never referenced) into per-institution authority_evidence_artifacts rows at spawn time.';

-- ---------------------------------------------------------------------------
-- 2. Existing-table touch.
-- ---------------------------------------------------------------------------

alter table public.authority_records
  add column origin_group_id uuid references public.authority_submission_groups(id) on delete restrict;

create index authority_records_origin_group_id_idx
  on public.authority_records(origin_group_id)
  where origin_group_id is not null;

comment on column public.authority_records.origin_group_id is
  'Nullable. Set only for records spawned from a multi-institution submission group. Null for every institution-initiated record. No other change to this table.';

-- ---------------------------------------------------------------------------
-- 3. Private-schema tables: verification links, sessions, receipts, concierge.
-- ---------------------------------------------------------------------------

create table authority_private.requester_verification_links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.authority_submission_groups(id) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index requester_verification_links_group_id_idx
  on authority_private.requester_verification_links(group_id);

create table authority_private.requester_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.authority_submission_groups(id) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index requester_sessions_group_id_status_idx
  on authority_private.requester_sessions(group_id, status, expires_at);

create table authority_private.submission_group_command_receipts (
  group_id uuid not null references public.authority_submission_groups(id) on delete restrict,
  command_name text not null,
  idempotency_key uuid not null,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  primary key (group_id, command_name, idempotency_key)
);

create table authority_private.submission_group_concierge_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.authority_submission_groups(id) on delete restrict,
  target_id uuid not null references public.authority_submission_group_targets(id) on delete restrict,
  task_type text not null default 'unmatched_institution_outreach' check (task_type in ('unmatched_institution_outreach')),
  status text not null default 'open' check (status in ('open', 'done')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_id, task_type)
);

comment on table authority_private.submission_group_concierge_tasks is
  'Internal manual-review todo list for unmatched institutions named by a requester. No automated outreach happens from this table in Phase 0 - it is a flag for ops to work by hand.';

alter table authority_private.requester_verification_links enable row level security;
alter table authority_private.requester_sessions enable row level security;
alter table authority_private.submission_group_command_receipts enable row level security;
alter table authority_private.submission_group_concierge_tasks enable row level security;

revoke all on authority_private.requester_verification_links from public, anon, authenticated;
revoke all on authority_private.requester_sessions from public, anon, authenticated;
revoke all on authority_private.submission_group_command_receipts from public, anon, authenticated;
revoke all on authority_private.submission_group_concierge_tasks from public, anon, authenticated;

comment on table authority_private.requester_verification_links is 'Non-exposed, hashed, one-time requester email verification links.';
comment on table authority_private.requester_sessions is 'Non-exposed, hashed, group-bound requester browser sessions.';
comment on table authority_private.submission_group_command_receipts is 'Non-exposed idempotency receipts for submission-group commands.';
