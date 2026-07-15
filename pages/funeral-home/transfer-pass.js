import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import styles from '../../styles/StaffTransferPass.module.css';

const PASSES = {
  'PASS-RIVERA-7K4M': {
    status: 'active',
    sender: 'Maya Rivera',
    senderRole: 'Family coordinator',
    person: 'Sofia Rivera',
    relationship: 'Daughter',
    destination: 'Northstar Funeral Home',
    expires: 'Today at 2:30 PM',
    expiresDetail: '3 hours 18 minutes remaining',
    scope: [
      {
        title: 'Family contacts',
        detail: 'Maya Rivera and two approved family contacts',
      },
      {
        title: 'Service preferences',
        detail: 'Ceremony, visitation, music, and accessibility preferences',
      },
      {
        title: 'Transfer details',
        detail: 'Receiving location, timing window, and family contact boundary',
      },
      {
        title: 'Approved documents',
        detail: 'Three documents selected by the family',
      },
    ],
  },
  'PASS-CHEN-EXPIRED': {
    status: 'expired',
    sender: 'Lena Chen',
    senderRole: 'Family coordinator',
    person: 'Arthur Chen',
    destination: 'Northstar Funeral Home',
    expires: 'Yesterday at 6:00 PM',
  },
  'PASS-BROOKS-REVOKED': {
    status: 'revoked',
    sender: 'Avery Brooks',
    senderRole: 'Family coordinator',
    person: 'James Brooks',
    destination: 'Northstar Funeral Home',
    expires: 'Today at 4:00 PM',
  },
  'PASS-LEE-ACCEPTED': {
    status: 'accepted',
    sender: 'Jordan Lee',
    senderRole: 'Family coordinator',
    person: 'Evelyn Lee',
    destination: 'Northstar Funeral Home',
    expires: 'Today at 5:15 PM',
    acceptedCase: 'Case NS-2047',
    acceptedBy: 'Marcus Lee',
    acceptedAt: 'Today at 9:12 AM',
  },
};

const DEMO_MODE = process.env.NEXT_PUBLIC_PASSAGE_DEMO === 'true';

function normalizeCode(value) {
  return value.trim().toUpperCase().replace(/\s+/g, '-');
}

function statusCopy(status) {
  if (status === 'active') return { label: 'Ready to review', mark: '✓' };
  if (status === 'expired') return { label: 'Expired', mark: '!' };
  if (status === 'revoked') return { label: 'Revoked by family', mark: '×' };
  if (status === 'accepted') return { label: 'Already accepted', mark: '✓' };
  return { label: 'Pass not found', mark: '?' };
}

