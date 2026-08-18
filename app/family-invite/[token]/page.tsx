import Link from 'next/link';
import { acceptFamilyInvitation } from './actions';
import { firstRpcRow, validInvitationToken } from '@/lib/auth/invitations';
import { loginPath } from '@/lib/auth/redirects';
import { verifiedUser } from '@/lib/auth/session';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
import { createPassageServerClient } from '@/lib/supabase/server';
import { AcceptInvitationButton } from '../../invite/[token]/AcceptInvitationButton';
import styles from '../../login/Auth.module.css';

type FamilyInvitationInspection = {
  inviter_display_name: string;
  family_name: string | null;
  person_name: string | null;
  relationship: string;
  participant_role: string;
  invitation_purpose: string;
  invitation_expires_at: string;
  invitation_state: 'available' | 'accepted' | 'revoked' | 'expired';
};

const PARTICIPANT_ROLE_LABELS: Record<string, string> = {
  family_member: 'Family member',
  executor: 'Executor / estate administrator',
  poa_medical_proxy: 'POA / medical proxy',
  clergy_officiant: 'Clergy / officiant',
  cemetery_crematory_contact: 'Cemetery / crematory contact',
};

const ELEVATED_ROLES = new Set(['executor', 'poa_medical_proxy']);

const failureMessages: Record<string, string> = {
  invalid: 'This invitation link is incomplete or invalid.',
  environment: 'Invitation acceptance is unavailable in this environment. Nothing was joined or changed.',
  'email-mismatch': 'Sign in with the verified email address that received this invitation.',
  'claimed-other': 'This invitation needs help from whoever sent it.',
  unavailable: 'This invitation is no longer available. Ask whoever sent it for a new one.',
  retry: 'Passage could not verify the invitation right now. Nothing is shown as accepted. Please retry.',
};

export default async function FamilyInvitationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error: acceptError } = await searchParams;
  const configuration = getRuntimeConfiguration();
  const invitePath = `/family-invite/${encodeURIComponent(token)}`;
  const client = validInvitationToken(token) ? await createPassageServerClient() : null;
  const inspectionResult = client ? await client.rpc('inspect_case_family_invitation', { p_raw_token: token }) : null;
  const invitation = inspectionResult && !inspectionResult.error ? firstRpcRow<FamilyInvitationInspection>(inspectionResult.data) : null;
  const user = client ? await verifiedUser(client) : null;

  const stateError = !validInvitationToken(token)
    ? failureMessages.invalid
    : !configuration.available || !client
      ? configuration.reason
      : inspectionResult?.error
        ? failureMessages.retry
        : !invitation
          ? failureMessages.invalid
          : null;

  // acceptError comes from a prior failed acceptFamilyInvitation attempt
  // (actions.ts redirects here with ?error=...) -- it doesn't replace
  // stateError, which reflects the invitation's own current validity: the
  // invitation can still be perfectly acceptable even though the last
  // attempt to accept it failed (e.g. a transient RPC error), so the retry
  // form below must stay visible alongside this notice, not be hidden by it.
  const acceptErrorMessage = acceptError ? (failureMessages[acceptError] ?? failureMessages.retry) : null;

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}><Link href="/">PASSAGE</Link>{publicRuntimeLabel(configuration.runtime) && <span>{publicRuntimeLabel(configuration.runtime)}</span>}</header>
      <section className={styles.panel} aria-labelledby="invite-title">
        <p className={styles.eyebrow}>FAMILY CASE INVITATION</p>
        <h1 id="invite-title">Review what you’re joining.</h1>
        <p className={styles.lede}>{invitation && ELEVATED_ROLES.has(invitation.participant_role) ? "This grants visibility into one case's status, tasks, and updates, plus authority to create tasks and invite other participants on this case. It never grants staff access." : "This grants read-only visibility into one case's status, tasks, and updates. It never grants staff access."}</p>

        {stateError && <div className={styles.unavailable} role="alert"><strong>We could not complete this invitation.</strong><p>{stateError}</p><Link className={styles.textLink} href={invitePath}>Retry invitation check</Link></div>}

        {!stateError && acceptErrorMessage && invitation?.invitation_state === 'available' && <div className={styles.unavailable} role="alert"><strong>That didn’t go through.</strong><p>{acceptErrorMessage}</p></div>}

        {invitation && !stateError && (
          <>
            <dl className={styles.inviteDetails}>
              <div><dt>Invited by</dt><dd>{invitation.inviter_display_name}</dd></div>
              <div><dt>Case</dt><dd>{invitation.person_name ?? invitation.family_name ?? 'A family case'}</dd></div>
              <div><dt>Your relationship</dt><dd>{invitation.relationship}</dd></div>
              <div><dt>Your role</dt><dd>{PARTICIPANT_ROLE_LABELS[invitation.participant_role] ?? invitation.participant_role}</dd></div>
              <div><dt>Purpose</dt><dd>{invitation.invitation_purpose}</dd></div>
              <div><dt>Expires</dt><dd><time dateTime={invitation.invitation_expires_at}>{new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(invitation.invitation_expires_at))}</time></dd></div>
            </dl>

            {invitation.invitation_state === 'available' && !user && <div className={styles.nextStep}><strong>Sign in before joining.</strong><p>Use the same email address that received this invitation. Passage will confirm it before adding case access.</p><Link className={styles.primaryLink} href={loginPath(invitePath)}>Continue to secure sign-in</Link></div>}
            {invitation.invitation_state === 'available' && user && <form action={acceptFamilyInvitation.bind(null, token)} className={styles.nextStep}><strong>Ready to view this case?</strong><p>Passage records the actor and authoritative acceptance time.</p><AcceptInvitationButton /></form>}
            {invitation.invitation_state === 'expired' && <p className={styles.alert} role="status">This invitation expired. Ask whoever sent it for a new invitation.</p>}
            {invitation.invitation_state === 'revoked' && <p className={styles.alert} role="status">This invitation was revoked. No access was granted.</p>}
            {invitation.invitation_state === 'accepted' && <p className={styles.notice} role="status">This invitation was already claimed. Sign in with the accepting account or ask for a new invitation.</p>}
          </>
        )}
        <footer className={styles.privacy}>Joining grants read-only access to this one case only.</footer>
      </section>
    </main>
  );
}
