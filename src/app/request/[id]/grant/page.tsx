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
  acknowledgment_required: "Confirm that you understand the scope and limits before continuing.",
  decline_reason_required: "Explain why you are declining this request.",
  decision_not_allowed: "This decision is no longer available because the request has moved forward.",
  decision_invalid: "We could not save that decision. Nothing was changed.",
};

export default async function PrincipalGrantPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const context = await getParticipantRequestContext(id);

  if (!context || context.participantRole !== "principal") {
    return <AccountFrame eyebrow="Secure request" title="This decision is unavailable" description="Use the latest invitation from the institution to open the request.">
      <div className={styles.alert} role="alert">Your secure access is missing, expired, or belongs to a different role.</div>
      <Link className={styles.secondary} href="/security">How Passage protects access</Link>
    </AccountFrame>;
  }

  if (context.status !== "awaiting_principal") {
    return <AccountFrame eyebrow={`${context.institutionName} · ${context.referenceCode}`} title="Your decision is already recorded" description="The request has moved forward or closed.">
      <Link className={styles.primary} href={`/request/${encodeURIComponent(id)}/overview`}>View current request</Link>
    </AccountFrame>;
  }

  return <AccountFrame
    eyebrow={`${context.institutionName} · ${context.referenceCode}`}
    title="Confirm or decline this request"
    description={`Review exactly what ${context.otherPersonName} may ask the institution to recognize. The institution still makes the final decision.`}
    step="Your decision"
  >
    {error ? <div className={styles.alert} role="alert">{ERROR_MESSAGES[error] ?? "We could not save that decision. Nothing was changed."}</div> : null}
    <div className={styles.summary}><h2>{context.purpose}</h2><p>{context.accountBoundary}</p></div>
    <p className={styles.legend}>Requested actions</p>
    <ul className={styles.scope}>{context.allowedActionKeys.map((key) => <li key={key}>{HOSTED_ACTIONS[key as keyof typeof HOSTED_ACTIONS] ?? key}</li>)}</ul>
    <div className={styles.rule}>This request does not permit money movement, account ownership changes, beneficiary changes, investing, borrowing, or credential changes.</div>
    <form action={submitParticipantDecisionAction} className={styles.form}>
      <input type="hidden" name="recordId" value={context.authorityRecordId} />
      <input type="hidden" name="expectedVersion" value={context.recordVersion} />
      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
      <input type="hidden" name="decision" value="principal_confirm" />
      <label className={styles.check}>
        <input type="checkbox" name="acknowledged" required />
        <span>I understand the exact permitted and prohibited actions, the account boundary, and the request end date.</span>
      </label>
      <button className={styles.primary} type="submit">Confirm and continue to {context.otherPersonName}</button>
      <p className={styles.legal}>Passage saves your decision, the wording you confirmed, the scope, and the time. Confirmation does not guarantee institution acceptance.</p>
    </form>
    <details className={decisionStyles.reviewOption}>
      <summary>I do not approve this request</summary>
      <form action={submitParticipantDecisionAction} className={styles.form}>
        <input type="hidden" name="recordId" value={context.authorityRecordId} />
        <input type="hidden" name="expectedVersion" value={context.recordVersion} />
        <input type="hidden" name="idempotencyKey" value={randomUUID()} />
        <input type="hidden" name="decision" value="principal_decline" />
        <label className={decisionStyles.decisionField}>Reason<textarea name="reason" required minLength={3} maxLength={500} placeholder="Explain why this request should stop." /></label>
        <label className={styles.check}>
          <input type="checkbox" name="acknowledged" required />
          <span>I understand this closes the request and the representative will not be able to continue.</span>
        </label>
        <button className={styles.secondary} type="submit">Decline and close request</button>
      </form>
    </details>
  </AccountFrame>;
}
