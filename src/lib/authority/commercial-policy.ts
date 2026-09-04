import { AuthorityError } from "./errors.ts";

export type RenewalClassification = "expansion" | "flat" | "downgrade" | "churn";

export type RenewalResult = {
  classification: RenewalClassification;
  priorArrMinor: number;
  renewedArrMinor: number;
  netArrImpactMinor: number;
  priorMrrMinor: number;
  renewedMrrMinor: number;
  netMrrImpactMinor: number;
};

export type ContractTermSpend = {
  baseRecurringMinor: number;
  paidTopUpsMinor: number;
  otherExpansionMinor: number;
  refundsAndCreditsMinor: number;
  totalMinor: number;
};

function assertMoney(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new AuthorityError(`${field} is unavailable.`, "INVALID_COMMAND", 409);
  }
}

export function calculateContractTermSpend(input: Omit<ContractTermSpend, "totalMinor">): ContractTermSpend {
  assertMoney(input.baseRecurringMinor, "Base contract value");
  assertMoney(input.paidTopUpsMinor, "Top-up revenue");
  assertMoney(input.otherExpansionMinor, "Expansion revenue");
  assertMoney(input.refundsAndCreditsMinor, "Refunds and credits");
  const gross = input.baseRecurringMinor + input.paidTopUpsMinor + input.otherExpansionMinor;
  if (input.refundsAndCreditsMinor > gross) {
    throw new AuthorityError("Refunds and credits exceed recorded contract spend.", "INVALID_COMMAND", 409);
  }
  return { ...input, totalMinor: gross - input.refundsAndCreditsMinor };
}

export function calculateRenewal(priorArrMinor: number, renewedArrMinor: number): RenewalResult {
  assertMoney(priorArrMinor, "Prior subscription value");
  assertMoney(renewedArrMinor, "Renewed subscription value");
  const netArrImpactMinor = renewedArrMinor - priorArrMinor;
  const classification: RenewalClassification = renewedArrMinor === 0
    ? "churn"
    : netArrImpactMinor > 0
      ? "expansion"
      : netArrImpactMinor < 0
        ? "downgrade"
        : "flat";
  const priorMrrMinor = Math.round(priorArrMinor / 12);
  const renewedMrrMinor = Math.round(renewedArrMinor / 12);
  return {
    classification,
    priorArrMinor,
    renewedArrMinor,
    netArrImpactMinor,
    priorMrrMinor,
    renewedMrrMinor,
    netMrrImpactMinor: renewedMrrMinor - priorMrrMinor,
  };
}

export function topUpRevenueClassification(amountMinor: number) {
  assertMoney(amountMinor, "Top-up amount");
  if (amountMinor === 0) {
    throw new AuthorityError("Top-up amount must be greater than zero.", "INVALID_COMMAND", 409);
  }
  return {
    revenueMotion: "expansion" as const,
    revenueType: "non_recurring_top_up" as const,
    bookedAmountMinor: amountMinor,
    nonRecurringRevenueMinor: amountMinor,
    arrImpactMinor: 0,
  };
}
