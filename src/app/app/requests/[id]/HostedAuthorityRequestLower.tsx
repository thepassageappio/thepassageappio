import Link from "next/link";
import { randomUUID } from "node:crypto";
import { recordInstitutionDecisionAction, requestHostedAuthorityInformationAction, reviewEvidenceArtifactAction } from "@/app/account-actions";
import { HOSTED_ACTIONS, hostedStatusLabel } from "@/lib/authority/hosted-records";
import { hostedDecisionLabel } from "@/lib/authority/hosted-decisions";
import { CancelRequestForm } from "./CancelRequestForm";
import styles from "@/components/app/app-shell.module.css";

type LowerProps = {
  access: any;
  record: any;
  closedMessage: string | null;
  reviewFinished: boolean;
  events: any[];
  canCoordinate: boolean;
  canRecordDecision: boolean;
  canReviewEvidence: boolean;
  decision: any;
  decisionReady: boolean;
  decisionSinceChanged: boolean;
  requirements: any[];
  evidenceArtifacts: any[];
  informationRequests: any[];
  informationResponses: any[];
  openInformationRequest: any;
  responseByRequest: Map<string, any>;
  requirementStatusLabel: (status: unknown) => string;
  activityDetail: (event: { eventType: string; detail: string }) => string;
  activitySummary: (event: { eventType: string; summary: string }) => string;
};

