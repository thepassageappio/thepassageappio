"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { finalizeParticipantEvidenceUploadAction, prepareParticipantEvidenceUploadAction, uploadParticipantEvidenceAction } from "@/app/participant-actions";
import styles from "@/components/account/account.module.css";
import { uploadEvidenceDirect } from "@/lib/authority/evidence-direct-upload";
import { checkEvidenceFile, EVIDENCE_UPLOAD_ACCEPT, EVIDENCE_UPLOAD_MESSAGES } from "@/lib/authority/evidence-upload";

/**
 * With JavaScript, the file goes straight to private storage (files up to 10 MB). Without
 * JavaScript, the form still posts to the original server action, which only fits small files.
 */
export function ParticipantEvidenceUploadForm({ recordId, requirementKey, inputId, idempotencyKey }: {
  recordId: string;
  requirementKey: string;
  inputId: string;
  idempotencyKey: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function checkChosenFile() {
    const file = inputRef.current?.files?.[0];
    if (!file) { setError(null); return; }
    const check = checkEvidenceFile(file);
    setError(check.ok ? null : EVIDENCE_UPLOAD_MESSAGES[check.problem]);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    const file = inputRef.current?.files?.[0];
    setError(null);
    setUploading(true);
    void uploadEvidenceDirect(file, {
      prepare: (chosen) => prepareParticipantEvidenceUploadAction({ recordId, requirementKey, ...chosen }),
      finalize: (ticket) => finalizeParticipantEvidenceUploadAction({
        recordId,
        requirementKey,
        artifactId: ticket.artifactId,
        mediaType: ticket.mediaType,
        originalFilename: ticket.originalFilename,
        idempotencyKey: ticket.idempotencyKey,
      }),
    }).then((result) => {
      if (result.ok && result.finalized.ok) {
        router.push(result.finalized.destination);
        return;
      }
      setUploading(false);
      setError(result.ok ? (result.finalized.ok ? null : result.finalized.error) : result.error);
    });
  }

  return <form action={uploadParticipantEvidenceAction} className={styles.form} onSubmit={onSubmit}>
    <input type="hidden" name="recordId" value={recordId} />
    <input type="hidden" name="requirementKey" value={requirementKey} />
    <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
    <div className={styles.field}>
      <label htmlFor={inputId}>Choose a file</label>
      <input ref={inputRef} id={inputId} name="evidenceFile" type="file" accept={EVIDENCE_UPLOAD_ACCEPT} required disabled={uploading} onChange={checkChosenFile} aria-describedby={`${inputId}-hint`} />
      <small id={`${inputId}-hint`}>PDF, JPEG, or PNG. Up to 10 MB. The file is private to authorized participants and institution reviewers.</small>
    </div>
    {error ? <div className={styles.alert} role="alert">{error}</div> : null}
    {uploading ? <div className={styles.notice} role="status">Uploading your file. Large files can take a minute. Keep this page open.</div> : null}
    <button className={styles.primary} type="submit" disabled={uploading}>{uploading ? "Uploading…" : "Upload for review"}</button>
  </form>;
}
