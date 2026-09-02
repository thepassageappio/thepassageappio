import { cache } from "react";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

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
};

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
    return { user, membership: null, organization: null };
  }

  const membership = {
    id: String(membershipData.id),
    organizationId: String(membershipData.organization_id),
    role: membershipData.role as OrganizationRole,
    status: membershipData.status as "active" | "revoked",
    version: Number(membershipData.version),
  };

  if (membership.status === "revoked") {
    return { user, membership, organization: null };
  }

  const { data: organizationData, error: organizationError } = await supabase
    .from("organizations")
    .select("id, display_name, legal_name, organization_type, onboarding_status, status")
    .eq("id", membership.organizationId)
    .maybeSingle();

  if (organizationError || !organizationData) {
    return { user, membership: null, organization: null };
  }

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
