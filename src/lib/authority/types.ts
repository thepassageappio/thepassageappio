export type ActorRole = "principal" | "representative" | "reviewer" | "system";

export type AuthorityStatus =
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
  | "expired";

export type SandboxScenario =
  | "standard"
  | "rfi_then_limited"
  | "representative_declines"
  | "identity_mismatch"
  | "webhook_retry"
  | "revoked_after_acceptance";

export type Party = {
  id: string;
  name: string;
  email: string;
  role: ActorRole;
  organization?: string;
};

export type OrganizationRef = {
  id: string;
  name: string;
  slug: string;
};

export type AuthoritySource = {
  id: string;
  type: "financial_power_of_attorney";
  label: string;
  instrumentName: string;
  instrumentVersion: string;
  issuerOrganizationId?: string;
  jurisdiction: string;
  executionMode: "external_instrument";
  status: "proposed" | "active" | "ended";
};

export type ScopeAction = {
  key: string;
  label: string;
  description: string;
  riskTier: 0 | 1 | 2 | 3 | 4;
  category: "contact" | "disclosure" | "service" | "transaction" | "ownership";
};

export type RequirementOwner = "principal" | "representative" | "reviewer";
export type RequirementStatus = "needed" | "complete" | "failed" | "waived";

export type PolicyRequirementDefinition = {
  key: string;
  label: string;
  description: string;
  reason: string;
  owner: RequirementOwner;
  required: boolean;
  acceptedMethods: string[];
};

export type PolicyVersionSnapshot = {
  id: string;
  label: string;
  version: string;
  jurisdiction: string;
  effectiveAt: string;
  status: "sandbox" | "active" | "retired";
  requirements: PolicyRequirementDefinition[];
};

export type AuthorityRequirement = PolicyRequirementDefinition & {
  status: RequirementStatus;
  completedAt?: string;
  completedBy?: string;
  evidenceArtifactIds: string[];
  failureReason?: string;
};

export type EvidenceArtifact = {
  id: string;
  requirementKey: string;
  label: string;
  method: string;
  provider: string;
  providerReference: string;
  result: "verified" | "failed" | "review_required";
  sourceNote: string;
  disclosedFields: string[];
  findings?: EvidenceFinding[];
  collectedAt: string;
};

export type EvidenceFinding = {
  key: string;
  label: string;
  value: string;
  sourceLocator: string;
  reviewStatus: "observed" | "needs_review";
};

export type ConsentSnapshot = {
  id: string;
  kind: "authority_grant" | "evidence_disclosure";
  actorId: string;
  textVersion: string;
  purpose: string;
  recipient: string;
  disclosures: string[];
  recordedAt: string;
};

export type DisclosureReceipt = {
  id: string;
  recipient: string;
  purpose: string;
  evidenceArtifactIds: string[];
  disclosedFields: string[];
  createdAt: string;
};

export type InformationRequest = {
  id: string;
  requirementKey: string;
  message: string;
  requestedAt: string;
  requestedBy: string;
  status: "open" | "resolved";
  response?: string;
  resolvedAt?: string;
};

export type AuthorityDecision = {
  outcome: "accepted" | "accepted_with_limits" | "rejected";
  reason: string;
  limitations: string[];
  acceptedActionKeys: string[];
  decidedAt: string;
  decidedBy: string;
  policyVersionId: string;
  validUntil: string;
};

export type AuthorityRecord = {
  id: string;
  version: number;
  status: AuthorityStatus;
  purpose: string;
  accountBoundary: string;
  principal: Party;
  representative: Party;
  reviewer: Party;
  relyingParty: OrganizationRef;
  authoritySource: AuthoritySource;
  policy: PolicyVersionSnapshot;
  validUntil: string;
  allowedActions: ScopeAction[];
  prohibitedActions: ScopeAction[];
  requirements: AuthorityRequirement[];
  evidenceArtifacts: EvidenceArtifact[];
  consentSnapshots: ConsentSnapshot[];
  disclosures: DisclosureReceipt[];
  sandboxScenario: SandboxScenario;
  principalConfirmedAt?: string;
  representativeAcceptedAt?: string;
  representativeDeclinedAt?: string;
  representativeWithdrawnAt?: string;
  submittedAt?: string;
  informationRequest?: InformationRequest;
  decision?: AuthorityDecision;
  revokedAt?: string;
  revokedBy?: string;
  endedReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthorityEvent = {
  id: string;
  authorityRecordId: string;
  sequence: number;
  type: string;
  actorId: string;
  actorRole: ActorRole;
  summary: string;
  detail: string;
  audience: ActorRole[];
  nextOwner: ActorRole | "complete";
  createdAt: string;
  recordVersion: number;
};

export type WebhookDelivery = {
  id: string;
  authorityRecordId: string;
  eventId: string;
  eventType: string;
  endpoint: string;
  status: "pending" | "delivered" | "retrying" | "failed";
  attempts: number;
  responseCode?: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  signature: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AuthorityRecordSummary = {
  id: string;
  status: AuthorityStatus;
  principalName: string;
  representativeName: string;
  sourceLabel: string;
  actionLabel: string;
  policyVersion: string;
  nextOwner: ActorRole | "complete";
  scenario: SandboxScenario;
  createdAt: string;
  updatedAt: string;
};

type CommandBase = {
  actorId: string;
  actorRole: ActorRole;
  expectedVersion: number;
  idempotencyKey: string;
};

export type AuthorityCommand =
  | (CommandBase & { type: "confirm_grant"; acknowledged: boolean })
  | (CommandBase & { type: "accept_responsibility"; acknowledged: boolean })
  | (CommandBase & { type: "decline_responsibility"; reason: string; acknowledged: boolean })
  | (CommandBase & { type: "withdraw_responsibility"; reason: string; acknowledged: boolean })
  | (CommandBase & { type: "complete_requirement"; requirementKey: string })
  | (CommandBase & { type: "submit_record"; consented: boolean })
  | (CommandBase & { type: "request_information"; requirementKey: string; message: string })
  | (CommandBase & { type: "resolve_information"; response: string })
  | (CommandBase & {
      type: "record_decision";
      outcome: "accepted" | "accepted_with_limits" | "rejected";
      reason: string;
      limitations: string[];
      acknowledged: boolean;
    })
  | (CommandBase & { type: "revoke_authority"; reason: string; acknowledged: boolean });

export type CommandResult = {
  record: AuthorityRecord;
  event: AuthorityEvent;
  webhookDelivery: WebhookDelivery;
  requestId: string;
  replayed: boolean;
};

export type AuthorityRecordView = AuthorityRecord & {
  events: AuthorityEvent[];
};

export type AuthorityRequestInput = {
  principalName: string;
  principalEmail: string;
  representativeName: string;
  representativeEmail: string;
  accountBoundary: string;
  validUntil: string;
  allowedActionKeys: string[];
};
