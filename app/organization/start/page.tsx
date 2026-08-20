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

  // .maybeSingle() silently breaks (returns no data, swallowed below) once an
  // account holds 2+ active memberships -- a real state for any account that's
  // joined more than one organization -- which let this gate render the form
  // anyway instead of the message below, only for the create attempt to be
  // correctly rejected a step later by the RPC itself with a less specific
  // error. Using an array select instead so this catches every count, and
  // naming the actual organization(s) so the message isn't a mystery to
  // someone who doesn't remember every account they've ever joined.
  const existingMemberships = client
    ? await client.from('organization_members').select('organizations(name)').eq('user_id', user.id).eq('status', 'active').limit(5)
    : null;
  const existingOrgNames = (existingMemberships?.data ?? [])
    .map((row) => (row as { organizations: { name: string } | { name: string }[] | null }).organizations)
    .map((org) => (Array.isArray(org) ? org[0]?.name : org?.name))
    .filter((name): name is string => Boolean(name));
  if (existingOrgNames.length > 0) {
    return (
      <main className={styles.shell} id="main-content">
        <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>ALREADY SET UP</p>
          <h1>This account already belongs to {existingOrgNames.length === 1 ? 'an organization' : 'organizations'}.</h1>
          <p className={styles.lede}>{user.email} is already an active member of {existingOrgNames.join(' and ')}. Sign in with a different account to create another organization, or head to your workspace.</p>
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
        <p className={styles.lede}>Name your organization and its first location. You&apos;ll become the owner and can invite your team right after, as {user.email}.</p>
        <OrganizationStartForm />
        <footer className={styles.privacy}>This creates a new, separate organization. It never grants access to another funeral home&apos;s cases or family records.</footer>
      </section>
    </main>
  );
}
