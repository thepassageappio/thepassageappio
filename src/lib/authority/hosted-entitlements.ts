import { AuthorityError } from "./errors.ts";

export type EvaluationEntitlement = {
  status: "not_started" | "active" | "expired";
  activatedCount: number;
  transactionLimit: number;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
};

export type ActivationDecision = {
  activatedCount: number;
  transactionLimit: number;
  trialStartedAt: string;
  trialEndsAt: string;
};

export function evaluateFreeActivation(
  entitlement: EvaluationEntitlement,
  now = new Date(),
): ActivationDecision {
  if (!Number.isInteger(entitlement.activatedCount) || entitlement.activatedCount < 0) {
    throw new AuthorityError("Evaluation usage is unavailable.", "INVALID_COMMAND", 409);
  }
  if (!Number.isInteger(entitlement.transactionLimit) || entitlement.transactionLimit < 1) {
    throw new AuthorityError("Evaluation usage is unavailable.", "INVALID_COMMAND", 409);
  }
  if (entitlement.status === "expired") {
    throw new AuthorityError("The free evaluation has ended.", "INVALID_COMMAND", 409);
  }
  if (entitlement.status === "active" && entitlement.trialEndsAt && new Date(entitlement.trialEndsAt) <= now) {
    throw new AuthorityError("The free evaluation has ended.", "INVALID_COMMAND", 409);
  }
  if (entitlement.activatedCount >= entitlement.transactionLimit) {
    throw new AuthorityError("The free evaluation includes five activated requests.", "INVALID_COMMAND", 409);
  }

  const trialStartedAt = entitlement.trialStartedAt ?? now.toISOString();
  const trialEndsAt = entitlement.trialEndsAt ?? new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
  return {
    activatedCount: entitlement.activatedCount + 1,
    transactionLimit: entitlement.transactionLimit,
    trialStartedAt,
    trialEndsAt,
  };
}
