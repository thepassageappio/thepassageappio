export type TransferPassStatus = 'issued' | 'accepted' | 'revoked';
export type CommitmentStatus = 'assigned' | 'in_progress' | 'proof_submitted';
export type OrganizationId = 'northstar';
export type LocationId = 'northstar-portland' | 'northstar-beaverton';
export type WorkspaceLocationId = 'all' | LocationId;
export type MembershipId = 'membership-elena' | 'membership-marcus' | 'membership-avery';
export type CaseId = 'NS-2051' | 'NS-2048' | 'NS-2039' | 'NS-2053' | 'NS-2056';
export type CommitmentId = 'confirm-arrangement-meeting' | 'confirm-receiving-location' | 'resolve-benefits-document' | 'approve-keepsake-artwork' | 'confirm-service-accessibility';

export type SandboxActor = {
  id: 'maya-rivera' | 'elena-torres' | 'marcus-lee' | 'avery-brooks' | 'passage-system';
  name: string;
  role: string;
};

export type SandboxMembership = {
  id: MembershipId;
  organizationId: OrganizationId;
  actor: SandboxActor;
  role: 'director' | 'care_coordinator';
  locationScope: 'organization' | LocationId;
  active: boolean;
};

export type SandboxCase = {
  id: CaseId;
  family: string;
  personName: string;
  organizationId: OrganizationId;
  operatingLocationId: LocationId;
  authorityId: string;
  accountableMembershipId: MembershipId;
  status: 'intake' | 'arrangements';
  source: 'family_transfer_pass' | 'provider_handoff' | 'manual_intake';
  phase: string;
};

export type PreparedOutput = {
  kind: 'family_draft' | 'internal_draft' | 'automatic_internal_receipt';
  eyebrow: string;
  audience: string;
  automationLabel: string;
  boundaryLabel: string;
  body: string;
  cta?: string;
  helper: string;
  reviewReady: boolean;
  sentExternally: false;
};

export type SandboxCommitment = {
  id: CommitmentId;
  caseId: CaseId;
  assignmentId: string;
  assignedMembershipId: MembershipId | null;
  title: string;
  status: CommitmentStatus;
  waitingParty: string;
  due: string;
  blocker: string;
  proofRequirement: string;
  proof?: { label: string; submittedAt: string; submittedBy: string };
  nextOwnerMembershipId: MembershipId | null;
  output?: PreparedOutput;
};

export type SandboxEventKind =
  | 'transfer_pass_issued' | 'transfer_pass_inspected' | 'transfer_pass_accepted'
  | 'case_routed' | 'workspace_context_changed' | 'staff_identity_changed'
  | 'commitment_reassigned' | 'transfer_pass_revoked' | 'commitment_started'
  | 'proof_submitted' | 'output_review_ready' | 'sandbox_reset';

export type SandboxEvent = {
  id: string;
  idempotencyKey: string;
  kind: SandboxEventKind;
  occurredAt: string;
  actor: SandboxActor;
  purpose: string;
  caseId: CaseId;
  organizationId: OrganizationId;
  locationId?: LocationId;
  authorityId?: string;
  assignmentId?: string;
  commitmentId?: CommitmentId;
  audience: 'family_and_case_team' | 'case_team' | 'director';
  summary: string;
  waitingParty: string;
  proof: string;
  nextOwner: string;
  previousState: string;
  nextState: string;
  reason?: string;
};

export type SandboxRecord = {
  schemaVersion: 3;
  organizations: [{ id: OrganizationId; name: 'Northstar Funeral Home' }];
  locations: [
    { id: 'northstar-portland'; organizationId: OrganizationId; name: 'Portland'; active: true },
    { id: 'northstar-beaverton'; organizationId: OrganizationId; name: 'Beaverton'; active: true },
  ];
  memberships: SandboxMembership[];
  routingRules: [
    { id: 'route-portland-intake'; organizationId: OrganizationId; locationId: 'northstar-portland'; accountableMembershipId: 'membership-elena'; firstAssigneeMembershipId: 'membership-marcus'; active: true },
    { id: 'route-beaverton-intake'; organizationId: OrganizationId; locationId: 'northstar-beaverton'; accountableMembershipId: 'membership-elena'; firstAssigneeMembershipId: 'membership-avery'; active: true },
  ];
  workspaceContext: { directorLocationId: WorkspaceLocationId; staffLocationId: LocationId; staffMembershipId: MembershipId };
  person: { id: 'sofia-rivera'; name: 'Sofia Rivera' };
  familyCoordinator: SandboxActor & { id: 'maya-rivera' };
  transferPass: { code: 'PASS-RIVERA-7K4M'; status: TransferPassStatus; expiresLabel: string; acceptedAt?: string; acceptedBy?: string; scope: { name: string; detail: string }[] };
  cases: SandboxCase[];
  commitments: SandboxCommitment[];
  /** Canonical Rivera aliases retained so family and intake access stay unchanged. */
  case: SandboxCase & { id: 'NS-2051' };
  commitment: SandboxCommitment & { id: 'confirm-arrangement-meeting'; caseId: 'NS-2051'; assignedMembershipId: MembershipId };
  events: SandboxEvent[];
};

export type SandboxCommand =
  | { type: 'issue_transfer_pass'; idempotencyKey: string; actorId: 'maya-rivera'; scope: { name: string; detail: string }[]; expiresLabel: string }
  | { type: 'inspect_transfer_pass'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId }
  | { type: 'accept_transfer_pass'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId }
  | { type: 'route_intake'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; locationId: LocationId; accountableMembershipId: MembershipId; assigneeMembershipId: MembershipId }
  | { type: 'set_director_workspace'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; locationId: WorkspaceLocationId }
  | { type: 'set_staff_identity'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId }
  | { type: 'reassign_commitment'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; commitmentId?: CommitmentId; assigneeMembershipId: MembershipId; reason: string }
  | { type: 'start_commitment'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; commitmentId?: CommitmentId }
  | { type: 'mark_output_review_ready'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; commitmentId: CommitmentId }
  | { type: 'submit_proof'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; commitmentId?: CommitmentId; label?: string }
  | { type: 'revoke_transfer_pass'; idempotencyKey: string; actorId: 'maya-rivera' }
  | { type: 'reset_sandbox' };
