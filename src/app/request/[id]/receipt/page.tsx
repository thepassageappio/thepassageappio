import Link from "next/link";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { hostedDecisionLabel } from "@/lib/authority/hosted-decisions";
import { HOSTED_ACTIONS, hostedStatusLabel } from "@/lib/authority/hosted-records";
import { getParticipantDecisionReceipt } from "@/lib/authority/participant-session";

export const metadata = { robots: { index: false, follow: false } };

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default async function ParticipantDecisionReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receipt = await getParticipantDecisionReceipt(id);

  if (!receipt) {
    return <AccountFrame eyebrow="Decision receipt" title="Your secure receipt is unavailable" description="Use the latest receipt invitation from the institution to open this decision.">
      <div className={styles.alert} role="alert">This session may have expired, been revoked, or belong to a different request.</div>
      <Link className={styles.secondary} href="/security">How Passage protects access</Link>
    </AccountFrame>;
  }

  const roleLabel = receipt.participantRole === "principal" ? "Person granting authority" : "Representative";
  return <AccountFrame
    eyebrow={`${receipt.institutionName} · ${receipt.referenceCode}`}
    title={hostedDecisionLabel(receipt.outcome)}
    description="This is the institution's recorded outcome for the exact request shown below."
  >
    <div className={styles.summary}>
      <h2>Institution decision</h2>
      <p>{receipt.reason}</p>
    </div>
    <div className={styles.facts}>
      <div className={styles.fact}><span>Current status</span><strong>{hostedStatusLabel(receipt.currentStatus)}</strong></div>
      <div className={styles.fact}><span>Decision recorded</span><strong>{dateTime(receipt.decidedAt)}</strong></div>
      <div className={styles.fact}><span>Your role</span><strong>{roleLabel}</strong></div>
      <div className={styles.fact}><span>Request ends</span><strong>{dateTime(receipt.validUntil)}</strong></div>
    </div>

    <p className={styles.legend}>Accepted scope</p>
    {receipt.acceptedActionKeys.length
      ? <ul className={styles.scope}>{receipt.acceptedActionKeys.map((key) => <li key={key}>{HOSTED_ACTIONS[key]}</li>)}</ul>
      : <div className={styles.notice}>No requested action was accepted.</div>}
    {receipt.limitations.length ? <><p className={styles.legend}>Recorded limits</p><ul className={styles.scope}>{receipt.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul></> : null}

    <div className={styles.summary}>
      <h2>Request boundary</h2>
      <p><strong>{receipt.participantName}</strong> is viewing this receipt as the {roleLabel.toLowerCase()}. The other named person is <strong>{receipt.otherPersonName}</strong>.</p>
      <p>{receipt.purpose}</p>
      <p>{receipt.accountBoundary}</p>
    </div>

    <div className={styles.summary}>
      <h2>Changes after the decision</h2>
      <p>{receipt.lifecycleSummary ?? "Nothing has changed since the institution recorded its decision."}</p>
      {receipt.lifecycleReason ? <p>{receipt.lifecycleReason}</p> : null}
      {receipt.lifecycleEffectiveAt ? <p>Effective {dateTime(receipt.lifecycleEffectiveAt)}</p> : null}
    </div>

    <details className={styles.summary}>
      <summary>Receipt verification details</summary>
      <p>Receipt {receipt.receiptCode}. Decision record {receipt.decisionVersion}; current record {receipt.currentVersion}.</p>
      <p style={{ overflowWrap: "anywhere" }}>{receipt.receiptSha256}</p>
    </details>

    <div className={styles.notice} role="note">The institution made this decision under its own rules. Passage saved the request, supporting information, decision, and later changes. Passage did not create legal authority or provide a legal opinion.</div>
    <Link className={styles.secondary} href={`/request/${encodeURIComponent(id)}/overview`}>Return to request summary</Link>
  </AccountFrame>;
}
