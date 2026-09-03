import type { OrganizationRole } from "./access.ts";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function exactEmailSet(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter((email) => email.includes("@") && !email.includes("*")),
  );
}

export function isDemoEnvironment(environment = process.env.PASSAGE_ENVIRONMENT) {
  return environment?.trim().toLowerCase() === "demo";
}

export function mayProvisionDemoRun(
  email: string,
  role: OrganizationRole,
  environment = process.env.PASSAGE_ENVIRONMENT,
  presenterAllowlist = process.env.PASSAGE_DEMO_PRESENTER_ALLOWLIST,
) {
  if (!isDemoEnvironment(environment) || !["owner", "admin"].includes(role)) return false;
  return exactEmailSet(presenterAllowlist).has(normalizeEmail(email));
}

export function demoParticipantRecipientPair(
  recipientAllowlist = process.env.PASSAGE_EMAIL_RECIPIENT_ALLOWLIST,
): readonly [string, string] | null {
  const recipients = [...exactEmailSet(recipientAllowlist)];
  return recipients.length >= 2 ? [recipients[0], recipients[1]] : null;
}
