import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Evaluation Privacy Notice", description: "How Passage Authority handles information during the controlled evaluation.", alternates: { canonical: "/legal/privacy" } };

export default function EvaluationPrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}><Link href="/">Passage Authority</Link><Link href="/start">Return to account setup</Link></header>
      <article className={styles.document}>
        <p className={styles.eyebrow}>Evaluation privacy</p><h1>Evaluation Privacy Notice</h1><p className={styles.version}>Version evaluation-2026.1 · Effective August 27, 2026</p>
        <p className={styles.callout}>This notice describes the evaluation workflow. Final production retention, subprocessor, and jurisdiction terms require the applicable customer agreement and privacy review.</p>
        <h2>Information used</h2><p>Passage may process account identity, organization profile, team membership, authority-request details, participant contact information, evidence references, review decisions, and security and audit events needed to operate the workflow.</p>
        <h2>How information is used</h2><ul><li>Authenticate people and enforce organization and record access.</li><li>Coordinate the requested authority review and show each person the next action.</li><li>Preserve consent, disclosure, decision, revocation, expiration, and access history.</li><li>Protect, troubleshoot, and improve the service.</li></ul>
        <h2>Who can see information</h2><p>Access depends on the person&apos;s verified organization role or a secure, record-bound invitation. Passage separates organization access, participant access, private evidence, and integration access. The receiving institution controls its decision and authorized reviewers.</p>
        <h2>Service providers</h2><p>Approved service providers may support authentication, hosting, transactional email, payment, identity or evidence checks, and monitoring. Production use requires an accurate subprocessor and control record.</p>
        <h2>Your choices</h2><p>Organization owners can manage team access. Participants can review what they are asked to share and the later actions available to them. Requests for access, correction, export, or deletion are handled subject to legal, security, and record-retention requirements.</p>
      </article>
    </main>
  );
}
