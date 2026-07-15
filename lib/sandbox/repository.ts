import type { SandboxActor, SandboxCommand, SandboxEvent, SandboxRecord } from './types';

export const SANDBOX_STORAGE_KEY = 'passage.zero.operational-truth.v1';
const FIXTURE_TIME = '2026-07-15T15:42:00.000Z';

const MAYA: SandboxActor & { id: 'maya-rivera' } = { id: 'maya-rivera', name: 'Maya Rivera', role: 'Family coordinator' };
const ELENA: SandboxActor & { id: 'elena-torres' } = { id: 'elena-torres', name: 'Elena Torres', role: 'Accountable director' };
const MARCUS: SandboxActor & { id: 'marcus-lee' } = { id: 'marcus-lee', name: 'Marcus Lee', role: 'Assigned operator' };
const SYSTEM: SandboxActor = { id: 'passage-system', name: 'Passage', role: 'Workflow system' };

export function createCanonicalSandbox(): SandboxRecord {
  return {
    schemaVersion: 1,
    organization: { id: 'northstar', name: 'Northstar' },
    location: { id: 'northstar-portland', name: 'Northstar · Portland' },
    person: { id: 'sofia-rivera', name: 'Sofia Rivera' },
    familyCoordinator: MAYA,
    accountableDirector: ELENA,
    assignedOperator: MARCUS,
    transferPass: {
      code: 'PASS-RIVERA-7K4M', status: 'issued', expiresLabel: 'Today · 14:30',
      scope: [
        { name: 'Approved family contacts', detail: 'Maya Rivera + 2 approved contacts' },
        { name: 'Service preferences', detail: 'Ceremony, music, access needs' },
        { name: 'Transfer details', detail: 'Receiving location + timing window' },
        { name: 'Selected documents', detail: '3 family-approved documents' },
      ],
    },
    case: { id: 'NS-2051', status: 'intake', source: 'family_transfer_pass' },
    commitment: {
      id: 'confirm-arrangement-meeting', title: 'Confirm the arrangement meeting with Maya Rivera.',
      status: 'assigned', owner: MARCUS.name, waitingParty: MAYA.name,
      proofRequirement: 'Meeting time + family acknowledgment', nextOwner: MARCUS.name,
    },
    events: [{
      id: 'evt-pass-issued', idempotencyKey: 'fixture:pass-issued', kind: 'transfer_pass_issued',
      occurredAt: FIXTURE_TIME, actor: MAYA, audience: 'family_and_case_team',
      purpose: 'Share a bounded family handoff', caseId: 'NS-2051',
      summary: 'Maya prepared a single-use handoff for Northstar · Portland.', waitingParty: 'Northstar · Portland',
      proof: 'Consent scope saved to PASS-RIVERA-7K4M', nextOwner: ELENA.name,
      previousState: 'draft', nextState: 'issued',
    }],
  };
}

function event(record: SandboxRecord, input: Omit<SandboxEvent, 'id' | 'occurredAt'>): SandboxRecord {
  if (record.events.some((item) => item.idempotencyKey === input.idempotencyKey)) return record;
  const next: SandboxEvent = {
    ...input,
    id: `evt-${record.events.length + 1}-${input.kind}`,
    occurredAt: new Date().toISOString(),
  };
  return { ...record, events: [...record.events, next] };
}

