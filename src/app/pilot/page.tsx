import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "90-Day Pilot", description: "Prove one financial authority workflow with a named institution team in 90 days.", alternates: { canonical: "/pilot" } };

export default function Pilot() {
  return <main className={styles.page}>
    <CommercialHeader />
    <section className={styles.hero}><p className={styles.eyebrow}>Founding design-partner pilot</p><h1>Prove one authority transaction in 90 days.</h1><p>We configure one narrow policy with one named team, measure the full journey, and make a clear production decision from evidence.</p></section>
    <div className={styles.content}>
      <section className={styles.grid3}><article className={styles.card}><span>Days 1 to 15</span><h2>Define acceptance</h2><p>Agree policy, evidence, limits, participants, systems, security constraints, and success measures.</p></article><article className={styles.card}><span>Days 16 to 60</span><h2>Run controlled cases</h2><p>Complete test and approved pilot transactions with weekly review of completion, exceptions, and operations.</p></article><article className={styles.card}><span>Days 61 to 90</span><h2>Decide from proof</h2><p>Compare cycle time, handoffs, missing information, decision consistency, and downstream receipt accuracy.</p></article></section>
      <section className={styles.callout}><div><h2>Experience the complete workflow.</h2><p>Start as the institution, then move through every participant, reviewer, receipt, revocation, and integration state.</p></div><Link className={styles.cta} href="/start">Explore the product</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
