'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createFamilyInvitation, type FamilyInvitationState } from './family-actions';
import styles from '../../../proof-loop.module.css';

const initialState: FamilyInvitationState = { status: 'idle' };

function defaultFamilyInvitationExpiry() {
  const value = new Date(Date.now() + 14 * 86400000);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

export function FamilyInvitationForm({ workflowId, requestId }: { workflowId: string; requestId: string }) {
  const [state, action, pending] = useActionState(createFamilyInvitation, initialState);

  if (state.status === 'created' && state.receipt) {
    const receipt = state.receipt;
    return (
      <div className={styles.receipt} role="status">
        <h3>{receipt.replayed ? 'Invitation already pending.' : 'Family invitation created. Not sent.'}</h3>
        <p>{receipt.replayed ? 'Passage found the existing live invitation for this person.' : 'Share this secure link with them directly. Passage did not send an email.'}</p>
        <dl>
          <div><dt>Recipient</dt><dd>{receipt.invitedEmail}</dd></div>
          <div><dt>Relationship</dt><dd>{receipt.relationship}</dd></div>
          <div><dt>Purpose</dt><dd>{receipt.purpose}</dd></div>
          <div><dt>Expires</dt><dd>{new Date(receipt.expiresAt).toLocaleString()}</dd></div>
        </dl>
        {receipt.invitePath && (
          <div className={styles.recoveryActions}>
            <Link href={receipt.invitePath} prefetch={false}>Open secure invitation →</Link>
          </div>
        )}
        {receipt.invitePath && <p className={styles.boundary}>The secure link contains a sensitive invitation credential. Do not include it in screenshots, logs, or committed evidence.</p>}
      </div>
    );
  }

  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="requestId" type="hidden" value={requestId} />
      <fieldset disabled={pending}>
        <legend>Invite a family member to this case.</legend>
        <label>Their email<input autoComplete="off" name="invitedEmail" placeholder="family@example.com" required type="email" /></label>
        <label>Their name<input maxLength={120} name="displayName" required /></label>
        <label>Relationship to the case<input defaultValue="Family member" maxLength={80} name="relationship" required /></label>
        <label>Role<select defaultValue="family_member" name="participantRole">
          <option value="family_member">Family member (view-only)</option>
          <option value="executor">Executor / estate administrator (can create tasks, invite others)</option>
          <option value="poa_medical_proxy">POA / medical proxy (can create tasks, invite others)</option>
          <option value="clergy_officiant">Clergy / officiant (view-only)</option>
          <option value="cemetery_crematory_contact">Cemetery / crematory contact (view-only)</option>
        </select></label>
        <label>Purpose<input defaultValue="Stay updated on this case" maxLength={240} name="purpose" required /></label>
        <label>Expires<input defaultValue={defaultFamilyInvitationExpiry()} name="expiresAt" required type="datetime-local" /></label>
        <button type="submit">{pending ? 'Creating…' : 'Create family invitation'}</button>
      </fieldset>
      {state.message && <p className={styles.error} role="alert">{state.message}</p>}
      <p className={styles.boundary}>Family member, clergy/officiant, and cemetery/crematory roles are read-only visibility into this case's status, tasks, and updates. Executor and POA/medical proxy can also create tasks and invite other participants on this case. No role grants staff access.</p>
    </form>
  );
}
