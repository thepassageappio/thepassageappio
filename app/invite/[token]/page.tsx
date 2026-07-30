import Link from 'next/link';
import { acceptInvitation } from './actions';
import { firstRpcRow, type InvitationAcceptance, type InvitationInspection, validInvitationToken } from '@/lib/auth/invitations';
import { loginPath } from '@/lib/auth/redirects';
import { verifiedUser } from '@/lib/auth/session';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
import { createPassageServerClient } from '@/lib/supabase/server';
import { AcceptInvitationButton } from './AcceptInvitationButton';
import styles from '../../login/Auth.module.css';

const failureMessages: Record<string, string> = {
  invalid: 'This invitation link is incomplete or invalid.',
  environment: 'Invitation acceptance is unavailable in this environment. Nothing was joined or changed.',
  'email-mismatch': 'Sign in with the verified email address that received this invitation.',
  'claimed-other': 'This invitation or membership needs help from the funeral-home administrator.',
  'access-ended': 'This invitation was accepted earlier, but that team access has ended. No funeral-home work is visible.',
  unavailable: 'This invitation is no longer available. Ask the funeral-home administrator for a new one.',
  verification: 'Passage accepted the request but could not verify the refreshed membership. Access remains closed; try again or ask the administrator for help.',
  retry: 'Passage could not verify the invitation right now. Nothing is shown as accepted. Please retry.',
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value));
}

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await params;
  const query = await searchParams;
  const configuration = getRuntimeConfiguration();
  const invitePath = `/invite/${encodeURIComponent(token)}`;
  const client = validInvitationToken(token) ? await createPassageServerClient() : null;
  const inspectionResult = client ? await client.rpc('inspect_organization_invitation', { raw_token: token }) : null;
  const invitation = inspectionResult && !inspectionResult.error ? firstRpcRow<InvitationInspection>(inspectionResult.data) : null;
  const user = client ? await verifiedUser(client) : null;
  const requestedReceipt = query.receipt === 'accepted';
  let receipt: InvitationAcceptance | null = null;

  // A receipt GET may only replay an already accepted invitation. It can never
  // perform the first acceptance; that remains a deliberate POST Server Action.
  if (requestedReceipt && invitation?.invitation_state === 'accepted' && user && client) {
    const result = await client.rpc('accept_organization_invitation', { raw_token: token });
    if (!result.error) receipt = firstRpcRow<InvitationAcceptance>(result.data);
  }

  const explicitError = typeof query.error === 'string' ? failureMessages[query.error] : null;
  const stateError = !validInvitationToken(token)
    ? failureMessages.invalid
    : !configuration.available || !client
      ? configuration.reason
      : inspectionResult?.error
        ? failureMessages.retry
        : !invitation
          ? failureMessages.invalid
          : null;

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}><Link href="/">PASSAGE</Link><span>{publicRuntimeLabel(configuration.runtime)}</span></header>
      <section className={styles.panel} aria-labelledby="invite-title">
        <p className={styles.eyebrow}>FUNERAL-HOME INVITATION</p>
        <h1 id="invite-title">Review what you’re joining.</h1>
        <p className={styles.lede}>Your role and locations come from the invitation. Signing in never widens family access.</p>

        {(explicitError || stateError) && <div className={styles.unavailable} role="alert"><strong>We could not complete this invitation.</strong><p>{explicitError ?? stateError}</p><Link className={styles.textLink} href={invitePath}>Retry invitation check</Link></div>}

        {receipt && (
          <div className={styles.receipt} role="status">
            <span>MEMBERSHIP VERIFIED</span><h2>You’re ready to enter your workspace.</h2>
            <dl><div><dt>Organization</dt><dd>{invitation?.organization_name}</dd></div><div><dt>Locations</dt><dd>{invitation?.location_names.join(' · ')}</dd></div><div><dt>Account</dt><dd>{user?.email}</dd></div><div><dt>Role</dt><dd>{receipt.member_role}</dd></div><div><dt>Status</dt><dd>Invitation accepted · membership verified</dd></div><div><dt>Accepted</dt><dd><time dateTime={receipt.accepted_at}>{dateTime(receipt.accepted_at)} · server time</time></dd></div><div><dt>Visible to</dt><dd>The accepting employee and authorized funeral-home directors</dd></div><div><dt>Proof saved to</dt><dd>Organization membership and invitation history</dd></div><div><dt>Next action</dt><dd>Enter your role-scoped workspace</dd></div></dl>
            <Link className={styles.primaryLink} href={receipt.member_role === 'staff' ? '/staff' : '/director'}>{receipt.member_role === 'staff' ? 'Open staff workspace' : 'Open director workspace'}</Link>
          </div>
        )}

        {invitation && !receipt && !stateError && (
          <>
            <dl className={styles.inviteDetails}>
              <div><dt>Invited by</dt><dd>{invitation.inviter_display_name}</dd></div>
              <div><dt>Organization</dt><dd>{invitation.organization_name}</dd></div>
              <div><dt>Role</dt><dd>{invitation.invitation_role}</dd></div>
              <div><dt>Locations</dt><dd>{invitation.location_names.length ? invitation.location_names.join(' · ') : 'No active location scope'}</dd></div>
              <div><dt>Purpose</dt><dd>{invitation.invitation_purpose}</dd></div>
              <div><dt>Expires</dt><dd><time dateTime={invitation.invitation_expires_at}>{dateTime(invitation.invitation_expires_at)}</time></dd></div>
            </dl>

            {invitation.invitation_state === 'available' && !user && <div className={styles.nextStep}><strong>Sign in before joining.</strong><p>Use the same email address that received this invitation. Passage will confirm it before adding team access.</p><Link className={styles.primaryLink} href={loginPath(invitePath)}>Continue to secure sign-in</Link></div>}
            {invitation.invitation_state === 'available' && user && <form action={acceptInvitation.bind(null, token)} className={styles.nextStep}><strong>Ready to join {invitation.organization_name}?</strong><p>Your role and location scope are read-only. Passage records the actor and authoritative acceptance time.</p><AcceptInvitationButton /></form>}
            {invitation.invitation_state === 'expired' && <p className={styles.alert} role="status">This invitation expired. Ask the funeral-home administrator for a new invitation.</p>}
            {invitation.invitation_state === 'revoked' && <p className={styles.alert} role="status">This invitation was revoked. No access was granted.</p>}
            {invitation.invitation_state === 'accepted' && <p className={styles.notice} role="status">This invitation was already claimed. Sign in with the accepting account or ask the administrator for a new invitation.</p>}
            {invitation.invitation_state === 'access_ended' && <p className={styles.alert} role="status">This invitation was accepted earlier, but that team access has ended. No funeral-home work is visible.</p>}
          </>
        )}
        <footer className={styles.privacy}>Joining grants only the organization, location, and role shown here. It never grants family access.</footer>
      </section>
    </main>
  );
}
