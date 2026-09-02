import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "./home.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const steps = [
  ["01", "Define the request", "Choose the policy, people, account boundary, permitted actions, and required evidence."],
  ["02", "Guide each person", "Give the account holder and representative a secure path with one clear next step at a time."],
  ["03", "Decide and stay current", "Record the institution’s scoped decision, share one receipt, and preserve later changes."],
];

export default function Home() {
  return (
    <main className={styles.page}>
      <CommercialHeader />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Financial POA operations for regional institutions</p>
          <h1>Turn a power of attorney request into a clear, scoped institution decision.</h1>
          <p className={styles.lede}>Passage guides account holders, representatives, and review teams through one policy-controlled transaction. Your institution decides. Everyone sees the same current result.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/start">Start an Authority evaluation <span>→</span></Link>
            <Link className={styles.secondary} href="#how-it-works">See how it works</Link>
          </div>
          <p className={styles.boundary}>Passage does not create a power of attorney or determine legal validity. It makes an institution&apos;s intake, review, decision, and lifecycle process operational.</p>
        </div>

        <div className={styles.transaction} aria-label="Sample power of attorney request">
          <div className={styles.transactionTop}>
            <div><span>Authority request</span><strong>PA-8BCADF1416</strong></div>
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
          <div className={styles.transactionFoot}><span><i /> Current status shared by permission</span><strong>Complete activity history</strong></div>
        </div>
      </section>

      <section className={styles.focus} aria-label="Passage Authority focus">
        <p>One narrow workflow, fully operational</p>
        <div><strong>Financial POA</strong><span>New York deposit-account servicing</span></div>
        <div><strong>Institution controlled</strong><span>Your policy, reviewers, and final decision</span></div>
        <div><strong>Participant ready</strong><span>Hosted paths with no software training</span></div>
      </section>

      <section className={styles.flowSection} id="how-it-works">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>One governed transaction</p>
          <h2>Simple for people. Precise for institutions.</h2>
          <span>Every participant sees only what they need, what happens next, and the same current result.</span>
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
          <h2>Operationalizes acceptance.</h2>
          <ul>
            <li>Turns policy into a guided request and reviewer checklist</li>
            <li>Preserves participant decisions and evidence history</li>
            <li>Records the institution&apos;s scoped result and next actions</li>
            <li>Keeps permitted people and connected systems current</li>
          </ul>
        </div>
        <div className={styles.boundaryPanel} data-muted="true">
          <p className={styles.eyebrow}>What Passage does not do</p>
          <h2>Replace institutional judgment.</h2>
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
          <p className={styles.eyebrow}>Available product workflow</p>
          <h2>See financial POA acceptance from every side.</h2>
          <span>Explore the institution, account holder, representative, reviewer, receipt, and lifecycle experience using sample records.</span>
        </div>
        <div className={styles.ctaActions}>
          <Link className={styles.lightCta} href="/start">Explore the product</Link>
          <Link className={styles.textCta} href="/pricing">View pricing</Link>
        </div>
      </section>
      <CommercialFooter />
    </main>
  );
}
