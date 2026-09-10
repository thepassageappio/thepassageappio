import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DraftRequestForm } from "./DraftRequestForm";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { canCoordinateAuthorityRequests } from "@/lib/authority/role-capabilities";
import { userErrorMessage } from "@/lib/authority/user-messages";
import styles from "@/components/app/app-shell.module.css";

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
      <div><p className={styles.eyebrow}>New authority request</p><h1>Who needs help, and with which account?</h1><p>Save a draft first. Check the details before sending it. Drafts do not count toward your limit.</p>{useSample ? null : <Link className={styles.secondary} href="/app/requests/new?sample=1">Load sample details</Link>}</div>
    </header>
    {message ? <div className={styles.alert} role="alert">{message}</div> : null}
    {useSample ? <div className={styles.notice} role="status"><strong>Sample details are ready.</strong> Use two test email addresses you can open separately. Download the <a href="/samples/fictional-poa.pdf" download>fictional POA</a> and <a href="/samples/fictional-identity.pdf" download>fictional identity file</a> for the representative upload steps.</div> : null}
    <DraftRequestForm useSample={useSample} endDate={defaultEndDate.toISOString().slice(0, 10)} idempotencyKey={randomUUID()} />
  </>;
}
