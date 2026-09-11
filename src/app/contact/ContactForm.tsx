"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { createCommercialInquiryAction } from "@/app/commercial-actions";
import styles from "./contact.module.css";

export function ContactForm({ children }: { children: ReactNode }) {
  const [state, submit, pending] = useActionState(createCommercialInquiryAction, { error: null });
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.error) errorRef.current?.focus(); }, [state]);
  return <form className={styles.form} action={submit} aria-busy={pending} onSubmit={event => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => submit(data));
  }}>
    {state.error ? <div className={styles.error} role="alert" tabIndex={-1} ref={errorRef}>
      <strong>{state.error}</strong><p>Your entries are still here.</p>
    </div> : null}
    <fieldset className={styles.fields} disabled={pending}>
      {children}
      <button className={styles.submit} type="submit">{pending ? "Sending your request…" : "Request walkthrough"}</button>
    </fieldset>
  </form>;
}
