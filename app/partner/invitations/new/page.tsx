import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { InvitationForm } from './InvitationForm';
import styles from '../../../director/invitations/new/Invitation.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewPartnerInvitationPage() {
  const result = await resolvePartnerViewer();
  const canCreate = result.ok && result.viewer.role === 'owner';
  return (
    <main className={styles.page}>
      <header><Link href="/partner/team">← Vendor team</Link><p>VENDOR · TEAM ACCESS</p><h1>Invite an employee.</h1><span>The invitation will be saved in your vendor account's activity.</span></header>
      {canCreate && result.ok ? (
        <InvitationForm creationRequestId={randomUUID()} organizationName={result.viewer.partnerOrganizationName} partnerOrganizationId={result.viewer.partnerOrganizationId} />
      ) : (
        <section className={styles.unavailable} role="alert"><strong>We couldn’t confirm your vendor-owner access.</strong><p>No invitation was created. Return to your vendor team page and try again.</p><Link href="/partner/team">Return to vendor team</Link></section>
      )}
      <footer>This invitation grants access to your vendor account's requests only. It never includes funeral-home, family, or participant access.</footer>
    </main>
  );
}
