'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { assignTask, revokeInvitation, revokeMember, type DirectorCommandState } from './actions';
import styles from '../operations-beta.module.css';

type Candidate = { id: string; name: string };
type AssignmentKind = 'task' | 'first-task';
const initialDirectorCommandState: DirectorCommandState = { status: 'idle' };

function Receipt({ state }: { state: DirectorCommandState }) {
  if (!state.message) return null;
  return (
    <div className={state.status === 'saved' ? styles.commandReceipt : styles.commandError} role={state.status === 'saved' ? 'status' : 'alert'}>
      <strong>{state.status === 'saved' ? 'Saved by Passage' : 'Nothing changed'}</strong>
      <p>{state.message}</p>
      {state.receipt && <small>Saved {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(state.receipt.occurredAt))} · visible to authorized organization staff · recorded in team activity</small>}
    </div>
  );
}

export function AssignTaskForm({
  taskId,
  workflowId,
  requestId,
  version,
  candidates,
  currentOwner,
  locationName,
  assignmentKind = 'task',
}: {
  taskId: string;
  workflowId: string;
  requestId: string;
  version: number;
  candidates: Candidate[];
  currentOwner: string;
  locationName: string;
  assignmentKind?: AssignmentKind;
}) {
  const [state, action, pending] = useActionState(assignTask, initialDirectorCommandState);
  const noCandidates = candidates.length === 0;
  const unassignedLabel = assignmentKind === 'first-task' ? 'Assign first task' : 'Assign task';
  return (
    <form action={action} aria-busy={pending} className={styles.commandForm}>
      <input name="taskId" type="hidden" value={taskId} />
      <input name="workflowId" type="hidden" value={workflowId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="expectedVersion" type="hidden" value={version} />
      <p><strong>{currentOwner === 'Unassigned' ? 'Assign this task' : 'Change the current owner'}</strong><span>Current owner: {currentOwner}. Passage checks that the team member can work at this location before saving.</span></p>
      <label>Team member<select disabled={pending || noCandidates} name="assigneeId" required>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
      <label>Why are you assigning this person?<input disabled={pending || noCandidates} maxLength={240} name="reason" placeholder="Add a short reason" required /></label>
      <button aria-busy={pending} disabled={pending || noCandidates} type="submit">{pending ? 'Saving ownership…' : noCandidates ? 'No eligible team members' : currentOwner === 'Unassigned' ? unassignedLabel : 'Save reassignment'}</button>
      {noCandidates && <p className={styles.formBoundary}>No eligible team members can work at {locationName}. <Link href="/director/team">Review team access</Link>, then return here.</p>}
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
