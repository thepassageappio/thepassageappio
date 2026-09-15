import Link from "next/link";
import { randomUUID } from "node:crypto";
import { recordInstitutionDecisionAction, requestHostedAuthorityInformationAction, reviewEvidenceArtifactAction } from "@/app/account-actions";
import { HOSTED_ACTIONS, hostedStatusLabel } from "@/lib/authority/hosted-records";
import { NySoleRefusalNotice } from "@/components/app/NySoleRefusalNotice";
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
  formClassLabel: string | null;
  showSoleRefusalNotice: boolean;
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
    formClassLabel,
    showSoleRefusalNotice,
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
        {informationRequestRows.length > 0 || record.status === "under_review" ? <section className={styles.panel} id="questions">
          <div className={styles.panelHead}><div><h2>Questions</h2><p>{reviewFinished ? "Questions and responses saved with this request." : "Ask them to send or fix something that is missing or unclear."}</p></div><span className={styles.badge}>{reviewFinished ? "Saved history" : openInformationRequest ? "Response needed" : "Up to date"}</span></div>
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
            <label htmlFor="information-message">What do you need them to send or fix?</label>
            <textarea id="information-message" name="message" minLength={3} maxLength={500} required placeholder="Describe the exact information needed to continue this review." />
            <button className={styles.secondary} type="submit">Ask for something else</button>
          </form> : null}
        </section> : null}
        <section className={styles.panel} id="institution-decision">
          <div className={styles.panelHead}><div><h2>Institution decision</h2><p>{reviewFinished ? "Any saved decision is shown here." : "Record the outcome after every required review step is complete."}</p></div><span className={styles.badge}>{decision ? hostedDecisionLabel(decision.outcome) : closedMessage ? "Cl