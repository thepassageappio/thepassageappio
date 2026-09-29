import { randomUUID } from "node:crypto";
import Link from "next/link";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { evidenceRequirementStatusLabel } from "@/lib/authority/participant-evidence";
import { participantRequirementsError, participantRequirementsNotice } from "@/lib/authority/participant-requirements-notice";
import { getParticipantEvidenceContext, getParticipantRequestContext } from "@/lib/authority/participant-session";
import { submitRepresentativeCertificationAction } from "@/app/participant-actions";
import { ParticipantEvidenceUploadForm } from "./ParticipantEvidenceUploadForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function ParticipantRequirementsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const [participant, evidence] = await Promise.all([
    getParticipantRequestContext(id),
    getParticipantEvidenceContext(id),
  ]);
  if (!participant || !evidence || participant.participantRole !== "representative") {
    return <AccountFrame eyebrow="Secure request" title="Requirements are unavailable" description="Use the latest secure invitation from the institution to continue.">
      <div className={styles.alert} role="alert">Your session may have expired, been revoked, or belong to another role.</div>
    </AccountFrame>;
  }

  const completed = evidence.requirements.filter((item) => item.status === "completed").length;
  const allComplete = completed === evidence.requirements.length;
  const noticeMessage = participantRequirementsNotice(query.notice, allComplete);
  const errorMessage = participantRequirementsError(query.error);
  return <AccountFrame
    eyebrow={`${participant.institutionName} · ${participant.referenceCode}`}
    title="Complete the requirements"
    description={allComplete
      ? `${completed} of ${evidence.requirements.length} complete. Review and send the request to the institution.`
      : `${completed} of ${evidence.requirements.length} complete. Finish each item below, then send the request to the institution.`}
  >
    {noticeMessage ? <div className={styles.notice} role="status">{noticeMessage}</div> : null}
    {errorMessage ? <div className={styles.alert} role="alert">{errorMessage}</div> : null}
    <div className={styles.documentList}>
      {evidence.requirements.map((requirement) => <section className={styles.document} key={requirement.id}>
        <div>
          <strong>{requirement.ordinal}. {requirement.title}</strong>
          <span>{requirement.reason}</span>
          <span>Status: {evidenceRequirementStatusLabel(requirement.status)}</span>
          {requirement.artifact ? <span>File: {requirement.artifact.originalFilename} · {Math.max(1, Math.round(requirement.artifact.byteSize / 1024))} KB</span> : null}
          {requirement.artifact?.reviewerNote ? <span>Institution note: {requirement.artifact.reviewerNote}</span> : null}
        </div>
        {requirement.inputKind === "document" && (requirement.status === "not_started" || requirement.status === "needs_attention") ? <ParticipantEvidenceUploadForm
          recordId={id}
          requirementKey={requirement.requirementKey}
          inputId={`file-${requirement.id}`}
          idempotencyKey={randomUUID()}
        /> : null}
        {requirement.inputKind === "attestation" && requirement.status !== "completed" ? <form action={submitRepresentativeCertificationAction} className={styles.form}>
          <input type="hidden" name="recordId" value={id} />
          <input type="hidden" name="idempotencyKey" value={randomUUID()} />
          <label className={styles.check}>
            <input type="checkbox" name="acknowledged" required />
            <span>I will act only for {participant.otherPersonName}, only within the permitted actions, and only while this request remains current.<small>Passage will save this confirmation and when you completed it.</small></span>
          </label>
          <button className={styles.primary} type="submit">Save certification</button>
        </form> : null}
      </section>)}
    </div>
    <div className={styles.rule}>The institution can review anything you upload for this request. Passage does not decide whether a document is legally valid or guarantee that the institution will accept it.</div>
    <Link className={allComplete ? styles.primary : styles.secondary} href={`/request/${encodeURIComponent(id)}/overview`}>{allComplete ? "Review and send" : "Return to request status"}</Link>
  </AccountFrame>;
}
