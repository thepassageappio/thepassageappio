function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isDemoEmailRecipientAllowed(
  email: string,
  environment = process.env.PASSAGE_ENVIRONMENT,
  allowlist = process.env.PASSAGE_EMAIL_RECIPIENT_ALLOWLIST,
) {
  if (environment?.trim().toLowerCase() !== "demo") return true;

  const recipient = normalizeEmail(email);
  if (!recipient) return false;

  const allowedRecipients = new Set(
    (allowlist ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean),
  );

  return allowedRecipients.has(recipient);
}
