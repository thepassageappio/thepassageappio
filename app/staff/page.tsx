'use client';

import { useState } from 'react';
import { usePassageZero } from '../../components/PassageZeroProvider';
import { AppFrame } from '../../components/operations/AppFrame';
import { ContinuityRail } from '../../components/operations/ContinuityRail';
import { Signal } from '../../components/operations/Signal';
import { assignedCommitments, caseById, location, membership } from '../../lib/sandbox/repository';
import type { CommitmentId, MembershipId, SandboxActor } from '../../lib/sandbox/types';
import styles from './Staff.module.css';

export default function StaffPage() {
  const { record, dispatch, reset } = usePassageZero();
  const identityId = record.workspaceContext.staffMembershipId;
  const identity = membership(record, identityId);
  const owned = assignedCommitments(record, identityId);
  const staffIdentities = record.memberships.filter((item) => item.active);
  const [selectedId, setSelectedId] = useState<CommitmentId>('confirm-arrangement-meeting');
  const [reviewStatus, setReviewStatus] = useState('');
  const selected = owned.find((item) => item.id === selectedId) ?? owned[0];
  const itemCase = selected ? caseById(record, selected.caseId) : null;
  const accountable = itemCase ? membership(record, itemCase.accountableMembershipId) : null;
  const actionBlocked = selected?.caseId === 'NS-2051' && record.transferPass.status !== 'accepted';

  return (
    <AppFrame active="staff" identity={identity.actor.name} role={`${identity.role === 'director' ? 'Director' : 'Care coordinator'} · Northstar`}>
      <section className={styles.heading}>
        <div><p>MY WORK / TODAY</p><h1>Only the work assigned to you.</h1></div>
        <div className={styles.identityPicker}><label htmlFor="staff-identity">Sandbox staff identity</label><select id="staff-identity" value={identityId} onChange={(event) => { const nextId = event.target.value as MembershipId; const next = membership(record, nextId); setReviewStatus(''); dispatch({ type: 'set_staff_identity', actorId: next.actor.id as SandboxActor['id'], actorMembershipId: nextId, idempotencyKey: `staff-identity:${nextId}:${Date.now()}` }); }}>{staffIdentities.map((item) => { const count = assignedCommitments(record, item.id).length; return <option key={item.id} value={item.id}>{item.actor.name} · {count} {count === 1 ? 'commitment' : 'commitments'}</option>; })}</select><small>Preview only — switching identity changes this seeded workspace. It does not sign in or grant access.</small></div>
        <p><strong>{owned.length} owned</strong><span>{identity.locationScope === 'organization' ? 'All authorized locations' : `${location(record, identity.locationScope).name} · assigned only`}</span></p>
      </section>

      {!selected || !itemCase ? <section className={styles.empty} role="status"><Signal tone="success">No assigned work</Signal><h2>No work is assigned to you.</h2><p>New commitments will appear here when a director assigns them.</p></section> : <>
        <ContinuityRail compact label={`${itemCase.family} · ${itemCase.id}`} steps={[{ label: 'Case', detail: itemCase.phase, state: 'complete' }, { label: 'Owner', detail: identity.actor.name, state: 'complete' }, { label: 'Action', detail: selected.title, state: selected.status === 'assigned' ? 'current' : 'complete' }, { label: 'Proof', detail: selected.proof?.label ?? selected.proofRequirement, state: selected.proof ? 'complete' : 'pending' }]} />
        <div className={styles.workspace}>
          <aside className={styles.queue} aria-labelledby="queue-title"><div className={styles.queueHead}><span id="queue-title">OWNED BY ME</span><strong>{owned.length}</strong></div>{owned.map((item, index) => { const queueCase = caseById(record, item.caseId); return <button aria-pressed={selected.id === item.id} className={selected.id === item.id ? styles.active : ''} key={item.id} onClick={() => { setSelectedId(item.id); setReviewStatus(''); }} type="button"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{queueCase.family}</strong><small>{item.title}</small></div><time>{item.due}</time></button>; })}<div className={styles.boundary}><Signal tone="success">Scope protected</Signal><p>You see only the cases and commitments assigned to this identity.</p></div></aside>
          <section className={styles.commitment} aria-labelledby="commitment-title">
            <div className={styles.meta}><Signal tone={selected.status === 'proof_submitted' ? 'success' : selected.status === 'in_progress' ? 'signal' : 'warm'}>{selected.status === 'proof_submitted' ? 'Proof ready' : selected.status === 'in_progress' ? 'In progress' : 'Now'}</Signal><span>{itemCase.id} · {location(record, itemCase.operatingLocationId).name} · DUE {selected.due}</span></div>
            <div className={styles.body}><span>NEXT OWNED COMMITMENT</span><h2 id="commitment-title">{selected.title}</h2><div className={styles.boundaryLine}><span>CASE BOUNDARY</span><strong>{itemCase.personName} · {itemCase.family} family</strong><small>Only the assigned commitment and required case context are shown here.</small></div></div>
            <dl className={styles.taskContract}>
              <div><dt>OWNER</dt><dd>{identity.actor.name}</dd></div><div><dt>WAITING</dt><dd>{selected.waitingParty}</dd></div>
              <div><dt>AUDIENCE</dt><dd>{selected.output?.audience.replace('Audience: ', '') ?? 'Northstar case team'}</dd></div><div><dt>AUTOMATION</dt><dd>{selected.output?.automationLabel.replace('Automation: ', '') ?? 'Manual'}</dd></div>
              <div><dt>PREPARED</dt><dd>{selected.output?.body ?? 'No output prepared'}</dd></div><div><dt>HUMAN ACTION</dt><dd>{selected.output?.cta ?? (selected.status === 'assigned' ? 'Start the commitment' : 'Attach the required proof')}</dd></div>
              <div><dt>PROOF DESTINATION</dt><dd>{selected.proofRequirement}</dd></div><div><dt>NEXT STATE / OWNER</dt><dd>Proof submitted · {accountable?.actor.name}</dd></div>
            </dl>
            {selected.output && <section className={styles.preparedOutput} aria-label="Prepared output"><span>{selected.output.eyebrow}</span><h3>{selected.output.audience}</h3><p>{selected.output.body}</p><div><strong>{selected.output.automationLabel}</strong><strong>{selected.output.boundaryLabel}</strong></div>{selected.output.cta && <button onClick={() => { dispatch({ type: 'mark_output_review_ready', actorId: identity.actor.id as SandboxActor['id'], actorMembershipId: identity.id, commitmentId: selected.id, idempotencyKey: `review:${selected.id}:${Date.now()}` }); setReviewStatus('Review-ready event saved. No message was sent.'); }} type="button">{selected.output.cta}</button>}<small>{selected.output.helper}</small>{reviewStatus && <b role="status">{reviewStatus}</b>}</section>}
            {selected.status === 'proof_submitted' ? <div className={styles.complete} role="status"><b aria-hidden="true">✓</b><p><strong>Proof received, awaiting review.</strong>{accountable?.actor.name} is the next owner. The family sees only the returned outcome.</p><button onClick={reset} type="button">Reset sandbox story</button></div> : <div className={styles.actions}><button disabled={actionBlocked} onClick={() => dispatch(selected.status === 'assigned' ? { type: 'start_commitment', actorId: identity.actor.id as SandboxActor['id'], actorMembershipId: identity.id, commitmentId: selected.id, idempotencyKey: `start:${selected.id}:${Date.now()}` } : { type: 'submit_proof', actorId: identity.actor.id as SandboxActor['id'], actorMembershipId: identity.id, commitmentId: selected.id, idempotencyKey: `proof:${selected.id}:${Date.now()}` })} type="button">{selected.status === 'assigned' ? 'Start commitment' : 'Attach proof'}<span>→</span></button><small>{actionBlocked ? 'Waiting for the director to accept the Rivera family handoff.' : 'The action, audience, proof destination, and next owner are recorded in this browser sandbox.'}</small></div>}
          </section>
        </div>
      </>}
    </AppFrame>
  );
}
