"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { updateHostedAuthorityDraftAction } from "@/app/account-actions";
import styles from "@/components/app/app-shell.module.css";

type Props = {
  recordId: string;
  version: number;
  idempotencyKey: string;
  principalName: string;
  principalEmail: string;
  representativeName: string;
  representativeEmail: string;
};

export function EditDraftEmailsForm({
  recordId,
  version,
  idempotencyKey,
  principalName,
  principalEmail,
  representativeName,
  representativeEmail,
}: Props) {
  const [state, submit, pending] = useActionState(updateHostedAuthorityDraftAction, { error: null });
  const [values, setValues] = useState({
    principalName,
    principalEmail,
    representativeName,
    representativeEmail,
  });
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state]);

  return (
    <section aria-labelledby="change-emails-heading" style={{ marginTop: 14 }}>
      <h3 id="change-emails-heading" style={{ margin: "0 0 6px", fontSize: "1rem" }}>
        Change emails before you send
      </h3>
      <p className={styles.supportingCopy} style={{ marginTop: 0 }}>
        Fix names or emails on this saved draft. After you send, use a fresh link instead of rewriting emails here.
      </p>
      {state.error ? (
        <div ref={errorRef} tabIndex={-1} className={styles.alert} role="alert">
          {state.error}
        </div>
      ) : null}
      <form
        action={submit}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => submit(data));
        }}
        aria-busy={pending}
      >
        <fieldset disabled={pending} style={{ border: 0, margin: 0, padding: 0 }}>
          <input type="hidden" name="recordId" value={recordId} />
          <input type="hidden" name="expectedVersion" value={version} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <div style={{ display: "grid", gap: 10 }}>
            <label className={styles.field}>
              Account holder
              <input
                name="principalName"
                required
                autoComplete="name"
                value={values.principalName}
                onChange={(event) => setValues({ ...values, principalName: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              Account holder’s email
              <input
                name="principalEmail"
                type="email"
                required
                autoComplete="email"
                value={values.principalEmail}
                onChange={(event) => setValues({ ...values, principalEmail: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              Representative
              <input
                name="representativeName"
                required
                autoComplete="name"
                value={values.representativeName}
                onChange={(event) => setValues({ ...values, representativeName: event.target.value })}
              />
            </label>
            <label className={styles.field}>
              Representative’s email
              <input
                name="representativeEmail"
                type="email"
                required
                autoComplete="email"
                value={values.representativeEmail}
                onChange={(event) => setValues({ ...values, representativeEmail: event.target.value })}
              />
            </label>
          </div>
          <button className={styles.secondary} type="submit" style={{ marginTop: 12 }}>
            {pending ? "Saving…" : "Save contact details"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}
