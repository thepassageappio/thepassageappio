'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BoundarySignal from './BoundarySignal';
import styles from './FamilyJourney.module.css';
import { EXPIRIES, RECIPIENTS, SCOPES, type TransferDraft } from './types';

const FALLBACK_PASS: TransferDraft = {
  recipientId: 'northstar',
  scopeIds: ['identity', 'care', 'wishes'],
  expiryId: '72h',
  activatedAt: '2026-07-15T11:30:00.000Z',
};

function PassCode() {
  return (
    <svg className={styles.passQr} viewBox="0 0 184 184" role="img" aria-label="Transfer Pass QR code placeholder">
      <rect className={styles.qrBackground} width="184" height="184" rx="6" />
      <g className={styles.qrCode}>
        <path d="M18 18h50v50H18zm10 10v30h30V28zM116 18h50v50h-50zm10 10v30h30V28zM18 116h50v50H18zm10 10v30h30v-30z" />
        <path d="M80 18h14v14H80zm18 18h14v14H98zM78 52h14v14H78zm22 18h14v14h-14zM76 78h18v18H76zm26 8h14v14h-14zm20-8h16v16h-16zm24 2h18v18h-18zM82 106h14v14H82zm20 4h18v18h-18zm26-8h14v14h-14zm20 4h16v16h-16zM76 130h18v18H76zm26 6h14v14h-14zm18-8h18v18h-18zm26 8h18v18h-18zM84 154h14v14H84zm34 0h14v14h-14zm28 0h18v14h-18z" />
      </g>
    </svg>
  );
}

export default function ActivePass() {
  const [pass, setPass] = useState<TransferDraft>(FALLBACK_PASS);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const closedHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem('passage.family.transfer.v1');
      if (stored) setPass(JSON.parse(stored) as TransferDraft);
    } catch {
      setPass(FALLBACK_PASS);
    }
  }, []);

  useEffect(() => {
    if (revoked) closedHeading.current?.focus();
  }, [revoked]);

  const recipient = useMemo(() => RECIPIENTS.find((item) => item.id === pass.recipientId) ?? RECIPIENTS[0], [pass.recipientId]);
  const expiry = useMemo(() => EXPIRIES.find((item) => item.id === pass.expiryId) ?? EXPIRIES[1], [pass.expiryId]);
  const included = useMemo(() => SCOPES.filter((item) => pass.scopeIds.includes(item.id)), [pass.scopeIds]);
  const excluded = useMemo(() => SCOPES.filter((item) => !pass.scopeIds.includes(item.id)), [pass.scopeIds]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText('PSSG-R7K4-M2Q9');
    } finally {
      setCopied(true);
    }
  }

  function revoke() {
    window.sessionStorage.removeItem('passage.family.transfer.v1');
    setRevoked(true);
    setConfirming(false);
  }

  if (revoked) {
    return (
      <main className={styles.closedPage}>
        <div className={styles.closedSignal} aria-hidden="true"><span /></div>
        <p>HANDOFF CLOSED / 04</p>
        <h1 ref={closedHeading} tabIndex={-1}>This pass cannot be opened now.</h1>
        <span>{recipient.organization} can no longer use its QR or manual code. Sofia's family record has not changed.</span>
        <a href="/family">Create a new handoff <i aria-hidden="true">-&gt;</i></a>
      </main>
    );
  }

  return (
    <main className={styles.passPage}>
      <div className={styles.passStatus}>
        <span className={styles.statusPulse} aria-hidden="true" />
        <strong>HANDOFF ACTIVE</strong>
        <span>Closes {expiry.moment}</span>
      </div>

      <section className={styles.passHero} aria-labelledby="active-pass-heading">
        <div className={styles.passCopy}>
          <p>TRANSFER PASS / SOFIA RIVERA</p>
          <h1 id="active-pass-heading">Ready for<br />the handoff.</h1>
          <span>Show this screen to {recipient.person}. They can scan the code or enter it manually.</span>

          <div className={styles.destinationLine}>
            <span>PREPARED FOR</span>
            <strong>{recipient.organization}</strong>
            <small>{recipient.person} / {recipient.role}</small>
          </div>
        </div>

        <div className={styles.passObject}>
          <div className={styles.passLight} aria-hidden="true" />
          <div className={styles.passObjectHead}><span>PASSAGE / SINGLE USE HANDOFF</span><strong>LIVE</strong></div>
          <PassCode />
          <span className={styles.scanLabel}>SCAN TO OPEN</span>
          <div className={styles.manualCode}>
            <span>MANUAL CODE</span>
            <strong>PSSG-R7K4-M2Q9</strong>
          </div>
          <button onClick={copyCode} type="button">{copied ? 'Copied' : 'Copy code'}</button>
        </div>
      </section>

      <section className={styles.passBoundary} aria-label="Handoff details">
        <BoundarySignal recipient={recipient} included={included} excluded={excluded} expiry={expiry} active />
        <div className={styles.passLedger}>
          <div className={styles.ledgerIntro}>
            <p>VISIBLE BOUNDARY</p>
            <h2>{included.length} categories move.<br />Everything else stays here.</h2>
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
          <p>FAMILY CONTROL</p>
          <h2 id="control-heading">Need to stop access?</h2>
          <span>Closing this pass is immediate. Your family record remains in place.</span>
        </div>
        {!confirming ? (
          <button className={styles.revokeButton} onClick={() => setConfirming(true)} type="button">Close this handoff</button>
        ) : (
          <div className={styles.revokePanel} role="group" aria-labelledby="confirm-revoke-heading">
            <strong id="confirm-revoke-heading">Close access now?</strong>
            <span>The QR and manual code will stop working.</span>
            <div>
              <button onClick={() => setConfirming(false)} type="button">Keep open</button>
              <button onClick={revoke} type="button">Yes, close it</button>
            </div>
          </div>
        )}
      </section>

      <div className={styles.liveRegion} aria-live="polite">{copied ? 'Manual code copied.' : ''}</div>
    </main>
  );
}
