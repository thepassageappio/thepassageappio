import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260915040000_authority_ny_jurisdiction_pack_phase0.sql", import.meta.url),
  "utf8",
);
const rls = readFileSync(
  new URL("../../../supabase/migrations/20260915040100_authority_ny_jurisdiction_pack_phase0_rls.sql", import.meta.url),
  "utf8",
);
const rpcs = readFileSync(
  new URL("../../../supabase/migrations/20260915040150_authority_ny_jurisdiction_pack_phase0_rpcs.sql", import.meta.url),
  "utf8",
);

test("Phase 0 seeds versioned US-NY pack with 10/7 timer defaults", () => {
  assert.match(migration, /create table public\.jurisdiction_packs/);
  assert.match(migration, /'us_ny_financial_poa'/);
  assert.match(migration, /'US-NY'/);
  assert.match(migration, /default_timer_initial_business_days[\s\S]*10/);
  assert.match(migration, /default_timer_followup_business_days[\s\S]*7/);
  assert.match(migration, /enabled_for_live_claims boolean not null default false/);
  assert.match(migration, /enabled_for_live_claims, effective_at[\s\S]*true/);
});

test("Phase 0 seeds NY reason-code catalog including sole-refusal warnings", () => {
  assert.match(migration, /create table public\.jurisdiction_reason_codes/);
  assert.match(migration, /ny\.warn\.not_our_form_alone/);
  assert.match(migration, /ny\.warn\.age_alone/);
  assert.match(migration, /warn_if_sole_refusal boolean not null default false/);
  assert.match(migration, /is_fi_overlay boolean not null default false/);
});

test("Phase 0 adds form_class, timer pins, certified-copy flag, and affidavit scaffolding", () => {
  assert.match(migration, /form_class text/);
  assert.match(migration, /statutory_short', 'non_statutory', 'unknown'/);
  assert.match(migration, /timer_initial_business_days/);
  assert.match(migration, /timer_followup_business_days/);
  assert.match(migration, /attorney_certified_copy boolean/);
  assert.match(migration, /create table public\.authority_affidavit_exchanges/);
});

test("Phase 0 RPCs stay additive and service-bound the affidavit stub", () => {
  assert.match(rls, /enable row level security/);
  assert.match(rpcs, /request_affidavit_exchange_service_v1/);
  assert.doesNotMatch(migration, /drop table public\.authority_records/i);
  assert.doesNotMatch(migration, /PA-F39449782D/);
  assert.match(rpcs, /grant execute on function public\.request_affidavit_exchange_service_v1[\s\S]+to service_role/);
  assert.match(rpcs, /revoke execute on function public\.request_affidavit_exchange_service_v1[\s\S]+from public, anon, authenticated/);
});
