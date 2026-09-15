import Link from "next/link";
import { randomUUID } from "node:crypto";
import { activateHostedAuthorityRequestAction, reissueParticipantInvitationAction } from "@/app/account-actions";
import { mayProvisionDemoRun } from "@/lib/authority/demo-boundary";
import { canRecordAuthorityDecision, canReviewAuthorityEvidence, requestCoordinatorRecoveryMessage } from "@/lib/authority/role-capabilities";
import { HOSTED_ACTIONS, hostedStatusLabel } from "@/lib/authority/hosted-records";
import { hostedDecisionLabel, mapHostedInstitutionDecision } from "@/lib/authority/hosted-decisions";
import { hostedRequestNoticeMessage } from "@/lib/authority/hosted-request-notice";
import { canReissueParticipantAccess, participantAccessPurpose } from "@/lib/authority/participant-resume";
import { requestNextStep } from "@/lib/authority/request-next-step";
import styles from "@/components/app/app-shell.module.css";
import { MultiInstitutionOriginBadge, MultiInstitutionOriginStripLine } from "@/components/app/MultiInstitutionOriginBadge";
import { CopyAccessLink } from "./CopyAccessLink";
import { HostedAuthorityRequestLower } from "./HostedAuthorityRequestLower";

type ViewProps = {
  access: any;
  notice?: string;
  error?: string;
  demo?: string;
  record: any;
  closedMessage: string | null;
  reviewFinished: boolean;
  events: any[];
  savedError: string | null;
  activatedCount: number;
  transactionLimit: number;
  periodEndsAt: string | null;
  evaluationLimitReached: boolean;
  canCoordinate: boolean;
  canActivate: boolean;
  nextCount: number;
  invitations: any[];
  notificationData: unknown;
  requirements: any[];
  evidenceArtifacts: any[];
  decisionRow: unknown;
  informationRequests: any[];
  informationResponses: any[];
  inviteAccessLinkFlash: { role: "principal" | "representative"; url: string } | null;
};

