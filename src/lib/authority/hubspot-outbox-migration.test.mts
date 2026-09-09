import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../../supabase/migrations/20260904041944_hubspot_outbox_delivery.sql", import.meta.url), "utf8");
const retryMigration = await readFile(new URL("../../../supabase/migrations/20260908231500_auditable_integration_outbox_retry.sql", import.meta.url), "utf8");
const reconciliationScopeMigration = await readFile(new URL("../../../supabase/migrations/20260908235000_reconciliation_scope_note_accuracy.sql", import.meta.url), "utf8");
const reconciliationScopeRepairMigration = await readFile(new URL("../../../supabase/migrations/20260908235500_reconciliation_scope_note_accuracy_repair.sql", import.meta.url), "utf8");
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

test("contact projection resolves identity by email before updating Passage fields", () => {
  assert.match(worker, /async function upsertContactByEmail/);
  assert.match(worker, /findByUniqueProperty\(token, "contacts", "email", email\)/);
  assert.match(worker, /upsertContactByEmail\(token, payload\.email/);
  assert.doesNotMatch(worker, /upsert\(token, "contacts", "pa_prospect_key"/);
});

test("failed provider jobs can only be retried through a service-only audited command", () => {
  assert.match(retryMigration, /v_job\.status <> 'failed'/i);
  assert.match(retryMigration, /commercial\.integration_outbox_retried/i);
  assert.match(retryMigration, /prior_error_code/i);
  assert.match(retryMigration, /from public, anon, authenticated/i);
  assert.match(retryMigration, /to service_role/i);
});

test("reconciliation describes its evidence boundary without guessing credential state", () => {
  assert.match(reconciliationScopeMigration, /does not call live Stripe or HubSpot APIs/i);
  assert.match(reconciliationScopeMigration, /Credential configuration and live provider comparison are separate V2-6 evidence/i);
  assert.doesNotMatch(reconciliationScopeMigration, /credentials[^.]+remain unconfigured/i);

  assert.match(reconciliationScopeRepairMigration, /does not call live Stripe or HubSpot APIs/i);
  assert.match(reconciliationScopeRepairMigration, /status'\) = 'refunded'[\s\S]+activation_audits'\)::int > 1/i);
  assert.match(reconciliationScopeRepairMigration, /status'\) not in \('paid', 'refunded'\)[\s\S]+activation_audits'\)::int > 0/i);
});
