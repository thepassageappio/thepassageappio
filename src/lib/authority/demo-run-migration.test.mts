import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260903120000_authority_demo_runs.sql", import.meta.url),
  "utf8",
);

test("Demo provisioning is service-only and revalidates owner or administrator membership", () => {
  assert.match(migration, /v_actor_role not in \('owner', 'admin'\)/);
  assert.match(migration, /revoke execute on function public\.provision_demo_run_v1[\s\S]+from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.provision_demo_run_v1[\s\S]+to service_role/);
});

test("Demo provisioning has version and idempotent replay guards", () => {
  assert.match(migration, /v_entitlement\.version <> p_expected_entitlement_version/);
  assert.match(migration, /command_name = 'provision_demo_run'/);
  assert.match(migration, /idempotency_payload_mismatch/);
  assert.match(migration, /return v_existing\.result \|\| jsonb_build_object\('replayed', true\)/);
});

test("Demo runs are organization-namespaced, append-only, and non-destructive", () => {
  assert.match(migration, /organization_id uuid not null references public\.organizations/);
  assert.match(migration, /demo_run_id uuid references public\.demo_runs/);
  assert.match(migration, /demo_run_events_append_only/);
  assert.doesNotMatch(migration, /delete from public\.(organizations|authority_records|authority_events|demo_runs)/i);
  assert.doesNotMatch(migration, /update public\.organization_entitlements/i);
});