export function HostedAuthorityRequestView({
  access,
  notice,
  error: _error,
  demo,
  record,
  closedMessage,
  reviewFinished,
  events,
  savedError,
  activatedCount,
  transactionLimit,
  periodEndsAt,
  evaluationLimitReached,
  canCoordinate,
  canActivate,
  nextCount,
  invitations,
  notificationData,
  requirements,
  evidenceArtifacts,
  decisionRow,
  informationRequests,
  informationResponses,
  inviteAccessLinkFlash,
}: ViewProps) {
  const invitationStatusLabel = (status: unknown) => {
    const labels: Record<string, string> = {
      pending: "Invitation ready",
      accepted: "Secure access opened",
      revoked: "Access withdrawn",
      expired: "Invitation expired",
    };
    return labels[String(status)] ?? "Access updated";
  };
  const participantAccessDescription = record.status === "awaiting_principal"
    ? "The account holder goes first. The representative can continue after the account holder confirms."
    : record.status === "awaiting_representative"
      ? "The person granting authority confirmed. The representative can now review the request."
      : "Each person used separate access for their role. Their saved decisions appear in the activity below.";
  const activityDetail = (event: { eventType: string; detail: string }) => {
    if (event.eventType === "participant.access_established") return "The secure invitation was opened for this person and this request.";
    if (event.eventType === "authority.activated") return "Your trial started and one request was counted. The account holder’s link was prepared. The representative must wait for the account holder to confirm.";
    if (event.eventType === "participant.invitation_delivered") return "The email provider accepted the invitation. Final delivery confirmation is pending.";
    return event.detail;
  };
  const activitySummary = (event: { eventType: string; summary: string }) => {
    if (event.eventType === "participant.invitation_delivered") return "Email provider accepted invitation";
    return event.summary;
  };
  const notifications = Array.isArray(notificationData) ? notificationData as Array<{
    invitation_id: string;
    invitation_version: number;
    participant_role: "principal" | "representative";
    delivery_status: string;
    attempts: number;
  }> : [];
  const deliveryStatusLabel = (status: string | undefined) => {
    const labels: Record<string, string> = {
      pending: "Delivery pending",
      delivered: "Email reached the inbox (provider confirmed)",
      failed: "Delivery needs attention",
      canceled: "Held until prior step",
      retrying: "Delivery retry scheduled",
      processing: "Email accepted by the provider (not confirmed in the inbox yet)",
    };
    return status ? labels[status] ?? "Delivery updated" : "Delivery not started";
  };
  const activeDeliveryRole = record.status === "awaiting_principal"
    ? "principal"
    : record.status === "awaiting_representative"
      ? "representative"
      : null;
  const activeDeliveryStatus = activeDeliveryRole
    ? notifications.find((item) => item.participant_role === activeDeliveryRole)?.delivery_status
    : null;
  const savedNotice = hostedRequestNoticeMessage(notice, activeDeliveryStatus);
  const canReviewEvidence = Boolean(access.membership && canReviewAuthorityEvidence(access.membership.role));
  const isDemoRunView = demo === "1" && Boolean(
    access.membership && mayProvisionDemoRun(access.user.email, access.membership.role),
  );
  const canRecordDecision = Boolean(access.membership && canRecordAuthorityDecision(access.membership.role));
  const decision = decisionRow ? mapHostedInstitutionDecision(decisionRow as never) : null;
  const requirementsComplete = (requirements ?? []).length > 0 && (requirements ?? []).every((item) => item.status === "completed");
  const decisionReady = requirementsComplete && record.status === "under_review" && !decision;
  const requirementStatusLabel = (status: unknown) => {
    const labels: Record<string, string> = {
      not_started: "Not started",
      review_pending: "Review needed",
      completed: "Complete",
      needs_attention: "Needs attention",
    };
    return labels[String(status)] ?? "Updated";
  };
  const responseByRequest = new Map((informationResponses ?? []).map((item) => [String(item.information_request_id), item]));
  const openInformationRequest = (informationRequests ?? []).find((item) => !responseByRequest.has(String(item.id)));

  const nextStep = access.membership ? requestNextStep(record, access.membership.role) : null;
  const decisionSinceChanged = Boolean(decision) && (record.status === "revoked" || record.status === "expired");
  const stateHeadline = `${record.principalName} to ${record.representativeName}: ${hostedStatusLabel(record.status)}`;
  const stateDescription = closedMessage
    ? decisionSinceChanged && decision
      ? `${closedMessage} The institution originally recorded "${hostedDecisionLabel(decision.outcome)}." That original decision has not changed — only the request's current status has.`
      : closedMessage
    : nextStep?.detail ?? "";
  const primaryAction = record.status === "canceled"
    ? { href: `/app/requests/${record.id}/receipt`, label: "Open cancellation receipt" }
    : decision
      ? { href: `/app/requests/${record.id}/receipt`, label: "Open the decision receipt" }
      : closedMessage
        ? null
        : record.status === "draft" && canCoordinate
          ? { href: "#review-and-send", label: "Continue this draft" }
          : record.status === "under_review" && canRecordDecision
            ? requirementsComplete
              ? { href: "#institution-decision", label: "Record the institution decision" }
              : { href: "#required-information", label: "Review the required information" }
            : null;

  const lower = {
    access,
    record,
    closedMessage,
    reviewFinished,
    events,
    canCoordinate,
    canRecordDecision,
    canReviewEvidence,
    decision,
    decisionReady,
    decisionSinceChanged,
    requirements,
    evidenceArtifacts,
    informationRequests,
    informationResponses,
    openInformationRequest,
    responseByRequest,
    requirementStatusLabel,
    activityDetail,
    activitySummary,
  };

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>{record.referenceCode}</p><h1>{record.principalName} to {record.representativeName}</h1><p><strong>Covers:</strong> {record.accountBoundary}</p></div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <span className={styles.badge}>{hostedStatusLabel(record.status)}</span>
        {record.originGroupId ? <MultiInstitutionOriginBadge /> : null}
      </div>
    </header>
    {savedNotice && !closedMessage ? <div className={styles.notice} role="status">{savedNotice}</div> : null}
    {inviteAccessLinkFlash ? <CopyAccessLink recordId={record.id} role={inviteAccessLinkFlash.role} url={inviteAccessLinkFlash.url} /> : null}
    {isDemoRunView ? <div className={styles.notice}><strong>Your demo starts here.</strong> Check the test email addresses and requested actions below. Download the <a href="/samples/fictional-poa.pdf" download>fictional POA</a> and <a href="/samples/fictional-identity.pdf" download>fictional identity file</a> before sending.</div> : null}
    {savedError ? <div className={styles.alert} role="alert">{savedError}</div> : null}
    <section className={`${styles.panel} ${styles.progressPanel}`} aria-labelledby="request-next-step">
      <div className={styles.progressCopy}>
        <p className={styles.eyebrow}>Where this stands</p>
        <h2 id="request-next-step">{stateHeadline}</h2>
        <p>{stateDescription}</p>
      </div>
      {primaryAction ? <Link className={styles.primary} href={primaryAction.href}>{primaryAction.label}</Link> : null}
      {record.originGroupId ? <MultiInstitutionOriginStripLine /> : null}
    </section>
    <section className={`${styles.metricGrid} ${styles.compactMetrics}`} aria-label="Request status">
      <div className={styles.metric}><span>Current status</span><strong>{hostedStatusLabel(record.status)}</strong></div>
      <div className={styles.metric}><span>Evaluation usage</span><strong>{activatedCount} of {transactionLimit}</strong></div>
      <div className={styles.metric}><span>Request ends</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(record.validUntil))}</strong></div>
    </section>
    <div className={styles.grid} style={{ marginTop: 17 }}>
      <div>
        <details className={`${styles.panel} ${styles.disclosurePanel}`}>
          <summary>Contact details for both people</summary>
          <p>Each person receives a separate secure link. Names are shown at the top of this page.</p>
          <dl className={styles.policyFacts}>
            <div><dt>Person granting authority</dt><dd>{record.principalName}<br />{record.principalEmail}</dd></div>
            <div><dt>Representative</dt><dd>{record.representativeName}<br />{record.representativeEmail}</dd></div>
          </dl>
        </details>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Requested actions</h2><p>{reviewFinished ? "These are the actions that were requested. Any saved institution decision appears below." : "Your team will decide which of these actions to accept."}</p></div></div>
          <ul className={styles.checklist}>{record.allowedActionKeys.map((key: keyof typeof HOSTED_ACTIONS) => <li key={key}>{HOSTED_ACTIONS[key]}</li>)}</ul>
        </section>
      </div>
      <div>
        {record.status === "draft" ? <section className={styles.panel} id="review-and-send">
          <div className={styles.panelHead}><div><h2>Review and send</h2><p>This draft is saved. Nothing has been sent or counted yet.</p></div><span className={styles.badge}>Saved</span></div>
          <ul className={styles.checklist}>
            <li>{record.principalName} gets a private link to check the requested actions</li>
            <li>{record.representativeName} can continue after the account holder confirms</li>
            <li>{evaluationLimitReached ? "The free evaluation is complete. This draft stays saved and no invitation will be sent." : periodEndsAt ? `Sending uses request ${nextCount} of ${transactionLimit}; the evaluation ends ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(periodEndsAt))}` : `Sending starts the 10-day trial and uses request ${nextCount} of ${transactionLimit}`}</li>
          </ul>
          {canActivate ? <form action={activateHostedAuthorityRequestAction}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="expectedVersion" value={record.version} />
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <button className={styles.primary} type="submit">Send to the account holder</button>
          </form> : canCoordinate ? <Link className={styles.primary} href="/pilot">Review the 90-day pilot</Link> : <p className={styles.supportingCopy}>{requestCoordinatorRecoveryMessage}</p>}
        </section> : <details className={`${styles.panel} ${styles.disclosurePanel}`}>
          <summary>Participant access ({invitations?.length ?? 0} people)</summary>
          <p>{participantAccessDescription}</p>
          <ul className={styles.activity}>{(invitations ?? []).map((invitation) => {
            const notification = notifications.find((item) => item.invitation_id === String(invitation.id));
            const role = invitation.participant_role === "principal" ? "principal" : "representative";
            const canReissue = (canCoordinate || canReviewEvidence) && canReissueParticipantAccess(role, record.status);
            const accessPurpose = participantAccessPurpose(role, record.status);
            return <li key={String(invitation.id)}>
              <span>{role === "principal" ? "Person granting authority" : "Representative"}: {String(invitation.email_normalized)} ({invitationStatusLabel(invitation.status)}; {deliveryStatusLabel(notification?.delivery_status)})</span>
              {canReissue ? <form action={reissueParticipantInvitationAction}>
                <input type="hidden" name="recordId" value={record.id} />
                <input type="hidden" name="participantRole" value={role} />
                <input type="hidden" name="expectedRecordVersion" value={record.version} />
                <input type="hidden" name="expectedInvitationVersion" value={Number(invitation.version)} />
                <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                <button className={styles.secondary} type="submit">{accessPurpose === "receipt" ? "Send receipt link" : accessPurpose === "resume" ? "Send secure resume link" : "Send fresh link"}</button>
              </form> : null}
              {canReissue ? <span>Sending a fresh link turns every earlier link for this person off.</span> : null}
            </li>;
          })}</ul>
          <Link className={styles.secondary} href="/app">Return to request queue</Link>
        </details>}
        <HostedAuthorityRequestLower p={lower} />
      </div>
    </div>
  </>;
}
