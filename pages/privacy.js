import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const C = {
  bg: '#f6f3ee',
  card: '#fff',
  ink: '#1a1916',
  mid: '#6a6560',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
};

const rows = [
  ['Information we collect', 'Passage may collect account information, estate or case details, task records, participant invitations, provider requests, messages, document references, proof notes, billing status, device/browser information, and support inquiries.'],
  ['How Passage uses information', 'We use this information to provide the family record, route scoped requests, prepare messages or packets for review, support funeral-home and vendor workflows, maintain audit trails, prevent misuse, improve the product, and respond to support or billing questions.'],
  ['Role-scoped access', 'Access follows role and context. Family coordinators, invited participants, funeral-home staff, vendors, and Passage support admins each have different visibility. Participants and vendors should see only the request and context needed for their role.'],
  ['Sharing and approval', 'Passage is built around review before sharing. Messages, packets, vendor requests, and provider handoffs should be approved by the responsible user before they leave the record unless a user explicitly initiates that action.'],
  ['Service providers and subprocessors', 'Passage relies on service providers such as Supabase for database/auth, Vercel for hosting, Resend for email, Google for OAuth/address services, HubSpot for CRM/meetings, Stripe for payments when enabled, and Twilio for SMS when enabled. These providers process data only to help operate Passage.'],
  ['Retention and deletion', 'Passage keeps coordination records while an account, estate, case, or legal/business need remains active. Users can request export, correction, deletion, or account review through Contact. Some records may be retained where required for security, audit, billing, dispute, or legal reasons.'],
  ['Your privacy choices', 'Depending on location, users may have rights to access, correct, export, delete, restrict, or object to certain processing. We respond to privacy requests through the Passage support queue and may verify identity before acting.'],
  ['Security posture', 'Passage uses role-based access, Supabase authentication, row-level permission design, HTTPS, audit/event logging, and review-first workflows. No system can be guaranteed perfectly secure, so suspected security issues should be reported through Contact.'],
  ['Sensitive and professional boundaries', 'Passage is a coordination platform, not a medical provider, legal advisor, funeral director, government agency, or emergency service. Do not use Passage as the only place for time-critical medical, legal, or emergency decisions.'],
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 980, margin: '0 auto', padding: '24px 28px 48px' }}>
        <div style={eyebrow}>Privacy policy</div>
        <h1 style={h1}>Data should stay understandable, role-scoped, and exportable.</h1>
        <p style={lead}>
          Effective May 13, 2026. This page explains how Passage approaches privacy, access, exports, retention, and subprocessors in plain language.
        </p>

        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          {rows.map(([title, body]) => (
            <section key={title} style={panel}>
              <h2 style={h2}>{title}</h2>
              <p style={bodyText}>{body}</p>
            </section>
          ))}
        </div>

        <section style={{ ...panel, marginTop: 14, background: C.sageFaint }}>
          <h2 style={h2}>Requests and support</h2>
          <p style={bodyText}>
            Data export, correction, deletion, billing, subprocessor, and privacy questions should go through Contact so they are captured in the support queue. For formal partner diligence, Passage can provide a more detailed security and data-processing packet as the partnership process requires.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <Link href="/contact" style={primaryLink}>Contact Passage</Link>
            <Link href="/trust" style={secondaryLink}>Trust boundaries</Link>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 52, lineHeight: 1.03, margin: '8px 0 10px', fontWeight: 400, maxWidth: 840 };
const h2 = { fontSize: 24, lineHeight: 1.12, margin: '0 0 8px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, boxShadow: '0 4px 20px rgba(0,0,0,.04)' };
const bodyText = { color: C.mid, fontSize: 15, lineHeight: 1.6, margin: 0 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.sage, color: '#fff', borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.card, color: C.sage, border: '1px solid ' + C.border, borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
