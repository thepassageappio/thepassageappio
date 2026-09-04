import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../../supabase/migrations/20260904041944_hubspot_outbox_delivery.sql", import.meta.url), "utf8");
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

test("HubSpot delivery fails closed until the audited schema and routing are configured", () => {
  assert.match(worker, /hubspot_schema_missing_/);
  assert.doesNotMatch(worker, /crm\/v3\/properties\/\$\{definition\.objectType\}`,[\s\S]*method:\s*"POST"/);
  assert.match(worker, /hubspot_\$\{objectType\}_routing_not_configured/);
  assert.match(worker, /stages\.find\(item => item\.id === configuredStage\)/);
  assert.doesNotMatch(worker, /results\.sort\(/);
});
