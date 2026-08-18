'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { assignTask, createCase, createLocation, grantStaffLocation, revokeInvitation, revokeMember, setStaffCaseCreationGrant, type DirectorCommandState } from './actions';
import styles from '../operations-beta.module.css';

type Candidate = { id: string; name: string };
const initialDirectorCommandState: DirectorCommandState = { status: 'idle' };

function Receipt({ state }: { state: DirectorCommandState }) {
  if (!state.message) return null;
  if (state.status === 'upgrade-required') {
    return (
      <div className={styles.commandError} role="alert">
        <strong>Upgrade required</strong>
        <p>{state.message}</p>
        <Link className={styles.primaryLink} href="/pricing">Upgrade now</Link>
      </div>
    );
  }
  return (
    <div className={state.status === 'saved' ? styles.commandReceipt : styles.commandError} role={state.status === 'saved' ? 'status' : 'alert'}>
      <strong>{state.status === 'saved' ? 'Saved by Passage' : 'Nothing changed'}</strong>
      <p>{state.message}</p>
      {state.receipt && <small>Saved {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'long' }).format(new Date(state.receipt.occurredAt))} · visible to authorized organization staff · recorded in team activity</small>}
      {state.workflowId && <p><Link className={styles.primaryLink} href={`/director/cases/${state.workflowId}`}>Open the case →</Link></p>}
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
      <p><strong>{currentOwner === 'Unassigned' ? 'Assign this commitment' : 'Change the current owner'}</strong><span>Current owner: {currentOwner}. Passage checks that the new owner can work at this location before saving.</span></p>
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
      <button aria-busy={pending || blocked} disabled={pending || blocked} type="submit">{blocked ? `Reassign ${activeAssignmentCount} ${activeAssignmentCount === 1 ? 'commitment' : 'commitments'} first` : pending ? 'Ending access…' : 'End team access'}</button>
      <p className={styles.formBoundary}>{blocked ? 'Passage will not orphan active work.' : 'Activity history remains; current location grants end together.'}</p>
      <Receipt state={state} />
    </form>
  );
}

export function CreateCaseForm({ organizationId, locations, requestId }: { organizationId: string; locations: Candidate[]; requestId: string }) {
  const [state, action, pending] = useActionState(createCase, initialDirectorCommandState);
  if (locations.length === 0) return <p className={styles.formBoundary}>No authorized location is available to open a case under yet.</p>;
  return (
    <form action={action} aria-busy={pending} className={styles.commandForm} key={requestId}>
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="requestId" type="hidden" value={requestId} />
      <fieldset disabled={pending}>
        <legend>Create a case.</legend>
        {locations.length > 1 && <label>Location<select name="locationId" required>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>}
        {locations.length === 1 && <input name="locationId" type="hidden" value={locations[0].id} />}
        <label>Case reference<input maxLength={60} name="caseReference" placeholder="e.g. a file or reference number" required /></label>
        <label>Family name<input maxLength={200} name="familyName" required /></label>
        <label>Person’s name<input maxLength={200} name="personName" required /></label>
        <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Creating…' : 'Create case'}</button>
      </fieldset>
      <p className={styles.formBoundary}>Passage seeds the standard 15-item intake checklist automatically.</p>
      <Receipt state={state} />
    </form>
  );
}

export function CreateLocationForm({ organizationId, requestId }: { organizationId: string; requestId: string }) {
  const [state, action, pending] = useActionState(createLocation, initialDirectorCommandState);
  return (
    <form action={action} aria-busy={pending} className={styles.commandForm} key={requestId}>
      <input name="organizationId" type="hidden" value={organizationId} />
      <input name="requestId" type="hidden" value={requestId} />
      <fieldset disabled={pending}>
        <legend>Add a location.</legend>
        <label>Location name<input maxLength={200} name="name" required /></label>
        <label>Address <span>Optional</span><input maxLength={200} name="address" /></label>
        <label>City <span>Optional</span><input maxLength={100} name="city" /></label>
        <label>State <span>Optional</span><input maxLength={56} name="state" /></label>
        <label>ZIP <span>Optional</span><input maxLength={20} name="zip" /></label>
        <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Adding location…' : 'Add location'}</button>
      </fieldset>
      <Receipt state={state} />
    </form>
  );
}

export function GrantStaffLocationForm({ memberId, memberName, availableLocations, requestId }: { memberId: string; memberName: string; availableLocations: Candidate[]; requestId: string }) {
  const [state, action, pending] = useActionState(grantStaffLocation, initialDirectorCommandState);
  if (availableLocations.length === 0) return null;
  return (
    <form action={action} aria-busy={pending} className={styles.compactForm} key={requestId}>
      <input name="memberId" type="hidden" value={memberId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="canCreateCases" type="hidden" value="false" />
      <label>Add a location for {memberName}<select disabled={pending} name="locationId" required>{availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Adding…' : 'Add location'}</button>
      <Receipt state={state} />
    </form>
  );
}

export function StaffCaseCreationGrantForm({ memberId, locationId, memberName, locationName, granted, requestId }: { memberId: string; locationId: string; memberName: string; locationName: string; granted: boolean; requestId: string }) {
  const [state, action, pending] = useActionState(setStaffCaseCreationGrant, initialDirectorCommandState);
  return (
    <form action={action} aria-busy={pending} className={styles.compactForm}>
      <input name="memberId" type="hidden" value={memberId} />
      <input name="locationId" type="hidden" value={locationId} />
      <input name="requestId" type="hidden" value={requestId} />
      <input name="granted" type="hidden" value={(!granted).toString()} />
      {granted
        ? <label>Reason for removing case-creation rights<input disabled={pending} maxLength={240} name="reason" placeholder={`Why ${memberName} should no longer create cases at ${locationName}`} required /></label>
        : <p className={styles.formBoundary}>{memberName} cannot create cases at {locationName} yet.</p>}
      <button aria-busy={pending} disabled={pending} type="submit">{pending ? 'Saving…' : granted ? 'Remove case-creation rights' : 'Allow creating cases here'}</button>
      <Receipt state={state} />
    </form>
  );
}
