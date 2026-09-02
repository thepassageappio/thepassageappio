import { AuthorityError } from "./errors.ts";

function invalid(message: string): never {
  throw new AuthorityError(message, "INVALID_COMMAND", 400);
}
export function prepareHostedInformationRequest(input: { requirementKey: string; message: string }) {
  const requirementKey = input.requirementKey.trim();
  const message = input.message.trim();
  if (!requirementKey) invalid("Choose the requirement that needs more information.");
  if (message.length < 3 || message.length > 500) invalid("Explain what information is still needed.");
  return { requirementKey, message };
}

export function prepareHostedInformationResponse(input: { response: string }) {
  const response = input.response.trim();
  if (response.length < 3 || response.length > 1000) invalid("Explain what you confirmed or added.");
  return { response };
}

export function prepareHostedWithdrawal(input: { reason: string; acknowledged: boolean }) {
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500) invalid("Explain why you can no longer serve.");
  if (!input.acknowledged) invalid("Confirm that you intend to withdraw from this responsibility.");
  return { reason, acknowledged: true as const };
}
