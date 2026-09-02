import { AuthorityError } from "./errors.ts";
import type {
  ActorRole,
  AuthorityCommand,
  AuthorityEvent,
  AuthorityRecord,
  EvidenceArtifact,
} from "./types.ts";

type ApplyOptions = { now: string; eventId: string; sequence: number };

function fail(message: string, code: AuthorityError["code"], status: number): never {
  throw new AuthorityError(message, code, status);
}

function assertActor(record: AuthorityRecord, command: AuthorityCommand) {
  const expectedId =
    command.actorRole === "principal"
      ? record.principal.id
      : command.actorRole === "representative"
        ? record.representative.id
        : command.actorRole === "reviewer"
          ? record.reviewer.id
          : undefined;

  if (!expectedId || expectedId !== command.actorId) {
    fail("This person is not allowed to perform that action.", "UNAUTHORIZED_ACTOR", 403);
  }
}

function requireRole(command: AuthorityCommand, role: ActorRole) {
  if (command.actorRole !== role) {
    fail("This action belongs to a different participant.", "UNAUTHORIZED_ACTOR", 403);
  }
}

function requireStatus(record: AuthorityRecord, statuses: AuthorityRecord["status"][]) {
  if (!statuses.includes(record.status)) {
    fail("That step is no longer available. Refresh to see the current request.", "INVALID_TRANSITION", 409);
  }
}

function requireText(value: string, message: string) {
  if (value.trim().length < 3) fail(message, "INVALID_COMMAND", 400);
}

function completeRequirement(
  record: AuthorityRecord,
  requirementKey: string,
  actorId: string,
  artifact: EvidenceArtifact,
  now: string,
) {
  const requirement = record.requirements.find((entry) => entry.key === requirementKey);
  if (!requirement) fail("That policy requirement does not exist.", "INVALID_COMMAND", 400);
  if (requirement.status === "complete") {
    fail("That policy requirement is already complete.", "INVALID_TRANSITION", 409);
  }
  requirement.status = "complete";
  requirement.completedAt = now;
  requirement.completedBy = actorId;
  requirement.failureReason = undefined;
  requirement.evidenceArtifactIds.push(artifact.id);
  record.evidenceArtifacts.push(artifact);
}

function syntheticArtifact(
  record: AuthorityRecord,
  requirementKey: string,
  actorId: string,
  options: ApplyOptions,
): EvidenceArtifact {
  const requirement = record.requirements.find((entry) => entry.key === requirementKey);
  if (!requirement) fail("That policy requirement does not exist.", "INVALID_COMMAND", 400);
  const fieldsByRequirement: Record<string, string[]> = {
    principal_identity: ["identity_match"],
    representative_acceptance: ["acceptance_attestation"],
    power_of_attorney_document: [
      "principal_name",
      "representative_name",
      "effective_terms",
      "powers",
      "execution_pages",
    ],
    agent_certification: ["agent_attestation", "instrument_currentness_attestation"],
    representative_identity: ["identity_match"],
    current_address: ["address_match", "document_recency"],
  };
  const isDocument = requirementKey === "power_of_attorney_document";
  return {
    id: `evidence_${options.eventId}`,
    requirementKey,
    label: requirement.label,
    method: requirement.acceptedMethods[0] ?? "synthetic_check",
    provider: "Passage controlled sandbox",
    providerReference: `sandbox_${actorId}_${options.sequence}`,
    result: isDocument ? "review_required" : "verified",
    sourceNote: isDocument
      ? "Illustrative document received and organized for institution review. Passage has not issued a legal opinion."
      : "Completed with controlled sample data; no external provider was contacted.",
    disclosedFields: fieldsByRequirement[requirementKey] ?? ["requirement_result"],
    findings: isDocument
      ? [
          {
            key: "principal_name",
            label: "Person granting authority",
            value: record.principal.name,
            sourceLocator: "Page 1",
            reviewStatus: "observed",
          },
          {
            key: "representative_name",
            label: "Representative",
            value: record.representative.name,
            sourceLocator: "Page 1",
            reviewStatus: "observed",
          },
          {
            key: "effective_terms",
            label: "Effective terms",
            value: "Effective immediately",
            sourceLocator: "Page 2",
            reviewStatus: "needs_review",
          },
          {
            key: "banking_powers",
            label: "Relevant banking powers",
            value: "Statements and account-service matters",
            sourceLocator: "Page 2",
            reviewStatus: "needs_review",
          },
          {
            key: "execution_pages",
            label: "Execution pages",
            value: "Signature and acknowledgment present",
            sourceLocator: "Page 4",
            reviewStatus: "needs_review",
          },
        ]
      : undefined,
    collectedAt: options.now,
  };
}

