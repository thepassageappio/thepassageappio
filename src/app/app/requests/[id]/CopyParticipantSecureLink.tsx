"use client";

import { useActionState, useEffect, useId, useState } from "react";
import {
  copyParticipantSecureLinkAction,
  type CopyParticipantSecureLinkState,
} from "@/app/account-actions";
import styles from "@/components/app/app-shell.module.css";

type Props = {
  recordId: string;
  participantRole: "principal" | "representative";
  expectedRecordVersion: number;
  expectedInvitationVersion: number;
  idempotencyKey: string;
  email: string;
};

const initialState: CopyParticipantSecureLinkState = { status: "idle" };

export function CopyParticipantSecureLink({
  recordId,
  participantRole,
  expectedRecordVersion,
  expectedInvitationVersion,
  idempotencyKey,
  email,
}: Props) {
  const [state, action, pending] = useActionState(copyParticipantSecureLinkAction, initialState);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const inputId = useId();
  const url = state.status === "ready" ? state.url : undefined;
  const copied = Boolean(url) && copiedUrl === url;
  const copyFailed = Boolean(url) && failedUrl === url && !copied;
  const roleLabel = participantRole === "principal" ? "account holder" : "representative";

  useEffect(() => {
    if (!url || !navigator.clipboard) return;
    navigator.clipboard.writeText(url).then(() => setCopiedUrl(url), () => setFailedUrl(url));
  }, [url]);

  async function copyAgain() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
    } catch {
      const input = document.getElementById(inputId);
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
      setFailedUrl(url);
    }
  }

  return (
    <div>
      <form action={action}>
        <input name="recordId" type="hidden" value={recordId} />
        <input name="participantRole" type="hidden" value={participantRole} />
        <input name="expectedRecordVersion" type="hidden" value={expectedRecordVersion} />
        <input name="expectedInvitationVersion" type="hidden" value={expectedInvitationVersion} />
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <button className={styles.smallButton} disabled={pending} type="submit">
          {pending ? "Making link…" : "Copy secure link"}
        </button>
      </form>
      {state.status === "error" && state.message ? (
        <p role="alert" style={{ margin: "6px 0 0" }}>{state.message}</p>
      ) : null}
      {url ? (
        <div className={styles.field} role="status" style={{ marginTop: 8 }}>
          <label htmlFor={inputId}>Secure link for the {roleLabel} ({email})</label>
          <input id={inputId} readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
          <p style={{ margin: "6px 0" }}>
            {copied ? "Copied. " : ""}
            Only {email} should use it. Send it to them yourself. Earlier links for this person no longer work. We show this link only once.
          </p>
          <button className={styles.smallButton} type="button" onClick={copyAgain}>
            {copied ? "Copied" : "Copy"}
          </button>
          {copyFailed ? <p style={{ margin: "6px 0 0" }}>Select the link and copy it by hand.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
