import { randomUUID } from "node:crypto";
import Link from "next/link";
import { acceptTeamInvitationAction } from "@/app/account-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { getAuthorityAccessContext, roleLabel, type OrganizationRole } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ invitation?: string; token?: string; error?: string }> };

export default async function AcceptTeamInvitationPage({ searchParams }: Props) {
  const query = await searchParams;
  const invitationId = query.invitation ?? "";
  const token = query.token ?? "";
  const access = await getAuthorityAccessContext();
  const returnPath = `/team/accept?invitation=${encodeURIComponent(invitationId)}&token=${encodeURIComponent(token)}`;
  const error = userErrorMessage(query.error);

  if (!access?.user) {
    return (
      <AccountFrame eyebrow="Organization invitation" title="Sign in to review this invitation" description="Use the same work email address that received the invitation. The secure link is bound to that address.">
        {error ? <div className={styles.alert} role="alert">{error}</div> : null}
        <Link className={styles.primary} href={`/start?intent=sign-in&next=${encodeURIComponent(returnPath)}`}>Continue securely</Link>
      </AccountFrame>
    );
  }

  const supabase = await createClient();
  const { data, error: summaryError } = await supabase.rpc("get_member_invitation_summary_v1", { p_invitation_id: invitationId, p_token: token });
  const summary = data as { organization_name: string; email: string; role: OrganizationRole; expires_at: string } | null;

  if (summaryError || !summary) {
    return (
      <AccountFrame eyebrow="Organization invitation" title="This invitation is not available" description="The invitation may have expired, been revoked, or belong to a different email address.">
        <div className={styles.alert} role="alert">{error ?? "Ask the organization owner to send a new secure invitation."}</div>
        <Link className={styles.secondary} href="/start?intent=sign-in">Use another email</Link>
      </AccountFrame>
    );
  }

  return (
    <AccountFrame eyebrow="Organization invitation" title={`Join ${summary.organization_name}`} description="Review the organization and role before accepting access.">
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
      <div className={styles.summary}><h2>{summary.organization_name}</h2><p>This access is limited to the organization and role shown below.</p></div>
      <div className={styles.facts}><div className={styles.fact}><span>Signed in as</span><strong>{access.user.email}</strong></div><div className={styles.fact}><span>Role</span><strong>{roleLabel(summary.role)}</strong></div><div className={styles.fact}><span>Invitation expires</span><strong>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(summary.expires_at))}</strong></div></div>
      <form action={acceptTeamInvitationAction} className={styles.form}>
        <input name="invitationId" type="hidden" value={invitationId} />
        <input name="token" type="hidden" value={token} />
        <input name="idempotencyKey" type="hidden" value={randomUUID()} />
        <button className={styles.primary} type="submit">Accept organization access</button>
      </form>
    </AccountFrame>
  );
}
