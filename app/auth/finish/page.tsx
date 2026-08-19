import { safeInternalPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration } from '@/lib/runtime-config';
import { FinishClient } from './FinishClient';
import styles from '../../login/Auth.module.css';

// Landing page for admin-initiated invite links (Supabase's
// auth.admin.inviteUserByEmail, used by the Stripe webhook to provision a
// D2C or B2B account after checkout). Unlike the OAuth/OTP sign-in paths
// (app/auth/callback/route.ts), an admin invite has no client-side PKCE
// verifier to pair with, so GoTrue delivers the session as a URL hash
// fragment (#access_token=...) instead of a ?code= query param. A hash
// fragment is never sent to the server, so a server component's redirect
// (e.g. /case's own auth check) would fire and bounce the user to /login
// before any client JS had a chance to read it -- this route exists purely
// to give the browser Supabase client (detectSessionInUrl: true by default)
// a moment to consume the hash and persist the session to cookies before
// continuing on.
export default async function AuthFinishPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const next = safeInternalPath(typeof query.next === 'string' ? query.next : null, '/');
  const configuration = getRuntimeConfiguration();

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}><span>PASSAGE</span></header>
      <section className={styles.panel} aria-labelledby="finish-title">
        <p className={styles.eyebrow}>SECURE SIGN-IN</p>
        <h1 id="finish-title">Verifying your invitation…</h1>
        <p className={styles.lede}>This only takes a moment. Do not close this page.</p>
        {!configuration.available || !configuration.supabaseUrl || !configuration.supabasePublishableKey ? (
          <div className={styles.unavailable} role="alert">
            <strong>Secure sign-in is not available here.</strong>
            <p>{configuration.reason} Try the approved Passage environment, or request a new invitation link.</p>
          </div>
        ) : (
          <FinishClient next={next} publishableKey={configuration.supabasePublishableKey} supabaseUrl={configuration.supabaseUrl} />
        )}
      </section>
    </main>
  );
}
