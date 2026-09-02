import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createHostedAuthorityDraftAction } from "@/app/account-actions";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";
import styles from "@/components/app/app-shell.module.css";
import requestStyles from "./request.module.css";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewHostedAuthorityRequest({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.membership || !["owner", "admin", "staff", "reviewer"].includes(access.membership.role)) {
    redirect("/app");
  }
  const { error } = await searchParams;
  const message = userErrorMessage(error);
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>New authority request</p><h1>Start with a clear, limited scope</h1><p>Save a draft first. You will review exactly what each person receives before anything is sent or counted.</p></div>
    </header>
    {message ? <div className={styles.alert} role="alert">{message}</div> : null}
    <form action={createHostedAuthorityDraftAction} className={requestStyles.form}>
      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>New York financial power of attorney</h2><p>Your organization policy defines the required evidence and keeps the final decision with your review team.</p></div><span className={styles.badge}>Selected</span></div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>People</h2><p>Enter each person once. Their secure access is created only after activation.</p></div></div>
        <div className={requestStyles.formGrid}>
          <label className={styles.field}>Person granting authority<input name="principalName" required autoComplete="name" placeholder="Full legal name" /></label>
          <label className={styles.field}>Email<input name="principalEmail" type="email" required autoComplete="email" placeholder="name@example.com" /></label>
          <label className={styles.field}>Representative<input name="representativeName" required autoComplete="name" placeholder="Full legal name" /></label>
          <label className={styles.field}>Email<input name="representativeEmail" type="email" required autoComplete="email" placeholder="name@example.com" /></label>
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Authority scope</h2><p>Anything not selected remains outside this request.</p></div></div>
        <label className={styles.field}>Account or relationship covered<input name="accountBoundary" required placeholder="For example, membership account ending 4821" /></label>
        <fieldset className={requestStyles.optionList}>
          <legend>Permitted actions</legend>
          <label className={requestStyles.option}><input type="checkbox" name="allowedActionKeys" value="receive_duplicate_statements" defaultChecked /><span><strong>Receive duplicate monthly statements</strong><small>Copies only for the account or relationship named above.</small></span></label>
          <label className={requestStyles.option}><input type="checkbox" name="allowedActionKeys" value="discuss_service_issues" defaultChecked /><span><strong>Discuss account-service issues</strong><small>Non-transactional service conversations only.</small></span></label>
        </fieldset>
        <label className={styles.field}>Request end date<input name="validUntil" type="date" required defaultValue={defaultEndDate.toISOString().slice(0, 10)} /></label>
      </section>
      <section className={requestStyles.reviewBar}><div><strong>Save without sending</strong><p>This creates one private organization draft. The trial clock remains stopped and no transaction is used.</p></div><button className={styles.primary} type="submit">Save draft</button></section>
    </form>
  </>;
}
