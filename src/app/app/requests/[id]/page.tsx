import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { activateHostedAuthorityRequestAction, recordInstitutionDecisionAction, reissueParticipantInvitationAction, reviewEvidenceArtifactAction } from "@/app/account-actions";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { HOSTED_ACTIONS, hostedStatusLabel, mapHostedAuthorityEvent, mapHostedAuthorityRecord } from "@/lib/authority/hosted-records";
import { hostedDecisionLabel, mapHostedInstitutionDecision } from "@/lib/authority/hosted-decisions";
import { hostedRequestNoticeMessage, userErrorMessage } from "@/lib/authority/user-messages";
import { canReissueParticipantAccess, participantAccessPurpose } from "@/lib/authority/participant-resume";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function HostedAuthorityRequestPage({ params, searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.organization) return null;
  const { id } = await params;
  const { notice, error } = await searchParams;
  const supabase = await createClient();
  const [
    { data: recordRow, error: recordError },
    { data: eventRows, error: eventError },
    { data: entitlement, error: entitlementError },
    { data: invitations, error: invitationError },
    { data: notificationData, error: notificationError },
    { data: requirements, error: requirementError },
    { data: evidenceArtifacts, error: evidenceError },
    { data: decisionRow, error: decisionError },
  ] = await Promise.all([
    supabase.from("authority_records").select("id, reference_code, organization_id, created_by, version, status, template_key, template_version, purpose, account_boundary, principal_name, principal_email_normalized, representative_name, representative_email_normalized, allowed_action_keys, valid_until, activated_at, created_at, updated_at").eq("organization_id", access.organization.id).eq("id", id).maybeSingle(),
    supabase.from("authority_events").select("event_id, authority_record_id, sequence, event_type, summary, detail, occurred_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("sequence", { ascending: true }),
    supabase.from("organization_entitlements").select("status, transaction_limit, activated_count, period_started_at, period_ends_at, version").eq("organization_id", access.organization.id).maybeSingle(),
    supabase.from("authority_participant_invitations").select("id, participant_role, email_normalized, status, expires_at, version").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("participant_role", { ascending: true }),
    supabase.rpc("get_authority_notification_status_v1", { p_organization_id: access.organization.id, p_authority_record_id: id }),
    supabase.from("authority_requirements").select("id, requirement_key, title, reason, input_kind, status, ordinal, version, completed_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("ordinal", { ascending: true }),
    supabase.from("authority_evidence_artifacts").select("id, requirement_id, original_filename, media_type, byte_size, provider_status, review_status, reviewer_note, version, created_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("created_at", { ascending: false }),
    supabase.from("authority_institution_decisions").select("id, receipt_code, authority_record_id, record_version, outcome, reason, accepted_action_keys, limitations, decided_by, decided_by_role, decided_at, receipt_sha256, receipt_snapshot").eq("organization_id", access.organization.id).eq("authority_record_id", id).maybeSingle(),
  ]);
  if (recordError) throw recordError;
  if (eventError) throw eventError;
  if (entitlementError) throw entitlementError;
  if (invitationError) throw invitationError;
  if (notificationError && recordRow?.status !== "draft") throw notificationError;
  if (requirementError) throw requirementError;
  if (evidenceError) throw evidenceError;
  if (decisionError) throw decisionError;
  if (!recordRow) notFound();

  const record = mapHostedAuthorityRecord(recordRow as never);
  const events = (eventRows ?? []).map((row) => mapHostedAuthorityEvent(row as never));
  const savedError = userErrorMessage(error);
  const activatedCount = Number(entitlement?.activated_count ?? 0);
  const transactionLimit = Number(entitlement?.transaction_limit ?? 5);
  const periodEndsAt = entitlement?.period_ends_at ? String(entitlement.period_ends_at) : null;
  const evaluationLimitReached = activatedCount >= transactionLimit;
  const canActivate = !evaluationLimitReached;
  const nextCount = activatedCount + 1;
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
    ? "The person granting authority acts first. Representative access remains held until confirmation."
    : record.status === "awaiting_representative"
      ? "The person granting authority confirmed. The representative can now review the request."
      : "Each person used separate access for their role. Their saved decisions appear in the activity below.";
  const activityDetail = (event: { eventType: string; detail: string }) => {
    if (event.eventType === "participant.access_established") return "The secure invitation was opened for this person and this request.";
    if (event.eventType === "authority.activated") return "The evaluation started, one request was counted, and principal access was prepared. Representative access remained held.";
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
      delivered: "Email delivery confirmed",
      failed: "Delivery needs attention",
      canceled: "Held until prior step",
      retrying: "Delivery retry scheduled",
      processing: "Provider accepted; final delivery pending",
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
  const canReviewEvidence = ["owner", "admin", "reviewer"].includes(access.membership?.role ?? "");
  const canRecordDecision = ["owner", "admin", "reviewer"].includes(access.membership?.role ?? "");
  const decision = decisionRow ? mapHostedInstitutionDecision(decisionRow as never) : null;
  const requirementsComplete = (requirements ?? []).length > 0 && (requirements ?? []).every((item) => item.status === "completed");
  const decisionReady = requirementsComplete && ["ready_to_submit", "under_review"].includes(record.status) && !decision;
  const requirementStatusLabel = (status: unknown) => {
    const labels: Record<string, string> = {
      not_started: "Not started",
      review_pending: "Review needed",
      completed: "Complete",
      needs_attention: "Needs attention",
    };
    return labels[String(status)] ?? "Updated";
  };

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>{record.referenceCode}</p><h1>{record.principalName} to {record.representativeName}</h1><p>{record.accountBoundary}</p></div>
      <span className={styles.badge}>{hostedStatusLabel(record.status)}</span>
    </header>
    {savedNotice ? <div className={styles.notice} role="status">{savedNotice}</div> : null}
    {savedError ? <div className={styles.alert} role="alert">{savedError}</div> : null}
    <section className={styles.metricGrid} aria-label="Request status">
      <div className={styles.metric}><span>Current status</span><strong>{hostedStatusLabel(record.status)}</strong></div>
      <div className={styles.metric}><span>Evaluation usage</span><strong>{activatedCount} of {transactionLimit}</strong></div>
      <div className={styles.metric}><span>Request ends</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(record.validUntil))}</strong></div>
    </section>
    <div className={styles.grid} style={{ marginTop: 17 }}>
      <div>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>People</h2><p>These details prepare separate, role-specific access for each person.</p></div></div>
          <dl className={styles.policyFacts}>
            <div><dt>Person granting authority</dt><dd>{record.principalName}<br />{record.principalEmail}</dd></div>
            <div><dt>Representative</dt><dd>{record.representativeName}<br />{record.representativeEmail}</dd></div>
          </dl>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Permitted authority</h2><p>The institution will review only these requested actions.</p></div></div>
          <ul className={styles.checklist}>{record.allowedActionKeys.map((key) => <li key={key}>{HOSTED_ACTIONS[key]}</li>)}</ul>
        </section>
      </div>
      <div>
        {record.status === "draft" ? <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Review and activate</h2><p>This draft has not started the trial clock and has not consumed a transaction.</p></div><span className={styles.badge}>Saved</span></div>
          <ul className={styles.checklist}>
            <li>{record.principalName} receives a secure request to confirm the exact scope</li>
            <li>{record.representativeName}&apos;s separate access is prepared and held until the principal confirms</li>
            <li>{evaluationLimitReached ? "The free evaluation is complete. This draft stays saved and no invitation will be sent." : periodEndsAt ? `Activation uses request ${nextCount} of ${transactionLimit}; the evaluation ends ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(periodEndsAt))}` : `Activation starts the 10-day evaluation and uses request ${nextCount} of ${transactionLimit}`}</li>
          </ul>
          {canActivate ? <form action={activateHostedAuthorityRequestAction}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="expectedVersion" value={record.version} />
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <button className={styles.primary} type="submit">Activate and invite the principal</button>
          </form> : <Link className={styles.primary} href="/pilot">Review the 90-day pilot</Link>}
        </section> : <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Participant access</h2><p>{participantAccessDescription}</p></div><span className={styles.badge}>{invitations?.length ?? 0} role records</span></div>
          <ul className={styles.activity}>{(invitations ?? []).map((invitation) => {
            const notification = notifications.find((item) => item.invitation_id === String(invitation.id));
            const role = invitation.participant_role === "principal" ? "principal" : "representative";
            const canReissue = canReissueParticipantAccess(role, record.status);
            const accessPurpose = participantAccessPurpose(role, record.status);
            return <li key={String(invitation.id)}>
              <span>{role === "principal" ? "Person granting authority" : "Representative"}: {String(invitation.email_normalized)} ({invitationStatusLabel(invitation.status)}; {deliveryStatusLabel(notification?.delivery_status)})</span>
              {canReissue ? <form action={reissueParticipantInvitationAction}>
                <input type="hidden" name="recordId" value={record.id} />
                <input type="hidden" name="participantRole" value={role} />
                <input type="hidden" name="expectedRecordVersion" value={record.version} />
                <input type="hidden" name="expectedInvitationVersion" value={Number(invitation.version)} />
                <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                <button className={styles.secondary} type="submit">{accessPurpose === "receipt" ? "Send decision receipt" : accessPurpose === "resume" ? "Send secure resume link" : "Send fresh link"}</button>
              </form> : null}
            </li>;
          })}</ul>
          <Link className={styles.secondary} href="/app">Return to request queue</Link>
        </section>}
        {(requirements ?? []).length > 0 ? <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Requirements and evidence</h2><p>Source files, automated results, human review, and the institution decision remain separate.</p></div><span className={styles.badge}>{(requirements ?? []).filter((item) => item.status === "completed").length} of {(requirements ?? []).length} complete</span></div>
          <ul className={styles.activity}>{(requirements ?? []).map((requirement) => {
            const artifact = (evidenceArtifacts ?? []).find((item) => String(item.requirement_id) === String(requirement.id));
            return <li key={String(requirement.id)}>
              <div>
                <strong>{String(requirement.title)}</strong>
                <span>{String(requirement.reason)}</span>
                <span>Status: {requirementStatusLabel(requirement.status)}</span>
                {artifact ? <><span>Source: {String(artifact.original_filename)} · {Math.max(1, Math.round(Number(artifact.byte_size) / 1024))} KB</span><Link href={`/app/evidence/${encodeURIComponent(String(artifact.id))}`}>Open authorized source</Link></> : null}
                {artifact?.reviewer_note ? <span>Reviewer note: {String(artifact.reviewer_note)}</span> : null}
              </div>
              {artifact && artifact.review_status === "pending" && canReviewEvidence ? <div>
                <form action={reviewEvidenceArtifactAction}>
                  <input type="hidden" name="recordId" value={record.id} />
                  <input type="hidden" name="artifactId" value={String(artifact.id)} />
                  <input type="hidden" name="expectedRecordVersion" value={record.version} />
                  <input type="hidden" name="expectedArtifactVersion" value={Number(artifact.version)} />
                  <input type="hidden" name="outcome" value="accepted" />
                  <input type="hidden" name="note" value="" />
                  <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                  <button className={styles.primary} type="submit">Accept for this review</button>
                </form>
                <form action={reviewEvidenceArtifactAction} className={styles.field}>
                  <input type="hidden" name="recordId" value={record.id} />
                  <input type="hidden" name="artifactId" value={String(artifact.id)} />
                  <input type="hidden" name="expectedRecordVersion" value={record.version} />
                  <input type="hidden" name="expectedArtifactVersion" value={Number(artifact.version)} />
                  <input type="hidden" name="outcome" value="needs_attention" />
                  <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                  <label htmlFor={`note-${artifact.id}`}>What needs correction</label>
                  <input id={`note-${artifact.id}`} name="note" maxLength={500} required />
                  <button className={styles.secondary} type="submit">Request a correction</button>
                </form>
              </div> : null}
            </li>;
          })}</ul>
          <p>Accepting a source means it satisfies this institution review step. It does not establish universal legal validity.</p>
        </section> : null}
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Institution decision</h2><p>Record the institution&apos;s operational decision only after every required review step is complete.</p></div><span className={styles.badge}>{decision ? hostedDecisionLabel(decision.outcome) : decisionReady ? "Ready" : "Not ready"}</span></div>
          {decision ? <>
            <dl className={styles.policyFacts}>
              <div><dt>Outcome</dt><dd>{hostedDecisionLabel(decision.outcome)}</dd></div>
              <div><dt>Decision reason</dt><dd>{decision.reason}</dd></div>
              <div><dt>Receipt</dt><dd>{decision.receiptCode}</dd></div>
            </dl>
            <Link className={styles.primary} href={`/app/requests/${record.id}/receipt`}>Open decision receipt</Link>
          </> : decisionReady && canRecordDecision ? <form action={recordInstitutionDecisionAction} className={styles.field}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="expectedVersion" value={record.version} />
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <label htmlFor="decision-outcome">Institution outcome</label>
            <select id="decision-outcome" name="outcome" defaultValue="accepted_with_limits">
              <option value="accepted_with_limits">Accept with limits</option>
              <option value="accepted">Accept as submitted</option>
              <option value="rejected">Do not accept</option>
            </select>
            <label htmlFor="decision-reason">Decision reason</label>
            <textarea id="decision-reason" name="reason" minLength={3} maxLength={500} required placeholder="State the policy basis and review conclusion." />
            <label htmlFor="decision-limitations">Limits, one per line</label>
            <textarea id="decision-limitations" name="limitations" maxLength={2400} placeholder="Required only for an acceptance with limits." />
            <label className={styles.confirmation}><input type="checkbox" name="acknowledged" required /> <span>I confirm this is the institution&apos;s decision for this request and it should become part of the shared receipt.</span></label>
            <button className={styles.primary} type="submit">Record decision and issue receipt</button>
          </form> : <>
            <ul className={styles.checklist}>
              <li>{(requirements ?? []).filter((item) => item.status === "completed").length} of {(requirements ?? []).length || 3} required review steps are complete</li>
              <li>The requested actions and account boundary remain unchanged</li>
              <li>{canRecordDecision ? "The decision form opens automatically when the request is ready" : "An institution reviewer or administrator records the final outcome"}</li>
            </ul>
            <p>No outcome can be recorded while a source or certification still needs review.</p>
          </>}
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Activity</h2><p>Every material change is preserved in order.</p></div></div>
          <ul className={styles.activity}>{events.map((event) => <li key={event.eventId}><div><strong>{activitySummary(event)}</strong><span>{activityDetail(event)}</span></div><span>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(event.occurredAt))}</span></li>)}</ul>
        </section>
      </div>
    </div>
  </>;
}
