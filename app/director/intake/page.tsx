'use client';

import { FormEvent, useState } from 'react';
import { usePassageZero } from '../../../components/PassageZeroProvider';
import { AppFrame } from '../../../components/operations/AppFrame';
import { ContinuityRail } from '../../../components/operations/ContinuityRail';
import { Signal } from '../../../components/operations/Signal';
import styles from './Intake.module.css';
import { eligibleMemberships, location as findLocation, membership, validateIntakeRoute } from '../../../lib/sandbox/repository';
import type { LocationId, MembershipId } from '../../../lib/sandbox/types';

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
  const [locationId, setLocationId] = useState<LocationId>('northstar-portland');
  const [accountableId, setAccountableId] = useState<MembershipId>('membership-elena');
  const [assigneeId, setAssigneeId] = useState<MembershipId>('membership-marcus');

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
  const operatingLocation = findLocation(record, locationId);
  const lead = membership(record, accountableId).actor;
  const assignee = membership(record, assigneeId).actor;
  const scopedMembers = eligibleMemberships(record, locationId);
  const displayedCaseId = mode === 'pass' ? record.case.id : 'LOCAL-DRAFT';

  return (
    <AppFrame active="intake" identity="Elena Torres" role="Director · Northstar">
      <section className={styles.heading}>
        <div><p>PREVIEW DEMO · CHANGES STAY ON THIS DEVICE</p><h1>Start a case for a family.</h1><small>This demo will not create a real case, contact anyone, or update your organization.</small></div>
        <Signal tone={state === 'created' ? 'success' : state === 'verified' ? 'signal' : 'warm'}>
          {state === 'created' ? mode === 'pass' ? 'Case created' : 'Draft prepared' : state === 'verified' ? mode === 'pass' ? 'Ready to create' : 'Ready to prepare' : 'No re-keying'}
        </Signal>
      </section>

      <ContinuityRail
        label={state === 'created' ? `${mode === 'pass' ? 'Rivera' : casePerson} · ${displayedCaseId}` : mode === 'pass' ? code : 'New walk-in'}
        steps={[
          { label: 'Source', detail: mode === 'pass' ? 'Family Transfer Pass' : 'Director quick intake', state: 'complete' },
          { label: 'Case', detail: state === 'created' ? displayedCaseId : 'Create destination', state: state === 'created' ? 'complete' : 'current' },
          { label: 'Owner', detail: lead.name, state: state === 'created' || record.transferPass.status === 'accepted' ? 'complete' : 'pending' },
          { label: 'Sync', detail: mode === 'pass' ? state === 'created' ? 'External sync not connected' : 'After case creation' : 'Not queued · local draft', state: mode === 'pass' && state === 'created' ? 'current' : 'pending' },
        ]}
      />

      {state === 'start' && (
        <section className={styles.startGrid} aria-label="Intake method">
          <form className={mode === 'pass' ? styles.primaryMethod : styles.method} onSubmit={beginPass}>
            <div className={styles.methodHead}><span>01</span><Signal tone="success">Fastest</Signal></div>
            <h2>Use a Transfer Pass</h2>
            <label htmlFor="walk-in-pass">TRANSFER PASS</label>
            <div className={styles.codeRow}>
              <input id="walk-in-pass" onChange={(event) => setCode(event.target.value)} value={code} />
              <button type="submit">Open pass</button>
            </div>
            <small>Approved information creates the case. The family does not repeat intake.</small>
          </form>

          <form className={mode === 'manual' ? styles.primaryMethod : styles.method} onSubmit={beginManual}>
            <div className={styles.methodHead}><span>02</span><Signal tone="signal">No pass</Signal></div>
            <h2>Start without a pass</h2>
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
            <form onSubmit={(event) => { event.preventDefault(); if (mode === 'pass') { const failure = validateIntakeRoute(record, locationId, accountableId, assigneeId); if (failure) { setError(failure); return; } dispatch({ type: 'route_intake', actorId: 'elena-torres', actorMembershipId: 'membership-elena', idempotencyKey: `intake:route:rivera:${locationId}`, locationId, accountableMembershipId: accountableId, assigneeMembershipId: assigneeId }); } setError(''); setState('created'); }}>
              <label>OPERATING LOCATION<select value={locationId} onChange={(event) => { const next = event.target.value as LocationId; const rule = record.routingRules.find((item) => item.locationId === next)!; setLocationId(next); setAccountableId(rule.accountableMembershipId); setAssigneeId(rule.firstAssigneeMembershipId); }}><option value="northstar-portland">Portland</option><option value="northstar-beaverton">Beaverton</option></select></label>
              <label>ACCOUNTABLE DIRECTOR<select value={accountableId} onChange={(event) => setAccountableId(event.target.value as MembershipId)}>{scopedMembers.filter((item) => item.role === 'director').map((item) => <option key={item.id} value={item.id}>{item.actor.name}</option>)}</select></label>
              <label>FIRST ASSIGNEE<select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value as MembershipId)}>{scopedMembers.map((item) => <option key={item.id} value={item.id}>{item.actor.name} · {item.role === 'director' ? 'Director' : 'Care coordinator'}</option>)}</select></label>
              <div className={styles.firstCommitment}><span>{mode === 'pass' ? 'WHAT THIS PREVIEW WILL SHOW' : 'PREVIEW DRAFT'}</span><strong>{mode === 'pass' ? `${operatingLocation.name} · ${record.commitment.title}` : 'Collect the missing family-approved information'}</strong><small>{mode === 'pass' ? `${lead.name} leads this preview; ${assignee.name} owns the first step. No real case will be created or synced.` : 'This preview draft stays on this device and is not added to a shared case.'}</small></div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button className={styles.createButton} type="submit">{mode === 'pass' ? 'Create preview case' : 'Prepare preview draft'} <span>→</span></button>
            </form>
          </div>
        </section>
      )}

      {state === 'created' && (
        <section className={styles.receipt} aria-labelledby="case-created-title">
          <div className={styles.receiptMark} aria-hidden="true">✓</div>
          <div><span>{mode === 'pass' ? `PREVIEW CASE / ${record.case.id}` : 'PREVIEW INTAKE DRAFT'}</span><h2 id="case-created-title">{mode === 'pass' ? `Preview case created on this device.` : `${casePerson}'s preview details are ready for follow-up.`}</h2><p>{mode === 'pass' ? `${lead.name} would lead; ${assignee.name} would own the first step at ${operatingLocation.name}. No real case was created or synced.` : 'Missing information remains the next step. No shared case was created.'}</p></div>
          <dl><div><dt>Source / pass</dt><dd>{mode === 'pass' ? record.transferPass.code : 'Walk-in draft'}</dd></div><div><dt>Location</dt><dd>{mode === 'pass' ? operatingLocation.name : 'Not assigned'}</dd></div><div><dt>Accountable director</dt><dd>{mode === 'pass' ? lead.name : 'Not assigned'}</dd></div><div><dt>First assignee</dt><dd>{mode === 'pass' ? assignee.name : 'Not assigned'}</dd></div><div><dt>Routing reason</dt><dd>{mode === 'pass' ? `${operatingLocation.name} intake default` : 'Quick walk-in draft'}</dd></div><div><dt>Proof destination</dt><dd>{mode === 'pass' ? `${record.case.id} activity` : 'Local intake screen'}</dd></div><div><dt>Next action</dt><dd>{mode === 'pass' ? `${assignee.name} confirms the arrangement meeting` : 'Collect missing information'}</dd></div><div><dt>Execution boundary</dt><dd>{mode === 'pass' ? 'Saved in this browser only · no external sync' : 'Local to this intake screen'}</dd></div></dl>
          <div className={styles.receiptActions}>{mode === 'pass' && <a href="/director">Open secure Preview workspace <span>↗</span></a>}<button onClick={() => reset('pass')} type="button">Preview another family</button></div>
        </section>
      )}
    </AppFrame>
  );
}
