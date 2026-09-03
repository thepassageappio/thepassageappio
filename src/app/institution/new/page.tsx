import Link from "next/link";
import { createAuthorityRequestAction } from "@/app/actions";
import { PortalHeader } from "@/components/authority/PortalHeader";
import styles from "./setup.module.css";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewAuthorityRequest({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className={styles.page}>
      <PortalHeader active="templates" />
      <div className={styles.shell}>
        <Link className={styles.back} href="/institution">Back to review queue</Link>
        <header className={styles.intro}>
          <div><p className={styles.eyebrow}>New request</p><h1>Start a financial POA request</h1></div>
          <p>Choose the exact account boundary and permitted actions. The person granting authority confirms the request before the representative can continue.</p>
        </header>
        {error ? <div className={styles.error} role="alert">{error}</div> : null}
        <form action={createAuthorityRequestAction} className={styles.form}>
          <section className={styles.card}>
            <div className={styles.cardHead}><div><span>Selected template</span><h2>New York financial power of attorney</h2></div><b>Available now</b></div>
            <p>Guides document review, representative certification, identity, address, minimum disclosure, institution review, and later status changes.</p>
          </section>
          <section className={styles.card}>
            <div className={styles.sectionTitle}><span>1</span><div><h2>Who is involved?</h2><p>The product tour starts with sample participant details. Replace them only with approved evaluation data.</p></div></div>
            <div className={styles.twoColumns}>
              <label>Person granting authority<input name="principalName" required defaultValue="Eleanor Carter" autoComplete="name" /></label>
              <label>Email<input name="principalEmail" type="email" required defaultValue="eleanor.carter@example.test" autoComplete="email" /></label>
              <label>Representative<input name="representativeName" required defaultValue="Maya Carter" autoComplete="name" /></label>
              <label>Email<input name="representativeEmail" type="email" required defaultValue="maya.carter@example.test" autoComplete="email" /></label>
            </div>
          </section>
          <section className={styles.card}>
            <div className={styles.sectionTitle}><span>2</span><div><h2>What may the representative do?</h2><p>Start narrow. Anything not selected remains outside this request.</p></div></div>
            <label>Account or relationship boundary<input name="accountBoundary" required defaultValue="Membership account ending 4821" /></label>
            <fieldset>
              <legend>Permitted actions</legend>
              <label className={styles.option}><input type="checkbox" name="allowedActionKeys" value="receive_duplicate_statements" defaultChecked /><span><strong>Receive duplicate monthly statements</strong><small>Copies only for the named account boundary.</small></span></label>
              <label className={styles.option}><input type="checkbox" name="allowedActionKeys" value="discuss_service_issues" defaultChecked /><span><strong>Discuss account-service issues</strong><small>Non-transactional service conversations only.</small></span></label>
            </fieldset>
            <label>Request end date<input name="validUntil" type="date" required defaultValue="2027-08-26" /></label>
          </section>
          <section className={styles.review}>
            <div><strong>What happens next</strong><p>The person granting authority confirms the scope. The representative then completes the guided evidence packet. Your review team keeps the final acceptance decision.</p></div>
            <button type="submit">Create request</button>
          </section>
        </form>
      </div>
    </main>
  );
}
