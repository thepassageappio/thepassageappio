'use client';

import { useState } from 'react';
import { usePassageZero } from '../../components/PassageZeroProvider';
import { AppFrame } from '../../components/operations/AppFrame';
import { ContinuityRail } from '../../components/operations/ContinuityRail';
import { Signal } from '../../components/operations/Signal';
import styles from './Director.module.css';

type CaseItem = {
  id: string; family: string; person: string; risk: 'Waiting' | 'Watch' | 'Stable';
  owner: string; due: string; commitment: string; blocker: string; proof: string;
  handoff: string; phase: string;
};

const SECONDARY_CASES: CaseItem[] = [
  { id: 'NS-2048', family: 'Chen', person: 'Arthur Chen', risk: 'Watch', owner: 'Marcus Lee', due: '11:15', commitment: 'Confirm the receiving location so transport can dispatch.', blocker: 'Two locations are ready; destination is unconfirmed.', proof: 'Destination + dispatch timestamp', handoff: 'Provider → Transport', phase: 'Arrival' },
  { id: 'NS-2043', family: 'Williams', person: 'James Williams', risk: 'Stable', owner: 'Avery Brooks', due: '13:00', commitment: 'Send the final keepsake proof for approval.', blocker: 'No blocker. Proof is ready.', proof: 'Family approval on final artwork', handoff: 'Care team → Family', phase: 'Service ready' },
  { id: 'NS-2039', family: 'Patel', person: 'Ravi Patel', risk: 'Watch', owner: 'Elena Torres', due: '15:30', commitment: 'Resolve the missing benefits document before aftercare call.', blocker: 'Family has not located the policy schedule.', proof: 'Document received or exception recorded', handoff: 'Family → Aftercare', phase: 'Aftercare' },
];

export default function DirectorPage() {
  const { record, dispatch } = usePassageZero();
  const canonical: CaseItem = {
    id: record.case.id, family: 'Rivera', person: record.person.name,
    risk: record.commitment.status === 'proof_submitted' ? 'Stable' : 'Waiting',
    owner: record.accountableDirector.name, due: '10:30', commitment: record.commitment.title,
    blocker: record.commitment.status === 'proof_submitted' ? 'Proof is waiting for director review.' : `${record.familyCoordinator.name} is waiting for the meeting time.`,
    proof: record.commitment.proof?.label ?? record.commitment.proofRequirement,
    handoff: 'Family → Arrangement', phase: record.case.status === 'arrangements' ? 'Arrangement' : 'Intake',
  };
  const cases = [canonical, ...SECONDARY_CASES];
  const [selectedId, setSelectedId] = useState(canonical.id);
  const selected = cases.find((item) => item.id === selectedId) ?? canonical;
  const canonicalSelected = selected.id === record.case.id;
  const inMotion = canonicalSelected && record.commitment.status !== 'assigned';
  const latestEvent = [...record.events].reverse().find((item) => item.audience !== 'director');

  return (
    <AppFrame active="director" identity="Elena Torres" role="Director · Northstar">
      <section className={styles.heading}>
        <div><p>OPERATIONS / TUE 14 JUL / 08:42</p><h1>Where continuity can break today.</h1></div>
        <dl><div><dt>Active</dt><dd>11</dd></div><div><dt>Waiting</dt><dd>1</dd></div><div><dt>Unowned</dt><dd>0</dd></div></dl>
      </section>

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
            <p>ACCOUNTABLE DIRECTOR<strong>{selected.owner}</strong><small>Assigned operator · {canonicalSelected ? record.assignedOperator.name : selected.owner}</small></p>
          </div>
          <div className={styles.decision}>
            <span>NEXT COMMITMENT · DUE {selected.due}</span>
            <h3>{selected.commitment}</h3>
            <div className={styles.blocker}><b aria-hidden="true">!</b><p><span>WHAT IS BLOCKING FLOW</span>{selected.blocker}</p></div>
          </div>
          <div className={styles.proofBand}>
            <span>{canonicalSelected && record.commitment.status === 'proof_submitted' ? 'PROOF RECEIVED' : 'PROOF REQUIRED'}</span><strong>{selected.proof}</strong><i>{canonicalSelected && record.commitment.status === 'proof_submitted' ? `Awaiting review · next ${record.accountableDirector.name}` : inMotion ? 'Capture started' : 'Not captured'}</i>
          </div>
          <div className={styles.actions}>
            <button disabled={!canonicalSelected || inMotion || record.transferPass.status !== 'accepted'} onClick={() => dispatch({ type: 'start_commitment', idempotencyKey: 'director:start:rivera' })} type="button">{record.transferPass.status !== 'accepted' ? 'Accept handoff before starting' : inMotion ? 'Commitment in motion' : 'Open commitment'}<span>↗</span></button>
            <button disabled type="button">Reassignment follows shared spine</button>
            <small>Actions append to the case record.</small>
          </div>
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
                <td>{item.commitment}</td><td>{item.id === record.case.id ? `${record.accountableDirector.name} / ${record.assignedOperator.name}` : item.owner}</td><td>{item.proof}</td><td><strong>{item.due}</strong><small>{item.id === record.case.id && inMotion ? 'In motion' : 'Open'}</small></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </AppFrame>
  );
}
