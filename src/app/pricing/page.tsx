import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Pricing", description: "Evaluate Passage Authority free, prove operational fit in a focused pilot, then scale institution-wide.", alternates: { canonical: "/pricing" } };

export default function Pricing() {
  return <main className={styles.page}>
    <CommercialHeader active="pricing" />
    <section className={styles.hero}><p className={styles.eyebrow}>A clear path to production</p><h1>Start with five transactions. Prove fit. Scale with confidence.</h1><p>No card is required to start. Move from a controlled evaluation to a focused pilot and an enterprise relationship.</p></section>
    <div className={styles.content}>
      <section className={styles.pricing}>
        <article className={styles.tier}><span>Try us free</span><h2>Evaluation</h2><div className={styles.price}>$0</div><p>Run five authority transactions over 10 days. The clock starts with the first activated request.</p><ul><li>No card required</li><li>Financial POA workflow</li><li>Decision receipts and delivery history</li></ul><Link className={styles.secondary} href="/start">Start free</Link></article>
        <article className={styles.tier} data-featured="true"><span>Prove operational fit</span><h2>90-day pilot</h2><div className={styles.price}>$15,000 <small>credited toward year one</small></div><p>Configure one institution workflow and prove agreed outcomes with a named implementation team.</p><ul><li>Policy and workflow configuration</li><li>Implementation and review support</li><li>Success evidence and executive readout</li></ul><Link className={styles.secondary} href="/pilot">Review pilot</Link></article>
        <article className={styles.tier}><span>Enterprise relationship</span><h2>Institution</h2><div className={styles.price}>From $36,000 <small>per year</small></div><p>Annual platform access with usage aligned to transaction volume and required services.</p><ul><li>Hosted and embedded flows</li><li>Review operations and policy controls</li><li>API, webhooks, and lifecycle monitoring</li></ul></article>
      </section>
      <div className={styles.note}>Enterprise pricing depends on transaction volume, security requirements, integrations, implementation scope, and support commitments.</div>
    </div>
    <CommercialFooter />
  </main>;
}
