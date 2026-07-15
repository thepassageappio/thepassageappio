'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePassageZero } from '../PassageZeroProvider';
import { AppFrame } from './AppFrame';
import { ContinuityRail } from './ContinuityRail';
import { Signal } from './Signal';
import styles from './ReceiveWorkspace.module.css';

type PassStatus = 'active' | 'expired' | 'revoked' | 'accepted' | 'invalid';
type PassRecord = {
  status: PassStatus; sender?: string; relationship?: string; person?: string;
  destination?: string; expires?: string; acceptedAt?: string; acceptedBy?: string;
  caseId?: string; scope?: { name: string; detail: string }[];
};

const PASS_RECORDS: Record<string, PassRecord> = {
  'PASS-RIVERA-7K4M': { status: 'active', sender: 'Maya Rivera', relationship: 'Daughter · family coordinator', person: 'Sofia Rivera', destination: 'Northstar Funeral Home', expires: 'Today · 14:30', scope: [
    { name: 'Approved family contacts', detail: 'Maya Rivera + 2 approved contacts' },
    { name: 'Service preferences', detail: 'Ceremony, music, access needs' },
    { name: 'Transfer details', detail: 'Receiving location + timing window' },
    { name: 'Selected documents', detail: '3 family-approved documents' },
  ] },
  'PASS-CHEN-EXPIRED': { status: 'expired', sender: 'Lena Chen', person: 'Arthur Chen', expires: 'Yesterday · 18:00' },
  'PASS-BROOKS-REVOKED': { status: 'revoked', sender: 'Avery Brooks', person: 'James Brooks', expires: 'Today · 16:00' },
  'PASS-LEE-ACCEPTED': { status: 'accepted', sender: 'Jordan Lee', person: 'Evelyn Lee', acceptedAt: 'Today · 09:12', acceptedBy: 'Marcus Lee', caseId: 'NS-2047' },
};

function normalize(value: string) { return value.trim().toUpperCase().replace(/\s+/g, '-'); }

