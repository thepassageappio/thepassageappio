import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import { getAuthorityAccessContext } from "@/lib/authority/access";
import styles from "./sample.module.css";

export const metadata: Metadata = {
  title: "Sample Power of Attorney Workflow",
  description: "Explore a read-only Passage Authority request using fictional information.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const journey = [
  { number: "01", actor: "Institution", title: "Starts one bounded request", detail: "Northstar Credit Union names the account relationship, the two participants, and the actions Maya is asking to perform." },
  { number: "02", actor: "Account holder", title: "Confirms the request", detail: "Eleanor uses her private link to confirm Maya, the account boundary, the requested actions, and the end date." },
  { number: "03", actor: "Representative", title: "Accepts responsibility", detail: "Maya uses a different private link, accepts her responsibilities, and supplies the requested sample evidence." },
  { number: "04", actor: "Institution reviewer", title: "Records the decision", detail: "The reviewer applies the institution's own legal, identity, fraud, and policy process, then accepts the request with explicit limits." },
];

export default async function SampleWorkflowPage() {
  const access = await getAuthorityAccessContext();
  if (!access?.user) redirect("/start?intent=sample&next=/sample");

  return (
    <main className={styles.page}>
      <CommercialHeader />

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Read-only product sample</p>
          <h1>See one authority request from start to receipt.</h1>
          <p className={styles.lede}>This guided example uses fictional people and an imaginary credit union. Your Google or email sign-in unlocks the sample; two-factor authentication is reserved for people who create or administer an institution workspace.</p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#workflow">Start the sample <span>↓</span></a>
            <Link className={styles.secondary} href="/contact">Book a guided walkthrough</Link>
          </div>
        </div>
        <aside className={styles.sampleNotice} aria-label="Sample boundaries">
          <strong>What this sample does</strong>
          <p>Shows the participant steps, institution review, accepted scope, limits, and matching decision receipt.</p>
          <span>Signed-in sample · No live request · No authenticator required</span>
        </aside>
      </section>

      <section className={styles.workflow} id="workflow">
        <div className={styles.heading}>
          <p className={styles.eyebrow}>The shared workflow</p>
          <h2>Four people see the same request through their own permitted view.</h2>
        </div>
        <ol className={styles.steps}>
          {journey.map((step) => (
            <li key={step.number}>
              <div className={styles.stepTop}><span>{step.number}</span><b>{step.actor}</b></div>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.request} aria-label="Fictional sample request">
        <div className={styles.requestHead}>
          <div><p>Sample request · PA-DEMO-4405</p><h2>Eleanor Carter authorizes Maya Carter</h2><span>Northstar Credit Union · Deposit relationship ending 4405</span></div>
          <b>Accepted with limits</b>
        </div>

        <div className={styles.people}>
          <article><i>EC</i><div><strong>Eleanor Carter</strong><span>Account holder</span><small>Request confirmed</small></div></article>
          <article><i>MC</i><div><strong>Maya Carter</strong><span>Representative</span><small>Responsibilities accepted</small></div></article>
        </div>

        <div className={styles.scopeGrid}>
          <article data-tone="permitted">
            <p>Accepted by this institution</p>
            <ul><li>Receive duplicate monthly statements</li><li>Discuss non-transactional account-service issues</li></ul>
          </article>
          <article data-tone="excluded">
            <p>Not included in this example</p>
            <ul><li>Move or withdraw money</li><li>Change ownership or beneficiaries</li><li>Use Eleanor&apos;s login credentials</li></ul>
          </article>
        </div>

        <div className={styles.evidence}>
          <div><span>Power of attorney document</span><b>Reviewed</b></div>
          <div><span>Representative certification</span><b>Accepted</b></div>
          <div><span>Institution identity checks</span><b>Recorded complete</b></div>
          <div><span>Institution decision</span><b>Accepted with limits</b></div>
        </div>

        <div className={styles.receipt}>
          <div><p>Decision receipt</p><strong>PAR-DEMO-4405</strong></div>
          <p>The account holder, representative, and institution receive the same final scope and limits. Passage preserves what the institution decided and when; the institution remains responsible for access in its systems.</p>
        </div>
      </section>

      <section className={styles.nextStep}>
        <div><p className={styles.eyebrow}>Ready to operate the workflow?</p><h2>Create a protected institution workspace.</h2><span>Continue with Google or a one-time email link. New Owner accounts also set up an authenticator because they can manage institutional policy, people, billing, and requests.</span></div>
        <div><Link className={styles.primary} href="/start">Create an evaluation workspace</Link><Link className={styles.textLink} href="/start?intent=sign-in">Sign in to an existing workspace</Link></div>
      </section>

      <CommercialFooter />
    </main>
  );
}
