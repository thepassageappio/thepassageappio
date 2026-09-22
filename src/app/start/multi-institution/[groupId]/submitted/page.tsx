import Link from "next/link";
import { getRequesterSessionContextAction, getSubmissionDeliveryStatusAction, retrySubmissionDeliveryAction } from "@/app/multi-institution-actions";
import { submissionDeliveryMessage } from "@/lib/authority/submission-delivery";
import { redirect } from "next/navigation";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { PASSAGE_AUTHORITY_BOUNDARY_NOTICE } from "@/lib/authority/multi-institution-submission";
import wizardStyles from "../../multi-institution.module.css";

export const metadata = { robots: { index: false, follow: false } };
export const maxDuration = 60;

type Props = {
  params: Promise<{ groupId: string }>;
};

export default async function MultiInstitutionSubmittedPage({ params }: Props) {
  const { groupId } = await params;
  const { context } = await getRequesterSessionContextAction(groupId);

  if (!context) {
    return (
      <AccountFrame eyebrow="Secure request" title="This session is no longer active" description="Use the confirmation link from your email again to check your request status.">
        <div className={styles.alert} role="alert">Your secure session could not be opened. Start a new request if you need a fresh link.</div>
      </AccountFrame>
    );
  }

  if (context.status !== "fanned_out") redirect(`/start/multi-institution/${groupId}`);
  const delivery = await getSubmissionDeliveryStatusAction(groupId);
  const deliveryComplete = Boolean(delivery && delivery.total > 0 && delivery.completed === delivery.total);
  const matched = context.targets.filter((target) => target.matchStatus === "matched");
  const unmatched = context.targets.filter((target) => target.matchStatus !== "matched");

  return (
    <AccountFrame
      eyebrow={`Reference ${context.referenceCode}`}
      title="Request saved"
      description="Each bank gets its own request. Each bank answers on its own."
    >
      <div className={styles.notice} role="status">{matched.length === 0 ? "None of these banks is on Passage yet. No bank request or participant invitation was sent." : submissionDeliveryMessage(delivery)}</div>
      {delivery && delivery.pending > 0 ? <form action={retrySubmissionDeliveryAction}>
        <input type="hidden" name="groupId" value={groupId} />
        <p>Retrying continues this request. It does not create another one. If a recent attempt failed, wait a few minutes before retrying.</p>
        <button className={styles.primary} type="submit">Retry remaining steps</button>
      </form> : null}
      <div className={styles.summary}>
        <h2>Banks on your request</h2>
        <p>{PASSAGE_AUTHORITY_BOUNDARY_NOTICE}</p>
      </div>
      <ul className={wizardStyles.targetList}>
        {matched.map((target) => (
          <li key={target.id} className={wizardStyles.targetRow}>
            <div><strong>{target.targetLabel}</strong><span className={wizardStyles.badgeMatched}>{deliveryComplete ? "Waiting on the account holder and representative" : "Request saved. Check delivery status above."}</span></div>
          </li>
        ))}
        {unmatched.map((target) => (
          <li key={target.id} className={wizardStyles.targetRow}>
            <div>
              <strong>{target.targetLabel}</strong>
              <span className={wizardStyles.badgePending}>
                Not on Passage yet. We saved the name. No request was sent to this bank.
              </span>
            </div>
          </li>
        ))}
      </ul>
      <Link className={styles.secondary} href="/">Return to website</Link>
    </AccountFrame>
  );
}
