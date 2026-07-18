import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { displayMember, formatOperationalTime, loadHostedOperations } from '@/lib/operations/hosted';
import { RevokeInvitationForm, RevokeMemberForm } from '../CommandForms';
import styles from '../../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeamPage() {
  const result = await loadHostedOperations({ invitations: true });
  if (!result.ok) return <main className={styles.closed}><p>TEAM ACCESS</p><h1>We couldn’t verify Team.</h1><span>{result.message} Nothing changed.</span><Link href="/director/team">Retry Team</Link></main>;
  const { viewer, members, grants, tasks, invitations, invitationLocations } = result.data;
  const locationById = new Map(viewer.locations.map((location) => [location.id, location.name]));
  const staffMembers = members.filter((member) => member.role === 'staff');
  const now = Date.now();
  const pendingInvitations = invitations.filter((invitation) => !invitation.accepted_at && !invitation.revoked_at && new Date(invitation.expires_at).getTime() > now);

  return (
    <AppFrame active="team" identity={viewer.displayName} mode="verified" role={`Director · ${viewer.organizationName}`}>
      <header className={styles.pageHeading}><div><p>TEAM / AUTHORITY</p><h1>Invite and protect team access.</h1><span>Invitation and membership controls remain separate so accepted access is never mistaken for a pending link.</span></div><Link className={styles.primaryLink} href="/director/invitations/new">Invite staff</Link></header>

      <section className={styles.workList} aria-labelledby="pending-title">
        <div className={styles.sectionHeading}><div><p>PENDING INVITATIONS</p><h2 id="pending-title">Access not yet accepted.</h2></div><span>{pendingInvitations.length} pending</span></div>
        {pendingInvitations.length === 0 && <section className={styles.emptyState}><h3>No pending invitations.</h3><span>Create one controlled staff invitation when team access is needed.</span></section>}
        {pendingInvitations.map((invitation) => {
          const locationNames = invitationLocations.filter((row) => row.invitation_id === invitation.id).map((row) => locationById.get(row.organization_location_id) ?? 'Authorized location');
          return <article className={styles.teamCard} key={invitation.id}><div><p>PENDING</p><h3>{invitation.invited_email}</h3><dl className={styles.facts}><div><dt>Role</dt><dd>Staff</dd></div><div><dt>Location</dt><dd>{locationNames.join(' · ') || 'No location'}</dd></div><div><dt>Created</dt><dd>{formatOperationalTime(invitation.created_at)}</dd></div><div><dt>Expires</dt><dd>{formatOperationalTime(invitation.expires_at)}</dd></div><div><dt>Delivery</dt><dd>Not sent · manual handoff</dd></div><div><dt>Purpose</dt><dd>{invitation.purpose}</dd></div></dl></div><RevokeInvitationForm invitationId={invitation.id} recipient={invitation.invited_email} /></article>;
        })}
      </section>

      <section className={styles.workList} aria-labelledby="members-title">
        <div className={styles.sectionHeading}><div><p>ACTIVE STAFF</p><h2 id="members-title">Location-scoped membership.</h2></div><span>{staffMembers.filter((member) => member.status === 'active').length} active</span></div>
        {staffMembers.map((member) => {
          const memberLocations = grants.filter((grant) => grant.organization_member_id === member.id).map((grant) => locationById.get(grant.organization_location_id) ?? 'Authorized location');
          const activeAssignments = tasks.filter((task) => task.assigned_organization_member_id === member.id && ['assigned', 'in_progress', 'blocked'].includes(task.status)).length;
          return <article className={styles.teamCard} key={member.id}><div><p>{member.status.toUpperCase()}</p><h3>{displayMember(member)}</h3><dl className={styles.facts}><div><dt>Role</dt><dd>Staff</dd></div><div><dt>Locations</dt><dd>{memberLocations.join(' · ') || 'No active location'}</dd></div><div><dt>Account</dt><dd>{member.user_id ? member.email : 'No sign-in account linked'}</dd></div><div><dt>Active commitments</dt><dd>{activeAssignments}</dd></div></dl></div>{member.status === 'active' && <RevokeMemberForm activeAssignmentCount={activeAssignments} memberId={member.id} memberName={displayMember(member)} requestId={randomUUID()} />}</article>;
        })}
      </section>
    </AppFrame>
  );
}
