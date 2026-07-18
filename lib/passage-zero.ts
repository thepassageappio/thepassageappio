export { applySandboxCommand as reducePassageZero, createCanonicalSandbox as createPassageZeroSeed, readSandbox, SANDBOX_STORAGE_KEY, writeSandbox } from './sandbox/repository';
export type { SandboxActor, SandboxCommand as PassageZeroCommand, SandboxEvent, SandboxRecord as PassageZeroState } from './sandbox/types';

import type { SandboxRecord } from './sandbox/types';

export const selectFamilyStatus = (state: SandboxRecord) => ({
  passStatus: state.transferPass.status,
  caseAccepted: state.transferPass.status === 'accepted',
  update: state.commitment.status === 'proof_submitted'
    ? 'The arrangement meeting is confirmed. Northstar is reviewing the saved confirmation.'
    : state.commitment.status === 'in_progress'
      ? 'Northstar is coordinating the arrangement meeting now.'
      : state.transferPass.status === 'accepted'
        ? 'Northstar received the handoff and assigned the next step.'
        : 'Your handoff is ready for Northstar.',
});

export const selectStaffCommitment = (state: SandboxRecord) => state.commitment;

export const selectDirectorFocus = (state: SandboxRecord) => ({
  ...state.commitment,
  caseId: state.case.id,
  person: state.person.name,
  family: 'Rivera',
  proofAwaitingReview: state.commitment.status === 'proof_submitted',
});
