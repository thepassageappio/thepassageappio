import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";

const articles = {
  "financial-poa-operations": {
    title: "A clearer operating model for financial POA requests",
    description: "Separate what each person supplies from what the institution reviews and decides.",
    sections: [
      ["Start with one shared request", "Name the account holder, representative, purpose, affected account relationship, requested actions, exclusions, and end date before anything is sent. This gives every later step the same boundary."],
      ["Keep different decisions separate", "An identity result says who someone appears to be. A document review records what was examined. A representative chooses whether to accept responsibility. The institution alone records what it will accept."],
      ["Make the next action obvious", "Each person should see the current status, what they need to do, what will be saved, who can see it, and how to recover. Long activity histories should support the task rather than obscure it."],
      ["Preserve later changes", "A revocation, withdrawal, or expiration should update the current status without rewriting the original decision. That distinction makes the record easier to operate and explain."],
    ],
  },
  "decision-receipts": {
    title: "What a useful authority decision receipt should show",
    description: "A receipt should answer what was decided, for whom, within which boundaries, and whether it is still current.",
    sections: [
      ["The exact people and purpose", "Identify the account holder, representative, institution, purpose, account relationship, and request end date in language a person can recognize."],
      ["Accepted actions and limits", "Show only what the institution accepted. Place limits beside the accepted actions so a reader does not mistake a partial acceptance for a broad grant."],
      ["The institution's reason", "Record a short explanation of the institution's decision and when an authorized reviewer saved it. Do not imply that the software supplied a legal opinion."],
      ["Current status and verification", "Show revocation or expiration separately from the original decision. Keep hashes and record versions available for verification, but behind a secondary details control for people who need them."],
    ],
  },
  "hosted-first-integration": {
    title: "Why hosted-first is the fastest path to a useful pilot",
    description: "Prove the full customer and reviewer experience before spreading unfinished logic across existing systems.",
    sections: [
      ["Prove the workflow first", "A hosted experience lets the institution test people, requirements, exceptions, decisions, and recovery as one complete story before committing integration resources."],
      ["Connect at stable boundaries", "Once the workflow is understood, an API can create the request and a signed webhook can return status changes and the current receipt. The institution does not need to rebuild the participant experience."],
      ["Make the sandbox realistic", "Use explicit sample data, separate test and production environments, copyable requests, example responses, signed event examples, retry guidance, and a quickstart that reaches a completed request."],
      ["Measure time to value", "Track time to the first sent request and the first completed receipt. A simple integration claim is credible only when a new technical user can reproduce it."],
    ],
  },
} as const;

type Slug = keyof typeof articles;

export function generateStaticParams() { return Object.keys(articles).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug as Slug];
  return article ? { title: article.title, description: article.description, alternates: { canonical: `/resources/${slug}` } } : {};
}

export default async function ResourceArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug as Slug];
  if (!article) notFound();
  return <main className={styles.page}>
    <CommercialHeader />
    <section className={styles.hero}><p className={styles.eyebrow}>Passage field note</p><h1>{article.title}</h1><p>{article.description}</p></section>
    <div className={styles.content}>
      <section className={styles.grid2}>{article.sections.map(([title, body]) => <article className={styles.card} key={title}><h2>{title}</h2><p>{body}</p></article>)}</section>
      <section className={styles.callout}><div><h2>See the workflow in practice.</h2><p>Use sample information to experience the request from the institution and participant sides.</p></div><Link className={styles.cta} href="/start">Try Passage free</Link></section>
    </div>
    <CommercialFooter />
  </main>;
}
