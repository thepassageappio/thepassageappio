import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Integrations", description: "Connect participant guidance, institution review, decision receipts, and lifecycle updates.", alternates: { canonical: "/integrations" } };

export default function Integrations() {
  return <main className={styles.page}>
    <CommercialHeader active="integrations" />
    <section className={styles.hero}><p className={styles.eyebrow}>One transaction across every channel</p><h1>Meet customers in your experience or ours.</h1><p>Start in an institution workflow, guide participants through a hosted request, return a clear decision, and keep downstream systems current.</p></section>
    <div className={styles.content}>
      <div className={styles.flow}><div><b>1. Start</b><span>Create a request from a template.</span></div><div><b>2. Guide</b><span>Participants finish only their required steps.</span></div><div><b>3. Review</b><span>Your team applies your policy.</span></div><div><b>4. Decide</b><span>Return a scoped receipt.</span></div><div><b>5. Monitor</b><span>Send changes and revocation events.</span></div></div>
      <section className={styles.grid3} style={{marginTop: 16}}><article className={styles.card}><span>Hosted experience</span><h2>Passage Link</h2><p>A guided participant flow that can be launched from your servicing experience.</p></article><article className={styles.card}><span>Review operations</span><h2>Passage Console</h2><p>A policy-aware queue for requests, information gaps, decisions, limits, and lifecycle changes.</p></article><article className={styles.card}><span>Developer tools</span><h2>API and webhooks</h2><p>Create requests, read current receipts, observe signed events, and replay failed deliveries.</p><Link className={styles.secondary} href="/start">Open an evaluation workspace</Link></article></section>
      <section className={styles.callout}><div><h2>See the same record from every side.</h2><p>Follow participant actions, institution review, receipt state, and webhook delivery as one synchronized transaction.</p></div><Link className={styles.cta} href="/start">Explore the complete workflow</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