function allRequiredRequirementsComplete(record: AuthorityRecord) {
  return record.requirements.filter((entry) => entry.required).every((entry) => entry.status === "complete");
}

export function nextOwnerFor(status: AuthorityRecord["status"]): ActorRole | "complete" {
  if (status === "awaiting_principal") return "principal";
  if (
    status === "awaiting_representative" ||
    status === "evidence_required" ||
    status === "ready_to_submit" ||
    status === "information_requested"
  ) {
    return "representative";
  }
  if (status === "under_review") return "reviewer";
  return "complete";
}

export function applyAuthorityCommand(
  current: AuthorityRecord,
  command: AuthorityCommand,
  options: ApplyOptions,
): { record: AuthorityRecord; event: AuthorityEvent } {
  if (current.version !== command.expectedVersion) {
    fail("This request changed in another session. Refresh before acting.", "STALE_VERSION", 409);
  }
  assertActor(current, command);

  const record = structuredClone(current);
  let eventType = "";
  let summary = "";
  let detail = "";
  let audience: ActorRole[] = ["principal", "representative", "reviewer"];

  switch (command.type) {
    case "confirm_grant": {
      requireRole(command, "principal");
      requireStatus(record, ["awaiting_principal"]);
      if (!command.acknowledged) {
        fail("Confirm that you understand the allowed and prohibited actions.", "INVALID_COMMAND", 400);
      }
      completeRequirement(
        record,
        "principal_identity",
        command.actorId,
        syntheticArtifact(record, "principal_identity", command.actorId, options),
        options.now,
      );
      record.consentSnapshots.push({
        id: `consent_${options.eventId}`,
        kind: "authority_grant",
        actorId: command.actorId,
        textVersion: "limited-mandate-grant-v1",
        purpose: record.purpose,
        recipient: record.relyingParty.name,
        disclosures: [
          ...record.allowedActions.map((action) => `allow:${action.key}`),
          ...record.prohibitedActions.map((action) => `prohibit:${action.key}`),
        ],
        recordedAt: options.now,
      });
      record.status = "awaiting_representative";
      record.principalConfirmedAt = options.now;
      eventType = "principal.confirmed";
      summary = `${record.principal.name} confirmed the authority request`;
      detail = `${record.representative.name} may now review the requested permissions, provide the authority instrument, and accept or decline the responsibility.`;
      break;
    }
    case "accept_responsibility": {
      requireRole(command, "representative");
      requireStatus(record, ["awaiting_representative"]);
      if (!command.acknowledged) {
        fail("Confirm that you understand the responsibility and limits.", "INVALID_COMMAND", 400);
      }
      completeRequirement(
        record,
        "representative_acceptance",
        command.actorId,
        syntheticArtifact(record, "representative_acceptance", command.actorId, options),
        options.now,
      );
      record.status = allRequiredRequirementsComplete(record) ? "ready_to_submit" : "evidence_required";
      record.representativeAcceptedAt = options.now;
      eventType = "representative.accepted";
      summary = `${record.representative.name} accepted the responsibility`;
      detail = "The remaining policy requirements can now be completed.";
      break;
    }
    case "decline_responsibility": {
      requireRole(command, "representative");
      requireStatus(record, ["awaiting_representative"]);
      requireText(command.reason, "Explain why you are declining this request.");
      if (!command.acknowledged) fail("Confirm that you intend to decline this request.", "INVALID_COMMAND", 400);
      record.status = "declined";
      record.representativeDeclinedAt = options.now;
      record.endedReason = command.reason.trim();
      record.authoritySource.status = "ended";
      eventType = "representative.declined";
      summary = `${record.representative.name} declined the responsibility`;
      detail = command.reason.trim();
      break;
    }
    case "withdraw_responsibility": {
      requireRole(command, "representative");
      requireStatus(record, [
        "evidence_required",
        "ready_to_submit",
        "under_review",
        "information_requested",
        "accepted",
        "accepted_with_limits",
      ]);
      requireText(command.reason, "Explain why you are withdrawing.");
      if (!command.acknowledged) fail("Confirm that you intend to withdraw.", "INVALID_COMMAND", 400);
      record.status = "withdrawn";
      record.representativeWithdrawnAt = options.now;
      record.endedReason = command.reason.trim();
      record.authoritySource.status = "ended";
      eventType = "representative.withdrawn";
      summary = `${record.representative.name} withdrew from the authority`;
      detail = command.reason.trim();
      break;
    }
    case "complete_requirement": {
      requireRole(command, "representative");
      requireStatus(record, ["evidence_required"]);
      const requirement = record.requirements.find((entry) => entry.key === command.requirementKey);
      if (!requirement) fail("That policy requirement does not exist.", "INVALID_COMMAND", 400);
      if (requirement.owner !== "representative") {
        fail("That requirement belongs to another participant.", "UNAUTHORIZED_ACTOR", 403);
      }
      if (record.sandboxScenario === "identity_mismatch" && command.requirementKey === "representative_identity") {
        const artifact = syntheticArtifact(record, command.requirementKey, command.actorId, options);
        artifact.result = "failed";
        artifact.sourceNote = "The sample identity result did not match the invited representative.";
        requirement.status = "failed";
        requirement.failureReason = "The sample identity result did not match the invited representative.";
        requirement.evidenceArtifactIds.push(artifact.id);
        record.evidenceArtifacts.push(artifact);
        record.status = "evidence_required";
        eventType = "requirement.failed";
        summary = `${requirement.label} needs attention`;
        detail = requirement.failureReason;
        audience = ["representative", "reviewer"];
        break;
      }
      const artifact = syntheticArtifact(record, command.requirementKey, command.actorId, options);
      completeRequirement(record, command.requirementKey, command.actorId, artifact, options.now);
      if (command.requirementKey === "power_of_attorney_document") {
        record.authoritySource.status = "active";
      }
      record.status = allRequiredRequirementsComplete(record) ? "ready_to_submit" : "evidence_required";
      eventType = "requirement.completed";
      summary = `${requirement.label} completed`;
      detail = allRequiredRequirementsComplete(record)
        ? "All required evidence is ready. The representative can review and submit the minimum-necessary packet."
        : "The saved result is visible to the reviewer; additional requirements remain.";
      audience = ["representative", "reviewer"];
      break;
    }
    case "submit_record": {
      requireRole(command, "representative");
      requireStatus(record, ["ready_to_submit"]);
      if (!command.consented) {
        fail("Confirm that the listed evidence may be shared with the relying party.", "INVALID_COMMAND", 400);
      }
      const disclosedFields = [...new Set(record.evidenceArtifacts.flatMap((artifact) => artifact.disclosedFields))];
      const evidenceArtifactIds = record.evidenceArtifacts.map((artifact) => artifact.id);
      record.consentSnapshots.push({
        id: `consent_${options.eventId}`,
        kind: "evidence_disclosure",
        actorId: command.actorId,
        textVersion: "minimum-necessary-disclosure-v1",
        purpose: record.purpose,
        recipient: record.relyingParty.name,
        disclosures: disclosedFields,
        recordedAt: options.now,
      });
      record.disclosures.push({
        id: `disclosure_${options.eventId}`,
        recipient: record.relyingParty.name,
        purpose: record.purpose,
        evidenceArtifactIds,
        disclosedFields,
        createdAt: options.now,
      });
      record.status = "under_review";
      record.submittedAt = options.now;
      eventType = "assessment.submitted";
      summary = `${record.representative.name} submitted the authority request`;
      detail = `${record.relyingParty.name} can now review ${record.requirements.length} policy requirements and the minimum-necessary disclosure receipt.`;
      break;
    }
    case "request_information": {
      requireRole(command, "reviewer");
      requireStatus(record, ["under_review"]);
      requireText(command.message, "Explain what information is still needed.");
      const requirement = record.requirements.find((entry) => entry.key === command.requirementKey);
      if (!requirement) fail("Choose a valid policy requirement.", "INVALID_COMMAND", 400);
      record.status = "information_requested";
      record.informationRequest = {
        id: `rfi_${options.eventId}`,
        requirementKey: requirement.key,
        message: command.message.trim(),
        requestedAt: options.now,
        requestedBy: command.actorId,
        status: "open",
      };
      eventType = "review.information_requested";
      summary = `The reviewer requested more information about ${requirement.label.toLowerCase()}`;
      detail = command.message.trim();
      break;
    }
    case "resolve_information": {
      requireRole(command, "representative");
      requireStatus(record, ["information_requested"]);
      requireText(command.response, "Describe how the request was resolved.");
      if (!record.informationRequest || record.informationRequest.status !== "open") {
        fail("There is no open information request to resolve.", "INVALID_TRANSITION", 409);
      }
      record.informationRequest.status = "resolved";
      record.informationRequest.response = command.response.trim();
      record.informationRequest.resolvedAt = options.now;
      record.evidenceArtifacts.push({
        id: `evidence_${options.eventId}`,
        requirementKey: record.informationRequest.requirementKey,
        label: "Supplemental reviewer response",
        method: "representative_response",
        provider: "Passage controlled sandbox",
        providerReference: `sandbox_response_${options.sequence}`,
        result: "review_required",
        sourceNote: command.response.trim(),
        disclosedFields: ["supplemental_response"],
        collectedAt: options.now,
      });
      record.status = "under_review";
      eventType = "review.information_resolved";
      summary = `${record.representative.name} answered the reviewer's request`;
      detail = command.response.trim();
      break;
    }
    case "record_decision": {
      requireRole(command, "reviewer");
      requireStatus(record, ["under_review"]);
      requireText(command.reason, "Record the reason for the decision.");
      if (!command.acknowledged) {
        fail("Confirm that this decision will become part of the authority receipt.", "INVALID_COMMAND", 400);
      }
      if (command.outcome === "accepted_with_limits" && command.limitations.length === 0) {
        fail("List at least one limitation for a limited acceptance.", "INVALID_COMMAND", 400);
      }
      record.status = command.outcome;
      record.decision = {
        outcome: command.outcome,
        reason: command.reason.trim(),
        limitations: command.limitations.map((item) => item.trim()).filter(Boolean),
        acceptedActionKeys: command.outcome === "rejected" ? [] : record.allowedActions.map((action) => action.key),
        decidedAt: options.now,
        decidedBy: command.actorId,
        policyVersionId: record.policy.id,
        validUntil: record.validUntil,
      };
      eventType = `decision.${command.outcome}`;
      summary =
        command.outcome === "accepted"
          ? "The institution accepted the request"
          : command.outcome === "accepted_with_limits"
            ? "The institution accepted the request with limits"
            : "The institution declined the request";
      detail = command.reason.trim();
      break;
    }
    case "revoke_authority": {
      requireRole(command, "principal");
      requireStatus(record, [
        "awaiting_representative",
        "evidence_required",
        "ready_to_submit",
        "under_review",
        "information_requested",
        "accepted",
        "accepted_with_limits",
      ]);
      requireText(command.reason, "Record why this authority is being revoked.");
      if (!command.acknowledged) {
        fail("Confirm that you intend to revoke this authority.", "INVALID_COMMAND", 400);
      }
      record.status = "revoked";
      record.revokedAt = options.now;
      record.revokedBy = command.actorId;
      record.endedReason = command.reason.trim();
      record.authoritySource.status = "ended";
      eventType = "authority_record.revoked";
      summary = `${record.principal.name} revoked the authority`;
      detail = command.reason.trim();
      break;
    }
  }

  record.version += 1;
  record.updatedAt = options.now;
  const nextOwner = nextOwnerFor(record.status);

  return {
    record,
    event: {
      id: options.eventId,
      authorityRecordId: record.id,
      sequence: options.sequence,
      type: eventType,
      actorId: command.actorId,
      actorRole: command.actorRole,
      summary,
      detail,
      audience,
      nextOwner,
      createdAt: options.now,
      recordVersion: record.version,
    },
  };
}
