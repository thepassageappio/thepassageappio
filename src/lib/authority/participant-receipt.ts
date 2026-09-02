import type { HostedActionKey, HostedAuthorityStatus } from "./hosted-records.ts";
import type { HostedDecisionOutcome } from "./hosted-decisions.ts";

export type ParticipantDecisionReceipt = {
  receiptCode: string;
  referenceCode: string;
  institutionName: string;
  participantRole: "principal" | "representative";
  participantName: string;
  otherPersonName: string;
  currentStatus: HostedAuthorityStatus;
  currentVersion: number;
  decisionVersion: number;
  purpose: string;
  accountBoundary: string;
  requestedActionKeys: HostedActionKey[];
  outcome: HostedDecisionOutcome;
  reason: string;
  acceptedActionKeys: HostedActionKey[];
  limitations: string[];
  decidedAt: string;
  validUntil: string;
  receiptSha256: string;
  lifecycleSummary: string | null;
  lifecycleReason: string | null;
  lifecycleEffectiveAt: string | null;
};

function textValue(row: Record<string, unknown>, key: string) {
  return typeof row[key] === "string" && row[key] ? row[key] as string : null;
}

function textArray(row: Record<string, unknown>, key: string) {
  return Array.isArray(row[key]) ? row[key].filter((value): value is string => typeof value === "string") : [];
}

export function mapParticipantDecisionReceipt(value: unknown): ParticipantDecisionReceipt | null {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const role = textValue(row, "participant_role");
  const outcome = textValue(row, "decision_outcome");
  const currentVersion = Number(row.current_version);
  const decisionVersion = Number(row.decision_record_version);
  const requiredKeys = [
    "receipt_code", "reference_code", "institution_name", "participant_name", "other_person_name",
    "current_status", "purpose", "account_boundary", "decision_reason", "decided_at", "valid_until",
    "receipt_sha256",
  ];
  const required = requiredKeys.map((key) => textValue(row, key));
  if (
    (role !== "principal" && role !== "representative")
    || (outcome !== "accepted" && outcome !== "accepted_with_limits" && outcome !== "rejected")
    || !Number.isSafeInteger(currentVersion)
    || currentVersion < 1
    || !Number.isSafeInteger(decisionVersion)
    || decisionVersion < 1
    || required.some((value) => !value)
  ) return null;

  return {
    receiptCode: required[0]!,
    referenceCode: required[1]!,
    institutionName: required[2]!,
    participantRole: role,
    participantName: required[3]!,
    otherPersonName: required[4]!,
    currentStatus: required[5]! as HostedAuthorityStatus,
    currentVersion,
    decisionVersion,
    purpose: required[6]!,
    accountBoundary: required[7]!,
    requestedActionKeys: textArray(row, "requested_action_keys") as HostedActionKey[],
    outcome,
    reason: required[8]!,
    acceptedActionKeys: textArray(row, "accepted_action_keys") as HostedActionKey[],
    limitations: textArray(row, "limitations"),
    decidedAt: required[9]!,
    validUntil: required[10]!,
    receiptSha256: required[11]!,
    lifecycleSummary: textValue(row, "lifecycle_summary"),
    lifecycleReason: textValue(row, "lifecycle_reason"),
    lifecycleEffectiveAt: textValue(row, "lifecycle_effective_at"),
  };
}

export function participantReceiptPath(recordId: string) {
  return `/request/${encodeURIComponent(recordId)}/receipt`;
}
