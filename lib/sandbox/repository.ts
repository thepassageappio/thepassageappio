import type { LocationId, MembershipId, SandboxActor, SandboxCommand, SandboxEvent, SandboxMembership, SandboxRecord } from './types';

export const SANDBOX_STORAGE_KEY = 'passage.zero.operational-truth.v2';
export const LEGACY_SANDBOX_STORAGE_KEY = 'passage.zero.operational-truth.v1';
const FIXTURE_TIME = '2026-07-15T15:42:00.000Z';
const MAYA: SandboxActor & { id: 'maya-rivera' } = { id: 'maya-rivera', name: 'Maya Rivera', role: 'Family coordinator' };
const ELENA: SandboxActor = { id: 'elena-torres', name: 'Elena Torres', role: 'Accountable director' };
const MARCUS: SandboxActor = { id: 'marcus-lee', name: 'Marcus Lee', role: 'Care coordinator' };
const AVERY: SandboxActor = { id: 'avery-brooks', name: 'Avery Brooks', role: 'Care coordinator' };

export const membership = (record: SandboxRecord, id: MembershipId) => record.memberships.find((item) => item.id === id)!;
export const location = (record: SandboxRecord, id: LocationId) => record.locations.find((item) => item.id === id)!;
export const membershipCanWorkAt = (item: SandboxMembership, locationId: LocationId) => item.active && (item.locationScope === 'organization' || item.locationScope === locationId);
export const eligibleMemberships = (record: SandboxRecord, locationId: LocationId) => record.memberships.filter((item) => membershipCanWorkAt(item, locationId));
const actingMembership = (record: SandboxRecord, actorId: SandboxActor['id'], membershipId: MembershipId) => {
  const item = record.memberships.find((candidate) => candidate.id === membershipId);
  return item?.active && item.actor.id === actorId ? item : null;
};
const eligibleDirector = (record: SandboxRecord, actorId: SandboxActor['id'], membershipId: MembershipId, locationId: LocationId) => {
  const item = actingMembership(record, actorId, membershipId);
  return item?.role === 'director' && membershipCanWorkAt(item, locationId) ? item : null;
};

export function validateIntakeRoute(record: SandboxRecord, locationId: LocationId, accountableId: MembershipId, assigneeId: MembershipId) {
  const destination = record.locations.find((item) => item.id === locationId);
  const accountable = record.memberships.find((item) => item.id === accountableId);
  const assignee = record.memberships.find((item) => item.id === assigneeId);
  if (!destination?.active) return 'Choose an active operating location.';
  if (!accountable || accountable.role !== 'director' || !membershipCanWorkAt(accountable, locationId)) return 'The accountable director is inactive or outside this location.';
  if (!assignee || !membershipCanWorkAt(assignee, locationId)) return 'The first assignee is inactive or outside this location.';
  return null;
}

export function validateReassignment(record: SandboxRecord, assigneeId: MembershipId, reason: string) {
  if (record.transferPass.status !== 'accepted' || record.case.status !== 'arrangements') return 'Accept and route the handoff before changing its assignment.';
  if (!reason.trim()) return 'Add a reason for the reassignment.';
  const assignee = record.memberships.find((item) => item.id === assigneeId);
  if (!assignee || !membershipCanWorkAt(assignee, record.case.operatingLocationId)) return 'Choose an active team member authorized for this case location.';
  if (assignee.id === record.commitment.assignedMembershipId) return 'Choose a different team member.';
  return null;
}

