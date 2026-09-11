import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Financial POA Templates", description: "Start a financial power of attorney request from a clear, institution-controlled workflow.", alternates: { canonical: "/templates" } };

export default function Templates() {
  return <main className={styles.page}>
    <CommercialHeader />
    <section className={styles.hero}><p className={styles.eyebrow}>Guided workflows</p><h1 id="page-content" tabIndex={-1}>Start with a ready-made checklist.</h1><p>A checklist shows each person what to do and helps the institution review the request.</p></section>
    <div className={styles.content}>
      <section className={styles.grid2}>
        <article className={styles.card}><span>Available now</span><h2>New York financial POA</h2><p>The current sample covers statement copies and account questions. Try the steps, review the documents, and see the saved decision and any later changes.</p><Link className={styles.secondary} href="/start">Use this template</Link></article>
        <article className={styles.card} data-muted="true"><span>Design program</span><h2>Executor and trustee authority</h2><p>Planned: help institutions review requests from people managing an estate or trust. Not available yet.</p></article>
        <article className={styles.card} data-muted="true"><span>Design program</span><h2>Business signing authority</h2><p>Planned: record who can sign for a business, what they can sign, and when that permission ends. Not available yet.</p></article>
        <article className={styles.card} data-muted="true"><span>Partner-led roadmap</span><h2>Ownership and title transfer</h2><p>Future idea: help people prepare ownership transfers, such as a vehicle title change. Not available yet.</p></article>
      </section>
    </div>
    <CommercialFooter />
  </main>;
}
