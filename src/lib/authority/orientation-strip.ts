import type { OrganizationRole } from "./access.ts";
import type { HostedDecisionOutcome, HostedInstitutionDecision } from "./hosted-decisions.ts";
import { hostedDecisionLabel } from "./hosted-decisions.ts";
import type { HostedAuthorityRecord, HostedAuthorityStatus } from "./hosted-records.ts";
import { canCoordinateAuthorityRequests, canRecordAuthorityDecision } from "./role-capabilities.ts";

export type OrientationChipState = "Done" | "Needed" | "Not started" | "Sample only" | "Ended";

export type OrientationChip = {
  label: "Who they are" | "What they may ask for" | "Bank's answer";
  state: OrientationChipState;
};

export type OrientationPrimaryAction = {
  href: string;
  label: string;
};

export type OrientationSecondaryAction = {
  href: string;
  label: string;
};

export type OrientationModel = {
  statusSentence: string;
  nextLine: string;
  primaryAction: OrientationPrimaryAction | null;
  secondaryAction: OrientationSecondaryAction | null;
  decisionLine: string;
  currencyLabel: string;
  currencyKind: "current" | "later_change" | "no_decision";
  laterChangeDetail: string | null;
  chips: OrientationChip[];
  multiInstitutionLine: string | null;
};

export type OrientationRequirement = {
  id: string;
  requirement_key: string;
  title: string;
  status: string;
};

export type OrientationArtifact = {
  id: string;
  requirement_id: string;
  review_status: string;
};

function requirementByKey(requirements: OrientationRequirement[], key: string) {
  return requirements.find((item) => item.requirement_key === key) ?? null;
}

function chipStateForRequirement(
  requirement: OrientationRequirement | null,
  artifacts: OrientationArtifact[],
  options: { sampleOnly?: boolean } = {},
): OrientationChipState {
  if (!requirement) return options.sampleOnly ? "Sample only" : "Not started";
  if (requirement.status === "completed") return "Done";
  if (options.sampleOnly) return "Sample only";
  const artifact = artifacts.find((item) => String(item.requirement_id) === String(requirement.id));
  if (artifact || requirement.status === "review_pending" || requirement.status === "needs_attention") {
    return "Needed";
  }
  return "Not started";
}

function bankAnswerChip(decision: HostedInstitutionDecision | null, decisionSinceChanged: boolean): OrientationChipState {
  if (!decision) return "Not started";
  if (decisionSinceChanged) return "Ended";
  return "Done";
}


function withSingleTerminalPeriod(sentence: string): string {
  const trimmed = sentence.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return `${trimmed.replace(/[.。]+$/u, "")}.`;
}

/** Map short status tokens (and caller overrides) to Design-locked Later copy. */
function laterChangeLine(_status: HostedAuthorityStatus, override: string | null | undefined): string {
  const raw = (override ?? "").trim();
  const token = raw.toLowerCase();
  // Callers historically passed short tokens ("ended", "expired", "the representative withdrew").
  // Design lock: one clear Later sentence — never jam into Decision.
  if (!raw || ["ended", "expired", "updated"].includes(token) || token.includes("withdrew")) {
    return "This answer ended. It is not the current answer.";
  }
  return withSingleTerminalPeriod(raw).replace(/\.$/u, "");
}

