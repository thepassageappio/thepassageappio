import type { OrganizationRole } from "./access.ts";

// Owner and admin are the highest-privilege organization roles (confirmed by
// the 2026-09-06/07 persona audit): they can manage members, billing, and
// every request decision. They are the roles required to carry a second
// factor before P2 production hardening allows real customer data or real
// selling. Other roles (staff, reviewer, developer, auditor) are not gated
// here -- see docs/V2-DELIVERY-ROADMAP.md for the documented remaining scope
// if the business decides to widen this later.
export const MFA_REQUIRED_ROLES: readonly OrganizationRole[] = ["owner", "admin"];

export function roleRequiresMfa(role: OrganizationRole | null | undefined): boolean {
  return role != null && MFA_REQUIRED_ROLES.includes(role);
}

export type AuthenticatorAssuranceLevel = "aal1" | "aal2";

export type MfaFactorSummary = {
  /** True when the account has at least one verified TOTP factor enrolled. */
  hasVerifiedTotp: boolean;
  /** The assurance level the current session has actually completed. */
  currentLevel: AuthenticatorAssuranceLevel;
  /** The highest assurance level available to the account (aal2 once a factor is verified). */
  nextLevel: AuthenticatorAssuranceLevel;
};

export type MfaGate = "allow" | "require_enrollment" | "require_challenge";

/**
 * Decide whether a request for this role, given the account's current MFA
 * state, may proceed.
 *
 * - Roles outside MFA_REQUIRED_ROLES are always "allow": we are not requiring
 *   a second factor for them yet.
 * - A required role with no verified TOTP factor must enroll one before
 *   continuing ("require_enrollment").
 * - A required role with a verified factor, but whose *current* session has
 *   not completed the second-factor challenge (currentLevel !== nextLevel,
 *   i.e. still aal1 with aal2 available), must re-verify this session
 *   ("require_challenge"). This is what stops a stolen session cookie alone
 *   from being enough for an owner/admin action once MFA is enrolled.
 * - Otherwise "allow".
 */
export function mfaGateDecision(role: OrganizationRole | null | undefined, mfa: MfaFactorSummary): MfaGate {
  if (!roleRequiresMfa(role)) return "allow";
  if (!mfa.hasVerifiedTotp) return "require_enrollment";
  if (mfa.currentLevel !== "aal2") return "require_challenge";
  return "allow";
}
