'use client';

import { FormEvent, useState } from 'react';
import { usePassageZero } from '../../../components/PassageZeroProvider';
import { AppFrame } from '../../../components/operations/AppFrame';
import { ContinuityRail } from '../../../components/operations/ContinuityRail';
import { Signal } from '../../../components/operations/Signal';
import styles from './Intake.module.css';

type IntakeMode = 'pass' | 'manual';
type IntakeState = 'start' | 'verified' | 'created';

export default function DirectorIntakePage() {
  const { record, dispatch } = usePassageZero();
  const [mode, setMode] = useState<IntakeMode>('pass');
  const [state, setState] = useState<IntakeState>('start');
  const [code, setCode] = useState<string>(record.transferPass.code);
  const [person, setPerson] = useState('');
  const [familyContact, setFamilyContact] = useState('');
  const [error, setError] = useState('');

  function beginPass(event: FormEvent) {
    event.preventDefault();
    if (code.trim().toUpperCase() !== record.transferPass.code) {
      setError('Pass not found. Check the code or create a walk-in case.');
      return;
    }
    if (record.transferPass.status === 'revoked') {
      setError('This family pass was closed. Ask the family to issue a new handoff.');
      return;
    }
    if (record.transferPass.status === 'accepted') {
      setError(`This pass was already accepted into ${record.case.id}. Open the existing case instead.`);
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

  const casePerson = mode === 'pass' ? record.person.name : person;
  const caseFamily = mode === 'pass' ? record.familyCoordinator.name : familyContact;
  const location = record.location.name;
  const lead = record.accountableDirector.name;
  const displayedCaseId = mode === 'pass' ? record.case.id : 'LOCAL-DRAFT';

  return (
    <AppFrame active="intake" identity="Elena Torres" role="Director · Northstar">
      <section className={styles.heading}>
        <div><p>WALK-IN INTAKE</p><h1>Walk in. Working case.</h1></div>
        <Signal tone={state === 'created' ? 'success' : state === 'verified' ? 'signal' : 'warm'}>
          {state === 'created' ? mode === 'pass' ? 'Case created' : 'Draft prepared' : state === 'verified' ? mode === 'pass' ? 'Ready to create' : 'Ready to prepare' : 'No re-keying'}
        </Signal>
      </section>

      <ContinuityRail
        label={state === 'created' ? `${mode === 'pass' ? 'Rivera' : casePerson} · ${displayedCaseId}` : mode === 'pass' ? code : 'New walk-in'}
        steps={[
          { label: 'Source', detail: mode === 'pass' ? 'Family Transfer Pass' : 'Director quick intake', state: 'complete' },
          { label: 'Case', detail: state === 'created' ? displayedCaseId : 'Create destination', state: state === 'created' ? 'complete' : 'current' },
          { label: 'Owner', detail: lead, state: state === 'created' || record.transferPass.status === 'accepted' ? 'complete' : 'pending' },
          { label: 'Sync', detail: mode === 'pass' ? state === 'created' ? 'Sandbox adapter queued' : 'After case creation' : 'Not queued · local draft', state: mode === 'pass' && state === 'created' ? 'current' : 'pending' },
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
            <div><span>{mode === 'pass' ? 'VERIFIED FAMILY HANDOFF' : 'MINIMAL WALK-IN'}</span><h2 id="intake-review-title">{casePerson}</h2><p>{caseFamily}{mode === 'pass' ? ' · family coordinator' : ' · family contact'}</p></div>
            <button onClick={() => reset(mode)} type="button">Start over</button>
          </div>

          <div className={styles.reviewGrid}>
            <section>
              <span>CASE SOURCE</span>
              <strong>{mode === 'pass' ? record.transferPass.code : 'Director quick intake'}</strong>
              <ul>{mode === 'pass' ? record.transferPass.scope.map((item) => <li key={item.name}>{item.name}<b>Included</b></li>) : <li>Person + family contact<b>Included</b></li>}</ul>
            </section>
            <form onSubmit={(event) => { event.preventDefault(); if (mode === 'pass') dispatch({ type: 'accept_transfer_pass', idempotencyKey: 'intake:accept:rivera' }); setState('created'); }}>
              <label>OPERATING LOCATION<select value={location} disabled><option>{location}</option></select></label>
              <label>ACCOUNTABLE DIRECTOR<select value={lead} disabled><option>{lead}</option></select></label>
              <div className={styles.firstCommitment}><span>{mode === 'pass' ? 'FIRST COMMITMENT' : 'LOCAL DRAFT'}</span><strong>{mode === 'pass' ? record.commitment.title : 'Collect the missing family-approved information'}</strong><small>{mode === 'pass' ? `Assigned to ${record.assignedOperator.name} · accountable ${lead}` : 'This draft is not added to the shared demo case.'}</small></div>
              <button className={styles.createButton} type="submit">{mode === 'pass' ? 'Create case' : 'Prepare intake draft'} <span>→</span></button>
            </form>
          </div>
        </section>
      )}

      {state === 'created' && (
        <section className={styles.receipt} aria-labelledby="case-created-title">
          <div className={styles.receiptMark} aria-hidden="true">✓</div>
          <div><span>{mode === 'pass' ? `CASE CREATED / ${record.case.id}` : 'LOCAL INTAKE DRAFT'}</span><h2 id="case-created-title">{mode === 'pass' ? `${casePerson} is ready for arrangement.` : `${casePerson}'s minimum details are ready for follow-up.`}</h2><p>{mode === 'pass' ? `${lead} is accountable; ${record.assignedOperator.name} owns the first commitment at ${location}.` : 'Missing information remains a guided next step. No shared case was created.'}</p></div>
          <dl><div><dt>Source</dt><dd>{mode === 'pass' ? record.transferPass.code : 'Walk-in draft'}</dd></div><div><dt>Family contact</dt><dd>{caseFamily}</dd></div><div><dt>{mode === 'pass' ? 'Director' : 'Missing-information queue'}</dt><dd>{mode === 'pass' ? lead : 'Identity, timing, consent scope'}</dd></div><div><dt>Sandbox state</dt><dd>{mode === 'pass' ? 'Saved in this browser only' : 'Local to this intake screen'}</dd></div></dl>
          <div className={styles.receiptActions}>{mode === 'pass' && <a href="/director">Open {record.case.id} <span>↗</span></a>}<button onClick={() => reset('pass')} type="button">Receive another family</button></div>
        </section>
      )}
    </AppFrame>
  );
}
