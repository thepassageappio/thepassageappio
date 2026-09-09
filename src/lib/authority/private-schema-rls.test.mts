import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../../supabase/migrations/20260909222836_authority_private_rls_defense_in_depth.sql", import.meta.url),
  "utf8",
);

const privateTables = [
  "command_receipts",
  "commercial_account_workspaces",
  "commercial_accounts",
  "commercial_adjustments",
  "commercial_allowance_lots",
  "commercial_contracts",
  "commercial_event_ledger",
  "commercial_inquiries",
  "commercial_orders",
  "commercial_subscriptions",
  "commercial_usage_allocations",
  "integration_outbox",
  "notification_outbox",
  "organization_invitation_secrets",
  "participant_command_receipts",
  "participant_invitation_secrets",
  "participant_sessions",
  "provider_event_inbox",
  "provider_webhook_events",
  "sample_access_leads",
];

test("all service-only authority_private tables receive default-deny RLS", () => {
  for (const table of privateTables) {
    assert.match(
      migration,
      new RegExp(`alter table authority_private\\.${table} enable row level security;`),
      `${table} must enable RLS`,
    );
  }
  assert.match(migration, /revoke all on all tables in schema authority_private from public, anon, authenticated;/);
  assert.match(migration, /alter default privileges in schema authority_private/);
});
