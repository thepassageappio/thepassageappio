import type { CaseId, CommitmentId, LocationId, MembershipId, SandboxActor, SandboxCase, SandboxCommand, SandboxCommitment, SandboxEvent, SandboxMembership, SandboxRecord } from './types';

export const SANDBOX_STORAGE_KEY = 'passage.zero.operational-truth.v3';
export const LEGACY_SANDBOX_STORAGE_KEY = 'passage.zero.operational-truth.v2';
const FIXTURE_TIME = '2026-07-15T15:42:00.000Z';
const MAYA: SandboxActor & { id: 'maya-rivera' } = { id: 'maya-rivera', name: 'Maya Rivera', role: 'Family coordinator' };
const ELENA: SandboxActor = { id: 'elena-torres', name: 'Elena Torres', role: 'Accountable director' };
const MARCUS: SandboxActor = { id: 'marcus-lee', name: 'Marcus Lee', role: 'Care coordinator' };
const AVERY: SandboxActor = { id: 'avery-brooks', name: 'Avery Brooks', role: 'Care coordinator' };
const SYSTEM: SandboxActor = { id: 'passage-system', name: 'Passage', role: 'Automated workflow actor' };

export const membership = (record: SandboxRecord, id: MembershipId) => record.memberships.find((item) => item.id === id)!;
export const location = (record: SandboxRecord, id: LocationId) => record.locations.find((item) => item.id === id)!;
export const caseById = (record: SandboxRecord, id: CaseId) => record.cases.find((item) => item.id === id)!;
export const commitmentById = (record: SandboxRecord, id: CommitmentId) => record.commitments.find((item) => item.id === id)!;
export const membershipCanWorkAt = (item: SandboxMembership, locationId: LocationId) => item.active && (item.locationScope === 'organization' || item.locationScope === locationId);
export const eligibleMemberships = (record: SandboxRecord, locationId: LocationId) => record.memberships.filter((item) => membershipCanWorkAt(item, locationId));
export const assignedCommitments = (record: SandboxRecord, membershipId: MembershipId) => record.commitments.filter((item) => item.assignedMembershipId === membershipId);
export const operationalCounts = (record: SandboxRecord) => ({
  active: record.commitments.length,
  assigned: record.commitments.filter((item) => item.assignedMembershipId).length,
  unassigned: record.commitments.filter((item) => !item.assignedMembershipId).length,
  byMembership: record.memberships.map((item) => ({ membershipId: item.id, name: item.actor.name.split(' ')[0], count: assignedCommitments(record, item.id).length })),
});
export const automationSummary = (record: SandboxRecord) => ({
  preparedDrafts: record.commitments.filter((item) => item.output?.kind === 'family_draft' || item.output?.kind === 'internal_draft').length,
  automaticInternalReceipts: record.commitments.filter((item) => item.output?.kind === 'automatic_internal_receipt').length,
  externalSends: record.commitments.filter((item) => item.output?.sentExternally).length,
});

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

export function validateReassignment(record: SandboxRecord, assigneeId: MembershipId, reason: string, commitmentId: CommitmentId = 'confirm-arrangement-meeting') {
  const commitment = commitmentById(record, commitmentId);
  const itemCase = caseById(record, commitment.caseId);
  if (itemCase.id === 'NS-2051' && (record.transferPass.status !== 'accepted' || itemCase.status !== 'arrangements')) return 'Accept and route the handoff before changing its assignment.';
  if (!reason.trim()) return 'Add a reason for the assignment change.';
  const assignee = record.memberships.find((item) => item.id === assigneeId);
  if (!assignee || !membershipCanWorkAt(assignee, itemCase.operatingLocationId)) return 'Choose an active team member authorized for this case location.';
  if (assignee.id === commitment.assignedMembershipId) return 'Choose a different team member.';
  return null;
}

