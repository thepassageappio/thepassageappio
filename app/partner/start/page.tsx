import Link from 'next/link';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
import { createPassageServerClient } from '@/lib/supabase/server';
import { VendorStartForm } from './VendorStartForm';
import styles from '../../login/Auth.module.css';

export const metadata = { title: 'Set up your vendor account' };

export default async function VendorStartPage() {
  const configuration = getRuntimeConfiguration();

  if (!configuration.available || !configuration.supabaseUrl || !configuration.supabasePublishableKey) {
    return (
      <main className={styles.shell} id="main-content">
        <header className={styles.brandBar}><Link href="/">PASSAGE</Link>{publicRuntimeLabel(configuration.runtime) && <span>{publicRuntimeLabel(configuration.runtime)}</span>}</header>
        <section className={styles.panel}>
          <div className={styles.unavailable} role="status">
            <strong>Set up isn&apos;t available here.</strong>
            <p>{configuration.reason}</p>
          </div>
        </section>
      </main>
    );
  }

  const client = await createPassageServerClient();
  const user = client ? await verifiedUser(client) : null;
  if (!user) {
    return (
      <main className={styles.shell} id="main-content">
        <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
        <section className={styles.panel} aria-labelledby="signup-title">
          <p className={styles.eyebrow}>VENDOR SIGN-UP</p>
          <h1 id="signup-title">Sign in first to set up your vendor account.</h1>
          <p className={styles.lede}>Passage needs a verified account before creating your vendor organization, so the person who signs in becomes its first owner.</p>
          <Link className={styles.primary} href={loginPath('/partner/start')} style={{ display: 'inline-flex' }}>Sign in or create an account</Link>
        </section>
      </main>
    );
  }

  const existingMembership = client
    ? await client.from('partner_members').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle()
    : null;
  if (existingMembership?.data) {
    return (
      <main className={styles.shell} id="main-content">
        <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>ALREADY SET UP</p>
          <h1>This account already belongs to a vendor organization.</h1>
          <p className={styles.lede}>Sign in with a different account to create another vendor organization, or head to your workspace.</p>
          <Link className={styles.primary} href="/partner" style={{ display: 'inline-flex' }}>Open your workspace</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
      <section className={styles.panel} aria-labelledby="signup-title">
        <p className={styles.eyebrow}>VENDOR SIGN-UP</p>
        <h1 id="signup-title">Set up your vendor account.</h1>
        <p className={styles.lede}>Name your business and choose its category. You&apos;ll become the owner, then set up payouts so funeral homes can send you requests.</p>
        <VendorStartForm />
        <footer className={styles.privacy}>This creates a new, separate vendor organization. It never grants access to any funeral home&apos;s cases or family records.</footer>
      </section>
    </main>
  );
}
