import { randomUUID } from "node:crypto";
import Link from "next/link";
import { provisionHostedDemoRunAction } from "@/app/account-actions";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { mayProvisionDemoRun } from "@/lib/authority/demo-boundary";
import { canCoordinateAuthorityRequests, institutionWorkspacePresentation } from "@/lib/authority/role-capabilities";
import { hostedStatusLabel, mapHostedAuthorityRecord } from "@/lib/authority/hosted-records";
import { userErrorMessage, userNoticeMessage } from "@/lib/authority/user-messages";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";
import polish from "@/components/app/workspace-polish.module.css";

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
  const needsAction = records.filter((record) => record.status === "under_review").length;
  const waitingOnRepresentative = records.filter((record) => record.status === "information_requested").length;
  const mayCreate = canCoordinateAuthorityRequests(access.membership.role);
  const mayPrepareDemo = mayProvisionDemoRun(access.user.email, access.membership.role);
  const presentation = institutionWorkspacePresentation(access.membership.role);

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>{presentation.eyebrow}</p><h1>{presentation.title ?? access.organization.displayName}</h1><p>{presentation.description}</p></div>
      {mayCreate ? <div className={styles.headerActions}>
        {mayPrepareDemo && entitlement ? <form action={provisionHostedDemoRunAction}>
          <input type="hidden" name="expectedEntitlementVersion" value={Number(entitlement.version)} />
          <input type="hidden" name="idempotencyKey" value={randomUUID()} />
          <button className={styles.primary} type="submit">Prepare a fresh demo</button>
        </form> : null}
        {!mayPrepareDemo ? <Link className={styles.secondary} href="/app/requests/new?sample=1">Start with sample details</Link> : null}
        <Link className={mayPrepareDemo ? styles.secondary : styles.primary} href="/app/requests/new">Start a blank request</Link>
      </div> : null}
    </header>
    {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
    {errorMessage ? <div className={styles.alert} role="alert">{errorMessage}</div> : null}
    <section className={`${styles.metricGrid} ${styles.compactMetrics}`} aria-label="Workspace status">
      <div className={styles.metric}><span>Evaluation usage</span><strong>{activated} of {transactionLimit}</strong></div>
      <div className={styles.metric}><span>{access.membership.role === "reviewer" ? "Needs your review" : "Draft requests"}</span><strong>{access.membership.role === "reviewer" ? needsAction : drafts}</strong></div>
      <div className={styles.metric}><span>{access.membership.role === "reviewer" ? "Waiting on representative" : "Needs institution action"}</span><strong>{access.membership.role === "reviewer" ? waitingOnRepresentative : needsAction}</strong></div>
    </section>
    <div className={styles.grid} style={{ marginTop: 17 }}>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Authority requests</h2><p>Every request shows its status, scope, policy, and next action.</p></div><span className={styles.badge}>{records.length} total</span></div>
        {records.length === 0 ? <div className={styles.empty}>
          <strong>{presentation.emptyTitle}</strong>
          <p>{presentation.emptyDescription}</p>
        </div> : <div className={`${styles.tableWrap} ${polish.tableWrap}`}><table className={`${styles.table} ${polish.table}`}>
          <thead><tr><th>Request</th><th>Status</th><th>Scope</th><th>Updated</th><th>Action</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}>
            <td data-label="People"><strong>{record.principalName} to {record.representativeName}</strong><small>{record.referenceCode}</small></td>
            <td data-label="Status"><span className={styles.badge}>{hostedStatusLabel(record.status)}</span></td>
            <td data-label="Scope"><strong>{record.accountBoundary}</strong><small>{record.allowedActionKeys.length} permitted {record.allowedActionKeys.length === 1 ? "action" : "actions"}</small></td>
            <td data-label="Updated">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(record.updatedAt))}</td>
            <td data-label="Action"><Link className={styles.smallButton} href={`/app/requests/${record.id}`}>Open request</Link></td>
          </tr>)}</tbody>
        </table></div>}
      </section>
      <section className={styles.panel}>
        {access.membership.role === "reviewer" ? <>
          <div className={styles.panelHead}><div><h2>Your reviewer access</h2><p>Your role is separated from request setup.</p></div></div>
          <ul className={styles.checklist}>
            <li>Review submitted evidence and source files</li>
            <li>Ask the representative for a specific correction</li>
            <li>Record the institution&apos;s decision and limits</li>
            <li>An owner or operations staff member starts and sends requests</li>
          </ul>
        </> : <>
          <div className={styles.panelHead}><div><h2>Ready to demonstrate</h2><p>Your workspace is configured for a safe product walkthrough.</p></div></div>
          <ul className={styles.checklist}>
            <li>Verified organization owner</li>
            <li>Evaluation terms accepted</li>
            <li>New York financial POA workflow selected</li>
            <li>Access limited to your organization</li>
          </ul>
        </>}
      </section>
    </div>
  </>;
}