const cases: SandboxCase[] = [
  { id: 'NS-2051', family: 'Rivera', personName: 'Sofia Rivera', organizationId: 'northstar', operatingLocationId: 'northstar-portland', authorityId: 'authority-ns-2051-accountable', accountableMembershipId: 'membership-elena', status: 'intake', source: 'family_transfer_pass', phase: 'Intake' },
  { id: 'NS-2048', family: 'Chen', personName: 'Arthur Chen', organizationId: 'northstar', operatingLocationId: 'northstar-portland', authorityId: 'authority-ns-2048-accountable', accountableMembershipId: 'membership-elena', status: 'arrangements', source: 'provider_handoff', phase: 'Arrival' },
  { id: 'NS-2039', family: 'Patel', personName: 'Ravi Patel', organizationId: 'northstar', operatingLocationId: 'northstar-portland', authorityId: 'authority-ns-2039-accountable', accountableMembershipId: 'membership-elena', status: 'arrangements', source: 'manual_intake', phase: 'Aftercare' },
  { id: 'NS-2053', family: 'Williams', personName: 'Jordan Williams', organizationId: 'northstar', operatingLocationId: 'northstar-portland', authorityId: 'authority-ns-2053-accountable', accountableMembershipId: 'membership-elena', status: 'arrangements', source: 'manual_intake', phase: 'Service' },
  { id: 'NS-2056', family: 'Brooks', personName: 'Helen Brooks', organizationId: 'northstar', operatingLocationId: 'northstar-beaverton', authorityId: 'authority-ns-2056-accountable', accountableMembershipId: 'membership-elena', status: 'arrangements', source: 'provider_handoff', phase: 'Arrangement' },
];

const commitments: SandboxCommitment[] = [
  { id: 'confirm-arrangement-meeting', caseId: 'NS-2051', assignmentId: 'assignment-ns-2051-arrangement', assignedMembershipId: 'membership-marcus', title: 'Confirm the arrangement meeting with Maya Rivera.', status: 'assigned', waitingParty: 'Maya Rivera', due: '10:30', blocker: 'Maya Rivera is waiting for the meeting time.', proofRequirement: 'Meeting time + family acknowledgment', nextOwnerMembershipId: 'membership-marcus', output: { kind: 'family_draft', eyebrow: 'PASSAGE-PREPARED DRAFT', audience: 'Audience: Maya Rivera · family coordinator', automationLabel: 'Automation: Draft prepared', boundaryLabel: 'Review required · Not sent', body: 'Your Northstar team is coordinating the arrangement meeting. Please review the proposed time before this message is sent.', cta: 'Review family message', helper: 'Nothing is sent until an authorized team member reviews and sends it.', reviewReady: false, sentExternally: false } },
  { id: 'confirm-receiving-location', caseId: 'NS-2048', assignmentId: 'assignment-ns-2048-location', assignedMembershipId: 'membership-marcus', title: 'Confirm the receiving location so transport can dispatch.', status: 'assigned', waitingParty: 'Transport team', due: '11:15', blocker: 'Two locations are ready; destination is unconfirmed.', proofRequirement: 'Destination + dispatch timestamp', nextOwnerMembershipId: 'membership-marcus', output: { kind: 'automatic_internal_receipt', eyebrow: 'AUTOMATIC INTERNAL RECEIPT', audience: 'Audience: Northstar case team', automationLabel: 'Recorded automatically', boundaryLabel: 'Internal only', body: 'The provider handoff was received and added to the Chen case timeline.', helper: 'No external message was sent.', reviewReady: false, sentExternally: false } },
  { id: 'resolve-benefits-document', caseId: 'NS-2039', assignmentId: 'assignment-ns-2039-benefits', assignedMembershipId: 'membership-elena', title: 'Resolve the missing benefits document before the aftercare call.', status: 'assigned', waitingParty: 'Patel family', due: '15:30', blocker: 'Family has not located the policy schedule.', proofRequirement: 'Document received or exception recorded', nextOwnerMembershipId: 'membership-elena', output: { kind: 'internal_draft', eyebrow: 'PASSAGE-PREPARED SUMMARY', audience: 'Audience: Elena Torres + Portland case team', automationLabel: 'Automation: Draft prepared', boundaryLabel: 'Review required · Not sent', body: 'Benefits document remains outstanding. Confirm the exception path before the aftercare call.', cta: 'Review internal summary', helper: 'This draft stays inside the case team and is not visible to the family.', reviewReady: false, sentExternally: false } },
  { id: 'approve-keepsake-artwork', caseId: 'NS-2053', assignmentId: 'assignment-ns-2053-artwork', assignedMembershipId: null, title: 'Review keepsake artwork and record family approval.', status: 'assigned', waitingParty: 'Williams family', due: '13:45', blocker: 'No employee owns the approval follow-up.', proofRequirement: 'Family approval + final artwork version', nextOwnerMembershipId: null },
  { id: 'confirm-service-accessibility', caseId: 'NS-2056', assignmentId: 'assignment-ns-2056-accessibility', assignedMembershipId: 'membership-avery', title: 'Confirm service accessibility needs with the family.', status: 'assigned', waitingParty: 'Brooks family', due: '12:20', blocker: 'Venue seating and hearing support need confirmation.', proofRequirement: 'Accessibility plan + family acknowledgment', nextOwnerMembershipId: 'membership-avery' },
];

