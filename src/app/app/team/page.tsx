import { randomUUID } from "node:crypto";
import {
  changeMemberRoleAction,
  inviteTeamMemberAction,
  revokeMemberAction,
  revokeMemberInvitationAction,
} from "@/app/account-actions";
import { getAuthorityAccessContext, roleLabel, type OrganizationRole } from "@/lib/authority/access";
import {
  assignableRolesFor,
  canManageMembers,
  canManageTargetMember,
  canViewOrganizationAudit,
  invitableRolesFor,
  roleDefinitions,
} from "@/lib/authority/role-capabilities";
import { userErrorMessage, userNoticeMessage } from "@/lib/authority/user-messages";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";

type Props = { searchParams: Promise<{ error?: string; notice?: string }> };

const activityLabels: Record<string, string> = {
  "organization.created": "Organization created",
  "membership.activated": "Organization access activated",
  "membership.invited": "Team invitation created",
  "membership.role_changed": "Member role changed",
  "membership.revoked": "Member access revoked",
  "membership.invitation_revoked": "Team invitation revoked",
  "organization.terms_accepted": "Evaluation terms accepted",
  "organization.template_selected": "Authority policy selected",
  "authorized_use.attested": "Authorized use confirmed",
  "demo.run_provisioned": "Fresh demo prepared",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default async function TeamPage({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.membership || !access.organization) return null;
  const membership = access.membership;
  const canManage = canManageMembers(membership.role);
  const canViewAudit = canViewOrganizationAudit(membership.role);
  const supabase = await createClient();
  const [membershipResult, invitationResult, auditResult] = await Promise.all([
    supabase.from("organization_memberships").select("id, user_id, email_normalized, role, status, version, activated_at, revoked_at").eq("organization_id", membership.organizationId).order("created_at"),
    canManage ? supabase.from("organization_invitations").select("id, email_normalized, role, status, version, expires_at, created_at").eq("organization_id", membership.organizationId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    canViewAudit ? supabase.from("organization_audit_events").select("event_id, event_type, occurred_at").eq("organization_id", membership.organizationId).order("sequence_id", { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
  ]);
  const members = membershipResult.data ?? [];
  const activeMemberCount = members.filter((member) => member.status === "active").length;
  const activeOwnerCount = members.filter((member) => member.status === "active" && member.role === "owner").length;
  const invitations = invitationResult.data ?? [];
  const activity = auditResult.data ?? [];
  const query = await searchParams;
  const error = userErrorMessage(query.error);
  const notice = userNoticeMessage(query.notice);
  const roles = invitableRolesFor(membership.role);
  const currentRole = roleDefinitions.find((definition) => definition.role === membership.role);

  return (
    <>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>People and access</p><h1>Organization access</h1><p>Give each person the narrowest role they need. Revoked access stops immediately across the workspace.</p></div>
      </header>
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
      {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
      {currentRole ? (
        <section className={styles.accessSummary} aria-label="Your effective access">
          <div><p className={styles.eyebrow}>Your effective access</p><h2>{roleLabel(currentRole.role)}</h2><p>{currentRole.access}</p></div>
          <span className={styles.badge}>Active role</span>
        </section>
      ) : null}
      <details className={`${styles.panel} ${styles.disclosurePanel}`}>
        <summary>What each role can do</summary>
        <div className={styles.roleGrid}>
          {roleDefinitions.map((definition) => <div key={definition.role}><strong>{roleLabel(definition.role)}</strong><span>{definition.purpose}</span><p>{definition.access}</p></div>)}
        </div>
      </details>
      {canManage ? (
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Invite a team member</h2><p>The invitation expires after seven days and only the invited email can accept it.</p></div></div>
          <form action={inviteTeamMemberAction} className={styles.formGrid}>
            <input name="idempotencyKey" type="hidden" value={randomUUID()} />
            <div className={styles.field}><label htmlFor="email">Work email</label><input id="email" name="email" placeholder="reviewer@institution.com" required type="email" /></div>
            <div className={styles.field}><label htmlFor="role">Role</label><select id="role" name="role" required>{roles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></div>
            <button className={styles.primary} type="submit">Send invitation</button>
          </form>
        </section>
      ) : null}
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Members</h2><p>{activeMemberCount} {activeMemberCount === 1 ? "person" : "people"} currently {activeMemberCount === 1 ? "has" : "have"} access.</p></div></div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>Person</th><th>Role</th><th>Status</th><th>Access since</th>{canManage ? <th>Actions</th> : null}</tr></thead>
            <tbody>{members.map((member) => {
              const memberRole = member.role as OrganizationRole;
              const isSoleOwner = memberRole === "owner" && activeOwnerCount === 1;
              const canEditTarget = canManageTargetMember({ actorRole: membership.role, targetRole: memberRole, targetIsSoleOwner: isSoleOwner });
              const availableRoles: OrganizationRole[] = assignableRolesFor(membership.role);
              return (
                <tr key={member.id}>
                  <td><strong>{member.email_normalized}</strong><small>{member.user_id === access.user.id ? "You" : "Organization member"}</small></td>
                  <td>{roleLabel(memberRole)}</td>
                  <td><span className={styles.badge}>{member.status === "active" ? "Active" : "Revoked"}</span></td>
                  <td>{formatTime(member.activated_at)}</td>
                  {canManage ? <td>{canEditTarget && member.status === "active" ? (
                    <div style={{ display: "flex", gap: 7 }}>
                      <form action={changeMemberRoleAction}>
                        <input name="membershipId" type="hidden" value={member.id} />
                        <input name="expectedVersion" type="hidden" value={member.version} />
                        <input name="idempotencyKey" type="hidden" value={randomUUID()} />
                        <select aria-label={`Role for ${member.email_normalized}`} defaultValue={memberRole} name="role">{availableRoles.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select>
                        <button className={styles.smallButton} type="submit">Save</button>
                      </form>
                      <form action={revokeMemberAction}>
                        <input name="membershipId" type="hidden" value={member.id} />
                        <input name="expectedVersion" type="hidden" value={member.version} />
                        <input name="idempotencyKey" type="hidden" value={randomUUID()} />
                        <button className={styles.dangerButton} type="submit">Revoke</button>
                      </form>
                    </div>
                  ) : <span>Protected</span>}</td> : null}
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </section>
      {canManage && invitations.length ? (
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Invitations</h2><p>Pending and completed access invitations.</p></div></div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Expires</th><th>Action</th></tr></thead>
              <tbody>{invitations.map((invitation) => {
                const expired = invitation.status === "pending" && new Date(invitation.expires_at) <= new Date();
                const availability = expired ? "Expired — send a new invitation" : invitation.status === "pending" ? "Ready for the invited email" : invitation.status === "accepted" ? "Accepted" : "Revoked";
                return <tr key={invitation.id}>
                  <td><strong>{invitation.email_normalized}</strong></td><td>{roleLabel(invitation.role as OrganizationRole)}</td><td><span className={styles.badge}>{availability}</span></td><td>{formatTime(invitation.expires_at)}</td>
                  <td>{invitation.status === "pending" ? <form action={revokeMemberInvitationAction}><input name="invitationId" type="hidden" value={invitation.id} /><input name="expectedVersion" type="hidden" value={invitation.version} /><input name="idempotencyKey" type="hidden" value={randomUUID()} /><button className={styles.dangerButton} type="submit">Revoke</button></form> : "Complete"}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </section>
      ) : null}
      {activity.length ? (
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Recent access activity</h2><p>Organization access changes are preserved in order.</p></div></div>
          <ul className={styles.activity}>{activity.map((event) => <li key={event.event_id}><strong>{activityLabels[event.event_type] ?? "Organization access updated"}</strong><span>{formatTime(event.occurred_at)}</span></li>)}</ul>
        </section>
      ) : null}
    </>
  );
}
