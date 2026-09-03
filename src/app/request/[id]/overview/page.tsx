import { randomUUID } from "node:crypto";
import Link from "next/link";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { respondToAuthorityInformationAction, submitAuthorityForReviewAction, withdrawAuthorityResponsibilityAction } from "@/app/participant-actions";
import { HOSTED_ACTIONS } from "@/lib/authority/hosted-records";
import { getParticipantInformationRequest, getParticipantRequestContext } from "@/lib/authority/participant-session";
import decisionStyles from "../participant-decision.module.css";

export const metadata = { robots: { index: false, follow: false } };

const PROHIBITED_ACTIONS: Record<string, string> = {
  move_money: "Move, withdraw, or transfer money",
  open_or_close_account: "Open or close an account",
  change_ownership: "Add or remove an account owner",
  change_beneficiaries: "Change beneficiaries",
  trade_investments: "Trade investments",
  borrow_money: "Borrow money or open credit",
  change_credentials: "Change credentials or take over digital access",
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_principal: "Waiting for your decision",
  awaiting_representative: "Waiting for the representative",
  evidence_required: "Requirements in progress",
  ready_to_submit: "Ready to send for institution review",
  under_review: "Institution review in progress",
  information_requested: "More information requested",
  accepted: "Accepted by the institution",
  accepted_with_limits: "Accepted with limits",
  rejected: "Not accepted by the institution",
  revoked: "Revocation recorded",
  expired: "Request ended",
  withdrawn: "Representative withdrew",
  declined: "Request declined",
};

const RECEIPT_STATUSES = new Set(["accepted", "accepted_with_limits", "rejected", "revoked", "expired"]);

const NOTICE_MESSAGES: Record<string, string> = {
  principal_confirm: "Your confirmation was saved. The representative can now review the request.",
  principal_confirm_delivery_pending: "Your confirmation was saved. Representative email delivery needs attention, and the institution can send a fresh link.",
  principal_decline: "Your decision was saved. This request is now closed.",
  representative_accept: "Your acceptance was saved. The required evidence steps are now available.",
  representative_decline: "Your decision was saved. This request is now closed.",
  information_response_saved: "Your response was saved. The institution can continue its review.",
  responsibility_withdrawn: "Your withdrawal was saved. The institution and the person granting authority will see that this request ended.",
  request_submitted: "Your disclosure acknowledgment and completed request were sent to the institution for review.",
};

const ERROR_MESSAGES: Record<string, string> = {
  information_response_required: "Add a clear response before sending it.",
  information_response_not_available: "That question has already been answered or changed. Refresh the request before trying again.",
  information_request_unavailable: "The institution's question is no longer available.",
  withdrawal_acknowledgment_required: "Confirm that you intend to withdraw from this responsibility.",
  withdrawal_reason_required: "Explain briefly why you can no longer serve.",
  withdrawal_not_available: "This responsibility can no longer be withdrawn from this page.",
  submission_acknowledgment_required: "Confirm what will be shared before sending the request.",
  submission_not_available: "This request is no longer ready to send. Review its current status.",
  submission_requirements_incomplete: "Complete every requirement before sending the request.",
  request_changed: "The request changed while this page was open. Review the latest status before trying again.",
  session_unavailable: "Your secure session is no longer available. Use the latest link from the institution.",
};

const WITHDRAWAL_STATUSES = new Set(["evidence_required", "ready_to_submit", "under_review", "information_requested", "accepted", "accepted_with_limits"]);

