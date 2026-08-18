import Link from 'next/link';
import { acceptPartnerInvitation } from './actions';
import { firstRpcRow, validInvitationToken } from '@/lib/auth/invitations';
import { loginPath } from '@/lib/auth/redirects';
import { verifiedUser } from '@/lib/auth/session';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
import { createPassageServerClient } from '@/lib/supabase/server';
import { AcceptInvitationButton } from '../../invite/[token]/AcceptInvitationButton';
import styles from '../../login/Auth.module.css';

type PartnerInvitationInspection = {
  inviter_display_name: string;
  partner_organization_name: string;
  invitation_purpose: string;
  invitation_expires_at: string;
  invitation_state: 'available' | 'accepted' | 'revoked' | 'expired';
};

type PartnerInvitationAcceptance = {
  partner_member_id: string;
  partner_organization_id: string;
  member_role: string;
  accepted_at: string;
  replayed: boolean;
};

const failureMessages: Record<string, string> = {
  invalid: 'This invitation link is incomplete or invalid.',
  environment: 'Invitation acceptance is unavailable in this environment. Nothing was joined or changed.',
  'email-mismatch': 'Sign in with the verified email address that received this invitation.',
  'claimed-other': 'This invitation or membership needs help from the vendor account owner.',
  unavailable: 'This invitation is no longer available. Ask the vendor account owner for a new one.',
  verification: 'Passage accepted the request but could not verify the refreshed membership. Access remains closed; try again or ask the owner for help.',
  retry: 'Passage could not verify the invitation right now. Nothing is shown as accepted. Please retry.',
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value));
}

export default async function PartnerInvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await params;
  const query = await searchParams;
  const configuration = getRuntimeConfiguration();
  const invitePath = `/partner-invite/${encodeURIComponent(token)}`;
  const client = validInvitationToken(token) ? await createPassageServerClient() : null;
  const inspectionResult = client ? await client.rpc('inspect_partner_invitation', { raw_token: token }) : null;
  const invitation = inspectionResult && !inspectionResult.error ? firstRpcRow<PartnerInvitationInspection>(inspectionResult.data) : null;
  const user = client ? await verifiedUser(client) : null;
  const requestedReceipt = query.receipt === 'accepted';
  let receipt: PartnerInvitationAcceptance | null = null;

  if (requestedReceipt && invitation?.invitation_state === 'accepted' && user && client) {
    const result = await client.rpc('accept_partner_invitation', { raw_token: token });
    if (!result.error) receipt = firstRpcRow<PartnerInvitationAcceptance>(result.data);
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
      <header className={styles.brandBar}><Link href="/">PASSAGE</Link>{publicRuntimeLabel(configuration.runtime) && <span>{publicRuntimeLabel(configuration.runtime)}</span>}</header>
      <section className={styles.panel} aria-labelledby="invite-title">
        <p className={styles.eyebrow}>VENDOR INVITATION</p>
        <h1 id="invite-title">Review what you’re joining.</h1>
        <p className={styles.lede}>Your role comes from the invitation. Signing in never widens access beyond this vendor account's requests.</p>

        {(explicitError || stateError) && <div className={styles.unavailable} role="alert"><strong>We could not complete this invitation.</strong><p>{explicitError ?? stateError}</p><Link className={styles.textLink} href={invitePath}>Retry invitation check</Link></div>}

        {receipt && (
          <div className={styles.receipt} role="status">
            <span>MEMBERSHIP VERIFIED</span><h2>You’re ready to enter your workspace.</h2>
            <dl><div><dt>Vendor organization</dt><dd>{invitation?.partner_organization_name}</dd></div><div><dt>Account</dt><dd>{user?.email}</dd></div><div><dt>Role</dt><dd>{receipt.member_role}</dd></div><div><dt>Status</dt><dd>Invitation accepted · membership verified</dd></div><div><dt>Accepted</dt><dd><time dateTime={receipt.accepted_at}>{dateTime(receipt.accepted_at)} · server time</time></dd></div><div><dt>Next action</dt><dd>Enter your vendor workspace</dd></div></dl>
            <Link className={styles.primaryLink} href="/partner">Open vendor workspace</Link>
          </div>
        )}

        {invitation && !receipt && !stateError && (
          <>
            <dl className={styles.inviteDetails}>
              <div><dt>Invited by</dt><dd>{invitation.inviter_display_name}</dd></div>
              <div><dt>Vendor organization</dt><dd>{invitation.partner_organization_name}</dd></div>
              <div><dt>Purpose</dt><dd>{invitation.invitation_purpose}</dd></div>
              <div><dt>Expires</dt><dd><time dateTime={invitation.invitation_expires_at}>{dateTime(invitation.invitation_expires_at)}</time></dd></div>
            </dl>

            {invitation.invitation_state === 'available' && !user && <div className={styles.nextStep}><strong>Sign in before joining.</strong><p>Use the same email address that received this invitation. Passage will confirm it before adding vendor access.</p><Link className={styles.primaryLink} href={loginPath(invitePath)}>Continue to secure sign-in</Link></div>}
            {invitation.invitation_state === 'available' && user && <form action={acceptPartnerInvitation.bind(null, token)} className={styles.nextStep}><strong>Ready to join {invitation.partner_organization_name}?</strong><p>Your role and access scope are read-only. Passage records the actor and authoritative acceptance time.</p><AcceptInvitationButton /></form>}
            {invitation.invitation_state === 'expired' && <p className={styles.alert} role="status">This invitation expired. Ask the vendor account owner for a new invitation.</p>}
            {invitation.invitation_state === 'revoked' && <p className={styles.alert} role="status">This invitation was revoked. No access was granted.</p>}
            {invitation.invitation_state === 'accepted' && <p className={styles.notice} role="status">This invitation was already claimed. Sign in with the accepting account or ask the owner for a new invitation.</p>}
          </>
        )}
        <footer className={styles.privacy}>Joining grants only the vendor organization and role shown here. It never grants funeral-home or family access.</footer>
      </section>
    </main>
  );
}
