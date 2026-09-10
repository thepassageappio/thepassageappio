import { mfaEnrollmentLabel, type MfaTeamStatus as TeamStatus } from "@/lib/authority/mfa-team-status";
import styles from "./mfa-team-status.module.css";

export function MfaTeamStatus({ status }: { status: TeamStatus | null }) {
  return <section className={styles.panel} aria-labelledby="team-mfa-heading">
    <div className={styles.heading}><h2 id="team-mfa-heading">Team authenticator enrollment</h2><form action="/app/security" method="get"><button type="submit" className={styles.refresh}>Refresh status</button></form></div>
    <p>Active owners and administrators in this organization. Counts show verified authenticators, not another person’s current sign-in status or access to their devices.</p>
    {!status ? <p role="status">Team status is unavailable. Refresh to try again; enrollment and backup coverage have not been confirmed.</p> : <>
      <p>Checked {new Date(status.capturedAt).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC")}.</p>
      <ul className={styles.members}>{status.members.map(member => <li key={member.id}>
        <div><strong>{member.name}</strong><p>{member.email}</p><small>{member.role === "owner" ? "Owner" : "Administrator"}</small></div>
        <div><strong>{mfaEnrollmentLabel(member.verifiedCount)}</strong><p>{member.verifiedCount} verified {member.verifiedCount === 1 ? "authenticator" : "authenticators"}</p></div>
      </li>)}</ul>
      <p>Ask members with a gap to open Sign-in security in their own account. Two enrolled authenticators do not confirm that they are stored on separate devices.</p>
    </>}
  </section>;
}
