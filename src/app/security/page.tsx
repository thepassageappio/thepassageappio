import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Security and Boundaries", description: "Review Passage Authority controls, product boundaries, and production assurance requirements.", alternates: { canonical: "/security" } };

export default function Security() {
  return <main className={styles.page}>
    <CommercialHeader active="security" />
    <section className={styles.hero}><p className={styles.eyebrow}>Trust is a product requirement</p><h1>Clear controls. Clear boundaries. No invented claims.</h1><p>Passage separates coordination from legal and institutional decision-making. Institutions define their requirements and retain the final decision. Passage records who acted, what was shared, and how authority changes.</p></section>
    <div className={styles.content}>
      <section className={styles.grid2}>
        <article className={styles.card}><span>Transaction controls</span><h2>Integrity by design</h2><ul><li>Every change requires an authenticated, authorized person</li><li>Each saved change includes a permanent activity record</li><li>People see only what their role requires</li><li>Repeated submissions cannot create duplicate actions</li><li>Failed deliveries can be reviewed and safely retried</li></ul></article>
        <article className={styles.card}><span>Enterprise assurance</span><h2>Production requirements</h2><ul><li>Tenant isolation and production identity providers</li><li>Encryption and key-management review</li><li>Retention, deletion, backup, and recovery controls</li><li>Independent security assessment and penetration testing</li><li>Vendor, incident, privacy, and legal reviews</li></ul></article>
      </section>
      <div className={styles.note}>Passage does not claim a certification, independent audit, or legal determination until it has been completed and can be supported with evidence.</div>
    </div>
    <CommercialFooter />
  </main>;
}
