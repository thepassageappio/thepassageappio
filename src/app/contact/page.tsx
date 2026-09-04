import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Contact", description: "Request a Passage Authority demo, ask a product question, report a billing issue, or share a feature request.", alternates: { canonical: "/contact" } };

const contactHref = (subject: string) => `mailto:hello@thepassageapp.io?subject=${encodeURIComponent(subject)}`;

export default function ContactPage() {
  return <main className={styles.page}>
    <CommercialHeader />
    <section className={styles.hero}><p className={styles.eyebrow}>Talk with Passage</p><h1>Book a Passage Authority walkthrough.</h1><p>Tell us your institution, role, current POA process, and what you want to improve. Do not include customer information, account numbers, or legal documents.</p></section>
    <div className={styles.content}>
      <section className={styles.grid2}>
        <article className={styles.card}><span>See the product</span><h2>Request a 20-minute walkthrough</h2><p>See one POA request move from intake to a scoped institution decision while every participant stays current.</p><a className={styles.secondary} href={contactHref("Passage Authority 20-minute walkthrough")}>Request a walkthrough</a></article>
        <article className={styles.card}><span>Product question</span><h2>General inquiry</h2><p>Ask about the workflow, evaluation, pilot, security review, or integration path.</p><a className={styles.secondary} href={contactHref("Passage Authority inquiry")}>Email Passage</a></article>
        <article className={styles.card}><span>Account help</span><h2>Billing or access</h2><p>Get help with an institution workspace, evaluation access, pilot invoice, or account question.</p><a className={styles.secondary} href={contactHref("Passage Authority billing or access help")}>Request help</a></article>
        <article className={styles.card}><span>Help us improve</span><h2>Feature request</h2><p>Describe the role, current process, and outcome you need. Please use fictional examples only.</p><a className={styles.secondary} href={contactHref("Passage Authority feature request")}>Share an idea</a></article>
      </section>
      <section className={styles.callout}><div><h2>Prefer to explore first?</h2><p>Create a no-card evaluation workspace and use sample information to walk through the product.</p></div><Link className={styles.cta} href="/start">Start free</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
