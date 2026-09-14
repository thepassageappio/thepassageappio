// Pure validation/prep + response-mapping helpers for the Phase 0 requester-facing
// multi-institution submission flow. Mirrors the style of ./hosted-records.ts and
// ./participant-access.ts: normalize inputs the same way the RPC layer does, throw
// a plain Error whose message is the same snake_case code the RPCs in
// 20260913150500_authority_multi_institution_submission_phase0_functions.sql
// raise, and provide typed mappers for the jsonb shapes those RPCs return. No I/O.

export const REQUESTER_SESSION_COOKIE = "pa_requester_session";
// Short-lived, httpOnly cookie holding the requester's own email between
// start_submission_group_v1 (which knows the email) and submit_submission_group_v1
// (which needs it to send the optional "submitted" confirmation). The RPC surface
// never returns requester_email_normalized again after the start call, by design
// (get_requester_session_context_v1 omits it), so this is the only way to recover
// it later without a schema change.
export const REQUESTER_EMAIL_COOKIE = "pa_requester_email_pending";

export const SUBMISSION_EVIDENCE_BUCKET = "authority-submission-evidence";

export const MIN_SUBMISSION_TARGETS = 2;
export const MAX_SUBMISSION_TARGETS = 5;

export const SUBMISSION_EVIDENCE_REQUIREMENT_KEYS = ["power_of_attorney", "identity_evidence"] as const;
export type SubmissionEvidenceRequirementKey = (typeof SUBMISSION_EVIDENCE_REQUIREMENT_KEYS)[number];

export const SUBMISSION_EVIDENCE_LABELS: Record<SubmissionEvidenceRequirementKey, string> = {
  power_of_attorney: "Power of attorney document",
  identity_evidence: "Identity evidence",
};

export const REQUESTER_ATTESTATION_TEXT_VERSION = "requester-attestation-2026-09-13";

// These two strings must stay byte-for-byte identical to the literals
// submit_submission_group_v1 inserts into authority_records.purpose /
// account_boundary for every spawned case (see the functions migration), since
// the participant invitation emails sent after spawn describe that same case.
export const MULTI_INSTITUTION_PURPOSE =
  "Request recognition of limited financial power of attorney authority (submitted alongside other institutions in one multi-institution request)";
export const MULTI_INSTITUTION_ACCOUNT_BOUNDARY = "All accounts and relationships held with this institution";

// Verbatim from docs/USER-INITIATED-MULTI-INSTITUTION-SCOPE-2026-09-13.md section 0
// ("Legal boundary, restated"), reused rather than inventing new legal-sounding copy.
export const PASSAGE_AUTHORITY_BOUNDARY_NOTICE =
  "Passage does not create, validate, or determine the legal validity of a power of attorney. It coordinates workflow and institutional review.";

// Adapted (singular -> plural target) from the exact event summary text
// submit_submission_group_v1 writes to authority_events for every spawned case:
// "This institution's case is independent: its evidence is a private copy, and
// its decision has no effect on any other institution's case."
export const MULTI_INSTITUTION_CASE_INDEPENDENCE_NOTICE =
  "Each institution's case is independent: its evidence is a private copy, and its decision has no effect on any other institution's case.";

export const MAX_GROUP_EVIDENCE_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_GROUP_EVIDENCE_MEDIA_TYPES = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export type GroupEvidenceMediaType = keyof typeof ALLOWED_GROUP_EVIDENCE_MEDIA_TYPES;

export type RequesterRelationship = "representative" | "principal_self" | "other";

const RELATIONSHIPS: readonly RequesterRelationship[] = ["representative", "principal_self", "other"];

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function isPlausibleEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export function normalizeRequesterToken(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(normalized) ? normalized : null;
}

export type RequesterIntakeInput = {
  name: string;
  email: string;
  relationship: string;
};

