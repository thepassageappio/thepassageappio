'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createStaffInvitation, initialInvitationCreationState } from './actions';
import styles from './Invitation.module.css';

type Props = { creationRequestId: string; organizationName: string; locations: { id: string; name: string }[] };

function localDateTime(daysFromNow: number) {
  const value = new Date(Date.now() + daysFromNow * 86400000);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

function formatReceiptTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'long',
  }).format(new Date(value));
}

export function InvitationForm({ creationRequestId, organizationName, locations }: Props) {
  const [state, action, pending] = useActionState(createStaffInvitation, initialInvitationCreationState);
  if ((state.status === 'created' || state.status === 'already-pending') && state.receipt) {
    const receipt = state.receipt;
    const replayed = state.status === 'already-pending';
    return (
      <section className={styles.receipt} aria-live="polite">
        <p className={styles.eyebrow}>{replayed ? 'INVITATION ALREADY PENDING' : 'INVITATION CREATED · NOT SENT'}</p>
        <h2>{replayed ? 'No duplicate invitation was created.' : 'Share this controlled invitation securely.'}</h2>
        <p>{replayed ? 'Passage found the existing live invitation and preserved its original audit event. The sensitive link is not recoverable from its stored digest.' : 'Passage created one pending staff invitation. No email or notification was sent.'}</p>
        <dl>
          <div><dt>Recipient</dt><dd>{receipt.invitedEmail}</dd></div>
          <div><dt>Role</dt><dd>Staff</dd></div>
          <div><dt>Location</dt><dd>{receipt.locationName}</dd></div>
          <div><dt>Purpose</dt><dd>{receipt.purpose}</dd></div>
          <div><dt>Expires</dt><dd><time dateTime={receipt.expiresAt}>{formatReceiptTime(receipt.expiresAt)}</time></dd></div>
          <div><dt>Created by</dt><dd>{receipt.actorName}</dd></div>
          <div><dt>Created at</dt><dd><time dateTime={receipt.createdAt}>{formatReceiptTime(receipt.createdAt)}</time> · persisted invitation time</dd></div>
          <div><dt>Invitation ID</dt><dd>{receipt.invitationId}</dd></div>
          <div><dt>Delivery</dt><dd>Not sent · manual controlled handoff</dd></div>
          <div><dt>Visible to</dt><dd>Authorized directors. Anyone holding the secure link can inspect limited invitation status; only the exact invited account can accept while it is pending.</dd></div>
          <div><dt>Acceptance boundary</dt><dd>Only the exact verified invited account can accept</dd></div>
          <div><dt>Proof saved to</dt><dd>Invitation record and organization activity history</dd></div>
          <div><dt>Token proof</dt><dd>Ends in {receipt.tokenHint}</dd></div>
          <div><dt>Next action</dt><dd>{replayed ? 'Use the secure link saved when this invitation was created. Passage cannot reveal it again.' : 'Give the secure link to the invited staff member through your approved private channel.'}</dd></div>
        </dl>
        {receipt.invitePath && <Link className={styles.primary} href={receipt.invitePath} prefetch={false}>Open secure invitation <span aria-hidden="true">→</span></Link>}
        {receipt.invitePath && <p className={styles.secretNotice}>The secure link contains a sensitive invitation credential. Do not include it in screenshots, logs, or committed evidence.</p>}
      </section>
    );
  }

  return (
    <form action={action} aria-busy={pending} className={styles.form}>
      <input name="creationRequestId" type="hidden" value={creationRequestId} />
      <div className={styles.intro}><p className={styles.eyebrow}>DIRECTOR COMMAND · MANUAL DELIVERY</p><h2>Invite one staff member.</h2><p>The selected location becomes the employee’s operational boundary. Family access is never included.</p></div>
      <label>Verified staff email<input autoComplete="off" name="invitedEmail" placeholder="staff@funeralhome.example" required type="email" /></label>
      <label>Authorized location<select defaultValue={locations[0]?.id} name="locationId" required>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><small>Only active locations returned by your verified membership are available.</small></label>
      <label>Purpose<input defaultValue="Team access for this location" maxLength={240} name="purpose" required /></label>
      <label>Expires<input defaultValue={localDateTime(7)} max={localDateTime(30)} min={localDateTime(1)} name="expiresAt" required type="datetime-local" /><small>Invitations must expire between 15 minutes and 30 days.</small></label>
      <section className={styles.review} aria-label="Invitation review"><strong>Review before creating</strong><p>Organization: {organizationName}</p><p>Role: Staff · Delivery: Not sent</p><p>Proof: invitation record and organization activity history</p><p>Next state: pending acceptance by the exact verified email</p></section>
      {state.message && <p className={styles.error} role="alert">{state.message}</p>}
      <p className={styles.status} role="status" aria-live="polite">{pending ? 'Creating the secure invitation and saving its proof…' : ''}</p>
      <button aria-busy={pending} disabled={pending || locations.length === 0} type="submit">{pending ? 'Creating secure invitation…' : 'Create secure invitation'}</button>
      <p className={styles.boundary}>Passage verifies your authority before creating the invitation. It will not send email, widen family access, or assign case work.</p>
    </form>
  );
}