export function ReceiveWorkspace() {
  const { record: sandbox, dispatch } = usePassageZero();
  const router = useRouter();
  const search = useSearchParams();
  const queryCode = normalize(search.get('code') || '');
  const [draft, setDraft] = useState(queryCode);
  const [reviewed, setReviewed] = useState(false);
  const [destination, setDestination] = useState<'new' | 'existing'>('new');
  const [accepted, setAccepted] = useState(false);
  const [acceptRequested, setAcceptRequested] = useState(false);
  const [error, setError] = useState('');
  const record = useMemo<PassRecord | null>(() => {
    if (!queryCode) return null;
    if (queryCode === sandbox.transferPass.code) {
      return {
        status: sandbox.transferPass.status === 'issued' ? 'active' : sandbox.transferPass.status,
        sender: sandbox.familyCoordinator.name, relationship: sandbox.familyCoordinator.role,
        person: sandbox.person.name, destination: sandbox.organizations[0].name,
        expires: sandbox.transferPass.expiresLabel, acceptedAt: sandbox.transferPass.acceptedAt,
        acceptedBy: sandbox.transferPass.acceptedBy, caseId: sandbox.case.id, scope: sandbox.transferPass.scope,
      };
    }
    return PASS_RECORDS[queryCode] || { status: 'invalid' };
  }, [queryCode, sandbox]);

  useEffect(() => {
    if (!acceptRequested) return;
    if (sandbox.transferPass.status === 'accepted' && sandbox.transferPass.acceptedBy) {
      setAccepted(true);
      setAcceptRequested(false);
    } else {
      setError('Passage could not accept this handoff. Review the active pass and your director access, then try again.');
      setAcceptRequested(false);
    }
  }, [acceptRequested, sandbox.transferPass.acceptedBy, sandbox.transferPass.status]);

  function inspect(event: FormEvent) {
    event.preventDefault();
    const code = normalize(draft);
    if (!code) { setError('Enter the code shown beneath the family’s QR pass.'); return; }
    setError(''); setReviewed(false); setAccepted(false); setAcceptRequested(false);
    if (code === sandbox.transferPass.code) dispatch({ type: 'inspect_transfer_pass', actorId: 'elena-torres', actorMembershipId: 'membership-elena', idempotencyKey: `receive:inspect:${code}` });
    router.replace(`/receive?code=${encodeURIComponent(code)}`);
  }

  function clearPass() { setDraft(''); setReviewed(false); setAccepted(false); setAcceptRequested(false); setError(''); router.replace('/receive'); }

  if (!record) return (
    <AppFrame active="receive" identity="Elena Torres" role="Director · Northstar">
      <section className={styles.entry}>
        <div className={styles.entryIntro}><p>FAMILY HANDOFF / RECEIVE</p><h1>Inspect the boundary before you open it.</h1><span>A Transfer Pass reveals only what a family selected, for one destination and a limited time.</span></div>
        <form className={styles.entryConsole} onSubmit={inspect} noValidate>
          <div className={styles.entryIndex}>01</div>
          <div className={styles.entryField}>
            <label htmlFor="pass-code">TRANSFER PASS CODE</label>
            <input aria-describedby={error ? 'pass-error' : 'pass-hint'} aria-invalid={Boolean(error)} autoCapitalize="characters" autoComplete="off" id="pass-code" onChange={(event) => setDraft(event.target.value)} placeholder="PASS-XXXX-XXXX" value={draft} />
            {error ? <p id="pass-error" role="alert">{error}</p> : <small id="pass-hint">Scan the family QR or enter its code. No case changes yet.</small>}
          </div>
          <button type="submit">Inspect pass <span>→</span></button>
        </form>
        <div className={styles.entrySequence} aria-label="Receive sequence"><span>INSPECT</span><i /><span>CONFIRM SCOPE</span><i /><span>CHOOSE CASE</span><i /><span>RECEIPT</span></div>
      </section>
    </AppFrame>
  );

  if (accepted) return <Receipt code={queryCode} clearPass={clearPass} destination={destination} record={record} />;
  if (record.status !== 'active') return <PassFailure code={queryCode} clearPass={clearPass} record={record} />;

  return (
    <AppFrame active="receive" identity="Elena Torres" role="Director · Northstar">
      <section className={styles.heading}><div><p>TRANSFER PASS / INSPECTION</p><h1>Family-controlled handoff.</h1></div><Signal tone="success">Active until {record.expires}</Signal></section>
      <ContinuityRail label={queryCode} steps={[
        { label: 'Handoff', detail: `From ${record.sender}`, state: 'complete' },
        { label: 'Case', detail: 'Choose destination', state: 'current' },
        { label: 'Owner', detail: 'Elena Torres', state: 'pending' },
        { label: 'Proof', detail: 'Acceptance receipt', state: 'pending' },
      ]} />

      <section className={styles.inspector} aria-labelledby="inspection-title">
        <header><span>PASS INSPECTION</span><strong id="inspection-title">Nothing enters a case until accepted.</strong><button onClick={clearPass} type="button">Different pass</button></header>
        <div className={styles.panes}>
          <section className={styles.source} aria-labelledby="source-title">
            <span>01 / SOURCE</span><h2 id="source-title">{record.sender}</h2><p>{record.relationship}</p>
            <dl><div><dt>ABOUT</dt><dd>{record.person}</dd></div><div><dt>DESTINATION</dt><dd>{record.destination}</dd></div><div><dt>ACCESS ENDS</dt><dd>{record.expires}</dd></div></dl>
            <div className={styles.familyControl}><i aria-hidden="true" /><p><strong>Family-controlled boundary</strong>The sender chose every item listed in scope.</p></div>
          </section>

          <section className={styles.scope} aria-labelledby="scope-title">
            <div><span>02 / SCOPE</span><b>{record.scope?.length}</b></div><h2 id="scope-title">Shared for this handoff</h2>
            <ul>{record.scope?.map((item, index) => <li key={item.name}><span>{String(index + 1).padStart(2, '0')}</span><p><strong>{item.name}</strong><small>{item.detail}</small></p><b aria-label="Included">✓</b></li>)}</ul>
            <p className={styles.private}><span aria-hidden="true">−</span><strong>Everything else stays private.</strong>This pass does not open the rest of the family record.</p>
          </section>

          <form className={styles.destination} onSubmit={(event) => { event.preventDefault(); if (!reviewed) { setError('Confirm your review before accepting.'); return; } setError(''); setAcceptRequested(true); dispatch({ type: 'accept_transfer_pass', actorId: 'elena-torres', actorMembershipId: 'membership-elena', idempotencyKey: `receive:accept:${queryCode}` }); }}>
            <span>03 / DESTINATION</span><h2>Choose one case record.</h2><p>Acceptance copies the scoped items and saves a handoff receipt in this browser sandbox.</p>
            <fieldset><legend>CASE DESTINATION</legend>
              <label className={destination === 'new' ? styles.chosen : ''}><input checked={destination === 'new'} name="destination" onChange={() => setDestination('new')} type="radio" /><span><strong>Create intake</strong><small>{record.person} · New case</small></span></label>
              <label className={destination === 'existing' ? styles.chosen : ''}><input checked={destination === 'existing'} disabled name="destination" onChange={() => setDestination('existing')} type="radio" /><span><strong>No other eligible case</strong><small>Duplicate destination is blocked for this handoff.</small></span></label>
            </fieldset>
            <label className={styles.confirm}><input checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} type="checkbox" /><span>I reviewed the sender, scope, expiry, and destination.</span></label>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.accept} type="submit">Accept into {sandbox.case.id} <span>→</span></button>
          </form>
        </div>
      </section>
    </AppFrame>
  );
}

