import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "$5,000 Founding Pilot", description: "Test one power of attorney process with your team over 60 to 90 days.", alternates: { canonical: "/pilot" } };

export default function Pilot() {
  return <main className={styles.page}>
    <CommercialHeader />
    <section className={styles.hero}><p className={styles.eyebrow}>$5,000 founding pilot</p><h1>Test one New York power of attorney process with your team.</h1><p>Before you start, we agree what to test, which data you may use, who is responsible, and how to judge the results. We meet each week and write up what worked and what needs to change. If you continue, the pilot fee counts toward your first year.</p><Link className={styles.secondary} href="/contact">Discuss a founding pilot</Link></section>
    <div className={styles.content}>
      <section className={styles.grid3}><article className={styles.card}><span>Days 1 to 15</span><h2>Plan the trial</h2><p>Agree the rules, documents, people, systems, and checks needed for the trial.</p></article><article className={styles.card}><span>Days 16 to 60</span><h2>Try the requests</h2><p>Work through test requests and any approved pilot requests. Review progress and problems each week.</p></article><article className={styles.card}><span>Days 61 to 90</span><h2>Review the results</h2><p>Check how long requests take, where they get stuck, and whether people receive the right answer.</p></article></section>
      <section className={styles.callout}><div><h2>Experience the complete workflow.</h2><p>See how each person uses Passage, how the bank decides, and how later changes are recorded.</p></div><Link className={styles.cta} href="/contact">Book a walkthrough</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
