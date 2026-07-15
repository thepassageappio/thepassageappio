export type TransferPassStatus = 'issued' | 'accepted' | 'revoked';
export type CommitmentStatus = 'assigned' | 'in_progress' | 'proof_submitted';
export type OrganizationId = 'northstar';
export type LocationId = 'northstar-portland' | 'northstar-beaverton';
export type WorkspaceLocationId = 'all' | LocationId;
export type MembershipId = 'membership-elena' | 'membership-marcus' | 'membership-avery';

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

export type SandboxEventKind =
  | 'transfer_pass_issued'
  | 'transfer_pass_inspected'
  | 'transfer_pass_accepted'
  | 'case_routed'
  | 'workspace_context_changed'
  | 'commitment_reassigned'
  | 'transfer_pass_revoked'
  | 'commitment_started'
  | 'proof_submitted'
  | 'sandbox_reset';

export type SandboxEvent = {
  id: string;
  idempotencyKey: string;
  kind: SandboxEventKind;
  occurredAt: string;
  actor: SandboxActor;
  purpose: string;
  caseId: 'NS-2051';
  organizationId: OrganizationId;
  locationId?: LocationId;
  authorityId?: 'authority-ns-2051-accountable';
  assignmentId?: 'assignment-ns-2051-arrangement';
  commitmentId?: 'confirm-arrangement-meeting';
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
  schemaVersion: 2;
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
  workspaceContext: {
    directorLocationId: WorkspaceLocationId;
    staffLocationId: 'northstar-portland';
    staffMembershipId: 'membership-marcus';
  };
  person: { id: 'sofia-rivera'; name: 'Sofia Rivera' };
  familyCoordinator: SandboxActor & { id: 'maya-rivera' };
  transferPass: {
    code: 'PASS-RIVERA-7K4M';
    status: TransferPassStatus;
    expiresLabel: string;
    acceptedAt?: string;
    acceptedBy?: string;
    scope: { name: string; detail: string }[];
  };
  case: {
    id: 'NS-2051';
    organizationId: OrganizationId;
    operatingLocationId: LocationId;
    authorityId: 'authority-ns-2051-accountable';
    accountableMembershipId: MembershipId;
    status: 'intake' | 'arrangements';
    source: 'family_transfer_pass';
  };
  commitment: {
    id: 'confirm-arrangement-meeting';
    assignmentId: 'assignment-ns-2051-arrangement';
    assignedMembershipId: MembershipId;
    title: string;
    status: CommitmentStatus;
    waitingParty: string;
    proofRequirement: string;
    proof?: { label: string; submittedAt: string; submittedBy: string };
    nextOwnerMembershipId: MembershipId;
  };
  events: SandboxEvent[];
};

export type SandboxCommand =
  | { type: 'issue_transfer_pass'; idempotencyKey: string; actorId: 'maya-rivera'; scope: { name: string; detail: string }[]; expiresLabel: string }
  | { type: 'inspect_transfer_pass'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId }
  | { type: 'accept_transfer_pass'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId }
  | { type: 'route_intake'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; locationId: LocationId; accountableMembershipId: MembershipId; assigneeMembershipId: MembershipId }
  | { type: 'set_director_workspace'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; locationId: WorkspaceLocationId }
  | { type: 'reassign_commitment'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; assigneeMembershipId: MembershipId; reason: string }
  | { type: 'start_commitment'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId }
  | { type: 'submit_proof'; idempotencyKey: string; actorId: SandboxActor['id']; actorMembershipId: MembershipId; label?: string }
  | { type: 'revoke_transfer_pass'; idempotencyKey: string; actorId: 'maya-rivera' }
  | { type: 'reset_sandbox' };
