'use client';

import { useState } from 'react';
import { usePassageZero } from '../../components/PassageZeroProvider';
import { AppFrame } from '../../components/operations/AppFrame';
import { ContinuityRail } from '../../components/operations/ContinuityRail';
import { Signal } from '../../components/operations/Signal';
import styles from './Director.module.css';
import { eligibleMemberships, location, membership, validateReassignment } from '../../lib/sandbox/repository';
import type { LocationId, MembershipId, WorkspaceLocationId } from '../../lib/sandbox/types';

type CaseItem = {
  id: string; family: string; person: string; risk: 'Waiting' | 'Watch' | 'Stable';
  owner: string; due: string; commitment: string; blocker: string; proof: string;
  handoff: string; phase: string;
  locationId: LocationId;
};

const SECONDARY_CASES: CaseItem[] = [
  { id: 'NS-2048', family: 'Chen', person: 'Arthur Chen', risk: 'Watch', owner: 'Marcus Lee', due: '11:15', commitment: 'Confirm the receiving location so transport can dispatch.', blocker: 'Two locations are ready; destination is unconfirmed.', proof: 'Destination + dispatch timestamp', handoff: 'Provider → Transport', phase: 'Arrival', locationId: 'northstar-portland' },
  { id: 'NS-2039', family: 'Patel', person: 'Ravi Patel', risk: 'Watch', owner: 'Elena Torres', due: '15:30', commitment: 'Resolve the missing benefits document before aftercare call.', blocker: 'Family has not located the policy schedule.', proof: 'Document received or exception recorded', handoff: 'Family → Aftercare', phase: 'Aftercare', locationId: 'northstar-portland' },
];

