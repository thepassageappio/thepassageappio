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
      eyebrow="Multiple institutions, one request"
      title="Name every institution in one place"
      description="Submit one shared packet naming up to five institutions. Passage does not create, validate, or determine the legal validity of a power of attorney -- it coordinates workflow and institutional review. Each institution still reviews and decides independently."
    >
      {message ? <div className={styles.alert} role="alert">{message}</div> : null}
      <StartSubmissionForm idempotencyKey={randomUUID()} />
    </AccountFrame>
  );
}