function nextActorLine(input: {
  record: HostedAuthorityRecord;
  decision: HostedInstitutionDecision | null;
  decisionSinceChanged: boolean;
  hasAskedFor: boolean;
  requirementsComplete: boolean;
  bankReviewPending: boolean;
  staffDisplayName?: string | null;
}): string {
  const { record, decision, decisionSinceChanged, hasAskedFor, requirementsComplete, bankReviewPending } = input;
  if (bankReviewPending) {
    return "Next: Bank reviewer — check the received files.";
  }
  if (decisionSinceChanged) {
    return "Next: Anyone on this request — open the receipt to see what changed.";
  }
  if (decision) {
    return "Next: Anyone on this request — open the receipt.";
  }
  if (!hasAskedFor) {
    return "Next: Your bank team — pick at least one thing to ask for.";
  }
  if (record.status === "draft") {
    const name = (input.staffDisplayName ?? "").trim();
    if (name) {
      return `Next: ${name} (bank staff) — check the emails, then send this request.`;
    }
    return "Next: Your bank team — check the emails, then send this request.";
  }
  if (record.status === "awaiting_principal") {
    return `Next: ${record.principalName} (account holder) — confirm this request.`;
  }
  if (["awaiting_representative", "evidence_required", "ready_to_submit", "information_requested"].includes(record.status)) {
    return `Next: ${record.representativeName} (representative) — finish their steps.`;
  }
  if (record.status === "under_review") {
    const ask = requirementsComplete ? "review and decide." : "finish the missing list.";
    return `Next: Bank reviewer (reviewer) — ${ask}`;
  }
  return "Next: Anyone on this request — open the receipt.";
}

function statusSentenceFor(
  record: HostedAuthorityRecord,
  decision: HostedInstitutionDecision | null,
  decisionSinceChanged: boolean,
): string {
  if (decisionSinceChanged) return "The bank's answer changed later.";
  switch (record.status) {
    case "draft":
      return "This request is not sent yet.";
    case "awaiting_principal":
      return `Waiting for ${record.principalName} to confirm.`;
    case "awaiting_representative":
    case "evidence_required":
    case "ready_to_submit":
    case "information_requested":
      return `Waiting for ${record.representativeName} to finish their steps.`;
    case "under_review":
      return "The bank can decide now.";
    case "accepted":
      return "The bank accepted this request.";
    case "accepted_with_limits":
      return "The bank accepted this with limits.";
    case "rejected":
      return "The bank said no to this request.";
    case "canceled":
      return "This request was canceled.";
    case "withdrawn":
      return "This request was withdrawn.";
    case "declined":
      return "Someone said no to this request.";
    case "revoked":
      return "A later change ended this answer.";
    case "expired":
      return "This request reached its end date.";
    default:
      return "This request was updated.";
  }
}

function decisionLineFor(decision: HostedInstitutionDecision | null): string {
  if (!decision) return "Not decided yet.";
  const outcome = hostedDecisionLabel(decision.outcome as HostedDecisionOutcome);
  if (decision.outcome === "accepted_with_limits") {
    const limits = decision.limitations
      .slice(0, 2)
      .map((item) => item.replace(/\s+/g, " ").trim().replace(/[.。]+$/u, ""))
      .filter(Boolean)
      .join("; ");
    if (!limits) return "Accepted with limits.";
    return withSingleTerminalPeriod(`Accepted with limits: ${limits}`);
  }
  if (decision.outcome === "rejected") {
    const reason = decision.reason.trim().slice(0, 120);
    if (!reason) return "Rejected.";
    return withSingleTerminalPeriod(`Rejected: ${reason}`);
  }
  return withSingleTerminalPeriod(outcome);
}

export function participantBankOnlyLinkLine(bankName: string | null | undefined): string | null {
  const name = typeof bankName === "string" ? bankName.trim() : "";
  return name ? `This link is only for ${name}.` : null;
}

