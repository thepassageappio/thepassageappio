import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { loginPath } from '@/lib/auth/redirects';
import styles from './OperationalBoundary.module.css';

// Vendor/partner equivalent of OperationalBoundary. Deliberately separate and
// self-contained rather than folded into operational-route-gate.ts: a partner
// user has no organization_members row at all (they authenticate through
// partner_members instead), so the funeral-home role checks in
// canOpenOperationalPath/resolveOperationalViewer do not apply here. This
// keeps the two authority boundaries from becoming entangled.
type PartnerBoundaryProps = { children: ReactNode };

const reasonCopy = {
  'environment-unavailable': 'Secure workspace access is not configured for this environment.',
  'signed-out': 'Sign in before opening the vendor workspace.',
  'membership-required': 'This account does not have an active vendor membership.',
  'authority-unavailable': 'Passage could not verify an active vendor account. Requests remain closed.',
} as const;

export async function PartnerBoundary({ children }: PartnerBoundaryProps) {
  const result = await resolvePartnerViewer();
  if (!result.ok && result.reason === 'signed-out') redirect(loginPath('/partner'));

  if (!result.ok) {
    return <AccessSurface message={`${reasonCopy[result.reason]} No case, task, or request details were shown, and nothing changed.`} title="This page isn’t available to your account." />;
  }

  return children;
}

function AccessSurface({ title, message }: { title: string; message: string }) {
  return (
    <main className={styles.shell} id="main-content">
      <section aria-labelledby="access-title" className={styles.denied}>
        <p className={styles.eyebrow}>PRIVATE VENDOR WORKSPACE</p>
        <h1 id="access-title">{title}</h1>
        <p>{message}</p>
        <div className={styles.recovery}>
          <Link href="/login">Return to sign in</Link>
          <form action={signOut}><button type="submit">Sign out</button></form>
        </div>
      </section>
    </main>
  );
}