export function createCanonicalSandbox(): SandboxRecord {
  return {
    schemaVersion: 2,
    organizations: [{ id: 'northstar', name: 'Northstar Funeral Home' }],
    locations: [
      { id: 'northstar-portland', organizationId: 'northstar', name: 'Portland', active: true },
      { id: 'northstar-beaverton', organizationId: 'northstar', name: 'Beaverton', active: true },
    ],
    memberships: [
      { id: 'membership-elena', organizationId: 'northstar', actor: ELENA, role: 'director', locationScope: 'organization', active: true },
      { id: 'membership-marcus', organizationId: 'northstar', actor: MARCUS, role: 'care_coordinator', locationScope: 'northstar-portland', active: true },
      { id: 'membership-avery', organizationId: 'northstar', actor: AVERY, role: 'care_coordinator', locationScope: 'northstar-beaverton', active: true },
    ],
    routingRules: [
      { id: 'route-portland-intake', organizationId: 'northstar', locationId: 'northstar-portland', accountableMembershipId: 'membership-elena', firstAssigneeMembershipId: 'membership-marcus', active: true },
      { id: 'route-beaverton-intake', organizationId: 'northstar', locationId: 'northstar-beaverton', accountableMembershipId: 'membership-elena', firstAssigneeMembershipId: 'membership-avery', active: true },
    ],
    workspaceContext: { directorLocationId: 'all', staffLocationId: 'northstar-portland', staffMembershipId: 'membership-marcus' },
    person: { id: 'sofia-rivera', name: 'Sofia Rivera' }, familyCoordinator: MAYA,
    transferPass: { code: 'PASS-RIVERA-7K4M', status: 'issued', expiresLabel: 'Today · 14:30', scope: [
      { name: 'Approved family contacts', detail: 'Maya Rivera + 2 approved contacts' }, { name: 'Service preferences', detail: 'Ceremony, music, access needs' },
      { name: 'Transfer details', detail: 'Receiving location + timing window' }, { name: 'Selected documents', detail: '3 family-approved documents' },
    ] },
    case: { id: 'NS-2051', organizationId: 'northstar', operatingLocationId: 'northstar-portland', authorityId: 'authority-ns-2051-accountable', accountableMembershipId: 'membership-elena', status: 'intake', source: 'family_transfer_pass' },
    commitment: { id: 'confirm-arrangement-meeting', assignmentId: 'assignment-ns-2051-arrangement', assignedMembershipId: 'membership-marcus', title: 'Confirm the arrangement meeting with Maya Rivera.', status: 'assigned', waitingParty: MAYA.name, proofRequirement: 'Meeting time + family acknowledgment', nextOwnerMembershipId: 'membership-marcus' },
    events: [{ id: 'evt-pass-issued', idempotencyKey: 'fixture:pass-issued', kind: 'transfer_pass_issued', occurredAt: FIXTURE_TIME, actor: MAYA, purpose: 'Share a bounded family handoff', caseId: 'NS-2051', organizationId: 'northstar', locationId: 'northstar-portland', audience: 'family_and_case_team', summary: 'Maya prepared a single-use handoff for Northstar Funeral Home.', waitingParty: 'Northstar Funeral Home', proof: 'Consent scope saved to PASS-RIVERA-7K4M', nextOwner: ELENA.name, previousState: 'draft', nextState: 'issued' }],
  };
}

function append(record: SandboxRecord, input: Omit<SandboxEvent, 'id' | 'occurredAt'>) {
  if (record.events.some((item) => item.idempotencyKey === input.idempotencyKey)) return record;
  return { ...record, events: [...record.events, { ...input, id: `evt-${record.events.length + 1}-${input.kind}`, occurredAt: new Date().toISOString() }] };
}

