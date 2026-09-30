const LEGACY_FINANCIAL_POA_PURPOSE = "request recognition of limited financial power of attorney authority";

export function authorityPurposeLabel(purpose: string) {
  const value = purpose.trim();
  return value.toLowerCase().replaceAll(/\s+/g, " ") === LEGACY_FINANCIAL_POA_PURPOSE
    ? "Financial power of attorney request"
    : value;
}

/** Path B participant / staff roles as shown on the face. Never rename DB/API enums. */
export type FaceRole = "principal" | "representative" | "staff";

/**
 * Steve-locked Path B face labels (2026-09-29).
 * principal → account holder; representative → person acting for them; staff → staff.
 */
export function roleFaceLabel(role: FaceRole, opts?: { capitalize?: boolean }): string {
  const capitalize = opts?.capitalize === true;
  if (role === "principal") return capitalize ? "Account holder" : "account holder";
  if (role === "representative") return capitalize ? "Person acting for them" : "person acting for them";
  return capitalize ? "Staff" : "staff";
}

/** Quiet first-use gloss for the person-acting role (optional beside a label). */
export const PERSON_ACTING_GLOSS = "the person helping with the account";

/** Quiet first-use gloss for the account holder (already used on staff contact). */
export const ACCOUNT_HOLDER_GLOSS = "the person who owns the account";

/**
 * Face title for a requirement row. Remaps known catalog titles that still store
 * legacy jargon in DB (requirement_key unchanged; no migration).
 */
export function requirementFaceTitle(requirementKey: string, storedTitle?: string | null): string {
  if (requirementKey === "representative_certification") {
    return "Certification from the person acting for them";
  }
  const trimmed = storedTitle?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : requirementKey.replaceAll("_", " ");
}
