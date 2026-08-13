import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { resolveOperationalViewer } from '@/lib/auth/authorization';
import { humanizePreviewIdentity, humanizePreviewLabel } from '@/lib/presentation/plain-language';
import { createPassageServerClient } from '@/lib/supabase/server';
import { formatOperationalTime } from '@/lib/operations/hosted';
import { humanSituationCategory } from '@/lib/urgent/situations';
import { humanUrgentStatus, loadUrgentIntakeQueue, type UrgentIntakeRequest } from '@/lib/urgent/hosted';
import styles from '../../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DirectorUrgentPage() {
  const viewer = await resolveOperationalViewer();
  if (!viewer.ok || (viewer.viewer.role !== 'owner' && viewer.viewer.role !== 'director')) return <Closed />;
  const client = await createPassageServerClient();
  const queue = client ? await loadUrgentIntakeQueue(client, viewer.viewer.organizationId) : null;
  if (!queue) return <Closed />;

  return (
    <AppFrame active="urgent" identity={humanizePreviewIdentity(viewer.viewer.displayName, viewer.viewer.role)} mode="verified" role={`${viewer.viewer.role === 'owner' ? 'Owner' : 'Director'} · ${humanizePreviewLabel(viewer.viewer.organizationName)}`}>
      <header className={styles.pageHeading}>
        <div><p>URGENT REQUESTS</p><h1>Families who need help right now.</h1><span>Claim a request to take it on, then create the case.</span></div>
      </header>

      <section className={styles.workList} aria-labelledby="unclaimed-title">
        <div className={styles.sectionHeading}><div><p>WAITING</p><h2 id="unclaimed-title">Not yet claimed by anyone.</h2></div><span>{queue.unclaimed.length} shown</span></div>
        {queue.unclaimed.length === 0 ? (
          <p role="status">Nothing is waiting right now.</p>
        ) : queue.unclaimed.map((request) => <RequestCard key={request.id} request={request} />)}
      </section>

      <section className={styles.workList} aria-labelledby="mine-title" style={{ marginTop: 18 }}>
        <div className={styles.sectionHeading}><div><p>{humanizePreviewLabel(viewer.viewer.organizationName)}</p><h2 id="mine-title">Requests your organization has claimed.</h2></div><span>{queue.mine.length} shown</span></div>
        {queue.mine.length === 0 ? (
          <p role="status">You have not claimed any requests yet.</p>
        ) : queue.mine.map((request) => <RequestCard key={request.id} request={request} />)}
      </section>
    </AppFrame>
  );
}

function RequestCard({ request }: { request: UrgentIntakeRequest }) {
  return (
    <article className={styles.workCard}>
      <div className={styles.cardTop}><span>{humanSituationCategory(request.situation_category)}</span><b data-state={request.status}>{humanUrgentStatus(request.status)}</b></div>
      <div className={styles.cardBody}>
        <h3>{request.person_name}</h3>
        <dl className={styles.facts}>
          <div><dt>Where</dt><dd>{request.person_location}</dd></div>
          <div><dt>Contact</dt><dd>{request.coordinator_name}</dd></div>
          <div><dt>Received</dt><dd>{formatOperationalTime(request.submitted_at)}</dd></div>
        </dl>
      </div>
      <div className={styles.startForm}><Link className={styles.primaryLink} href={`/director/urgent/${request.id}`}>Open request</Link></div>
    </article>
  );
}

function Closed() {
  return <main className={styles.closed} id="main-content"><h1>Urgent requests are not available to your account.</h1><p>Nothing changed. Return to Today or ask an organization owner to confirm your access.</p><Link href="/director">Return to Today</Link></main>;
}
