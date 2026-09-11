import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "./home.module.css";
import clarity from "./home-clarity.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const steps = [
  ["01", "The institution starts", "A bank or credit union enters the two people, the account, and what the representative needs to do."],
  ["02", "Each person confirms", "The account holder and representative use separate private links to review the same request and complete their part."],
  ["03", "The institution checks", "The institution uses its own identity, document, fraud, legal, and policy checks before making a decision."],
  ["04", "Everyone gets the answer", "The institution accepts, limits, or rejects the request. Passage shares a receipt showing exactly what it decided."],
];

export default function Home() {
  return (
    <main className={styles.page}>
      <CommercialHeader />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>A clear path for financial power of attorney</p>
          <h1 id="page-content" tabIndex={-1}>A clear way to ask a bank for help with someone else’s account.</h1>
          <p className={styles.lede}>Helping a parent or grandparent with their bank account? Passage keeps the request, documents, and bank’s answer in one place. The bank checks the details and decides what you can do.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/contact">Book a 20-minute walkthrough <span>→</span></Link>
            <Link className={styles.secondary} href="/sample">Try an example</Link>
          </div>
          <p className={styles.boundary}>Passage keeps the request moving. It does not verify identity, approve the power of attorney, grant account access, or move money. The financial institution keeps those responsibilities.</p>
        </div>

        <div className={styles.transaction} aria-label="Completed example power of attorney request">
          <div className={styles.transactionTop}>
            <div><span>Completed example</span><strong>Eleanor Carter and Maya Carter</strong></div>
            <b className={clarity.completeBadge}>Accepted with limits</b>
          </div>
          <div className={styles.participants}>
            <div><i>EC</i><span><strong>Eleanor Carter</strong><small>Account holder · Identity checked</small></span></div>
            <div><i>MC</i><span><strong>Maya Carter</strong><small>Representative · Identity checked</small></span></div>
          </div>
          <div className={styles.reviewCard}>
            <div><span>Permitted</span><strong>Get statement copies and ask account questions</strong></div>
            <div data-excluded="true"><span>Not included in this example</span><strong>Move money or change who owns the account</strong></div>
          </div>
          <div className={styles.requirements}>
            <div><span>POA document</span><b>Reviewed</b></div>
            <div><span>Institution checks</span><b>Complete</b></div>
            <div><span>Institution decision</span><b>Recorded</b></div>
          </div>
          <div className={styles.transactionFoot}><span><i /> Decision receipt shared</span><strong>Full history saved</strong></div>
        </div>
      </section>

      <section className={styles.focus} aria-label="Passage Authority focus">
        <p>The simple version</p>
        <div><strong>A real-life use case</strong><span>Help a parent or grandparent work with their financial institution</span></div>
        <div><strong>The institution stays in charge</strong><span>Its identity checks, document review, and final decision</span></div>
        <div><strong>A clear ending</strong><span>One receipt shows what the representative may and may not do</span></div>
      </section>

      <section className={styles.flowSection} id="how-it-works">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>How it works</p>
          <h2>Know what to do at each step.</h2>
          <span>Today, the financial institution starts the Passage request and invites each person. Passage does not let someone approve their own authority.</span>
        </div>
        <ol className={`${styles.flow} ${clarity.flowFour}`}>
          {steps.map(([number, title, description]) => (
            <li key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>
          ))}
        </ol>
      </section>

      <section className={styles.boundariesSection}>
        <div className={styles.boundaryPanel}>
          <p className={styles.eyebrow}>What Passage does</p>
          <h2>Keeps everyone on the same page.</h2>
          <ul>
            <li>Gives the account holder and representative separate, private steps</li>
            <li>Shows the institution what is still missing</li>
            <li>Records exactly what the institution accepts, limits, or rejects</li>
            <li>Shares the same current decision with the people allowed to see it</li>
          </ul>
        </div>
        <div className={styles.boundaryPanel} data-muted="true">
          <p className={styles.eyebrow}>What Passage does not do</p>
          <h2>Make the institution&apos;s decision.</h2>
          <ul>
            <li>Does not create or notarize a power of attorney</li>
            <li>Does not declare a document legally valid</li>
            <li>Does not perform or replace identity, legal, fraud, or policy review</li>
            <li>Does not grant account access or move customer funds</li>
          </ul>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p className={styles.eyebrow}>Try it with sample details</p>
          <h2>See exactly how the request ends.</h2>
          <span>Follow an example from the first request to the bank’s answer. See what each person needs to do.</span>
        </div>
        <div className={styles.ctaActions}>
          <Link className={styles.lightCta} href="/contact">Book a walkthrough</Link>
          <Link className={styles.textCta} href="/sample">Explore the sample</Link>
          <Link className={styles.textCta} href="/pricing">View pricing</Link>
        </div>
      </section>
      <CommercialFooter />
    </main>
  );
}
