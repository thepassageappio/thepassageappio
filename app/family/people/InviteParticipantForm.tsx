'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createParticipantInvitation,
  type InviteParticipantState,
} from './actions';
import { participantCategoryLabels } from '@/lib/presentation/participant-labels';
import styles from './People.module.css';

const initialState: InviteParticipantState = { status: 'idle' };

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

export function InviteParticipantForm({
  continuitySpaceId,
  requestId,
}: {
  continuitySpaceId: string;
  requestId: string;
}) {
  const [state, action] = useActionState(createParticipantInvitation, initialState);
  const [copyStatus, setCopyStatus] = useState('');
  const [secureLink, setSecureLink] = useState('');
  const errorSummary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSecureLink(
      state.status === 'created' && state.rawToken
        ? `${window.location.origin}/invite/${encodeURIComponent(state.rawToken)}`
        : '',
    );
  }, [state]);

  useEffect(() => {
    if (state.status === 'error') errorSummary.current?.focus();
  }, [state]);

  async function copyLink() {
    if (!secureLink) return;
    try {
      await navigator.clipboard.writeText(secureLink);
      setCopyStatus('Secure link copied.');
    } catch {
      setCopyStatus('Copy did not work. Select the link and copy it manually.');
    }
  }

  if (state.status === 'created' || state.status === 'replayed') {
    const scope = participantCategoryLabels(state.categoryScope).join(', ');
    return (
      <section className={styles.receipt} aria-labelledby="invitation-receipt-title" role="status">
        <p>NOT SENT BY PASSAGE</p>
        <h3 id="invitation-receipt-title">
          {state.status === 'created' ? 'Invitation created.' : 'This invitation is already waiting.'}
        </h3>
        <dl className={styles.facts}>
          <div><dt>Person invited</dt><dd>{state.displayName}</dd></div>
          <div><dt>Relationship</dt><dd>{state.relationship}</dd></div>
          <div><dt>Purpose</dt><dd>{state.purpose}</dd></div>
          <div><dt>Can see</dt><dd>{scope}</dd></div>
          <div><dt>Email named for this invitation</dt><dd>{state.invitedEmail}</dd></div>
          <div><dt>Created</dt><dd><time dateTime={state.createdAt}>{dateTime(state.createdAt)}</time></dd></div>
          <div><dt>Expires</dt><dd><time dateTime={state.expiresAt}>{dateTime(state.expiresAt)}</time></dd></div>
          <div><dt>Visible to</dt><dd>You and the person who uses the secure link</dd></div>
          <div><dt>Proof saved to</dt><dd>Family invitation history</dd></div>
          <div><dt>Next</dt><dd>Share the secure link through a private channel you trust</dd></div>
        </dl>
        {secureLink ? (
          <div className={styles.copyArea}>
            <label htmlFor="secure-invitation-link">One-time secure link</label>
            <input id="secure-invitation-link" readOnly value={secureLink} />
            <button onClick={copyLink} type="button">Copy secure link</button>
            <p role="status">{copyStatus}</p>
          </div>
        ) : (
          <div className={styles.replayNotice} role="status">
            <strong>The secure link is not shown again.</strong>
            <p>If the first link was lost, the family coordinator will need to create a replacement link in the next access-recovery step.</p>
          </div>
        )}
        <p className={styles.deliveryNote}>Passage did not send this invitation. Share the link yourself.</p>
      </section>
    );
  }

  return (
    <form action={action} className={styles.inviteForm} noValidate>
      <input name="continuitySpaceId" type="hidden" value={continuitySpaceId} />
      <input name="requestId" type="hidden" value={requestId} />
      {state.status === 'error' && (
        <div className={styles.error} id="invitation-form-error" ref={errorSummary} role="alert" tabIndex={-1}>
          <strong>Check the invitation details.</strong>
          <p>{state.message} Nothing was saved.</p>
        </div>
      )}
      <div className={styles.formGrid}>
        <label htmlFor="participant-display-name">
          Person’s name
          <input aria-describedby={state.status === 'error' && state.field === 'displayName' ? 'invitation-form-error' : undefined} aria-invalid={state.status === 'error' && state.field === 'displayName'} autoComplete="name" id="participant-display-name" maxLength={120} name="displayName" required />
        </label>
        <label htmlFor="participant-email">
          Email named for this invitation
          <input aria-describedby={state.status === 'error' && state.field === 'invitedEmail' ? 'invitation-form-error' : undefined} aria-invalid={state.status === 'error' && state.field === 'invitedEmail'} autoComplete="email" id="participant-email" name="invitedEmail" required type="email" />
        </label>
        <label htmlFor="participant-relationship">
          Relationship
          <input aria-describedby={state.status === 'error' && state.field === 'relationship' ? 'invitation-form-error' : undefined} aria-invalid={state.status === 'error' && state.field === 'relationship'} id="participant-relationship" maxLength={80} name="relationship" placeholder="For example, close friend" required />
        </label>
        <label htmlFor="participant-expiry">
          Invitation length
          <select aria-describedby={state.status === 'error' && state.field === 'expiryDays' ? 'invitation-form-error' : undefined} aria-invalid={state.status === 'error' && state.field === 'expiryDays'} defaultValue="7" id="participant-expiry" name="expiryDays">
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </label>
      </div>
      <label htmlFor="participant-purpose">
        Why are you inviting them?
        <textarea aria-describedby={state.status === 'error' && state.field === 'purpose' ? 'invitation-form-error participant-purpose-help' : 'participant-purpose-help'} aria-invalid={state.status === 'error' && state.field === 'purpose'} id="participant-purpose" maxLength={240} name="purpose" placeholder="For example, keep them informed about service updates" required rows={4} />
        <small id="participant-purpose-help">Use 3 to 240 characters. The invited person will see this reason.</small>
      </label>
      <fieldset aria-describedby={state.status === 'error' && state.field === 'categoryScope' ? 'invitation-form-error' : undefined}>
        <legend>Can see</legend>
        <label className={styles.checkLabel}>
          <input defaultChecked name="categoryScope" type="checkbox" value="updates" />
          <span><strong>Family updates</strong><small>The coordinator grants this category. Passage maps eligible case progress into plain language.</small></span>
        </label>
      </fieldset>
      <div className={styles.review}>
        <strong>Before you create it</strong>
        <p>Passage saves the invitation and its limits. Passage does not send it. You will copy one secure link and share it yourself.</p>
        <p><b>Proof saved to:</b> Family invitation history</p>
      </div>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <button aria-busy={pending} className={styles.primary} disabled={pending} type="submit">
        {pending ? 'Creating invitation and saving the receipt…' : 'Create secure invitation'}
      </button>
      <span aria-live="polite" className={styles.srOnly} role="status">
        {pending ? 'Creating the invitation. Nothing is shown as complete until the saved receipt is verified.' : ''}
      </span>
    </>
  );
}
