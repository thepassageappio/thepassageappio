"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { createHostedAuthorityDraftAction } from "@/app/account-actions";
import styles from "@/components/app/app-shell.module.css";
import type { HostedActionKey } from "@/lib/authority/hosted-records";
import type { OfferedFinancialPermission } from "@/lib/authority/permission-catalog";
import requestStyles from "./request.module.css";

type Props = { useSample: boolean; endDate: string; idempotencyKey: string; offered: OfferedFinancialPermission[]; publishedVersionId: string };

export function DraftRequestForm({ useSample, endDate, idempotencyKey, offered: OFFERED, publishedVersionId }: Props) {
  const OFFERED_KEYS = OFFERED.map(item => item.key);
  const [state, submitAction, pending] = useActionState(createHostedAuthorityDraftAction, { error: null });
  const [values, setValues] = useState({ principalName: useSample ? "Parker Quinn" : "", principalEmail: "", representativeName: useSample ? "Casey Quinn" : "", representativeEmail: "", accountBoundary: useSample ? "Sample deposit relationship ending 4405" : "", validUntil: endDate });
  const [actions, setActions] = useState<HostedActionKey[]>([...OFFERED_KEYS]);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);

  const allSelected = OFFERED_KEYS.every((key) => actions.includes(key));
  const selectedCount = actions.filter((key) => OFFERED_KEYS.includes(key)).length;

  function toggleKey(key: HostedActionKey, checked: boolean) {
    setActions(checked ? [...new Set([...actions, key])] : actions.filter((item) => item !== key));
  }

  function selectAllOffered() {
    setActions([...OFFERED_KEYS]);
  }

  function clearOffered() {
    setActions([]);
  }

  return (
    <form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => submitAction(data)); }} action={submitAction} aria-busy={pending} className={requestStyles.form}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="expectedPublishedVersionId" value={publishedVersionId} />
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
          <legend>What people may ask for</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 4 }}>
            <button className={styles.secondary} type="button" onClick={selectAllOffered} disabled={allSelected}>
              Select all that apply
            </button>
            <button className={styles.secondary} type="button" onClick={clearOffered} disabled={selectedCount === 0}>
              Clear
            </button>
            <small style={{ color: "var(--muted)" }}>
              {selectedCount} of {OFFERED_KEYS.length} selected
              {selectedCount > 0 ? `: ${OFFERED.filter((item) => actions.includes(item.key)).map((item) => item.label).join("; ")}` : ""}
            </small>
          </div>
          {OFFERED.map((item) => (
            <label className={requestStyles.option} key={item.key}>
              <input
                type="checkbox"
                name="allowedActionKeys"
                value={item.key}
                checked={actions.includes(item.key)}
                onChange={(event) => toggleKey(item.key, event.target.checked)}
              />
              <span>
                <strong>{item.label}</strong>
                <small>{item.help}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <label className={styles.field}>Request end date<input name="validUntil" type="date" required value={values.validUntil} onChange={event => setValues({ ...values, validUntil: event.target.value })} /></label>
      </section>
      <section className={requestStyles.reviewBar}><div><strong>Save without sending</strong><p>Save your draft. Your 10-day trial starts only when you send the first request.</p></div><button className={styles.primary} type="submit" disabled={pending}>{pending ? "Saving…" : "Save draft"}</button></section>
      </fieldset>
    </form>
  );
}
