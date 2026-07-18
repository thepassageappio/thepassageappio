import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { isolatedPreviewInvitationEnabled } from '@/lib/auth/operational-route-gate';
import { getRuntimeConfiguration } from '@/lib/runtime-config';
import { InvitationForm } from './InvitationForm';
import styles from './Invitation.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewStaffInvitationPage() {
  const configuration = getRuntimeConfiguration();
  const result = await resolveOperationalViewer();
  const canCreate = isolatedPreviewInvitationEnabled(configuration) && result.ok && ['owner', 'director'].includes(result.viewer.role);
  return <main className={styles.page}><header><Link href="/director">← Director workspace</Link><p>PASSAGE · VERIFIED TEAM ACCESS</p><h1>Create staff access with a clear boundary.</h1><span>One recipient · one authorized location · one durable audit trail</span></header>{canCreate && result.ok ? <InvitationForm creationRequestId={randomUUID()} locations={result.viewer.locations} organizationName={result.viewer.organizationName} /> : <section className={styles.unavailable} role="alert"><strong>Director authority could not be verified.</strong><p>No invitation was created. Return to the workspace and restore the correct signed-in session.</p><Link href="/director">Return to director workspace</Link></section>}<footer>Invitation access is organization-scoped. Family, participant, vendor, and case access remain unchanged.</footer></main>;
}
