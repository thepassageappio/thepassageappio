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
  return <main className={styles.page}><header><Link href="/director">← Director workspace</Link><p>DIRECTOR · TEAM ACCESS</p><h1>Invite a staff member.</h1><span>Choose one recipient and the locations they can access. The invitation will be saved in team activity.</span></header>{canCreate && result.ok ? <InvitationForm creationRequestId={randomUUID()} locations={result.viewer.locations} organizationName={result.viewer.organizationName} /> : <section className={styles.unavailable} role="alert"><strong>We couldn’t confirm your team access.</strong><p>No invitation was created. Return to the director workspace and try again.</p><Link href="/director">Return to director workspace</Link></section>}<footer>This invitation does not include family, participant, vendor, or case access.</footer></main>;
}
