import Link from "next/link";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";

type Props = { searchParams: Promise<{ ref?: string; delivered?: string }> };

export default async function MultiInstitutionCheckEmailPage({ searchParams }: Props) {
  const { ref, delivered } = await searchParams;
  const notDelivered = delivered === "0";

  return (
    <AccountFrame
      eyebrow={ref ? `Reference ${ref}` : "Secure access"}
      title="Check your email"
      description={notDelivered
        ? "The request was accepted, but the email service did not confirm delivery. Check your inbox and spam folder before starting over."
        : "The request was accepted, but that does not guarantee inbox delivery. The confirmation link expires and can only be used once."}
    >
      <div className={styles.complete}>
        <div className={styles.completeMark} aria-hidden="true">✓</div>
        <h2>Open the link on this device</h2>
        <p>Wait a couple of minutes and check spam. The link confirms your email and takes you to the next step.</p>
        <div className={styles.actions}>
          <Link className={styles.secondary} href="/">Return to website</Link>
          <Link className={styles.primary} href="/start/multi-institution">Start over</Link>
        </div>
      </div>
    </AccountFrame>
  );
}
