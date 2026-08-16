import Link from 'next/link';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
import { createPassageServerClient } from '@/lib/supabase/server';
import { OrganizationStartForm } from './OrganizationStartForm';
import styles from '../../login/Auth.module.css';

export const metadata = { title: 'Set up your funeral home' };

export default async function OrganizationStartPage() {
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
          <p className={styles.eyebrow}>FUNERAL-HOME SIGN-UP</p>
          <h1 id="signup-title">Sign in first to set up your organization.</h1>
          <p className={styles.lede}>Passage needs a verified account before creating your organization, so the person who signs in becomes its first owner.</p>
          <Link className={styles.primary} href={loginPath('/organization/start')} style={{ display: 'inline-flex' }}>Sign in or create an account</Link>
        </section>
      </main>
    );
  }

  const existingMembership = client
    ? await client.from('organization_members').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle()
    : null;
  if (existingMembership?.data) {
    return (
      <main className={styles.shell} id="main-content">
        <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>ALREADY SET UP</p>
          <h1>This account already belongs to an organization.</h1>
          <p className={styles.lede}>Sign in with a different account to create another organization, or head to your workspace.</p>
          <Link className={styles.primary} href="/director" style={{ display: 'inline-flex' }}>Open your workspace</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
      <section className={styles.panel} aria-labelledby="signup-title">
        <p className={styles.eyebrow}>FUNERAL-HOME SIGN-UP</p>
        <h1 id="signup-title">Set up your funeral home.</h1>
        <p className={styles.lede}>Name your organization and its first location. You&apos;ll become the owner and can invite your team right after.</p>
        <OrganizationStartForm />
        <footer className={styles.privacy}>This creates a new, separate organization. It never grants access to another funeral home&apos;s cases or family records.</footer>
      </section>
    </main>
  );
}
