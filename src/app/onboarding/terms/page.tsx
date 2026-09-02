import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptTermsAction } from "@/app/account-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function TermsOnboardingPage({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sign-in");
  if (!access.membership || !access.organization) redirect("/onboarding/organization");
  if (access.organization.onboardingStatus === "ready") redirect("/app");
  if (access.organization.onboardingStatus === "template_required") redirect("/onboarding/template");

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("terms_documents")
    .select("id, document_kind, version, title, content_path")
    .eq("status", "current");
  const terms = documents?.find((document) => document.document_kind === "terms");
  const privacy = documents?.find((document) => document.document_kind === "privacy");
  const authorizedUse = documents?.find((document) => document.document_kind === "authorized_use");
  const { error: errorCode } = await searchParams;
  const error = userErrorMessage(errorCode);

  if (!terms || !privacy || !authorizedUse) {
    return (
      <AccountFrame eyebrow="Evaluation agreement" title="Review required documents" description="The current documents are temporarily unavailable." step="Step 2 of 3">
        <div className={styles.alert} role="alert">Account setup cannot continue until all current documents are available.</div>
      </AccountFrame>
    );
  }

  return (
    <AccountFrame
      eyebrow="Evaluation agreement"
      title="Review how the workspace may be used"
      description={`These confirmations apply to ${access.organization.displayName}. Passage records the exact document versions you accept.`}
      step="Step 2 of 3"
    >
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
      <form action={acceptTermsAction} className={styles.form}>
        <input name="idempotencyKey" type="hidden" value={randomUUID()} />
        <input name="termsDocumentId" type="hidden" value={terms.id} />
        <input name="privacyDocumentId" type="hidden" value={privacy.id} />
        <input name="authorizedUseDocumentId" type="hidden" value={authorizedUse.id} />
        <div className={styles.documentList}>
          {[terms, privacy, authorizedUse].map((document) => (
            <div className={styles.document} key={document.id}>
              <div><strong>{document.title}</strong><span>Version {document.version}</span></div>
              <Link href={document.content_path}>Review</Link>
            </div>
          ))}
        </div>
        <label className={styles.check}>
          <input name="termsAccepted" required type="checkbox" />
          <span>I accept the Evaluation Terms for this organization.</span>
        </label>
        <label className={styles.check}>
          <input name="privacyAcknowledged" required type="checkbox" />
          <span>I acknowledge the Evaluation Privacy Notice and understand how evaluation information is handled.</span>
        </label>
        <label className={styles.check}>
          <input name="dataUseAttested" required type="checkbox" />
          <span>I will submit only information this organization is authorized to use and share for the stated purpose.</span>
        </label>
        <button className={styles.primary} type="submit">Accept and continue</button>
      </form>
    </AccountFrame>
  );
}
