import assert from "node:assert/strict";
import test from "node:test";
import { evaluateFreeActivation } from "./hosted-entitlements.ts";

test("first activation starts the ten-day clock and consumes one request", () => {
  const result = evaluateFreeActivation({
    status: "not_started",
    activatedCount: 0,
    transactionLimit: 5,
    trialStartedAt: null,
    trialEndsAt: null,
  }, new Date("2026-08-28T12:00:00.000Z"));
  assert.deepEqual(result, {
    activatedCount: 1,
    transactionLimit: 5,
    trialStartedAt: "2026-08-28T12:00:00.000Z",
    trialEndsAt: "2026-09-07T12:00:00.000Z",
  });
});

test("fifth activation keeps the original evaluation window", () => {
  const result = evaluateFreeActivation({
    status: "active",
    activatedCount: 4,
    transactionLimit: 5,
    trialStartedAt: "2026-08-25T12:00:00.000Z",
    trialEndsAt: "2026-09-04T12:00:00.000Z",
  }, new Date("2026-08-28T12:00:00.000Z"));
  assert.equal(result.activatedCount, 5);
  assert.equal(result.trialStartedAt, "2026-08-25T12:00:00.000Z");
  assert.equal(result.trialEndsAt, "2026-09-04T12:00:00.000Z");
});

test("sixth activation is blocked", () => {
  assert.throws(() => evaluateFreeActivation({
    status: "active",
    activatedCount: 5,
    transactionLimit: 5,
    trialStartedAt: "2026-08-25T12:00:00.000Z",
    trialEndsAt: "2026-09-04T12:00:00.000Z",
  }, new Date("2026-08-28T12:00:00.000Z")), /five activated requests/);
});

test("an elapsed evaluation is blocked even when transactions remain", () => {
  assert.throws(() => evaluateFreeActivation({
    status: "active",
    activatedCount: 2,
    transactionLimit: 5,
    trialStartedAt: "2026-08-01T12:00:00.000Z",
    trialEndsAt: "2026-08-11T12:00:00.000Z",
  }, new Date("2026-08-28T12:00:00.000Z")), /evaluation has ended/);
});
