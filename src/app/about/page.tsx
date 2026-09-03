import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "About", description: "Why Passage Authority is building a simpler way for financial institutions to handle delegated-authority requests.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <main className={styles.page}>
    <CommercialHeader active="about" />
    <section className={styles.hero}><p className={styles.eyebrow}>Why Passage Authority</p><h1>Delegated authority should be easier to understand and safer to operate.</h1><p>Power of attorney requests often move through branches, inboxes, documents, and disconnected review teams. Passage gives every person one clear path while the institution keeps control of its requirements and final decision.</p></section>
    <div className={styles.content}>
      <section className={styles.grid3}>
        <article className={styles.card}><span>Simple for people</span><h2>One next step</h2><p>Account holders and representatives use secure links, see plain-language boundaries, and complete only the work assigned to them.</p></article>
        <article className={styles.card}><span>Clear for institutions</span><h2>One review record</h2><p>Operations teams see what is missing, what was reviewed, what was decided, and what changed later.</p></article>
        <article className={styles.card}><span>Ready to connect</span><h2>One current result</h2><p>Hosted workflows come first. APIs and signed webhooks can keep servicing systems current as an institution integrates.</p></article>
      </section>
      <section className={styles.callout}><div><h2>We are starting narrow on purpose.</h2><p>The first workflow is New York financial power of attorney for deposit-account servicing. We will earn the right to expand by making this experience work completely.</p></div><Link className={styles.cta} href="/start">Try the workflow</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
