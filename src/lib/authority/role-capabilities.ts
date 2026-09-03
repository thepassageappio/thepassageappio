import type { OrganizationRole } from "./access.ts";

const requestCoordinatorRoles = new Set<OrganizationRole>(["owner", "admin", "staff"]);

export const requestCoordinatorRecoveryMessage =
  "Only an owner, administrator, or operations staff member can start and send a request. Ask one of them to prepare the draft.";

export function canCoordinateAuthorityRequests(role: OrganizationRole) {
  return requestCoordinatorRoles.has(role);
}

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
