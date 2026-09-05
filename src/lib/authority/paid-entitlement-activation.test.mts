import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../../../supabase/migrations/20260905132117_enable_pilot_authority_activation.sql", import.meta.url),
  "utf8",
);

test("paid authority entitlements use the bounded activation transaction", () => {
  assert.match(
    migration,
    /v_entitlement\.offer not in \('free_evaluation', 'pilot', 'enterprise'\)/,
  );
  assert.match(migration, /v_entitlement\.status not in \('not_started', 'active'\)/);
  assert.match(migration, /v_entitlement\.period_ends_at <= now\(\)/);
  assert.match(migration, /v_entitlement\.activated_count >= v_entitlement\.transaction_limit/);
  assert.match(migration, /insert into public\.authority_usage_events/);
  assert.match(migration, /insert into public\.authority_events/);
  assert.match(migration, /insert into public\.organization_audit_events/);
});
