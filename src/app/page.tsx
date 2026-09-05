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
          <h1>Help a financial institution handle a power of attorney.</h1>
          <p className={styles.lede}>If you help a parent or grandparent manage money, Passage gives you, the account holder, and the financial institution one clear process. The institution checks who is involved, reviews the power of attorney, decides what you may do, and shares the answer.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/contact">Book a 20-minute walkthrough <span>→</span></Link>
            <Link className={styles.secondary} href="/start">Explore a sample workflow</Link>
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
            <div><span>Permitted</span><strong>Statements and account-service discussions</strong></div>
            <div data-excluded="true"><span>Excluded</span><strong>Money movement and ownership changes</strong></div>
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
          <h2>From “Can you talk to me?” to a clear answer.</h2>
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
          <p className={styles.eyebrow}>Interactive product evaluation</p>
          <h2>See exactly how the request ends.</h2>
          <span>Use sample information to walk through the institution, account holder, representative, review, decision receipt, and later-change steps.</span>
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
