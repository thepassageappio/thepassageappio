import { randomUUID } from "node:crypto";
import Link from "next/link";
import { provisionHostedDemoRunAction } from "@/app/account-actions";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { mayProvisionDemoRun } from "@/lib/authority/demo-boundary";
import { evaluationProgress } from "@/lib/authority/evaluation-progress";
import { requestNextStep } from "@/lib/authority/request-next-step";
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
  const mayCreate = canCoordinateAuthorityRequests(access.membership.role);
  const mayPrepareDemo = mayProvisionDemoRun(access.user.email, access.membership.role);
  const presentation = institutionWorkspacePresentation(access.membership.role);
  const progress = evaluationProgress(records, entitlement?.period_ends_at ?? null, new Date(), access.membership.role);

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>{presentation.eyebrow}</p><h1>{presentation.title ?? access.organization.displayName}</h1><p>{access.membership.role === "auditor" ? "Review request history, institution decisions, and shared receipts." : presentation.description}</p></div>
      {mayCreate ? <div className={styles.headerActions}>
        <Link className={styles.secondary} href="/app/requests/new?sample=1">New sample request</Link>
      </div> : null}
    </header>
    {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
    {errorMessage ? <div className={styles.alert} role="alert">{errorMessage}</div> : null}
    <section className={`${styles.metricGrid} ${styles.compactMetrics}`} aria-label="Workspace status">
      <div className={styles.metric}><span>Evaluation usage</span><strong>{activated} of {transactionLimit}</strong></div>
      <div className={styles.metric}><span>Complete results</span><strong>{progress.completedCount}</strong></div>
      <div className={styles.metric}><span>{progress.daysRemaining == null ? "Evaluation timing" : "Days remaining"}</span><strong>{progress.daysRemaining == null ? "Starts on send" : progress.daysRemaining}</strong></div>
    </section>
    {access.membership.role !== "developer" ? <section className={`${styles.panel} ${styles.progressPanel}`} aria-labelledby="evaluation-next-step">
      <div className={styles.progressCopy}>
        <p className={styles.eyebrow}>Your next step</p>
        <h2 id="evaluation-next-step">{progress.nextTitle}</h2>
        <p>{progress.nextDescription}</p>
      </div>
      {mayCreate ? <ol className={styles.progressSteps} aria-label="Evaluation progress">
        <li data-complete={progress.milestone > 1}>Send</li>
        <li data-complete={progress.milestone > 2}>Complete</li>
        <li data-current={progress.milestone === 3}>Review receipt</li>
      </ol> : null}
      <Link className={styles.primary} href={progress.nextHref}>{progress.nextLabel}</Link>
    </section> : null}
    <div className={`${styles.grid} ${polish.workspaceGrid}`} style={{ marginTop: 17 }}>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Authority requests</h2><p>See where each request stands and who needs to act next.</p></div><span className={styles.badge}>{records.length} total</span></div>
        {records.length === 0 ? <div className={styles.empty}>
          <strong>{presentation.emptyTitle}</strong>
          <p>{mayCreate || access.membership.role === "reviewer" ? presentation.emptyDescription : "There are no requests to view. Your request coordinator can confirm what is being prepared."}</p>
        </div> : <div className={`${styles.tableWrap} ${polish.tableWrap}`}><table className={`${styles.table} ${polish.table}`}>
          <thead><tr><th>Request</th><th>Status and next step</th><th>Requested scope</th><th>Updated</th><th>Action</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}>
            <td data-label="People"><strong>{record.principalName} to {record.representativeName}</strong><small>{record.referenceCode}</small></td>
            <td data-label="Status"><span className={`${styles.badge} ${polish.requestStatus}`}>{hostedStatusLabel(record.status)}</span><small>{requestNextStep(record, access.membership!.role).actor}</small></td>
            <td data-label="Requested"><strong>{record.accountBoundary}</strong><small>{record.allowedActionKeys.length} requested {record.allowedActionKeys.length === 1 ? "action" : "actions"}</small></td>
            <td data-label="Updated">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(record.updatedAt))}</td>
            <td data-label="Action"><Link className={styles.smallButton} href={`/app/requests/${record.id}`} aria-label={`${requestNextStep(record, access.membership!.role).label} ${record.referenceCode}`}>{requestNextStep(record, access.membership!.role).label}</Link></td>
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
          <div className={styles.panelHead}><div><h2>About this evaluation</h2><p>Try the steps with made-up people and sample documents.</p></div></div>
          <ul className={styles.checklist}>
            <li>Start with a saved draft. Nothing is sent until you choose to send.</li>
            <li>The account holder and representative each complete their own step.</li>
            <li>Your institution reviews the evidence and records its decision.</li>
            <li>The receipt shows what the institution accepted and any limits.</li>
          </ul>
        </>}
      </section>
    </div>
    {mayCreate && mayPrepareDemo && entitlement ? <details className={polish.demoTools}>
      <summary>Presenter tools</summary>
      <h2>Before you present</h2>
      <ol>
        <li>Open separate browser profiles for the institution, account holder and representative. Keep each person in their own profile.</li>
        <li>Open both test inboxes. Check the recipient addresses in the draft before you send it.</li>
        <li>Download the sample files below. Use made-up information for every step.</li>
        <li>Practice the full story: confirm, upload, ask a question, answer, review and accept with limits. Compare the receipt in all three profiles.</li>
      </ol>
      <div className={styles.headerActions}>
        <a className={styles.secondary} href="/samples/fictional-poa.pdf" download>Download sample power of attorney</a>
        <a className={styles.secondary} href="/samples/fictional-identity.pdf" download>Download sample identity file</a>
      </div>
      <h3>If an invitation is missing</h3>
      <p>Check the address shown on the request, then check that inbox and its spam folder. If you send a replacement from the request page, use only the newest email. Earlier links stop working.</p>
      <p>Complete one practice run before the buyer call. If a person still cannot open their invitation, resolve that first.</p>
      <h3>Start a new practice run</h3>
      <p>This creates a new sample draft. It keeps earlier runs and does not send an email until you choose to send the request.</p>
      <form action={provisionHostedDemoRunAction}>
        <input type="hidden" name="expectedEntitlementVersion" value={Number(entitlement.version)} />
        <input type="hidden" name="idempotencyKey" value={randomUUID()} />
        <button className={styles.secondary} type="submit">Prepare a fresh demo</button>
      </form>
    </details> : null}
  </>;
}
