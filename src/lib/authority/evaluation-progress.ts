import type { HostedAuthorityRecord, HostedAuthorityStatus } from "./hosted-records.ts";

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

export function evaluationProgress(records: HostedAuthorityRecord[], periodEndsAt: string | null, now = new Date()): EvaluationProgress {
  const completed = records.filter((record) => decisionStatuses.has(record.status));
  const open = records.find((record) => !decisionStatuses.has(record.status) && !closedStatuses.has(record.status));
  const daysRemaining = periodEndsAt
    ? Math.max(0, Math.ceil((new Date(periodEndsAt).getTime() - now.getTime()) / 86_400_000))
    : null;

  if (completed[0]) return {
    completedCount: completed.length,
    daysRemaining,
    nextTitle: "Your first complete result is ready",
    nextDescription: "Review the shared decision receipt, then use the result to plan a focused founding pilot.",
    nextHref: `/app/requests/${completed[0].id}/receipt`,
    nextLabel: "Review the receipt",
    milestone: 3,
  };
  if (open) return {
    completedCount: 0,
    daysRemaining,
    nextTitle: open.status === "draft" ? "Finish and send this request" : "Keep this request moving",
    nextDescription: open.status === "draft"
      ? "Confirm the people, permitted actions, and end date, then send the secure invitations."
      : "Open the request to see who needs to act and the exact next step.",
    nextHref: `/app/requests/${open.id}`,
    nextLabel: "Open the request",
    milestone: open.status === "draft" ? 1 : 2,
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
