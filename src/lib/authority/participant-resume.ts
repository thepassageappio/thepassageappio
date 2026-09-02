import type { HostedAuthorityStatus } from "./hosted-records.ts";

const REPRESENTATIVE_RESUME_STATUSES = new Set<HostedAuthorityStatus>([
  "evidence_required",
  "ready_to_submit",
  "information_requested",
]);

const PARTICIPANT_RECEIPT_STATUSES = new Set<HostedAuthorityStatus>([
  "accepted",
  "accepted_with_limits",
  "rejected",
  "revoked",
  "expired",
]);

export function canReissueParticipantAccess(
  participantRole: "principal" | "representative",
  recordStatus: HostedAuthorityStatus,
) {
  if (PARTICIPANT_RECEIPT_STATUSES.has(recordStatus)) return true;
  if (participantRole === "principal") return recordStatus === "awaiting_principal";
  return recordStatus === "awaiting_representative" || REPRESENTATIVE_RESUME_STATUSES.has(recordStatus);
}

export function participantAccessPurpose(
  participantRole: "principal" | "representative",
  recordStatus: HostedAuthorityStatus,
): "decision" | "resume" | "receipt" {
  if (PARTICIPANT_RECEIPT_STATUSES.has(recordStatus)) return "receipt";
  return participantRole === "representative" && REPRESENTATIVE_RESUME_STATUSES.has(recordStatus)
    ? "resume"
    : "decision";
}
