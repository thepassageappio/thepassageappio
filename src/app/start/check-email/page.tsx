import Link from "next/link";
import { signInWithGoogleAction } from "@/app/account-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import authStyles from "@/components/account/auth-buttons.module.css";
import { isGoogleSignInEnabled } from "@/lib/supabase/config";

type Props = { searchParams: Promise<{ status?: string; next?: string }> };

export default async function CheckEmailPage({ searchParams }: Props) {
  const { status, next = "/onboarding/organization" } = await searchParams;
  const unavailable = status === "unavailable";
  const googleSignInEnabled = isGoogleSignInEnabled();

  return (
    <AccountFrame
      eyebrow="Secure access"
      title={unavailable ? "We could not send the link" : "Check your email"}
      description={unavailable
        ? "Account access is temporarily unavailable. No account or organization information was changed."
        : "The request was accepted, but that does not guarantee inbox delivery. The link expires and can only be used once."}
    >
      <div className={styles.complete}>
        <div className={styles.completeMark} aria-hidden="true">{unavailable ? "!" : "✓"}</div>
        <h2>{unavailable ? "Try again shortly" : "Open the link on this device"}</h2>
        <p>{unavailable
          ? googleSignInEnabled ? "Use Google to continue now, or return later to request another email link." : "Return later to request another email link."
          : googleSignInEnabled ? "Wait two minutes and check spam. If it does not arrive, use Google instead of repeatedly requesting links." : "Wait two minutes and check spam before requesting another link."}</p>
        {googleSignInEnabled ? <form action={signInWithGoogleAction} className={authStyles.oauthForm}>
          <input name="next" type="hidden" value={next} />
          <button className={authStyles.googleButton} type="submit">Continue with Google</button>
        </form> : null}
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/">Return to website</Link>
          <Link className={styles.primary} href="/start?intent=sign-in">Request another link</Link>
        </div>
      </div>
    </AccountFrame>
  );
}
