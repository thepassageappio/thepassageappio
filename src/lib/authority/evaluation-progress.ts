import type { HostedAuthorityRecord, HostedAuthorityStatus } from "./hosted-records.ts";
import type { OrganizationRole } from "./access.ts";
import { canCoordinateAuthorityRequests } from "./role-capabilities.ts";
import { requestNextStep } from "./request-next-step.ts";

const decisionStatuses = new Set<HostedAuthorityStatus>(["accepted", "accepted_with_limits", "rejected"]);
const closedStatuses = new Set<HostedAuthorityStatus>(["declined", "withdrawn", "revoked", "expired", "canceled"]);

export type EvaluationProgress = {
  completedCount: number;
  daysRemaining: number | null;
  nextTitle: string;
  nextDescription: string;
  nextHref: string;
  nextLabel: string;
  milestone: 1 | 2 | 3;
};

export function evaluationProgress(records: HostedAuthorityRecord[], periodEndsAt: string | null, now = new Date(), role: OrganizationRole = "owner"): EvaluationProgress {
  const completed = records.filter((record) => decisionStatuses.has(record.status));
  const openRecords = records.filter((record) => !decisionStatuses.has(record.status) && !closedStatuses.has(record.status));
  const open = openRecords.find((record) => record.status === "under_review" && requestNextStep(record, role).actionable)
    ?? openRecords.find((record) => requestNextStep(record, role).actionable)
    ?? openRecords[0];
  const daysRemaining = periodEndsAt
    ? Math.max(0, Math.ceil((new Date(periodEndsAt).getTime() - now.getTime()) / 86_400_000))
    : null;

  if (open) {
    const next = requestNextStep(open, role);
    return {
      completedCount: completed.length,
      daysRemaining,
      nextTitle: next.actionable ? open.status === "draft" ? "Finish this draft" : "A request is ready for your review" : `Waiting on ${next.actor}`,
      nextDescription: `${open.principalName} · ${open.referenceCode}. ${next.detail}`,
      nextHref: `/app/requests/${open.id}`,
      nextLabel: next.label,
      milestone: open.status === "draft" ? 1 : 2,
    };
  }
  if (completed[0]) return {
    completedCount: completed.length,
    daysRemaining,
    nextTitle: "Your decision receipt is ready",
    nextDescription: "Read the institution’s decision, accepted scope and any limits in the shared receipt.",
    nextHref: `/app/requests/${completed[0].id}/receipt`,
    nextLabel: "Review the receipt",
    milestone: 3,
  };
  if (!canCoordinateAuthorityRequests(role)) return {
    completedCount: 0, daysRemaining,
    nextTitle: "You’re up to date",
    nextDescription: "There are no open requests. You can review saved history below or check who coordinates requests for your team.",
    nextHref: "/app/team", nextLabel: "View your team", milestone: 1,
  };
  return {
    completedCount: 0,
    daysRemaining,
    nextTitle: "Complete one request from start to receipt",
    nextDescription: "Use sample details to experience the whole workflow before entering institution information.",
    nextHref: "/app/requests/new?sample=1",
    nextLabel: "Start with sample details",
    milestone: 1,
  };
}
