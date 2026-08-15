import { TopShell } from '@/components/core';
import { GuideBrowser } from './GuideBrowser';
import styles from '@/components/marketing/MarketingPage.module.css';

export const metadata = { title: 'Guides' };

export default function GuidesPage() {
  return (
    <TopShell mode="gateway" context="Guides">
      <main id="main-content" className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Help guides</p>
          <h1>Pick the guide you need right now.</h1>
          <p className={styles.lede}>Practical, step-by-step guidance for the first hours, the first calls, and the first decisions.</p>
        </section>
        <section className={styles.section}>
          <GuideBrowser />
        </section>
      </main>
    </TopShell>
  );
}
