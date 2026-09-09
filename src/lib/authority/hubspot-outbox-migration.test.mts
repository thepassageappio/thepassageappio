import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../../supabase/migrations/20260904041944_hubspot_outbox_delivery.sql", import.meta.url), "utf8");
const retryMigration = await readFile(new URL("../../../supabase/migrations/20260908231500_auditable_integration_outbox_retry.sql", import.meta.url), "utf8");
const worker = await readFile(new URL("../commercial/hubspot-inquiry.ts", import.meta.url), "utf8");

test("HubSpot jobs use a leased service-only claim and bounded retry", () => {
  assert.match(migration, /for update skip locked/i);
  assert.match(migration, /updated_at < now\(\) - interval '15 minutes'/i);
  assert.match(migration, /v_job\.attempts < 8/i);
  assert.match(migration, /from public, anon, authenticated/i);
  assert.match(migration, /to service_role/i);
});

test("HubSpot completion records provider IDs and one immutable event", () => {
  assert.match(migration, /provider_result = p_provider_result/i);
  assert.match(migration, /commercial\.hubspot_projection_applied/i);
  assert.match(migration, /on conflict \(idempotency_key\) do nothing/i);
});

test("CRM projection excludes free text and scans prohibited payload keys", () => {
  assert.match(worker, /forbiddenPayloadKeys/);
  assert.doesNotMatch(worker, /description:\s*payload\.message/);
  assert.doesNotMatch(worker, /content:\s*payload\.message/);
  assert.match(worker, /pa_prospect_key/);
  assert.match(worker, /hasUniqueValue:\s*true/);
});

test("failed provider jobs can only be retried through a service-only audited command", () => {
  assert.match(retryMigration, /v_job\.status <> 'failed'/i);
  assert.match(retryMigration, /commercial\.integration_outbox_retried/i);
  assert.match(retryMigration, /prior_error_code/i);
  assert.match(retryMigration, /from public, anon, authenticated/i);
  assert.match(retryMigration, /to service_role/i);
});
