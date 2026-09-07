import { cache } from "react";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { mfaGateDecision, type MfaFactorSummary, type MfaGate } from "@/lib/authority/mfa-policy";

export type OrganizationRole = "owner" | "admin" | "staff" | "reviewer" | "developer" | "auditor";

export type AuthorityAccessContext = {
  user: { id: string; email: string };
  membership: {
    id: string;
    organizationId: string;
    role: OrganizationRole;
    status: "active" | "revoked";
    version: number;
  } | null;
  organization: {
    id: string;
    displayName: string;
    legalName: string;
    organizationType: string;
    onboardingStatus: "terms_required" | "template_required" | "ready";
    status: "active" | "suspended" | "closed";
  } | null;
  /**
   * Whether this request may proceed given the account's current MFA state.
   * Only "owner" and "admin" are required to satisfy this today (see
   * lib/authority/mfa-policy.ts). Every branch below reports "allow" unless
   * we have an active membership in a ready organization, since that is the
   * earliest point a role-based requirement can even apply.
   */
  mfaGate: MfaGate;
};

async function currentMfaState(supabase: Awaited<ReturnType<typeof createClient>>): Promise<MfaFactorSummary> {
  const [{ data: aal }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  return {
    hasVerifiedTotp: Boolean(factors?.totp?.some((factor) => factor.status === "verified")),
    currentLevel: aal?.currentLevel === "aal2" ? "aal2" : "aal1",
    nextLevel: aal?.nextLevel === "aal2" ? "aal2" : "aal1",
  };
}

export const getAuthorityAccessContext = cache(async (): Promise<AuthorityAccessContext | null> => {
  if (!getSupabasePublicConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data: claimData, error: claimError } = await supabase.auth.getClaims();
  const claims = claimData?.claims;
  if (claimError || !claims?.sub || typeof claims.email !== "string") {
    return null;
  }

  const user = { id: claims.sub, email: claims.email.toLowerCase() };
  const { data: membershipData, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("id, organization_id, role, status, version, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membershipData) {
    return { user, membership: null, organization: null, mfaGate: "allow" };
  }

  const membership = {
    id: String(membershipData.id),
    organizationId: String(membershipData.organization_id),
    role: membershipData.role as OrganizationRole,
    status: membershipData.status as "active" | "revoked",
    version: Number(membershipData.version),
  };

  if (membership.status === "revoked") {
    return { user, membership, organization: null, mfaGate: "allow" };
  }

  const { data: organizationData, error: organizationError } = await supabase
    .from("organizations")
    .select("id, display_name, legal_name, organization_type, onboarding_status, status")
    .eq("id", membership.organizationId)
    .maybeSingle();

  if (organizationError || !organizationData) {
    return { user, membership: null, organization: null, mfaGate: "allow" };
  }

  const mfa = await currentMfaState(supabase);

  return {
    user,
    membership,
    organization: {
      id: String(organizationData.id),
      displayName: String(organizationData.display_name),
      legalName: String(organizationData.legal_name),
      organizationType: String(organizationData.organization_type),
      onboardingStatus: organizationData.onboarding_status as AuthorityAccessContext["organization"] extends infer T
        ? T extends { onboardingStatus: infer S } ? S : never
        : never,
      status: organizationData.status as "active" | "suspended" | "closed",
    },
    mfaGate: mfaGateDecision(membership.role, mfa),
  };
});

export function roleLabel(role: OrganizationRole) {
  const labels: Record<OrganizationRole, string> = {
    owner: "Owner",
    admin: "Administrator",
    staff: "Operations staff",
    reviewer: "Institution reviewer",
    developer: "Developer",
    auditor: "Auditor",
  };
  return labels[role];
}
