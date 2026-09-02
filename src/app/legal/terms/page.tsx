import Link from "next/link";
import styles from "../legal.module.css";

export default function EvaluationTermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}><Link href="/">Passage Authority</Link><Link href="/start">Return to account setup</Link></header>
      <article className={styles.document}>
        <p className={styles.eyebrow}>Evaluation agreement</p><h1>Evaluation Terms</h1><p className={styles.version}>Version evaluation-2026.1 · Effective August 27, 2026</p>
        <p className={styles.callout}>These terms govern a limited product evaluation. They do not replace a signed pilot agreement, financial institution policy, legal advice, or an institution&apos;s authority decision.</p>
        <h2>Purpose</h2><p>Passage Authority provides a guided workflow for collecting an authority request, recording institution-defined requirements, coordinating review, and preserving the institution&apos;s decision and current status.</p>
        <h2>Authorized evaluation</h2><p>You represent that you are authorized to evaluate the service for the organization you identify. You may invite only people and submit only information that the organization is permitted to use for the stated evaluation purpose.</p>
        <h2>Institution responsibility</h2><p>The receiving institution defines its policy and makes every final decision to accept, limit, reject, revoke, or expire an authority request. Passage does not make a universal legal-validity determination.</p>
        <h2>Prohibited use</h2><ul><li>Do not use the service to move money, take over credentials, open credit, or change account ownership.</li><li>Do not upload information without an appropriate legal and operational basis.</li><li>Do not misrepresent identity, role, consent, authority, or institutional acceptance.</li></ul>
        <h2>Evaluation limits</h2><p>The free evaluation allows five activated authority requests during 10 calendar days beginning when the first participant invitation is sent. Drafts do not count. Existing requests and receipts remain readable if the evaluation ends.</p>
        <h2>Changes and support</h2><p>Material changes require a new version and a new acceptance. Questions about this evaluation may be directed through the contact path provided by Passage Authority.</p>
      </article>
    </main>
  );
}