export default function StaffTransferPassPage() {
  const router = useRouter();
  const resultHeadingRef = useRef(null);
  const [code, setCode] = useState('');
  const [pass, setPass] = useState(null);
  const [view, setView] = useState('entry');
  const [destinationChoice, setDestinationChoice] = useState('new');
  const [reviewed, setReviewed] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || typeof router.query.code !== 'string') return;
    const incomingCode = normalizeCode(router.query.code);
    setCode(incomingCode);
    const incomingPass = PASSES[incomingCode] || { status: 'invalid' };
    setPass(incomingPass);
    setView('result');
  }, [router.isReady, router.query.code]);

  useEffect(() => {
    if (view !== 'entry') resultHeadingRef.current?.focus();
  }, [view, pass?.status]);

  function findPass(event) {
    event.preventDefault();
    const normalized = normalizeCode(code);

    if (!normalized) {
      setError('Enter the code shown beneath the family’s QR pass.');
      return;
    }

    setError('');
    setCode(normalized);
    setPass(PASSES[normalized] || { status: 'invalid' });
    setView('result');
  }

  function loadSandboxCode(sampleCode) {
    setCode(sampleCode);
    setPass(PASSES[sampleCode] || { status: 'invalid' });
    setView('result');
    setError('');
  }

  function resetPass() {
    setCode('');
    setPass(null);
    setView('entry');
    setDestinationChoice('new');
    setReviewed(false);
    setReceipt(null);
    setError('');
  }

  function acceptPass(event) {
    event.preventDefault();

    if (!reviewed) {
      setError('Confirm that you reviewed the sender, sharing scope, and destination case.');
      return;
    }

    const acceptedAt = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());

    setError('');
    setReceipt({
      caseId: destinationChoice === 'new' ? 'NS-2051' : 'NS-2041',
      caseLabel:
        destinationChoice === 'new'
          ? `${pass.person} · New intake`
          : `${pass.person} · Arranging`,
      actor: 'Elena Torres',
      acceptedAt: `Today at ${acceptedAt}`,
      scopeCount: pass.scope.length,
    });
    setView('accepted');
  }

  const currentStatus = statusCopy(pass?.status);

  return (
    <div className={styles.root}>
      <Head>
        <title>Transfer Pass | Passage</title>
        <meta
          name="description"
          content="Review and accept a family-authorized Transfer Pass into a funeral-home case."
        />
      </Head>

      <a className={styles.skip} href="#transfer-pass-main">Skip to Transfer Pass</a>

      <header className={styles.header}>
        <div className={styles.wordmark} aria-label="Passage">PASSAGE</div>
        <div className={styles.headerContext}>
          <span>Northstar Funeral Home</span>
          <span className={styles.avatar} aria-label="Signed in as Elena Torres">ET</span>
        </div>
      </header>

      <main id="transfer-pass-main" className={styles.shell}>
        <div className={styles.breadcrumb}>
          <span className={styles.continuityDot} aria-hidden="true" />
          <span>Intake</span>
          <span aria-hidden="true">/</span>
          <strong>Transfer Pass</strong>
        </div>

        {view === 'entry' && (
          <section className={styles.entryLayout} aria-labelledby="entry-heading">
            <div className={styles.intro}>
              <p className={styles.eyebrow}>Family handoff</p>
              <h1 id="entry-heading">Receive what the family chose to share.</h1>
              <p className={styles.lede}>
                A Transfer Pass opens only the information selected for this handoff.
                Review it before anything enters a case.
              </p>
            </div>

            <div className={styles.entryCard}>
              <div className={styles.entryMark} aria-hidden="true">↗</div>
              <div>
                <p className={styles.cardKicker}>Enter the pass code</p>
                <h2>Use the code beneath the QR</h2>
                <p>
                  If a QR was opened on this device, the pass appears here automatically.
                  Manual entry always remains available.
                </p>
              </div>

              <form className={styles.codeForm} onSubmit={findPass} noValidate>
                <label htmlFor="transfer-code">Transfer Pass code</label>
                <div className={styles.codeRow}>
                  <input
                    id="transfer-code"
                    aria-describedby={error ? 'code-error' : 'code-hint'}
                    aria-invalid={Boolean(error)}
                    autoCapitalize="characters"
                    autoComplete="off"
                    inputMode="text"
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="PASS-XXXX-XXXX"
                    spellCheck="false"
                    value={code}
                  />
                  <button className={styles.primaryButton} type="submit">Review pass</button>
                </div>
                {error ? (
                  <p className={styles.formError} id="code-error" role="alert">{error}</p>
                ) : (
                  <p className={styles.formHint} id="code-hint">Codes are not case-sensitive.</p>
                )}
              </form>

              {DEMO_MODE && (
                <details className={styles.sandboxTools}>
                  <summary>Sandbox status scenarios</summary>
                  <div className={styles.sampleButtons}>
                    {Object.keys(PASSES).map((sampleCode) => (
                      <button key={sampleCode} onClick={() => loadSandboxCode(sampleCode)} type="button">
                        {statusCopy(PASSES[sampleCode].status).label}
                      </button>
                    ))}
                    <button onClick={() => loadSandboxCode('PASS-NOT-FOUND')} type="button">
                      Pass not found
                    </button>
                  </div>
                </details>
              )}
            </div>

            <aside className={styles.privacyNote} aria-label="Before accepting a pass">
              <span className={styles.noteLine} aria-hidden="true" />
              <div>
                <strong>Before you accept</strong>
                <p>Confirm the sender, what is included, when access ends, and which case receives it.</p>
              </div>
            </aside>
          </section>
        )}

        {view === 'result' && pass?.status === 'active' && (
          <section className={styles.reviewLayout} aria-labelledby="review-heading">
            <div className={styles.reviewHeader}>
              <div>
                <p className={styles.eyebrow}>Transfer Pass received</p>
                <h1 id="review-heading" ref={resultHeadingRef} tabIndex="-1">
                  Review before accepting.
                </h1>
                <p className={styles.lede}>Nothing enters a case until you choose the destination below.</p>
              </div>
              <StatusPill status={pass.status} />
            </div>

            <div className={styles.reviewGrid}>
              <article className={styles.passCard}>
                <div className={styles.senderBlock}>
                  <div className={styles.senderAvatar} aria-hidden="true">MR</div>
                  <div>
                    <span>Sent by</span>
                    <h2>{pass.sender}</h2>
                    <p>{pass.relationship} · {pass.senderRole}</p>
                  </div>
                </div>

                <dl className={styles.factGrid}>
                  <div>
                    <dt>For</dt>
                    <dd>{pass.person}</dd>
                  </div>
                  <div>
                    <dt>To</dt>
                    <dd>{pass.destination}</dd>
                  </div>
                  <div>
                    <dt>Access ends</dt>
                    <dd>{pass.expires}<small>{pass.expiresDetail}</small></dd>
                  </div>
                  <div>
                    <dt>Pass code</dt>
                    <dd className={styles.mono}>{code}</dd>
                  </div>
                </dl>

                <div className={styles.scopeHeader}>
                  <div>
                    <span className={styles.cardKicker}>Sharing scope</span>
                    <h2>{pass.scope.length} items selected by the family</h2>
                  </div>
                  <span className={styles.scopeCount}>{pass.scope.length}</span>
                </div>

                <ul className={styles.scopeList}>
                  {pass.scope.map((item) => (
                    <li key={item.title}>
                      <span className={styles.checkMark} aria-hidden="true">✓</span>
                      <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                    </li>
                  ))}
                </ul>

                <div className={styles.notIncluded}>
                  <span aria-hidden="true">−</span>
                  <p><strong>Everything else stays private.</strong> This pass does not provide access to the rest of the family record.</p>
                </div>
              </article>

              <form className={styles.acceptCard} onSubmit={acceptPass} noValidate>
                <p className={styles.stepNumber}>Final step</p>
                <h2>Choose where this handoff goes.</h2>
                <p className={styles.acceptIntro}>Acceptance saves the shared items and a handoff receipt to one case.</p>

                <fieldset className={styles.destinationOptions}>
                  <legend>Destination case</legend>
                  <label className={destinationChoice === 'new' ? styles.radioSelected : undefined}>
                    <input
                      checked={destinationChoice === 'new'}
                      name="destination"
                      onChange={() => setDestinationChoice('new')}
                      type="radio"
                      value="new"
                    />
                    <span><strong>Create a new case</strong><small>{pass.person} · Intake</small></span>
                  </label>
                  <label className={destinationChoice === 'existing' ? styles.radioSelected : undefined}>
                    <input
                      checked={destinationChoice === 'existing'}
                      name="destination"
                      onChange={() => setDestinationChoice('existing')}
                      type="radio"
                      value="existing"
                    />
                    <span><strong>Use the matching case</strong><small>{pass.person} · NS-2041 · Arranging</small></span>
                  </label>
                </fieldset>

                <label className={styles.confirmation}>
                  <input
                    checked={reviewed}
                    onChange={(event) => setReviewed(event.target.checked)}
                    type="checkbox"
                  />
                  <span>I reviewed the sender, sharing scope, expiry, and destination case.</span>
                </label>

                {error && <p className={styles.formError} role="alert">{error}</p>}

                <button className={styles.acceptButton} type="submit">
                  Accept into case
                  <span aria-hidden="true">→</span>
                </button>
                <button className={styles.textButton} onClick={resetPass} type="button">Use a different pass</button>

                <div className={styles.outcomePreview}>
                  <span className={styles.noteLine} aria-hidden="true" />
                  <p><strong>After acceptance</strong>The case timeline records the sender, recipient, scope, time, and destination.</p>
                </div>
              </form>
            </div>
          </section>
        )}

        {view === 'result' && pass?.status !== 'active' && (
          <PassState
            code={code}
            headingRef={resultHeadingRef}
            onReset={resetPass}
            pass={pass}
          />
        )}

        {view === 'accepted' && receipt && (
          <AcceptedState
            headingRef={resultHeadingRef}
            onReset={resetPass}
            pass={pass}
            receipt={receipt}
          />
        )}

        <p className={styles.liveRegion} aria-live="polite">
          {view === 'accepted' ? `Transfer accepted into ${receipt?.caseId}.` : ''}
          {view === 'result' && pass ? currentStatus.label : ''}
        </p>
      </main>
    </div>
  );
}

