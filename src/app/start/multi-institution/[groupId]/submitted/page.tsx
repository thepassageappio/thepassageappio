import Link from "next/link";
import { getRequesterSessionContextAction } from "@/app/multi-institution-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { PASSAGE_AUTHORITY_BOUNDARY_NOTICE } from "@/lib/authority/multi-institution-submission";
import wizardStyles from "../../multi-institution.module.css";

export const metadata = { robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ copyIssues?: string }>;
};

export default async function MultiInstitutionSubmittedPage({ params, searchParams }: Props) {
  const { groupId } = await params;
  const { context } = await getRequesterSessionContextAction(groupId);
  const { copyIssues } = await searchParams;

  if (!context) {
    return (
      <AccountFrame eyebrow="Secure request" title="This session is no longer active" description="Use the confirmation link from your email again to check your request status.">
        <div className={styles.alert} role="alert">Your secure session could not be opened. Start a new request if you need a fresh link.</div>
      </AccountFrame>
    );
  }

  const matched = context.targets.filter((target) => target.matchStatus === "matched");
  const unmatched = context.targets.filter((target) => target.matchStatus !== "matched");

  return (
    <AccountFrame
      eyebrow={`Reference ${context.referenceCode}`}
      title="Sent"
      description="Each bank gets its own request. Each bank answers on its own."
    >
      {copyIssues === "1" ? (
        <div className={styles.notice} role="status">We are still finishing a file step on our side. Your request is saved. You do not need to do anything.</div>
      ) : null}
      <div className={styles.summary}>
        <h2>What we sent</h2>
        <p>{PASSAGE_AUTHORITY_BOUNDARY_NOTICE}</p>
      </div>
      <ul className={wizardStyles.targetList}>
        {matched.map((target) => (
          <li key={target.id} className={wizardStyles.targetRow}>
            <div><strong>{target.targetLabel}</strong><span className={wizardStyles.badgeMatched}>Waiting on the account holder and representative</span></div>
          </li>
        ))}
        {unmatched.map((target) => (
          <li key={target.id} className={wizardStyles.targetRow}>
            <div>
              <strong>{target.targetLabel}</strong>
              <span className={wizardStyles.badgePending}>
                Not on Passage yet. We can still note them. A bank on Passage can open a request when they join.
              </span>
            </div>
          </li>
        ))}
      </ul>
      <Link className={styles.secondary} href="/">Return to website</Link>
    </AccountFrame>
  );
}
