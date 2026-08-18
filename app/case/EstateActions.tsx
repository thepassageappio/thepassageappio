'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createAdditionalEstate, inviteToEstate, type CreateEstateState, type InviteToEstateState } from './actions';
import styles from '../login/Auth.module.css';

const initialCreateState: CreateEstateState = { status: 'idle' };
const initialInviteState: InviteToEstateState = { status: 'idle' };

export function CreateEstateForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(createAdditionalEstate, initialCreateState);

  if (state.status === 'upgrade-required') {
    return (
      <div className={styles.unavailable} role="alert">
        <strong>Upgrade required</strong>
        <p>{state.message}</p>
        <Link className={styles.textLink} href="/pricing">Upgrade your plan</Link>
      </div>
    );
  }

  return (
    <form className={styles.inviteForm} action={action} aria-busy={pending} key={state.status === 'created' ? requestId : undefined}>
      <input name="requestId" type="hidden" value={requestId} />
      <label htmlFor="estatePersonName">Who is this estate for?</label>
      <input id="estatePersonName" maxLength={200} name="personName" placeholder="Full name" required type="text" />
      <label htmlFor="estateRelationship">Your relationship <span>Optional</span></label>
      <input id="estateRelationship" maxLength={100} name="relationship" placeholder="Spouse, parent, grandparent…" type="text" />
      <button className={styles.primary} disabled={pending} type="submit">{pending ? 'Adding…' : 'Add another estate'}</button>
      {state.status === 'created' && state.message && <p className={styles.notice} role="status">{state.message}</p>}
      {(state.status === 'validation' || state.status === 'denied' || state.status === 'unavailable') && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
    </form>
  );
}

export function InviteToEstateForm({ workflowId, requestId, personLabel }: { workflowId: string; requestId: string; personLabel: string }) {
  const [state, action, pending] = useActionState(inviteToEstate, initialInviteState);

  if (state.status === 'created' && state.receipt) {
    return (
      <div className={styles.notice} role="status">
        <strong>{state.receipt.replayed ? 'Invitation already pending.' : `Invited to see ${personLabel}.`}</strong>
        <p>{state.receipt.replayed ? 'Passage found an existing live invitation for this person.' : 'Share this secure link with them directly. Passage did not send an email.'}</p>
        {state.receipt.invitePath && <p>Secure link: <code>{state.receipt.invitePath}</code></p>}
      </div>
    );
  }

  return (
    <form className={styles.inviteForm} action={action} aria-busy={pending}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="requestId" type="hidden" value={requestId} />
      <label htmlFor={`invite-email-${workflowId}`}>Invite someone to view {personLabel}&apos;s estate</label>
      <input id={`invite-email-${workflowId}`} name="invitedEmail" placeholder="their-email@example.com" required type="email" />
      <label htmlFor={`invite-name-${workflowId}`}>Their name</label>
      <input id={`invite-name-${workflowId}`} maxLength={120} name="displayName" placeholder="Full name" required type="text" />
      <label htmlFor={`invite-relationship-${workflowId}`}>Their relationship <span>Optional</span></label>
      <input defaultValue="Family member" id={`invite-relationship-${workflowId}`} maxLength={80} name="relationship" type="text" />
      <button className={styles.primary} disabled={pending} type="submit">{pending ? 'Inviting…' : 'Invite to view'}</button>
      {(state.status === 'validation' || state.status === 'denied' || state.status === 'conflict' || state.status === 'unavailable') && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
      <p>They&apos;ll see status, tasks, and updates for this estate. They won&apos;t need to create a duplicate account or re-enter anything already on file — one click on their invite link and they&apos;re in.</p>
    </form>
  );
}