export function HostedAuthorityRequestLower({ p }: { p: LowerProps }) {
  const {
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
  } = p;

  const requirementRows = requirements ?? [];
  const evidenceRows = evidenceArtifacts ?? [];
  const informationRequestRows = informationRequests ?? [];

  return <>
        {requirementRows.length > 0 ? <section className={styles.panel} id="required-information">
          <div className={styles.panelHead}><div><h2>Required information</h2><p>{reviewFinished ? "These files and confirmations are part of the saved history." : "Review each file or confirmation before making a decision."}</p></div><span className={styles.badge}>{requirementRows.filter((item) => item.status === "completed").length} of {requirementRows.length} complete</span></div>
          <ul className={styles.activity}>{requirementRows.map((requirement) => {
            const artifact = evidenceRows.find((item) => String(item.requirement_id) === String(requirement.id));
            return <li key={String(requirement.id)}>
              <div>
                <strong>{String(requirement.title)}</strong>
                <span>{String(requirement.reason)}</span>
                <span>Status: {requirementStatusLabel(requirement.status)}</span>
                {artifact ? <><span>Source: {String(artifact.original_filename)} · {Math.max(1, Math.round(Number(artifact.byte_size) / 1024))} KB</span><Link href={`/app/evidence/${encodeURIComponent(String(artifact.id))}`}>Open authorized source</Link></> : null}
                {artifact?.reviewer_note ? <span>Reviewer note: {String(artifact.reviewer_note)}</span> : null}
              </div>
              {artifact && artifact.review_status === "pending" && canReviewEvidence && !reviewFinished ? <div>
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
          <p>Accepting a file completes this review step. It does not decide whether the power of attorney is legally valid.</p>
        </section> : null}
        {informationRequestRows.length > 0 || record.status === "under_review" ? <section className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Questions</h2><p>{reviewFinished ? "Questions and responses saved with this request." : "Ask the representative for missing or unclear information."}</p></div><span className={styles.badge}>{reviewFinished ? "Saved history" : openInformationRequest ? "Response needed" : "Up to date"}</span></div>
          {informationRequestRows.length > 0 ? <ul className={styles.activity}>{informationRequestRows.map((item) => {
            const response = responseByRequest.get(String(item.id));
            return <li key={String(item.id)}><div><strong>{String(item.message)}</strong><span>Requirement: {String(item.requirement_key).replaceAll("_", " ")}</span>{response ? <span>Representative response: {String(response.response)}</span> : <span>{reviewFinished ? "No response was saved" : "Waiting for the representative"}</span>}</div></li>;
          })}</ul> : null}
          {record.status === "under_review" && canRecordDecision && !openInformationRequest ? <form action={requestHostedAuthorityInformationAction} className={styles.field}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="expectedVersion" value={record.version} />
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <label htmlFor="information-requirement">Related requirement</label>
            <select id="information-requirement" name="requirementKey" defaultValue="identity_evidence">{requirementRows.map((item) => <option key={String(item.id)} value={String(item.requirement_key)}>{String(item.title)}</option>)}</select>
            <label htmlFor="information-message">What is still needed?</label>
            <textarea id="information-message" name="message" minLength={3} maxLength={500} required placeholder="Describe the exact information needed to continue this review." />
            <button className={styles.secondary} type="submit">Send information request</button>
          </form> : null}
        </section> : null}
        <section className={styles.panel} id="institution-decision">
          <div className={styles.panelHead}><div><h2>Institution decision</h2><p>{reviewFinished ? "Any saved decision is shown here." : "Record the outcome after every required review step is complete."}</p></div><span className={styles.badge}>{decision ? hostedDecisionLabel(decision.outcome) : closedMessage ? "Closed" : decisionReady ? "Ready" : "Not ready"}</span></div>
          {decision ? <>
            <dl className={styles.policyFacts}>
              <div><dt title="What the institution decided at the time, based on the evidence reviewed. This does not change later.">Original decision</dt><dd>{hostedDecisionLabel(decision.outcome)}</dd></div>
              {decisionSinceChanged ? <div><dt title="What is true about this request right now. This can change after the original decision without altering the decision itself.">Current status</dt><dd>{hostedStatusLabel(record.status)}</dd></div> : null}
              <div><dt>Decision reason</dt><dd>{decision.reason}</dd></div>
              <div><dt title="A receipt is the saved, shareable record of this decision. It does not change if the request's status changes later.">Receipt</dt><dd>{decision.receiptCode}</dd></div>
            </dl>
            {decisionSinceChanged ? <p className={styles.supportingCopy}>The original decision above has not changed. Only the request&apos;s current status has — open the receipt for the full timeline.</p> : null}
            <Link className={styles.primary} href={`/app/requests/${record.id}/receipt`}>Open decision receipt</Link>
          </> : closedMessage ? <p>No institution decision is saved for this request. Review the activity history for what happened.</p> : decisionReady && canRecordDecision ? <form action={recordInstitutionDecisionAction} className={styles.field}>
            <input type="hidden" name="recordId" value={record.id} />
            <input type="hidden" name="expectedVersion" value={record.version} />
            <input type="hidden" name="idempotencyKey" value={randomUUID()} />
            <label htmlFor="decision-outcome">Institution outcome</label>
            <select id="decision-outcome" name="outcome" defaultValue="accepted_with_limits">
              <option value="accepted_with_limits">Accept with limits</option>
              <option value="accepted">Accept as submitted</option>
              <option value="rejected">Do not accept</option>
            </select>
            <fieldset>
              <legend>Accepted actions</legend>
              <p>Keep only the actions this decision accepts. Written limits do not remove an action from the receipt.</p>
              {record.allowedActionKeys.map((key: keyof typeof HOSTED_ACTIONS) => <label className={styles.confirmation} key={key}>
                <input type="checkbox" name="acceptedActionKeys" value={key} defaultChecked /> <span>{HOSTED_ACTIONS[key]}</span>
              </label>)}
            </fieldset>
            <label htmlFor="decision-reason">Reason</label>
            <textarea id="decision-reason" name="reason" minLength={3} maxLength={500} required placeholder="Explain why the institution reached this decision." />
            <label htmlFor="decision-limitations">Limits, one per line</label>
            <textarea id="decision-limitations" name="limitations" maxLength={2400} placeholder="Required only for an acceptance with limits." />
            <label className={styles.confirmation}><input type="checkbox" name="acknowledged" required /> <span>I confirm this is the institution&apos;s decision for this request and it should become part of the shared receipt.</span></label>
            <button className={styles.primary} type="submit">Save decision and send receipt</button>
          </form> : <>
            <ul className={styles.checklist}>
              <li>{requirementRows.filter((item) => item.status === "completed").length} of {requirementRows.length || 3} required review steps are complete</li>
              <li>The requested actions and account details stay the same</li>
              <li>{record.status === "ready_to_submit" ? "The representative must check what will be shared and send the request" : canRecordDecision ? "The decision form opens when institution review begins" : "An institution reviewer or administrator records the final outcome"}</li>
            </ul>
            <p>No outcome can be recorded while a source or certification still needs review.</p>
          </>}
        </section>
        {record.status === "awaiting_principal" && canCoordinate ? <CancelRequestForm recordId={record.id} version={record.version} idempotencyKey={randomUUID()} /> : null}
        <details className={`${styles.panel} ${styles.disclosurePanel}`}>
          <summary>View activity history ({events.length})</summary>
          <p>Every saved change is listed in order.</p>
          <ul className={styles.activity}>{events.map((event) => <li key={event.eventId}><div><strong>{activitySummary(event)}</strong><span>{activityDetail(event)}</span></div><span>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(event.occurredAt))}</span></li>)}</ul>
        </details>
  </>;
}
