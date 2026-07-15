export type TransferPassStatus = 'issued' | 'accepted' | 'revoked';
export type CommitmentStatus = 'assigned' | 'in_progress' | 'proof_submitted';

export type SandboxActor = {
  id: 'maya-rivera' | 'elena-torres' | 'marcus-lee' | 'passage-system';
  name: string;
  role: string;
};

export type SandboxEventKind =
  | 'transfer_pass_issued'
  | 'transfer_pass_inspected'
  | 'transfer_pass_accepted'
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
  commitmentId?: 'confirm-arrangement-meeting';
  audience: 'family_and_case_team' | 'case_team' | 'director';
  summary: string;
  waitingParty: string;
  proof: string;
  nextOwner: string;
  previousState: string;
  nextState: string;
};

export type SandboxRecord = {
  schemaVersion: 1;
  organization: { id: 'northstar'; name: 'Northstar'; };
  location: { id: 'northstar-portland'; name: 'Northstar · Portland'; };
  person: { id: 'sofia-rivera'; name: 'Sofia Rivera'; };
  familyCoordinator: SandboxActor & { id: 'maya-rivera' };
  accountableDirector: SandboxActor & { id: 'elena-torres' };
  assignedOperator: SandboxActor & { id: 'marcus-lee' };
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
    status: 'intake' | 'arrangements';
    source: 'family_transfer_pass';
  };
  commitment: {
    id: 'confirm-arrangement-meeting';
    title: string;
    status: CommitmentStatus;
    owner: string;
    waitingParty: string;
    proofRequirement: string;
    proof?: { label: string; submittedAt: string; submittedBy: string };
    nextOwner: string;
  };
  events: SandboxEvent[];
};

export type SandboxCommand =
  | { type: 'issue_transfer_pass'; idempotencyKey: string; scope: { name: string; detail: string }[]; expiresLabel: string }
  | { type: 'inspect_transfer_pass'; idempotencyKey: string }
  | { type: 'accept_transfer_pass'; idempotencyKey: string }
  | { type: 'start_commitment'; idempotencyKey: string }
  | { type: 'submit_proof'; idempotencyKey: string; label?: string }
  | { type: 'revoke_transfer_pass'; idempotencyKey: string }
  | { type: 'reset_sandbox' };
