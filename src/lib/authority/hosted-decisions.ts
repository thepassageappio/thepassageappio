import { AuthorityError } from "./errors.ts";
import type { HostedActionKey, HostedAuthorityStatus } from "./hosted-records.ts";

export type HostedDecisionOutcome = "accepted" | "accepted_with_limits" | "rejected";
export type HostedLifecycleAction = "revoke" | "expire";

export type HostedInstitutionDecision = {
  id: string;
  receiptCode: string;
  authorityRecordId: string;
  recordVersion: number;
  outcome: HostedDecisionOutcome;
  reason: string;
  acceptedActionKeys: HostedActionKey[];
  limitations: string[];
  decidedBy: string;
  decidedByRole: string;
  decidedAt: string;
  receiptSha256: string;
  receiptSnapshot: Record<string, unknown>;
};

type DecisionRow = {
  id: string;
  receipt_code: string;
  authority_record_id: string;
  record_version: number | string;
  outcome: HostedDecisionOutcome;
  reason: string;
  accepted_action_keys: string[];
  limitations: string[];
  decided_by: string;
  decided_by_role: string;
  decided_at: string;
  receipt_sha256: string;
  receipt_snapshot: Record<string, unknown>;
};

function invalid(message: string): never {
  throw new AuthorityError(message, "INVALID_COMMAND", 400);
}

function normalizedLines(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function prepareHostedInstitutionDecision(input: {
  outcome: string;
  reason: string;
  acceptedActionKeys: string[];
  limitations: string[];
  acknowledged: boolean;
}) {
  const reason = input.reason.trim();
  const acceptedActionKeys = normalizedLines(input.acceptedActionKeys);
  const limitations = normalizedLines(input.limitations);
  if (!input.acknowledged) invalid("Confirm that this is the institution's decision for this request.");
  if (!["accepted", "accepted_with_limits", "rejected"].includes(input.outcome)) {
    invalid("Choose an available institution decision.");
  }
  if (reason.length < 3 || reason.length > 500) {
    invalid("Record a clear decision reason using 3 to 500 characters.");
  }
  if (acceptedActionKeys.some((key) => !["receive_duplicate_statements", "discuss_service_issues"].includes(key))) {
    invalid("Choose only actions included in this authority workflow.");
  }
  if (input.outcome === "rejected" && acceptedActionKeys.length > 0) {
    invalid("A rejected request cannot include accepted actions.");
  }
  if (input.outcome !== "rejected" && acceptedActionKeys.length === 0) {
    invalid("Choose at least one action the institution accepts.");
  }
  if (limitations.length > 10 || limitations.some((item) => item.length > 240)) {
    invalid("Use no more than 10 limits, with 240 characters or fewer for each limit.");
  }
  if (input.outcome === "accepted_with_limits" && limitations.length === 0) {
    invalid("List at least one limit for a limited acceptance.");
  }
  if (input.outcome !== "accepted_with_limits" && limitations.length > 0) {
    invalid("Limits can be recorded only when the institution accepts with limits.");
  }
  return {
    outcome: input.outcome as HostedDecisionOutcome,
    reason,
    acceptedActionKeys: acceptedActionKeys as HostedActionKey[],
    limitations,
  };
}

export function prepareHostedLifecycleChange(input: {
  action: string;
  reason: string;
  acknowledged: boolean;
  currentStatus: HostedAuthorityStatus;
  validUntil: string;
  now?: Date;
}) {
  if (input.action !== "revoke" && input.action !== "expire") {
    invalid("Choose an available lifecycle action.");
  }
  if (input.currentStatus !== "accepted" && input.currentStatus !== "accepted_with_limits") {
    invalid("Lifecycle changes are available only after an accepted institution decision.");
  }
  if (!input.acknowledged) invalid("Confirm that this lifecycle change should be saved to the receipt.");
  const now = input.now ?? new Date();
  if (input.action === "expire" && new Date(input.validUntil) > now) {
    invalid("This request has not reached its recorded end date.");
  }
  const reason = input.action === "expire" ? "The recorded request end date was reached." : input.reason.trim();
  if (reason.length < 3 || reason.length > 500) {
    invalid("Record a clear revocation reason using 3 to 500 characters.");
  }
  return { action: input.action as HostedLifecycleAction, reason };
}

export function mapHostedInstitutionDecision(row: DecisionRow): HostedInstitutionDecision {
  return {
    id: String(row.id),
    receiptCode: String(row.receipt_code),
    authorityRecordId: String(row.authority_record_id),
    recordVersion: Number(row.record_version),
    outcome: row.outcome,
    reason: String(row.reason),
    acceptedActionKeys: row.accepted_action_keys as HostedActionKey[],
    limitations: row.limitations.map(String),
    decidedBy: String(row.decided_by),
    decidedByRole: String(row.decided_by_role),
    decidedAt: String(row.decided_at),
    receiptSha256: String(row.receipt_sha256),
    receiptSnapshot: row.receipt_snapshot ?? {},
  };
}

export function hostedDecisionLabel(outcome: HostedDecisionOutcome) {
  if (outcome === "accepted_with_limits") return "Accepted with limits";
  if (outcome === "accepted") return "Accepted";
  return "Not accepted";
}
