import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

export const metadata: Metadata = { title: "Resources", description: "Practical guidance for clearer financial power of attorney operations, decision receipts, and integration planning.", alternates: { canonical: "/resources" } };

const resources = [
  ["Operations", "A clearer operating model for financial POA requests", "How to separate participant input, document review, institution decisions, and later changes.", "/resources/financial-poa-operations"],
  ["Auditability", "What a useful authority decision receipt should show", "The details every permitted person and connected system should be able to reconcile.", "/resources/decision-receipts"],
  ["Integration", "Why hosted-first is the fastest path to a useful pilot", "Start with a complete workflow, then connect requests and updates to existing systems.", "/resources/hosted-first-integration"],
];

export default function ResourcesPage() {
  return <main className={styles.page}>
    <CommercialHeader />
    <section className={styles.hero}><p className={styles.eyebrow}>Passage resources</p><h1>Practical guidance for delegated-authority operations.</h1><p>Short, plain-language notes for operations, compliance, product, and technology teams improving how authority requests are handled.</p></section>
    <div className={styles.content}><section className={styles.grid3}>{resources.map(([type, title, description, href]) => <article className={styles.card} key={href}><span>{type}</span><h2>{title}</h2><p>{description}</p><Link className={styles.secondary} href={href}>Read article</Link></article>)}</section></div>
    <CommercialFooter />
  </main>;
}
