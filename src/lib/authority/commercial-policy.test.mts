import assert from "node:assert/strict";
import test from "node:test";
import { calculateContractTermSpend, calculateRenewal, topUpRevenueClassification } from "./commercial-policy.ts";

test("contract spend separates recurring base from non-recurring expansion", () => {
  assert.deepEqual(calculateContractTermSpend({
    baseRecurringMinor: 5_000_00,
    paidTopUpsMinor: 1_500_00,
    otherExpansionMinor: 250_00,
    refundsAndCreditsMinor: 100_00,
  }), {
    baseRecurringMinor: 5_000_00,
    paidTopUpsMinor: 1_500_00,
    otherExpansionMinor: 250_00,
    refundsAndCreditsMinor: 100_00,
    totalMinor: 6_650_00,
  });
});

test("top-ups are expansion bookings with zero ARR impact", () => {
  assert.deepEqual(topUpRevenueClassification(1_000_00), {
    revenueMotion: "expansion",
    revenueType: "non_recurring_top_up",
    bookedAmountMinor: 1_000_00,
    nonRecurringRevenueMinor: 1_000_00,
    arrImpactMinor: 0,
  });
});

test("renewals classify expansion, flat, downgrade, and churn against prior committed ARR", () => {
  assert.equal(calculateRenewal(12_000_00, 15_000_00).classification, "expansion");
  assert.equal(calculateRenewal(12_000_00, 12_000_00).classification, "flat");
  assert.equal(calculateRenewal(12_000_00, 9_000_00).classification, "downgrade");
  assert.equal(calculateRenewal(12_000_00, 0).classification, "churn");
});

test("one-time top-up spend never inflates renewal ARR baseline", () => {
  const spend = calculateContractTermSpend({
    baseRecurringMinor: 12_000_00,
    paidTopUpsMinor: 4_000_00,
    otherExpansionMinor: 0,
    refundsAndCreditsMinor: 0,
  });
  const renewal = calculateRenewal(12_000_00, 14_000_00);
  assert.equal(spend.totalMinor, 16_000_00);
  assert.equal(renewal.netArrImpactMinor, 2_000_00);
  assert.notEqual(renewal.priorArrMinor, spend.totalMinor);
});

test("invalid negative commercial amounts fail closed", () => {
  assert.throws(() => calculateRenewal(-1, 0), /unavailable/);
  assert.throws(() => calculateContractTermSpend({
    baseRecurringMinor: 100,
    paidTopUpsMinor: 0,
    otherExpansionMinor: 0,
    refundsAndCreditsMinor: 101,
  }), /exceed recorded contract spend/);
});
