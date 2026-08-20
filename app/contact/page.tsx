import { Suspense } from 'react';
import { TopShell } from '@/components/core';
import { ContactForm } from './ContactForm';
import styles from '@/components/marketing/MarketingPage.module.css';

export const metadata = { title: 'Contact' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ContactPage() {
  return (
    <TopShell mode="gateway" context="Contact">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Contact Passage</p>
          <h1>How can we help right now?</h1>
          <p className={styles.lede}>Use the form for support, billing, bugs, feature requests, or anything that can wait for a written reply.</p>
        </section>
        <section className={styles.section}>
          <div className={styles.card} style={{ maxWidth: 560, marginBottom: 20 }}>
            <p className={styles.note}><strong>Emergencies:</strong> contact local emergency services or the appropriate funeral, medical, legal, or government office directly.</p>
          </div>
          <Suspense fallback={null}>
            <ContactForm />
          </Suspense>
        </section>
      </main>
    </TopShell>
  );
}
