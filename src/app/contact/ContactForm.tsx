"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import { createCommercialInquiryAction } from "@/app/commercial-actions";
import styles from "./contact.module.css";

export function ContactForm({ children }: { children: ReactNode }) {
  const [state, submit, pending] = useActionState(async (previous: { error: string | null }, data: FormData) => {
    try {
      return await createCommercialInquiryAction(previous, data);
    } catch (error) {
      // Fetch rejects with TypeError when the browser cannot reach the server.
      // Preserve framework redirects and other errors for Next to handle.
      if (error instanceof TypeError) return { error: "We could not reach Passage. Check your connection and try again." };
      // Pinned Next 16.1.6 marks non-action HTTP responses with E394.
      // Never display a gateway's raw response or claim the request was not saved.
      if (error instanceof Error && "__NEXT_ERROR_CODE" in error && error.__NEXT_ERROR_CODE === "E394" && !("digest" in error)) {
        return { error: "We could not confirm that your request was saved. Please try again." };
      }
      throw error;
    }
  }, { error: null });
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
