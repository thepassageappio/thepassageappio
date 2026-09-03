import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createHostedAuthorityDraftAction } from "@/app/account-actions";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { canCoordinateAuthorityRequests } from "@/lib/authority/role-capabilities";
import { userErrorMessage } from "@/lib/authority/user-messages";
import styles from "@/components/app/app-shell.module.css";
import requestStyles from "./request.module.css";

type Props = { searchParams: Promise<{ error?: string; sample?: string }> };

export default async function NewHostedAuthorityRequest({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.membership || !canCoordinateAuthorityRequests(access.membership.role)) {
    redirect("/app?error=request_creation_not_allowed");
  }
  const { error, sample } = await searchParams;
  const message = userErrorMessage(error);
  const useSample = sample === "1";
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>New authority request</p><h1>Start with a clear, limited scope</h1><p>Save a draft first. You will review exactly what each person receives before anything is sent or counted.</p>{useSample ? null : <Link className={styles.secondary} href="/app/requests/new?sample=1">Load sample details</Link>}</div>
    </header>
    {message ? <div className={styles.alert} role="alert">{message}</div> : null}
    {useSample ? <div className={styles.notice} role="status"><strong>Sample details are ready.</strong> Enter two controlled inboxes that you can open separately. Download the <a href="/samples/fictional-poa.pdf" download>fictional POA</a> and <a href="/samples/fictional-identity.pdf" download>fictional identity file</a> for the representative upload steps.</div> : null}
    <form action={createHostedAuthorityDraftAction} className={requestStyles.form}>
      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>New York financial power of attorney</h2><p>Your organization policy defines the required evidence and keeps the final decision with your review team.</p></div><span className={styles.badge}>Selected</span></div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>People</h2><p>Enter each person once. Their secure access is created only after activation.</p></div></div>
        <div className={requestStyles.formGrid}>
          <label className={styles.field}>Person granting authority<input name="principalName" required autoComplete="name" placeholder="Full legal name" defaultValue={useSample ? "Parker Quinn" : ""} /></label>
          <label className={styles.field}>Email<input name="principalEmail" type="email" required autoComplete="email" placeholder="name@example.com" /></label>
          <label className={styles.field}>Representative<input name="representativeName" required autoComplete="name" placeholder="Full legal name" defaultValue={useSample ? "Casey Quinn" : ""} /></label>
          <label className={styles.field}>Email<input name="representativeEmail" type="email" required autoComplete="email" placeholder="name@example.com" /></label>
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Authority scope</h2><p>Anything not selected remains outside this request.</p></div></div>
        <label className={styles.field}>Account or relationship covered<input name="accountBoundary" required placeholder="For example, membership account ending 4821" defaultValue={useSample ? "Sample deposit relationship ending 4405" : ""} /></label>
        <fieldset className={requestStyles.optionList}>
          <legend>Permitted actions</legend>
          <label className={requestStyles.option}><input type="checkbox" name="allowedActionKeys" value="receive_duplicate_statements" defaultChecked /><span><strong>Receive duplicate monthly statements</strong><small>Copies only for the account or relationship named above.</small></span></label>
          <label className={requestStyles.option}><input type="checkbox" name="allowedActionKeys" value="discuss_service_issues" defaultChecked /><span><strong>Discuss account-service issues</strong><small>Non-transactional service conversations only.</small></span></label>
        </fieldset>
        <label className={styles.field}>Request end date<input name="validUntil" type="date" required defaultValue={defaultEndDate.toISOString().slice(0, 10)} /></label>
      </section>
      <section className={requestStyles.reviewBar}><div><strong>Save without sending</strong><p>This creates one private draft. The evaluation clock remains stopped and no request is used.</p></div><button className={styles.primary} type="submit">Save draft</button></section>
    </form>
  </>;
}
