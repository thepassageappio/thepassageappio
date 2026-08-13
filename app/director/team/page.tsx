import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import { humanizePreviewIdentity, humanizePreviewLabel, humanMemberStatus } from '@/lib/presentation/plain-language';
import { RevokeInvitationForm, RevokeMemberForm } from '../CommandForms';
import styles from '../../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamPage() {
  const result = await loadHostedOperations({ invitations: true });
  if (!result.ok) return <main className={styles.closed}><p>TEAM ACCESS</p><h1>We couldn’t verify Team.</h1><span>{result.message} Nothing changed.</span><Link href="/director/team">Retry Team</Link></main>;
  const { viewer, members, grants, tasks, invitations, invitationLocations } = result.data;
  const locationById = new Map(viewer.locations.map((location) => [location.id, humanizePreviewLabel(location.name)]));
  const staffMembers = members.filter((member) => member.role === 'staff');
  const staffCards = staffMembers.map((member) => {
    const memberLocations = grants
      .filter((grant) => grant.organization_member_id === member.id && !grant.revoked_at)
      .map((grant) => locationById.get(grant.organization_location_id) ?? 'Authorized location');
    const activeAssignments = tasks.filter((task) => task.assigned_organization_member_id === member.id && ['assigned', 'in_progress', 'blocked'].includes(task.status)).length;
    const primaryName = displayMember(member);
    const locationSummary = memberLocations.join(' · ') || 'No active location';
    const commitmentSummary = `${activeAssignments} active ${activeAssignments === 1 ? 'commitment' : 'commitments'}`;
    const discriminator = `${humanMemberStatus(member.status)} · ${locationSummary} · ${commitmentSummary}`;
    return { activeAssignments, discriminator, member, memberLocations, primaryName };
  });
  const collisionCounts = new Map<string, number>();
  for (const card of staffCards) {
    const key = `${card.primaryName}\u0000${card.discriminator}`;
    collisionCounts.set(key, (collisionCounts.get(key) ?? 0) + 1);
  }
  const collisionOrdinals = new Map<string, number>();
  const renderedStaffCards = staffCards.map((card) => {
    const collisionKey = `${card.primaryName}\u0000${card.discriminator}`;
    const nextOrdinal = (collisionOrdinals.get(collisionKey) ?? 0) + 1;
    collisionOrdinals.set(collisionKey, nextOrdinal);
    const visibleDiscriminator = collisionCounts.get(collisionKey)! > 1 ? `${card.discriminator} · Staff access ${nextOrdinal}` : card.discriminator;
    return { ...card, visibleDiscriminator };
  });
  const now = Date.now();
  const pendingInvitations = invitations.filter((invitation) => !invitation.accepted_at && !invitation.revoked_at && new Date(invitation.expires_at).getTime() > now);

  return (
    <AppFrame active="team" identity={humanizePreviewIdentity(viewer.displayName, viewer.role)} mode="verified" role={`Director · ${humanizePreviewLabel(viewer.organizationName)}`}>
      <header className={styles.pageHeading}><div><p>DIRECTOR / TEAM</p><h1>Manage who can access your team’s work.</h1><span>Invitations waiting for acceptance appear first. People who already have access appear below.</span></div><Link className={styles.primaryLink} href="/director/invitations/new">Invite staff</Link></header>

      <section className={styles.workList} aria-labelledby="pending-title">
        <div className={styles.sectionHeading}><div><p>PENDING INVITATIONS</p><h2 id="pending-title">Invitations waiting for acceptance.</h2></div><span>{pendingInvitations.length} pending</span></div>
        {pendingInvitations.length === 0 && <section className={styles.emptyState}><h3>No pending invitations.</h3><span>Create one controlled staff invitation when team access is needed.</span></section>}
        {pendingInvitations.map((invitation) => {
          const locationNames = invitationLocations.filter((row) => row.invitation_id === invitation.id).map((row) => locationById.get(row.organization_location_id) ?? 'Authorized location');
          return <article className={styles.teamCard} key={invitation.id}><div><p>PENDING</p><h3>{invitation.invited_email}</h3><dl className={styles.facts}><div><dt>Role</dt><dd>Staff</dd></div><div><dt>Location</dt><dd>{locationNames.join(' · ') || 'No location'}</dd></div><div><dt>Created</dt><dd>{formatOperationalTime(invitation.created_at)}</dd></div><div><dt>Expires</dt><dd>{formatOperationalTime(invitation.expires_at)}</dd></div><div><dt>Delivery</dt><dd>Not sent · manual handoff</dd></div><div><dt>Purpose</dt><dd>{invitation.purpose}</dd></div></dl></div><RevokeInvitationForm invitationId={invitation.id} recipient={invitation.invited_email} /></article>;
        })}
      </section>

      <section className={styles.workList} aria-labelledby="members-title">
        <div className={styles.sectionHeading}><div><p>TEAM ACCESS</p><h2 id="members-title">People with access by location.</h2></div><span>{staffMembers.filter((member) => member.status === 'active').length} active</span></div>
        {renderedStaffCards.map(({ activeAssignments, member, memberLocations, primaryName, visibleDiscriminator }) => {
          return <article className={styles.teamCard} key={member.id}><div><p>{humanMemberStatus(member.status)}</p><h3>{primaryName}</h3><span className={styles.teamDiscriminator}>{visibleDiscriminator}</span><dl className={styles.facts}><div><dt>Role</dt><dd>Staff</dd></div><div><dt>Locations</dt><dd>{memberLocations.join(' · ') || 'No active location'}</dd></div><div><dt>Account</dt><dd>{member.user_id ? 'Sign-in linked' : 'No sign-in account linked'}</dd></div><div><dt>Active commitments</dt><dd>{activeAssignments}</dd></div></dl></div>{member.status === 'active' && <RevokeMemberForm activeAssignmentCount={activeAssignments} memberId={member.id} memberName={primaryName} requestId={randomUUID()} />}</article>;
        })}
      </section>
    </AppFrame>
  );
}
