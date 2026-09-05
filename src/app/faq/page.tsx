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
  ["Owner", "Full organization, team, request, policy, billing, integration, and audit control."],
  ["Administrator", "Runs day-to-day access, requests, decisions, billing, and audit without controlling owners or adding administrators."],
  ["Staff", "Creates and coordinates requests without deciding them or managing access and billing."],
  ["Reviewer", "Reviews evidence, asks for corrections, and records the institution’s decision."],
  ["Auditor", "Has read-only visibility into requests, receipts, access history, billing, and integrations."],
  ["Developer", "Manages integrations without participant-request or billing access."],
] as const;

export default function FaqPage() {
  return (
    <main className={styles.page}>
      <CommercialHeader />

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Frequently asked questions</p>
        <h1>Plain answers about what Passage does.</h1>
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
              <p>The institution workspace is designed for operations, review, compliance, technology, audit, and accountable leaders. Account holders and representatives use focused, role-bound steps rather than the institution workspace.</p>
            </article>
            <article>
              <h3>What is the current product focus?</h3>
              <p>The controlled evaluation focuses on New York financial power of attorney for deposit-account servicing. We are starting with a narrow workflow so its responsibilities, exceptions, decisions, and later changes can be demonstrated end to end.</p>
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
              <p>Account holders and representatives receive separate role-bound experiences with only the steps and information they need. Institution users see the workspace capabilities assigned to their organization role. Revoking a team member’s access removes their organization access.</p>
            </article>
            <article>
              <h3>What record is kept?</h3>
              <p>Saved actions are added to an ordered activity history. The resulting decision receipt describes the participants, request scope, institution outcome, limits, and current status so permitted people and systems can reconcile the same result.</p>
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
            <p>03 · Enterprise setup</p>
            <h2 id="organization-heading">Organizations, users, roles, and permissions</h2>
          </div>
          <div className={styles.questions}>
            <article>
              <h3>How does an organization create its Passage workspace?</h3>
              <p>An authorized evaluator signs in with a work email, records the organization’s legal and participant-facing names, organization type, domain, and operating address, accepts the evaluation terms, and selects the workflow policy. That first accountable user becomes the organization owner.</p>
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
              <p>Not by default. The current evaluation uses synthetic data only. Before an approved controlled-data pilot, the institution and Passage must agree the data boundary and complete the required identity, access, isolation, retention, recovery, incident, privacy, vendor, and independent security reviews.</p>
            </article>
          </div>
        </section>

        <section className={styles.topic} id="evaluation" aria-labelledby="evaluation-heading">
          <div className={styles.topicIntro}>
            <p>04 · Getting started</p>
            <h2 id="evaluation-heading">Evaluation, integrations, and commercial path</h2>
          </div>
          <div className={styles.questions}>
            <article>
              <h3>Can I try the complete workflow?</h3>
              <p><strong>Yes.</strong> The no-card evaluation uses sample information to show the institution, account holder, representative, reviewer, decision, receipt, and later-change experiences. Do not enter real customer or sensitive personal information.</p>
            </article>
            <article>
              <h3>How does Passage connect to existing systems?</h3>
              <p>A hosted workflow comes first so the full operating model can be proven quickly. APIs and signed webhooks can then connect request creation and current decision updates to institution systems as integration requirements are agreed.</p>
            </article>
            <article>
              <h3>How is Passage priced?</h3>
              <p>The controlled evaluation is free for five sample requests over 10 days. The founding pilot is $5,000, credited toward year one, for a focused 60-to-90-day proof of operational fit. Institution pricing is shaped afterward by volume, workflow, integration, security, implementation, and support needs. Account holders and representatives are never charged.</p>
            </article>
            <article>
              <h3>What is the best next step?</h3>
              <p>Book a 20-minute walkthrough for a guided view, or start the sample workflow if you want to explore first. We can tailor the conversation to operations, compliance, product, technology, security, or executive stakeholders.</p>
              <div className={styles.answerActions}>
                <Link href="/contact">Book a walkthrough</Link>
                <Link href="/start">Explore the sample workflow</Link>
              </div>
            </article>
          </div>
        </section>

        <aside className={styles.help} aria-label="More help">
          <div><p className={styles.eyebrow}>Still have a question?</p><h2>Bring us the hard version.</h2><span>We will answer plainly, show the current product, and separate what works today from what must be completed before a pilot.</span></div>
          <Link href="/contact">Ask Passage</Link>
        </aside>
      </div>

      <CommercialFooter />
    </main>
  );
}
