import Link from 'next/link';
import { AppFrame } from '@/components/operations/AppFrame';
import { loginPath } from '@/lib/auth/redirects';
import { resolvePartnerViewer } from '@/lib/auth/partner-authorization';
import { formatPartnerTime } from '@/lib/partner/hosted';
import { humanMemberStatus } from '@/lib/presentation/plain-language';
import { createPassageServerClient } from '@/lib/supabase/server';
import { RevokeInvitationForm } from './RevokeInvitationForm';
import styles from '../../operations-beta.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type MemberRow = { member_id: string; member_email: string; member_display_name: string; member_role: string; member_status: string; member_created_at: string };
type InvitationRow = { invitation_id: string; invited_email: string; purpose: string; expires_at: string; created_at: string };

export default async function PartnerTeamPage() {
  const viewerResult = await resolvePartnerViewer();
  if (!viewerResult.ok) {
    // Branched by reason so a signed-out or non-member visitor gets a real
    // corrective link instead of "Retry team" looping back to a page that
    // fails the exact same way -- found via the vendor persona pass.
    if (viewerResult.reason === 'signed-out') {
      return <main className={styles.closed} id="main-content"><p>VENDOR / TEAM</p><h1>Sign in to manage your team.</h1><span>Nothing changed.</span><Link href={loginPath('/partner/team')}>Sign in</Link></main>;
    }
    if (viewerResult.reason === 'membership-required') {
      return <main className={styles.closed} id="main-content"><p>VENDOR / TEAM</p><h1>This account doesn’t belong to a vendor organization yet.</h1><span>Nothing changed.</span><Link href="/partner/start">Set up your vendor account</Link></main>;
    }
    return <main className={styles.closed} id="main-content"><p>VENDOR / TEAM</p><h1>We couldn’t verify your vendor access.</h1><span>Nothing changed. Try again.</span><Link href="/partner/team">Retry team</Link></main>;
  }
  const { viewer } = viewerResult;

  if (viewer.role !== 'owner') {
    return (
      <AppFrame active="partner-team" identity={viewer.displayName} mode="verified" role={`Vendor · ${viewer.partnerOrganizationName}`}>
        <header className={styles.pageHeading}><div><p>VENDOR / TEAM</p><h1>Team management is owner-only.</h1><span>Ask {viewer.partnerOrganizationName}’s owner to invite or manage team access.</span></div></header>
      </AppFrame>
    );
  }

  const client = await createPassageServerClient();
  const [membersResult, invitationsResult] = client
    ? await Promise.all([
        client.rpc('list_partner_team_members', { partner_organization_id: viewer.partnerOrganizationId }),
        client.rpc('list_partner_team_invitations', { partner_organization_id: viewer.partnerOrganizationId }),
      ])
    : [{ data: null, error: null }, { data: null, error: null }];
  const members = (membersResult.data ?? []) as MemberRow[];
  const invitations = (invitationsResult.data ?? []) as InvitationRow[];

  return (
    <AppFrame active="partner-team" identity={viewer.displayName} mode="verified" role={`Vendor · ${viewer.partnerOrganizationName}`}>
      <header className={styles.pageHeading}>
        <div><p>VENDOR / TEAM</p><h1>Manage who can access your vendor account.</h1><span>Invitations waiting for acceptance appear first. People who already have access appear below.</span></div>
        <Link className={styles.primaryLink} href="/partner/invitations/new">Invite employee</Link>
      </header>

      <section className={styles.workList} aria-labelledby="pending-title">
        <div className={styles.sectionHeading}><div><p>PENDING INVITATIONS</p><h2 id="pending-title">Invitations waiting for acceptance.</h2></div><span>{invitations.length} pending</span></div>
        {invitations.length === 0 && <section className={styles.emptyState}><h3>No pending invitations.</h3><span>Invite a second employee when they need to see and respond to requests.</span></section>}
        {invitations.map((invitation) => (
          <article className={styles.teamCard} key={invitation.invitation_id}>
            <div>
              <p>PENDING</p><h3>{invitation.invited_email}</h3>
              <dl className={styles.facts}>
                <div><dt>Purpose</dt><dd>{invitation.purpose}</dd></div>
                <div><dt>Created</dt><dd>{formatPartnerTime(invitation.created_at)}</dd></div>
                <div><dt>Expires</dt><dd>{formatPartnerTime(invitation.expires_at)}</dd></div>
              </dl>
            </div>
            <RevokeInvitationForm invitationId={invitation.invitation_id} recipient={invitation.invited_email} />
          </article>
        ))}
      </section>

      <section className={styles.workList} aria-labelledby="members-title">
        <div className={styles.sectionHeading}><div><p>TEAM ACCESS</p><h2 id="members-title">People with access to {viewer.partnerOrganizationName}.</h2></div><span>{members.filter((member) => member.member_status === 'active').length} active</span></div>
        {members.map((member) => (
          <article className={styles.teamCard} key={member.member_id}>
            <div>
              <p>{humanMemberStatus(member.member_status)}</p>
              <h3>{member.member_display_name || member.member_email}</h3>
              <dl className={styles.facts}>
                <div><dt>Role</dt><dd>{member.member_role === 'owner' ? 'Owner' : 'Member'}</dd></div>
                <div><dt>Email</dt><dd>{member.member_email}</dd></div>
                <div><dt>Joined</dt><dd>{formatPartnerTime(member.member_created_at)}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </section>
    </AppFrame>
  );
}
