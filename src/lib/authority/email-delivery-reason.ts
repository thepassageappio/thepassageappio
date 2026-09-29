/**
 * Plain reasons for an email that was not sent or not delivered.
 * Staff only ever see these categories, never raw provider text or codes.
 */
export const DEMO_EMAIL_NOT_APPROVED = "Not sent. This address isn't approved for Demo email.";

export type EmailSkipReason = "recipient_not_allowed" | "configuration_missing" | "provider_rejected";

export function isDemoRecipientBlockedCode(code: string | null | undefined) {
  return (code ?? "").trim() === "recipient_not_allowed";
}

/** Short reason for a failed or skipped send. Unknown codes get a generic line. */
export function emailNotSentReason(code: string | null | undefined): string {
  const value = (code ?? "").trim().toLowerCase();
  if (value === "recipient_not_allowed") return DEMO_EMAIL_NOT_APPROVED;
  if (value === "configuration_missing") return "Not sent. Email is not set up here.";
  if (value === "provider_rejected") return "Not sent. The email service turned it down.";
  if (value.startsWith("bounce") || value === "email.bounced") return "Not delivered. The address did not take the email.";
  if (value === "email.complained" || value.includes("complain") || value.includes("suppress")) {
    return "Not delivered. This address has blocked email from us.";
  }
  return "Not delivered. The email did not go through.";
}
