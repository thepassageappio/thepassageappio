export const HOSTED_DISCLOSURE_VERSION = "minimum-necessary-disclosure-2026.1";

export function prepareHostedSubmission(input: { acknowledged: boolean }) {
  if (!input.acknowledged) throw new Error("Confirm the information sharing before sending the request.");
  return { acknowledged: true as const, textVersion: HOSTED_DISCLOSURE_VERSION };
}
