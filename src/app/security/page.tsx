import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Security and Boundaries", description: "Review Passage Authority controls, product boundaries, and production assurance requirements.", alternates: { canonical: "/security" } };

export default function Security() {
  return <main className={styles.page}>
    <CommercialHeader active="security" />
    <section className={styles.hero}><p className={styles.eyebrow}>Security and responsibility</p><h1>See what is protected today—and what must pass before a pilot.</h1><p>The evaluation uses synthetic data only. Before approved customer data is used, we agree the data boundary and provide evidence for access control, isolation, retention, recovery, incident response, and independent testing.</p></section>
    <div className={styles.content}>
      <section className={styles.grid2}>
        <article className={styles.card}><span>Built into each request</span><h2>Controls available today</h2><ul><li>Only authorized institution users or people with a valid role-bound request link can act</li><li>Every saved change is added to the activity history</li><li>Each person sees only what their role requires</li><li>Repeated submissions do not create duplicate actions</li><li>Failed email and system deliveries can be reviewed and retried</li></ul></article>
        <article className={styles.card}><span>Required before a production pilot</span><h2>Assurance still in progress</h2><ul><li>Production identity and organization-isolation review</li><li>Encryption and key-management review</li><li>Retention, deletion, backup, and recovery testing</li><li>Independent security assessment and penetration test</li><li>Vendor, incident, privacy, and legal reviews</li></ul></article>
      </section>
      <div className={styles.note}>Passage does not claim a certification, independent audit, or legal determination until it has been completed and can be supported with evidence.</div>
      <section className={styles.callout}><div><h2>Bring your security questions.</h2><p>We will show the current controls, evidence, open assurance work, and the boundary required before any approved pilot data is used.</p></div><Link className={styles.cta} href="/contact">Request a security review</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