function StatusPill({ status }) {
  const copy = statusCopy(status);
  return (
    <span className={`${styles.statusPill} ${styles[`status_${status}`]}`}>
      <span aria-hidden="true">{copy.mark}</span>
      {copy.label}
    </span>
  );
}

function PassState({ code, headingRef, onReset, pass }) {
  const content = {
    invalid: {
      eyebrow: 'Pass not found',
      title: 'We could not open this pass.',
      body: 'Check each character and try again. Ask the family to share a new code if this one cannot be confirmed.',
      note: 'No information was opened or added to a case.',
    },
    expired: {
      eyebrow: 'Access ended',
      title: 'This Transfer Pass has expired.',
      body: `${pass.sender || 'The family'}’s pass for ${pass.person || 'this handoff'} ended ${(pass.expires || 'earlier').toLowerCase()}. The family can issue a new pass.`,
      note: 'Expired passes cannot be accepted into a case.',
    },
    revoked: {
      eyebrow: 'Access withdrawn',
      title: 'The family revoked this pass.',
      body: `${pass.sender} ended this handoff before it was accepted. Contact the family if a new handoff is needed.`,
      note: 'No shared items were added to a case.',
    },
    accepted: {
      eyebrow: 'Handoff complete',
      title: 'This pass was already accepted.',
      body: `${pass.acceptedBy || 'A team member'} accepted it into ${pass.acceptedCase || 'a case'} ${(pass.acceptedAt || 'earlier').toLowerCase()}.`,
      note: 'Open the destination case to review the saved receipt and shared items.',
    },
  }[pass.status] || {
    eyebrow: 'Pass unavailable',
    title: 'This pass cannot be opened.',
    body: 'Try again or ask the family for a new pass.',
    note: 'No information was added to a case.',
  };

  return (
    <section className={styles.stateLayout} aria-labelledby="state-heading">
      <article className={styles.stateCard}>
        <StatusPill status={pass.status} />
        <p className={styles.eyebrow}>{content.eyebrow}</p>
        <h1 id="state-heading" ref={headingRef} tabIndex="-1">{content.title}</h1>
        <p className={styles.stateBody}>{content.body}</p>
        <p className={styles.stateNote}><span aria-hidden="true">i</span>{content.note}</p>
        <div className={styles.stateActions}>
          <button className={styles.primaryButton} onClick={onReset} type="button">Enter another code</button>
          {pass.status === 'accepted' && (
            <button className={styles.secondaryButton} type="button">Open {pass.acceptedCase}</button>
          )}
        </div>
        <p className={styles.codeReference}>Reference: <span>{code}</span></p>
      </article>
    </section>
  );
}

