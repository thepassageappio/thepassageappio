import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { selectTemplateAction } from "@/app/account-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function TemplateOnboardingPage({ searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sign-in");
  if (!access.membership || !access.organization) redirect("/onboarding/organization");
  if (access.organization.onboardingStatus === "terms_required") redirect("/onboarding/terms");
  if (access.organization.onboardingStatus === "ready") redirect("/onboarding/complete");
  const { error: errorCode } = await searchParams;
  const error = userErrorMessage(errorCode);

  return (
    <AccountFrame
      eyebrow="Starting workflow"
      title="Use the New York financial POA template"
      description="Use the same checklist for each sample request. Your team makes the final decision."
      step="Step 3 of 3"
    >
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
      <form action={selectTemplateAction} className={styles.form}>
        <input name="idempotencyKey" type="hidden" value={randomUUID()} />
        <div className={styles.template}>
          <div className={styles.templateTop}>
            <div><span className={styles.eyebrow}>Financial authority</span><h2>New York financial power of attorney</h2></div>
            <span className={styles.badge}>Available</span>
          </div>
          <p>Try requests for statement copies and account questions. Your institution sets the rules and makes the decision.</p>
          <ul className={styles.scope}>
            <li>Get statement copies for the named account</li>
            <li>Discuss defined account-service questions</li>
            <li>Clearly prohibits transfers, withdrawals, ownership changes, and credential takeover</li>
          </ul>
        </div>
        <button className={styles.primary} type="submit">Use this template</button>
      </form>
    </AccountFrame>
  );
}
