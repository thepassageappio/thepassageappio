import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Integrations", description: "Start a request in Passage or connect it to your institution's systems.", alternates: { canonical: "/integrations" } };

export default function Integrations() {
  return <main className={styles.page}>
    <CommercialHeader active="integrations" />
    <section className={styles.hero}><p className={styles.eyebrow}>Start hosted. Integrate when ready.</p><h1>Use Passage on its own or connect it to your systems.</h1><p>Begin with a hosted workflow. When you are ready, create requests from your own system and send decision updates back to it.</p></section>
    <div className={styles.content}>
      <div className={styles.flow}><div><b>1. Start</b><span>Create a request from a template.</span></div><div><b>2. Guide</b><span>Participants finish only their required steps.</span></div><div><b>3. Review</b><span>Your team applies your policy.</span></div><div><b>4. Decide</b><span>Return a scoped receipt.</span></div><div><b>5. Monitor</b><span>Send changes and revocation events.</span></div></div>
      <section className={styles.grid3} style={{marginTop: 16}}><article className={styles.card}><span>Hosted participant flow</span><h2>Send a secure link</h2><p>Participants complete their steps without installing software or creating a password.</p></article><article className={styles.card}><span>Institution workspace</span><h2>Review in one queue</h2><p>Your team sees missing information, completed reviews, decisions, limits, and later changes.</p></article><article className={styles.card}><span>Integration path</span><h2>API and webhooks</h2><p>Create requests from your system and receive signed updates when a request changes. A production quickstart is part of pilot readiness.</p><Link className={styles.secondary} href="/start">Try the hosted workflow</Link></article></section>
      <section className={styles.callout}><div><h2>One request stays in sync.</h2><p>See what participants submitted, what the institution decided, and what changed later.</p></div><Link className={styles.cta} href="/start">Explore the complete workflow</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
