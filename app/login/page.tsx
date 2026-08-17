import Link from 'next/link';
import { safeInternalPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
import { LoginClient } from './LoginClient';
import styles from './Auth.module.css';

const messages: Record<string, string> = {
  callback: 'Passage could not verify that sign-in. Nothing was joined or changed. Please try again.',
  unavailable: 'Secure sign-in is unavailable in this environment.',
  'membership-required': 'This account does not have an active membership here.',
  'director-required': 'This workspace is limited to an authorized director.',
};

type LoginAudience = 'funeralHome' | 'vendor' | 'general';

function audienceForPath(next: string): LoginAudience {
  if (next.startsWith('/partner')) return 'vendor';
  if (next.startsWith('/director') || next.startsWith('/staff') || next.startsWith('/organization')) return 'funeralHome';
  return 'general';
}

const heroCopy: Record<LoginAudience, { eyebrow: string; heading: string; lede: string }> = {
  funeralHome: {
    eyebrow: 'FUNERAL-HOME WORKSPACE',
    heading: 'Welcome to the work your team shares.',
    lede: 'Sign in to see only the organization, locations, and work your role permits.',
  },
  vendor: {
    eyebrow: 'VENDOR WORKSPACE',
    heading: 'Welcome back — sign in to your vendor account.',
    lede: 'Sign in to see the requests assigned to you, submit proof, and track payouts.',
  },
  general: {
    eyebrow: 'SIGN IN',
    heading: 'Welcome back.',
    lede: 'Sign in with the email your invitation was sent to, or use your invitation code below.',
  },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const next = safeInternalPath(typeof query.next === 'string' ? query.next : null, '/');
  const error = typeof query.error === 'string' ? messages[query.error] : null;
  const signedOut = query.status === 'signed-out';
  const configuration = getRuntimeConfiguration();
  const audience = audienceForPath(next);
  const copy = heroCopy[audience];

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}>
        <Link href="/" aria-label="Passage home">PASSAGE</Link>
        {publicRuntimeLabel(configuration.runtime) && <span>{publicRuntimeLabel(configuration.runtime)}</span>}
      </header>
      <section className={styles.panel} aria-labelledby="login-title">
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="login-title">{copy.heading}</h1>
        <p className={styles.lede}>{copy.lede}</p>
        {(error || signedOut) && <p className={error ? styles.alert : styles.notice} role={error ? 'alert' : 'status'}>{error ?? 'You are signed out. No workspace data is visible.'}</p>}
        {query.error === 'membership-required' && audience === 'funeralHome' && <p className={styles.notice} role="status">New funeral home? <Link href="/organization/start">Set up your organization</Link>.</p>}
        {query.error === 'membership-required' && audience === 'vendor' && <p className={styles.notice} role="status">New vendor? <Link href="/partner/start">Set up your vendor account</Link>.</p>}
        {!configuration.available || !configuration.supabaseUrl || !configuration.supabasePublishableKey ? (
          <div className={styles.unavailable} role="status">
            <strong>Secure sign-in is not available here.</strong>
            <p>{configuration.reason} Your invitation remains unchanged. Try the approved Passage environment or ask your funeral-home administrator for help.</p>
          </div>
        ) : (
          <LoginClient emailEnabled={configuration.emailAuthEnabled} googleEnabled={configuration.googleAuthEnabled} next={next} passwordEnabled={configuration.passwordAuthEnabled} publishableKey={configuration.supabasePublishableKey} supabaseUrl={configuration.supabaseUrl} />
        )}
        {audience === 'general' && (
          <p className={styles.notice} role="status">New here? <Link href="/organization/start">Set up a funeral home</Link> or <Link href="/partner/start">set up a vendor account</Link>.</p>
        )}
        <footer className={styles.privacy}>Passage verifies your identity before showing organization or case information. An invitation does not grant family access.</footer>
      </section>
    </main>
  );
}
