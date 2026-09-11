import Link from "next/link";
import type { Metadata } from "next";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "./faq.module.css";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Clear answers about Passage Authority, financial power of attorney operations, organization setup, roles, security boundaries, evaluations, and pilots.",
  alternates: { canonical: "/faq" },
};

const roles = [
  ["Owner", "Manages the organization, team access, requests, settings, billing, and records."],
  ["Administrator", "Manages daily work and billing. Cannot change owners or add administrators."],
  ["Staff", "Prepares and sends requests. Cannot make decisions or manage access and billing."],
  ["Reviewer", "Reviews evidence, asks for corrections, and records the institution’s decision."],
  ["Auditor", "Can view requests, receipts, access history, billing, and system connections. Cannot change them."],
] as const;

export default function FaqPage() {
  return (
    <main className={styles.page}>
      <CommercialHeader />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Frequently asked questions</p>
        <h1 id="page-content" tabIndex={-1}>Plain answers about what Passage does.</h1>
        <p>Start with the real-life use case, then see how identity checks, institution decisions, organizations, roles, and the current evaluation work.</p>
        <nav className={styles.jumpLinks} aria-label="FAQ topics">
          <a href="#product">Product</a>
          <a href="#responsibility">Responsibility</a>
          <a href="#organization">Organizations and roles</a>
          <a href="#evaluation">Evaluation and pilots</a>
        </nav>
      </section>

      <div className={styles.content}>
        <section className={styles.topic} id="product" aria-labelledby="product-heading">
          <div className={styles.topicIntro}>
            <p>01 · Product</p>
            <h2 id="product-heading">What Passage is and why it matters</h2>
          </div>
          <div className={styles.questions}>
            <article>
              <h3>What is Passage Authority?</h3>
              <p>Passage helps an account holder, the person helping them, and a financial institution complete one power of attorney request. It keeps the questions, documents, checks, institution decision, and current result in one place.</p>
            </article>
            <article>
              <h3>Is this for me if I am my grandmother&apos;s power of attorney?</h3>
              <p><strong>That is a core example.</strong> If her bank or credit union uses Passage, the institution starts a request and invites both of you. Your grandmother confirms the request, you complete the representative steps, and the institution decides whether it will recognize the power of attorney and what it will let you do. You cannot use Passage alone to make a bank accept it.</p>
            </article>
            <article>
              <h3>Why is this important?</h3>
              <p>These requests can move through branches, inboxes, documents, and disconnected teams. That makes it harder to know what is missing, what was decided, which actions are permitted, and whether something changed later. Passage creates one reviewable record and one current result without taking the decision away from the institution.</p>
            </article>
            <article>
              <h3>Who is Passage for?</h3>
              <p>Bank and credit union teams use the workspace to prepare and review requests. Account holders and the people helping them use separate links for their own steps.</p>
            </article>
            <article>
              <h3>What is the current product focus?</h3>
              <p>The sample covers a New York power of attorney request for statement copies and account questions. It uses made-up details so you can try the full process.</p>
            </article>
          </div>
        </section>

        <section className={styles.topic} id="responsibility" aria-labelledby="responsibility-heading">
          <div className={styles.topicIntro}>
            <p>02 · Responsibility</p>
            <h2 id="responsibility-heading">What Passage does—and does not decide</h2>
          </div>
          <div className={styles.questions}>
            <article>
              <h3>Does Passage decide whether a power of attorney is legally valid?</h3>
              <p><strong>No.</strong> Passage organizes the request and evidence for review. The receiving institution applies its legal, fraud, identity, risk, and policy requirements and records its own decision.</p>
            </article>
            <article>
              <h3>How does the institution know the people are who they say they are?</h3>
              <p>The institution must use its own required identity process for the account holder and representative. A Passage email link gives one person access to one role in one request; it is not, by itself, proof of identity. The current evaluation demonstrates the workflow with sample data. Identity verification must be selected, integrated, and approved with an institution before customer data is used.</p>
            </article>
            <article>
              <h3>Does Passage grant account access or move money?</h3>
              <p><strong>No.</strong> Passage does not create or notarize a power of attorney, grant credentials, change ownership, open credit, or move funds. A recorded decision tells permitted people and connected systems what the institution decided; it is not itself account access.</p>
            </article>
            <article>
              <h3>What can each person see?</h3>
              <p>Each person gets their own steps and information. Staff access depends on their assigned role. Removing a team member’s access stops them from using the workspace.</p>
            </article>
            <article>
              <h3>What record is kept?</h3>
              <p>Passage saves what happened and when. A receipt shows the people, requested actions, the institution’s answer, and any limits or later changes.</p>
            </article>
            <article>
              <h3>What does a completed request look like?</h3>
              <p>The institution records one of three outcomes: accepted, accepted with limits, or rejected. The receipt shows the people, account boundary, requested and accepted actions, limits, reason, decision date, and whether the result later changed or ended. The receipt records the institution&apos;s answer; it does not itself create login access or move money.</p>
            </article>
            <article>
              <h3>Why would an emailed secure link stop working?</h3>
              <p>Participant links are one-time and expire. When the institution sends a fresh link, every earlier link for that person stops working. Open the newest Passage email. If that link also fails, ask the institution to send another.</p>
            </article>
          </div>
        </section>

        <section className={styles.topic} id="organization" aria-labelledby="organization-heading">
          <div className={styles.topicIntro}>
            <p>03 · Team setup</p>
            <h2 id="organization-heading">Organizations, users, roles, and permissions</h2>
          </div>
          <div className={styles.questions}>
            <article>
              <h3>How does an organization create its Passage workspace?</h3>
              <p>Someone with permission to try Passage signs in with a work email. They add the organization’s details, accept the terms, and choose the sample checklist. They become the workspace owner.</p>
            </article>
            <article>
              <h3>Can the organization add users and control their access?</h3>
              <p><strong>Yes.</strong> An owner or administrator can invite a specific work email and choose an allowed role. Invitations expire after seven days and can be revoked. Authorized managers can later change a role or revoke access, and those changes are preserved in the organization’s access history.</p>
            </article>
            <article className={styles.roleAnswer}>
              <h3>Which roles are available?</h3>
              <dl className={styles.roleList}>
                {roles.map(([role, access]) => (
                  <div key={role}><dt>{role}</dt><dd>{access}</dd></div>
                ))}
              </dl>
            </article>
            <article>
              <h3>Can an institution separate request operations from approval?</h3>
              <p><strong>Yes.</strong> Staff can prepare and activate requests without deciding them. Reviewers can review evidence, request corrections, and record decisions without creating requests or managing team access. Owners and administrators have broader responsibilities for supervised evaluation.</p>
            </article>
            <article>
              <h3>Is this ready for approved customer data?</h3>
              <p>No. Use made-up details in the current trial. Before using customer data, Passage and your institution must agree what data is allowed and complete the required legal, privacy, security, and recovery checks.</p>
            </article>
          </div>
        </section>

        <section className={styles.topic} id="evaluation" aria-labelledby="evaluation-heading">
          <div className={styles.topicIntro}>
            <p>04 · Getting started</p>
            <h2 id="evaluation-heading">Trying Passage and planning a pilot</h2>
          </div>
          <div className={styles.questions}>
            <article>
              <h3>Can I try the complete workflow?</h3>
              <p><strong>Yes.</strong> Use sample details to try each person’s steps and see the final answer. No card is needed. Do not enter real customer details.</p>
            </article>
            <article>
              <h3>How does Passage connect to existing systems?</h3>
              <p>Start by using Passage on its own. We can then plan how your system sends requests and receives updates. Your technical team can review the API and signed update messages.</p>
            </article>
            <article>
              <h3>How is Passage priced?</h3>
              <p>Try five sample requests free over 10 days. A paid pilot costs $5,000 and lasts 60 to 90 days. That fee counts toward year one if you continue. Ongoing pricing depends on what your institution needs. Account holders and representatives do not pay.</p>
            </article>
            <article>
              <h3>What is the best next step?</h3>
              <p>Book a 20-minute walkthrough, or try the example first. Tell us what your team needs help with.</p>
              <div className={styles.answerActions}>
                <Link href="/contact">Book a walkthrough</Link>
                <Link href="/sample">Try the example</Link>
              </div>
            </article>
          </div>
        </section>

        <aside className={styles.help} aria-label="More help">
          <div><p className={styles.eyebrow}>Still have a question?</p><h2>Tell us what you need help with.</h2><span>We will answer plainly, show the current product, and separate what works today from what must be completed before a pilot.</span></div>
          <Link href="/contact">Ask Passage</Link>
        </aside>
      </div>

      <CommercialFooter />
    </main>
  );
}
