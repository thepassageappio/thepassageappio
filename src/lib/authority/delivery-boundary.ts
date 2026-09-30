function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

// Owner-controlled Demo recipients that are always allowed on Demo delivery, in
// addition to PASSAGE_EMAIL_RECIPIENT_ALLOWLIST. Exact addresses only: no domains
// or wildcards. This list only widens the Demo guard; other environments never
// consult it. Prepare-a-fresh-demo may also use these when the env allowlist does
// not supply a usable pair (see demo-boundary.ts).
export const DEMO_DEFAULT_EMAIL_RECIPIENTS = [
  "thepassageappio+pilot-admin@gmail.com",
  "thepassageappio+pilot-reviewer@gmail.com",
  "thepassageappio@gmail.com",
  "thepassageappio+parker@gmail.com",
  "thepassageappio+casey@gmail.com",
] as const;

export function demoAllowedRecipients(allowlist = process.env.PASSAGE_EMAIL_RECIPIENT_ALLOWLIST) {
  return new Set(
    [...DEMO_DEFAULT_EMAIL_RECIPIENTS, ...(allowlist ?? "").split(",")]
      .map(normalizeEmail)
      .filter((email) => email.includes("@") && !email.includes("*")),
  );
}

export function isDemoEmailRecipientAllowed(
  email: string,
  environment = process.env.PASSAGE_ENVIRONMENT,
  allowlist = process.env.PASSAGE_EMAIL_RECIPIENT_ALLOWLIST,
) {
  if (environment?.trim().toLowerCase() !== "demo") return true;

  const recipient = normalizeEmail(email);
  if (!recipient) return false;

  return demoAllowedRecipients(allowlist).has(recipient);
}

/**
 * Demo evaluation slot rule (#170):
 * - A Demo / free_evaluation slot is consumed only when activate_authority_request_v1
 *   runs after the pre-send allowlist gate passes for both participant emails.
 * - Doomed Demo emails must fail before activate (assertDemoParticipantEmailsAllowed),
 *   so recipient_not_allowed never burns activated_count.
 * - Prepare-a-fresh-demo (provision_demo_run_v1) never increments activated_count.
 * - Production / pilot metering is unchanged: this gate is Demo-only.
 */
export const DEMO_EVALUATION_SLOT_RULE =
  "Demo slots count only after allowlisted activate; Prepare never counts; production metering unchanged.";

/** Thrown message / RPC-style code when Demo draft/send emails are not allowlisted. */
export const DEMO_EMAIL_RECIPIENT_NOT_ALLOWED = "demo_email_recipient_not_allowed";

/**
 * Server-side pre-send gate for Demo Path B (#168 / #170).
 * No-op outside Demo. Throws DEMO_EMAIL_RECIPIENT_NOT_ALLOWED when either email
 * fails isDemoEmailRecipientAllowed. Never returns the allowlist contents.
 */
export function assertDemoParticipantEmailsAllowed(
  principalEmail: string,
  representativeEmail: string,
  environment = process.env.PASSAGE_ENVIRONMENT,
  allowlist = process.env.PASSAGE_EMAIL_RECIPIENT_ALLOWLIST,
) {
  if (environment?.trim().toLowerCase() !== "demo") return;
  if (
    !isDemoEmailRecipientAllowed(principalEmail, environment, allowlist)
    || !isDemoEmailRecipientAllowed(representativeEmail, environment, allowlist)
  ) {
    throw new Error(DEMO_EMAIL_RECIPIENT_NOT_ALLOWED);
  }
}