function AcceptedState({ headingRef, onReset, pass, receipt }) {
  return (
    <section className={styles.stateLayout} aria-labelledby="accepted-heading">
      <article className={`${styles.stateCard} ${styles.acceptedCard}`}>
        <div className={styles.successMark} aria-hidden="true">✓</div>
        <p className={styles.eyebrow}>Handoff accepted</p>
        <h1 id="accepted-heading" ref={headingRef} tabIndex="-1">The family’s information is in the case.</h1>
        <p className={styles.stateBody}>
          {pass.sender}’s selected items are now attached to {receipt.caseLabel}.
        </p>

        <dl className={styles.receipt}>
          <div><dt>Case</dt><dd>{receipt.caseId}</dd></div>
          <div><dt>Accepted by</dt><dd>{receipt.actor}</dd></div>
          <div><dt>Accepted</dt><dd>{receipt.acceptedAt}</dd></div>
          <div><dt>Scope saved</dt><dd>{receipt.scopeCount} selected items</dd></div>
          <div><dt>Next</dt><dd>Review intake and assign the first commitment</dd></div>
        </dl>

        <div className={styles.stateActions}>
          <button className={styles.acceptButton} type="button">Open {receipt.caseId}<span aria-hidden="true">→</span></button>
          <button className={styles.textButton} onClick={onReset} type="button">Receive another pass</button>
        </div>
      </article>
    </section>
  );
}