function primaryActionFor(input: {
  record: HostedAuthorityRecord;
  role: OrganizationRole | null;
  decision: HostedInstitutionDecision | null;
  decisionSinceChanged: boolean;
  requirementsComplete: boolean;
  checklistEmpty: boolean;
  canCoordinate: boolean;
  canRecordDecision: boolean;
}): OrientationPrimaryAction | null {
  const {
    record,
    decision,
    decisionSinceChanged,
    requirementsComplete,
    checklistEmpty,
    canCoordinate,
    canRecordDecision,
  } = input;
  const receiptHref = `/app/requests/${record.id}/receipt`;
  const hasAskedFor = record.allowedActionKeys.length > 0;

  if (decisionSinceChanged) {
    return { href: `${receiptHref}#changes-after-decision`, label: "See what changed" };
  }
  if (record.status === "canceled") {
    return { href: receiptHref, label: "Open receipt" };
  }
  if (decision) {
    return { href: receiptHref, label: "Open receipt" };
  }
  if (["declined", "withdrawn", "expired", "revoked"].includes(record.status)) {
    return null;
  }
  if (record.status === "draft" && canCoordinate) {
    if (!hasAskedFor) {
      return { href: "#what-they-may-ask-for", label: "Pick at least one thing to ask for." };
    }
    return { href: "#review-and-send", label: "Send request" };
  }
  if (record.status === "awaiting_principal" && canCoordinate) {
    return { href: "#participant-access", label: "Resend their link" };
  }
  if (
    ["awaiting_representative", "evidence_required", "ready_to_submit", "information_requested"].includes(record.status)
    && canCoordinate
  ) {
    return { href: "#participant-access", label: "Resend their link" };
  }
  if (record.status === "under_review" && canRecordDecision) {
    // Empty checklist has no #documents-and-checks strip, send reviewers to the decision panel.
    if (checklistEmpty || requirementsComplete) {
      if (checklistEmpty && !hasAskedFor) {
        return { href: "#what-they-may-ask-for", label: "Pick at least one thing to ask for." };
      }
      return { href: "#institution-decision", label: "Review and decide" };
    }
    return { href: "#documents-and-checks", label: "Review and decide" };
  }
  return null;
}

export function buildCaseOrientation(input: {
  record: HostedAuthorityRecord;
  role: OrganizationRole | null;
  decision: HostedInstitutionDecision | null;
  requirements?: OrientationRequirement[];
  artifacts?: OrientationArtifact[];
  sampleOnly?: boolean;
  laterChangeDetail?: string | null;
}): OrientationModel {
  const requirements = input.requirements ?? [];
  const artifacts = input.artifacts ?? [];
  const decisionSinceChanged = Boolean(input.decision) && ["revoked", "expired", "withdrawn"].includes(input.record.status);
  const laterChangeDetail = decisionSinceChanged
    ? laterChangeLine(input.record.status, input.laterChangeDetail)
    : null;

  const canCoordinate = Boolean(input.role && canCoordinateAuthorityRequests(input.role));
  const canRecordDecision = Boolean(input.role && canRecordAuthorityDecision(input.role));
  const checklistEmpty = requirements.length === 0;
  // Empty checklist means there is no documents strip to finish, decision panel is reachable.
  const requirementsComplete = checklistEmpty || requirements.every((item) => item.status === "completed");
  const pendingRequirements = requirements.filter((item) => item.status !== "completed");
  const bankReviewPending = input.record.status === "evidence_required"
    && pendingRequirements.length > 0
    && pendingRequirements.every((item) => artifacts.some((artifact) =>
      String(artifact.requirement_id) === String(item.id) && artifact.review_status === "pending"));
  const hasAskedFor = input.record.allowedActionKeys.length > 0;

  const identity = requirementByKey(requirements, "identity_evidence");
  const authorityDoc = requirementByKey(requirements, "power_of_attorney");
  const certification = requirementByKey(requirements, "representative_certification");

  const whoState = chipStateForRequirement(identity, artifacts, { sampleOnly: input.sampleOnly });
  const authorityRequirements = [authorityDoc, certification].filter(Boolean) as OrientationRequirement[];
  let authorityState: OrientationChipState = "Not started";
  if (!authorityRequirements.length) {
    // Never mark Done from action keys alone when the checklist is empty.
    if (checklistEmpty) {
      authorityState = hasAskedFor ? "Not started" : "Needed";
    } else {
      authorityState = hasAskedFor ? "Done" : "Not started";
    }
  } else if (authorityRequirements.every((item) => item.status === "completed")) {
    authorityState = "Done";
  } else if (input.sampleOnly) {
    authorityState = "Sample only";
  } else if (
    authorityRequirements.some((item) => item.status === "review_pending" || item.status === "needs_attention")
    || authorityRequirements.some((item) => artifacts.some((artifact) => String(artifact.requirement_id) === String(item.id)))
  ) {
    authorityState = "Needed";
  } else {
    authorityState = "Not started";
  }

  const statusSentence = statusSentenceFor(input.record, input.decision, decisionSinceChanged);

  let currencyLabel = "No decision yet.";
  let currencyKind: OrientationModel["currencyKind"] = "no_decision";
  if (decisionSinceChanged) {
    currencyLabel = "A later change was recorded.";
    currencyKind = "later_change";
  } else if (input.decision) {
    currencyLabel = "This is the current answer.";
    currencyKind = "current";
  }

  const nextLine = nextActorLine({
    record: input.record,
    decision: input.decision,
    decisionSinceChanged,
    hasAskedFor,
    requirementsComplete,
    bankReviewPending,
  });

  return {
    statusSentence: bankReviewPending ? "The bank needs to check the received files." : statusSentence,
    nextLine,
    primaryAction: bankReviewPending ? { href: "#required-information", label: "Review received files" } : primaryActionFor({
      record: input.record,
      role: input.role,
      decision: input.decision,
      decisionSinceChanged,
      requirementsComplete,
      checklistEmpty,
      canCoordinate,
      canRecordDecision,
    }),
    secondaryAction: input.record.status === "draft" && canCoordinate
      ? { href: "#contact-details", label: "Change emails" }
      : null,
    decisionLine: decisionLineFor(input.decision),
    currencyLabel,
    currencyKind,
    laterChangeDetail,
    chips: [
      { label: "Who they are", state: whoState },
      { label: "What they may ask for", state: authorityState },
      { label: "Bank's answer", state: bankAnswerChip(input.decision, decisionSinceChanged) },
    ],
    multiInstitutionLine: input.record.originGroupId
      ? "This request is one of several banks this family asked. Your bank's answer is only for your bank."
      : null,
  };
}

