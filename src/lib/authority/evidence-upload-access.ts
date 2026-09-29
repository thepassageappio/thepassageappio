// Who may upload evidence, as pure rules shared by the prepare and finalize commands.
// These mirror the existing in-request upload paths and the RPC checks; the RPCs still
// decide at record time.
import type { ParticipantEvidenceContext, ParticipantEvidenceRequirement } from "./participant-evidence.ts";
import { SUBMISSION_EVIDENCE_REQUIREMENT_KEYS, type RequesterSessionContext } from "./multi-institution-submission.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isEvidenceUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/** Representative session for this request, and a document requirement on it. */
export function participantUploadRequirement(input: {
  participantRole: string | null | undefined;
  context: ParticipantEvidenceContext | null;
  requirementKey: string;
}): ParticipantEvidenceRequirement {
  if (input.participantRole !== "representative" || !input.context) throw new Error("evidence_not_available");
  const requirement = input.context.requirements.find((item) => item.requirementKey === input.requirementKey && item.inputKind === "document");
  if (!requirement) throw new Error("evidence_requirement_unavailable");
  return requirement;
}

export function assertParticipantRequirementUploadable(requirement: ParticipantEvidenceRequirement) {
  if (requirement.status !== "not_started" && requirement.status !== "needs_attention") throw new Error("evidence_requirement_not_uploadable");
}

/** Requester session for this submission group. */
export function assertSubmissionSession(groupId: string, context: RequesterSessionContext | null): RequesterSessionContext {
  if (!isEvidenceUuid(groupId) || !context || context.groupId !== groupId) throw new Error("requester_session_unavailable");
  return context;
}

export function assertSubmissionUploadable(context: RequesterSessionContext, expectedVersion: number) {
  if (context.status !== "draft") throw new Error("submission_group_not_submittable");
  if (context.version !== expectedVersion) throw new Error("version_conflict");
}

export function isSubmissionRequirementKey(value: string) {
  return (SUBMISSION_EVIDENCE_REQUIREMENT_KEYS as readonly string[]).includes(value);
}
