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

// Controlled Prepare-a-fresh-demo pair when PASSAGE_EMAIL_RECIPIENT_ALLOWLIST does
// not supply at least two exact emails. These addresses are also in
// DEMO_DEFAULT_EMAIL_RECIPIENTS so delivery accepts them without an env bump.
const DEMO_PREPARE_FALLBACK_PAIR = [
  "thepassageappio+parker@gmail.com",
  "thepassageappio+casey@gmail.com",
] as const;

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
): readonly [string, string] {
  const recipients = [...exactEmailSet(recipientAllowlist)];
  if (recipients.length >= 2) return [recipients[0], recipients[1]];
  return DEMO_PREPARE_FALLBACK_PAIR;
}
