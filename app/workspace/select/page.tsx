import Link from 'next/link';
import { verifiedUser } from '@/lib/auth/session';
import { loginPath } from '@/lib/auth/redirects';
import { createPassageServerClient } from '@/lib/supabase/server';
import { selectWorkspace } from './actions';
import styles from '../../login/Auth.module.css';

export const metadata = { title: 'Choose a workspace' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type MembershipRow = { organization_id: string; role: string; organizations: { name: string } | { name: string }[] | null };

function orgName(value: MembershipRow['organizations']): string {
  const org = Array.isArray(value) ? value[0] : value;
  return org?.name ?? 'Funeral-home workspace';
}

const errorMessages: Record<string, string> = {
  invalid: 'Choose one of the organizations below.',
  unavailable: 'Passage could not verify sign-in right now. Try again.',
  denied: 'That organization is no longer active on this account.',
};

// Built after a real, previously unrecoverable dead end: an account with 2+
// active organization memberships (the founder's own account among them --
// owner of one org, director of another from earlier testing) hit
// "Workspace selection must be completed" with no actual way to select
// one anywhere in the app. This is that selection screen.
export default async function SelectWorkspacePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const client = await createPassageServerClient();
  const user = client ? await verifiedUser(client) : null;
  if (!user) {
    return (
      <main className={styles.shell} id="main-content">
        <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>CHOOSE A WORKSPACE</p>
          <h1>Sign in first.</h1>
          <Link className={styles.primary} href={loginPath('/workspace/select')} style={{ display: 'inline-flex' }}>Sign in or create an account</Link>
        </section>
      </main>
    );
  }

  const memberships = await client!.from('organization_members').select('organization_id, role, organizations(name)').eq('user_id', user.id).eq('status', 'active');
  const rows = (memberships.data ?? []) as unknown as MembershipRow[];

  return (
    <main className={styles.shell} id="main-content">
      <header className={styles.brandBar}><Link href="/">PASSAGE</Link></header>
      <section className={styles.panel} aria-labelledby="select-title">
        <p className={styles.eyebrow}>CHOOSE A WORKSPACE</p>
        <h1 id="select-title">Which organization?</h1>
        <p className={styles.lede}>{user.email} belongs to more than one organization. Choose which one to open — you can switch back here anytime.</p>
        {error && <p className={styles.alert} role="alert">{errorMessages[error] ?? errorMessages.unavailable}</p>}
        {rows.length === 0 ? (
          <p className={styles.notice} role="status">No active organization membership was found on this account.</p>
        ) : (
          <div className={styles.actions}>
            {rows.map((row) => (
              <form action={selectWorkspace} key={row.organization_id}>
                <input name="organizationId" type="hidden" value={row.organization_id} />
                <button className={styles.primary} style={{ display: 'block', width: '100%', marginBottom: 10, textAlign: 'left' }} type="submit">
                  {orgName(row.organizations)} <span style={{ fontWeight: 400, opacity: 0.75 }}>· {row.role}</span>
                </button>
              </form>
            ))}
          </div>
        )}
        <footer className={styles.privacy}>
          <form action="/auth/signout" method="post"><button style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }} type="submit">Sign out</button></form>
        </footer>
      </section>
    </main>
  );
}
