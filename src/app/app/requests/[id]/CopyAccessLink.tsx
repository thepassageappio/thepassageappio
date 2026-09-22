"use client";

import { useEffect, useState, useTransition } from "react";
import { dismissInviteAccessLinkFlashAction } from "@/lib/authority/invite-access-link-cookie";
import styles from "@/components/app/app-shell.module.css";

type Props = {
  recordId: string;
  role: "principal" | "representative";
  url: string;
};

export function CopyAccessLink({ recordId, role, url }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [, startTransition] = useTransition();
  const roleLabel = role === "principal" ? "account holder" : "representative";

  useEffect(() => {
    startTransition(() => {
      void dismissInviteAccessLinkFlashAction(recordId);
    });
  }, [recordId, startTransition]);

  async function copyLink() {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return;
    } catch {
      const input = document.getElementById("invite-access-link");
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
        setCopyFailed(true);
        return;
      }
      setCopyFailed(true);
    }
  }

  return (
    <div className={styles.notice} role="status">
      <strong>Access link for the {roleLabel}</strong>
      <p style={{ margin: "6px 0 12px" }}>
        Email can be slow or miss the inbox. Copy this one-time link and share it with the {roleLabel} now.
        Anyone with this link can open this role. Share it only with the intended person. A newer link turns this one off.
      </p>
      <div className={styles.field}>
        <label htmlFor="invite-access-link">Secure access link</label>
        <input id="invite-access-link" name="inviteAccessLink" readOnly value={url} />
        <div className={styles.panelActions} style={{ marginTop: 8 }}>
          <button className={styles.secondary} type="button" onClick={copyLink}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        {copyFailed ? <p style={{ margin: "8px 0 0" }}>Select the link and copy it by hand.</p> : null}
      </div>
    </div>
  );
}
