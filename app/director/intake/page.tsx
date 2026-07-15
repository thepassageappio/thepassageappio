'use client';

import { FormEvent, useState } from 'react';
import { AppFrame } from '../../../components/operations/AppFrame';
import { ContinuityRail } from '../../../components/operations/ContinuityRail';
import { Signal } from '../../../components/operations/Signal';
import styles from './Intake.module.css';

type IntakeMode = 'pass' | 'manual';
type IntakeState = 'start' | 'verified' | 'created';

const transferPass = {
  code: 'PASS-RIVERA-7K4M',
  person: 'Sofia Rivera',
  family: 'Maya Rivera',
  relationship: 'Daughter · family coordinator',
  scope: ['Identity + contacts', 'Current care', 'Service wishes', 'Selected documents'],
};

export default function DirectorIntakePage() {
  const [mode, setMode] = useState<IntakeMode>('pass');
  const [state, setState] = useState<IntakeState>('start');
  const [code, setCode] = useState(transferPass.code);
  const [person, setPerson] = useState('');
  const [familyContact, setFamilyContact] = useState('');
  const [location, setLocation] = useState('Northstar · Portland');
  const [lead, setLead] = useState('Elena Torres');
  const [error, setError] = useState('');

  function beginPass(event: FormEvent) {
    event.preventDefault();
    if (code.trim().toUpperCase() !== transferPass.code) {
      setError('Pass not found. Check the code or create a walk-in case.');
      return;
    }
    setError('');
    setState('verified');
  }

  function beginManual(event: FormEvent) {
    event.preventDefault();
    if (!person.trim() || !familyContact.trim()) {
      setError('Add the person and one family contact.');
      return;
    }
    setError('');
    setState('verified');
  }

  function reset(nextMode: IntakeMode) {
    setMode(nextMode);
    setState('start');
    setError('');
  }

  const casePerson = mode === 'pass' ? transferPass.person : person;
  const caseFamily = mode === 'pass' ? transferPass.family : familyContact;

  return (
    <AppFrame active="intake" identity="Elena Torres" role="Director · Northstar">
      <section className={styles.heading}>
        <div><p>WALK-IN INTAKE</p><h1>Walk in. Working case.</h1></div>
        <Signal tone={state === 'created' ? 'success' : state === 'verified' ? 'signal' : 'warm'}>
          {state === 'created' ? 'Case created' : state === 'verified' ? 'Ready to create' : 'No re-keying'}
        </Signal>
      </section>

      <ContinuityRail
        label={state === 'created' ? 'Rivera · NS-2051' : mode === 'pass' ? code : 'New walk-in'}
        steps={[
          { label: 'Source', detail: mode === 'pass' ? 'Family Transfer Pass' : 'Director quick intake', state: 'complete' },
          { label: 'Case', detail: state === 'created' ? 'NS-2051' : 'Create destination', state: state === 'created' ? 'complete' : 'current' },
          { label: 'Owner', detail: lead, state: state === 'created' ? 'complete' : 'pending' },
          { label: 'Sync', detail: state === 'created' ? 'Queued for case system' : 'After case creation', state: state === 'created' ? 'current' : 'pending' },
        ]}
      />

      {state === 'start' && (
        <section className={styles.startGrid} aria-label="Intake method">
          <form className={mode === 'pass' ? styles.primaryMethod : styles.method} onSubmit={beginPass}>
            <div className={styles.methodHead}><span>01</span><Signal tone="success">Fastest</Signal></div>
            <h2>Scan family pass</h2>
            <label htmlFor="walk-in-pass">TRANSFER PASS</label>
            <div className={styles.codeRow}>
              <input id="walk-in-pass" onChange={(event) => setCode(event.target.value)} value={code} />
              <button type="submit">Open pass</button>
            </div>
            <small>Approved information creates the case. The family does not repeat intake.</small>
          </form>

          <form className={mode === 'manual' ? styles.primaryMethod : styles.method} onSubmit={beginManual}>
            <div className={styles.methodHead}><span>02</span><Signal tone="signal">No pass</Signal></div>
            <h2>Quick walk-in</h2>
            <div className={styles.twoFields}>
              <label>PERSON<input aria-label="Person" onChange={(event) => setPerson(event.target.value)} placeholder="Full name" value={person} /></label>
              <label>FAMILY CONTACT<input aria-label="Family contact" onChange={(event) => setFamilyContact(event.target.value)} placeholder="Name" value={familyContact} /></label>
            </div>
            <button className={styles.manualButton} onClick={() => setMode('manual')} type="submit">Create minimal case</button>
            <small>Passage creates a missing-information queue instead of a long intake form.</small>
          </form>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </section>
      )}

      {state === 'verified' && (
        <section className={styles.review} aria-labelledby="intake-review-title">
          <div className={styles.reviewHead}>
            <div><span>{mode === 'pass' ? 'VERIFIED FAMILY HANDOFF' : 'MINIMAL WALK-IN'}</span><h2 id="intake-review-title">{casePerson}</h2><p>{caseFamily}{mode === 'pass' ? ` · ${transferPass.relationship}` : ' · family contact'}</p></div>
            <button onClick={() => reset(mode)} type="button">Start over</button>
          </div>

          <div className={styles.reviewGrid}>
            <section>
              <span>CASE SOURCE</span>
              <strong>{mode === 'pass' ? transferPass.code : 'Director quick intake'}</strong>
              <ul>{mode === 'pass' ? transferPass.scope.map((item) => <li key={item}>{item}<b>Included</b></li>) : <li>Person + family contact<b>Included</b></li>}</ul>
            </section>
            <form onSubmit={(event) => { event.preventDefault(); setState('created'); }}>
              <label>OPERATING LOCATION<select onChange={(event) => setLocation(event.target.value)} value={location}><option>Northstar · Portland</option><option>Northstar · Beaverton</option></select></label>
              <label>LEAD DIRECTOR<select onChange={(event) => setLead(event.target.value)} value={lead}><option>Elena Torres</option><option>Marcus Lee</option><option>Avery Brooks</option></select></label>
              <div className={styles.firstCommitment}><span>FIRST COMMITMENT</span><strong>Confirm arrangement meeting</strong><small>Due in 30 minutes · owned by {lead}</small></div>
              <button className={styles.createButton} type="submit">Create case <span>→</span></button>
            </form>
          </div>
        </section>
      )}

      {state === 'created' && (
        <section className={styles.receipt} aria-labelledby="case-created-title">
          <div className={styles.receiptMark} aria-hidden="true">✓</div>
          <div><span>CASE CREATED / NS-2051</span><h2 id="case-created-title">{casePerson} is ready for arrangement.</h2><p>{lead} owns the first commitment at {location}.</p></div>
          <dl><div><dt>Source</dt><dd>{mode === 'pass' ? transferPass.code : 'Walk-in'}</dd></div><div><dt>Family contact</dt><dd>{caseFamily}</dd></div><div><dt>Owner</dt><dd>{lead}</dd></div><div><dt>System sync</dt><dd>Queued · no action needed</dd></div></dl>
          <div className={styles.receiptActions}><a href="/director">Open NS-2051 <span>↗</span></a><button onClick={() => reset('pass')} type="button">Receive another family</button></div>
        </section>
      )}
    </AppFrame>
  );
}
