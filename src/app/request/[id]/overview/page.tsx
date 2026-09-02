import Link from "next/link";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { HOSTED_ACTIONS } from "@/lib/authority/hosted-records";
import { getParticipantRequestContext } from "@/lib/authority/participant-session";
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
  ready_to_submit: "Ready for institution review",
  under_review: "Institution review in progress",
  information_requested: "More information requested",
  accepted: "Accepted by the institution",
  accepted_with_limits: "Accepted with limits",
  rejected: "Not accepted by the institution",
  revoked: "Revocation recorded",
  expired: "Request ended",
  declined: "Request declined",
};

const RECEIPT_STATUSES = new Set(["accepted", "accepted_with_limits", "rejected", "revoked", "expired"]);

const NOTICE_MESSAGES: Record<string, string> = {
  principal_confirm: "Your confirmation was saved. The representative can now review the request.",
  principal_confirm_delivery_pending: "Your confirmation was saved. Representative email delivery needs attention, and the institution can send a fresh link.",
  principal_decline: "Your decision was saved. This request is now closed.",
  representative_accept: "Your acceptance was saved. The required evidence steps are now available.",
  representative_decline: "Your decision was saved. This request is now closed.",
};

export default async function ParticipantOverviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { id } = await params;
  const { notice } = await searchParams;
  const context = await getParticipantRequestContext(id);

  if (!context) {
    return <AccountFrame eyebrow="Secure request" title="Your secure session is unavailable" description="Use the latest invitation from the institution to open this request.">
      <div className={styles.alert} role="alert">This session may have expired, been revoked, or belong to a different request.</div>
      <Link className={styles.secondary} href="/security">How Passage protects access</Link>
    </AccountFrame>;
  }

  const isPrincipal = context.participantRole === "principal";
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
    {canDecide ? <Link className={styles.primary} href={nextPath}>{isPrincipal ? "Review and decide" : "Review responsibilities"}</Link> : null}
    {context.status === "evidence_required" && !isPrincipal ? <div className={styles.summary}><h2>Next: complete the requirements</h2><p>Your responsibility decision is saved. Complete one clear requirement at a time and see why the institution needs it.</p><Link className={styles.primary} href={`/request/${encodeURIComponent(context.authorityRecordId)}/requirements`}>Continue to requirements</Link></div> : null}
    {RECEIPT_STATUSES.has(context.status) ? <div className={styles.summary}><h2>Institution decision receipt</h2><p>See the institution&apos;s outcome, accepted scope, limits, and current lifecycle status for this exact request.</p><Link className={styles.primary} href={`/request/${encodeURIComponent(context.authorityRecordId)}/receipt`}>View decision receipt</Link></div> : null}
    <p className={styles.legal}>Opening this page does not create or accept legal authority.</p>
  </AccountFrame>;
}
