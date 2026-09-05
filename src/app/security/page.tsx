import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Security and Boundaries", description: "Understand what a Passage secure link does, how identity checks remain separate, and what is required before a production pilot.", alternates: { canonical: "/security" } };

export default function Security() {
  return <main className={styles.page}>
    <CommercialHeader active="security" />
    <section className={styles.hero}><p className={styles.eyebrow}>Security in plain English</p><h1>A private link protects access. It does not prove identity.</h1><p>The institution must separately check the account holder and representative using its required identity process. The current Passage evaluation uses sample data only.</p></section>
    <div className={styles.content}>
      <section className={styles.grid2}>
        <article className={styles.card}><span>What the email link does</span><h2>Opens one person&apos;s part of one request.</h2><ul><li>The account holder and representative receive different links</li><li>Each link works once and expires</li><li>A fresh link turns every earlier link for that person off</li><li>Each person sees only the steps assigned to their role</li></ul></article>
        <article className={styles.card}><span>What the email link does not do</span><h2>It is not identity verification.</h2><ul><li>It does not prove the person&apos;s legal identity</li><li>It does not validate the power of attorney document</li><li>It does not approve the representative</li><li>It does not grant account credentials or permission to move money</li></ul></article>
        <article className={styles.card}><span>Built into each request</span><h2>Controls available today</h2><ul><li>Only authorized institution users or people with a current role-bound link can act</li><li>Every saved change is added to the activity history</li><li>Repeated submissions do not create duplicate actions</li><li>Failed email and system deliveries can be reviewed and retried</li></ul></article>
        <article className={styles.card}><span>Required before a production pilot</span><h2>Assurance still in progress</h2><ul><li>Production identity and organization-isolation review</li><li>Encryption and key-management review</li><li>Retention, deletion, backup, and recovery testing</li><li>Independent security assessment and penetration test</li><li>Vendor, incident, privacy, and legal reviews</li></ul></article>
      </section>
      <div className={styles.note}>Before a pilot with approved customer data, the institution and Passage must agree exactly how identity will be checked and complete the required security, legal, fraud, privacy, and operating review. Passage does not claim a completed certification, independent audit, or identity integration until it can be supported with evidence.</div>
      <section className={styles.callout}><div><h2>Bring your security questions.</h2><p>We will show the current controls, evidence, open assurance work, and the boundary required before any approved pilot data is used.</p></div><Link className={styles.cta} href="/contact">Request a security review</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
