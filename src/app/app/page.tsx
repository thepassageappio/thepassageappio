import { randomUUID } from "node:crypto";
import Link from "next/link";
import { provisionHostedDemoRunAction } from "@/app/account-actions";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { mayProvisionDemoRun } from "@/lib/authority/demo-boundary";
import { hostedStatusLabel, mapHostedAuthorityRecord } from "@/lib/authority/hosted-records";
import { userErrorMessage, userNoticeMessage } from "@/lib/authority/user-messages";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";

type Props = { searchParams: Promise<{ notice?: string; error?: string }> };

export default async function OrganizationHomePage({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  const { notice: noticeCode, error: errorCode } = await searchParams;
  const notice = userNoticeMessage(noticeCode);
  const errorMessage = userErrorMessage(errorCode);
  if (!access?.membership || !access.organization) return null;

  const supabase = await createClient();
  const [{ data, error }, { data: entitlement, error: entitlementError }] = await Promise.all([
    supabase
      .from("authority_records")
      .select("id, reference_code, organization_id, created_by, version, status, template_key, template_version, purpose, account_boundary, principal_name, principal_email_normalized, representative_name, representative_email_normalized, allowed_action_keys, valid_until, activated_at, created_at, updated_at")
      .eq("organization_id", access.organization.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("organization_entitlements")
      .select("status, transaction_limit, activated_count, period_started_at, period_ends_at, version")
      .eq("organization_id", access.organization.id)
      .maybeSingle(),
  ]);
  if (error) throw error;
  if (entitlementError) throw entitlementError;

  const records = (data ?? []).map((row) => mapHostedAuthorityRecord(row as never));
  const activated = Number(entitlement?.activated_count ?? 0);
  const transactionLimit = Number(entitlement?.transaction_limit ?? 5);
  const drafts = records.filter((record) => record.status === "draft").length;
  const needsAction = records.filter((record) => ["under_review", "information_requested"].includes(record.status)).length;
  const mayCreate = ["owner", "admin", "staff", "reviewer"].includes(access.membership.role);
  const mayPrepareDemo = mayProvisionDemoRun(access.user.email, access.membership.role);

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>Institution workspace</p><h1>{access.organization.displayName}</h1><p>Start requests, see what needs attention, and review every saved decision.</p></div>
      {mayCreate ? <div className={styles.headerActions}>
        {mayPrepareDemo && entitlement ? <form action={provisionHostedDemoRunAction}>
          <input type="hidden" name="expectedEntitlementVersion" value={Number(entitlement.version)} />
          <input type="hidden" name="idempotencyKey" value={randomUUID()} />
          <button className={styles.primary} type="submit">Prepare a fresh demo</button>
        </form> : null}
        <Link className={styles.secondary} href="/app/requests/new?sample=1">Start a sample request</Link>
        <Link className={styles.primary} href="/app/requests/new">Start a request</Link>
      </div> : null}
    </header>
    {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
    {errorMessage ? <div className={styles.alert} role="alert">{errorMessage}</div> : null}
    <section className={styles.metricGrid} aria-label="Workspace status">
      <div className={styles.metric}><span>Requests used</span><strong>{activated} of {transactionLimit}</strong></div>
      <div className={styles.metric}><span>Draft requests</span><strong>{drafts}</strong></div>
      <div className={styles.metric}><span>Needs institution action</span><strong>{needsAction}</strong></div>
    </section>
    <div className={styles.grid} style={{ marginTop: 17 }}>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Authority requests</h2><p>Every request shows its status, scope, policy, and next action.</p></div><span className={styles.badge}>{records.length} total</span></div>
        {records.length === 0 ? <div className={styles.empty}>
          <strong>Your request queue is empty</strong>
          <p>Create a draft to review the participants and scope. Nothing is sent or counted until activation.</p>
        </div> : <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th>Request</th><th>Status</th><th>Scope</th><th>Updated</th><th>Action</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}>
            <td><strong>{record.principalName} to {record.representativeName}</strong><small>{record.referenceCode}</small></td>
            <td><span className={styles.badge}>{hostedStatusLabel(record.status)}</span></td>
            <td><strong>{record.accountBoundary}</strong><small>{record.allowedActionKeys.length} permitted {record.allowedActionKeys.length === 1 ? "action" : "actions"}</small></td>
            <td>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(record.updatedAt))}</td>
            <td><Link className={styles.smallButton} href={`/app/requests/${record.id}`}>Open</Link></td>
          </tr>)}</tbody>
        </table></div>}
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Workspace setup</h2><p>The basic controls for this evaluation.</p></div></div>
        <ul className={styles.checklist}>
          <li>Verified organization owner</li>
          <li>Evaluation terms accepted</li>
          <li>New York financial POA workflow selected</li>
          <li>Access limited to your organization</li>
        </ul>
      </section>
    </div>
  </>;
}
