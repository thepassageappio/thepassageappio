import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { humanizePreviewIdentity, humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { createPassageServerClient } from '@/lib/supabase/server';
import { formatOperationalTime } from '@/lib/operations/hosted';
import { humanSituationCategory } from '@/lib/urgent/situations';
import { humanUrgentStatus, loadUrgentIntakeRequest } from '@/lib/urgent/hosted';
import { ClaimUrgentIntakeForm, CreateCaseFromUrgentIntakeForm } from '../UrgentForms';
import styles from '../../../proof-loop.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DirectorUrgentDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) return <Closed />;
  const client = await createPassageServerClient();
  const request = client ? await loadUrgentIntakeRequest(client, requestId) : null;
  if (!request) return <Closed />;

  const claimedByMyOrg = request.claimed_organization_id === viewer.viewer.organizationId;

  return (
    <AppFrame active="urgent" identity={humanizePreviewIdentity(viewer.viewer.displayName, viewer.viewer.role)} mode="verified" role={`${viewer.viewer.role === 'owner' ? 'Owner' : 'Director'} · ${humanizePreviewLabel(viewer.viewer.organizationName)}`}>
      <Link className={styles.backLink} href="/director/urgent">← Urgent requests</Link>
      <header className={styles.hero}>
        <div>
          <p>URGENT REQUEST · {humanSituationCategory(request.situation_category)}</p>
          <h1>{request.person_name}</h1>
          <span>Received {formatOperationalTime(request.submitted_at)}</span>
        </div>
        <strong className={styles.status} data-state={request.status}>{humanUrgentStatus(request.status)}</strong>
      </header>

      <div className={styles.layout}>
        <section className={styles.panel} aria-labelledby="situation-heading">
          <p className={styles.eyebrow}>Situation</p>
          <h2 id="situation-heading">What the family told us.</h2>
          <dl className={styles.facts}>
            <div><dt>Where they are</dt><dd>{request.person_location}</dd></div>
            {request.person_timing && <div><dt>Timing</dt><dd>{request.person_timing}</dd></div>}
          </dl>
        </section>

        <aside className={styles.panel} aria-labelledby="contact-heading">
          <p className={styles.eyebrow}>Contact</p>
          <h2 id="contact-heading">Who to reach.</h2>
          <dl className={styles.facts}>
            <div><dt>Name</dt><dd>{request.coordinator_name}</dd></div>
            {request.coordinator_phone && <div><dt>Phone</dt><dd>{request.coordinator_phone}</dd></div>}
            {request.coordinator_email && <div><dt>Email</dt><dd>{request.coordinator_email}</dd></div>}
            {request.callback_notes && <div><dt>Notes</dt><dd>{request.callback_notes}</dd></div>}
          </dl>
        </aside>
      </div>

      <section className={styles.panel} aria-labelledby="action-heading" style={{ marginTop: 18 }}>
        <p className={styles.eyebrow}>Next step</p>
        <h2 id="action-heading">
          {request.status === 'submitted' ? 'Claim this request to take it on.'
            : request.status === 'claimed' && claimedByMyOrg ? 'Create the case.'
            : request.status === 'claimed' ? 'Another organization has claimed this.'
            : request.status === 'case_created' ? 'The case has been created.'
            : 'No callback was requested for this record.'}
        </h2>

        {request.status === 'submitted' && <ClaimUrgentIntakeForm requestId={randomUUID()} urgentIntakeRequestId={request.id} version={request.version} />}

        {request.status === 'claimed' && claimedByMyOrg && (
          <CreateCaseFromUrgentIntakeForm locations={viewer.viewer.locations} requestId={randomUUID()} urgentIntakeRequestId={request.id} version={request.version} />
        )}

        {request.status === 'case_created' && request.workflow_id && (
          <p><Link href={`/director/cases/${request.workflow_id}`}>Open the case →</Link></p>
        )}
      </section>
    </AppFrame>
  );
}

function Closed() {
  return <main className={styles.closed} id="main-content"><h1>This request is not available to your account.</h1><p>Nothing changed. Return to the urgent queue or ask an organization owner to confirm your access.</p><Link href="/director/urgent">Return to urgent requests</Link></main>;
}
