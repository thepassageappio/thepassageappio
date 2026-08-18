import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { loginPath } from '@/lib/auth/redirects';
import { ReceiveWorkspace } from '../../components/operations/ReceiveWorkspace';
import styles from '../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Previously had no authentication or authority check at all -- reachable by
// anyone, signed in or not, while displaying a hardcoded "Elena Torres /
// Director / Northstar" identity regardless of who was actually looking
// (found during the 2026-08-17 full UX audit). This is a preview/demo tool
// (ReceiveWorkspace runs on local sandbox state, no real backend writes),
// but it must still require the same director/owner authority every other
// operations page requires before it renders at all.
export default async function ReceivePage() {
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok) {
    if (viewer.reason === 'signed-out') redirect(loginPath('/receive'));
    return <Closed />;
  }
  if (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director') return <Closed />;

  return <Suspense fallback={<div aria-busy="true">Opening secure handoff…</div>}><ReceiveWorkspace /></Suspense>;
}

function Closed() {
  return <main className={styles.closed} id="main-content"><h1>This preview is not available to your account.</h1><p>Nothing changed. Return to Today or ask an organization owner to confirm your access.</p><Link href="/director">Return to Today</Link></main>;
}
