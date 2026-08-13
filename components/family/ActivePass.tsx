'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BoundarySignal from './BoundarySignal';
import styles from './FamilyJourney.module.css';
import { EXPIRIES, RECIPIENTS, SCOPES, type DemoHandoffSnapshot, type Recipient, type TransferDraft } from './types';
import { usePassageZero } from '../PassageZeroProvider';
import { selectFamilyStatus } from '../../lib/passage-zero';
import { membership } from '../../lib/sandbox/repository';
import { formatDemoExpiry, normalizeDemoTransferDraft } from '../../lib/presentation/demo-expiry';
import { normalizeDemoHandoffSnapshot } from '../../lib/presentation/demo-handoff-snapshot';

const AUTHENTICATED_EXAMPLE_PASS: TransferDraft = {
  recipientId: 'northstar',
  scopeIds: ['identity', 'care', 'wishes'],
  expiryId: '72h',
};

function PassCode() {
  return (
    <svg className={styles.passQr} viewBox="0 0 184 184" role="img" aria-label="Example QR code. It cannot be scanned outside this demo.">
      <rect className={styles.qrBackground} width="184" height="184" rx="6" />
      <g className={styles.qrCode}>
        <path d="M18 18h50v50H18zm10 10v30h30V28zM116 18h50v50h-50zm10 10v30h30V28zM18 116h50v50H18zm10 10v30h30v-30z" />
        <path d="M80 18h14v14H80zm18 18h14v14H98zM78 52h14v14H78zm22 18h14v14h-14zM76 78h18v18H76zm26 8h14v14h-14zm20-8h16v16h-16zm24 2h18v18h-18zM82 106h14v14H82zm20 4h18v18h-18zm26-8h14v14h-14zm20 4h16v16h-16zM76 130h18v18H76zm26 6h14v14h-14zm18-8h18v18h-18zm26 8h18v18h-18zM84 154h14v14H84zm34 0h14v14h-14zm28 0h18v14h-18z" />
      </g>
    </svg>
  );
}

