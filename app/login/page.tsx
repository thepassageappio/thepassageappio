
import Link from 'next/link';
import { safeInternalPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
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
  const configuration = getRuntimeConfiguration();

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}>
        <Link href="/" aria-label="Passage home">PASSAGE</Link>
        <span>{publicRuntimeLabel(configuration.runtime)}</span>
      </header>
      <section className={styles.panel} aria-labelledby="login-title">
        <p className={styles.eyebrow}>FUNERAL-HOME WORKSPACE</p>
        <h1 id="login-title">Welcome to the work your team shares.</h1>
        <p className={styles.lede}>Sign in to see only the organization, locations, and work your role permits.</p>
        {(error || signedOut) && <p className={error ? styles.alert : styles.notice} role={error ? 'alert' : 'status'}>{error ?? 'You are signed out. No workspace data is visible.'}</p>}
        {!configuration.available || !configuration.supabaseUrl || !configuration.supabasePublishableKey ? (
          <div className={styles.unavailable} role="status">
            <strong>Secure sign-in is not available here.</strong>
            <p>{configuration.reason} Your invitation remains unchanged. Try the approved Passage environment or ask your funeral-home administrator for help.</p>
          </div>
        ) : (
          <LoginClient emailEnabled={configuration.emailAuthEnabled} googleEnabled={configuration.googleAuthEnabled} next={next} publishableKey={configuration.supabasePublishableKey} supabaseUrl={configuration.supabaseUrl} />
        )}
        <footer className={styles.privacy}>Passage verifies your identity before showing organization or case information. An invitation does not grant family access.</footer>
      </section>
    </main>
  );
}

