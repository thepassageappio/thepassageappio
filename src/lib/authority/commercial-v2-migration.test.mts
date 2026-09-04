import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260904003037_commercial_v2_foundation.sql", import.meta.url),
  "utf8",
);

test("commercial provider data is server-only and explicitly revoked from browser roles", () => {
  assert.match(migration, /create table authority_private\.commercial_accounts/i);
  assert.match(migration, /create table authority_private\.provider_event_inbox/i);
  assert.match(migration, /revoke all on all tables in schema authority_private from public, anon, authenticated/i);
});

test("commercial events and financial adjustments are append-only", () => {
  assert.match(migration, /commercial_event_ledger_append_only/i);
  assert.match(migration, /commercial_adjustments_append_only/i);
  assert.match(migration, /commercial_history_is_append_only/i);
});

test("Stripe delivery is permanently deduplicated before processing", () => {
  assert.match(migration, /unique \(provider, provider_event_id\)/i);
  assert.match(migration, /on conflict \(provider, provider_event_id\) do nothing/i);
  assert.match(migration, /'replayed', true/i);
});

test("one active commercial subscription may own a workspace", () => {
  assert.match(migration, /commercial_subscriptions_one_active_per_workspace/i);
  assert.match(migration, /where status in \('pending', 'active', 'grace', 'past_due'\)/i);
});
