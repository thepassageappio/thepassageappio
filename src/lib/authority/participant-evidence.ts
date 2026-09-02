export type ParticipantEvidenceArtifact = {
  id: string;
  originalFilename: string;
  mediaType: string;
  byteSize: number;
  providerStatus: string;
  reviewStatus: string;
  reviewerNote: string | null;
  createdAt: string;
};

export type ParticipantEvidenceRequirement = {
  id: string;
  requirementKey: string;
  title: string;
  reason: string;
  inputKind: "document" | "attestation";
  status: "not_started" | "review_pending" | "completed" | "needs_attention";
  ordinal: number;
  version: number;
  artifact: ParticipantEvidenceArtifact | null;
};

export type ParticipantEvidenceContext = {
  authorityRecordId: string;
  recordVersion: number;
  status: string;
  requirements: ParticipantEvidenceRequirement[];
};

function row(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function mapArtifact(value: unknown): ParticipantEvidenceArtifact | null {
  if (!value) return null;
  const item = row(value);
  if (!item.id || !item.original_filename) return null;
  return {
    id: String(item.id),
    originalFilename: String(item.original_filename),
    mediaType: String(item.media_type),
    byteSize: Number(item.byte_size),
    providerStatus: String(item.provider_status),
    reviewStatus: String(item.review_status),
    reviewerNote: typeof item.reviewer_note === "string" ? item.reviewer_note : null,
    createdAt: String(item.created_at),
  };
}

export function mapParticipantEvidenceContext(value: unknown): ParticipantEvidenceContext | null {
  const item = row(value);
  const requirements = Array.isArray(item.requirements) ? item.requirements.map((value) => {
    const requirement = row(value);
    return {
      id: String(requirement.id),
      requirementKey: String(requirement.requirement_key),
      title: String(requirement.title),
      reason: String(requirement.reason),
      inputKind: requirement.input_kind === "attestation" ? "attestation" as const : "document" as const,
      status: String(requirement.status) as ParticipantEvidenceRequirement["status"],
      ordinal: Number(requirement.ordinal),
      version: Number(requirement.version),
      artifact: mapArtifact(requirement.artifact),
    };
  }) : [];
  const recordVersion = Number(item.record_version);
  if (!item.authority_record_id || !item.status || !Number.isSafeInteger(recordVersion) || requirements.length === 0) return null;
  return {
    authorityRecordId: String(item.authority_record_id),
    recordVersion,
    status: String(item.status),
    requirements,
  };
}

export function evidenceRequirementStatusLabel(status: ParticipantEvidenceRequirement["status"]) {
  const labels = {
    not_started: "Not started",
    review_pending: "Institution review",
    completed: "Complete",
    needs_attention: "Needs attention",
  };
  return labels[status];
}
