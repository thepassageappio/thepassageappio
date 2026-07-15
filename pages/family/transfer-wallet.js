import Head from 'next/head';
import { useMemo, useState } from 'react';
import styles from '../../styles/FamilyTransferWallet.module.css';

const RECIPIENTS = [
  { id: 'northstar', name: 'Northstar Funeral Home', contact: 'Elena Torres · Funeral director' },
  { id: 'cedar', name: 'Cedar & Stone Memorial', contact: 'Amara Reed · Care coordinator' },
];

const SCOPE_OPTIONS = [
  { id: 'identity', label: 'Personal details', description: 'Sofia’s name, date of birth, and the family contacts you selected.', defaultSelected: true },
  { id: 'care', label: 'Care handoff', description: 'Current care location, receiving contact, and transport notes.', defaultSelected: true },
  { id: 'wishes', label: 'Service wishes', description: 'The ceremony, disposition, and memorial preferences saved so far.', defaultSelected: true },
  { id: 'documents', label: 'Selected documents', description: 'The identification and service-planning files chosen for this handoff.', defaultSelected: false },
  { id: 'notes', label: 'Private family notes', description: 'Reflections and conversations kept inside your family space.', defaultSelected: false },
];

const EXPIRIES = [
  { id: '24h', label: '24 hours', detail: 'Tomorrow at 11:30 AM' },
  { id: '72h', label: '3 days', detail: 'Friday at 11:30 AM' },
  { id: '7d', label: '7 days', detail: 'Tuesday, July 21 at 11:30 AM' },
];

const INITIAL_SELECTION = SCOPE_OPTIONS.filter((item) => item.defaultSelected).map((item) => item.id);

function Progress({ step }) {
  const steps = ['Choose', 'Review', 'Pass ready'];
  const activeIndex = step === 'compose' ? 0 : step === 'review' ? 1 : 2;

  return (
    <ol className={styles.progress} aria-label="Transfer Pass progress">
      {steps.map((label, index) => (
        <li className={index <= activeIndex ? styles.progressActive : ''} key={label}>
          <span aria-hidden="true">{index + 1}</span>
          <strong>{label}</strong>
        </li>
      ))}
    </ol>
  );
}

function ScopeSummary({ items, title, tone = 'included' }) {
  return (
    <section className={tone === 'private' ? styles.summaryPrivate : styles.summaryIncluded}>
      <p className={styles.summaryLabel}>{title}</p>
      <ul>
        {items.map((item) => <li key={item.id}>{item.label}</li>)}
      </ul>
    </section>
  );
}

function QrMark() {
  return (
    <svg className={styles.qr} viewBox="0 0 184 184" role="img" aria-label="Scannable Transfer Pass code placeholder">
      <rect width="184" height="184" rx="14" fill="#fffdf9" />
      <g fill="#123c32">
        <path d="M18 18h50v50H18zm10 10v30h30V28zM116 18h50v50h-50zm10 10v30h30V28zM18 116h50v50H18zm10 10v30h30v-30z" />
        <path d="M80 18h14v14H80zm18 18h14v14H98zM78 52h14v14H78zm22 18h14v14h-14zM76 78h18v18H76zm26 8h14v14h-14zm20-8h16v16h-16zm24 2h18v18h-18zM82 106h14v14H82zm20 4h18v18h-18zm26-8h14v14h-14zm20 4h16v16h-16zM76 130h18v18H76zm26 6h14v14h-14zm18-8h18v18h-18zm26 8h18v18h-18zM84 154h14v14H84zm34 0h14v14h-14zm28 0h18v14h-18z" />
      </g>
    </svg>
  );
}

