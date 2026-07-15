'use client';

import { useState } from 'react';
import { AppFrame } from '../../components/operations/AppFrame';
import { ContinuityRail } from '../../components/operations/ContinuityRail';
import { Signal } from '../../components/operations/Signal';
import styles from './Staff.module.css';

const OWNED = [
  { id: 'NS-2048', family: 'Chen', due: '11:15', task: 'Confirm the receiving location with transport.', blocker: 'Destination confirmation', proof: 'Location + dispatch timestamp', next: 'Transport dispatch', state: 'Now' },
  { id: 'NS-2043', family: 'Williams', due: '13:00', task: 'Send the final keepsake proof for approval.', blocker: 'None — proof is ready', proof: 'Family approval response', next: 'Service readiness', state: 'Ready' },
  { id: 'NS-2054', family: 'Okafor', due: '14:20', task: 'Call the cemetery to hold the selected time.', blocker: 'Schedule confirmation', proof: 'Hold reference number', next: 'Family choice', state: 'Later' },
];

export default function StaffPage() {
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<'open' | 'working' | 'proof'>('open');
  const item = OWNED[selected];

  function selectItem(index: number) { setSelected(index); setStatus('open'); }

  return (
    <AppFrame active="staff" identity="Marcus Lee" role="Care coordinator · Northstar">
      <section className={styles.heading}>
        <div><p>MY WORK / TUE 14 JUL / 08:42</p><h1>One clear commitment at a time.</h1></div>
        <p><strong>{OWNED.length} owned</strong><span>Nothing unassigned</span></p>
      </section>

      <ContinuityRail compact label={`${item.family} · ${item.id}`} steps={[
        { label: 'Handoff', detail: 'Director → Marcus', state: 'complete' },
        { label: 'Case', detail: item.family, state: 'complete' },
        { label: 'Owner', detail: 'Marcus Lee', state: 'current' },
        { label: 'Proof', detail: item.proof, state: status === 'proof' ? 'complete' : 'pending' },
      ]} />

      <div className={styles.workspace}>
        <aside className={styles.queue} aria-labelledby="queue-title">
          <div className={styles.queueHead}><span id="queue-title">OWNED BY ME</span><strong>{OWNED.length}</strong></div>
          {OWNED.map((task, index) => (
            <button aria-pressed={selected === index} className={selected === index ? styles.active : ''} key={task.id} onClick={() => selectItem(index)} type="button">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{task.family}</strong><small>{task.task}</small></div>
              <time>{task.due}</time>
            </button>
          ))}
          <div className={styles.boundary}><Signal tone="success">Scope protected</Signal><p>You see only the case information required to complete your assigned work.</p></div>
        </aside>

        <section className={styles.commitment} aria-labelledby="commitment-title">
          <div className={styles.meta}><Signal tone={item.state === 'Now' ? 'warm' : item.state === 'Ready' ? 'success' : 'signal'}>{item.state}</Signal><span>{item.id} · DUE {item.due}</span></div>
          <div className={styles.body}>
            <span>NEXT OWNED COMMITMENT</span>
            <h2 id="commitment-title">{item.task}</h2>
            <div className={styles.boundaryLine}><span>CASE BOUNDARY</span><strong>{item.family} family</strong><small>Only relevant coordination details are shown here.</small></div>
          </div>
          <dl className={styles.conditions}>
            <div><dt>BLOCKER TO REMOVE</dt><dd>{item.blocker}</dd></div>
            <div><dt>PROOF OF COMPLETION</dt><dd>{item.proof}</dd></div>
            <div><dt>NEXT HANDOFF</dt><dd>{item.next}</dd></div>
          </dl>
          {status === 'proof' ? (
            <div className={styles.complete} role="status"><b aria-hidden="true">✓</b><p><strong>Proof attached to the case record.</strong>This commitment is ready for the next owner.</p><button onClick={() => setStatus('open')} type="button">Undo demo</button></div>
          ) : (
            <div className={styles.actions}>
              <button onClick={() => setStatus(status === 'open' ? 'working' : 'proof')} type="button">{status === 'open' ? 'Start commitment' : 'Attach proof'}<span>→</span></button>
              <button type="button">Report a blocker</button>
              <small>{status === 'working' ? 'Started at 08:42 · visible to Director' : 'Start time and proof are recorded.'}</small>
            </div>
          )}
        </section>
      </div>
    </AppFrame>
  );
}