export default async function ParticipantOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const { notice, error } = await searchParams;
  const context = await getParticipantRequestContext(id);

  if (!context) {
    return <AccountFrame eyebrow="Secure request" title="Your secure session is unavailable" description="Use the latest invitation from the institution to open this request.">
      <div className={styles.alert} role="alert">This session may have expired, been revoked, or belong to a different request.</div>
      <Link className={styles.secondary} href="/security">How Passage protects access</Link>
    </AccountFrame>;
  }

  const isPrincipal = context.participantRole === "principal";
  const informationRequest = !isPrincipal && context.status === "information_requested"
    ? await getParticipantInformationRequest(id)
    : null;
  const canDecide = isPrincipal ? context.status === "awaiting_principal" : context.status === "awaiting_representative";
  const nextPath = `/request/${encodeURIComponent(context.authorityRecordId)}/${isPrincipal ? "grant" : "responsibility"}`;
  const description = isPrincipal
    ? context.status === "awaiting_principal"
      ? "Review the exact request before deciding whether to confirm it. Nothing is granted by opening this page."
      : "Your saved decision and the request's current status are shown below."
    : context.status === "awaiting_representative"
      ? "Review the requested role and limits before deciding whether to accept responsibility."
      : "Your saved responsibility decision and the request's current status are shown below.";
  return <AccountFrame
    eyebrow={`${context.institutionName} · ${context.referenceCode}`}
    title={`Welcome, ${context.participantName}`}
    description={description}
  >
    <div className={styles.summary}>
      <h2>{context.purpose}</h2>
      <p>{context.accountBoundary}</p>
    </div>
    <div className={styles.facts}>
      <div className={styles.fact}><span>Your role</span><strong>{isPrincipal ? "Person granting authority" : "Representative"}</strong></div>
      <div className={styles.fact}><span>Other person</span><strong>{context.otherPersonName}</strong></div>
      <div className={styles.fact}><span>Current status</span><strong>{STATUS_LABELS[context.status] ?? "Request updated"}</strong></div>
      <div className={styles.fact}><span>Request ends</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(context.validUntil))}</strong></div>
    </div>
    <p className={styles.legend}>Requested actions</p>
    <ul className={styles.scope}>{context.allowedActionKeys.map((key) => <li key={key}>{HOSTED_ACTIONS[key as keyof typeof HOSTED_ACTIONS] ?? key}</li>)}</ul>
    <p className={styles.legend}>Not included</p>
    <ul className={decisionStyles.prohibited}>{context.prohibitedActionKeys.map((key) => <li key={key}>{PROHIBITED_ACTIONS[key] ?? key}</li>)}</ul>
    <div className={styles.notice} role="status">{notice && NOTICE_MESSAGES[notice] ? NOTICE_MESSAGES[notice] : "Opening secure access was saved. Your authority decision has not changed."}</div>
    {error ? <div className={styles.alert} role="alert">{ERROR_MESSAGES[error] ?? "We could not save that change. Review the latest request and try again."}</div> : null}
    {canDecide ? <Link className={styles.primary} href={nextPath}>{isPrincipal ? "Review and decide" : "Review responsibilities"}</Link> : null}
    {context.status === "evidence_required" && !isPrincipal ? <div className={styles.summary}><h2>Next: complete the requirements</h2><p>Your responsibility decision is saved. Complete one clear requirement at a time and see why the institution needs it.</p><Link className={styles.primary} href={`/request/${encodeURIComponent(context.authorityRecordId)}/requirements`}>Continue to requirements</Link></div> : null}
    {context.status === "ready_to_submit" && !isPrincipal ? <div className={styles.summary}>
      <h2>Review and send to the institution</h2>
      <p>The institution will receive the participant names, requested scope, account boundary, policy-requirement results, source-file metadata, and your certification. Passage saves this disclosure acknowledgment with the request.</p>
      <form action={submitAuthorityForReviewAction} className={styles.field}>
        <input type="hidden" name="recordId" value={context.authorityRecordId} />
        <input type="hidden" name="expectedVersion" value={context.recordVersion} />
        <input type="hidden" name="idempotencyKey" value={randomUUID()} />
        <label><input type="checkbox" name="acknowledged" required /> I reviewed what will be shared and authorize sending this completed request to {context.institutionName} for its decision.</label>
        <button className={styles.primary} type="submit">Send to institution review</button>
      </form>
      <p className={styles.legal}>Sending does not guarantee acceptance. The institution keeps the final decision.</p>
    </div> : null}
    {informationRequest ? <div className={styles.summary}>
      <h2>The institution needs one clarification</h2>
      <p>{informationRequest.message}</p>
      <form action={respondToAuthorityInformationAction} className={styles.field}>
        <input type="hidden" name="recordId" value={context.authorityRecordId} />
        <input type="hidden" name="expectedVersion" value={context.recordVersion} />
        <input type="hidden" name="idempotencyKey" value={randomUUID()} />
        <label htmlFor="response">Your response</label>
        <textarea id="response" name="response" required minLength={3} maxLength={2000} rows={4} placeholder="Explain what you confirmed or added." />
        <button className={styles.primary} type="submit">Send response</button>
      </form>
      <p className={styles.legal}>Your response is saved with this request and can be seen by the institution reviewing it.</p>
    </div> : null}
    {!isPrincipal && WITHDRAWAL_STATUSES.has(context.status) ? <details className={styles.summary}>
      <summary>Can no longer serve as representative?</summary>
      <p>You can end your participation in this request. This does not delete the record already saved.</p>
      <form action={withdrawAuthorityResponsibilityAction} className={styles.field}>
        <input type="hidden" name="recordId" value={context.authorityRecordId} />
        <input type="hidden" name="expectedVersion" value={context.recordVersion} />
        <input type="hidden" name="idempotencyKey" value={randomUUID()} />
        <label htmlFor="withdrawal-reason">Reason</label>
        <textarea id="withdrawal-reason" name="reason" required minLength={3} maxLength={1000} rows={3} placeholder="Explain briefly why you can no longer serve." />
        <label><input type="checkbox" name="acknowledged" required /> I understand this ends my participation in this request.</label>
        <button className={styles.secondary} type="submit">Withdraw from responsibility</button>
      </form>
    </details> : null}
    {RECEIPT_STATUSES.has(context.status) ? <div className={styles.summary}><h2>Institution decision receipt</h2><p>See the institution&apos;s outcome, accepted scope, limits, and current lifecycle status for this exact request.</p><Link className={styles.primary} href={`/request/${encodeURIComponent(context.authorityRecordId)}/receipt`}>View decision receipt</Link></div> : null}
    <p className={styles.legal}>Opening this page does not create or accept legal authority.</p>
  </AccountFrame>;
}