function withCanonicalAliases(record: Omit<SandboxRecord, 'case' | 'commitment'>): SandboxRecord {
  return { ...record, case: record.cases.find((item) => item.id === 'NS-2051') as SandboxRecord['case'], commitment: record.commitments.find((item) => item.id === 'confirm-arrangement-meeting') as SandboxRecord['commitment'] };
}

export function createCanonicalSandbox(): SandboxRecord {
  return withCanonicalAliases({
    schemaVersion: 3,
    organizations: [{ id: 'northstar', name: 'Northstar Funeral Home' }],
    locations: [{ id: 'northstar-portland', organizationId: 'northstar', name: 'Portland', active: true }, { id: 'northstar-beaverton', organizationId: 'northstar', name: 'Beaverton', active: true }],
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
    cases: cases.map((item) => ({ ...item })), commitments: commitments.map((item) => ({ ...item, output: item.output ? { ...item.output } : undefined })),
    events: [
      { id: 'evt-pass-issued', idempotencyKey: 'fixture:pass-issued', kind: 'transfer_pass_issued', occurredAt: FIXTURE_TIME, actor: MAYA, purpose: 'Share a bounded family handoff', caseId: 'NS-2051', organizationId: 'northstar', locationId: 'northstar-portland', audience: 'family_and_case_team', summary: 'Maya prepared a single-use handoff for Northstar Funeral Home.', waitingParty: 'Northstar Funeral Home', proof: 'Consent scope saved to PASS-RIVERA-7K4M', nextOwner: ELENA.name, previousState: 'draft', nextState: 'issued' },
      { id: 'evt-chen-receipt', idempotencyKey: 'fixture:chen-internal-receipt', kind: 'output_review_ready', occurredAt: FIXTURE_TIME, actor: SYSTEM, purpose: 'Record an internal provider handoff receipt', caseId: 'NS-2048', organizationId: 'northstar', locationId: 'northstar-portland', commitmentId: 'confirm-receiving-location', audience: 'case_team', summary: 'Passage recorded the Chen provider handoff inside the case team.', waitingParty: 'Transport team', proof: 'Automatic internal receipt saved; no external message sent', nextOwner: MARCUS.name, previousState: 'handoff_received', nextState: 'internal_receipt_recorded' },
    ],
  });
}

function append(record: SandboxRecord, input: Omit<SandboxEvent, 'id' | 'occurredAt'>) {
  if (record.events.some((item) => item.idempotencyKey === input.idempotencyKey)) return record;
  return { ...record, events: [...record.events, { ...input, id: `evt-${record.events.length + 1}-${input.kind}`, occurredAt: new Date().toISOString() }] };
}

function updateCommitment(record: SandboxRecord, commitmentId: CommitmentId, update: (item: SandboxCommitment) => SandboxCommitment) {
  const commitments = record.commitments.map((item) => item.id === commitmentId ? update(item) : item);
  return withCanonicalAliases({ ...record, commitments });
}

function updateCase(record: SandboxRecord, caseId: CaseId, update: (item: SandboxCase) => SandboxCase) {
  const cases = record.cases.map((item) => item.id === caseId ? update(item) : item);
  return withCanonicalAliases({ ...record, cases });
}

