import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "./home.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const steps = [
  ["01", "Start the request", "Choose the people, accounts, actions, and documents your institution needs."],
  ["02", "Collect what is missing", "Each person gets a secure link and sees only the steps they need to complete."],
  ["03", "Review and decide", "Your team records the outcome. Everyone sees the same decision and later changes."],
];

export default function Home() {
  return (
    <main className={styles.page}>
      <CommercialHeader />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Power of attorney requests for financial institutions</p>
          <h1>Get every power of attorney request to a clear decision.</h1>
          <p className={styles.lede}>Passage guides the account holder, representative, and your review team through one shared process. Your institution makes the decision. Everyone sees the same current result.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/contact">Book a 20-minute walkthrough <span>→</span></Link>
            <Link className={styles.secondary} href="/start">Explore a sample workflow</Link>
          </div>
          <p className={styles.boundary}>Passage does not create a power of attorney or decide whether one is legally valid. Your institution keeps that responsibility.</p>
        </div>

        <div className={styles.transaction} aria-label="Sample power of attorney request">
          <div className={styles.transactionTop}>
            <div><span>Power of attorney request</span><strong>Eleanor Carter and Maya Carter</strong></div>
            <b>Ready for review</b>
          </div>
          <div className={styles.participants}>
            <div><i>EC</i><span><strong>Eleanor Carter</strong><small>Account holder · Confirmed</small></span></div>
            <div><i>MC</i><span><strong>Maya Carter</strong><small>Representative · Accepted</small></span></div>
          </div>
          <div className={styles.reviewCard}>
            <div><span>Permitted</span><strong>Statements and account-service discussions</strong></div>
            <div data-excluded="true"><span>Excluded</span><strong>Money movement and ownership changes</strong></div>
          </div>
          <div className={styles.requirements}>
            <div><span>POA document</span><b>Received</b></div>
            <div><span>Representative certification</span><b>Complete</b></div>
            <div><span>Institution review</span><b data-pending="true">Next</b></div>
          </div>
          <div className={styles.transactionFoot}><span><i /> Everyone sees the same decision</span><strong>Full history saved</strong></div>
        </div>
      </section>

      <section className={styles.focus} aria-label="Passage Authority focus">
        <p>Focused and ready to evaluate</p>
        <div><strong>Financial POA</strong><span>New York deposit-account servicing</span></div>
        <div><strong>Your institution decides</strong><span>Your requirements, reviewers, and final outcome</span></div>
        <div><strong>Easy for participants</strong><span>Secure links and one clear next step</span></div>
      </section>

      <section className={styles.flowSection} id="how-it-works">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>How it works</p>
          <h2>One request. One clear next step for everyone.</h2>
          <span>Each person sees what they need to do, what was saved, and what happens next.</span>
        </div>
        <ol className={styles.flow}>
          {steps.map(([number, title, description]) => (
            <li key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>
          ))}
        </ol>
      </section>

      <section className={styles.boundariesSection}>
        <div className={styles.boundaryPanel}>
          <p className={styles.eyebrow}>What Passage does</p>
          <h2>Makes the process easier to run.</h2>
          <ul>
            <li>Turns your requirements into a guided request and review checklist</li>
            <li>Preserves participant decisions and evidence history</li>
            <li>Records the institution&apos;s scoped result and next actions</li>
            <li>Keeps authorized people and connected systems up to date</li>
          </ul>
        </div>
        <div className={styles.boundaryPanel} data-muted="true">
          <p className={styles.eyebrow}>What Passage does not do</p>
          <h2>Make the institution&apos;s decision.</h2>
          <ul>
            <li>Does not create or notarize a power of attorney</li>
            <li>Does not declare a document legally valid</li>
            <li>Does not replace identity, legal, fraud, or policy review</li>
            <li>Does not grant account access or move customer funds</li>
          </ul>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p className={styles.eyebrow}>Interactive product evaluation</p>
          <h2>See the complete POA request from every side.</h2>
          <span>Use sample records to experience the institution, account holder, representative, reviewer, decision, and revocation steps.</span>
        </div>
        <div className={styles.ctaActions}>
          <Link className={styles.lightCta} href="/contact">Book a walkthrough</Link>
          <Link className={styles.textCta} href="/pricing">View pricing</Link>
        </div>
      </section>
      <CommercialFooter />
    </main>
  );
}
