import { randomUUID } from "node:crypto";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { userErrorMessage } from "@/lib/authority/user-messages";
import { StartSubmissionForm } from "./StartSubmissionForm";

export const metadata = { robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function StartMultiInstitutionPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const message = userErrorMessage(error);

  return (
    <AccountFrame
      eyebrow="Ask several banks in one go"
      title="List every bank or credit union you need to ask"
      description="Send one set of details to up to five banks. Passage does not decide if a power of attorney is valid. Each bank reviews and decides on its own."
    >
      {message ? <div className={styles.alert} role="alert">{message}</div> : null}
      <StartSubmissionForm idempotencyKey={randomUUID()} />
    </AccountFrame>
  );
}
