'use client';

import { useMemo, useState } from 'react';
import { AppFrame } from '../../components/operations/AppFrame';
import { ContinuityRail } from '../../components/operations/ContinuityRail';
import { Signal } from '../../components/operations/Signal';
import styles from './Director.module.css';

type CaseItem = {
  id: string; family: string; person: string; risk: 'Waiting' | 'Watch' | 'Stable';
  owner: string; due: string; commitment: string; blocker: string; proof: string;
  handoff: string; phase: string;
};

const CASES: CaseItem[] = [
  { id: 'NS-2051', family: 'Rivera', person: 'Sofia Rivera', risk: 'Waiting', owner: 'Elena Torres', due: '10:30', commitment: 'Confirm the ceremony venue before the preferred time is released.', blocker: 'Family needs one recommendation, not another list of options.', proof: 'Venue confirmation + family acknowledgment', handoff: 'Family → Arrangement', phase: 'Arrangement' },
  { id: 'NS-2048', family: 'Chen', person: 'Arthur Chen', risk: 'Watch', owner: 'Marcus Lee', due: '11:15', commitment: 'Confirm the receiving location so transport can dispatch.', blocker: 'Two locations are ready; destination is unconfirmed.', proof: 'Destination + dispatch timestamp', handoff: 'Provider → Transport', phase: 'Arrival' },
  { id: 'NS-2043', family: 'Williams', person: 'James Williams', risk: 'Stable', owner: 'Avery Brooks', due: '13:00', commitment: 'Send the final keepsake proof for approval.', blocker: 'No blocker. Proof is ready.', proof: 'Family approval on final artwork', handoff: 'Care team → Family', phase: 'Service ready' },
  { id: 'NS-2039', family: 'Patel', person: 'Ravi Patel', risk: 'Watch', owner: 'Elena Torres', due: '15:30', commitment: 'Resolve the missing benefits document before aftercare call.', blocker: 'Family has not located the policy schedule.', proof: 'Document received or exception recorded', handoff: 'Family → Aftercare', phase: 'Aftercare' },
];

export default function DirectorPage() {
  const [selectedId, setSelectedId] = useState(CASES[0].id);
  const [inMotion, setInMotion] = useState<string[]>([]);
  const selected = useMemo(() => CASES.find((item) => item.id === selectedId) ?? CASES[0], [selectedId]);

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
            <p>OWNED BY<strong>{selected.owner}</strong></p>
          </div>
          <div className={styles.decision}>
            <span>NEXT COMMITMENT · DUE {selected.due}</span>
            <h3>{selected.commitment}</h3>
            <div className={styles.blocker}><b aria-hidden="true">!</b><p><span>WHAT IS BLOCKING FLOW</span>{selected.blocker}</p></div>
          </div>
          <div className={styles.proofBand}>
            <span>PROOF REQUIRED</span><strong>{selected.proof}</strong><i>{inMotion.includes(selected.id) ? 'Capture started' : 'Not captured'}</i>
          </div>
          <div className={styles.actions}>
            <button onClick={() => setInMotion((ids) => ids.includes(selected.id) ? ids : [...ids, selected.id])} type="button">{inMotion.includes(selected.id) ? 'Commitment in motion' : 'Open commitment'}<span>↗</span></button>
            <button type="button">Change owner</button>
            <small>Actions append to the case record.</small>
          </div>
        </section>

        <aside className={styles.activity} aria-labelledby="activity-title">
          <div className={styles.sectionHead}><span id="activity-title">LIVE CHANGES</span><span>08:42</span></div>
          <ol>
            <li><time>08:37</time><i /><p><strong>Family replied</strong>Accessibility needs confirmed · Rivera</p></li>
            <li><time>08:29</time><i /><p><strong>Provider ready</strong>Two receiving locations prepared · Chen</p></li>
            <li><time>08:10</time><i /><p><strong>Proof ready</strong>Keepsake artwork uploaded · Williams</p></li>
            <li><time>07:54</time><i /><p><strong>Ownership changed</strong>Patel assigned to Elena</p></li>
          </ol>
          <button type="button">Open complete timeline <span>18</span></button>
        </aside>
      </div>

      <section className={styles.ledger} aria-labelledby="ledger-title">
        <div className={styles.ledgerTitle}><div><span>DECISION LEDGER / 02</span><h2 id="ledger-title">Every case that needs judgment.</h2></div><p>Ordered by family wait and operational risk.</p></div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>Risk</th><th>Case</th><th>Next commitment</th><th>Owner</th><th>Proof</th><th>Due</th></tr></thead>
            <tbody>{CASES.map((item) => (
              <tr className={selected.id === item.id ? styles.selected : ''} key={item.id}>
                <td><button aria-label={`Focus ${item.family} case`} aria-pressed={selected.id === item.id} onClick={() => setSelectedId(item.id)} type="button"><Signal tone={item.risk === 'Waiting' ? 'warm' : item.risk === 'Stable' ? 'success' : 'signal'}>{item.risk}</Signal></button></td>
                <td><strong>{item.family}</strong><small>{item.id} · {item.phase}</small></td>
                <td>{item.commitment}</td><td>{item.owner}</td><td>{item.proof}</td><td><strong>{item.due}</strong><small>{inMotion.includes(item.id) ? 'In motion' : 'Open'}</small></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </AppFrame>
  );
}
