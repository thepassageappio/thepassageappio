import Link from 'next/link';
import { TopShell } from '@/components/core';
import styles from '@/components/marketing/MarketingPage.module.css';

const terms: [string, string][] = [
  ['Guidance and coordination', 'Passage organizes practical workflows, tasks, messages, proof, and records. It does not make emergency, medical, legal, religious, financial, funeral, government, or family-authority decisions for users.'],
  ['User and professional judgment', 'Families, participants, funeral homes, vendors, and professionals remain responsible for confirming the right action for their specific situation and local rules.'],
  ['Emergency boundaries', 'If someone may still be alive, is in danger, needs urgent medical help, or local rules require immediate authority involvement, users should contact emergency services or the appropriate professional authority directly.'],
  ['Accounts and authorized use', 'Users are responsible for using accurate account information, keeping sign-in credentials secure, and only accessing records, cases, requests, or organizations where they have permission. Misuse, scraping, harassment, unlawful activity, or attempts to bypass access controls are not permitted.'],
  ['Subscriptions, billing, and refunds', 'Paid plans and urgent records are processed through Stripe. Plan terms, pricing, renewal timing, cancellation, refunds, and taxes are shown at checkout.'],
  ['Workflow customization', 'Passage provides best-practice workflows that can be customized. Customized workflows and user-entered instructions remain subject to human review and user responsibility.'],
  ['Notifications and delivery', 'Passage logs attempted email, SMS, and in-app communications, but delivery depends on providers, recipient information, carrier/email systems, and account configuration.'],
  ['Vendors and third parties', 'Vendors, funeral homes, clergy, cemeteries, banks, government agencies, and other third parties are independent. Passage can coordinate requests and status, but it does not control their decisions or performance.'],
  ['Marketplace and partner services', 'When vendor commerce is enabled, vendor quotes, family approval, payment, Passage fees, vendor payouts, cancellation, and dispute handling are governed by the disclosed vendor terms and the payment flow shown before payment. Vendors remain independent service providers.'],
  ['Intellectual property and content', 'Passage owns the platform, product design, software, brand, and templates. Users retain responsibility for the information, uploads, notes, and instructions they provide, and grant Passage permission to process that content to provide the service.'],
  ['Limitation of liability', 'To the maximum extent allowed by law, Passage is not responsible for indirect, incidental, special, consequential, or punitive damages, or for decisions made by users, professionals, providers, or third parties outside Passage.'],
  ['Termination and suspension', 'Passage may suspend or terminate access when an account is misused, payment fails, legal obligations require it, or continued access creates security, privacy, or operational risk. Users may request account help through Contact.'],
  ['Governing law and disputes', 'Formal governing-law, venue, arbitration, and partner-specific terms may be provided in the applicable customer, vendor, or partner agreement. For now, unresolved account or policy questions should be sent through Contact for review.'],
];

export const metadata = { title: 'Terms of service' };

export default function TermsPage() {
  return (
    <TopShell mode="gateway" context="Terms of service">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Terms of service</p>
          <h1>Clear product boundaries for sensitive coordination work.</h1>
          <p className={styles.lede}>Effective August 15, 2026. These terms explain responsibilities, limits, billing boundaries, third-party boundaries, and human-review expectations that apply when using Passage.</p>
        </section>

        <section className={styles.section}>
          <div className={`${styles.card} ${styles.urgentCard}`}>
            <p className={`${styles.badge} ${styles.badgeDanger}`}>Important boundary</p>
            <p className={styles.note}>Passage helps organize practical work, but it does not replace emergency services, medical care, legal advice, funeral-director judgment, government requirements, financial institutions, clergy, or local authorities.</p>
          </div>

          <div className={styles.grid} style={{ gap: 14, marginTop: 20 }}>
            {terms.map(([title, body]) => (
              <div className={styles.card} key={title}>
                <h2 className={styles.pathTitle}>{title}</h2>
                <p className={styles.note}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.card} style={{ maxWidth: 720 }}>
            <p className={styles.badge}>Need help with account, billing, or policy questions?</p>
            <p className={styles.note}>Use Contact so the request is captured and can be routed to support, billing, product, or policy review.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              <Link className={styles.button} href="/contact">Contact Passage</Link>
              <Link className={styles.buttonSecondary} href="/privacy">Privacy overview</Link>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Questions? <Link href="/contact">Contact Passage</Link> · <Link href="/privacy">Privacy</Link></p>
        </footer>
      </main>
    </TopShell>
  );
}
