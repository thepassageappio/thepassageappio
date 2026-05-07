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
  ['What data means here', 'Estate, case, task, message, participant, document reference, vendor request, and audit data are treated as coordination records for the family or account using Passage.'],
  ['Who should see it', 'Access should follow role and context: family coordinators, invited participants, funeral-home staff, vendors, and Passage system admins should each have different visibility.'],
  ['Export and ownership', 'The roadmap standard is that families and funeral homes can export the data behind reports and case work. Passage should be a coordination layer, not a data trap.'],
  ['Documents and proof', 'Proof can include notes, confirmation numbers, message receipts, generated packets, screenshots, or future uploaded files. Sensitive uploads require stronger storage, permission, and retention review before pilots.'],
  ['Communications', 'Email, SMS, and in-app messages should log sender, recipient, timestamp, channel, and delivery state where available so users can see what happened.'],
  ['Final policy status', 'This is a plain-language product overview. A formal Privacy Policy still needs owner and counsel review before it becomes final legal policy.'],
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 980, margin: '0 auto', padding: '24px 28px 48px' }}>
        <div style={eyebrow}>Privacy overview</div>
        <h1 style={h1}>Data should stay understandable, role-scoped, and exportable.</h1>
        <p style={lead}>
          This page explains the product privacy posture Passage is being built toward. It is not the final counsel-reviewed Privacy Policy.
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
            Until the full account/privacy center is live, data export, correction, deletion, billing, and privacy questions should go through Contact so they are captured in the support queue.
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
const h1 = { fontSize: 'clamp(32px, 4.6vw, 54px)', lineHeight: 1.03, margin: '8px 0 10px', fontWeight: 400, maxWidth: 840 };
const h2 = { fontSize: 24, lineHeight: 1.12, margin: '0 0 8px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, boxShadow: '0 4px 20px rgba(0,0,0,.04)' };
const bodyText = { color: C.mid, fontSize: 15, lineHeight: 1.6, margin: 0 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.sage, color: '#fff', borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.card, color: C.sage, border: '1px solid ' + C.border, borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
