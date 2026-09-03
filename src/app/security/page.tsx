import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Security and Boundaries", description: "Review Passage Authority controls, product boundaries, and production assurance requirements.", alternates: { canonical: "/security" } };

export default function Security() {
  return <main className={styles.page}>
    <CommercialHeader active="security" />
    <section className={styles.hero}><p className={styles.eyebrow}>Security and responsibility</p><h1>Protect each request without blurring who decides.</h1><p>Passage controls who can view and change a request, records what happened, and keeps later changes visible. Your institution sets its requirements and makes the final decision.</p></section>
    <div className={styles.content}>
      <section className={styles.grid2}>
        <article className={styles.card}><span>Built into each request</span><h2>Controls available today</h2><ul><li>Only signed-in, authorized people can make changes</li><li>Every saved change is added to the activity history</li><li>Each person sees only what their role requires</li><li>Repeated submissions do not create duplicate actions</li><li>Failed email and system deliveries can be reviewed and retried</li></ul></article>
        <article className={styles.card}><span>Required before a production pilot</span><h2>Assurance still in progress</h2><ul><li>Production identity and organization-isolation review</li><li>Encryption and key-management review</li><li>Retention, deletion, backup, and recovery testing</li><li>Independent security assessment and penetration test</li><li>Vendor, incident, privacy, and legal reviews</li></ul></article>
      </section>
      <div className={styles.note}>Passage does not claim a certification, independent audit, or legal determination until it has been completed and can be supported with evidence.</div>
    </div>
    <CommercialFooter />
  </main>;
}