export function prepareRequesterIntake(input: RequesterIntakeInput) {
  const name = input.name.trim();
  const email = normalizedEmail(input.email);
  const relationship = input.relationship.trim() as RequesterRelationship;

  if (name.length < 2 || name.length > 160) throw new Error("requester_name_invalid");
  if (!isPlausibleEmail(email)) throw new Error("requester_email_invalid");
  if (!RELATIONSHIPS.includes(relationship)) throw new Error("requester_relationship_invalid");

  return { name, email, relationship };
}

export type ParticipantDetailsInput = {
  principalName: string;
  principalEmail: string;
  representativeName: string;
  representativeEmail: string;
  principalConfirmationAvailable: boolean | null;
  principalConfirmationUnavailableReason: string;
};

export function prepareParticipantDetails(input: ParticipantDetailsInput) {
  const principalName = input.principalName.trim();
  const representativeName = input.representativeName.trim();
  const principalEmail = normalizedEmail(input.principalEmail);
  const representativeEmail = normalizedEmail(input.representativeEmail);
  const reason = input.principalConfirmationUnavailableReason.trim();

  if (principalName.length < 2 || principalName.length > 160) throw new Error("participant_name_invalid");
  if (representativeName.length < 2 || representativeName.length > 160) throw new Error("participant_name_invalid");
  if (!isPlausibleEmail(principalEmail) || !isPlausibleEmail(representativeEmail)) {
    throw new Error("participant_email_invalid");
  }
  if (principalEmail === representativeEmail) throw new Error("participant_roles_must_be_distinct");
  if (input.principalConfirmationAvailable === null) throw new Error("principal_confirmation_basis_required");

  const principalConfirmationAvailable = input.principalConfirmationAvailable;
  if (principalConfirmationAvailable === false && reason.length === 0) {
    throw new Error("principal_confirmation_reason_required");
  }

  return {
    principalName,
    principalEmail,
    representativeName,
    representativeEmail,
    principalConfirmationAvailable,
    principalConfirmationUnavailableReason: principalConfirmationAvailable === false ? reason : "",
  };
}

export type TargetInput = {
  label: string;
  institutionType: string;
  organizationId: string | null;
};

export function prepareTargetInput(input: TargetInput) {
  const label = input.label.trim();
  const institutionType = input.institutionType.trim();

  if (label.length < 2 || label.length > 160) throw new Error("target_label_invalid");
  if (institutionType.length < 2) throw new Error("target_institution_type_invalid");

  return { label, institutionType, organizationId: input.organizationId };
}

export function groupEvidenceStoragePath(groupId: string, artifactId: string, extension: string) {
  if (!/^[0-9a-f-]{36}$/i.test(groupId) || !/^[0-9a-f-]{36}$/i.test(artifactId)) {
    throw new Error("evidence_path_invalid");
  }
  if (!/^[a-z0-9]{2,5}$/.test(extension)) throw new Error("evidence_path_invalid");
  return `${groupId}/${artifactId}/source.${extension}`;
}

export type PreparedGroupEvidenceUpload = {
  originalFilename: string;
  mediaType: GroupEvidenceMediaType;
  byteSize: number;
  extension: string;
};

