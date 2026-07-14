import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

const C = {
  bg: '#FBF8F3',
  card: '#FEFDFB',
  ink: '#1C1917',
  mid: '#5A5348',
  border: '#E6DDCB',
  sage: '#245A4B',
  sageFaint: '#F2F6F3',
};

const BODY_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MOMENT_FONT = "'Fraunces', serif";
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');";

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
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: BODY_FONT }}>
      <style>{FONT_IMPORT}</style>
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
const h1 = { fontFamily: MOMENT_FONT, fontWeight: 440, fontSize: 52, lineHeight: 1.03, margin: '8px 0 10px', maxWidth: 840, letterSpacing: '-.015em' };
const h2 = { fontSize: 24, lineHeight: 1.12, margin: '0 0 8px', fontWeight: 600 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 18, boxShadow: '0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10)' };
const bodyText = { color: C.mid, fontSize: 15, lineHeight: 1.6, margin: 0 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: `linear-gradient(155deg, ${C.sage}, #153A31)`, color: '#fff', borderRadius: 999, padding: '0 16px', textDecoration: 'none', fontWeight: 900, boxShadow: '0 1px 2px rgba(20,30,25,.15), 0 8px 16px -6px rgba(20,30,25,.35)' };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.card, color: C.sage, border: '1px solid ' + C.border, borderRadius: 999, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
