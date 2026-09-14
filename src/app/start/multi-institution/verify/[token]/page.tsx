import { randomUUID } from "node:crypto";
import Link from "next/link";
import { verifyRequesterEmailAction } from "@/app/multi-institution-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { normalizeRequesterToken } from "@/lib/authority/multi-institution-submission";
import { userErrorMessage } from "@/lib/authority/user-messages";

export const metadata = { robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function VerifyRequesterEmailPage({ params, searchParams }: Props) {
  const { token: rawToken } = await params;
  const { error } = await searchParams;
  const token = normalizeRequesterToken(rawToken);
  const message = userErrorMessage(error);

  if (!token) {
    return (
      <AccountFrame eyebrow="Secure request" title="This link is no longer active" description="A newer email may have replaced it, or the request may have expired.">
        <div className={styles.alert} role="alert">This confirmation link is not valid.</div>
        <Link className={styles.secondary} href="/start/multi-institution">Start a new request</Link>
      </AccountFrame>
    );
  }

  return (
    <AccountFrame eyebrow="Secure request" title="Confirm your email" description="Confirm that this email address is yours before you can name institutions and upload evidence.">
      {message ? <div className={styles.alert} role="alert">{message}</div> : null}
      <form action={verifyRequesterEmailAction} className={styles.form}>
        <input name="token" type="hidden" value={token} />
        <input name="idempotencyKey" type="hidden" value={randomUUID()} />
        <button className={styles.primary} type="submit">Confirm email and continue</button>
        <p className={styles.legal}>This one-time link expires and can only confirm your email once.</p>
      </form>
    </AccountFrame>
  );
}
