import Link from 'next/link';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration } from '@/lib/runtime-config';
import { createPassageServerClient } from '@/lib/supabase/server';
import { AdminOrganizationForm } from './AdminOrganizationForm';
import styles from '../../../login/Auth.module.css';

export const metadata = { title: 'Onboard a funeral home' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminNewOrganizationPage() {
  const configuration = getRuntimeConfiguration();
  if (!configuration.available) {
    return (
      <main className={styles.shell} id="main-content">
        <section className={styles.panel}><strong>Not available here.</strong><p>{configuration.reason}</p></section>
      </main>
    );
  }

  const client = await createPassageServerClient();
  const user = client ? await verifiedUser(client) : null;
  if (!user) {
    return (
      <main className={styles.shell} id="main-content">
        <section className={styles.panel}>
          <p className={styles.eyebrow}>PLATFORM ADMIN</p>
          <h1>Sign in with your platform-admin account.</h1>
          <Link className={styles.primary} href={loginPath('/admin/organizations/new')} style={{ display: 'inline-flex' }}>Sign in</Link>
        </section>
      </main>
    );
  }

  const adminCheck = client ? await client.rpc('is_platform_admin') : null;
  const isAdmin = adminCheck?.data === true;

  if (!isAdmin) {
    return (
      <main className={styles.shell} id="main-content">
        <section className={styles.panel}>
          <p className={styles.eyebrow}>PLATFORM ADMIN</p>
          <h1>Your account isn&apos;t a platform admin.</h1>
          <p className={styles.lede}>This tool onboards new funeral homes sales-side. It&apos;s restricted to platform admins.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
      <section className={styles.panel} aria-labelledby="admin-title">
        <p className={styles.eyebrow}>PLATFORM ADMIN · SALES-ASSISTED ONBOARDING</p>
        <h1 id="admin-title">Onboard a funeral home.</h1>
        <p className={styles.lede}>Creates the organization and its first location, then prepares a director invitation. Nothing is emailed automatically. Hand the secure link to the director yourself.</p>
        <AdminOrganizationForm />
      </section>
    </main>
  );
}
