import type { Metadata } from 'next';
import Link from 'next/link';
import {
  acceptInvitation,
  useAnotherInvitationAccount,
} from '../[token]/actions';
import {
  firstRpcRow,
  type InvitationAcceptance,
  type ParticipantInvitationAcceptance,
  type PassageInvitationInspection,
} from '@/lib/auth/invitations';
import { readInvitationIntent } from '@/lib/auth/invitation-intent';
import { INVITATION_CONTINUE_PATH } from '@/lib/auth/invitation-intent-cookie';
import { loginPath } from '@/lib/auth/redirects';
import { verifiedUser } from '@/lib/auth/session';
import {
  participantCategoryLabels,
  staffRoleLabel,
} from '@/lib/presentation/participant-labels';
import { createPassageServerClient } from '@/lib/supabase/server';
import { AcceptInvitationButton } from '../[token]/AcceptInvitationButton';
import { ParticipantInvitationDecision } from './ParticipantInvitationDecision';
import styles from '../../login/Auth.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Review your invitation | Passage',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

const failureMessages: Record<string, string> = {
  invalid: 'We cannot open this invitation. Check that you copied the complete secure link, or ask the inviter for a new one.',
  environment: 'Passage cannot check this invitation right now. Nothing was joined or changed.',
  'email-mismatch': 'This signed-in account cannot accept this invitation. No access was added.',
  'existing-access': 'This account already has access to this family space. Open Shared with me or ask the family coordinator for help.',
  'claimed-other': 'This invitation has already been accepted by another account. No access was added to this account.',
  'access-ended': 'Your access from this invitation has ended. No shared details are visible.',
  unavailable: 'This invitation is no longer available. Ask the inviter if you still need access.',
  verification: 'Passage saved the request but could not verify the refreshed access. Reload this invitation before trying again.',
  retry: 'Passage cannot check this invitation right now. Nothing was joined or changed. Try again.',
  'signout-failed': 'Passage could not sign out this account. No invitation access changed.',
};

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

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const token = await readInvitationIntent();
  const client = token ? await createPassageServerClient() : null;
  const inspectionResult = client
    ? await client.rpc('inspect_passage_invitation', { p_raw_token: token })
    : null;
  const invitation = inspectionResult && !inspectionResult.error
    ? firstRpcRow<PassageInvitationInspection>(inspectionResult.data)
    : null;
  const user = client ? await verifiedUser(client) : null;
  let staffReceipt: InvitationAcceptance | null = null;
  let participantReceipt: ParticipantInvitationAcceptance | null = null;
  let receiptReplayDenied = false;

  if (invitation?.invitation_state === 'accepted' && user && client && token) {
    if (invitation.invitation_type === 'participant') {
      const result = await client.rpc('accept_participant_invitation', { p_raw_token: token });
      participantReceipt = result.error
        ? null
        : firstRpcRow<ParticipantInvitationAcceptance>(result.data);
      receiptReplayDenied = Boolean(result.error || !participantReceipt?.replayed);
    } else {
      const result = await client.rpc('accept_organization_invitation', { raw_token: token });
      staffReceipt = result.error ? null : firstRpcRow<InvitationAcceptance>(result.data);
      receiptReplayDenied = Boolean(result.error || !staffReceipt?.replayed);
    }
  }

  const explicitErrorCode = typeof query.error === 'string' ? query.error : null;
  const explicitError = explicitErrorCode ? failureMessages[explicitErrorCode] : null;
  const stateErrorCode = !token
    ? 'invalid'
    : !client
      ? 'environment'
      : inspectionResult?.error
        ? 'retry'
        : !invitation
          ? 'invalid'
          : null;
  const stateError = stateErrorCode ? failureMessages[stateErrorCode] : null;
  const recoveryCode = explicitErrorCode ?? stateErrorCode ?? (receiptReplayDenied ? 'claimed-other' : null);
  const actionable = !explicitError && !stateError && !receiptReplayDenied;
  const verifiedReceipt = Boolean(participantReceipt || staffReceipt);
  const showAvailableDetails = Boolean(
    invitation
    && invitation.invitation_state === 'available'
    && actionable,
  );
  const showTerminalState = Boolean(
    invitation
    && invitation.invitation_state !== 'available'
    && !verifiedReceipt
    && !receiptReplayDenied
    && !explicitError
    && !stateError,
  );
  const canIdentifyInvitation = showAvailableDetails || verifiedReceipt;
  const isParticipant = invitation?.invitation_type === 'participant';
  const scopeLabels = invitation
    ? isParticipant
      ? participantCategoryLabels(invitation.scope_labels)
      : invitation.scope_labels
    : [];
  const showAccountRecovery = Boolean(user && (
    explicitErrorCode === 'email-mismatch'
    || explicitErrorCode === 'claimed-other'
    || explicitErrorCode === 'signout-failed'
    || receiptReplayDenied
  ));

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}>
        <Link href="/" aria-label="Passage home">PASSAGE</Link>
      </header>
      <section className={styles.panel} aria-labelledby="invite-title">
        <p className={styles.eyebrow}>
          {canIdentifyInvitation
            ? isParticipant ? 'FAMILY INVITATION' : 'FUNERAL-HOME INVITATION'
            : 'SECURE INVITATION'}
        </p>
        <h1 id="invite-title">
          {showAvailableDetails && isParticipant && invitation
            ? `You are invited to help with ${invitation.space_name}.`
            : canIdentifyInvitation
              ? 'Review what you’re joining.'
              : 'Check this invitation safely.'}
        </h1>
        <p className={styles.lede}>
          {showAvailableDetails && isParticipant
            ? 'Reviewing this invitation changes nothing. Accepting lets this account see only the items listed below. It does not let you make decisions for the family.'
            : canIdentifyInvitation
              ? 'Your access comes only from the verified invitation receipt. Signing in does not widen it.'
              : 'Passage shows invitation details only while the invitation is available or after this account verifies the saved receipt.'}
        </p>

        {(explicitError || stateError || receiptReplayDenied) && (
          <div className={styles.unavailable} role="alert">
            <strong>We could not complete this invitation.</strong>
            <p>
              {receiptReplayDenied
                ? 'This signed-in account cannot open the saved receipt. No access was added.'
                : explicitError ?? stateError}
            </p>
            <FailureRecovery code={recoveryCode} showAccountRecovery={showAccountRecovery} />
          </div>
        )}

        {participantReceipt && invitation && user && (
          <div className={styles.receipt} role="status">
            <span>INVITATION ACCEPTED</span>
            <h2>Invitation accepted.</h2>
            {participantReceipt.replayed && <p>This invitation was already accepted by this account.</p>}
            <dl>
              <div><dt>Family space</dt><dd>{participantReceipt.space_name}</dd></div>
              <div><dt>Relationship</dt><dd>{participantReceipt.relationship}</dd></div>
              <div><dt>Can see</dt><dd>{participantCategoryLabels(participantReceipt.category_scope).join(', ')}</dd></div>
              <div><dt>Signed-in account</dt><dd>{user.email}</dd></div>
              <div><dt>Accepted</dt><dd><time dateTime={participantReceipt.accepted_at}>{dateTime(participantReceipt.accepted_at)}</time></dd></div>
              <div><dt>Visible to</dt><dd>You and the family coordinator</dd></div>
              <div><dt>Proof saved to</dt><dd>Family access history</dd></div>
              <div><dt>Next</dt><dd>Open the family information shared with you</dd></div>
            </dl>
            <Link className={styles.primaryLink} href="/participant">Open shared family updates</Link>
          </div>
        )}

        {staffReceipt && invitation && user && (
          <div className={styles.receipt} role="status">
            <span>MEMBERSHIP VERIFIED</span>
            <h2>You’re ready to enter your workspace.</h2>
            <dl>
              <div><dt>Organization</dt><dd>{invitation.space_name}</dd></div>
              <div><dt>Locations</dt><dd>{invitation.scope_labels.join(' · ')}</dd></div>
              <div><dt>Account</dt><dd>{user.email}</dd></div>
              <div><dt>Role</dt><dd>{staffRoleLabel(staffReceipt.member_role)}</dd></div>
              <div><dt>Accepted</dt><dd><time dateTime={staffReceipt.accepted_at}>{dateTime(staffReceipt.accepted_at)}</time></dd></div>
              <div><dt>Proof saved to</dt><dd>Organization membership and invitation history</dd></div>
            </dl>
            <Link className={styles.primaryLink} href={staffReceipt.member_role === 'staff' ? '/staff' : '/director'}>
              {staffReceipt.member_role === 'staff' ? 'Open My work' : 'Open director workspace'}
            </Link>
          </div>
        )}

        {invitation && !participantReceipt && !staffReceipt && showAvailableDetails && (
          <>
            <dl className={styles.inviteDetails}>
              <div><dt>Invited by</dt><dd>{invitation.inviter_display_name}</dd></div>
              <div><dt>{isParticipant ? 'Family space' : 'Organization'}</dt><dd>{invitation.space_name}</dd></div>
              <div><dt>{isParticipant ? 'Relationship' : 'Role'}</dt><dd>{isParticipant ? invitation.invitation_role : staffRoleLabel(invitation.invitation_role)}</dd></div>
              <div><dt>{isParticipant ? 'Can see' : 'Locations'}</dt><dd>{scopeLabels.length ? scopeLabels.join(' · ') : 'No active access'}</dd></div>
              <div><dt>Purpose</dt><dd>{invitation.invitation_purpose}</dd></div>
              <div><dt>Expires</dt><dd><time dateTime={invitation.invitation_expires_at}>{dateTime(invitation.invitation_expires_at)}</time></dd></div>
              <div><dt>Delivery</dt><dd>Not sent by Passage</dd></div>
            </dl>

            {!user && (
              <div className={styles.nextStep}>
                <strong>Sign in before deciding.</strong>
                <p>Sign in with the email named for this invitation.</p>
                <Link className={styles.primaryLink} href={loginPath(INVITATION_CONTINUE_PATH)}>Continue to secure sign-in</Link>
              </div>
            )}
            {user && isParticipant && (
              <ParticipantInvitationDecision />
            )}
            {user && !isParticipant && (
              <form action={acceptInvitation} className={styles.nextStep}>
                <strong>Ready to join {invitation.space_name}?</strong>
                <p>Your role and locations cannot be widened here. Passage records who accepted and when.</p>
                <AcceptInvitationButton />
              </form>
            )}
          </>
        )}
        {showTerminalState && invitation && (
          <TerminalInvitationState
            participantInvitation={isParticipant}
            state={invitation.invitation_state}
            userSignedIn={Boolean(user)}
          />
        )}
        <footer className={styles.privacy}>
          {canIdentifyInvitation && isParticipant
            ? 'Accepting grants only the family information shown above. It never grants funeral-home access or authority to decide for the family.'
            : canIdentifyInvitation
              ? 'Joining grants only the organization, locations, and role shown here. It never grants family access.'
              : 'No invitation details or access are shown unless the current state and signed-in account permit them.'}
        </footer>
      </section>
    </main>
  );
}

