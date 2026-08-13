'use client';

import {
  type KeyboardEvent,
  type ReactNode,
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useFormStatus } from 'react-dom';
import type {
  ContinuityParticipant,
  ParticipantInvitation,
} from '@/lib/continuity/participants';
import { participantCategoryLabels } from '@/lib/presentation/participant-labels';
import {
  cancelParticipantInvitation,
  type CoordinatorLifecycleState,
  endParticipantAccess,
  rotateParticipantInvitation,
} from './actions';
import styles from './People.module.css';

type InvitationControl = ParticipantInvitation & {
  rotationRequestId: string;
  rotationRequestedAt: string;
};

type ParticipantControl = ContinuityParticipant & {
  revocationRequestId: string;
};

const initialState: CoordinatorLifecycleState = { status: 'idle' };

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

function invitationHistoryLabel(invitation: ParticipantInvitation) {
  if (invitation.lifecycle_state === 'accepted') return 'Invitation accepted';
  if (invitation.lifecycle_state === 'declined') return 'Invitation declined';
  if (invitation.lifecycle_state === 'expired') return 'Invitation expired';
  if (invitation.outcome_note === 'Replaced with a new secure link') return 'Invitation replaced';
  return 'Invitation canceled';
}

export function ParticipantLifecycleControls({
  invitations,
  participants,
}: {
  invitations: InvitationControl[];
  participants: ParticipantControl[];
}) {
  const [rotateState, rotateAction, rotatePending] = useActionState(
    rotateParticipantInvitation,
    initialState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelParticipantInvitation,
    initialState,
  );
  const [accessState, accessAction, accessPending] = useActionState(
    endParticipantAccess,
    initialState,
  );
  const [openConfirmation, setOpenConfirmation] = useState<string | null>(null);
  const [latestState, setLatestState] = useState<CoordinatorLifecycleState>(initialState);
  const [secureLink, setSecureLink] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [expiryDays, setExpiryDays] = useState<Record<string, number>>({});
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const errorSummary = useRef<HTMLDivElement>(null);
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const replacementHeading = useRef<HTMLHeadingElement>(null);
  const secureLinkInput = useRef<HTMLInputElement>(null);
  const busy = rotatePending || cancelPending || accessPending;

  useEffect(() => {
    if (rotateState.status === 'idle') return;
    setLatestState(rotateState);
    setOpenConfirmation(null);
    if (rotateState.status === 'rotated') {
      setSecureLink(
        rotateState.rawToken
          ? `${window.location.origin}/invite/${encodeURIComponent(rotateState.rawToken)}`
          : '',
      );
      window.requestAnimationFrame(() => replacementHeading.current?.focus());
    }
  }, [rotateState]);

  useEffect(() => {
    if (cancelState.status === 'idle') return;
    setLatestState(cancelState);
    setOpenConfirmation(null);
    window.requestAnimationFrame(() => {
      if (cancelState.status === 'error') errorSummary.current?.focus();
      else receiptHeading.current?.focus();
    });
  }, [cancelState]);

  useEffect(() => {
    if (accessState.status === 'idle') return;
    setLatestState(accessState);
    setOpenConfirmation(null);
    window.requestAnimationFrame(() => {
      if (accessState.status === 'error') errorSummary.current?.focus();
      else receiptHeading.current?.focus();
    });
  }, [accessState]);

  useEffect(() => {
    if (latestState.status === 'error') {
      window.requestAnimationFrame(() => errorSummary.current?.focus());
    }
  }, [latestState]);

  useEffect(() => {
    function removeLinkAfterRestoration(event: PageTransitionEvent) {
      if (event.persisted) setSecureLink('');
    }
    function removeLinkAfterReconnect() {
      setSecureLink('');
    }
    window.addEventListener('pageshow', removeLinkAfterRestoration);
    window.addEventListener('online', removeLinkAfterReconnect);
    return () => {
      window.removeEventListener('pageshow', removeLinkAfterRestoration);
      window.removeEventListener('online', removeLinkAfterReconnect);
    };
  }, []);

  async function copyLink() {
    if (!secureLink) return;
    try {
      await navigator.clipboard.writeText(secureLink);
      setCopyStatus('Secure link copied.');
    } catch {
      setCopyStatus('Copy did not work. The link is selected so you can copy it manually.');
      secureLinkInput.current?.focus();
      secureLinkInput.current?.select();
    }
  }

  function open(key: string) {
    setOpenConfirmation(key);
    setLatestState(initialState);
  }

  function close(key: string) {
    setOpenConfirmation(null);
    window.requestAnimationFrame(() => triggerRefs.current[key]?.focus());
  }

  function closeOnEscape(event: KeyboardEvent<HTMLDivElement>, key: string) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    close(key);
  }

  const removedInvitationIds = new Set<string>();
  if (rotateState.status === 'rotated') removedInvitationIds.add(rotateState.previousInvitationId);
  if (cancelState.status === 'canceled') removedInvitationIds.add(cancelState.invitationId);
  const endedParticipantIds = new Set<string>();
  if (accessState.status === 'access-ended') endedParticipantIds.add(accessState.participantId);

  const active = participants.filter((participant) =>
    participant.status === 'active' && !endedParticipantIds.has(participant.id));
  const past = participants.filter((participant) =>
    participant.status === 'revoked' || endedParticipantIds.has(participant.id));
  const waiting = invitations.filter((invitation) =>
    invitation.lifecycle_state === 'available' && !removedInvitationIds.has(invitation.id));
  const history = invitations.filter((invitation) => invitation.lifecycle_state !== 'available');

  return (
    <>
      <div aria-live="polite" className={styles.srOnly} role="status">
        {busy ? 'Saving this access change. Nothing is shown as complete until Passage verifies the saved receipt.' : ''}
      </div>

      {latestState.status === 'error' && (
        <div className={styles.lifecycleError} ref={errorSummary} role="alert" tabIndex={-1}>
          <strong>
            {latestState.kind === 'known_failure'
              ? 'Nothing changed.'
              : latestState.kind === 'stale'
                ? 'Review the current access.'
                : 'Check the saved result.'}
          </strong>
          <p>{latestState.message}</p>
        </div>
      )}

      {rotateState.status === 'rotated' && (
        <section className={styles.replacementReceipt} aria-labelledby="replacement-link-title">
          <p>NOT SENT BY PASSAGE</p>
          <h2 id="replacement-link-title" ref={replacementHeading} tabIndex={-1}>
            Replacement link created.
          </h2>
          <p>The earlier link no longer works. Passage saved the replacement in family invitation history.</p>
          <dl className={styles.facts}>
            <div><dt>Created</dt><dd><time dateTime={rotateState.createdAt}>{dateTime(rotateState.createdAt)}</time></dd></div>
            <div><dt>Expires</dt><dd><time dateTime={rotateState.expiresAt}>{dateTime(rotateState.expiresAt)}</time></dd></div>
            <div><dt>Visible to</dt><dd>You and the person who uses the new secure link</dd></div>
            <div><dt>Proof saved to</dt><dd>Family invitation history</dd></div>
            <div><dt>Next</dt><dd>Share the new link through a private channel you trust</dd></div>
          </dl>
          {secureLink ? (
            <div className={styles.copyArea}>
              <label htmlFor="replacement-secure-link">One-time replacement link</label>
              <input id="replacement-secure-link" readOnly ref={secureLinkInput} value={secureLink} />
              <button onClick={copyLink} type="button">Copy replacement link</button>
              <p role="status">{copyStatus}</p>
            </div>
          ) : (
            <div className={styles.replayNotice}>
              <strong>The replacement link is not shown again.</strong>
              <p>Create another replacement from the current invitation if the one-time link was lost.</p>
            </div>
          )}
        </section>
      )}

      {(latestState.status === 'canceled' || latestState.status === 'access-ended') && (
        <section className={styles.lifecycleReceipt} role="status">
          <h2 ref={receiptHeading} tabIndex={-1}>
            {latestState.status === 'canceled' ? 'Invitation canceled.' : 'Access ended.'}
          </h2>
          <p>
            {latestState.status === 'canceled'
              ? 'No access was added. Passage saved this outcome in family invitation history.'
              : 'This person can no longer open shared family updates or messages. Earlier access history remains saved.'}
          </p>
          <p><strong>Visible to:</strong> You and the affected person when they next check access.</p>
          <p><strong>Saved:</strong> {dateTime(latestState.changedAt)}</p>
        </section>
      )}

      <PeopleSection count={active.length} eyebrow="PEOPLE WITH ACCESS" title="People who can open shared information now.">
        {active.length ? active.map((person) => {
          const key = `access-${person.id}`;
          const disclosureId = `access-confirm-${person.id}`;
          return (
            <article className={styles.personCard} key={person.id}>
              <header><div><strong>{person.display_name}</strong><span>{person.relationship}</span></div><b>Access active</b></header>
              <dl className={styles.facts}>
                <div><dt>Purpose</dt><dd>{person.purpose}</dd></div>
                <div><dt>Can see</dt><dd>{participantCategoryLabels(person.category_scope).join(', ')}</dd></div>
                <div><dt>Access began</dt><dd><time dateTime={person.accepted_at}>{dateTime(person.accepted_at)}</time></dd></div>
                <div><dt>Who controls access</dt><dd>The family coordinator</dd></div>
              </dl>
              <button
                aria-controls={disclosureId}
                aria-expanded={openConfirmation === key}
                className={styles.dangerTrigger}
                disabled={busy}
                onClick={() => openConfirmation === key ? close(key) : open(key)}
                ref={(node) => { triggerRefs.current[key] = node; }}
                type="button"
              >
                End access
              </button>
              {openConfirmation === key && (
                <div className={styles.confirmation} id={disclosureId} onKeyDown={(event) => closeOnEscape(event, key)}>
                  <h3>End {person.display_name}'s access?</h3>
                  <p>They will lose shared family updates and messages on their next request. Earlier activity and access history will remain saved.</p>
                  <div className={styles.confirmationActions}>
                    <button disabled={busy} onClick={() => close(key)} type="button">Keep access</button>
                    <form action={accessAction}>
                      <input name="participantId" type="hidden" value={person.id} />
                      <input name="requestId" type="hidden" value={person.revocationRequestId} />
                      <CommitButton busy={busy} danger label="End access" pendingLabel="Ending access..." />
                    </form>
                  </div>
                </div>
              )}
            </article>
          );
        }) : <Empty title="No one else has access." body="Create an invitation when you are ready to ask someone for help." />}
      </PeopleSection>

      <PeopleSection count={waiting.length} eyebrow="WAITING FOR A RESPONSE" title="Invitations that can still be accepted.">
        {waiting.length ? waiting.map((invitation) => {
          const rotationKey = `rotate-${invitation.id}`;
          const cancelKey = `cancel-${invitation.id}`;
          const rotationDisclosure = `rotate-confirm-${invitation.id}`;
          const cancelDisclosure = `cancel-confirm-${invitation.id}`;
          const days = expiryDays[invitation.id] ?? 7;
          return (
            <article className={styles.personCard} key={invitation.id}>
              <header><div><strong>{invitation.display_name}</strong><span>{invitation.relationship}</span></div><b>Not sent by Passage</b></header>
              <dl className={styles.facts}>
                <div><dt>Email named for this invitation</dt><dd>{invitation.invited_email}</dd></div>
                <div><dt>Purpose</dt><dd>{invitation.purpose}</dd></div>
                <div><dt>Can see</dt><dd>{participantCategoryLabels(invitation.category_scope).join(', ')}</dd></div>
                <div><dt>Expires</dt><dd><time dateTime={invitation.expires_at}>{dateTime(invitation.expires_at)}</time></dd></div>
                <div><dt>Next</dt><dd>Share the secure link you copied when the invitation was created</dd></div>
              </dl>
              <div className={styles.lifecycleActions}>
                <button
                  aria-controls={rotationDisclosure}
                  aria-expanded={openConfirmation === rotationKey}
                  className={styles.replaceTrigger}
                  disabled={busy}
                  onClick={() => openConfirmation === rotationKey ? close(rotationKey) : open(rotationKey)}
                  ref={(node) => { triggerRefs.current[rotationKey] = node; }}
                  type="button"
                >
                  Replace secure link
                </button>
                <button
                  aria-controls={cancelDisclosure}
                  aria-expanded={openConfirmation === cancelKey}
                  className={styles.dangerTrigger}
                  disabled={busy}
                  onClick={() => openConfirmation === cancelKey ? close(cancelKey) : open(cancelKey)}
                  ref={(node) => { triggerRefs.current[cancelKey] = node; }}
                  type="button"
                >
                  Cancel invitation
                </button>
              </div>
              {openConfirmation === rotationKey && (
                <div className={styles.confirmation} id={rotationDisclosure} onKeyDown={(event) => closeOnEscape(event, rotationKey)}>
                  <h3>Create a replacement link for {invitation.display_name}?</h3>
                  <p>The current link will stop working immediately. The invitation limits stay the same, and Passage saves both outcomes in invitation history.</p>
                  <label>
                    New link length
                    <select
                      disabled={busy}
                      onChange={(event) => setExpiryDays((current) => ({ ...current, [invitation.id]: Number(event.target.value) }))}
                      value={days}
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </label>
                  <div className={styles.confirmationActions}>
                    <button disabled={busy} onClick={() => close(rotationKey)} type="button">Keep current link</button>
                    <form action={rotateAction}>
                      <input name="invitationId" type="hidden" value={invitation.id} />
                      <input name="requestId" type="hidden" value={invitation.rotationRequestId} />
                      <input name="requestedAt" type="hidden" value={invitation.rotationRequestedAt} />
                      <input name="expiryDays" type="hidden" value={days} />
                      <CommitButton busy={busy} label="Create replacement link" pendingLabel="Creating replacement..." />
                    </form>
                  </div>
                </div>
              )}
              {openConfirmation === cancelKey && (
                <div className={styles.confirmation} id={cancelDisclosure} onKeyDown={(event) => closeOnEscape(event, cancelKey)}>
                  <h3>Cancel {invitation.display_name}'s invitation?</h3>
                  <p>The secure link will stop working and no access will be added. Passage keeps the canceled invitation in history.</p>
                  <div className={styles.confirmationActions}>
                    <button disabled={busy} onClick={() => close(cancelKey)} type="button">Keep invitation</button>
                    <form action={cancelAction}>
                      <input name="invitationId" type="hidden" value={invitation.id} />
                      <CommitButton busy={busy} danger label="Cancel invitation" pendingLabel="Canceling invitation..." />
                    </form>
                  </div>
                </div>
              )}
            </article>
          );
        }) : <Empty title="No one is waiting." body="Accepted and ended invitations never appear here." />}
      </PeopleSection>

      <PeopleSection count={history.length} eyebrow="INVITATION HISTORY" title="Earlier invitation outcomes saved here.">
        {history.length ? history.map((invitation) => {
          const canReplace = invitation.lifecycle_state === 'expired';
          const key = `rotate-${invitation.id}`;
          const disclosureId = `rotate-confirm-${invitation.id}`;
          const days = expiryDays[invitation.id] ?? 7;
          return (
            <article className={styles.historyRow} key={invitation.id}>
              <div><strong>{invitation.display_name}</strong><span>{invitation.relationship}</span></div>
              <div className={styles.historyOutcome}>
                <p>{invitationHistoryLabel(invitation)}</p>
                {canReplace && (
                  <>
                    <button
                      aria-controls={disclosureId}
                      aria-expanded={openConfirmation === key}
                      className={styles.replaceTrigger}
                      disabled={busy}
                      onClick={() => openConfirmation === key ? close(key) : open(key)}
                      ref={(node) => { triggerRefs.current[key] = node; }}
                      type="button"
                    >
                      Create replacement link
                    </button>
                    {openConfirmation === key && (
                      <div className={styles.confirmation} id={disclosureId} onKeyDown={(event) => closeOnEscape(event, key)}>
                        <h3>Create a replacement link for {invitation.display_name}?</h3>
                        <p>The expired link will stay closed. The invitation limits stay the same, and Passage will save the replacement in history.</p>
                        <label>
                          New link length
                          <select
                            disabled={busy}
                            onChange={(event) => setExpiryDays((current) => ({ ...current, [invitation.id]: Number(event.target.value) }))}
                            value={days}
                          >
                            <option value={7}>7 days</option>
                            <option value={14}>14 days</option>
                            <option value={30}>30 days</option>
                          </select>
                        </label>
                        <div className={styles.confirmationActions}>
                          <button disabled={busy} onClick={() => close(key)} type="button">Keep current link</button>
                          <form action={rotateAction}>
                            <input name="invitationId" type="hidden" value={invitation.id} />
                            <input name="requestId" type="hidden" value={invitation.rotationRequestId} />
                            <input name="requestedAt" type="hidden" value={invitation.rotationRequestedAt} />
                            <input name="expiryDays" type="hidden" value={days} />
                            <CommitButton busy={busy} label="Create replacement link" pendingLabel="Creating replacement..." />
                          </form>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        }) : <Empty title="No earlier invitation outcomes." body="Accepted, expired, declined, canceled, or replaced invitations will stay here as history." />}
      </PeopleSection>

      <PeopleSection count={past.length} eyebrow="PAST ACCESS" title="People whose access has ended.">
        {past.length ? past.map((person) => (
          <article className={styles.personCard} key={person.id}>
            <header><div><strong>{person.display_name}</strong><span>{person.relationship}</span></div><b>Access ended</b></header>
            <dl className={styles.facts}>
              <div><dt>Former access</dt><dd>{participantCategoryLabels(person.category_scope).join(', ')}</dd></div>
              <div><dt>Access began</dt><dd><time dateTime={person.accepted_at}>{dateTime(person.accepted_at)}</time></dd></div>
              <div><dt>Access ended</dt><dd>{person.revoked_at ? <time dateTime={person.revoked_at}>{dateTime(person.revoked_at)}</time> : 'Saved in access history'}</dd></div>
              <div><dt>Proof saved to</dt><dd>Family access history</dd></div>
            </dl>
          </article>
        )) : <Empty title="No past access." body="People whose access ends will remain here as history." />}
      </PeopleSection>
    </>
  );
}

function PeopleSection({
  count,
  eyebrow,
  title,
  children,
}: {
  count: number;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div><p>{eyebrow}</p><h2>{title}</h2></div>
        <span>{count}</span>
      </div>
      <div className={styles.list}>{children}</div>
    </section>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className={styles.empty} role="status"><strong>{title}</strong><p>{body}</p></div>;
}

function CommitButton({
  busy,
  danger = false,
  label,
  pendingLabel,
}: {
  busy: boolean;
  danger?: boolean;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      aria-busy={pending}
      className={danger ? styles.dangerCommit : styles.replaceCommit}
      disabled={busy || pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
