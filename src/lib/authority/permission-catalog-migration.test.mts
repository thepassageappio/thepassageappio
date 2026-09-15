import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260915140000_permission_catalog_phase0_scaffolding.sql", import.meta.url),
  "utf8",
);

test("Phase 0 seeds financial_poa pack_ready and hides other kinds", () => {
  assert.match(migration, /create table public\.authority_type_defs/i);
  assert.match(migration, /'financial_poa', '2026\.9\.15\.1', true/);
  assert.match(migration, /'decedent_servicing', '2026\.9\.15\.1', false/);
  assert.match(migration, /'vehicle_title_authority', '2026\.9\.15\.1', false/);
});

test("Phase 0 seeds the two locked P1 permission labels", () => {
  assert.match(migration, /create table public\.permission_defs/i);
  assert.match(migration, /receive_duplicate_statements/);
  assert.match(migration, /Get copies of account statements/);
  assert.match(migration, /discuss_service_issues/);
  assert.match(migration, /Talk with the bank about the account/);
});

test("org catalog version tables are additive and tenant-scoped", () => {
  assert.match(migration, /create table public\.organization_permission_catalog_versions/i);
  assert.match(migration, /create table public\.organization_permission_items/i);
  assert.match(migration, /organization_permission_catalog_one_published_idx/);
  assert.match(migration, /has_active_membership\(organization_id\)/);
});

test("decision write path freezes accepted permission labels into the receipt", () => {
  assert.match(migration, /accepted_permissions_snapshot/);
  assert.match(migration, /not_included_permissions_snapshot/);
  assert.match(migration, /permission_label_snapshot_items_v1/);
  assert.match(migration, /Frozen permission labels/);
});

test("HOSTED_ACTIONS fallback remains for unpinned catalog_version_id", () => {
  assert.match(migration, /Null = legacy HOSTED_ACTIONS fixture path/i);
  assert.match(migration, /legacy_provenance/);
});

test("UI-facing copy bar never uses the word catalog in comments for buyer claims", () => {
  assert.match(migration, /What people may ask for/);
  assert.doesNotMatch(migration, /buyer.*full institution catalog publish/i);
});
