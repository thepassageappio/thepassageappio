"use client";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { cancelPendingRequestAction } from "@/app/account-actions";
import styles from "@/components/app/app-shell.module.css";
export function CancelRequestForm({ recordId, version, idempotencyKey }: { recordId: string; version: number; idempotencyKey: string }) {
  const [state, submit, pending] = useActionState(cancelPendingRequestAction, { error: null });
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);
  return <details className={`${styles.panel} ${styles.disclosurePanel}`}>
    <summary>Cancel this request</summary>
    <p>Use this if the request is no longer needed. The reason will be visible to both people named in the request. The saved history stays.</p>
    {state.error ? <div ref={errorRef} tabIndex={-1} className={styles.alert} role="alert">{state.error}</div> : null}
    <form action={submit} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => submit(data)); }} aria-busy={pending}>
      <fieldset disabled={pending} className={styles.field}>
        <legend>Reason for canceling</legend>
        <input type="hidden" name="recordId" value={recordId} />
        <input type="hidden" name="expectedVersion" value={version} />
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <label htmlFor="cancellation-reason">Why is this request no longer needed?</label>
        <textarea id="cancellation-reason" name="reason" minLength={3} maxLength={500} required rows={3} />
        <label className={styles.confirmation}><input type="checkbox" name="acknowledged" required /> <span>I understand this closes the request and cannot be undone.</span></label>
        <button className={styles.secondary} type="submit">{pending ? "Canceling…" : "Cancel request"}</button>
      </fieldset>
    </form>
  </details>;
}