const CONTROL_CHARACTERS_PATTERN = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`, "g");

export function prepareGroupEvidenceUpload(input: { name: string; type: string; size: number }): PreparedGroupEvidenceUpload {
  const originalFilename = input.name.trim().replace(CONTROL_CHARACTERS_PATTERN, "").slice(0, 180);
  const mediaType = input.type.trim().toLowerCase() as GroupEvidenceMediaType;
  const extension = ALLOWED_GROUP_EVIDENCE_MEDIA_TYPES[mediaType];

  if (!originalFilename) throw new Error("evidence_file_required");
  if (!extension) throw new Error("evidence_file_type_not_allowed");
  if (!Number.isSafeInteger(input.size) || input.size < 1) throw new Error("evidence_file_empty");
  if (input.size > MAX_GROUP_EVIDENCE_FILE_BYTES) throw new Error("evidence_file_too_large");

  return { originalFilename, mediaType, byteSize: input.size, extension };
}

export function prepareRequesterAttestation(input: { acknowledged: boolean }) {
  if (!input.acknowledged) throw new Error("requester_attestation_required");
  return { acknowledged: true as const, textVersion: REQUESTER_ATTESTATION_TEXT_VERSION };
}

export type SubmissionTarget = {
  id: string;
  ordinal: number;
  targetLabel: string;
  targetInstitutionType: string;
  matchStatus: "matched" | "unmatched" | "invited_to_join" | "declined_to_join";
  organizationId: string | null;
  authorityRecordId: string | null;
  version: number;
};

export type SubmissionEvidence = {
  id: string;
  requirementKey: SubmissionEvidenceRequirementKey;
  originalFilename: string;
  mediaType: string;
  byteSize: number;
};

export type RequesterSessionContext = {
  groupId: string;
  referenceCode: string;
  status: string;
  version: number;
  requesterName: string;
  requesterRelationship: RequesterRelationship;
  principalName: string | null;
  principalEmailNormalized: string | null;
  representativeName: string | null;
  representativeEmailNormalized: string | null;
  principalConfirmationAvailable: boolean | null;
  principalConfirmationUnavailableReason: string | null;
  reviewFlag: "standard" | "light_review";
  sessionExpiresAt: string;
  targets: SubmissionTarget[];
  evidence: SubmissionEvidence[];
};

function stringOrNull(value: unknown) {
  return typeof value === "string" ? value : null;
}

function mapTarget(row: unknown): SubmissionTarget | null {
  const value = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const id = stringOrNull(value.id);
  const matchStatus = stringOrNull(value.match_status);
  const targetLabel = stringOrNull(value.target_label);
  const targetInstitutionType = stringOrNull(value.target_institution_type);
  const ordinal = Number(value.ordinal);
  const version = Number(value.version);
  if (
    !id || !targetLabel || !targetInstitutionType
    || (matchStatus !== "matched" && matchStatus !== "unmatched" && matchStatus !== "invited_to_join" && matchStatus !== "declined_to_join")
    || !Number.isSafeInteger(ordinal) || !Number.isSafeInteger(version)
  ) return null;
  return {
    id,
    ordinal,
    targetLabel,
    targetInstitutionType,
    matchStatus,
    organizationId: stringOrNull(value.organization_id),
    authorityRecordId: stringOrNull(value.authority_record_id),
    version,
  };
}

function mapEvidence(row: unknown): SubmissionEvidence | null {
  const value = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const id = stringOrNull(value.id);
  const requirementKey = stringOrNull(value.requirement_key);
  const originalFilename = stringOrNull(value.original_filename);
  const mediaType = stringOrNull(value.media_type);
  const byteSize = Number(value.byte_size);
  if (
    !id || !originalFilename || !mediaType || !Number.isSafeInteger(byteSize)
    || (requirementKey !== "power_of_attorney" && requirementKey !== "identity_evidence")
  ) return null;
  return { id, requirementKey, originalFilename, mediaType, byteSize };
}

export function mapRequesterSessionContext(value: unknown): RequesterSessionContext | null {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const groupId = stringOrNull(row.group_id);
  const referenceCode = stringOrNull(row.reference_code);
  const status = stringOrNull(row.status);
  const requesterName = stringOrNull(row.requester_name);
  const requesterRelationship = stringOrNull(row.requester_relationship);
  const reviewFlag = stringOrNull(row.review_flag);
  const sessionExpiresAt = stringOrNull(row.session_expires_at);
  const version = Number(row.version);

  if (
    !groupId || !referenceCode || !status || !requesterName || !sessionExpiresAt
    || (requesterRelationship !== "representative" && requesterRelationship !== "principal_self" && requesterRelationship !== "other")
    || (reviewFlag !== "standard" && reviewFlag !== "light_review")
    || !Number.isSafeInteger(version)
  ) return null;

  const targets = Array.isArray(row.targets) ? row.targets.map(mapTarget).filter((item): item is SubmissionTarget => item !== null) : [];
  const evidence = Array.isArray(row.evidence) ? row.evidence.map(mapEvidence).filter((item): item is SubmissionEvidence => item !== null) : [];

  return {
    groupId,
    referenceCode,
    status,
    version,
    requesterName,
    requesterRelationship,
    principalName: stringOrNull(row.principal_name),
    principalEmailNormalized: stringOrNull(row.principal_email_normalized),
    representativeName: stringOrNull(row.representative_name),
    representativeEmailNormalized: stringOrNull(row.representative_email_normalized),
    principalConfirmationAvailable: typeof row.principal_confirmation_available === "boolean" ? row.principal_confirmation_available : null,
    principalConfirmationUnavailableReason: stringOrNull(row.principal_confirmation_unavailable_reason),
    reviewFlag,
    sessionExpiresAt,
    targets,
    evidence,
  };
}

export type InstitutionSearchResult = {
  organizationId: string;
  displayName: string;
  organizationType: string;
};

export function mapInstitutionSearchResults(value: unknown): InstitutionSearchResult[] {
  if (!Array.isArray(value)) return [];
  const results: InstitutionSearchResult[] = [];
  for (const row of value) {
    const item = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const organizationId = stringOrNull(item.organization_id);
    const displayName = stringOrNull(item.display_name);
    const organizationType = stringOrNull(item.organization_type);
    if (organizationId && displayName && organizationType) {
      results.push({ organizationId, displayName, organizationType });
    }
  }
  return results;
}

export type SpawnedCase = {
  targetId: string;
  organizationId: string;
  institutionName: string;
  authorityRecordId: string;
  referenceCode: string;
  principalToken: string;
  representativeToken: string;
};

export type EvidenceCopyOperation = {
  fromBucket: string;
  fromPath: string;
  toBucket: string;
  toPath: string;
};

export type SubmitSubmissionGroupResult = {
  groupId: string;
  referenceCode: string;
  status: string;
  matchedCount: number;
  unmatchedCount: number;
  spawned: SpawnedCase[];
  evidenceCopyOperations: EvidenceCopyOperation[];
};

function mapSpawned(row: unknown): SpawnedCase | null {
  const value = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const targetId = stringOrNull(value.target_id);
  const organizationId = stringOrNull(value.organization_id);
  const institutionName = stringOrNull(value.institution_name);
  const authorityRecordId = stringOrNull(value.authority_record_id);
  const referenceCode = stringOrNull(value.reference_code);
  const principalToken = stringOrNull(value.principal_token);
  const representativeToken = stringOrNull(value.representative_token);
  if (!targetId || !organizationId || !institutionName || !authorityRecordId || !referenceCode || !principalToken || !representativeToken) {
    return null;
  }
  return { targetId, organizationId, institutionName, authorityRecordId, referenceCode, principalToken, representativeToken };
}

function mapEvidenceCopyOperation(row: unknown): EvidenceCopyOperation | null {
  const value = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const fromBucket = stringOrNull(value.from_bucket);
  const fromPath = stringOrNull(value.from_path);
  const toBucket = stringOrNull(value.to_bucket);
  const toPath = stringOrNull(value.to_path);
  if (!fromBucket || !fromPath || !toBucket || !toPath) return null;
  return { fromBucket, fromPath, toBucket, toPath };
}

export function mapSubmitSubmissionGroupResult(value: unknown): SubmitSubmissionGroupResult | null {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const groupId = stringOrNull(row.group_id);
  const referenceCode = stringOrNull(row.reference_code);
  const status = stringOrNull(row.status);
  const matchedCount = Number(row.matched_count);
  const unmatchedCount = Number(row.unmatched_count);
  if (!groupId || !referenceCode || !status || !Number.isSafeInteger(matchedCount) || !Number.isSafeInteger(unmatchedCount)) {
    return null;
  }
  const spawned = Array.isArray(row.spawned) ? row.spawned.map(mapSpawned).filter((item): item is SpawnedCase => item !== null) : [];
  const evidenceCopyOperations = Array.isArray(row.evidence_copy_operations)
    ? row.evidence_copy_operations.map(mapEvidenceCopyOperation).filter((item): item is EvidenceCopyOperation => item !== null)
    : [];
  return { groupId, referenceCode, status, matchedCount, unmatchedCount, spawned, evidenceCopyOperations };
}