export default function ActivePass({ mode }: { mode: 'browser_demo' | 'authenticated' }) {
  const { record, dispatchAtomic } = usePassageZero();
  const accountableDirector = membership(record, record.case.accountableMembershipId).actor;
  const assignedOperator = membership(record, record.commitment.assignedMembershipId).actor;
  const familyStatus = selectFamilyStatus(record);
  const [pass, setPass] = useState<DemoHandoffSnapshot | TransferDraft | null>(
    mode === 'authenticated' ? AUTHENTICATED_EXAMPLE_PASS : null,
  );
  const [loadState, setLoadState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [savedInThisSession, setSavedInThisSession] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [closeMessage, setCloseMessage] = useState('');
  const revoked = record.transferPass.status === 'revoked';
  const closedHeading = useRef<HTMLHeadingElement>(null);
  const closeTrigger = useRef<HTMLButtonElement>(null);
  const confirmHeading = useRef<HTMLElement>(null);
  const closeRecovery = useRef<HTMLParagraphElement>(null);
  const manualCode = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem('passage.family.transfer.v1');
      if (mode === 'authenticated') {
        if (stored) {
          const normalized = normalizeDemoTransferDraft(JSON.parse(stored));
          const recognized = normalized
            && RECIPIENTS.some((item) => item.id === normalized.recipientId)
            && normalized.scopeIds.every((scopeId) => SCOPES.some((item) => item.id === scopeId));
          if (normalized && recognized) {
            setPass(normalized);
            setSavedInThisSession(true);
          } else {
            window.sessionStorage.removeItem('passage.family.transfer.v1');
            setPass(AUTHENTICATED_EXAMPLE_PASS);
            setSavedInThisSession(false);
          }
        }
        setLoadState('valid');
        return;
      }
      if (stored) {
        const normalized = normalizeDemoHandoffSnapshot(JSON.parse(stored));
        if (normalized) {
          setPass(normalized);
          setLoadState('valid');
        } else {
          window.sessionStorage.removeItem('passage.family.transfer.v1');
          setPass(null);
          setLoadState('invalid');
        }
      } else {
        setPass(null);
        setLoadState('invalid');
      }
    } catch {
      try {
        window.sessionStorage.removeItem('passage.family.transfer.v1');
      } catch {
        // Storage can be disabled; no active-pass success is presented.
      }
      if (mode === 'authenticated') {
        setPass(AUTHENTICATED_EXAMPLE_PASS);
        setSavedInThisSession(false);
        setLoadState('valid');
      } else {
        setPass(null);
        setLoadState('invalid');
      }
    }
  }, [mode]);

  useEffect(() => {
    if (revoked) closedHeading.current?.focus();
  }, [revoked]);

  useEffect(() => {
    if (confirming) confirmHeading.current?.focus();
  }, [confirming]);

  const demoPass = mode === 'browser_demo' ? pass as DemoHandoffSnapshot | null : null;
  const authenticatedPass = mode === 'authenticated' ? pass as TransferDraft : null;
  const recipient = useMemo<Recipient | undefined>(() => mode === 'authenticated'
    ? RECIPIENTS.find((item) => item.id === authenticatedPass?.recipientId) ?? RECIPIENTS[0]
    : demoPass ? ({
      id: demoPass.receiver.selectionId,
      organization: demoPass.receiver.displayName,
      person: demoPass.receiver.handoffAvailability === 'connected_preview'
        ? 'Browser-demo destination'
        : 'Reviewed funeral-home choice',
      role: demoPass.receiver.role,
      location: demoPass.receiver.address.formatted,
    }) : undefined, [authenticatedPass?.recipientId, demoPass, mode]);
  const expiry = useMemo(() => mode === 'authenticated'
    ? EXPIRIES.find((item) => item.id === authenticatedPass?.expiryId) ?? EXPIRIES[1]
    : demoPass ? EXPIRIES.find((item) => item.id === demoPass.expiryId) : undefined,
  [authenticatedPass?.expiryId, demoPass, mode]);
  const expiryMoment = mode === 'authenticated'
    ? authenticatedPass?.expiresAt ? formatDemoExpiry(authenticatedPass.expiresAt) ?? expiry?.moment : expiry?.moment
    : demoPass ? formatDemoExpiry(demoPass.expiresAt) : null;
  const included = useMemo(() => pass
    ? SCOPES.filter((item) => pass.scopeIds.includes(item.id))
    : [], [pass]);
  const excluded = useMemo(() => pass
    ? SCOPES.filter((item) => !pass.scopeIds.includes(item.id))
    : [], [pass]);

  async function copyCode() {
    setCopied(false);
    setCopyMessage('');
    try {
      await navigator.clipboard.writeText(record.transferPass.code);
      setCopied(true);
      setCopyMessage('Manual code copied.');
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      if (manualCode.current && selection) {
        range.selectNodeContents(manualCode.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setCopyMessage('The code was not copied. It is selected now. Use your device Copy command.');
    }
  }

  function revoke() {
    setCloseMessage('');
    let savedHandoff: string | null = null;
    try {
      savedHandoff = window.sessionStorage.getItem('passage.family.transfer.v1');
      window.sessionStorage.removeItem('passage.family.transfer.v1');
    } catch {
      setCloseMessage('The example handoff was not closed. It remains open. Nothing changed. Try again or keep it open.');
      window.requestAnimationFrame(() => closeRecovery.current?.focus());
      return;
    }

    try {
      const result = dispatchAtomic({ type: 'revoke_transfer_pass', actorId: 'maya-rivera', idempotencyKey: 'family:revoke:rivera' });
      if (!result.persisted) {
        let restored = false;
        try {
          if (savedHandoff) {
            window.sessionStorage.setItem('passage.family.transfer.v1', savedHandoff);
            restored = true;
          }
        } catch {
          // The handoff remains open in memory even when its saved copy cannot be restored.
        }
        setCloseMessage(restored
          ? 'The example handoff was not closed. It remains open and saved. Try again or keep it open.'
          : 'The example handoff was not closed. It remains open for this visit, but its saved browser copy could not be restored.');
        window.requestAnimationFrame(() => closeRecovery.current?.focus());
        return;
      }
      setCloseMessage('The example handoff is closed in this browser.');
      setConfirming(false);
    } catch {
      setCloseMessage('The example handoff was not closed. It remains open for this visit. The saved browser copy was removed. Create it again after reloading.');
      window.requestAnimationFrame(() => closeRecovery.current?.focus());
    }
  }

  function keepOpen() {
    setConfirming(false);
    window.requestAnimationFrame(() => closeTrigger.current?.focus());
  }

  function handleConfirmKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      keepOpen();
    }
  }

  if (revoked) {
    return (
      <main className={styles.closedPage} id="active-pass">
        <div className={styles.closedSignal} aria-hidden="true"><span /></div>
        <p>HANDOFF CLOSED / 04</p>
        <h1 ref={closedHeading} tabIndex={-1}>This pass cannot be opened now.</h1>
        <span>{recipient ? `${recipient.organization} can no longer use` : 'The receiver can no longer use'} this example QR or manual code. Sofia&apos;s example information has not changed.</span>
        <p aria-live="polite">{closeMessage || 'The example handoff is closed in this browser.'}</p>
        <a href="/demo/family">Create a new example handoff <i aria-hidden="true">-&gt;</i></a>
      </main>
    );
  }

  if (mode === 'browser_demo' && (loadState !== 'valid' || !demoPass || !recipient || !expiry || !expiryMoment)) {
    return (
      <main className={styles.closedPage} id="active-pass">
        <div className={styles.closedSignal} aria-hidden="true"><span /></div>
        <p>PRIVATE BROWSER DEMO</p>
        <h1>This example handoff is unavailable</h1>
        <span>The saved example could not be verified. No handoff is active, and no code or receiver details are shown.</span>
        <a href="/demo/family">Create it again <i aria-hidden="true">-&gt;</i></a>
      </main>
    );
  }

  if (!recipient || !expiry || !expiryMoment) return null;

  const heroStatus = mode === 'authenticated'
    ? familyStatus.update
    : record.commitment.status === 'proof_submitted'
      ? `This browser example shows confirmation from ${recipient.organization}.`
      : record.transferPass.status === 'accepted'
        ? `This browser example shows ${recipient.organization} received the handoff.`
        : `Your handoff is ready for ${recipient.organization}.`;

  return (
    <main className={styles.passPage} id="active-pass">
      <div className={styles.passStatus}>
        <span className={styles.statusPulse} aria-hidden="true" />
        <strong>{record.transferPass.status === 'accepted' ? 'HANDOFF ACCEPTED' : mode === 'authenticated' ? savedInThisSession ? 'HANDOFF ACTIVE' : 'HANDOFF EXAMPLE' : 'HANDOFF ACTIVE'}</strong>
        <span>{record.transferPass.status === 'accepted' ? mode === 'authenticated' ? `${record.organizations[0].name} received it` : 'This browser example shows it as received' : mode === 'authenticated' && !savedInThisSession ? `Create it to start the ${expiry!.label} window` : `Closes ${expiryMoment}`}</span>
      </div>

      <section className={styles.passHero} aria-labelledby="active-pass-heading">
        <div className={styles.passCopy}>
          <p>TRANSFER PASS / {record.person.name.toUpperCase()}</p>
          <h1 id="active-pass-heading">{record.transferPass.status === 'accepted' ? <>Handoff<br />received.</> : <>Ready for<br />the handoff.</>}</h1>
          <span>{heroStatus}</span>

          <div className={styles.destinationLine}>
            <span>PREPARED FOR</span>
            <strong>{recipient.organization}</strong>
            <small>{recipient.person} / {recipient.role}</small>
          </div>
        </div>

        <div className={styles.passObject}>
          <div className={styles.passLight} aria-hidden="true" />
          <div className={styles.passObjectHead}><span>PASSAGE / SINGLE USE HANDOFF</span><strong>{record.transferPass.status === 'accepted' ? 'RECEIVED' : 'READY'}</strong></div>
          <PassCode />
          <span className={styles.scanLabel}>EXAMPLE CODE · DEMO ONLY</span>
          <div className={styles.manualCode}>
            <span>MANUAL CODE</span>
            <strong ref={manualCode}>{record.transferPass.code}</strong>
          </div>
          <button disabled={record.transferPass.status === 'accepted'} onClick={copyCode} type="button">{record.transferPass.status === 'accepted' ? 'Already accepted' : copied ? 'Copied' : 'Copy code'}</button>
        </div>
      </section>

      <section className={styles.passBoundary} aria-label="Handoff details">
        <BoundarySignal recipient={recipient} included={included} excluded={excluded} expiry={expiry} active />
        <div className={styles.passLedger}>
          <div className={styles.ledgerIntro}>
            <p>VISIBLE BOUNDARY</p>
            <h2>{included.length} {included.length === 1 ? 'category moves' : 'categories move'}.<br />Everything else stays here.</h2>
          </div>
          <div className={styles.ledgerColumns}>
            <section>
              <header><span>THEY CAN OPEN</span><strong>{String(included.length).padStart(2, '0')}</strong></header>
              <ul>{included.map((item) => <li key={item.id}><span>+</span><strong>{item.label}</strong><small>{item.detail}</small></li>)}</ul>
            </section>
            <section className={styles.passPrivate}>
              <header><span>STAYS PRIVATE</span><strong>{String(excluded.length).padStart(2, '0')}</strong></header>
              <ul>{excluded.map((item) => <li key={item.id}><span>-</span><strong>{item.label}</strong></li>)}</ul>
            </section>
          </div>
        </div>
      </section>

      <section className={styles.passControls} aria-labelledby="control-heading">
        <div>
          <p>{record.commitment.status === 'proof_submitted' ? 'PROOF RETURNED' : 'FAMILY STATUS'}</p>
          <h2 id="control-heading">{record.commitment.status === 'proof_submitted' ? 'Confirmation received.' : record.transferPass.status === 'accepted' ? `${assignedOperator.name} owns the next step.` : mode === 'authenticated' && !savedInThisSession ? 'Start with your own example choices.' : 'Need to stop access?'}</h2>
          <span>{record.commitment.status === 'proof_submitted' ? `${accountableDirector.name} is reviewing the saved example confirmation. No real funeral home or family record was contacted or changed.` : record.transferPass.status === 'accepted' ? 'This browser demo updated the example handoff. No real funeral home or family record was contacted or changed.' : mode === 'authenticated' && !savedInThisSession ? 'Choose the receiver, what they can open, and the access window. Nothing is sent and no real record changes.' : 'Closing this example handoff is immediate and changes only this browser demo.'}</span>
        </div>
        {record.transferPass.status === 'accepted' ? (
          <a className={styles.exitPass} href="/demo/family">Return to family demo</a>
        ) : mode === 'authenticated' && !savedInThisSession ? (
          <a className={styles.exitPass} href="/demo/family">Create this example handoff</a>
        ) : !confirming ? (
          <button className={styles.revokeButton} onClick={() => setConfirming(true)} ref={closeTrigger} type="button">Close this handoff</button>
        ) : (
          <div className={styles.revokePanel} onKeyDown={handleConfirmKeyDown} role="group" aria-labelledby="confirm-revoke-heading">
            <strong id="confirm-revoke-heading" ref={confirmHeading} tabIndex={-1}>Close access now?</strong>
            <span>The example QR and manual code will stop working in this browser demo.</span>
            {closeMessage && <p className={styles.recoveryMessage} ref={closeRecovery} role="alert" tabIndex={-1}>{closeMessage}</p>}
            <div>
              <button onClick={keepOpen} type="button">Keep open</button>
              <button onClick={revoke} type="button">Yes, close it</button>
            </div>
          </div>
        )}
      </section>

      <div className={styles.liveRegion} aria-live="polite">{copyMessage || closeMessage}</div>
    </main>
  );
}
