"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { copyTeamInvitationLinkAction, type CopyTeamInvitationLinkState } from "@/app/team-invitation-actions";
import styles from "@/components/app/app-shell.module.css";

type Props = {
  invitationId: string;
  expectedVersion: number;
  idempotencyKey: string;
  email: string;
};

const initialState: CopyTeamInvitationLinkState = { status: "idle" };

export function CopyInviteLink({ invitationId, expectedVersion, idempotencyKey, email }: Props) {
  const [state, action, pending] = useActionState(copyTeamInvitationLinkAction, initialState);
  // Track which link was copied, so a newer link never shows "Copied" by mistake.
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const inputId = useId();
  const url = state.status === "ready" ? state.url : undefined;
  const copied = Boolean(url) && copiedUrl === url;
  const copyFailed = Boolean(url) && failedUrl === url && !copied;

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
        <input name="invitationId" type="hidden" value={invitationId} />
        <input name="expectedVersion" type="hidden" value={expectedVersion} />
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <button className={styles.smallButton} disabled={pending} type="submit">{pending ? "Making link…" : "Copy invite link"}</button>
      </form>
      {state.status === "error" && state.message ? <p role="alert" style={{ margin: "6px 0 0" }}>{state.message}</p> : null}
      {url ? (
        <div className={styles.field} role="status" style={{ marginTop: 8 }}>
          <label htmlFor={inputId}>Invite link for {email}</label>
          <input id={inputId} readOnly value={url} onFocus={(event) => event.currentTarget.select()} />
          <p style={{ margin: "6px 0" }}>{copied ? "Copied. " : ""}Only {email} can use it. Send it to them yourself. Earlier links for this invite no longer work. We show this link only once.</p>
          <button className={styles.smallButton} type="button" onClick={copyAgain}>{copied ? "Copied" : "Copy"}</button>
          {copyFailed ? <p style={{ margin: "6px 0 0" }}>Select the link and copy it by hand.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
