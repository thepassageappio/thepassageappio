'use client';

import { useActionState } from 'react';
import { assignTask, initialDirectorCommandState, revokeInvitation, revokeMember } from './actions';
import styles from '../operations-beta.module.css';

type Candidate = { id: string; name: string };

function Receipt({ state }: { state: typeof initialDirectorCommandState }) {
  if (!state.message) return null;
  return (
    <div className={state.status === 'saved' ? styles.commandReceipt : styles.commandError} role={state.status === 'saved' ? 'status' : 'alert'}>
      <strong>{state.status === 'saved' ? 'Saved by Passage' : 'Nothing changed'}</strong>
      <p>{state.message}</p>
      {state.receipt && <small>Server time {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(state.receipt.occurredAt))} · receipt reference {state.receipt.eventId}</small>}
    </div>
  );
}

export function AssignTaskForm({ taskId, requestId, version, candidates, currentOwner }: { taskId: string; requestId: string; version: number; candidates: Candidate[]; currentOwner: string }) {
  const [state, action, pending] = useActionState(assignTask, initialDirectorCommandState);
  return (
    <form action={action} aria-busy={pending} className={styles.commandForm}>
      <input name="taskId" type="hidden" value={taskId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <p><strong>{currentOwner === 'Unassigned' ? 'Assign this commitment' : 'Change the current owner'}</strong><span>Current owner: {currentOwner}. Passage validates location authority again when you save.</span></p>
      <label>New owner<select disabled={pending || candidates.length === 0} name="assigneeId" required>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
      <label>Reason<input disabled={pending || candidates.length === 0} maxLength={240} name="reason" placeholder="Why ownership is changing" required /></label>
      <button aria-busy={pending} disabled={pending || candidates.length === 0} type="submit">{pending ? 'Saving ownership…' : candidates.length ? (currentOwner === 'Unassigned' ? 'Assign work' : 'Save reassignment') : 'No alternate staff'}</button>
      <Receipt state={state} />
    </form>
  );
}

export function RevokeInvitationForm({ invitationId, recipient }: { invitationId: string; recipient: string }) {
  const [state, action, pending] = useActionState(revokeInvitation, initialDirectorCommandState);
  return (
    <form action={action} aria-busy={pending} className={styles.compactForm}>
      <input name="invitationId" type="hidden" value={invitationId} />
      <label>Reason for revoking {recipient}<input disabled={pending} maxLength={240} name="reason" required /></label>
      <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Revoking invitation…' : 'Revoke invitation'}</button>
      <Receipt state={state} />
    </form>
  );
}

export function RevokeMemberForm({ memberId, memberName, requestId, activeAssignmentCount }: { memberId: string; memberName: string; requestId: string; activeAssignmentCount: number }) {
  const [state, action, pending] = useActionState(revokeMember, initialDirectorCommandState);
  const blocked = activeAssignmentCount > 0;
  return (
    <form action={action} aria-busy={pending} className={styles.compactForm}>
      <input name="memberId" type="hidden" value={memberId} />
      <input name="requestId" type="hidden" value={requestId} />
      <label>Reason for ending {memberName}’s access<input disabled={pending || blocked} maxLength={240} name="reason" required /></label>
      <button aria-busy={pending} disabled={pending || blocked} type="submit">{blocked ? `Reassign ${activeAssignmentCount} ${activeAssignmentCount === 1 ? 'commitment' : 'commitments'} first` : pending ? 'Ending access…' : 'End team access'}</button>
      <p className={styles.formBoundary}>{blocked ? 'Passage will not orphan active work.' : 'Activity history remains; current location grants end together.'}</p>
      <Receipt state={state} />
    </form>
  );
}
