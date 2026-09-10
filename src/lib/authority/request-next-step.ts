import type { OrganizationRole } from "./access.ts";
import type { HostedAuthorityRecord, HostedAuthorityStatus } from "./hosted-records.ts";
import { canCoordinateAuthorityRequests, canRecordAuthorityDecision } from "./role-capabilities.ts";

const statusSteps: Record<HostedAuthorityStatus, { actor: string; detail: string }> = {
  draft: { actor: "Request coordinator", detail: "Check the people and requested actions, then send the invitation." },
  awaiting_principal: { actor: "Account holder", detail: "The account holder needs to review and confirm this request." },
  awaiting_representative: { actor: "Representative", detail: "The representative needs to review and accept the responsibility." },
  evidence_required: { actor: "Representative", detail: "The representative needs to provide the required information." },
  ready_to_submit: { actor: "Representative", detail: "The representative needs to submit the completed information." },
  information_requested: { actor: "Representative", detail: "The representative needs to respond to the institution’s questions." },
  under_review: { actor: "Institution reviewer", detail: "The institution needs to review the evidence and record its decision." },
  accepted: { actor: "Decision recorded", detail: "Read the receipt for the institution’s accepted scope." },
  accepted_with_limits: { actor: "Decision recorded", detail: "Read the receipt for the institution’s accepted scope and limits." },
  rejected: { actor: "Decision recorded", detail: "Read the receipt for the institution’s decision and reasons." },
  declined: { actor: "Request closed", detail: "A participant declined. Open the request to review what happened." },
  withdrawn: { actor: "Request closed", detail: "The request was withdrawn. Open it to review the history." },
  revoked: { actor: "Revocation recorded", detail: "Open the request to review the recorded revocation and history." },
  expired: { actor: "Request expired", detail: "Open the request to review its dates and history." },
  canceled: { actor: "Request closed", detail: "The request was canceled. Open it to review the history." },
};

export function requestNextStep(record: HostedAuthorityRecord, role: OrganizationRole) {
  const step = statusSteps[record.status];
  const actionable = (record.status === "draft" && canCoordinateAuthorityRequests(role)) ||
    (record.status === "under_review" && canRecordAuthorityDecision(role));
  const actor = record.status === "awaiting_principal" ? record.principalName :
    ["awaiting_representative", "evidence_required", "ready_to_submit", "information_requested"].includes(record.status) ? record.representativeName : step.actor;
  return { ...step, actor, actionable,
    label: actionable ? record.status === "draft" ? "Continue draft" : "Review request" : "View request" };
}

