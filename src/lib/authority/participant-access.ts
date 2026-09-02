export type ParticipantRole = "principal" | "representative";
export const PARTICIPANT_SESSION_COOKIE = "pa_participant_session";

export type ParticipantDecision =
  | "principal_confirm"
  | "principal_decline"
  | "representative_accept"
  | "representative_decline";

export type ParticipantEntryDecision =
  | "ready"
  | "waiting"
  | "expired"
  | "already_used"
  | "unavailable";

export type ParticipantInvitationPreview = {
  entryStatus: ParticipantEntryDecision;
  accessPurpose: "decision" | "resume" | "receipt";
  institutionName: string | null;
  referenceCode: string | null;
  participantRole: ParticipantRole | null;
  participantName: string | null;
  otherPersonName: string | null;
  purpose: string | null;
  accountBoundary: string | null;
  allowedActionKeys: string[];
  validUntil: string | null;
  invitationExpiresAt: string | null;
};

export type ParticipantSessionContext = {
  authorityRecordId: string;
  referenceCode: string;
  institutionName: string;
  participantRole: ParticipantRole;
  participantName: string;
  otherPersonName: string;
  recordVersion: number;
  status: string;
  purpose: string;
  accountBoundary: string;
  allowedActionKeys: string[];
  prohibitedActionKeys: string[];
  validUntil: string;
  sessionExpiresAt: string;
};

export function participantDecisionTransition(input: {
  role: ParticipantRole;
  recordStatus: string;
  decision: ParticipantDecision;
  acknowledged: boolean;
  reason: string;
}) {
  if (!input.acknowledged) throw new Error("participant_acknowledgment_required");
  const declines = input.decision === "principal_decline" || input.decision === "representative_decline";
  if (declines && input.reason.trim().length < 3) throw new Error("participant_decline_reason_required");

  if (input.role === "principal" && input.recordStatus === "awaiting_principal") {
    if (input.decision === "principal_confirm") return "awaiting_representative";
    if (input.decision === "principal_decline") return "declined";
  }
  if (input.role === "representative" && input.recordStatus === "awaiting_representative") {
    if (input.decision === "representative_accept") return "evidence_required";
    if (input.decision === "representative_decline") return "declined";
  }
  throw new Error("participant_decision_not_allowed");
}

type ParticipantEntryInput = {
  role: ParticipantRole;
  invitationStatus: "pending" | "accepted" | "revoked" | "expired";
  invitationExpiresAt: string;
  recordStatus: string;
  now: string;
};

export function normalizeParticipantToken(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(normalized) ? normalized : null;
}

export function participantEntryDecision(input: ParticipantEntryInput): ParticipantEntryDecision {
  if (input.invitationStatus === "accepted") return "already_used";
  if (input.invitationStatus === "revoked") return "unavailable";
  if (input.invitationStatus === "expired") return "expired";
  if (Date.parse(input.invitationExpiresAt) <= Date.parse(input.now)) return "expired";

  if (["accepted", "accepted_with_limits", "rejected", "revoked", "expired"].includes(input.recordStatus)) {
    return "ready";
  }

  if (input.role === "principal") {
    return input.recordStatus === "awaiting_principal" ? "ready" : "unavailable";
  }

  if (input.recordStatus === "awaiting_principal") return "waiting";
  return ["awaiting_representative", "evidence_required", "ready_to_submit", "information_requested"].includes(input.recordStatus)
    ? "ready"
    : "unavailable";
}

export function participantOverviewPath(recordId: string) {
  return `/request/${encodeURIComponent(recordId)}/overview`;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function mapParticipantInvitationPreview(value: unknown): ParticipantInvitationPreview {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const entryStatus = stringValue(row.entry_status);
  const participantRole = stringValue(row.participant_role);
  const accessPurpose = stringValue(row.access_purpose);
  return {
    entryStatus: entryStatus === "ready" || entryStatus === "waiting" || entryStatus === "expired" || entryStatus === "already_used" ? entryStatus : "unavailable",
    accessPurpose: accessPurpose === "resume" || accessPurpose === "receipt" ? accessPurpose : "decision",
    institutionName: stringValue(row.institution_name),
    referenceCode: stringValue(row.reference_code),
    participantRole: participantRole === "principal" || participantRole === "representative" ? participantRole : null,
    participantName: stringValue(row.participant_name),
    otherPersonName: stringValue(row.other_person_name),
    purpose: stringValue(row.purpose),
    accountBoundary: stringValue(row.account_boundary),
    allowedActionKeys: stringArray(row.allowed_action_keys),
    validUntil: stringValue(row.valid_until),
    invitationExpiresAt: stringValue(row.invitation_expires_at),
  };
}

export function mapParticipantSessionContext(value: unknown): ParticipantSessionContext | null {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const role = stringValue(row.participant_role);
  const required = [
    "authority_record_id", "reference_code", "institution_name", "participant_name",
    "other_person_name", "status", "purpose", "account_boundary", "valid_until",
    "session_expires_at",
  ].map((key) => stringValue(row[key]));
  const recordVersion = Number(row.record_version);
  if ((role !== "principal" && role !== "representative") || required.some((item) => !item) || !Number.isSafeInteger(recordVersion) || recordVersion < 1) return null;
  return {
    authorityRecordId: required[0]!,
    referenceCode: required[1]!,
    institutionName: required[2]!,
    participantRole: role,
    participantName: required[3]!,
    otherPersonName: required[4]!,
    recordVersion,
    status: required[5]!,
    purpose: required[6]!,
    accountBoundary: required[7]!,
    allowedActionKeys: stringArray(row.allowed_action_keys),
    prohibitedActionKeys: stringArray(row.prohibited_action_keys),
    validUntil: required[8]!,
    sessionExpiresAt: required[9]!,
  };
}
