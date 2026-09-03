import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { recordAuthorityLifecycleAction, reissueParticipantInvitationAction } from "@/app/account-actions";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import { hostedDecisionLabel, mapHostedInstitutionDecision } from "@/lib/authority/hosted-decisions";
import { HOSTED_ACTIONS, hostedStatusLabel, mapHostedAuthorityEvent, mapHostedAuthorityRecord } from "@/lib/authority/hosted-records";
import { userErrorMessage, userNoticeMessage } from "@/lib/authority/user-messages";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/app/app-shell.module.css";
import receiptStyles from "./receipt.module.css";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default async function HostedDecisionReceiptPage({ params, searchParams }: Props) {
  const access = await getAuthorityAccessContext();
  if (!access?.organization) return null;
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [
    { data: recordRow, error: recordError },
    { data: decisionRow, error: decisionError },
    { data: eventRows, error: eventError },
    { data: invitationRows, error: invitationError },
  ] = await Promise.all([
    supabase.from("authority_records").select("id, reference_code, organization_id, created_by, version, status, template_key, template_version, purpose, account_boundary, principal_name, principal_email_normalized, representative_name, representative_email_normalized, allowed_action_keys, valid_until, activated_at, created_at, updated_at").eq("organization_id", access.organization.id).eq("id", id).maybeSingle(),
    supabase.from("authority_institution_decisions").select("id, receipt_code, authority_record_id, record_version, outcome, reason, accepted_action_keys, limitations, decided_by, decided_by_role, decided_at, receipt_sha256, receipt_snapshot").eq("organization_id", access.organization.id).eq("authority_record_id", id).maybeSingle(),
    supabase.from("authority_events").select("event_id, authority_record_id, sequence, event_type, summary, detail, occurred_at").eq("organization_id", access.organization.id).eq("authority_record_id", id).order("sequence", { ascending: true }),
    supabase.from("authority_participant_invitations").select("participant_role, version").eq("organization_id", access.organization.id).eq("authority_record_id", id),
  ]);
  if (recordError) throw recordError;
  if (decisionError) throw decisionError;
  if (eventError) throw eventError;
  if (invitationError) throw invitationError;
  if (!recordRow || !decisionRow) notFound();

  const record = mapHostedAuthorityRecord(recordRow as never);
  const decision = mapHostedInstitutionDecision(decisionRow as never);
  const events = (eventRows ?? []).map((row) => mapHostedAuthorityEvent(row as never));
  const lifecycleEvent = events.slice().reverse().find((event) => event.eventType === "authority.revocation_recorded" || event.eventType === "authority.expiration_recorded");
  const canChangeLifecycle = ["owner", "admin", "reviewer"].includes(access.membership?.role ?? "") && ["accepted", "accepted_with_limits"].includes(record.status);
  const canExpire = canChangeLifecycle && new Date(record.validUntil) <= new Date();
  const canSendReceipts = ["owner", "admin", "reviewer"].includes(access.membership?.role ?? "");
  const roleLabels: Record<string, string> = { owner: "Institution owner", admin: "Institution administrator", reviewer: "Institution reviewer" };
  const notice = userNoticeMessage(query.notice);
  const error = userErrorMessage(query.error);

  return <>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>Decision receipt {decision.receiptCode}</p><h1>{hostedDecisionLabel(decision.outcome)}</h1><p>{record.principalName} to {record.representativeName} for {record.accountBoundary}</p></div>
      <span className={styles.badge}>{hostedStatusLabel(record.status)}</span>
    </header>
    {notice ? <div className={styles.notice} role="status">{notice}</div> : null}
    {error ? <div className={styles.alert} role="alert">{error}</div> : null}
    <section className={styles.metricGrid} aria-label="Receipt status">
      <div className={styles.metric}><span>Current status</span><strong>{hostedStatusLabel(record.status)}</strong></div>
      <div className={styles.metric}><span>Decision recorded</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(decision.decidedAt))}</strong></div>
      <div className={styles.metric}><span>Request ends</span><strong>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(record.validUntil))}</strong></div>
    </section>

    <div className={styles.grid} style={{ marginTop: 17 }}>
      <div>
        {canSendReceipts ? <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Participant receipt links</h2><p>Each person receives separate access to this same saved decision.</p></div></div>
          <div className={styles.panelActions}>
            {(["principal", "representative"] as const).map((participantRole) => {
              const invitation = invitationRows?.find((item) => item.participant_role === participantRole);
              if (!invitation) return null;
              const participantName = participantRole === "principal" ? record.principalName : record.representativeName;
              return <form action={reissueParticipantInvitationAction} key={participantRole}>
                <input type="hidden" name="recordId" value={record.id} />
                <input type="hidden" name="participantRole" value={participantRole} />
                <input type="hidden" name="expectedRecordVersion" value={record.version} />
                <input type="hidden" name="expectedInvitationVersion" value={Number(invitation.version)} />
                <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                <button className={styles.secondary} type="submit">Send fresh receipt link to {participantName}</button>
              </form>;
            })}
          </div>
          <p className={styles.supportingCopy}>A fresh link ends that person&apos;s prior session without changing the saved decision.</p>
        </section> : null}

        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Institution decision</h2><p>This is the saved outcome for this request.</p></div><span className={styles.badge}>{hostedDecisionLabel(decision.outcome)}</span></div>
          <p className={receiptStyles.reason}>{decision.reason}</p>
          <dl className={styles.policyFacts}>
            <div><dt>Institution</dt><dd>{access.organization.displayName}</dd></div>
            <div><dt>Recorded by</dt><dd>{roleLabels[decision.decidedByRole] ?? "Authorized institution reviewer"}</dd></div>
            <div><dt>Recorded at</dt><dd>{dateTime(decision.decidedAt)}</dd></div>
            <div><dt>Workflow</dt><dd>New York financial power of attorney</dd></div>
          </dl>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Accepted scope</h2><p>Only the actions listed below are included in this institution decision.</p></div></div>
          {decision.acceptedActionKeys.length ? <ul className={styles.checklist}>{decision.acceptedActionKeys.map((key) => <li key={key}>{HOSTED_ACTIONS[key]}</li>)}</ul> : <p>No requested action was accepted.</p>}
          {decision.limitations.length ? <div className={receiptStyles.limits}><h3>Recorded limits</h3><ul>{decision.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul></div> : null}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Request boundary</h2><p>The receipt remains tied to this person, representative, account relationship, purpose, and end date.</p></div></div>
          <dl className={styles.policyFacts}>
            <div><dt>Person granting authority</dt><dd>{record.principalName}</dd></div>
            <div><dt>Representative</dt><dd>{record.representativeName}</dd></div>
            <div><dt>Purpose</dt><dd>{record.purpose}</dd></div>
            <div><dt>Account relationship</dt><dd>{record.accountBoundary}</dd></div>
            <div><dt>End date</dt><dd>{dateTime(record.validUntil)}</dd></div>
          </dl>
        </section>

        <section className={receiptStyles.boundary}>
          <strong>What this receipt means</strong>
          <p>The institution made this decision under its own rules. Passage saved the requested actions, supporting information, decision, and later changes. Passage did not create legal authority or provide a legal opinion.</p>
        </section>
      </div>

      <div>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Changes after the decision</h2><p>Revocation and expiration are shown separately so the original decision remains clear.</p></div></div>
          <dl className={styles.policyFacts}>
            <div><dt>Current status</dt><dd>{hostedStatusLabel(record.status)}</dd></div>
            <div><dt>Latest update</dt><dd>{lifecycleEvent ? <>{lifecycleEvent.summary}<br />{dateTime(lifecycleEvent.occurredAt)}</> : "No change since the decision"}</dd></div>
          </dl>
          {canChangeLifecycle ? <form action={recordAuthorityLifecycleAction} className={styles.field}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="expectedVersion" value={record.version} />
            <input type="hidden" name="currentStatus" value={record.status} />
            <input type="hidden" name="validUntil" value={record.validUntil} />
            <input type="hidden" name="lifecycleAction" value="revoke" />
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <label htmlFor="revocation-reason">Revocation notice reason</label>
            <textarea id="revocation-reason" name="reason" minLength={3} maxLength={500} required placeholder="Record the source and reason for ending future reliance." />
            <label className={styles.confirmation}><input type="checkbox" name="acknowledged" required /><span>I confirm the institution received a revocation notice and should end future reliance on this receipt.</span></label>
            <button className={styles.dangerButton} type="submit">Record revocation notice</button>
          </form> : null}
          {canExpire ? <form action={recordAuthorityLifecycleAction} className={receiptStyles.expireForm}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="expectedVersion" value={record.version} />
            <input type="hidden" name="currentStatus" value={record.status} />
            <input type="hidden" name="validUntil" value={record.validUntil} />
            <input type="hidden" name="lifecycleAction" value="expire" />
            <input type="hidden" name="reason" value="" />
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <label className={styles.confirmation}><input type="checkbox" name="acknowledged" required /><span>I confirm the request reached its recorded end date.</span></label>
            <button className={styles.secondary} type="submit">Record expiration</button>
          </form> : null}
        </section>

        <details className={`${styles.panel} ${styles.disclosurePanel}`}>
          <summary>Receipt verification details</summary>
          <p>Use these details when confirming that two copies of a receipt match.</p>
          <dl className={styles.policyFacts}>
            <div><dt>Receipt</dt><dd>{decision.receiptCode}</dd></div>
            <div><dt>Decision record</dt><dd>{decision.recordVersion}</dd></div>
          </dl>
          <code className={receiptStyles.fingerprint}>{decision.receiptSha256}</code>
        </details>

        <details className={`${styles.panel} ${styles.disclosurePanel}`}>
          <summary>View activity history ({events.length})</summary>
          <p>Every saved change is listed in order.</p>
          <ul className={styles.activity}>{events.map((event) => <li key={event.eventId}><div><strong>{event.summary}</strong><span>{event.detail}</span></div><span>{dateTime(event.occurredAt)}</span></li>)}</ul>
        </details>
        <Link className={styles.secondary} href={`/app/requests/${record.id}`}>Return to request</Link>
      </div>
    </div>
  </>;
}