function FailureRecovery({
  code,
  showAccountRecovery,
}: {
  code: string | null;
  showAccountRecovery: boolean;
}) {
  if (showAccountRecovery) {
    return (
      <>
        <p>
          {code === 'signout-failed'
            ? 'Try signing out this account again. If it still fails, return to Passage and reopen the secure invitation later.'
            : 'Sign in with the email named for this invitation.'}
        </p>
        <form action={useAnotherInvitationAccount}>
          <button className={styles.secondary} type="submit">
            {code === 'signout-failed' ? 'Try signing out again' : 'Use another account'}
          </button>
        </form>
        {code === 'signout-failed' && <Link className={styles.textLink} href="/">Return to Passage</Link>}
      </>
    );
  }
  if (code === 'existing-access') {
    return <Link className={styles.textLink} href="/participant">Open Shared with me</Link>;
  }
  if (code === 'access-ended') {
    return <Link className={styles.textLink} href="/participant">Check current shared access</Link>;
  }
  if (code === 'invalid' || code === 'unavailable') {
    return <Link className={styles.textLink} href="/">Return to Passage</Link>;
  }
  return <Link className={styles.textLink} href={INVITATION_CONTINUE_PATH}>Try again</Link>;
}

function TerminalInvitationState({
  participantInvitation,
  state,
  userSignedIn,
}: {
  participantInvitation: boolean;
  state: PassageInvitationInspection['invitation_state'];
  userSignedIn: boolean;
}) {
  if (state === 'accepted') {
    return (
      <div className={styles.notice} role="status">
        <strong>This invitation has already been accepted.</strong>
        <p>
          {userSignedIn
            ? 'This account could not verify the saved receipt. No invitation details are visible.'
            : 'Sign in with the account that accepted it to verify the saved receipt.'}
        </p>
        {userSignedIn ? (
          <form action={useAnotherInvitationAccount}>
            <button className={styles.secondary} type="submit">Use another account</button>
          </form>
        ) : (
          <Link className={styles.textLink} href={loginPath(INVITATION_CONTINUE_PATH)}>Sign in to verify the receipt</Link>
        )}
      </div>
    );
  }
  if (state === 'expired') {
    return (
      <div className={styles.alert} role="status">
        <strong>This invitation has expired.</strong>
        <p>Ask the inviter to create a replacement link.</p>
        <Link className={styles.textLink} href="/">Return to Passage</Link>
      </div>
    );
  }
  if (state === 'access_ended') {
    return (
      <div className={styles.alert} role="status">
        <strong>Your access from this invitation has ended.</strong>
        <p>No shared details are visible. Ask the inviter if this seems wrong.</p>
        <Link className={styles.textLink} href="/participant">Check current shared access</Link>
      </div>
    );
  }
  return (
    <div className={styles.alert} role="status">
      <strong>This invitation is no longer available.</strong>
      <p>Ask the {participantInvitation ? 'family coordinator' : 'inviter'} if you still need access.</p>
      <Link className={styles.textLink} href="/">Return to Passage</Link>
    </div>
  );
}
