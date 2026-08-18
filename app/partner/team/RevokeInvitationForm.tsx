'use client';

import { useActionState } from 'react';
import { revokePartnerInvitation, type PartnerTeamCommandState } from './actions';
import styles from '../../operations-beta.module.css';

const initialState: PartnerTeamCommandState = { status: 'idle' };

export function RevokeInvitationForm({ invitationId, recipient }: { invitationId: string; recipient: string }) {
  const [state, action, pending] = useActionState(revokePartnerInvitation, initialState);
  return (
    <form action={action} aria-busy={pending} className={styles.compactForm}>
      <input name="invitationId" type="hidden" value={invitationId} />
      <label>Reason for revoking {recipient}<input disabled={pending} maxLength={240} name="reason" required /></label>
      <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Revoking invitation…' : 'Revoke invitation'}</button>
      {state.message && (
        <div className={state.status === 'saved' ? styles.commandReceipt : styles.commandError} role={state.status === 'saved' ? 'status' : 'alert'}>
          <strong>{state.status === 'saved' ? 'Saved by Passage' : 'Nothing changed'}</strong>
          <p>{state.message}</p>
        </div>
      )}
    </form>
  );
}
