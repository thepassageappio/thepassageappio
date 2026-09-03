import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Financial POA Templates", description: "Start a financial power of attorney request from a clear, institution-controlled workflow.", alternates: { canonical: "/templates" } };

export default function Templates() {
  return <main className={styles.page}>
    <CommercialHeader />
    <section className={styles.hero}><p className={styles.eyebrow}>Guided workflows</p><h1>Start with a clear process, not a blank screen.</h1><p>Each template turns your institution&apos;s requirements into one guided experience for account holders, representatives, and reviewers.</p></section>
    <div className={styles.content}>
      <section className={styles.grid2}>
        <article className={styles.card}><span>Available now</span><h2>New York financial POA</h2><p>For narrow deposit-account servicing. Includes scope confirmation, document review, representative certification, identity, address, institution review, decision receipt, revocation, and system updates.</p><Link className={styles.secondary} href="/start">Use this template</Link></article>
        <article className={styles.card} data-muted="true"><span>Design program</span><h2>Executor and trustee authority</h2><p>Evidence and acceptance workflows for estate and trust administration, designed with participating institutions and legal teams.</p></article>
        <article className={styles.card} data-muted="true"><span>Design program</span><h2>Business signing authority</h2><p>Portable organizational signing rights with explicit limits, expiration, revocation, and shared receipts.</p></article>
        <article className={styles.card} data-muted="true"><span>Partner-led roadmap</span><h2>Ownership and title transfer</h2><p>Peer-to-peer and institution-assisted handoffs, including vehicle title readiness, developed with registry and jurisdiction partners.</p></article>
      </section>
    </div>
    <CommercialFooter />
  </main>;
}
