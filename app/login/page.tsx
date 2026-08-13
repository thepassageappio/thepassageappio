import Link from 'next/link';
import { readInvitationIntent } from '@/lib/auth/invitation-intent';
import { INVITATION_CONTINUE_PATH } from '@/lib/auth/invitation-intent-cookie';
import { safeInternalPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration } from '@/lib/runtime-config';
import { LoginClient } from './LoginClient';
import styles from './Auth.module.css';

const messages: Record<string, string> = {
  callback: 'Passage could not verify that sign-in. Nothing was joined or changed. Please try again.',
  unavailable: 'Secure sign-in is unavailable in this environment.',
  'membership-required': 'This account does not have an active funeral-home membership.',
  'director-required': 'This workspace is limited to an authorized director.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const next = safeInternalPath(typeof query.next === 'string' ? query.next : null, '/');
  const error = typeof query.error === 'string' ? messages[query.error] : null;
  const signedOut = query.status === 'signed-out';
  const accountSwitched = query.status === 'account-switched';
  const configuration = getRuntimeConfiguration();
  const invitationIntent = Boolean(await readInvitationIntent());
  const isInvitation = next === INVITATION_CONTINUE_PATH && invitationIntent;

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}>
        <Link href="/" aria-label="Passage home">PASSAGE</Link>
      </header>
      <section className={styles.panel} aria-labelledby="login-title">
        <p className={styles.eyebrow}>{isInvitation ? 'CONTINUE YOUR INVITATION' : 'FUNERAL-HOME WORKSPACE'}</p>
        <h1 id="login-title">{isInvitation ? 'Continue your invitation.' : 'Welcome to the work your team shares.'}</h1>
        <p className={styles.lede}>{isInvitation ? 'Sign in with the email named for the invitation. Passage checks the account before adding any access.' : 'Sign in to see only the organization, locations, and work your role permits.'}</p>
        {(error || signedOut || accountSwitched) && (
          <p className={error ? styles.alert : styles.notice} role={error ? 'alert' : 'status'}>
            {error ?? (accountSwitched
              ? 'The other account is signed out. Your invitation is still waiting; sign in with the email named for it.'
              : 'You are signed out. No workspace data is visible.')}
          </p>
        )}
        {!configuration.available || !configuration.supabaseUrl || !configuration.supabasePublishableKey ? (
          <div className={styles.unavailable} role="status">
            <strong>Secure sign-in is not available here.</strong>
            <p>Your invitation remains unchanged. Try again later or ask the person who invited you for help.</p>
          </div>
        ) : (
          <LoginClient emailEnabled={configuration.emailAuthEnabled} googleEnabled={configuration.googleAuthEnabled} invitationIntent={isInvitation} next={next} passwordEnabled={configuration.passwordAuthEnabled} publishableKey={configuration.supabasePublishableKey} supabaseUrl={configuration.supabaseUrl} />
        )}
        <footer className={styles.privacy}>{isInvitation ? 'Opening an invitation does not grant access. Passage binds acceptance only to the verified account named for it.' : 'Passage verifies your identity before showing organization or case information. An invitation does not grant family access.'}</footer>
      </section>
    </main>
  );
}
