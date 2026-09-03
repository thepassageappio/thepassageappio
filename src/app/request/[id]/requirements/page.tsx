import { randomUUID } from "node:crypto";
import Link from "next/link";
import { AccountFrame } from "@/components/account/AccountFrame";
import styles from "@/components/account/account.module.css";
import { evidenceRequirementStatusLabel } from "@/lib/authority/participant-evidence";
import { getParticipantEvidenceContext, getParticipantRequestContext } from "@/lib/authority/participant-session";
import { submitRepresentativeCertificationAction, uploadParticipantEvidenceAction } from "@/app/participant-actions";

export const metadata = { robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  file_required: "Choose a file to continue.",
  file_type_not_allowed: "Use a PDF, JPG, or PNG file.",
  file_empty: "The selected file is empty.",
  file_too_large: "The file must be 10 MB or smaller.",
  file_unavailable: "The file could not be stored. Nothing was recorded. Try again.",
  evidence_unavailable: "These requirements are not available for this request.",
  evidence_changed: "This requirement changed. Review the current status and try again.",
  certification_required: "Confirm the certification before continuing.",
};

const NOTICES: Record<string, string> = {
  file_received: "Your source file is stored privately and is waiting for institution review.",
  certification_saved: "Your certification was saved with its exact wording and time.",
};

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
  return <AccountFrame
    eyebrow={`${participant.institutionName} · ${participant.referenceCode}`}
    title="Complete the requirements"
    description={`${completed} of ${evidence.requirements.length} complete. Finish each item below, then send the request to the institution.`}
  >
    {query.notice && NOTICES[query.notice] ? <div className={styles.notice} role="status">{NOTICES[query.notice]}</div> : null}
    {query.error ? <div className={styles.alert} role="alert">{ERRORS[query.error] ?? "That action could not be completed. Nothing was changed."}</div> : null}
    <div className={styles.documentList}>
      {evidence.requirements.map((requirement) => <section className={styles.document} key={requirement.id}>
        <div>
          <strong>{requirement.ordinal}. {requirement.title}</strong>
          <span>{requirement.reason}</span>
          <span>Status: {evidenceRequirementStatusLabel(requirement.status)}</span>
          {requirement.artifact ? <span>File: {requirement.artifact.originalFilename} · {Math.max(1, Math.round(requirement.artifact.byteSize / 1024))} KB</span> : null}
          {requirement.artifact?.reviewerNote ? <span>Institution note: {requirement.artifact.reviewerNote}</span> : null}
        </div>
        {requirement.inputKind === "document" && (requirement.status === "not_started" || requirement.status === "needs_attention") ? <form action={uploadParticipantEvidenceAction} className={styles.form}>
          <input type="hidden" name="recordId" value={id} />
          <input type="hidden" name="requirementKey" value={requirement.requirementKey} />
          <input type="hidden" name="idempotencyKey" value={randomUUID()} />
          <div className={styles.field}>
            <label htmlFor={`file-${requirement.id}`}>Choose a file</label>
            <input id={`file-${requirement.id}`} name="evidenceFile" type="file" accept="application/pdf,image/jpeg,image/png" required />
            <small>PDF, JPG, or PNG. Maximum 10 MB. The file is private to authorized participants and institution reviewers.</small>
          </div>
          <button className={styles.primary} type="submit">Upload for review</button>
        </form> : null}
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
    <Link className={styles.secondary} href={`/request/${encodeURIComponent(id)}/overview`}>Return to request status</Link>
  </AccountFrame>;
}
