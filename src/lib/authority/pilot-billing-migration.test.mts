import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(
  new URL("../../../supabase/migrations/20260905033528_founding_pilot_billing_v1.sql", import.meta.url),
  "utf8",
);
const foundation = readFileSync(new URL("../../../supabase/migrations/20260904003037_commercial_v2_foundation.sql", import.meta.url), "utf8");

test("pilot billing records intent before Stripe and exposes only scoped commands", () => {
  assert.match(sql, /insert into authority_private\.commercial_orders[\s\S]+insert into authority_private\.integration_outbox/i);
  assert.match(sql, /has_active_membership\(p_organization_id, array\['owner','admin'\]\)/i);
  assert.match(sql, /revoke execute on function public\.ingest_and_apply_stripe_event_v2[\s\S]+grant execute on function public\.ingest_and_apply_stripe_event_v2[\s\S]+to service_role/i);
});

test("paid events are idempotent and grant exactly one allowance lot", () => {
  assert.match(foundation, /unique \(source_order_id\)/i);
  assert.match(sql, /on conflict \(source_order_id\) do nothing/i);
  assert.match(sql, /where id = v_order\.id and status in \('pending','invoiced','failed'\)/i);
  assert.match(sql, /'stripe-invoice-paid:' \|\| v_invoice_id/i);
});

test("provider payloads stay private and live Stripe events fail closed", () => {
  assert.match(sql, /coalesce\(\(p_payload->>'livemode'\)::boolean, false\)/i);
  assert.doesNotMatch(sql, /grant select on authority_private\./i);
  assert.match(sql, /provider_event_inbox/i);
});
