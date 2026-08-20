'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createAdditionalEstate, inviteToHousehold, type CreateEstateState, type InviteToHouseholdState } from './actions';
import styles from '../login/Auth.module.css';

const initialCreateState: CreateEstateState = { status: 'idle' };
const initialInviteState: InviteToHouseholdState = { status: 'idle' };

export function CreateEstateForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(createAdditionalEstate, initialCreateState);

  if (state.status === 'upgrade-required') {
    return (
      <div className={styles.unavailable} role="alert">
        <strong>Upgrade required</strong>
        <p>{state.message}</p>
        <Link className={styles.textLink} href="/account/billing">Manage your plan</Link>
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

// Single-estate invite, locked to exactly one workflow -- used where the
// inviter's own authority is bounded to one case (e.g. an elevated
// participant on app/case/[id]/tasks/page.tsx inviting someone else to
// *their* case; they have no visibility into the owner's other estates, so
// there is nothing to pick between). Reuses the same inviteToHousehold
// action as InviteAcrossHouseholdForm below with a single, non-visible,
// always-selected estate.
export function InviteToEstateForm({ workflowId, requestId, personLabel }: { workflowId: string; requestId: string; personLabel: string }) {
  const [state, action, pending] = useActionState(inviteToHousehold, initialInviteState);
  const result = state.status === 'created' ? state.results?.find((entry) => entry.workflowId === workflowId) : undefined;

  if (result && (result.status === 'created' || result.status === 'replayed')) {
    return (
      <div className={styles.notice} role="status">
        <strong>{result.status === 'replayed' ? 'Invitation already pending.' : `Invited to see ${personLabel}.`}</strong>
        <p>{result.status === 'replayed' ? 'Passage found an existing live invitation for this person.' : 'Share this secure link with them directly. Passage did not send an email.'}</p>
        {result.invitePath && <p>Secure link: <code>{result.invitePath}</code></p>}
      </div>
    );
  }

  return (
    <form className={styles.inviteForm} action={action} aria-busy={pending}>
      <input name="workflowIds" type="hidden" value={workflowId} />
      <input name={`requestId_${workflowId}`} type="hidden" value={requestId} />
      <input name={`personLabel_${workflowId}`} type="hidden" value={personLabel} />
      <label htmlFor={`invite-email-${workflowId}`}>Invite someone to view {personLabel}&apos;s estate</label>
      <input id={`invite-email-${workflowId}`} name="invitedEmail" placeholder="their-email@example.com" required type="email" />
      <label htmlFor={`invite-name-${workflowId}`}>Their name</label>
      <input id={`invite-name-${workflowId}`} maxLength={120} name="displayName" placeholder="Full name" required type="text" />
      <label htmlFor={`invite-relationship-${workflowId}`}>Their relationship <span>Optional</span></label>
      <input defaultValue="Family member" id={`invite-relationship-${workflowId}`} maxLength={80} name="relationship" type="text" />
      <label htmlFor={`invite-role-${workflowId}`}>Their role</label>
      <select defaultValue="family_member" id={`invite-role-${workflowId}`} name="participantRole">
        <option value="family_member">Family member (view-only)</option>
        <option value="executor">Executor / estate administrator (can create tasks, invite others)</option>
        <option value="poa_medical_proxy">POA / medical proxy (can create tasks, invite others)</option>
        <option value="clergy_officiant">Clergy / officiant (view-only)</option>
        <option value="cemetery_crematory_contact">Cemetery / crematory contact (view-only)</option>
      </select>
      <button className={styles.primary} disabled={pending} type="submit">{pending ? 'Inviting…' : 'Invite to view'}</button>
      {(state.status === 'validation' || state.status === 'denied' || state.status === 'unavailable') && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
      {result && (result.status === 'conflict' || result.status === 'denied' || result.status === 'unavailable') && (
        <p className={styles.alert} role="alert">
          {result.status === 'conflict' && 'That person already has active access or a pending invitation.'}
          {result.status === 'denied' && 'You do not have authority to invite someone to this estate.'}
          {result.status === 'unavailable' && 'Passage could not create this invitation right now.'}
        </p>
      )}
      <p>They&apos;ll see status, tasks, and updates for this estate. They won&apos;t need to create a duplicate account or re-enter anything already on file — one click on their invite link and they&apos;re in. Executor and POA/medical proxy can also add tasks and invite others.</p>
    </form>
  );
}

export type HouseholdEstate = { workflowId: string; personLabel: string; requestId: string };

// Founder decision 2026-08-19: one invite flow for the whole household --
// the owner explicitly picks which estate(s) the person being invited can
// see, rather than one form per estate or automatic cross-estate sharing.
// Each selected estate still gets its own independent invitation/access row
// under the hood (see inviteToHousehold), so a later per-estate revoke still
// works exactly like it always has.
export function InviteAcrossHouseholdForm({ estates }: { estates: HouseholdEstate[] }) {
  const [state, action, pending] = useActionState(inviteToHousehold, initialInviteState);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => Object.fromEntries(estates.map((estate) => [estate.workflowId, estates.length === 1])));

  return (
    <form className={styles.inviteForm} action={action} aria-busy={pending}>
      <fieldset>
        <legend>Which estate(s) should they see?</legend>
        {estates.map((estate) => (
          <label key={estate.workflowId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}>
            <input
              checked={checked[estate.workflowId] ?? false}
              name="workflowIds"
              onChange={(event) => setChecked((previous) => ({ ...previous, [estate.workflowId]: event.target.checked }))}
              type="checkbox"
              value={estate.workflowId}
            />
            {estate.personLabel}
            <input name={`requestId_${estate.workflowId}`} type="hidden" value={estate.requestId} />
            <input name={`personLabel_${estate.workflowId}`} type="hidden" value={estate.personLabel} />
          </label>
        ))}
      </fieldset>
      <label htmlFor="household-invite-email">Their email</label>
      <input id="household-invite-email" name="invitedEmail" placeholder="their-email@example.com" required type="email" />
      <label htmlFor="household-invite-name">Their name</label>
      <input id="household-invite-name" maxLength={120} name="displayName" placeholder="Full name" required type="text" />
      <label htmlFor="household-invite-relationship">Their relationship <span>Optional</span></label>
      <input defaultValue="Family member" id="household-invite-relationship" maxLength={80} name="relationship" type="text" />
      <label htmlFor="household-invite-role">Their role</label>
      <select defaultValue="family_member" id="household-invite-role" name="participantRole">
        <option value="family_member">Family member (view-only)</option>
        <option value="executor">Executor / estate administrator (can create tasks, invite others)</option>
        <option value="poa_medical_proxy">POA / medical proxy (can create tasks, invite others)</option>
        <option value="clergy_officiant">Clergy / officiant (view-only)</option>
        <option value="cemetery_crematory_contact">Cemetery / crematory contact (view-only)</option>
      </select>
      <button className={styles.primary} disabled={pending} type="submit">{pending ? 'Inviting…' : 'Invite to selected estate(s)'}</button>
      {(state.status === 'validation' || state.status === 'denied' || state.status === 'unavailable') && state.message && <p className={styles.alert} role="alert">{state.message}</p>}
      {state.status === 'created' && state.results && (
        <div className={styles.notice} role="status">
          {state.results.map((result) => (
            <p key={result.workflowId}>
              <strong>{result.personLabel}: </strong>
              {result.status === 'created' && result.invitePath ? <>Invited. Secure link: <code>{result.invitePath}</code></> : null}
              {result.status === 'replayed' && 'Invitation already pending.'}
              {result.status === 'conflict' && 'That person already has active access or a pending invitation.'}
              {result.status === 'denied' && 'You do not have authority to invite someone to this estate.'}
              {result.status === 'unavailable' && 'Passage could not create this invitation right now.'}
            </p>
          ))}
        </div>
      )}
      <p>They&apos;ll see status, tasks, and updates for the estate(s) you selected. They won&apos;t need to create a duplicate account or re-enter anything already on file — one click on their invite link and they&apos;re in. Executor and POA/medical proxy can also add tasks and invite others.</p>
    </form>
  );
}
