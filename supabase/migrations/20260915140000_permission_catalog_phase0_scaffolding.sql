-- Phase 0 permission catalog scaffolding (ENG-CATALOG-P1 / #129).
-- Additive only. HOSTED_ACTIONS / allowed_action_keys remain the fallback allow-list
-- until a request pins catalog_version_id. Live claims stay NY financial_poa + two acts.
-- Do not claim full institution catalog publish, multi-state, death/title, or multi-inst-as-live.
-- UI copy must never say "catalog" — use "What people may ask for" / "What the bank said yes to".

-- ---------------------------------------------------------------------------
-- 1. Platform semantic registry
-- ---------------------------------------------------------------------------

create table public.authority_type_defs (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  semantic_version text not null,
  pack_ready boolean not null default false,
  card_title text not null check (char_length(btrim(card_title)) between 1 and 120),
  card_help text not null check (char_length(btrim(card_help)) between 1 and 280),
  workflow_flags jsonb not null default '{}'::jsonb check (jsonb_typeof(workflow_flags) = 'object'),
  sort_order int not null default 100,
  effective_at timestamptz not null default now(),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (key, semantic_version)
);

create unique index authority_type_defs_live_key_idx
  on public.authority_type_defs (key)
  where retired_at is null;

comment on table public.authority_type_defs is
  'Platform authority-type registry. pack_ready is Compliance-owned; non-ready types stay hidden from create/offer.';

create table public.permission_defs (
  id uuid primary key default gen_random_uuid(),
  authority_type_key text not null,
  key text not null,
  kind text not null check (kind in ('act', 'channel')),
  group_key text not null default 'service',
  default_label text not null check (char_length(btrim(default_label)) between 1 and 60),
  default_help text not null check (char_length(btrim(default_help)) between 1 and 160),
  semantic_version text not null,
  risk_tier int not null default 1 check (risk_tier between 1 and 5),
  availability text not null default 'production' check (availability in ('production', 'demo_only')),
  created_at timestamptz not null default now(),
  unique (authority_type_key, key, semantic_version)
);

comment on table public.permission_defs is
  'Platform standard permission semantics. Label edits without meaning change do not bump semantic_version.';

insert into public.authority_type_defs (
  key, semantic_version, pack_ready, card_title, card_help, workflow_flags, sort_order
) values
  (
    'financial_poa', '2026.9.15.1', true,
    'Help with a bank account (power of attorney)',
    'A living person named a helper on a power of attorney for a bank account.',
    '{"no_principal_participant": false}'::jsonb, 10
  ),
  (
    'decedent_servicing', '2026.9.15.1', false,
    'Someone has died — help with their accounts',
    'The bank needs proof of death and who may act next.',
    '{"no_principal_participant": true}'::jsonb, 20
  ),
  (
    'executor_estate', '2026.9.15.1', false,
    'Help as an executor or personal representative',
    'Court papers name you to handle estate banking.',
    '{"no_principal_participant": true}'::jsonb, 30
  ),
  (
    'trustee', '2026.9.15.1', false,
    'Help as a trustee',
    'Help with a trust account using trustee papers the bank accepts.',
    '{}'::jsonb, 40
  ),
  (
    'guardianship_conservatorship', '2026.9.15.1', false,
    'Help under a court guardianship',
    'A court order says what you may and may not do.',
    '{}'::jsonb, 50
  ),
  (
    'vehicle_title_authority', '2026.9.15.1', false,
    'Help with a car title or auto loan',
    'Payoff letters, title papers, or lien packets the bank allows. Passage does not file with the DMV.',
    '{}'::jsonb, 60
  );

insert into public.permission_defs (
  authority_type_key, key, kind, group_key, default_label, default_help, semantic_version, risk_tier, availability
) values
  (
    'financial_poa', 'receive_duplicate_statements', 'act', 'information',
    'Get copies of account statements',
    'The helper asks the bank to send statement copies for this account.',
    '2026.9.15.1', 1, 'production'
  ),
  (
    'financial_poa', 'discuss_service_issues', 'act', 'service',
    'Talk with the bank about the account',
    'The helper may call or visit to ask ordinary service questions. This does not mean they can move money.',
    '2026.9.15.1', 1, 'production'
  );

-- ---------------------------------------------------------------------------
-- 2. Organization catalog tables (versioned; publish APIs later)
-- ---------------------------------------------------------------------------

create table public.organization_authority_type_offers (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_type_key text not null,
  offered boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (organization_id, authority_type_key)
);

comment on table public.organization_authority_type_offers is
  'Org may offer a type only when platform pack_ready is true. Live claims stay NY financial_poa until enable flags say otherwise.';

create table public.organization_permission_catalog_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  authority_type_key text not null,
  version text not null,
  state text not null check (state in ('draft', 'published', 'superseded')),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  jurisdiction_package_key text,
  jurisdiction_package_version text,
  platform_semantic_version text not null,
  published_at timestamptz,
  published_by uuid,
  publish_reason text,
  created_at timestamptz not null default now(),
  unique (organization_id, authority_type_key, version)
);

