import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// This checks the migration text itself (fast, no database required), the
// same way pilot-billing-migration.test.mts does. It is a shallow sanity
// check, not proof of runtime behavior -- the real behavioral proof is
// supabase/tests/stripe_negative_paths.sql, which seeds a real order and
// fires real event payloads at the real RPC. Both were executed for real
// against a live Supabase branch on 2026-09-07; see
// docs/V2-DELIVERY-ROADMAP.md for the recorded results.
const sql = readFileSync(
  new URL("../../../supabase/migrations/20260907035519_stripe_negative_paths_and_reconciliation.sql", import.meta.url),
  "utf8",
);

test("refund ledger is delta-based against a per-charge running total, not the raw cumulative amount", () => {
  assert.match(sql, /create table authority_private\.stripe_charge_refund_totals/i);
  assert.match(sql, /if v_refund_amount > v_previous_refund then/i);
  assert.match(sql, /v_refund_amount - v_previous_refund/i);
});

test("a full refund can close an order that never reached 'paid' (out-of-order delivery)", () => {
  assert.match(sql, /v_refund_amount >= v_order\.amount_minor and v_order\.status in \('pending','invoiced','failed','paid'\)/i);
});

test("a late invoice.paid cannot reopen an order once it is not pending\\/invoiced\\/failed", () => {
  assert.match(sql, /where id = v_order\.id and status in \('pending','invoiced','failed'\)/i);
});

test("tampered or mismatched provider events are rejected, not silently applied", () => {
  assert.match(sql, /stripe_order_mismatch/i);
  assert.match(sql, /stripe_event_payload_mismatch/i);
});

test("reconciliation snapshot and recording are locked to service_role only", () => {
  assert.match(sql, /revoke all on function public\.get_commercial_reconciliation_snapshot_v1\(\) from public,anon,authenticated/i);
  assert.match(sql, /grant execute on function public\.get_commercial_reconciliation_snapshot_v1\(\) to service_role/i);
  assert.match(sql, /reconciliation_runs_append_only/i);
});
