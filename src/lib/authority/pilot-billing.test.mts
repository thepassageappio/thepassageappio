import assert from "node:assert/strict";
import test from "node:test";
import { defaultPilotPeriod, preparePilotInvoice } from "./pilot-billing.ts";

test("prepares a 90-day pilot invoice period and allowance", () => {
  const result = preparePilotInvoice({
    servicePeriodStart: "2026-09-05",
    servicePeriodEnd: "2026-12-04",
    requestAllowance: 25,
  }, new Date("2026-09-05T12:00:00.000Z"));
  assert.equal(result.requestAllowance, 25);
  assert.equal(result.periodEndUnix - result.periodStartUnix, 90 * 86_400);
});

test("rejects past starts, invalid lengths, and unsafe allowance values", () => {
  assert.throws(() => preparePilotInvoice({
    servicePeriodStart: "2026-09-04",
    servicePeriodEnd: "2026-12-03",
    requestAllowance: 25,
  }, new Date("2026-09-05T00:00:00.000Z")), /Pilot start cannot be in the past/);
  assert.throws(() => preparePilotInvoice({
    servicePeriodStart: "2026-09-05",
    servicePeriodEnd: "2026-10-04",
    requestAllowance: 25,
  }, new Date("2026-09-05T00:00:00.000Z")), /60 to 90 days/);
  assert.throws(() => preparePilotInvoice({
    servicePeriodStart: "2026-09-05",
    servicePeriodEnd: "2026-12-04",
    requestAllowance: 0,
  }, new Date("2026-09-05T00:00:00.000Z")), /between 1 and 500/);
});

test("defaults to a 90-day UTC calendar period", () => {
  assert.deepEqual(defaultPilotPeriod(new Date("2026-09-05T23:59:00.000Z")), {
    servicePeriodStart: "2026-09-05",
    servicePeriodEnd: "2026-12-04",
  });
});
