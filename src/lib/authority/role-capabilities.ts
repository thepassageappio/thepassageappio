import type { OrganizationRole } from "./access.ts";

export const organizationCapabilities = [
  "organization.view",
  "organization.manage",
  "members.view",
  "members.invite",
  "members.role_manage",
  "members.revoke",
  "requests.view",
  "requests.create",
  "requests.activate",
  "requests.review_evidence",
  "requests.request_information",
  "requests.decide",
  "policy.view",
  "policy.manage",
  "audit.view",
  "billing.view",
  "billing.manage",
  "integrations.view",
  "integrations.manage",
] as const;

export type OrganizationCapability = (typeof organizationCapabilities)[number];

const allCapabilities = [...organizationCapabilities];

export const roleCapabilityMap: Record<OrganizationRole, readonly OrganizationCapability[]> = {
  owner: allCapabilities,
  admin: [
    "organization.view",
    "members.view",
    "members.invite",
    "members.role_manage",
    "members.revoke",
    "requests.view",
    "requests.create",
    "requests.activate",
    "requests.review_evidence",
    "requests.request_information",
    "requests.decide",
    "policy.view",
    "audit.view",
    "billing.view",
    "billing.manage",
    "integrations.view",
  ],
  staff: [
    "organization.view",
    "members.view",
    "requests.view",
    "requests.create",
    "requests.activate",
    "policy.view",
  ],
  reviewer: [
    "organization.view",
    "members.view",
    "requests.view",
    "requests.review_evidence",
    "requests.request_information",
    "requests.decide",
    "policy.view",
  ],
  developer: [
    "organization.view",
    "members.view",
    "policy.view",
    "integrations.view",
    "integrations.manage",
  ],
  auditor: [
    "organization.view",
    "members.view",
    "requests.view",
    "policy.view",
    "audit.view",
    "billing.view",
    "integrations.view",
  ],
};

export const roleDefinitions: ReadonlyArray<{
  role: OrganizationRole;
  purpose: string;
  access: string;
}> = [
  { role: "owner", purpose: "Accountable organization owner", access: "Full organization, access, request, policy, billing, integration, and audit control." },
  { role: "admin", purpose: "Day-to-day organization administrator", access: "Team access, requests, decisions, billing, integrations, and audit. Cannot control owners or add administrators." },
  { role: "staff", purpose: "Request operations", access: "Creates and coordinates requests. Cannot decide, manage access, or administer billing." },
  { role: "reviewer", purpose: "Institution decision maker", access: "Reviews evidence, requests corrections, and records decisions. Cannot create requests or manage access." },
  { role: "auditor", purpose: "Independent oversight", access: "Read-only request, receipt, access-history, billing, and integration visibility." },
  { role: "developer", purpose: "Integration operations", access: "Integration configuration without participant-request or billing access." },
];

export function hasOrganizationCapability(role: OrganizationRole, capability: OrganizationCapability) {
  return roleCapabilityMap[role].includes(capability);
}

export function capabilitiesForRole(role: OrganizationRole) {
  return [...roleCapabilityMap[role]];
}

export function canCoordinateAuthorityRequests(role: OrganizationRole) {
  return hasOrganizationCapability(role, "requests.create")
    && hasOrganizationCapability(role, "requests.activate");
}

export function canReviewAuthorityEvidence(role: OrganizationRole) {
  return hasOrganizationCapability(role, "requests.review_evidence");
}

export function canRecordAuthorityDecision(role: OrganizationRole) {
  return hasOrganizationCapability(role, "requests.decide");
}

export function canManageMembers(role: OrganizationRole) {
  return hasOrganizationCapability(role, "members.invite")
    && hasOrganizationCapability(role, "members.role_manage")
    && hasOrganizationCapability(role, "members.revoke");
}

export function canViewOrganizationAudit(role: OrganizationRole) {
  return hasOrganizationCapability(role, "audit.view");
}

export function canManageBilling(role: OrganizationRole) {
  return hasOrganizationCapability(role, "billing.manage");
}

export function assignableRolesFor(role: OrganizationRole): OrganizationRole[] {
  return role === "owner"
    ? ["owner", "admin", "staff", "reviewer", "developer", "auditor"]
    : role === "admin"
      ? ["staff", "reviewer", "developer", "auditor"]
      : [];
}

export function invitableRolesFor(role: OrganizationRole): OrganizationRole[] {
  return role === "owner"
    ? ["admin", "staff", "reviewer", "developer", "auditor"]
    : role === "admin"
      ? ["staff", "reviewer", "developer", "auditor"]
      : [];
}

export function canManageTargetMember(input: {
  actorRole: OrganizationRole;
  targetRole: OrganizationRole;
  targetIsSoleOwner: boolean;
}) {
  if (!canManageMembers(input.actorRole) || input.targetIsSoleOwner) return false;
  if (input.actorRole === "owner") return true;
  return !["owner", "admin"].includes(input.targetRole);
}

export const requestCoordinatorRecoveryMessage =
  "Only an owner, administrator, or operations staff member can start and send a request. Ask one of them to prepare the draft.";

export function institutionWorkspacePresentation(role: OrganizationRole) {
  if (role === "reviewer") {
    return {
      eyebrow: "Institution review queue",
      title: "Requests ready for your review",
      description: "Review submitted evidence, ask for a specific correction, and record your institution's decision.",
      emptyTitle: "Nothing needs your review",
      emptyDescription: "Requests appear here after a representative sends the completed information. An owner or operations staff member can confirm request setup.",
    } as const;
  }

  return {
    eyebrow: "Institution workspace",
    title: null,
    description: "Start requests, see what needs attention, and review every saved decision.",
    emptyTitle: "Your request queue is empty",
    emptyDescription: "Create a draft to review the participants and scope. Nothing is sent or counted until activation.",
  } as const;
}
