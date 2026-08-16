import Link from 'next/link';
import { TopShell } from '@/components/core';
import styles from '@/components/marketing/MarketingPage.module.css';

const rows: [string, string][] = [
  ['Information we collect', 'Passage may collect account information, estate or case details, task records, participant invitations, provider requests, messages, document references, proof notes, billing status, device/browser information, and support inquiries.'],
  ['How Passage uses information', 'We use this information to provide the family record, route scoped requests, prepare messages or packets for review, support funeral-home and vendor workflows, maintain audit trails, prevent misuse, improve the product, and respond to support or billing questions.'],
  ['Role-scoped access', 'Access follows role and context. Family coordinators, invited participants, funeral-home staff, vendors, and Passage support admins each have different visibility. Participants and vendors should see only the request and context needed for their role.'],
  ['Sharing and approval', 'Passage is built around review before sharing. Messages, packets, vendor requests, and provider handoffs should be approved by the responsible user before they leave the record unless a user explicitly initiates that action.'],
  ['Service providers and subprocessors', 'Passage relies on service providers such as Supabase for database/auth, Vercel for hosting, Resend for email, Google for OAuth/address services, Stripe for payments when enabled, and other processors as they are added. These providers process data only to help operate Passage.'],
  ['Retention and deletion', 'Passage keeps coordination records while an account, estate, case, or legal/business need remains active. Users can request export, correction, deletion, or account review through Contact. Some records may be retained where required for security, audit, billing, dispute, or legal reasons.'],
  ['Your privacy choices', 'Depending on location, users may have rights to access, correct, export, delete, restrict, or object to certain processing. We respond to privacy requests through the Passage support queue and may verify identity before acting.'],
  ['Security posture', 'Passage uses role-based access, Supabase authentication, row-level permission design, HTTPS, audit/event logging, and review-first workflows. No system can be guaranteed perfectly secure, so suspected security issues should be reported through Contact.'],
  ['Sensitive and professional boundaries', 'Passage is a coordination platform, not a medical provider, legal advisor, funeral director, government agency, or emergency service. Do not use Passage as the only place for time-critical medical, legal, or emergency decisions.'],
];

export const metadata = { title: 'Privacy policy' };

export default function PrivacyPage() {
  return (
    <TopShell mode="gateway" context="Privacy policy">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Privacy policy</p>
          <h1>Data should stay understandable, role-scoped, and exportable.</h1>
          <p className={styles.lede}>Effective August 15, 2026. This page explains how Passage approaches privacy, access, exports, retention, and subprocessors in plain language.</p>
        </section>

        <section className={styles.section}>
          <div className={styles.grid} style={{ gap: 14 }}>
            {rows.map(([title, body]) => (
              <div className={styles.card} key={title}>
                <h2 className={styles.pathTitle}>{title}</h2>
                <p className={styles.note}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card} style={{ maxWidth: 720 }}>
            <p className={styles.badge}>Requests and support</p>
            <p className={styles.note}>Data export, correction, deletion, billing, subprocessor, and privacy questions should go through Contact so they are captured in the support queue. For formal partner diligence, Passage can provide a more detailed security and data-processing packet as the partnership process requires.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              <Link className={styles.button} href="/contact">Contact Passage</Link>
              <Link className={styles.buttonSecondary} href="/terms">Terms of service</Link>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Questions? <Link href="/contact">Contact Passage</Link> · <Link href="/terms">Terms</Link></p>
        </footer>
      </main>
    </TopShell>
  );
}
