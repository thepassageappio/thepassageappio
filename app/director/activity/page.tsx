import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import styles from '../../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function metadataText(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : null;
}

export default async function ActivityPage() {
  const result = await loadHostedOperations({ events: true });
  if (!result.ok) return <main className={styles.closed}><p>ACTIVITY</p><h1>We couldn’t verify Activity.</h1><span>{result.message} Nothing changed.</span><Link href="/director/activity">Retry Activity</Link></main>;
  const { viewer, events, members } = result.data;
  const memberById = new Map(members.map((member) => [member.id, member]));
  const locationById = new Map(viewer.locations.map((location) => [location.id, location.name]));
  return (
    <AppFrame active="activity" identity={viewer.displayName} mode="verified" role={`Director · ${viewer.organizationName}`}>
      <header className={styles.pageHeading}><div><p>ACTIVITY / PROOF</p><h1>Who changed what, and when.</h1><span>This is a read-only, location-scoped projection of server-created events.</span></div></header>
      {events.length === 0 ? <section className={styles.emptyState} role="status"><p>SAVED ACTIVITY</p><h2>No command events yet.</h2><span>Invitation, assignment, start-work, and access events appear after their durable command succeeds.</span></section> : <ol className={styles.activityList}>{events.map((event) => { const actor = memberById.get(event.actor_organization_member_id ?? ''); const reason = metadataText(event.metadata, 'reason'); const target = metadataText(event.metadata, 'task_title') ?? metadataText(event.metadata, 'revoked_member_name') ?? metadataText(event.metadata, 'case_reference') ?? event.invitation_id ?? event.task_id ?? 'Organization access'; return <li key={event.id}><div className={styles.eventMark} aria-hidden="true" /><article><div><p>{event.name.replaceAll('.', ' ').toUpperCase()}</p><time dateTime={event.occurred_at}>{formatOperationalTime(event.occurred_at)}</time></div><h2>{displayMember(actor)} changed {target}.</h2><dl className={styles.facts}><div><dt>Actor</dt><dd>{displayMember(actor)} · {actor?.role ?? 'verified member'}</dd></div><div><dt>Location</dt><dd>{locationById.get(event.organization_location_id ?? '') ?? 'Organization-wide'}</dd></div><div><dt>Previous</dt><dd>{event.previous_state ?? 'Not recorded'}</dd></div><div><dt>Next</dt><dd>{event.next_state ?? 'Not recorded'}</dd></div>{reason && <div><dt>Reason</dt><dd>{reason}</dd></div>}<div><dt>Proof</dt><dd>{event.id}</dd></div><div><dt>Visibility</dt><dd>Authorized organization team</dd></div></dl></article></li>; })}</ol>}
    </AppFrame>
  );
}
