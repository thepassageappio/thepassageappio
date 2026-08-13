'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  acceptParticipantInvitation,
  declineParticipantInvitation,
  type ParticipantDecisionState,
} from '../[token]/actions';
import styles from '../../login/Auth.module.css';

const initialState: ParticipantDecisionState = { status: 'idle' };

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

export function ParticipantInvitationDecision() {
  const [declineState, declineAction, declinePending] = useActionState(
    declineParticipantInvitation,
    initialState,
  );
  const [declineOpen, setDeclineOpen] = useState(false);
  const [acceptStarted, setAcceptStarted] = useState(false);
  const declineTrigger = useRef<HTMLButtonElement>(null);
  const declineReceipt = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const busy = declinePending || acceptStarted;

  useEffect(() => {
    if (declineState.status === 'declined') {
      setDeclineOpen(false);
      window.requestAnimationFrame(() => declineReceipt.current?.focus());
    } else if (declineState.status === 'error') {
      window.requestAnimationFrame(() => errorSummary.current?.focus());
    }
  }, [declineState]);

  function closeDecline() {
    setDeclineOpen(false);
    window.requestAnimationFrame(() => declineTrigger.current?.focus());
  }

  if (declineState.status === 'declined') {
    return (
      <section className={styles.receipt} role="status">
        <span>INVITATION DECLINED</span>
        <h2 ref={declineReceipt} tabIndex={-1}>Invitation declined.</h2>
        <p>No family access was added. Passage saved your decision for the family coordinator.</p>
        <dl>
          <div><dt>Saved</dt><dd><time dateTime={declineState.declinedAt}>{dateTime(declineState.declinedAt)}</time></dd></div>
          <div><dt>Visible to</dt><dd>You and the family coordinator</dd></div>
          <div><dt>Proof saved to</dt><dd>Family invitation history</dd></div>
          <div><dt>Next</dt><dd>You can close this page. Ask the family coordinator if you need a new invitation later.</dd></div>
        </dl>
      </section>
    );
  }

  return (
    <div className={styles.decisionGroup}>
      {declineState.status === 'error' && (
        <div className={styles.alert} ref={errorSummary} role="alert" tabIndex={-1}>
          <strong>
            {declineState.kind === 'known_failure'
              ? 'Nothing changed.'
              : declineState.kind === 'stale'
                ? 'Review the current invitation.'
                : 'Check the saved result.'}
          </strong>
          <p>{declineState.message}</p>
        </div>
      )}
      <form action={acceptParticipantInvitation} className={styles.nextStep} onSubmit={() => setAcceptStarted(true)}>
        <strong>Accept this family invitation?</strong>
        <p>Passage will save this account and the acceptance time. You will see only the items listed above.</p>
        <AcceptDecisionButton disabled={declinePending} />
      </form>
      <button
        aria-controls="decline-invitation-confirmation"
        aria-expanded={declineOpen}
        className={styles.declineTrigger}
        disabled={busy}
        onClick={() => setDeclineOpen((current) => !current)}
        ref={declineTrigger}
        type="button"
      >
        Decline invitation
      </button>
      {declineOpen && (
        <div
          className={styles.declineConfirmation}
          id="decline-invitation-confirmation"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              closeDecline();
            }
          }}
        >
          <h2>Decline this invitation?</h2>
          <p>No family access will be added. Passage will save your decision for the family coordinator.</p>
          <div className={styles.declineActions}>
            <button disabled={busy} onClick={closeDecline} type="button">Go back</button>
            <form action={declineAction}>
              <DeclineDecisionButton disabled={acceptStarted} />
            </form>
          </div>
        </div>
      )}
      <div aria-live="polite" className={styles.srOnly} role="status">
        {busy ? 'Saving your invitation decision. No result is shown until Passage verifies the saved receipt.' : ''}
      </div>
    </div>
  );
}

function AcceptDecisionButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button aria-busy={pending} className={styles.primary} disabled={disabled || pending} type="submit">
      {pending ? 'Accepting invitation...' : 'Accept invitation'}
    </button>
  );
}

function DeclineDecisionButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button aria-busy={pending} className={styles.declineCommit} disabled={disabled || pending} type="submit">
      {pending ? 'Declining invitation...' : 'Decline invitation'}
    </button>
  );
}
