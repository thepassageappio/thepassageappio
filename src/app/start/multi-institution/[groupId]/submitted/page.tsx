import Link from "next/link";
import { getRequesterSessionContextAction } from "@/app/multi-institution-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { MULTI_INSTITUTION_CASE_INDEPENDENCE_NOTICE, PASSAGE_AUTHORITY_BOUNDARY_NOTICE } from "@/lib/authority/multi-institution-submission";
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
        <div className={styles.alert} role="alert">Your secure session could not be opened.</div>
      </AccountFrame>
    );
  }

  const matched = context.targets.filter((target) => target.matchStatus === "matched");
  const unmatched = context.targets.filter((target) => target.matchStatus !== "matched");

  return (
    <AccountFrame
      eyebrow={`Reference ${context.referenceCode}`}
      title="Your request was sent"
      description={MULTI_INSTITUTION_CASE_INDEPENDENCE_NOTICE}
    >
      {copyIssues === "1" ? (
        <div className={styles.notice} role="status">One or more evidence copies need attention on our end. Your submission is saved; this does not require any action from you.</div>
      ) : null}
      <div className={styles.summary}>
        <h2>{matched.length} case{matched.length === 1 ? "" : "s"} opened</h2>
        <p>{PASSAGE_AUTHORITY_BOUNDARY_NOTICE}</p>
      </div>
      <ul className={wizardStyles.targetList}>
        {matched.map((target) => (
          <li key={target.id} className={wizardStyles.targetRow}>
            <div><strong>{target.targetLabel}</strong><span className={wizardStyles.badgeMatched}>Case opened, awaiting the account holder and representative</span></div>
          </li>
        ))}
        {unmatched.map((target) => (
          <li key={target.id} className={wizardStyles.targetRow}>
            <div><strong>{target.targetLabel}</strong><span className={wizardStyles.badgePending}>Not yet a Passage institution &mdash; we&rsquo;ll reach out</span></div>
          </li>
        ))}
      </ul>
      <Link className={styles.secondary} href="/">Return to website</Link>
    </AccountFrame>
  );
}
