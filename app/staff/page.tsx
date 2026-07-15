'use client';

import { usePassageZero } from '../../components/PassageZeroProvider';
import { AppFrame } from '../../components/operations/AppFrame';
import { ContinuityRail } from '../../components/operations/ContinuityRail';
import { Signal } from '../../components/operations/Signal';
import styles from './Staff.module.css';
import { membership } from '../../lib/sandbox/repository';

export default function StaffPage() {
  const { record, dispatch, reset } = usePassageZero();
  const accountableDirector = membership(record, record.case.accountableMembershipId).actor;
  const assignedOperator = membership(record, record.commitment.assignedMembershipId).actor;
  const nextOwner = membership(record, record.commitment.nextOwnerMembershipId).actor;
  const isMine = record.case.operatingLocationId === record.workspaceContext.staffLocationId && record.commitment.assignedMembershipId === record.workspaceContext.staffMembershipId;
  const status = record.commitment.status === 'assigned' ? 'open' : record.commitment.status === 'in_progress' ? 'working' : 'proof';
  const item = {
    id: record.case.id, family: 'Rivera', due: '10:30', task: record.commitment.title,
    blocker: record.commitment.status === 'proof_submitted' ? 'None — proof is with the director.' : `${record.familyCoordinator.name} is waiting for the meeting time.`,
    proof: record.commitment.proof?.label ?? record.commitment.proofRequirement,
    next: nextOwner.name, state: status === 'proof' ? 'Ready' : 'Now',
  };

  return (
    <AppFrame active="staff" identity="Marcus Lee" role="Care coordinator · Northstar">
      <section className={styles.heading}>
        <div><p>MY WORK / TUE 14 JUL / 08:42</p><h1>One clear commitment at a time.</h1></div>
        <p><strong>{isMine ? 1 : 0} owned</strong><span>Portland · assigned to Marcus only</span></p>
      </section>

      {!isMine ? <section className={styles.empty} role="status"><Signal tone="success">No assigned work</Signal><h2>No work is assigned to you.</h2><p>New Portland commitments will appear here when a director assigns them.</p></section> : <>

      <ContinuityRail compact label={`${item.family} · ${item.id}`} steps={[
        { label: 'Handoff', detail: `${accountableDirector.name} → ${assignedOperator.name}`, state: 'complete' },
        { label: 'Case', detail: item.family, state: 'complete' },
        { label: 'Owner', detail: assignedOperator.name, state: status === 'proof' ? 'complete' : 'current' },
        { label: 'Proof', detail: item.proof, state: status === 'proof' ? 'complete' : 'pending' },
      ]} />

      <div className={styles.workspace}>
        <aside className={styles.queue} aria-labelledby="queue-title">
          <div className={styles.queueHead}><span id="queue-title">OWNED BY ME</span><strong>1</strong></div>
          <button aria-pressed="true" className={styles.active} type="button">
            <span>01</span><div><strong>{item.family}</strong><small>{item.task}</small></div><time>{item.due}</time>
          </button>
          <div className={styles.boundary}><Signal tone="success">Scope protected</Signal><p>You see only the case information required to complete your assigned work.</p></div>
        </aside>

        <section className={styles.commitment} aria-labelledby="commitment-title">
          <div className={styles.meta}><Signal tone={item.state === 'Now' ? 'warm' : item.state === 'Ready' ? 'success' : 'signal'}>{item.state}</Signal><span>{item.id} · DUE {item.due}</span></div>
          <div className={styles.body}>
            <span>NEXT OWNED COMMITMENT</span>
            <h2 id="commitment-title">{item.task}</h2>
            <div className={styles.boundaryLine}><span>CASE BOUNDARY</span><strong>{record.person.name} · {item.family} family</strong><small>Only the assigned commitment and required proof are shown here.</small></div>
          </div>
          <dl className={styles.conditions}>
            <div><dt>BLOCKER TO REMOVE</dt><dd>{item.blocker}</dd></div>
            <div><dt>PROOF OF COMPLETION</dt><dd>{item.proof}</dd></div>
            <div><dt>NEXT HANDOFF</dt><dd>{item.next}</dd></div>
          </dl>
          {status === 'proof' ? (
            <div className={styles.complete} role="status"><b aria-hidden="true">✓</b><p><strong>Proof received, awaiting review.</strong>{accountableDirector.name} is the next owner. The family sees only the returned outcome.</p><button onClick={reset} type="button">Reset sandbox story</button></div>
          ) : (
            <div className={styles.actions}>
              <button disabled={record.transferPass.status !== 'accepted'} onClick={() => dispatch(status === 'open' ? { type: 'start_commitment', actorId: 'marcus-lee', actorMembershipId: 'membership-marcus', idempotencyKey: 'staff:start:rivera' } : { type: 'submit_proof', actorId: 'marcus-lee', actorMembershipId: 'membership-marcus', idempotencyKey: 'staff:proof:rivera' })} type="button">{status === 'open' ? 'Start commitment' : 'Attach proof'}<span>→</span></button>
              <button disabled type="button">Blocker reporting follows this slice</button>
              <small>{record.transferPass.status !== 'accepted' ? 'Waiting for the director to accept the family handoff.' : status === 'working' ? 'Started now · visible to the case team.' : 'The action time, audience, and next owner are recorded in this browser sandbox.'}</small>
            </div>
          )}
        </section>
      </div>
      </>}
    </AppFrame>
  );
}
