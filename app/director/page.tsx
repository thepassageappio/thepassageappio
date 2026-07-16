'use client';

import { useEffect, useState } from 'react';
import { usePassageZero } from '../../components/PassageZeroProvider';
import { AppFrame } from '../../components/operations/AppFrame';
import { ContinuityRail } from '../../components/operations/ContinuityRail';
import { Signal } from '../../components/operations/Signal';
import { automationSummary, caseById, eligibleMemberships, location, membership, operationalCounts, validateReassignment } from '../../lib/sandbox/repository';
import type { CommitmentId, MembershipId, WorkspaceLocationId } from '../../lib/sandbox/types';
import styles from './Director.module.css';

export default function DirectorPage() {
  const { record, dispatch } = usePassageZero();
  const [ownerFilter, setOwnerFilter] = useState<'all' | MembershipId | 'unassigned'>('all');
  const [selectedId, setSelectedId] = useState<CommitmentId>('confirm-arrangement-meeting');
  const [reassignTo, setReassignTo] = useState<MembershipId>('membership-marcus');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const workspace = record.workspaceContext.directorLocationId;
  const counts = operationalCounts(record);
  const automation = automationSummary(record);
  const workspaceCommitments = record.commitments.filter((item) => workspace === 'all' || caseById(record, item.caseId).operatingLocationId === workspace);
  const workspaceWorkload = record.memberships.map((item) => ({ name: item.actor.name.split(' ')[0], count: workspaceCommitments.filter((commitment) => commitment.assignedMembershipId === item.id).length }));
  const filtered = record.commitments.filter((item) => {
    const itemCase = caseById(record, item.caseId);
    const locationMatches = workspace === 'all' || itemCase.operatingLocationId === workspace;
    const ownerMatches = ownerFilter === 'all' || (ownerFilter === 'unassigned' ? item.assignedMembershipId === null : item.assignedMembershipId === ownerFilter);
    return locationMatches && ownerMatches;
  }).sort((left, right) => left.due.localeCompare(right.due));
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const selectedCase = selected ? caseById(record, selected.caseId) : null;
  const assigned = selected?.assignedMembershipId ? membership(record, selected.assignedMembershipId) : null;
  const accountable = selectedCase ? membership(record, selectedCase.accountableMembershipId) : null;
  const assignmentOptions = selectedCase
    ? eligibleMemberships(record, selectedCase.operatingLocationId).filter((item) => item.id !== selected?.assignedMembershipId)
    : [];
  const canReassign = assignmentOptions.length > 0;
  const effectiveReassignTo = assignmentOptions.some((item) => item.id === reassignTo) ? reassignTo : assignmentOptions[0]?.id;

  useEffect(() => {
    if (!selected) {
      setReason('');
      setError('');
      setStatus('');
      return;
    }
    if (selected.id !== selectedId) setSelectedId(selected.id);
    setReason('');
    setError('');
    setStatus('');
  }, [selected?.id, selectedCase?.operatingLocationId, workspace, ownerFilter]);

  return (
    <AppFrame active="director" identity="Elena Torres" role="Director · Northstar">
      <section className={styles.heading}>
        <div><p>OPERATIONS / TODAY</p><h1>Every commitment, owner, and wait.</h1></div>
        <div className={styles.workspacePicker}><label htmlFor="director-workspace">Location</label><select id="director-workspace" value={workspace} onChange={(event) => dispatch({ type: 'set_director_workspace', actorId: 'elena-torres', actorMembershipId: 'membership-elena', locationId: event.target.value as WorkspaceLocationId, idempotencyKey: `workspace:${event.target.value}:${Date.now()}` })}><option value="all">All locations</option><option value="northstar-portland">Portland</option><option value="northstar-beaverton">Beaverton</option></select><small>Filters what is shown. It does not grant access.</small></div>
        <div className={styles.workspacePicker}><label htmlFor="owner-filter">Owner</label><select id="owner-filter" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value as typeof ownerFilter)}><option value="all">All owners</option><option value="membership-marcus">Marcus Lee</option><option value="membership-avery">Avery Brooks</option><option value="membership-elena">Elena Torres</option><option value="unassigned">Unassigned</option></select><small>Assignment scope across the selected location.</small></div>
        <dl><div><dt>Active</dt><dd>{counts.active}</dd></div><div><dt>Assigned</dt><dd>{counts.assigned}</dd></div><div><dt>Unassigned</dt><dd>{counts.unassigned}</dd></div></dl>
      </section>

      <section className={styles.automationSummary} aria-label="Automation summary"><strong>Passage prepared {automation.preparedDrafts} drafts · recorded {automation.automaticInternalReceipts} internal routing receipt · sent {automation.externalSends} external messages automatically.</strong><span>Workload ({workspace === 'all' ? 'all locations' : location(record, workspace).name}): {workspaceWorkload.map((item) => `${item.name} ${item.count}`).join(' · ')}</span></section>

      {!selected || !selectedCase ? <section className={styles.empty}><Signal tone="success">No matching work</Signal><h2>No commitments match these filters.</h2><p>Change the location or owner filter to see active work.</p></section> : <>
        <ContinuityRail label={`${selectedCase.family} · ${selectedCase.id}`} steps={[{ label: 'Case', detail: selectedCase.phase, state: 'complete' }, { label: 'Owner', detail: assigned?.actor.name ?? 'Unassigned', state: assigned ? 'complete' : 'current' }, { label: 'Waiting', detail: selected.waitingParty, state: 'current' }, { label: 'Proof', detail: selected.proof?.label ?? selected.proofRequirement, state: selected.proof ? 'complete' : 'pending' }]} />
        <div className={styles.commandGrid}>
          <section className={styles.focus} aria-labelledby="focus-title">
            <div className={styles.sectionHead}><span>{selectedCase.id} · {location(record, selectedCase.operatingLocationId).name}</span><Signal tone={assigned ? 'signal' : 'warm'}>{assigned ? 'Assigned' : 'Unassigned'}</Signal></div>
            <div className={styles.caseIdentity}><div><span>{selectedCase.phase}</span><h2 id="focus-title">{selectedCase.family} family</h2><p>{selectedCase.personName}</p></div><p>ACCOUNTABLE DIRECTOR<strong>{accountable?.actor.name}</strong><small>Assigned operator {assigned?.actor.name ?? 'Nobody yet'}</small></p></div>
            <div className={styles.decision}><span>NEXT COMMITMENT · DUE {selected.due}</span><h3>{selected.title}</h3><div className={styles.blocker}><b aria-hidden="true">!</b><p><span>WHO IS WAITING</span>{selected.waitingParty} · {selected.blocker}</p></div></div>
            <div className={styles.proofBand}><span>PROOF DESTINATION</span><strong>{selected.proofRequirement}</strong><i>Next state: proof submitted · next owner {accountable?.actor.name}</i></div>
            <form className={styles.reassign} onSubmit={(event) => { event.preventDefault(); if (!effectiveReassignTo) return; const failure = validateReassignment(record, effectiveReassignTo, reason, selected.id); if (failure) { setError(failure); return; } const nextName = membership(record, effectiveReassignTo).actor.name; dispatch({ type: 'reassign_commitment', actorId: 'elena-torres', actorMembershipId: 'membership-elena', idempotencyKey: `assign:${selected.assignmentId}:${Date.now()}`, commitmentId: selected.id, assigneeMembershipId: effectiveReassignTo, reason }); setStatus(`${selected.title} assigned to ${nextName}. ${location(record, selectedCase.operatingLocationId).name} remains the operating location.`); setReason(''); setError(''); }}><label>ASSIGN TO<select disabled={!canReassign} value={effectiveReassignTo} onChange={(event) => { setReassignTo(event.target.value as MembershipId); setError(''); setStatus(''); }}>{assignmentOptions.map((item) => <option key={item.id} value={item.id}>{item.actor.name}</option>)}</select></label><label>REASON<input disabled={!canReassign} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why ownership is changing" required /></label><button disabled={!canReassign} type="submit">{canReassign ? (assigned ? 'Save reassignment' : 'Assign unowned work') : 'No alternate assignee'}</button>{error && <p role="alert">{error}</p>}<small>Only active team members authorized for {location(record, selectedCase.operatingLocationId).name} are available. The current owner is excluded; the reason is saved to the case event.</small></form>
            {status && <p className={styles.reassignmentStatus} role="status">{status}</p>}
          </section>
          <aside className={styles.activity}><div className={styles.sectionHead}><span>AUTOMATION BOUNDARY</span></div><div className={styles.automationDetail}><strong>{selected.output?.eyebrow ?? 'MANUAL COMMITMENT'}</strong><p>{selected.output?.audience ?? `Audience: ${selected.waitingParty}`}</p><p>{selected.output?.automationLabel ?? 'Automation: Manual'}</p><p>{selected.output?.helper ?? 'Passage has not prepared or sent an output for this commitment.'}</p></div></aside>
        </div>
        <section className={styles.ledger}><div className={styles.ledgerTitle}><div><span>ACTIVE COMMITMENTS</span><h2>Queue and assignment detail.</h2></div><p>{filtered.length} shown · ordered by due time</p></div><div className={styles.tableWrap}><table><thead><tr><th>Case</th><th>Location</th><th>Commitment</th><th>Owner</th><th>Waiting</th><th>Due</th></tr></thead><tbody>{filtered.map((item) => { const itemCase = caseById(record, item.caseId); return <tr className={selected.id === item.id ? styles.selected : ''} key={item.id}><td><button aria-label={`Focus ${itemCase.family} case`} aria-pressed={selected.id === item.id} onClick={() => { setSelectedId(item.id); setReason(''); setError(''); setStatus(''); }} type="button"><strong>{itemCase.family}</strong><small>{itemCase.id}</small></button></td><td>{location(record, itemCase.operatingLocationId).name}</td><td>{item.title}</td><td>{item.assignedMembershipId ? membership(record, item.assignedMembershipId).actor.name : <Signal tone="warm">Unassigned</Signal>}</td><td>{item.waitingParty}</td><td><strong>{item.due}</strong></td></tr>; })}</tbody></table></div></section>
      </>}
    </AppFrame>
  );
}
