import Link from "next/link";
import { redirect } from "next/navigation";
import { requestSignInAction } from "@/app/account-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { safeAppPath } from "@/lib/supabase/config";

type Props = {
  searchParams: Promise<{ intent?: string; next?: string; error?: string }>;
};

export default async function StartPage({ searchParams }: Props) {
  const query = await searchParams;
  const access = await getAuthorityAccessContext();
  if (access?.organization?.onboardingStatus === "ready") redirect("/app");
  if (access?.organization?.onboardingStatus === "template_required") redirect("/onboarding/template");
  if (access?.organization?.onboardingStatus === "terms_required") redirect("/onboarding/terms");
  if (access?.user && !query.next) redirect("/onboarding/organization");

  const returning = query.intent === "sign-in";
  const next = safeAppPath(query.next, "/onboarding/organization");
  const error = userErrorMessage(query.error);

  return (
    <AccountFrame
      eyebrow={returning ? "Welcome back" : "Try Passage Authority"}
      title={returning ? "Sign in securely" : "Create your evaluation workspace"}
      description={returning
        ? "Enter your work email and we will send a one-time secure link."
        : "Explore five real authority requests over 10 days. No card is required and the clock starts only when you send the first request."}
    >
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
      <form action={requestSignInAction} className={styles.form}>
        <input name="next" type="hidden" value={next} />
        {!returning ? (
          <div className={styles.field}>
            <label htmlFor="fullName">Your name</label>
            <input autoComplete="name" id="fullName" name="fullName" placeholder="Alex Morgan" type="text" />
          </div>
        ) : null}
        <div className={styles.field}>
          <label htmlFor="email">Work email</label>
          <input autoComplete="email" id="email" name="email" placeholder="alex@institution.com" required type="email" />
          <small>Use the email address your organization will recognize.</small>
        </div>
        <button className={styles.primary} type="submit">Email me a secure link</button>
        <p className={styles.legal}>
          By continuing, you acknowledge the <Link href="/legal/privacy">privacy notice</Link>. You will review the evaluation terms before real information can be used.
        </p>
      </form>
    </AccountFrame>
  );
}
