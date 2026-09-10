"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { createHostedAuthorityDraftAction } from "@/app/account-actions";
import styles from "@/components/app/app-shell.module.css";
import requestStyles from "./request.module.css";

type Props = { useSample: boolean; endDate: string; idempotencyKey: string };

export function DraftRequestForm({ useSample, endDate, idempotencyKey }: Props) {
  const [state, submitAction, pending] = useActionState(createHostedAuthorityDraftAction, { error: null });
  const [values, setValues] = useState({ principalName: useSample ? "Parker Quinn" : "", principalEmail: "", representativeName: useSample ? "Casey Quinn" : "", representativeEmail: "", accountBoundary: useSample ? "Sample deposit relationship ending 4405" : "", validUntil: endDate });
  const [actions, setActions] = useState(["receive_duplicate_statements", "discuss_service_issues"]);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);
  return (
    <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => submitAction(data)); }} action={submitAction} aria-busy={pending} className={requestStyles.form}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {state.error ? <div className={styles.alert} role="alert" tabIndex={-1} ref={errorRef}><strong>Check your request</strong><p>{state.error}</p><p>Your entries are still here. Fix the problem and save again.</p></div> : null}
      <fieldset disabled={pending} className={requestStyles.fields}>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>New York financial power of attorney</h2><p>Your organization’s rules say which documents and checks are needed. Your review team makes the decision.</p></div><span className={styles.badge}>Selected</span></div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>People</h2><p>Add both people. They will get separate links after you send the request.</p></div></div>
        <div className={requestStyles.formGrid}>
          <label className={styles.field}>Account holder<input name="principalName" required autoComplete="name" placeholder="Full legal name" value={values.principalName} onChange={event => setValues({ ...values, principalName: event.target.value })} /></label>
          <label className={styles.field}>Account holder’s email<input name="principalEmail" value={values.principalEmail} onChange={event => setValues({ ...values, principalEmail: event.target.value })} type="email" required autoComplete="email" placeholder="name@example.com" /></label>
          <label className={styles.field}>Representative<input name="representativeName" required autoComplete="name" placeholder="Full legal name" value={values.representativeName} onChange={event => setValues({ ...values, representativeName: event.target.value })} /></label>
          <label className={styles.field}>Representative’s email<input name="representativeEmail" value={values.representativeEmail} onChange={event => setValues({ ...values, representativeEmail: event.target.value })} type="email" required autoComplete="email" placeholder="name@example.com" /></label>
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>What you are asking for</h2><p>Anything not selected remains outside this request.</p></div></div>
        <label className={styles.field}>Account or relationship covered<input name="accountBoundary" required placeholder="For example, membership account ending 4821" value={values.accountBoundary} onChange={event => setValues({ ...values, accountBoundary: event.target.value })} /></label>
        <fieldset className={requestStyles.optionList}>
          <legend>Requested actions</legend>
          <label className={requestStyles.option}><input type="checkbox" name="allowedActionKeys" value="receive_duplicate_statements" checked={actions.includes("receive_duplicate_statements")} onChange={event => setActions(event.target.checked ? [...actions, "receive_duplicate_statements"] : actions.filter(key => key !== "receive_duplicate_statements"))} /><span><strong>Receive duplicate monthly statements</strong><small>Copies only for the account or relationship named above.</small></span></label>
          <label className={requestStyles.option}><input type="checkbox" name="allowedActionKeys" value="discuss_service_issues" checked={actions.includes("discuss_service_issues")} onChange={event => setActions(event.target.checked ? [...actions, "discuss_service_issues"] : actions.filter(key => key !== "discuss_service_issues"))} /><span><strong>Discuss account-service issues</strong><small>Ask account questions. This does not include moving money.</small></span></label>
        </fieldset>
        <label className={styles.field}>Request end date<input name="validUntil" type="date" required value={values.validUntil} onChange={event => setValues({ ...values, validUntil: event.target.value })} /></label>
      </section>
      <section className={requestStyles.reviewBar}><div><strong>Save without sending</strong><p>Save your draft. Your 10-day trial starts only when you send the first request.</p></div><button className={styles.primary} type="submit" disabled={pending}>{pending ? "Saving…" : "Save draft"}</button></section>
      </fieldset>
    </form>
  );
}