export default function DirectorPage() {
  const { record, dispatch } = usePassageZero();
  const accountableDirector = membership(record, record.case.accountableMembershipId).actor;
  const assignedOperator = membership(record, record.commitment.assignedMembershipId).actor;
  const operatingLocation = location(record, record.case.operatingLocationId);
  const [reassigning, setReassigning] = useState(false);
  const [reassignTo, setReassignTo] = useState<MembershipId>(record.commitment.assignedMembershipId);
  const [reason, setReason] = useState('');
  const [reassignError, setReassignError] = useState('');
  const [reassignmentStatus, setReassignmentStatus] = useState('');
  const canonical: CaseItem = {
    id: record.case.id, family: 'Rivera', person: record.person.name,
    risk: record.commitment.status === 'proof_submitted' ? 'Stable' : 'Waiting',
    owner: accountableDirector.name, due: '10:30', commitment: record.commitment.title,
    blocker: record.commitment.status === 'proof_submitted' ? 'Proof is waiting for director review.' : `${record.familyCoordinator.name} is waiting for the meeting time.`,
    proof: record.commitment.proof?.label ?? record.commitment.proofRequirement,
    handoff: 'Family → Arrangement', phase: record.case.status === 'arrangements' ? 'Arrangement' : 'Intake', locationId: record.case.operatingLocationId,
  };
  const allCases = [canonical, ...SECONDARY_CASES];
  const workspace = record.workspaceContext.directorLocationId;
  const cases = allCases.filter((item) => workspace === 'all' || item.locationId === workspace);
  const [selectedId, setSelectedId] = useState(canonical.id);
  const selected = cases.find((item) => item.id === selectedId) ?? cases[0];
  const emptyWorkspace = cases.length === 0;
  const canonicalSelected = selected?.id === record.case.id;
  const inMotion = canonicalSelected && record.commitment.status !== 'assigned';
  const latestEvent = [...record.events].reverse().find((item) => item.audience !== 'director');

  return (
    <AppFrame active="director" identity="Elena Torres" role="Director · Northstar">
      <section className={styles.heading}>
        <div><p>OPERATIONS / TUE 14 JUL / 08:42</p><h1>Where continuity can break today.</h1></div>
        <div className={styles.workspacePicker}><label htmlFor="director-workspace">Workspace</label><select id="director-workspace" value={workspace} onChange={(event) => { setReassignmentStatus(''); dispatch({ type: 'set_director_workspace', actorId: 'elena-torres', actorMembershipId: 'membership-elena', locationId: event.target.value as WorkspaceLocationId, idempotencyKey: `workspace:${event.target.value}:${Date.now()}` }); }}><option value="all">All locations</option><option value="northstar-portland">Portland</option><option value="northstar-beaverton">Beaverton</option></select><small>{workspace === 'all' ? 'Northstar Funeral Home' : `${location(record, workspace).name} location`}</small></div>
        <dl><div><dt>Active</dt><dd>{cases.length}</dd></div><div><dt>Waiting</dt><dd>{cases.filter((item) => item.risk === 'Waiting').length}</dd></div><div><dt>Unowned</dt><dd>0</dd></div></dl>
      </section>

      {emptyWorkspace ? <section className={styles.empty}><Signal tone="success">No open work</Signal><h2>No cases need attention in Beaverton.</h2><p>New intake and reassigned work will appear here.</p><a href="/director/intake">Start an intake <span>→</span></a></section> : <>

      <ContinuityRail
        label={`${selected.family} · ${selected.id}`}
        steps={[
          { label: 'Handoff', detail: selected.handoff, state: 'complete' },
          { label: 'Case', detail: selected.phase, state: 'complete' },
          { label: 'Owner', detail: selected.owner, state: 'current' },
          { label: 'Proof', detail: selected.proof, state: 'pending' },
        ]}
      />

      <div className={styles.commandGrid}>
        <section className={styles.focus} aria-labelledby="focus-title">
          <div className={styles.sectionHead}><span>FOCUS / 01</span><Signal tone={selected.risk === 'Waiting' ? 'warm' : 'signal'}>{selected.risk}</Signal></div>
          <div className={styles.caseIdentity}>
            <div><span>{selected.id}</span><h2 id="focus-title">{selected.family} family</h2><p>{selected.person} · {selected.phase}</p></div>
            <p>ACCOUNTABLE DIRECTOR<strong>{selected.owner}</strong><small>{location(record, selected.locationId).name} · assigned operator {canonicalSelected ? assignedOperator.name : selected.owner}</small></p>
          </div>
          <div className={styles.decision}>
            <span>NEXT COMMITMENT · DUE {selected.due}</span>
            <h3>{selected.commitment}</h3>
            <div className={styles.blocker}><b aria-hidden="true">!</b><p><span>WHAT IS BLOCKING FLOW</span>{selected.blocker}</p></div>
          </div>
          <div className={styles.proofBand}>
            <span>{canonicalSelected && record.commitment.status === 'proof_submitted' ? 'PROOF RECEIVED' : 'PROOF REQUIRED'}</span><strong>{selected.proof}</strong><i>{canonicalSelected && record.commitment.status === 'proof_submitted' ? `Awaiting review · next ${accountableDirector.name}` : inMotion ? 'Capture started' : 'Not captured'}</i>
          </div>
          <div className={styles.actions}>
            <a href="#ledger-title">View assignment <span>↓</span></a>
            <button disabled={!canonicalSelected || record.transferPass.status !== 'accepted' || record.case.status !== 'arrangements'} onClick={() => { setReassignTo(record.commitment.assignedMembershipId); setReassigning((value) => !value); setReassignError(''); setReassignmentStatus(''); }} type="button">Reassign work</button>
            <small>{record.transferPass.status !== 'accepted' ? 'Reassignment unlocks after the handoff is accepted and routed.' : 'Only the assigned staff member can start or complete this work.'}</small>
          </div>
          {reassigning && canonicalSelected && <form className={styles.reassign} onSubmit={(event) => { event.preventDefault(); const failure = validateReassignment(record, reassignTo, reason); if (failure) { setReassignError(failure); return; } const nextName = membership(record, reassignTo).actor.name; dispatch({ type: 'reassign_commitment', actorId: 'elena-torres', actorMembershipId: 'membership-elena', idempotencyKey: `reassign:${record.commitment.assignmentId}:${Date.now()}`, assigneeMembershipId: reassignTo, reason }); setReassignmentStatus(`${record.commitment.title} reassigned to ${nextName}. ${operatingLocation.name} stayed the operating location.`); setReassigning(false); setReason(''); }}><label>ASSIGN TO<select value={reassignTo} onChange={(event) => setReassignTo(event.target.value as MembershipId)}>{eligibleMemberships(record, record.case.operatingLocationId).map((item) => <option key={item.id} value={item.id}>{item.actor.name} · {item.role === 'director' ? 'Director' : 'Care coordinator'}</option>)}</select></label><label>REASON<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why ownership is changing" required /></label><button type="submit">Save reassignment</button>{reassignError && <p role="alert">{reassignError}</p>}<small>Only active {operatingLocation.name} team members are available. The reason is saved to the case event.</small></form>}
          {reassignmentStatus && <p className={styles.reassignmentStatus} role="status" aria-live="polite">{reassignmentStatus}</p>}
        </section>

        <aside className={styles.activity} aria-labelledby="activity-title">
          <div className={styles.sectionHead}><span id="activity-title">LIVE CHANGES</span><span>08:42</span></div>
          <ol>
            <li><time>{latestEvent?.occurredAt.slice(11, 16) ?? '08:42'}</time><i /><p><strong>{latestEvent?.actor.name ?? 'Maya Rivera'}</strong>{latestEvent?.summary ?? 'Family handoff issued.'}</p></li>
            <li><time>08:29</time><i /><p><strong>Provider ready</strong>Two receiving locations prepared · Chen</p></li>
            <li><time>08:10</time><i /><p><strong>Proof ready</strong>Keepsake artwork uploaded · Williams</p></li>
            <li><time>07:54</time><i /><p><strong>Ownership changed</strong>Patel assigned to Elena</p></li>
          </ol>
          <button disabled type="button">Full timeline follows this slice <span>{record.events.length}</span></button>
        </aside>
      </div>

      <section className={styles.ledger} aria-labelledby="ledger-title">
        <div className={styles.ledgerTitle}><div><span>DECISION LEDGER / 02</span><h2 id="ledger-title">Every case that needs judgment.</h2></div><p>Ordered by family wait and operational risk.</p></div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Risk</th><th>Case</th><th>Next commitment</th><th>Owner</th><th>Proof</th><th>Due</th></tr></thead>
            <tbody>{cases.map((item) => (
              <tr className={selected.id === item.id ? styles.selected : ''} key={item.id}>
                <td><button aria-label={`Focus ${item.family} case`} aria-pressed={selected.id === item.id} onClick={() => setSelectedId(item.id)} type="button"><Signal tone={item.risk === 'Waiting' ? 'warm' : item.risk === 'Stable' ? 'success' : 'signal'}>{item.risk}</Signal></button></td>
                <td><strong>{item.family}</strong><small>{item.id} · {item.phase}</small></td>
                <td>{item.commitment}</td><td>{item.id === record.case.id ? `${accountableDirector.name} / ${assignedOperator.name}` : item.owner}<small>{location(record, item.locationId).name}</small></td><td>{item.proof}</td><td><strong>{item.due}</strong><small>{item.id === record.case.id && inMotion ? 'In motion' : 'Open'}</small></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      </>}
    </AppFrame>
  );
}
