import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../../../supabase/migrations/20260904013250_commercial_inquiry_intake.sql", import.meta.url),
  "utf8",
);

test("commercial inquiry intake is private and service-only", () => {
  assert.match(migration, /create table authority_private\.commercial_inquiries/i);
  assert.match(migration, /revoke all on authority_private\.commercial_inquiries from public, anon, authenticated/i);
  assert.match(migration, /revoke execute on function public\.create_commercial_inquiry_v1[\s\S]+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.create_commercial_inquiry_v1[\s\S]+to service_role/i);
});

test("one inquiry command atomically appends an event and queues CRM delivery", () => {
  const functionBody = migration.match(/create or replace function authority_private\.create_commercial_inquiry_v1[\s\S]+?\$\$;/i)?.[0] ?? "";
  assert.match(functionBody, /insert into authority_private\.commercial_inquiries/i);
  assert.match(functionBody, /insert into authority_private\.commercial_event_ledger/i);
  assert.match(functionBody, /insert into authority_private\.integration_outbox/i);
  assert.match(migration, /idempotency_key uuid not null unique/i);
});
