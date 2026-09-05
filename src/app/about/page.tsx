import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";
import plain from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "In plain English: Passage Authority helps people and financial institutions complete and decide a financial power of attorney request.",
  alternates: { canonical: "/about" },
};

const steps = [
  ["1", "The institution starts the request", "It enters the account holder, the representative, the account involved, and what the representative wants to do."],
  ["2", "Each person confirms their part", "The account holder and representative receive different private links. Each sees only the questions meant for them."],
  ["3", "The institution performs its checks", "The institution follows its own process to check identity, review the power of attorney, and apply legal, fraud, and account rules."],
  ["4", "The institution gives an answer", "It accepts the request, accepts it with limits, or rejects it. Passage shares a receipt showing the decision."],
] as const;

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <CommercialHeader active="about" />
      <section className={`${styles.hero} ${plain.hero}`}>
        <p className={styles.eyebrow}>Passage in plain English</p>
        <h1>Passage helps a financial institution decide who may help with someone else&apos;s account.</h1>
        <p>A power of attorney may name the helper, but the financial institution still has work to do. Passage puts the people, documents, checks, questions, and final answer in one clear process.</p>
      </section>

      <div className={`${styles.content} ${plain.content}`}>
        <section className={plain.story} aria-labelledby="simple-example">
          <div>
            <p className={styles.eyebrow}>A simple example</p>
            <h2 id="simple-example">Maya helps her grandmother Eleanor manage her bank account.</h2>
          </div>
          <div>
            <p>Eleanor has a power of attorney that names Maya. That document does not automatically make Maya known to the bank or give her online access.</p>
            <p>If the bank uses Passage, the bank starts a request and invites both women. The bank checks who they are, reviews the document, decides whether it will recognize Maya, and records exactly what Maya may do.</p>
            <p><strong>That is the purpose of Passage:</strong> get a real power of attorney request from “Who are you, and what are you allowed to do?” to one clear institution decision.</p>
          </div>
        </section>

        <section className={plain.process} aria-labelledby="process-heading">
          <div className={plain.sectionHeading}>
            <p className={styles.eyebrow}>How it works today</p>
            <h2 id="process-heading">Four steps from request to answer</h2>
          </div>
          <ol>
            {steps.map(([number, title, description]) => (
              <li key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></li>
            ))}
          </ol>
        </section>

        <section className={styles.grid2} aria-label="Important boundaries">
          <article className={styles.card}>
            <span>Who starts it?</span>
            <h2>The institution starts the Passage request today.</h2>
            <p>You or your grandmother cannot use Passage by yourselves to force a bank to recognize a power of attorney. The bank or credit union must choose to use Passage and still makes its own decision.</p>
          </article>
          <article className={styles.card}>
            <span>How is identity checked?</span>
            <h2>The institution uses its required identity process.</h2>
            <p>A Passage link protects access to one person&apos;s part of a request. It is not, by itself, proof of identity. In a pilot, the institution must choose and complete its required customer and representative identity checks before accepting a request.</p>
          </article>
          <article className={styles.card}>
            <span>What does “finished” mean?</span>
            <h2>A decision receipt shows the result.</h2>
            <p>The receipt shows the people, account boundary, accepted actions, limits, decision reason, date, and current status. It can later show that the authority ended or changed.</p>
          </article>
          <article className={styles.card}>
            <span>What does Passage not do?</span>
            <h2>Passage does not approve anyone.</h2>
            <p>It does not create a power of attorney, decide that a document is legally valid, verify identity, grant account credentials, change ownership, or move money.</p>
          </article>
        </section>

        <section className={styles.callout}>
          <div><h2>See the whole example, not just a screen.</h2><p>Walk through the account holder, representative, institution review, final decision receipt, and later-change steps with sample information.</p></div>
          <Link className={styles.cta} href="/start">Try the sample workflow</Link>
        </section>
      </div>
      <CommercialFooter />
    </main>
  );
}