function PassFailure({ code, clearPass, record }: { code: string; clearPass: () => void; record: PassRecord }) {
  const failureStatus: Exclude<PassStatus, 'active'> = record.status === 'active' ? 'invalid' : record.status;
  const copy = {
    expired: ['ACCESS ENDED', 'This pass has expired.', `${record.sender}’s handoff for ${record.person} ended ${record.expires}. The family can issue a new pass.`, 'No information was opened or added to a case.'],
    revoked: ['ACCESS WITHDRAWN', 'The family revoked this pass.', `${record.sender} ended this handoff before acceptance. A new family-controlled pass is required.`, 'No shared items were added to a case.'],
    accepted: ['HANDOFF COMPLETE', 'This pass was already accepted.', `${record.acceptedBy} accepted the handoff into ${record.caseId} at ${record.acceptedAt}.`, 'The saved receipt and shared items are available in the destination case.'],
    invalid: ['PASS NOT FOUND', 'This handoff cannot be verified.', 'Check each character or ask the family to issue a new Transfer Pass.', 'No information was opened or added to a case.'],
  }[failureStatus];
  return <AppFrame active="receive" identity="Elena Torres" role="Director · Northstar"><section className={styles.failure}><Signal tone={record.status === 'accepted' ? 'success' : 'warm'}>{copy[0]}</Signal><h1>{copy[1]}</h1><p>{copy[2]}</p><div><span aria-hidden="true">i</span>{copy[3]}</div><button onClick={clearPass} type="button">Enter another code <span>→</span></button><small>REFERENCE · {code}</small></section></AppFrame>;
}

function Receipt({ code, clearPass, destination, record }: { code: string; clearPass: () => void; destination: 'new' | 'existing'; record: PassRecord }) {
  const caseId = destination === 'new' ? 'NS-2051' : 'NS-2041';
  return <AppFrame active="receive" identity="Elena Torres" role="Director · Northstar">
    <section className={styles.heading}><div><p>TRANSFER PASS / RECEIPT</p><h1>Continuity established.</h1></div><Signal tone="success">Accepted</Signal></section>
    <ContinuityRail label={caseId} steps={[
      { label: 'Handoff', detail: `From ${record.sender}`, state: 'complete' }, { label: 'Case', detail: caseId, state: 'complete' }, { label: 'Owner', detail: 'Elena Torres', state: 'complete' }, { label: 'Proof', detail: 'Receipt saved', state: 'complete' },
    ]} />
    <section className={styles.receipt}>
      <div className={styles.receiptMark} aria-hidden="true">✓</div><div className={styles.receiptTitle}><span>ACCEPTANCE RECEIPT</span><h2>The scoped handoff is now part of {caseId}.</h2><p>{record.sender}’s selected items were copied to one sandbox case. The source, recipient, scope, time, and destination are recorded in this browser.</p></div>
      <dl><div><dt>CASE</dt><dd>{caseId}</dd></div><div><dt>ACCEPTED BY</dt><dd>Elena Torres</dd></div><div><dt>SCOPE</dt><dd>{record.scope?.length} selected groups</dd></div><div><dt>REFERENCE</dt><dd>{code}</dd></div></dl>
      <div className={styles.receiptActions}><a href="/director">Open {caseId} <span>↗</span></a><button onClick={clearPass} type="button">Receive another pass</button></div>
    </section>
  </AppFrame>;
}