export default function FamilyTransferWalletPage() {
  const [step, setStep] = useState('compose');
  const [recipientId, setRecipientId] = useState('northstar');
  const [selectedIds, setSelectedIds] = useState(INITIAL_SELECTION);
  const [expiryId, setExpiryId] = useState('72h');
  const [copied, setCopied] = useState(false);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const recipient = useMemo(
    () => RECIPIENTS.find((item) => item.id === recipientId) || RECIPIENTS[0],
    [recipientId]
  );
  const expiry = useMemo(
    () => EXPIRIES.find((item) => item.id === expiryId) || EXPIRIES[1],
    [expiryId]
  );
  const included = useMemo(
    () => SCOPE_OPTIONS.filter((item) => selectedIds.includes(item.id)),
    [selectedIds]
  );
  const excluded = useMemo(
    () => SCOPE_OPTIONS.filter((item) => !selectedIds.includes(item.id)),
    [selectedIds]
  );

  function toggleScope(id) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  async function copyCode() {
    try {
      await navigator.clipboard?.writeText('PSSG-R7K4-M2Q9');
    } finally {
      setCopied(true);
    }
  }

  function beginAgain() {
    setStep('compose');
    setRevoked(false);
    setConfirmingRevoke(false);
    setCopied(false);
  }

  return (
    <div className={styles.root}>
      <Head>
        <title>Transfer Wallet | Passage</title>
        <meta name="description" content="Choose what travels with your family’s Transfer Pass." />
      </Head>

      <a className={styles.skip} href="#wallet-main">Skip to Transfer Wallet</a>

      <header className={styles.header}>
        <div className={styles.wordmark} aria-label="Passage">PASSAGE</div>
        <div className={styles.familyContext}>
          <span>Sofia Rivera</span>
          <span aria-hidden="true">·</span>
          <strong>Family space</strong>
        </div>
      </header>

      <main id="wallet-main" className={styles.shell}>
        <div className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>Transfer Wallet</p>
            <h1>You choose what travels.</h1>
            <p className={styles.lede}>Create a temporary pass for one care partner. Everything else stays in your family space.</p>
          </div>
          <Progress step={step} />
        </div>

        {step === 'compose' && (
          <div className={styles.composeLayout}>
            <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); setStep('review'); }}>
              <section className={styles.formSection} aria-labelledby="recipient-heading">
                <div className={styles.sectionNumber} aria-hidden="true">01</div>
                <div className={styles.sectionBody}>
                  <h2 id="recipient-heading">Who will receive it?</h2>
                  <p>Choose the specific organization and contact expecting this handoff.</p>
                  <label className={styles.selectLabel} htmlFor="recipient">Recipient</label>
                  <select id="recipient" value={recipientId} onChange={(event) => setRecipientId(event.target.value)}>
                    {RECIPIENTS.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.contact}</option>)}
                  </select>
                </div>
              </section>

              <section className={styles.formSection} aria-labelledby="scope-heading">
                <div className={styles.sectionNumber} aria-hidden="true">02</div>
                <fieldset className={styles.sectionBody}>
                  <legend id="scope-heading">What can they open?</legend>
                  <p>Select each category you want included. You can review everything before the pass becomes active.</p>
                  <div className={styles.scopeList}>
                    {SCOPE_OPTIONS.map((item) => (
                      <label className={styles.scopeOption} key={item.id}>
                        <input
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleScope(item.id)}
                          type="checkbox"
                        />
                        <span className={styles.checkboxMark} aria-hidden="true" />
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </section>

              <section className={styles.formSection} aria-labelledby="expiry-heading">
                <div className={styles.sectionNumber} aria-hidden="true">03</div>
                <fieldset className={styles.sectionBody}>
                  <legend id="expiry-heading">When should access end?</legend>
                  <p>The pass stops opening after this time. You can also revoke it sooner.</p>
                  <div className={styles.expiryOptions}>
                    {EXPIRIES.map((item) => (
                      <label className={expiryId === item.id ? styles.expiryActive : styles.expiryOption} key={item.id}>
                        <input checked={expiryId === item.id} name="expiry" onChange={() => setExpiryId(item.id)} type="radio" />
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </section>

              <div className={styles.formAction}>
                <p>{included.length} of {SCOPE_OPTIONS.length} categories selected</p>
                <button className={styles.primary} disabled={included.length === 0} type="submit">Review this handoff</button>
              </div>
            </form>

            <aside className={styles.preview} aria-label="Transfer Pass preview">
              <p className={styles.previewEyebrow}>Pass preview · Not active</p>
              <h2>{recipient.name}</h2>
              <p className={styles.previewContact}>{recipient.contact}</p>
              <div className={styles.previewRule} />
              <ScopeSummary items={included} title="They can open" />
              <ScopeSummary items={excluded} title="Stays private" tone="private" />
              <div className={styles.previewExpiry}>
                <span>Access ends</span>
                <strong>{expiry.detail}</strong>
              </div>
              <p className={styles.previewFoot}>Nothing is shared until you review and activate the pass.</p>
            </aside>
          </div>
        )}

        {step === 'review' && (
          <section className={styles.review} aria-labelledby="review-heading">
            <div className={styles.reviewIntro}>
              <p className={styles.eyebrow}>Review before activation</p>
              <h2 id="review-heading">One recipient. {included.length} categories. {expiry.label}.</h2>
              <p>Check the handoff below. The pass is still inactive and can be changed.</p>
            </div>
            <div className={styles.reviewGrid}>
              <div className={styles.reviewRecipient}>
                <span>Receiving organization</span>
                <h3>{recipient.name}</h3>
                <p>{recipient.contact}</p>
              </div>
              <div className={styles.reviewScope}>
                <ScopeSummary items={included} title="Included in this pass" />
                <ScopeSummary items={excluded} title="Not included" tone="private" />
              </div>
              <div className={styles.reviewTiming}>
                <span>Access window</span>
                <h3>{expiry.label}</h3>
                <p>Ends {expiry.detail}</p>
              </div>
            </div>
            <div className={styles.reviewActions}>
              <button className={styles.textButton} onClick={() => setStep('compose')} type="button">Back and change</button>
              <div>
                <p>Activating creates the QR and manual code.</p>
                <button className={styles.primary} onClick={() => setStep('ready')} type="button">Activate Transfer Pass</button>
              </div>
            </div>
          </section>
        )}

        {step === 'ready' && !revoked && (
          <section className={styles.ready} aria-labelledby="ready-heading">
            <div className={styles.readyCopy}>
              <div className={styles.status}><span aria-hidden="true" /> Active</div>
              <p className={styles.eyebrow}>Pass ready</p>
              <h2 id="ready-heading">Hand this screen to {recipient.name}.</h2>
              <p>They can scan the code or enter the manual code. The pass opens only the {included.length} categories you reviewed.</p>
              <dl className={styles.readyFacts}>
                <div><dt>Recipient</dt><dd>{recipient.name}</dd></div>
                <div><dt>Access ends</dt><dd>{expiry.detail}</dd></div>
                <div><dt>Shared</dt><dd>{included.map((item) => item.label).join(', ')}</dd></div>
              </dl>
              {!confirmingRevoke ? (
                <button className={styles.dangerLink} onClick={() => setConfirmingRevoke(true)} type="button">Revoke this pass</button>
              ) : (
                <div className={styles.revokeConfirm} role="group" aria-labelledby="revoke-heading">
                  <h3 id="revoke-heading">Stop this pass from opening?</h3>
                  <p>The QR and manual code will no longer work.</p>
                  <div>
                    <button className={styles.secondaryDark} onClick={() => setConfirmingRevoke(false)} type="button">Keep active</button>
                    <button className={styles.danger} onClick={() => setRevoked(true)} type="button">Yes, revoke pass</button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.passCard}>
              <div className={styles.passTop}>
                <span>PASSAGE · TRANSFER PASS</span>
                <span>ACTIVE</span>
              </div>
              <QrMark />
              <p>Scan to open this handoff</p>
              <div className={styles.manualCode}>
                <span>Manual code</span>
                <strong>PSSG-R7K4-M2Q9</strong>
              </div>
              <button className={styles.copyButton} onClick={copyCode} type="button">{copied ? 'Code copied' : 'Copy manual code'}</button>
              <small>For {recipient.name} · Ends {expiry.detail}</small>
            </div>
          </section>
        )}

        {step === 'ready' && revoked && (
          <section className={styles.revoked} aria-labelledby="revoked-heading">
            <div className={styles.revokedMark} aria-hidden="true">×</div>
            <p className={styles.eyebrow}>Pass revoked</p>
            <h2 id="revoked-heading">This handoff can no longer be opened.</h2>
            <p>{recipient.name} can no longer use the QR or manual code. Your family record has not changed.</p>
            <button className={styles.primary} onClick={beginAgain} type="button">Create a new pass</button>
          </section>
        )}
      </main>
    </div>
  );
}
