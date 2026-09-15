import { hostedDecisionLabel } from "./hosted-decisions.ts";
import type { ParticipantDecisionReceipt } from "./participant-receipt.ts";
import type {
  OrientationArtifact,
  OrientationChipState,
  OrientationModel,
  OrientationPrimaryAction,
  OrientationRequirement,
} from "./orientation-strip.ts";

function requirementByKey(requirements: OrientationRequirement[], key: string) {
  return requirements.find((item) => item.requirement_key === key) ?? null;
}

function chipStateForRequirement(
  requirement: OrientationRequirement | null,
  artifacts: OrientationArtifact[],
): OrientationChipState {
  if (!requirement) return "Not started";
  if (requirement.status === "completed") return "Done";
  const artifact = artifacts.find((item) => String(item.requirement_id) === String(requirement.id));
  if (artifact || requirement.status === "review_pending" || requirement.status === "needs_attention") {
    return "Needed";
  }
  return "Not started";
}

/** Participant receipt OrientationStrip model (session-facing). */
export function buildParticipantReceiptOrientation(input: {
  authorityRecordId: string;
  receipt: ParticipantDecisionReceipt;
  requirements?: OrientationRequirement[];
  artifacts?: OrientationArtifact[];
  originGroupId?: string | null;
}): OrientationModel {
  const receipt = input.receipt;
  const requirements = input.requirements ?? [];
  const artifacts = input.artifacts ?? [];
  const decisionSinceChanged = ["revoked", "expired", "withdrawn"].includes(receipt.currentStatus);
  const laterChangeDetail = decisionSinceChanged
    ? (receipt.lifecycleSummary
      ?? (receipt.currentStatus === "revoked"
        ? "ended"
        : receipt.currentStatus === "expired"
          ? "expired"
          : receipt.currentStatus === "withdrawn"
            ? "the representative withdrew"
            : "updated"))
    : null;

  const statusSentence = decisionSinceChanged
    ? "The bank's answer changed later."
    : receipt.outcome === "accepted"
      ? "The bank accepted this request."
      : receipt.outcome === "accepted_with_limits"
        ? "The bank accepted this with limits."
        : "The bank said no to this request.";

  let currencyLabel = "This is the current answer.";
  let currencyKind: OrientationModel["currencyKind"] = "current";
  if (decisionSinceChanged) {
    currencyLabel = "A later change was recorded.";
    currencyKind = "later_change";
  }

  let decisionLine: string;
  if (receipt.outcome === "accepted_with_limits") {
    const limits = receipt.limitations.slice(0, 2).join("; ");
    decisionLine = limits ? `Accepted with limits: ${limits}.` : "Accepted with limits.";
  } else if (receipt.outcome === "rejected") {
    const reason = receipt.reason.trim().slice(0, 120);
    decisionLine = reason ? `Rejected: ${reason}.` : "Rejected.";
  } else {
    decisionLine = `${hostedDecisionLabel(receipt.outcome)}.`;
  }
  if (decisionSinceChanged && laterChangeDetail) {
    decisionLine = `${decisionLine} Later: ${laterChangeDetail}.`;
  }

  const overviewHref = `/request/${encodeURIComponent(input.authorityRecordId)}/overview`;
  const primaryAction: OrientationPrimaryAction = {
    href: overviewHref,
    label: decisionSinceChanged ? "See what changed" : "Back to request summary",
  };

  const identity = requirementByKey(requirements, "identity_evidence");
  const authorityDoc = requirementByKey(requirements, "power_of_attorney");
  const certification = requirementByKey(requirements, "representative_certification");
  const whoState = chipStateForRequirement(identity, artifacts);
  const authorityRequirements = [authorityDoc, certification].filter(Boolean) as OrientationRequirement[];
  let authorityState: OrientationChipState = "Not started";
  if (!authorityRequirements.length) {
    authorityState = receipt.requestedActionKeys.length ? "Done" : "Not started";
  } else if (authorityRequirements.every((item) => item.status === "completed")) {
    authorityState = "Done";
  } else if (
    authorityRequirements.some((item) => item.status === "review_pending" || item.status === "needs_attention")
    || authorityRequirements.some((item) => artifacts.some((artifact) => String(artifact.requirement_id) === String(item.id)))
  ) {
    authorityState = "Needed";
  }

  const bankState: OrientationChipState = decisionSinceChanged ? "Needed" : "Done";

  return {
    statusSentence,
    nextLine: decisionSinceChanged
      ? `Next: ${receipt.participantName} — see what changed`
      : `Next: ${receipt.participantName} — return to request summary`,
    primaryAction,
    secondaryAction: null,
    decisionLine,
    currencyLabel,
    currencyKind,
    laterChangeDetail,
    chips: [
      { label: "Who they are", state: whoState },
      { label: "What they may ask for", state: authorityState },
      { label: "Bank's answer", state: bankState },
    ],
    multiInstitutionLine: input.originGroupId
      ? "This request is one of several banks this family asked. Your bank's answer is only for your bank."
      : null,
  };
}