export function applySandboxCommand(record: SandboxRecord, command: SandboxCommand): SandboxRecord {
  if (command.type === 'reset_sandbox') return createCanonicalSandbox();
  if (record.events.some((item) => item.idempotencyKey === command.idempotencyKey)) return record;
  const accountable = membership(record, record.case.accountableMembershipId).actor;
  const assigned = membership(record, record.commitment.assignedMembershipId).actor;
  const base = { caseId: record.case.id, organizationId: record.case.organizationId } as const;

  if (command.type === 'set_director_workspace') {
    if (!eligibleDirector(record, command.actorId, command.actorMembershipId, record.case.operatingLocationId)) return record;
    if (command.locationId !== 'all' && !record.locations.some((item) => item.id === command.locationId && item.active)) return record;
    const updated = { ...record, workspaceContext: { ...record.workspaceContext, directorLocationId: command.locationId } };
    return append(updated, { ...base, idempotencyKey: command.idempotencyKey, kind: 'workspace_context_changed', actor: ELENA, purpose: 'Focus the director workspace', audience: 'director', summary: `Elena changed the workspace to ${command.locationId === 'all' ? 'all locations' : location(record, command.locationId).name}.`, waitingParty: 'Nobody', proof: 'Workspace preference saved in this browser', nextOwner: ELENA.name, previousState: record.workspaceContext.directorLocationId, nextState: command.locationId });
  }
  if (command.type === 'route_intake') {
    if (record.transferPass.status !== 'issued' || !eligibleDirector(record, command.actorId, command.actorMembershipId, command.locationId) || validateIntakeRoute(record, command.locationId, command.accountableMembershipId, command.assigneeMembershipId)) return record;
    const lead = membership(record, command.accountableMembershipId).actor;
    const assignee = membership(record, command.assigneeMembershipId).actor;
    const routingReason = `${location(record, command.locationId).name} intake default`;
    const updated: SandboxRecord = { ...record, transferPass: { ...record.transferPass, status: 'accepted', acceptedAt: new Date().toISOString(), acceptedBy: lead.name }, case: { ...record.case, status: 'arrangements', operatingLocationId: command.locationId, accountableMembershipId: command.accountableMembershipId }, commitment: { ...record.commitment, assignedMembershipId: command.assigneeMembershipId, nextOwnerMembershipId: command.assigneeMembershipId } };
    return append(updated, { ...base, idempotencyKey: command.idempotencyKey, kind: 'case_routed', actor: lead, purpose: 'Atomically accept and route the family handoff', locationId: command.locationId, authorityId: record.case.authorityId, assignmentId: record.commitment.assignmentId, commitmentId: record.commitment.id, audience: 'family_and_case_team', summary: `${record.case.id} was created at ${location(record, command.locationId).name} and assigned to ${assignee.name}.`, waitingParty: assignee.name, proof: `Acceptance and routing receipt saved to ${record.case.id}`, nextOwner: assignee.name, previousState: 'issued', nextState: 'accepted_and_routed', reason: routingReason });
  }
  if (command.type === 'accept_transfer_pass') {
    const rule = record.routingRules.find((item) => item.locationId === record.case.operatingLocationId)!;
    return applySandboxCommand(record, { type: 'route_intake', idempotencyKey: command.idempotencyKey, actorId: command.actorId, actorMembershipId: command.actorMembershipId, locationId: rule.locationId, accountableMembershipId: rule.accountableMembershipId, assigneeMembershipId: rule.firstAssigneeMembershipId });
  }
  if (command.type === 'reassign_commitment') {
    if (!eligibleDirector(record, command.actorId, command.actorMembershipId, record.case.operatingLocationId) || validateReassignment(record, command.assigneeMembershipId, command.reason)) return record;
    const next = membership(record, command.assigneeMembershipId).actor;
    const updated = { ...record, commitment: { ...record.commitment, assignedMembershipId: command.assigneeMembershipId, nextOwnerMembershipId: command.assigneeMembershipId } };
    return append(updated, { ...base, idempotencyKey: command.idempotencyKey, kind: 'commitment_reassigned', actor: accountable, purpose: 'Reassign owned work within the case location', locationId: record.case.operatingLocationId, authorityId: record.case.authorityId, assignmentId: record.commitment.assignmentId, commitmentId: record.commitment.id, audience: 'case_team', summary: `${accountable.name} reassigned the commitment from ${assigned.name} to ${next.name}.`, waitingParty: next.name, proof: `Reason saved: ${command.reason.trim()}`, nextOwner: next.name, previousState: record.commitment.assignedMembershipId, nextState: command.assigneeMembershipId, reason: command.reason.trim() });
  }
  if (command.type === 'issue_transfer_pass') {
    if (command.actorId !== MAYA.id) return record;
    const issued = { ...record, transferPass: { ...record.transferPass, status: 'issued' as const, acceptedAt: undefined, acceptedBy: undefined, scope: command.scope, expiresLabel: command.expiresLabel } };
    return append(issued, { ...base, idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_issued', actor: MAYA, purpose: 'Share a bounded family handoff', audience: 'family_and_case_team', summary: `Maya prepared ${command.scope.length} approved categories for Northstar.`, waitingParty: ELENA.name, proof: `Consent scope saved to ${issued.transferPass.code}`, nextOwner: ELENA.name, previousState: record.transferPass.status, nextState: 'issued' });
  }
  if (command.type === 'inspect_transfer_pass') {
    if (record.transferPass.status !== 'issued' || !eligibleDirector(record, command.actorId, command.actorMembershipId, record.case.operatingLocationId)) return record;
    return append(record, { ...base, idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_inspected', actor: ELENA, purpose: 'Review the family-approved handoff boundary', audience: 'case_team', summary: 'Elena inspected the sender, scope, expiry, and destination.', waitingParty: ELENA.name, proof: 'Inspection event recorded; no case change', nextOwner: ELENA.name, previousState: 'issued', nextState: 'inspected' });
  }
  if (command.type === 'revoke_transfer_pass') {
    if (command.actorId !== MAYA.id || record.transferPass.status !== 'issued') return record;
    return append({ ...record, transferPass: { ...record.transferPass, status: 'revoked' } }, { ...base, idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_revoked', actor: MAYA, purpose: 'Close family-granted access before acceptance', audience: 'family_and_case_team', summary: 'Maya closed the family handoff before acceptance.', waitingParty: 'Nobody', proof: 'Revocation recorded', nextOwner: MAYA.name, previousState: 'issued', nextState: 'revoked' });
  }
  if (command.type === 'start_commitment') {
    const actor = actingMembership(record, command.actorId, command.actorMembershipId);
    if (record.transferPass.status !== 'accepted' || record.case.status !== 'arrangements' || record.commitment.status !== 'assigned' || actor?.id !== record.commitment.assignedMembershipId || !membershipCanWorkAt(actor, record.case.operatingLocationId)) return record;
    return append({ ...record, commitment: { ...record.commitment, status: 'in_progress' } }, { ...base, idempotencyKey: command.idempotencyKey, kind: 'commitment_started', actor: assigned, purpose: 'Begin the assigned arrangement commitment', locationId: record.case.operatingLocationId, assignmentId: record.commitment.assignmentId, commitmentId: record.commitment.id, audience: 'case_team', summary: `${assigned.name} started the arrangement-meeting commitment.`, waitingParty: MAYA.name, proof: 'Start time recorded on the commitment', nextOwner: assigned.name, previousState: 'assigned', nextState: 'in_progress' });
  }
  const proofActor = actingMembership(record, command.actorId, command.actorMembershipId);
  if (record.transferPass.status !== 'accepted' || record.case.status !== 'arrangements' || record.commitment.status !== 'in_progress' || proofActor?.id !== record.commitment.assignedMembershipId || !membershipCanWorkAt(proofActor, record.case.operatingLocationId)) return record;
  const proofLabel = command.label?.trim() || 'Meeting time confirmed with Maya Rivera';
  const updated = { ...record, commitment: { ...record.commitment, status: 'proof_submitted' as const, proof: { label: proofLabel, submittedAt: new Date().toISOString(), submittedBy: assigned.name }, nextOwnerMembershipId: record.case.accountableMembershipId } };
  return append(updated, { ...base, idempotencyKey: command.idempotencyKey, kind: 'proof_submitted', actor: assigned, purpose: 'Return completion proof for director review', locationId: record.case.operatingLocationId, assignmentId: record.commitment.assignmentId, commitmentId: record.commitment.id, audience: 'family_and_case_team', summary: 'The arrangement meeting was confirmed and proof was returned.', waitingParty: accountable.name, proof: proofLabel, nextOwner: accountable.name, previousState: record.commitment.status, nextState: 'proof_submitted' });
}

export function readSandbox(storage: Pick<Storage, 'getItem' | 'removeItem'>): SandboxRecord {
  try {
    const raw = storage.getItem(SANDBOX_STORAGE_KEY);
    if (raw) { const parsed = JSON.parse(raw) as SandboxRecord; if (parsed.schemaVersion === 2 && parsed.transferPass?.code === 'PASS-RIVERA-7K4M') return parsed; }
    if (storage.getItem(LEGACY_SANDBOX_STORAGE_KEY)) storage.removeItem(LEGACY_SANDBOX_STORAGE_KEY);
  } catch { /* reset malformed or v1 browser state */ }
  return createCanonicalSandbox();
}
export const writeSandbox = (storage: Pick<Storage, 'setItem'>, record: SandboxRecord) => storage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(record));
