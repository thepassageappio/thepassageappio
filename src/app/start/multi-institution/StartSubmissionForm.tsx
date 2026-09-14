"use client";

import { useActionState } from "react";
import { startSubmissionGroupAction } from "@/app/multi-institution-actions";
import styles from "@/components/account/account.module.css";

type Props = { idempotencyKey: string };

export function StartSubmissionForm({ idempotencyKey }: Props) {
  const [state, submitAction, pending] = useActionState(startSubmissionGroupAction, { error: null });

  return (
    <form action={submitAction} aria-busy={pending} className={styles.form}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {state.error ? <div className={styles.alert} role="alert">{state.error}</div> : null}
      <label className={styles.field}>
        Your full name
        <input name="requesterName" required autoComplete="name" placeholder="Full legal name" disabled={pending} />
      </label>
      <label className={styles.field}>
        Your email
        <input name="requesterEmail" type="email" required autoComplete="email" placeholder="name@example.com" disabled={pending} />
      </label>
      <label className={styles.field}>
        Your relationship to this request
        <select name="requesterRelationship" required defaultValue="representative" disabled={pending}>
          <option value="representative">I am the representative named in the power of attorney</option>
          <option value="principal_self">I am the account holder, requesting for myself</option>
          <option value="other">Other</option>
        </select>
      </label>
      <button className={styles.primary} type="submit" disabled={pending}>{pending ? "Sending…" : "Continue"}</button>
      <p className={styles.legal}>We will email you a one-time link to confirm your address before you can name institutions.</p>
    </form>
  );
}
