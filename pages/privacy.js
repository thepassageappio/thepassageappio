import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

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
    <main className="th-shell">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');
        :root{
          --pine-950:#0A1F1A; --pine-900:#0F2A24; --pine-800:#153A31; --pine-700:#1C4A3E; --pine-600:#245A4B;
          --pine-100:#E7EFEA; --pine-50:#F2F6F3;
          --clay-700:#9A4F26; --clay-600:#B5622F; --clay-200:#EBC6A4; --clay-100:#F5E4D6; --clay-50:#FBF0E7;
          --bone-50:#FEFDFB; --bone-100:#FBF8F3; --bone-200:#F5F0E7; --bone-300:#EBE3D3; --bone-400:#DDD2BB;
          --ink-900:#1C1917; --ink-700:#3D372F; --ink-600:#5A5348; --ink-500:#79705F; --ink-400:#9A9081; --ink-300:#BEB6A8;
          --line:#E6DDCB; --line-soft:#EFE8DA;
          --r-xs:8px; --r-sm:12px; --r-md:18px; --r-lg:26px; --r-full:999px;
          --e1:0 1px 1px rgba(20,30,25,.03), 0 2px 4px rgba(20,30,25,.03);
          --e2:0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10);
          --ease:cubic-bezier(.22,1,.36,1);
        }
      `}</style>
      <style jsx>{`
        .th-shell {
          min-height: 100vh;
          background: var(--bone-100);
          color: var(--ink-900);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -.005em;
        }
        .wrap { max-width: 980px; margin: 0 auto; padding: 24px 28px 48px; }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 { font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(30px,4.6vw,44px); line-height: 1.05; margin: 8px 0 10px; max-width: 840px; letter-spacing: -.015em; color: var(--pine-950); }
        p.lead { color: var(--ink-500); font-size: 16px; line-height: 1.6; margin: 0; max-width: 760px; }
        .rows { display: grid; gap: 12px; margin-top: 18px; }
        .panel { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 18px; box-shadow: var(--e2); }
        .panel-pine { background: var(--pine-50); }
        h2 { font-size: 24px; line-height: 1.12; margin: 0 0 8px; font-weight: 600; color: var(--ink-900); }
        .body-text { color: var(--ink-500); font-size: 15px; line-height: 1.6; margin: 0; }
        .link-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .th-btn { display: inline-flex; align-items: center; min-height: 44px; border-radius: var(--r-full); padding: 0 16px; text-decoration: none; font-weight: 700; font-size: 13.5px; border: 1px solid transparent; }
        .th-btn-primary { background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff; box-shadow: 0 1px 2px rgba(20,30,25,.15), 0 8px 16px -6px rgba(20,30,25,.35); }
        .th-btn-secondary { background: var(--bone-50); color: var(--pine-700); border-color: var(--line); }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div className="eyebrow">Privacy policy</div>
        <h1>Data should stay understandable, role-scoped, and exportable.</h1>
        <p className="lead">
          Effective May 13, 2026. This page explains how Passage approaches privacy, access, exports, retention, and subprocessors in plain language.
        </p>

        <div className="rows">
          {rows.map(([title, body]) => (
            <section key={title} className="panel">
              <h2>{title}</h2>
              <p className="body-text">{body}</p>
            </section>
          ))}
        </div>

        <section className="panel panel-pine" style={{ marginTop: 14 }}>
          <h2>Requests and support</h2>
          <p className="body-text">
            Data export, correction, deletion, billing, subprocessor, and privacy questions should go through Contact so they are captured in the support queue. For formal partner diligence, Passage can provide a more detailed security and data-processing packet as the partnership process requires.
          </p>
          <div className="link-row">
            <Link href="/contact" className="th-btn th-btn-primary">Contact Passage</Link>
            <Link href="/trust" className="th-btn th-btn-secondary">Trust boundaries</Link>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
