import type { ReactNode } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/auth/actions';
import { OPERATIONAL_PATHNAME_HEADER } from '@/lib/auth/operational-route-gate';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { loginPath } from '@/lib/auth/redirects';
import { getRuntimeConfiguration, publicRuntimeLabel } from '@/lib/runtime-config';
import styles from './OperationalBoundary.module.css';

// Vendor/partner equivalent of OperationalBoundary. Deliberately separate and
// self-contained rather than folded into operational-route-gate.ts: a partner
// user has no organization_members row at all (they authenticate through
// partner_members instead), so the funeral-home role checks in
// canOpenOperationalPath/resolveOperationalViewer do not apply here. This
// keeps the two authority boundaries from becoming entangled.
type PartnerBoundaryProps = { children: ReactNode };

// /partner/start is vendor self-serve signup, for accounts that do NOT have a
// vendor membership yet -- it is the /organization/start equivalent. Wrapping
// it in this boundary made it permanently unreachable: no account could ever
// pass resolvePartnerViewer() before creating its first partner_organizations
// row, so nobody could ever sign up as a vendor. The page has its own
// signed-in-only + already-a-member checks (app/partner/start/page.tsx), so
// it is exempted here rather than requiring existing vendor authority.
const SELF_SERVE_PATH = '/partner/start';

const reasonCopy = {
  'environment-unavailable': 'Secure workspace access is not configured for this environment.',
  'signed-out': 'Sign in before opening the vendor workspace.',
  'membership-required': 'This account does not have an active vendor membership.',
  'authority-unavailable': 'Passage could not verify an active vendor account. Requests remain closed.',
} as const;

export async function PartnerBoundary({ children }: PartnerBoundaryProps) {
  const pathname = (await headers()).get(OPERATIONAL_PATHNAME_HEADER);
  if (pathname === SELF_SERVE_PATH) return children;

  const configuration = getRuntimeConfiguration();
  const result = await resolvePartnerViewer();
  if (!result.ok && result.reason === 'signed-out') redirect(loginPath('/partner'));

  if (!result.ok) {
    return <AccessSurface message={reasonCopy[result.reason]} runtime={publicRuntimeLabel(configuration.runtime)} title="Vendor access remains closed" />;
  }

  return children;
}

function AccessSurface({ title, message, runtime }: { title: string; message: string; runtime: string }) {
  return (
    <main className={styles.shell} id="main-content">
      <section aria-labelledby="access-title" className={styles.denied}>
        {runtime && <p className={styles.eyebrow}>{runtime}</p>}
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
