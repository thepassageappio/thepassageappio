import { AuthorityError } from "./errors.ts";

export const HOSTED_ACTIONS = {
  receive_duplicate_statements: "Receive duplicate monthly statements",
  discuss_service_issues: "Discuss account-service issues",
} as const;

export type HostedActionKey = keyof typeof HOSTED_ACTIONS;
export type HostedAuthorityStatus =
  | "draft"
  | "awaiting_principal"
  | "awaiting_representative"
  | "evidence_required"
  | "ready_to_submit"
  | "under_review"
  | "information_requested"
  | "accepted"
  | "accepted_with_limits"
  | "rejected"
  | "declined"
  | "withdrawn"
  | "revoked"
  | "expired"
  | "canceled";

export type HostedAuthorityRecord = {
  id: string;
  referenceCode: string;
  organizationId: string;
  createdBy: string;
  version: number;
  status: HostedAuthorityStatus;
  templateKey: string;
  templateVersion: string;
  purpose: string;
  accountBoundary: string;
  principalName: string;
  principalEmail: string;
  representativeName: string;
  representativeEmail: string;
  allowedActionKeys: HostedActionKey[];
  validUntil: string;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HostedAuthorityEvent = {
  eventId: string;
  authorityRecordId: string;
  sequence: number;
  eventType: string;
  summary: string;
  detail: string;
  occurredAt: string;
};

export type HostedAuthorityDraftInput = {
  principalName: string;
  principalEmail: string;
  representativeName: string;
  representativeEmail: string;
  accountBoundary: string;
  validUntil: string;
  allowedActionKeys: string[];
};

type HostedAuthorityRecordRow = {
  id: string;
  reference_code: string;
  organization_id: string;
  created_by: string;
  version: number | string;
  status: HostedAuthorityStatus;
  template_key: string;
  template_version: string;
  purpose: string;
  account_boundary: string;
  principal_name: string;
  principal_email_normalized: string;
  representative_name: string;
  representative_email_normalized: string;
  allowed_action_keys: string[];
  valid_until: string;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
};

type HostedAuthorityEventRow = {
  event_id: string;
  authority_record_id: string;
  sequence: number | string;
  event_type: string;
  summary: string;
  detail: string;
  occurred_at: string;
};

function invalid(message: string): never {
  throw new AuthorityError(message, "INVALID_COMMAND", 400);
}

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

export function prepareHostedAuthorityDraft(
  input: HostedAuthorityDraftInput,
  now = new Date(),
): HostedAuthorityDraftInput & { allowedActionKeys: HostedActionKey[] } {
  const principalName = input.principalName.trim();
  const representativeName = input.representativeName.trim();
  const principalEmail = normalizedEmail(input.principalEmail);
  const representativeEmail = normalizedEmail(input.representativeEmail);
  const accountBoundary = input.accountBoundary.trim();
  const validUntil = new Date(input.validUntil);
  const allowedActionKeys = [...new Set(input.allowedActionKeys)] as HostedActionKey[];
  const supported = new Set(Object.keys(HOSTED_ACTIONS));

  if (principalName.length < 2 || representativeName.length < 2) {
    invalid("Enter the full name of each person.");
  }
  if (!principalEmail.includes("@") || !representativeEmail.includes("@")) {
    invalid("Enter a valid email address for each person.");
  }
  if (principalEmail === representativeEmail) {
    invalid("The person granting authority and the representative need a different email address.");
  }
  if (accountBoundary.length < 3) {
    invalid("Describe the account or relationship covered by this request.");
  }
  if (Number.isNaN(validUntil.getTime()) || validUntil <= now) {
    invalid("Choose a future request end date.");
  }
  if (allowedActionKeys.length === 0) {
    invalid("Choose at least one permitted action.");
  }
  if (allowedActionKeys.some((key) => !supported.has(key))) {
    invalid("One of the requested actions is not supported by this template.");
  }

  return {
    principalName,
    principalEmail,
    representativeName,
    representativeEmail,
    accountBoundary,
    validUntil: validUntil.toISOString(),
    allowedActionKeys,
  };
}

export function mapHostedAuthorityRecord(row: HostedAuthorityRecordRow): HostedAuthorityRecord {
  return {
    id: String(row.id),
    referenceCode: String(row.reference_code),
    organizationId: String(row.organization_id),
    createdBy: String(row.created_by),
    version: Number(row.version),
    status: row.status,
    templateKey: String(row.template_key),
    templateVersion: String(row.template_version),
    purpose: String(row.purpose),
    accountBoundary: String(row.account_boundary),
    principalName: String(row.principal_name),
    principalEmail: String(row.principal_email_normalized),
    representativeName: String(row.representative_name),
    representativeEmail: String(row.representative_email_normalized),
    allowedActionKeys: row.allowed_action_keys as HostedActionKey[],
    validUntil: String(row.valid_until),
    activatedAt: row.activated_at ? String(row.activated_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapHostedAuthorityEvent(row: HostedAuthorityEventRow): HostedAuthorityEvent {
  return {
    eventId: String(row.event_id),
    authorityRecordId: String(row.authority_record_id),
    sequence: Number(row.sequence),
    eventType: String(row.event_type),
    summary: String(row.summary),
    detail: String(row.detail),
    occurredAt: String(row.occurred_at),
  };
}

export function hostedStatusLabel(status: HostedAuthorityStatus) {
  const labels: Record<HostedAuthorityStatus, string> = {
    draft: "Draft",
    awaiting_principal: "Waiting on person granting authority",
    awaiting_representative: "Waiting on representative",
    evidence_required: "Evidence in progress",
    ready_to_submit: "Ready to submit",
    under_review: "Needs review",
    information_requested: "Information requested",
    accepted: "Accepted",
    accepted_with_limits: "Accepted with limits",
    rejected: "Rejected",
    declined: "Request declined",
    withdrawn: "Representative withdrew",
    revoked: "Revoked",
    expired: "Expired",
    canceled: "Canceled",
  };
  return labels[status];
}
