import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../../../supabase/migrations/20260908220002_sample_access_lead_gate.sql", import.meta.url),
  "utf8",
);

test("sample access consent is private, append-only, and service-only", () => {
  assert.match(migration, /create table authority_private\.sample_access_leads/i);
  assert.match(migration, /unique \(actor_user_id\)/i);
  assert.match(migration, /sample_access_leads_append_only/i);
  assert.match(migration, /revoke all on authority_private\.sample_access_leads from public, anon, authenticated/i);
  assert.match(migration, /revoke execute on function public\.create_sample_access_lead_v1[\s\S]+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.create_sample_access_lead_v1[\s\S]+to service_role/i);
});

const revisionMigration = await readFile(
  new URL("../../../supabase/migrations/20260908233000_sample_access_consent_revisions.sql", import.meta.url),
  "utf8",
);

test("new consent versions append a revision and gate access on the current version", () => {
  assert.match(revisionMigration, /drop constraint sample_access_leads_actor_user_id_key/i);
  assert.match(revisionMigration, /unique \(actor_user_id, consent_version\)/i);
  assert.match(revisionMigration, /where actor_user_id = p_actor_user_id\s+and consent_version = p_consent_version/i);
  assert.match(revisionMigration, /has_sample_access_lead_v2\(\s*p_actor_user_id uuid,\s*p_consent_version text\s*\)/i);
  assert.match(revisionMigration, /grant execute on function public\.has_sample_access_lead_v2[\s\S]+to service_role/i);
});

test("one verified consent command records history and queues the HubSpot Contact", () => {
  const body = migration.match(/create or replace function authority_private\.create_sample_access_lead_v1[\s\S]+?\$\$;/i)?.[0] ?? "";
  assert.match(body, /from auth\.users where id = p_actor_user_id/i);
  assert.match(body, /email_confirmed_at is null/i);
  assert.match(body, /commercial\.sample_access_opted_in/i);
  assert.match(body, /upsert_sample_access_lead/i);
  assert.match(body, /'full_name'[\s\S]+'email'[\s\S]+'consent_version'[\s\S]+'source_path'/i);
  assert.doesNotMatch(body, /organization_name|participant|authority_record/i);
});

test("the HubSpot claim includes sample leads without fabricating a company key", () => {
  assert.match(migration, /operation in \('upsert_commercial_inquiry', 'upsert_sample_access_lead'\)/i);
  assert.match(migration, /'operation', v_job\.operation/i);
  assert.match(migration, /if v_job\.operation = 'upsert_commercial_inquiry' then[\s\S]+company_key/i);
});

const nurtureMigration = await readFile(
  new URL("../../../supabase/migrations/20260909051650_sample_attribution_nurture_enrollment.sql", import.meta.url),
  "utf8",
);

test("the current sample consent atomically records attribution and held nurture enrollment", () => {
  const body = nurtureMigration.match(/create or replace function authority_private\.create_sample_access_lead_v2[\s\S]+?\$\$;/i)?.[0] ?? "";
  assert.match(body, /sample-access-contact-2026\.2/i);
  assert.match(body, /evaluation-2026\.2/i);
  assert.match(body, /commercial\.sample_access_opted_in/i);
  assert.match(body, /commercial\.nurture_enrolled/i);
  assert.match(body, /website_sample_gated/i);
  assert.match(body, /sample_evaluator/i);
  assert.match(body, /held_until_p1_p2/i);
  assert.match(body, /upsert_sample_access_lead/i);
  assert.match(nurtureMigration, /grant execute on function public\.create_sample_access_lead_v2[\s\S]+to service_role/i);
});
