import Link from "next/link";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function CheckEmailPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const unavailable = status === "unavailable";

  return (
    <AccountFrame
      eyebrow="Secure access"
      title={unavailable ? "We could not send the link" : "Check your email"}
      description={unavailable
        ? "Account access is temporarily unavailable. No account or organization information was changed."
        : "If the address can be used, a one-time sign-in link is on its way. The link expires and can only be used once."}
    >
      <div className={styles.complete}>
        <div className={styles.completeMark} aria-hidden="true">{unavailable ? "!" : "✓"}</div>
        <h2>{unavailable ? "Try again shortly" : "Open the link on this device"}</h2>
        <p>{unavailable
          ? "You can continue browsing Passage Authority while account access recovers."
          : "Keep this window open. If the message does not arrive, check your spam folder or request a new link."}</p>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/">Return to website</Link>
          <Link className={styles.primary} href="/start?intent=sign-in">Request another link</Link>
        </div>
      </div>
    </AccountFrame>
  );
}
