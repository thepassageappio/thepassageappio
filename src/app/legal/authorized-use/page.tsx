import Link from "next/link";
import styles from "../legal.module.css";

export default function AuthorizedUsePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}><Link href="/">Passage Authority</Link><Link href="/start">Return to account setup</Link></header>
      <article className={styles.document}>
        <p className={styles.eyebrow}>Organization attestation</p><h1>Authorized Use Attestation</h1><p className={styles.version}>Version evaluation-2026.1 · Effective August 27, 2026</p>
        <p>By confirming this attestation for an organization, the organization owner states that:</p>
        <ul><li>they are authorized to establish and evaluate the organization workspace;</li><li>people invited to the workspace have a legitimate role in the evaluation;</li><li>participant and authority information will be submitted only with an appropriate legal and operational basis;</li><li>Passage will not be treated as making the institution&apos;s final legal or authority decision;</li><li>suspected misuse, unauthorized access, or inaccurate authority information will be reported promptly.</li></ul>
        <p className={styles.callout}>Confirming this attestation does not prove legal authority for any individual request. Each request follows its own identity, evidence, consent, policy, and institution-decision steps.</p>
      </article>
    </main>
  );
}