create unique index organization_permission_catalog_one_published_idx
  on public.organization_permission_catalog_versions (organization_id, authority_type_key)
  where state = 'published';

comment on table public.organization_permission_catalog_versions is
  'Immutable published versions for what people may ask for. Phase 0 seeds a published financial_poa starter; admin publish UI is later.';

create table public.organization_permission_items (
  id uuid primary key default gen_random_uuid(),
  catalog_version_id uuid not null references public.organization_permission_catalog_versions(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  source text not null check (source in ('platform', 'institution')),
  permission_key text not null,
  kind text not null check (kind in ('act', 'channel')),
  offered boolean not null default true,
  label text not null check (char_length(btrim(label)) between 1 and 60),
  help text not null check (char_length(btrim(help)) between 1 and 160),
  group_key text not null default 'service',
  risk_tier int not null default 1 check (risk_tier between 1 and 5),
  availability text not null default 'production' check (availability in ('demo_only', 'production')),
  account_product_scope jsonb not null default '{}'::jsonb,
  platform_permission_def_id uuid references public.permission_defs(id) on delete restrict,
  label_version int not null default 1 check (label_version >= 1),
  created_at timestamptz not null default now(),
  unique (catalog_version_id, permission_key)
);

create index organization_permission_items_org_idx
  on public.organization_permission_items (organization_id);

comment on table public.organization_permission_items is
  'Items belonging to a catalog version. demo_only never appears on production live forms.';

-- ---------------------------------------------------------------------------
-- 3. Request + decision additive columns
-- ---------------------------------------------------------------------------

alter table public.authority_records
  add column if not exists authority_type_key text,
  add column if not exists catalog_version_id uuid references public.organization_permission_catalog_versions(id) on delete restrict,
  add column if not exists policy_content_hash text,
  add column if not exists requested_permissions_snapshot jsonb;

update public.authority_records
set authority_type_key = 'financial_poa'
where authority_type_key is null;

alter table public.authority_records
  alter column authority_type_key set default 'financial_poa',
  alter column authority_type_key set not null;

alter table public.authority_records
  add constraint authority_records_requested_permissions_snapshot_object
  check (requested_permissions_snapshot is null or jsonb_typeof(requested_permissions_snapshot) = 'object');

comment on column public.authority_records.catalog_version_id is
  'Null = legacy HOSTED_ACTIONS fixture path. When set, allowed keys come from that published version.';
comment on column public.authority_records.requested_permissions_snapshot is
  'Label snapshot pinned at draft/create time when catalog-backed; null for legacy rows.';

alter table public.authority_institution_decisions
  add column if not exists accepted_permissions_snapshot jsonb,
  add column if not exists not_included_permissions_snapshot jsonb;

alter table public.authority_institution_decisions
  add constraint authority_institution_decisions_accepted_permissions_snapshot_object
  check (accepted_permissions_snapshot is null or jsonb_typeof(accepted_permissions_snapshot) = 'object'),
  add constraint authority_institution_decisions_not_included_permissions_snapshot_object
  check (not_included_permissions_snapshot is null or jsonb_typeof(not_included_permissions_snapshot) = 'object');

comment on column public.authority_institution_decisions.accepted_permissions_snapshot is
  'Frozen accepted permission labels at decide time. Receipt UI must read this, not live defs.';
comment on column public.authority_institution_decisions.not_included_permissions_snapshot is
  'Asked-for keys not accepted, with labels frozen at decide time.';

-- ---------------------------------------------------------------------------
-- 4. Backfill: every org gets financial_poa offered + published two-item starter
-- ---------------------------------------------------------------------------

insert into public.organization_authority_type_offers (organization_id, authority_type_key, offered, updated_at)
select o.id, 'financial_poa', true, now()
from public.organizations o
on conflict (organization_id, authority_type_key) do nothing;

with seeded as (
  insert into public.organization_permission_catalog_versions (
    organization_id, authority_type_key, version, state, content_hash,
    jurisdiction_package_key, jurisdiction_package_version, platform_semantic_version,
    published_at, publish_reason
  )
  select
    o.id,
    'financial_poa',
    '2026.9.15.1',
    'published',
    encode(extensions.digest(convert_to(
      'financial_poa:2026.9.15.1:receive_duplicate_statements+discuss_service_issues:' || o.id::text,
      'UTF8'
    ), 'sha256'), 'hex'),
    'US-NY',
    '2026.1',
    '2026.9.15.1',
    now(),
    'Phase 0 starter: locked financial POA acts'
  from public.organizations o
  where not exists (
    select 1 from public.organization_permission_catalog_versions v
    where v.organization_id = o.id
      and v.authority_type_key = 'financial_poa'
      and v.state = 'published'
  )
  returning id, organization_id
)
insert into public.organization_permission_items (
  catalog_version_id, organization_id, source, permission_key, kind, offered,
  label, help, group_key, risk_tier, availability, platform_permission_def_id, label_version
)
select
  s.id, s.organization_id, 'platform', d.key, d.kind, true,
  d.default_label, d.default_help, d.group_key, d.risk_tier, d.availability, d.id, 1
from seeded s
cross join public.permission_defs d
where d.authority_type_key = 'financial_poa'
  and d.semantic_version = '2026.9.15.1';

-- ---------------------------------------------------------------------------
-- 5. RLS: members can read; writes stay server/service for Phase 0
-- ---------------------------------------------------------------------------

alter table public.authority_type_defs enable row level security;
alter table public.permission_defs enable row level security;
alter table public.organization_authority_type_offers enable row level security;
alter table public.organization_permission_catalog_versions enable row level security;
alter table public.organization_permission_items enable row level security;

create policy authority_type_defs_authenticated_select
on public.authority_type_defs for select to authenticated
using (true);

create policy permission_defs_authenticated_select
on public.permission_defs for select to authenticated
using (true);

create policy organization_authority_type_offers_member_select
on public.organization_authority_type_offers for select to authenticated
using ((select authority_private.has_active_membership(organization_id)));

create policy organization_permission_catalog_versions_member_select
on public.organization_permission_catalog_versions for select to authenticated
using ((select authority_private.has_active_membership(organization_id)));

create policy organization_permission_items_member_select
on public.organization_permission_items for select to authenticated
using ((select authority_private.has_active_membership(organization_id)));

revoke all on public.authority_type_defs from public, anon, authenticated;
revoke all on public.permission_defs from public, anon, authenticated;
revoke all on public.organization_authority_type_offers from public, anon, authenticated;
revoke all on public.organization_permission_catalog_versions from public, anon, authenticated;
revoke all on public.organization_permission_items from public, anon, authenticated;

grant select on public.authority_type_defs to authenticated;
grant select on public.permission_defs to authenticated;
grant select on public.organization_authority_type_offers to authenticated;
grant select on public.organization_permission_catalog_versions to authenticated;
grant select on public.organization_permission_items to authenticated;

grant select, insert, update, delete on public.authority_type_defs to service_role;
grant select, insert, update, delete on public.permission_defs to service_role;
grant select, insert, update, delete on public.organization_authority_type_offers to service_role;
grant select, insert, update, delete on public.organization_permission_catalog_versions to service_role;
grant select, insert, update, delete on public.organization_permission_items to service_role;
