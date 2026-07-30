'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BoundarySignal from './BoundarySignal';
import styles from './FamilyJourney.module.css';
import { DEFAULT_DRAFT, EXPIRIES, RECIPIENTS, SCOPES, type TransferDraft } from './types';
import { usePassageZero } from '../PassageZeroProvider';

const STEPS = [
  { id: 'recipient', label: 'Receiver' },
  { id: 'scope', label: 'Access' },
  { id: 'expiry', label: 'Timing' },
  { id: 'review', label: 'Review' },
] as const;

export default function TransferComposer() {
  const router = useRouter();
  const { dispatch } = usePassageZero();
  const [phase, setPhase] = useState(0);
  const [draft, setDraft] = useState<TransferDraft>(DEFAULT_DRAFT);
  const [activating, setActivating] = useState(false);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const recipient = useMemo(() => RECIPIENTS.find((item) => item.id === draft.recipientId), [draft.recipientId]);
  const expiry = useMemo(() => EXPIRIES.find((item) => item.id === draft.expiryId), [draft.expiryId]);
  const included = useMemo(() => SCOPES.filter((item) => draft.scopeIds.includes(item.id)), [draft.scopeIds]);
  const excluded = useMemo(() => SCOPES.filter((item) => !draft.scopeIds.includes(item.id)), [draft.scopeIds]);

  const stepComplete = [Boolean(recipient), included.length > 0, Boolean(expiry), false];
  const canContinue = stepComplete[phase] ?? true;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    stageHeading.current?.focus();
  }, [phase]);

  function selectRecipient(recipientId: string) {
    setDraft((current) => ({ ...current, recipientId }));
  }

  function toggleScope(scopeId: string) {
    setDraft((current) => ({
      ...current,
      scopeIds: current.scopeIds.includes(scopeId)
        ? current.scopeIds.filter((id) => id !== scopeId)
        : [...current.scopeIds, scopeId],
    }));
  }

  function continueFlow() {
    if (phase < STEPS.length - 1 && canContinue) setPhase((current) => current + 1);
  }

  function activate() {
    if (!recipient || !expiry || included.length === 0) return;
    setActivating(true);
    const activated: TransferDraft = { ...draft, activatedAt: new Date().toISOString() };
    window.sessionStorage.setItem('passage.family.transfer.v1', JSON.stringify(activated));
    dispatch({
      type: 'issue_transfer_pass',
      actorId: 'maya-rivera',
      idempotencyKey: `family:issue:${activated.activatedAt}`,
      scope: included.map((item) => ({ name: item.label, detail: item.detail })),
      expiresLabel: expiry.moment,
    });
    router.push('/family/pass');
  }

  return (
    <div className={styles.journey}>
      <div className={styles.journeyTop}>
        <div className={styles.caseLabel}>
          <span>SOFIA RIVERA</span>
          <strong>Family handoff</strong>
        </div>
        <div className={styles.saveState}><span aria-hidden="true" /> Saved in this family space</div>
      </div>

      <nav className={styles.steps} aria-label="Handoff steps">
        <ol>
          {STEPS.map((step, index) => {
            const isCurrent = index === phase;
            const isReached = index < phase;
            return (
              <li className={isCurrent ? styles.stepCurrent : isReached ? styles.stepReached : styles.stepFuture} key={step.id}>
                <button
                  aria-current={isCurrent ? 'step' : undefined}
                  disabled={index > phase}
                  onClick={() => index <= phase && setPhase(index)}
                  type="button"
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step.label}</strong>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={styles.composerGrid}>
        <section className={styles.stage} aria-live="polite">
          {phase === 0 && (
            <div className={styles.stageInner}>
              <div className={styles.stageIntro}>
                <p>01 / RECEIVER</p>
                <h1 ref={stageHeading} tabIndex={-1}>Who is expecting this handoff?</h1>
                <span>Choose one named organization. The pass will be made for them alone.</span>
              </div>
              <fieldset className={styles.recipientList}>
                <legend className={styles.srOnly}>Receiving organization</legend>
                {RECIPIENTS.map((item, index) => {
                  const selected = draft.recipientId === item.id;
                  const available = item.id === 'northstar';
                  return (
                    <label className={selected ? styles.recipientSelected : styles.recipient} key={item.id}>
                      <input checked={selected} disabled={!available} name="recipient" onChange={() => selectRecipient(item.id)} type="radio" />
                      <span className={styles.recipientIndex}>{String(index + 1).padStart(2, '0')}</span>
                      <span className={styles.recipientMain}>
                        <strong>{item.organization}</strong>
                        <small>{item.location}</small>
                      </span>
                      <span className={styles.recipientPerson}>
                        <strong>{item.person}</strong>
                        <small>{available ? item.role : 'Available in a later partner slice'}</small>
                      </span>
                      <span className={styles.radioMark} aria-hidden="true"><i /></span>
                    </label>
                  );
                })}
              </fieldset>
            </div>
          )}

          {phase === 1 && (
            <div className={styles.stageInner}>
              <div className={styles.stageIntro}>
                <p>02 / ACCESS</p>
                <h1 ref={stageHeading} tabIndex={-1}>Choose exactly what they can open.</h1>
                <span>Every category starts private. Turn on only what this handoff needs.</span>
              </div>
              <fieldset className={styles.scopeList}>
                <legend className={styles.srOnly}>Information categories</legend>
                {SCOPES.map((item, index) => {
                  const selected = draft.scopeIds.includes(item.id);
                  return (
                    <label className={selected ? styles.scopeSelected : styles.scope} key={item.id}>
                      <input checked={selected} onChange={() => toggleScope(item.id)} type="checkbox" />
                      <span className={styles.scopeIndex}>{String(index + 1).padStart(2, '0')}</span>
                      <span className={styles.scopeMain}>
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <span className={styles.scopeState}>{selected ? 'CAN OPEN' : 'PRIVATE'}</span>
                      <span className={styles.switch} aria-hidden="true"><i /></span>
                    </label>
                  );
                })}
              </fieldset>
              <div className={styles.privacyReadout} aria-live="polite">
                <strong>{included.length}</strong> visible / <strong>{excluded.length}</strong> private
              </div>
            </div>
          )}

          {phase === 2 && (
            <div className={styles.stageInner}>
              <div className={styles.stageIntro}>
                <p>03 / TIMING</p>
                <h1 ref={stageHeading} tabIndex={-1}>How long should the bridge stay open?</h1>
                <span>The pass closes at the time shown. You can close it earlier from your family space.</span>
              </div>
              <fieldset className={styles.expiryList}>
                <legend className={styles.srOnly}>Access duration</legend>
                {EXPIRIES.map((item, index) => {
                  const selected = draft.expiryId === item.id;
                  return (
                    <label className={selected ? styles.expirySelected : styles.expiry} key={item.id}>
                      <input
                        checked={selected}
                        name="expiry"
                        onChange={() => setDraft((current) => ({ ...current, expiryId: item.id }))}
                        type="radio"
                      />
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{item.label}</strong>
                      <small>{item.moment}</small>
                      <i aria-hidden="true" />
                    </label>
                  );
                })}
              </fieldset>
              <div className={styles.timingNote}>
                <span aria-hidden="true">!</span>
                <p><strong>You stay in control.</strong> Closing a pass does not change or delete Sofia's family record.</p>
              </div>
            </div>
          )}

          {phase === 3 && recipient && expiry && (
            <div className={styles.stageInner}>
              <div className={styles.stageIntro}>
                <p>04 / REVIEW</p>
                <h1 ref={stageHeading} tabIndex={-1}>One receiver. A clear boundary.</h1>
                <span>Check the complete handoff before it becomes available.</span>
              </div>

              <div className={styles.reviewRoute}>
                <div><span>FROM</span><strong>Sofia's family</strong><small>Family-controlled record</small></div>
                <div className={styles.routeLine} aria-hidden="true"><span /><i>HANDOFF</i><span /></div>
                <div><span>TO</span><strong>{recipient.organization}</strong><small>{recipient.person}</small></div>
              </div>

              <div className={styles.reviewBoundary}>
                <section>
                  <header><span>THEY CAN OPEN</span><strong>{String(included.length).padStart(2, '0')}</strong></header>
                  <ul>{included.map((item) => <li key={item.id}><span aria-hidden="true">+</span>{item.label}</li>)}</ul>
                </section>
                <section className={styles.reviewPrivate}>
                  <header><span>STAYS PRIVATE</span><strong>{String(excluded.length).padStart(2, '0')}</strong></header>
                  <ul>{excluded.map((item) => <li key={item.id}><span aria-hidden="true">-</span>{item.label}</li>)}</ul>
                </section>
              </div>

              <dl className={styles.reviewFacts}>
                <div><dt>Receiving contact</dt><dd>{recipient.person}, {recipient.role}</dd></div>
                <div><dt>Access window</dt><dd>{expiry.label}</dd></div>
                <div><dt>Closes</dt><dd>{expiry.moment}</dd></div>
              </dl>
            </div>
          )}

          <footer className={styles.stageActions}>
            {phase > 0 ? <button className={styles.back} onClick={() => setPhase((current) => current - 1)} type="button">Back</button> : <span />}
            {phase < 3 ? (
              <button className={styles.continue} disabled={!canContinue} onClick={continueFlow} type="button">
                Continue <span aria-hidden="true">-&gt;</span>
              </button>
            ) : (
              <button className={styles.activate} disabled={activating} onClick={activate} type="button">
                {activating ? 'Creating preview pass...' : 'Create preview pass'} <span aria-hidden="true">-&gt;</span>
              </button>
            )}
          </footer>
        </section>

        <BoundarySignal recipient={recipient} included={included} excluded={excluded} expiry={expiry} />
      </div>
    </div>
  );
}
