import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Integrations", description: "Start a request in Passage or connect it to your institution's systems.", alternates: { canonical: "/integrations" } };

export default function Integrations() {
  return <main className={styles.page}>
    <CommercialHeader active="integrations" />
    <section className={styles.hero}><p className={styles.eyebrow}>Start hosted. Connect when ready.</p><h1>Prove the workflow before changing your systems.</h1><p>Run the complete experience in Passage first. Then create requests from your system and return current decisions to it at two clear connection points.</p></section>
    <div className={styles.content}>
      <div className={styles.flow}><div><b>1. Start</b><span>Create a request from a template.</span></div><div><b>2. Guide</b><span>Participants finish only their required steps.</span></div><div><b>3. Review</b><span>Your team applies your policy.</span></div><div><b>4. Decide</b><span>Return a scoped receipt.</span></div><div><b>5. Monitor</b><span>Send changes and revocation events.</span></div></div>
      <section className={styles.grid3} style={{marginTop: 16}}><article className={styles.card}><span>Hosted participant flow</span><h2>Send a secure link</h2><p>Participants complete their steps without installing software or creating a password.</p></article><article className={styles.card}><span>Institution workspace</span><h2>Review in one queue</h2><p>Your team sees missing information, completed reviews, decisions, limits, and later changes.</p></article><article className={styles.card}><span>Connected workflow</span><h2>Connect two clear points</h2><p>Today, run the complete pilot in Passage. Before a live connection, we provide a sandbox example for creating a request and a signed update for reading current status.</p><Link className={styles.secondary} href="/resources/hosted-first-integration">Review the integration plan</Link></article></section>
      <section className={styles.grid2} style={{marginTop: 16}}>
        <article className={styles.card}><span>Your system sends</span><h2>A bounded request</h2><ul><li>Workflow and version</li><li>Participant contact details</li><li>Purpose and account reference</li><li>Requested actions and end date</li></ul></article>
        <article className={styles.card}><span>Passage returns</span><h2>A current result</h2><ul><li>Status and next required action</li><li>Institution decision and limits</li><li>Receipt reference</li><li>Later withdrawal, revocation, or expiration</li></ul></article>
      </section>
      <section className={styles.callout}><div><h2>One request stays in sync.</h2><p>Start with the hosted pilot. Add the smallest useful connection only after the workflow and ownership are proven.</p></div><Link className={styles.cta} href="/contact">Plan a demo</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