export type DocumentReviewItem = {
  id: string;
  title: string;
  whoMustFix: string;
  kind: "missing" | "checked" | "received";
};

export type DocumentReviewModel = {
  missing: DocumentReviewItem[];
  checked: DocumentReviewItem[];
  ready: boolean;
  readyLabel: string;
};

export function buildDocumentReviewModel(input: {
  requirements: OrientationRequirement[];
  artifacts: OrientationArtifact[];
  recordStatus: HostedAuthorityStatus;
  hasDecision: boolean;
}): DocumentReviewModel | null {
  if (!input.requirements.length) return null;

  const missing: DocumentReviewItem[] = [];
  const checked: DocumentReviewItem[] = [];

  for (const requirement of input.requirements) {
    const artifact = input.artifacts.find((item) => String(item.requirement_id) === String(requirement.id));
    if (requirement.status === "completed") {
      checked.push({
        id: String(requirement.id),
        title: requirement.title,
        whoMustFix: requirement.requirement_key === "representative_certification"
          ? "Confirmed by the representative"
          : "Checked by the bank",
        kind: "checked",
      });
      continue;
    }
    if (artifact && artifact.review_status === "pending") {
      missing.push({
        id: String(requirement.id),
        title: `${requirement.title}, Received, not checked yet`,
        whoMustFix: "Bank reviewer",
        kind: "received",
      });
      continue;
    }
    const who = requirement.requirement_key === "identity_evidence" || requirement.requirement_key === "power_of_attorney"
      || requirement.requirement_key === "representative_certification"
      ? "Representative"
      : "Someone on this request";
    missing.push({
      id: String(requirement.id),
      title: requirement.title,
      whoMustFix: who,
      kind: "missing",
    });
  }

  const ready = missing.length === 0 && !input.hasDecision && input.recordStatus === "under_review";
  return {
    missing,
    checked,
    ready,
    readyLabel: ready ? "Yes" : input.hasDecision ? "Decision already saved" : "Not yet, finish the missing list.",
  };
}
