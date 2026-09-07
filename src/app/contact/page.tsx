import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { Metadata } from "next";
import { createCommercialInquiryAction } from "@/app/commercial-actions";
import { CommercialFooter } from "@/components/commercial/CommercialFooter";
import { CommercialHeader } from "@/components/commercial/CommercialHeader";
import styles from "@/app/commercial.module.css";
import contact from "./contact.module.css";

export const metadata: Metadata = { title: "Contact", description: "Request a Passage Authority demo, pilot conversation, or product help.", alternates: { canonical: "/contact" } };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const errors: Record<string, string> = {
  consent: "Confirm that Passage may contact you about this request.",
  rate: "We received several requests from this address. Please try again in an hour.",
  form: "Check the required fields and try again.",
};

export default async function ContactPage({ searchParams }: Props) {
  const query = await searchParams;
  const sent = query.sent === "1";
  const error = typeof query.error === "string" ? errors[query.error] : undefined;
  const reference = typeof query.reference === "string" ? query.reference : undefined;
  const requestedTopic = typeof query.topic === "string" ? query.topic : "demo";
  const initialType = ["demo", "pilot", "general", "billing", "feature"].includes(requestedTopic) ? requestedTopic : "demo";
  return <main className={styles.page}>
    <CommercialHeader />
    <section className={styles.hero}>
      <p className={styles.eyebrow}>Talk with Passage</p>
      <h1>See a POA request move clearly from intake to decision.</h1>
      <p>Tell us what you want to improve. We will tailor a short walkthrough to your institution and current process.</p>
    </section>
    <div className={contact.layout}>
      <section className={contact.formCard} aria-labelledby="contact-title">
        <div className={contact.intro}>
          <div><span>20-minute walkthrough</span><h2 id="contact-title">Start the conversation</h2></div>
          <p>Business information only. Do not include customer information, account numbers, or legal documents.</p>
        </div>
        {sent ? <div className={contact.success} role="status">
          <strong>Request received.</strong>
          <span>We will follow up at the work email you provided.{reference ? ` Reference: ${reference}.` : ""}</span>
        </div> : null}
        {error ? <p className={contact.error} role="alert">{error}</p> : null}
        {!sent ? <form action={createCommercialInquiryAction} className={contact.form}>
          <input type="hidden" name="idempotencyKey" value={randomUUID()} />
          <label className={contact.honeypot} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label><span>What can we help with?</span><select name="inquiryType" defaultValue={initialType} required>
            <option value="demo">Product walkthrough</option><option value="pilot">Pilot planning</option><option value="general">Product question</option><option value="billing">Billing or access</option><option value="feature">Feature request</option>
          </select></label>
          <div className={contact.pair}>
            <label><span>Full name</span><input name="fullName" autoComplete="name" maxLength={120} required /></label>
            <label><span>Work email</span><input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          </div>
          <div className={contact.pair}>
            <label><span>Organization</span><input name="organizationName" autoComplete="organization" maxLength={200} required /></label>
            <label><span>Your role</span><input name="jobRole" autoComplete="organization-title" maxLength={120} required /></label>
          </div>
          <div className={contact.pair}>
            <label><span>Organization type</span><select name="organizationType" defaultValue="" required>
              <option value="" disabled>Select one</option><option value="bank">Bank</option><option value="credit_union">Credit union</option><option value="law_firm">Law firm</option><option value="service_organization">Service organization</option><option value="fintech">Fintech</option><option value="other">Other</option>
            </select></label>
            <label><span>POA requests each year</span><select name="annualVolumeBand" defaultValue="unknown" required>
              <option value="under_100">Fewer than 100</option><option value="100_499">100–499</option><option value="500_1999">500–1,999</option><option value="2000_plus">2,000+</option><option value="unknown">Not sure yet</option>
            </select></label>
          </div>
          <label><span>How do you handle POA requests today?</span><select name="currentProcess" defaultValue="" required>
            <option value="" disabled>Select one</option><option value="email_and_documents">Email and shared documents</option><option value="branch_or_call_center">Branch or call center</option><option value="case_management">Case management system</option><option value="document_platform">Document platform</option><option value="existing_vendor">Existing vendor</option><option value="other">Another process</option>
          </select></label>
          <label><span>Anything useful for the walkthrough? <em>Optional</em></span><textarea name="message" rows={3} maxLength={1200} /></label>
          <label className={contact.consent}><input type="checkbox" name="contactConsent" required /><span>Passage may contact me about this request. See our <Link href="/legal/privacy">Privacy Policy</Link>.</span></label>
          <button className={contact.submit} type="submit">Request walkthrough</button>
        </form> : <Link className={styles.secondary} href="/contact">Send another request</Link>}
      </section>
      <aside className={contact.aside}>
        <div><span>What you will see</span><h2>One complete, auditable request.</h2></div>
        <ol><li>Capture the request and authority evidence.</li><li>Keep principal, representative, and institution aligned.</li><li>Record the institution&apos;s scoped decision.</li><li>Give every participant the same current receipt.</li></ol>
        <div className={contact.note}><strong>No-card evaluation</strong><p>Prefer to explore first? Create a workspace using sample information.</p><Link href="/start">Start free</Link></div>
        <a className={contact.email} href="mailto:hello@thepassageapp.io">hello@thepassageapp.io</a>
      </aside>
    </div>
    <CommercialFooter />
  </main>;
}
