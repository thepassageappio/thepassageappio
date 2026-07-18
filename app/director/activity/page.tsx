import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import { humanizePreviewIdentity, humanizePreviewLabel, humanizeSavedReason } from '@/lib/presentation/plain-language';
import styles from '../../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function metadataText(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : null;
}

const eventLabels: Record<string, string> = {
  'organization_invitation.created': 'Staff invitation created',
  'organization_invitation.accepted': 'Staff invitation accepted',
  'organization_invitation.revoked': 'Staff invitation canceled',
  'organization_member.revoked': 'Team access removed',
  'task.assigned': 'Task assigned',
  'task.reassigned': 'Task reassigned',
  'task.started': 'Task started',
  'task.proof_submitted': 'Proof submitted for review',
  'task.proof_verified': 'Proof verified',
  'task.proof_replacement_requested': 'Replacement requested',
};

const stateLabels: Record<string, string> = {
  active: 'Active access',
  assigned: 'Assigned',
  completed: 'Complete',
  in_progress: 'In progress',
  pending_acceptance: 'Waiting for acceptance',
  proof_submitted: 'Waiting for review',
  revoked: 'Access removed',
};

function humanState(value: string | null) {
  if (!value) return 'Not recorded';
  return stateLabels[value] ?? 'Status unavailable';
}

function activitySentence(event: { name: string; metadata: Record<string, unknown> | null }, actor: string) {
  const task = metadataText(event.metadata, 'task_title') ?? 'this task';
  const member = metadataText(event.metadata, 'revoked_member_name') ?? 'a team member';
  if (event.name === 'organization_invitation.created') return `${actor} created a staff invitation.`;
  if (event.name === 'organization_invitation.accepted') return `${actor} accepted a staff invitation.`;
  if (event.name === 'organization_invitation.revoked') return `${actor} canceled a staff invitation.`;
  if (event.name === 'organization_member.revoked') return `${actor} removed ${member}’s team access.`;
  if (event.name === 'task.assigned') return `${actor} assigned ${task}.`;
  if (event.name === 'task.reassigned') return `${actor} reassigned ${task}.`;
  if (event.name === 'task.started') return `${actor} started ${task}.`;
  if (event.name === 'task.proof_submitted') return `${actor} submitted proof for ${task}.`;
  if (event.name === 'task.proof_verified') return `${actor} verified proof for ${task}.`;
  if (event.name === 'task.proof_replacement_requested') return `${actor} requested replacement proof for ${task}.`;
  return `${actor} updated team activity.`;
}

export default async function ActivityPage() {
  const result = await loadHostedOperations({ events: true });
  if (!result.ok) return <main className={styles.closed}><p>ACTIVITY</p><h1>We couldn’t verify Activity.</h1><span>{result.message} Nothing changed.</span><Link href="/director/activity">Retry Activity</Link></main>;
  const { viewer, events, members } = result.data;
  const memberById = new Map(members.map((member) => [member.id, member]));
  const locationById = new Map(viewer.locations.map((location) => [location.id, humanizePreviewLabel(location.name)]));
  return (
    <AppFrame active="activity" identity={humanizePreviewIdentity(viewer.displayName, viewer.role)} mode="verified" role={`Director · ${humanizePreviewLabel(viewer.organizationName)}`}>
      <header className={styles.pageHeading}><div><p>DIRECTOR / ACTIVITY</p><h1>Recent team activity.</h1><span>See what changed, who changed it, and when.</span></div></header>
      {events.length === 0 ? <section className={styles.emptyState} role="status"><p>TEAM ACTIVITY</p><h2>No team activity yet.</h2><span>Invitations, assignments, started work, and access changes will appear here after they are saved.</span></section> : <ol className={styles.activityList}>{events.map((event) => { const actor = memberById.get(event.actor_organization_member_id ?? ''); const actorName = humanizePreviewIdentity(displayMember(actor), actor?.role); const reason = humanizeSavedReason(metadataText(event.metadata, 'reason'), 'The preview check was completed.'); return <li key={event.id}><div className={styles.eventMark} aria-hidden="true" /><article><div><p>{eventLabels[event.name] ?? 'Team activity updated'}</p><time dateTime={event.occurred_at}>{formatOperationalTime(event.occurred_at)}</time></div><h2>{activitySentence(event, actorName)}</h2><dl className={styles.facts}><div><dt>Changed by</dt><dd>{actorName} · {actor?.role ?? 'team member'}</dd></div><div><dt>Location</dt><dd>{locationById.get(event.organization_location_id ?? '') ?? 'All locations'}</dd></div><div><dt>Before</dt><dd>{humanState(event.previous_state)}</dd></div><div><dt>After</dt><dd>{humanState(event.next_state)}</dd></div>{reason && <div><dt>Reason</dt><dd>{reason}</dd></div>}<div><dt>Visible to</dt><dd>Authorized organization team</dd></div></dl></article></li>; })}</ol>}
    </AppFrame>
  );
}
