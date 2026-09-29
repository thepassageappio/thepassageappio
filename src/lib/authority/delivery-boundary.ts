function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

// Owner-controlled Demo recipients that are always allowed on Demo, in addition to
// PASSAGE_EMAIL_RECIPIENT_ALLOWLIST. Exact addresses only: no domains or wildcards.
// This list only widens the Demo guard; other environments never consult it.
// It is not used to pick the Demo participant pair (see demo-boundary.ts), which
// still comes from the env value alone.
export const DEMO_DEFAULT_EMAIL_RECIPIENTS = [
  "thepassageappio+pilot-admin@gmail.com",
  "thepassageappio+pilot-reviewer@gmail.com",
  "thepassageappio@gmail.com",
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
