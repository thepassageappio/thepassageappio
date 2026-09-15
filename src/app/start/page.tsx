import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requestSignInAction, signInWithGoogleAction } from "@/app/account-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import authStyles from "@/components/account/auth-buttons.module.css";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { isGoogleSignInEnabled, safeAppPath } from "@/lib/supabase/config";

type Props = {
  searchParams: Promise<{ intent?: string; next?: string; error?: string }>;
};

export const metadata: Metadata = { title: "Try Passage with sample details", robots: { index: false, follow: false } };

export default async function StartPage({ searchParams }: Props) {
  const query = await searchParams;
  const access = await getAuthorityAccessContext();
  const next = safeAppPath(query.next, "/onboarding/organization");
  const sample = query.intent === "sample" || next === "/sample";
  if (access?.user && sample) redirect("/sample");
  if (access?.organization?.onboardingStatus === "ready") redirect("/app");
  if (access?.organization?.onboardingStatus === "template_required") redirect("/onboarding/template");
  if (access?.organization?.onboardingStatus === "terms_required") redirect("/onboarding/terms");
  if (access?.user && !query.next) redirect("/onboarding/organization");

  const returning = query.intent === "sign-in";
  const error = userErrorMessage(query.error);
  const googleSignInEnabled = isGoogleSignInEnabled();

  return (
    <AccountFrame
      eyebrow={returning ? "Welcome back" : sample ? "Sample workflow" : "TRY WITH SAMPLE DETAILS"}
      title={returning ? "Sign in" : sample ? "Sign in to view the sample" : "Try Passage with sample details"}
      description={returning
        ? googleSignInEnabled
          ? "Use Google for immediate access, or we will email you a link to sign in."
          : "We will email you a link to sign in. Use your work email."
        : sample
          ? googleSignInEnabled
            ? "Sign in with Google or an email link. Then agree to receive follow-up emails to view the example. You do not need a phone app that shows a short code."
            : "Sign in with an email link. Then agree to receive follow-up emails to view the example. You do not need a phone app that shows a short code."
        : "You can try up to five practice requests in 10 days. You do not need a card. The 10 days start when you send the first request."}
    >
      {error ? <div className={styles.alert} role="alert">{error}</div> : null}
      {googleSignInEnabled ? <>
        <form action={signInWithGoogleAction} className={authStyles.oauthForm}>
          <input name="next" type="hidden" value={next} />
          <button className={authStyles.googleButton} type="submit">Continue with Google</button>
        </form>
        <div className={authStyles.divider}><span>or use email</span></div>
      </> : null}
      <form action={requestSignInAction} className={styles.form}>
        <input name="next" type="hidden" value={next} />
        {!returning ? (
          <div className={styles.field}>
            <label htmlFor="fullName">Your name</label>
            <input autoComplete="name" id="fullName" name="fullName" placeholder="Alex Morgan" required={sample} type="text" />
          </div>
        ) : null}
        <div className={styles.field}>
          <label htmlFor="email">Work email</label>
          <input autoComplete="email" id="email" name="email" placeholder="alex@institution.com" required type="email" />
          <small>Use your work email so your bank team can find you.</small>
        </div>
        <button className={styles.primary} type="submit">Email me a sign-in link</button>
        <p className={styles.legal}>
          By continuing, you agree to the <Link href="/legal/privacy">privacy notice</Link>. Use only made-up sample details. Do not use real customer information.
        </p>
      </form>
      {sample ? <p className={styles.legal}>Signing in checks that you can access your account. We ask separately for permission to send follow-up emails.</p> : null}
      {!returning && !sample ? <p className={styles.legal}><Link href="/sample">Want to look first? See an example.</Link></p> : null}
    </AccountFrame>
  );
}
