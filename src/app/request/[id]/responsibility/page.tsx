import { randomUUID } from "node:crypto";
import Link from "next/link";
import { submitParticipantDecisionAction } from "@/app/participant-actions";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { HOSTED_ACTIONS } from "@/lib/authority/hosted-records";
import { getParticipantRequestContext } from "@/lib/authority/participant-session";
import decisionStyles from "../participant-decision.module.css";

export const metadata = { robots: { index: false, follow: false } };

const ERROR_MESSAGES: Record<string, string> = {
  session_unavailable: "Your secure session is no longer available. Ask the institution for a new invitation.",
  request_changed: "The request changed before your decision was saved. Review the current details and try again.",
  acknowledgment_required: "Confirm that you understand the responsibility and limits before continuing.",
  decline_reason_required: "Explain why you are declining this responsibility.",
  decision_not_allowed: "This decision is no longer available because the request has moved forward.",
  decision_invalid: "We could not save that decision. Nothing was changed.",
};

export default async function RepresentativeResponsibilityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const context = await getParticipantRequestContext(id);

  if (!context || context.participantRole !== "representative") {
    return <AccountFrame eyebrow="Secure request" title="This decision is unavailable" description="Use the latest invitation from the institution to open the request.">
      <div className={styles.alert} role="alert">Your secure access is missing, expired, or belongs to a different role.</div>
      <Link className={styles.secondary} href="/security">How Passage protects access</Link>
    </AccountFrame>;
  }

  if (context.status !== "awaiting_representative") {
    return <AccountFrame eyebrow={`${context.institutionName} · ${context.referenceCode}`} title="Your decision is already recorded" description="The request has moved forward or closed.">
      <Link className={styles.primary} href={`/request/${encodeURIComponent(id)}/overview`}>View current request</Link>
    </AccountFrame>;
  }

  return <AccountFrame
    eyebrow={`${context.institutionName} · ${context.referenceCode}`}
    title="Accept or decline the responsibility"
    description={`${context.otherPersonName} confirmed this limited request. Review the duties and boundaries before choosing.`}
    step="Your decision"
  >
    {error ? <div className={styles.alert} role="alert">{ERROR_MESSAGES[error] ?? "We could not save that decision. Nothing was changed."}</div> : null}
    <div className={styles.summary}><h2>{context.purpose}</h2><p>{context.accountBoundary}</p></div>
    <p className={styles.legend}>You may request only</p>
    <ul className={styles.scope}>{context.allowedActionKeys.map((key) => <li key={key}>{HOSTED_ACTIONS[key as keyof typeof HOSTED_ACTIONS] ?? key}</li>)}</ul>
    <div className={styles.rule}>You do not receive ownership, unrestricted account access, or permission to act outside this request. The institution decides what it will recognize.</div>
    <form action={submitParticipantDecisionAction} className={styles.form}>
      <input type="hidden" name="recordId" value={context.authorityRecordId} />
      <input type="hidden" name="expectedVersion" value={context.recordVersion} />
      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
      <input type="hidden" name="decision" value="representative_accept" />
      <label className={styles.check}>
        <input type="checkbox" name="acknowledged" required />
        <span>I understand the permitted actions, prohibitions, end date, and responsibility to act only for {context.otherPersonName} within this request.</span>
      </label>
      <button className={styles.primary} type="submit">Accept responsibility</button>
      <p className={styles.legal}>Passage saves your choice and the exact acknowledgment version. Accepting does not transfer account ownership or guarantee institution acceptance.</p>
    </form>
    <details className={decisionStyles.reviewOption}>
      <summary>I cannot take this responsibility</summary>
      <form action={submitParticipantDecisionAction} className={styles.form}>
        <input type="hidden" name="recordId" value={context.authorityRecordId} />
        <input type="hidden" name="expectedVersion" value={context.recordVersion} />
        <input type="hidden" name="idempotencyKey" value={randomUUID()} />
        <input type="hidden" name="decision" value="representative_decline" />
        <label className={decisionStyles.decisionField}>Reason<textarea name="reason" required minLength={3} maxLength={500} placeholder="Explain why you cannot take this responsibility." /></label>
        <label className={styles.check}>
          <input type="checkbox" name="acknowledged" required />
          <span>I understand this closes the request and notifies the person granting authority and the institution.</span>
        </label>
        <button className={styles.secondary} type="submit">Decline responsibility</button>
      </form>
    </details>
  </AccountFrame>;
}
