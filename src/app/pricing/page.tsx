import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Pricing", description: "Try Passage free with sample details, then plan a paid trial with your institution.", alternates: { canonical: "/pricing" } };

export default function Pricing() {
  return <main className={styles.page}>
    <CommercialHeader active="pricing" />
    <section className={styles.hero}><p className={styles.eyebrow}>A clear path to production</p><h1>Try it free. Test it with your team for $5,000.</h1><p>Start with sample requests. No card needed. If it fits your needs, plan a paid trial with your team.</p></section>
    <div className={styles.content}>
      <section className={styles.pricing}>
        <article className={styles.tier}><span>Try us free</span><h2>Evaluation</h2><div className={styles.price}>$0</div><p>Run five sample requests over 10 days. The clock starts when you send the first request.</p><ul><li>No card required</li><li>Complete financial POA workflow</li><li>Decision receipts and activity history</li></ul><Link className={styles.secondary} href="/start">Start free</Link></article>
        <article className={styles.tier} data-featured="true"><span>Prove operational fit</span><h2>Founding pilot</h2><div className={styles.price}>$5,000 <small>credited toward year one</small></div><p>Test one agreed process with your team over 60 to 90 days. Decide what success looks like before you start.</p><ul><li>Policy and workflow configuration</li><li>Implementation and review support</li><li>Success evidence and executive readout</li></ul><Link className={styles.secondary} href="/pilot">Review pilot</Link></article>
        <article className={styles.tier}><span>Scale after proof</span><h2>Institution</h2><div className={styles.price}>Custom</div><p>Set ongoing pricing from request volume, workflow needs, integrations, and support.</p><ul><li>Hosted and embedded flows</li><li>Review operations and policy controls</li><li>API, webhooks, and change monitoring</li></ul></article>
      </section>
      <div className={styles.note}>Ongoing pricing is set after the pilot from transaction volume, security requirements, integrations, implementation scope, and support commitments.</div>
    </div>
    <CommercialFooter />
  </main>;
}