export function applySandboxCommand(record: SandboxRecord, command: SandboxCommand): SandboxRecord {
  if (command.type === 'reset_sandbox') return createCanonicalSandbox();
  if (record.events.some((item) => item.idempotencyKey === command.idempotencyKey)) return record;

  if (command.type === 'set_director_workspace') {
    if (!actingMembership(record, command.actorId, command.actorMembershipId)?.active) return record;
    if (command.locationId !== 'all' && !record.locations.some((item) => item.id === command.locationId && item.active)) return record;
    const updated = { ...record, workspaceContext: { ...record.workspaceContext, directorLocationId: command.locationId } };
    return append(updated, { idempotencyKey: command.idempotencyKey, kind: 'workspace_context_changed', actor: ELENA, purpose: 'Focus the director workspace', caseId: 'NS-2051', organizationId: 'northstar', audience: 'director', summary: `Elena changed the workspace to ${command.locationId === 'all' ? 'all locations' : location(record, command.locationId).name}.`, waitingParty: 'Nobody', proof: 'Workspace preference saved in this browser', nextOwner: ELENA.name, previousState: record.workspaceContext.directorLocationId, nextState: command.locationId });
  }
  if (command.type === 'set_staff_identity') {
    const actor = actingMembership(record, command.actorId, command.actorMembershipId);
    if (!actor || actor.role === 'director') return record;
    const updated = { ...record, workspaceContext: { ...record.workspaceContext, staffMembershipId: actor.id, staffLocationId: actor.locationScope === 'organization' ? record.workspaceContext.staffLocationId : actor.locationScope } };
    return append(updated, { idempotencyKey: command.idempotencyKey, kind: 'staff_identity_changed', actor: actor.actor, purpose: 'Preview a seeded staff workspace', caseId: 'NS-2051', organizationId: 'northstar', audience: 'director', summary: `Sandbox staff identity changed to ${actor.actor.name}.`, waitingParty: 'Nobody', proof: 'Preview preference saved in this browser; no access granted', nextOwner: actor.actor.name, previousState: record.workspaceContext.staffMembershipId, nextState: actor.id });
  }
  if (command.type === 'route_intake') {
    if (record.transferPass.status !== 'issued' || !eligibleDirector(record, command.actorId, command.actorMembershipId, command.locationId) || validateIntakeRoute(record, command.locationId, command.accountableMembershipId, command.assigneeMembershipId)) return record;
    const lead = membership(record, command.accountableMembershipId).actor;
    const assignee = membership(record, command.assigneeMembershipId).actor;
    let updated = updateCase(record, 'NS-2051', (item) => ({ ...item, status: 'arrangements', phase: 'Arrangement', operatingLocationId: command.locationId, accountableMembershipId: command.accountableMembershipId }));
    updated = updateCommitment(updated, 'confirm-arrangement-meeting', (item) => ({ ...item, assignedMembershipId: command.assigneeMembershipId, nextOwnerMembershipId: command.assigneeMembershipId }));
    updated = { ...updated, transferPass: { ...updated.transferPass, status: 'accepted', acceptedAt: new Date().toISOString(), acceptedBy: lead.name } };
    return append(updated, { idempotencyKey: command.idempotencyKey, kind: 'case_routed', actor: lead, purpose: 'Atomically accept and route the family handoff', caseId: 'NS-2051', organizationId: 'northstar', locationId: command.locationId, authorityId: record.case.authorityId, assignmentId: record.commitment.assignmentId, commitmentId: record.commitment.id, audience: 'family_and_case_team', summary: `NS-2051 was created at ${location(record, command.locationId).name} and assigned to ${assignee.name}.`, waitingParty: assignee.name, proof: 'Acceptance and routing receipt saved to NS-2051', nextOwner: assignee.name, previousState: 'issued', nextState: 'accepted_and_routed', reason: `${location(record, command.locationId).name} intake default` });
  }
  if (command.type === 'accept_transfer_pass') {
    const rule = record.routingRules.find((item) => item.locationId === record.case.operatingLocationId)!;
    return applySandboxCommand(record, { type: 'route_intake', idempotencyKey: command.idempotencyKey, actorId: command.actorId, actorMembershipId: command.actorMembershipId, locationId: rule.locationId, accountableMembershipId: rule.accountableMembershipId, assigneeMembershipId: rule.firstAssigneeMembershipId });
  }
  if (command.type === 'reassign_commitment') {
    const commitmentId = command.commitmentId ?? 'confirm-arrangement-meeting';
    const current = commitmentById(record, commitmentId);
    const itemCase = caseById(record, current.caseId);
    if (!eligibleDirector(record, command.actorId, command.actorMembershipId, itemCase.operatingLocationId) || validateReassignment(record, command.assigneeMembershipId, command.reason, commitmentId)) return record;
    const previous = current.assignedMembershipId ? membership(record, current.assignedMembershipId).actor.name : 'Unassigned';
    const next = membership(record, command.assigneeMembershipId).actor;
    const updated = updateCommitment(record, commitmentId, (item) => ({ ...item, assignedMembershipId: command.assigneeMembershipId, nextOwnerMembershipId: command.assigneeMembershipId }));
    return append(updated, { idempotencyKey: command.idempotencyKey, kind: 'commitment_reassigned', actor: ELENA, purpose: current.assignedMembershipId ? 'Reassign owned work within the case location' : 'Assign unowned work within the case location', caseId: itemCase.id, organizationId: 'northstar', locationId: itemCase.operatingLocationId, authorityId: itemCase.authorityId, assignmentId: current.assignmentId, commitmentId, audience: 'case_team', summary: `${ELENA.name} assigned ${current.title} from ${previous} to ${next.name}.`, waitingParty: next.name, proof: `Reason saved: ${command.reason.trim()}`, nextOwner: next.name, previousState: current.assignedMembershipId ?? 'unassigned', nextState: command.assigneeMembershipId, reason: command.reason.trim() });
  }
  if (command.type === 'issue_transfer_pass') {
    if (command.actorId !== MAYA.id) return record;
    const issued = { ...record, transferPass: { ...record.transferPass, status: 'issued' as const, acceptedAt: undefined, acceptedBy: undefined, scope: command.scope, expiresLabel: command.expiresLabel } };
    return append(issued, { idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_issued', actor: MAYA, purpose: 'Share a bounded family handoff', caseId: 'NS-2051', organizationId: 'northstar', audience: 'family_and_case_team', summary: `Maya prepared ${command.scope.length} approved categories for Northstar.`, waitingParty: ELENA.name, proof: `Consent scope saved to ${issued.transferPass.code}`, nextOwner: ELENA.name, previousState: record.transferPass.status, nextState: 'issued' });
  }
  if (command.type === 'inspect_transfer_pass') {
    if (record.transferPass.status !== 'issued' || !eligibleDirector(record, command.actorId, command.actorMembershipId, record.case.operatingLocationId)) return record;
    return append(record, { idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_inspected', actor: ELENA, purpose: 'Review the family-approved handoff boundary', caseId: 'NS-2051', organizationId: 'northstar', audience: 'case_team', summary: 'Elena inspected the sender, scope, expiry, and destination.', waitingParty: ELENA.name, proof: 'Inspection event recorded; no case change', nextOwner: ELENA.name, previousState: 'issued', nextState: 'inspected' });
  }
  if (command.type === 'revoke_transfer_pass') {
    if (command.actorId !== MAYA.id || record.transferPass.status !== 'issued') return record;
    return append({ ...record, transferPass: { ...record.transferPass, status: 'revoked' } }, { idempotencyKey: command.idempotencyKey, kind: 'transfer_pass_revoked', actor: MAYA, purpose: 'Close family-granted access before acceptance', caseId: 'NS-2051', organizationId: 'northstar', audience: 'family_and_case_team', summary: 'Maya closed the family handoff before acceptance.', waitingParty: 'Nobody', proof: 'Revocation recorded', nextOwner: MAYA.name, previousState: 'issued', nextState: 'revoked' });
  }

  const commitmentId = command.type === 'mark_output_review_ready' ? command.commitmentId : command.commitmentId ?? 'confirm-arrangement-meeting';
  const current = commitmentById(record, commitmentId);
  const itemCase = caseById(record, current.caseId);
  const actor = actingMembership(record, command.actorId, command.actorMembershipId);
  if (!actor || actor.id !== current.assignedMembershipId || !membershipCanWorkAt(actor, itemCase.operatingLocationId)) return record;
  if (itemCase.id === 'NS-2051' && record.transferPass.status !== 'accepted') return record;
  const base = { caseId: itemCase.id, organizationId: itemCase.organizationId, locationId: itemCase.operatingLocationId, assignmentId: current.assignmentId, commitmentId } as const;
  if (command.type === 'start_commitment') {
    if (current.status !== 'assigned') return record;
    return append(updateCommitment(record, commitmentId, (item) => ({ ...item, status: 'in_progress' })), { ...base, idempotencyKey: command.idempotencyKey, kind: 'commitment_started', actor: actor.actor, purpose: 'Begin the assigned commitment', audience: 'case_team', summary: `${actor.actor.name} started ${current.title}`, waitingParty: current.waitingParty, proof: 'Start time recorded on the commitment', nextOwner: actor.actor.name, previousState: 'assigned', nextState: 'in_progress' });
  }
  if (command.type === 'mark_output_review_ready') {
    if (!current.output || current.output.kind === 'automatic_internal_receipt' || current.output.reviewReady) return record;
    const updated = updateCommitment(record, commitmentId, (item) => ({ ...item, output: item.output ? { ...item.output, reviewReady: true, boundaryLabel: 'Reviewed · Not sent' } : item.output }));
    return append(updated, { ...base, idempotencyKey: command.idempotencyKey, kind: 'output_review_ready', actor: actor.actor, purpose: 'Review a Passage-prepared task output before any send', audience: 'case_team', summary: `${actor.actor.name} reviewed the prepared ${current.output.kind === 'family_draft' ? 'family message' : 'internal summary'}; no message was sent.`, waitingParty: actor.actor.name, proof: 'Review-ready event saved; no message sent', nextOwner: actor.actor.name, previousState: 'draft_prepared', nextState: 'review_ready' });
  }
  if (current.status !== 'in_progress') return record;
  const proofLabel = command.label?.trim() || (commitmentId === 'confirm-arrangement-meeting' ? 'Meeting time confirmed with Maya Rivera' : current.proofRequirement);
  const updated = updateCommitment(record, commitmentId, (item) => ({ ...item, status: 'proof_submitted', proof: { label: proofLabel, submittedAt: new Date().toISOString(), submittedBy: actor.actor.name }, nextOwnerMembershipId: itemCase.accountableMembershipId }));
  return append(updated, { ...base, idempotencyKey: command.idempotencyKey, kind: 'proof_submitted', actor: actor.actor, purpose: 'Return proof to the accountable director', authorityId: itemCase.authorityId, audience: 'family_and_case_team', summary: `${actor.actor.name} attached proof for ${current.title}`, waitingParty: ELENA.name, proof: proofLabel, nextOwner: ELENA.name, previousState: 'in_progress', nextState: 'proof_submitted' });
}

function normalizePreparedOutputReviews(record: SandboxRecord): SandboxRecord {
  return {
    ...record,
    commitments: record.commitments.map((item) => {
      if (!item.output || item.output.kind === 'automatic_internal_receipt') return item;
      const reviewReady = record.events.some((event) => event.kind === 'output_review_ready' && event.commitmentId === item.id);
      return { ...item, output: { ...item.output, reviewReady, boundaryLabel: reviewReady ? 'Reviewed · Not sent' : 'Review required · Not sent' } };
    }),
  };
}

export function readSandbox(storage: Pick<Storage, 'getItem' | 'removeItem'>): SandboxRecord {
  try {
    const raw = storage.getItem(SANDBOX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SandboxRecord;
      if (parsed.schemaVersion === 3 && parsed.transferPass?.code === 'PASS-RIVERA-7K4M' && parsed.cases?.length === 5) return withCanonicalAliases(normalizePreparedOutputReviews(parsed));
    }
  } catch { /* An invalid or older sandbox is safely replaced below. */ }
  storage.removeItem(SANDBOX_STORAGE_KEY);
  storage.removeItem(LEGACY_SANDBOX_STORAGE_KEY);
  storage.removeItem('passage.zero.operational-truth.v1');
  return createCanonicalSandbox();
}

export function writeSandbox(storage: Pick<Storage, 'setItem'>, record: SandboxRecord) {
  storage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(record));
}