export function applySandboxCommand(record: SandboxRecord, command: SandboxCommand): SandboxRecord {
  if (command.type === 'reset_sandbox') return createCanonicalSandbox();
  if (record.events.some((item) => item.idempotencyKey === command.idempotencyKey)) return record;

  if (command.type === 'issue_transfer_pass') {
    const seeded = createCanonicalSandbox();
    const issued = {
      ...seeded,
      transferPass: { ...seeded.transferPass, scope: command.scope, expiresLabel: command.expiresLabel },
      events: [] as SandboxEvent[],
    };
    return event(issued, {
      idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_issued', actor: MAYA,
      purpose: 'Share a bounded family handoff', caseId: issued.case.id,
      audience: 'family_and_case_team', summary: `Maya prepared ${command.scope.length} approved categories for Northstar.`,
      waitingParty: ELENA.name, proof: `Consent scope saved to ${issued.transferPass.code}`, nextOwner: ELENA.name,
      previousState: record.transferPass.status, nextState: 'issued',
    });
  }

  if (command.type === 'inspect_transfer_pass') {
    if (record.transferPass.status !== 'issued') return record;
    return event(record, {
      idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_inspected', actor: ELENA,
      purpose: 'Review the family-approved handoff boundary', caseId: record.case.id,
      audience: 'case_team', summary: 'Elena inspected the sender, scope, expiry, and destination.',
      waitingParty: ELENA.name, proof: 'Inspection event recorded; no case change', nextOwner: ELENA.name,
      previousState: 'issued', nextState: 'inspected',
    });
  }

  if (command.type === 'accept_transfer_pass') {
    if (record.transferPass.status !== 'issued') return record;
    const occurredAt = new Date().toISOString();
    const updated = {
      ...record,
      transferPass: { ...record.transferPass, status: 'accepted' as const, acceptedAt: occurredAt, acceptedBy: ELENA.name },
      case: { ...record.case, status: 'arrangements' as const },
    };
    return event(updated, {
      idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_accepted', actor: ELENA,
      purpose: 'Accept the bounded handoff into the operating case', caseId: record.case.id,
      commitmentId: record.commitment.id,
      audience: 'family_and_case_team', summary: 'Northstar accepted the family handoff into NS-2051.',
      waitingParty: MARCUS.name, proof: 'Acceptance receipt saved to NS-2051', nextOwner: MARCUS.name,
      previousState: 'issued', nextState: 'accepted',
    });
  }

  if (command.type === 'revoke_transfer_pass') {
    if (record.transferPass.status !== 'issued') return record;
    const updated = { ...record, transferPass: { ...record.transferPass, status: 'revoked' as const } };
    return event(updated, {
      idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_revoked', actor: MAYA,
      purpose: 'Close family-granted access before acceptance', caseId: record.case.id,
      audience: 'family_and_case_team', summary: 'Maya closed the family handoff before acceptance.',
      waitingParty: 'Nobody', proof: 'Revocation recorded', nextOwner: MAYA.name,
      previousState: 'issued', nextState: 'revoked',
    });
  }

  if (command.type === 'start_commitment') {
    if (record.transferPass.status !== 'accepted' || record.commitment.status !== 'assigned') return record;
    const updated = { ...record, commitment: { ...record.commitment, status: 'in_progress' as const } };
    return event(updated, {
      idempotencyKey: command.idempotencyKey, kind: 'commitment_started', actor: MARCUS,
      purpose: 'Begin the assigned arrangement commitment', caseId: record.case.id,
      commitmentId: record.commitment.id,
      audience: 'case_team', summary: 'Marcus started the arrangement-meeting commitment.',
      waitingParty: MAYA.name, proof: 'Start time recorded on the commitment', nextOwner: MARCUS.name,
      previousState: 'assigned', nextState: 'in_progress',
    });
  }

  if (record.transferPass.status !== 'accepted' || record.commitment.status === 'proof_submitted') return record;
  const submittedAt = new Date().toISOString();
  const proofLabel = command.label?.trim() || 'Meeting time confirmed with Maya Rivera';
  const updated = {
    ...record,
    commitment: {
      ...record.commitment, status: 'proof_submitted' as const, proof: { label: proofLabel, submittedAt, submittedBy: MARCUS.name },
      nextOwner: ELENA.name,
    },
  };
  return event(updated, {
    idempotencyKey: command.idempotencyKey, kind: 'proof_submitted', actor: MARCUS,
    purpose: 'Return completion proof for director review', caseId: record.case.id,
    commitmentId: record.commitment.id,
    audience: 'family_and_case_team', summary: 'The arrangement meeting was confirmed and proof was returned.',
    waitingParty: ELENA.name, proof: proofLabel, nextOwner: ELENA.name,
    previousState: record.commitment.status, nextState: 'proof_submitted',
  });
}

export function readSandbox(storage: Pick<Storage, 'getItem'>): SandboxRecord {
  try {
    const raw = storage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) return createCanonicalSandbox();
    const parsed = JSON.parse(raw) as SandboxRecord;
    return parsed.schemaVersion === 1 && parsed.transferPass?.code === 'PASS-RIVERA-7K4M' ? parsed : createCanonicalSandbox();
  } catch {
    return createCanonicalSandbox();
  }
}

export function writeSandbox(storage: Pick<Storage, 'setItem'>, record: SandboxRecord) {
  storage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(record));
}
