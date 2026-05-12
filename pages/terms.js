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
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

const terms = [
  ['Guidance and coordination', 'Passage organizes practical workflows, tasks, messages, proof, and records. It does not make emergency, medical, legal, religious, financial, funeral, government, or family-authority decisions for users.'],
  ['User and professional judgment', 'Families, participants, funeral homes, vendors, and professionals remain responsible for confirming the right action for their specific situation and local rules.'],
  ['Emergency boundaries', 'If someone may still be alive, is in danger, needs urgent medical help, or local rules require immediate authority involvement, users should contact emergency services or the appropriate professional authority directly.'],
  ['Workflow customization', 'Passage provides best-practice workflows that can be customized. Customized workflows and user-entered instructions remain subject to human review and user responsibility.'],
  ['Notifications and delivery', 'Passage should log attempted email, SMS, and in-app communications, but delivery depends on providers, recipient information, carrier/email systems, and account configuration.'],
  ['Vendors and third parties', 'Vendors, funeral homes, clergy, cemeteries, banks, government agencies, and other third parties are independent. Passage can coordinate requests and status, but it does not control their decisions or performance.'],
  ['Account and policy questions', 'For account, billing, vendor, funeral-home partner, or policy questions, use Contact so the request is captured and routed to the right Passage support path.'],
];

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 980, margin: '0 auto', padding: '24px 28px 48px' }}>
        <div style={eyebrow}>Terms overview</div>
        <h1 style={h1}>Clear product boundaries for sensitive coordination work.</h1>
        <p style={lead}>
          These terms explain the basic responsibilities, limits, and human-review boundaries that apply when using Passage.
        </p>

        <section style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, borderRadius: 20, padding: 18, marginTop: 18 }}>
          <div style={{ color: C.rose, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Important boundary</div>
          <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.6, margin: '8px 0 0' }}>
            Passage helps organize practical work, but it does not replace emergency services, medical care, legal advice, funeral-director judgment, government requirements, financial institutions, clergy, or local authorities.
          </p>
        </section>

        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {terms.map(([title, body]) => (
            <section key={title} style={panel}>
              <h2 style={h2}>{title}</h2>
              <p style={bodyText}>{body}</p>
            </section>
          ))}
        </div>

        <section style={{ ...panel, marginTop: 14, background: C.sageFaint }}>
          <h2 style={h2}>Need help with account, billing, or policy questions?</h2>
          <p style={bodyText}>Use Contact so the request is captured and can be routed to support, billing, product, or policy review.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <Link href="/contact" style={primaryLink}>Contact Passage</Link>
            <Link href="/privacy" style={secondaryLink}>Privacy overview</Link>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

const eyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const h1 = { fontSize: 'clamp(32px, 4.6vw, 54px)', lineHeight: 1.03, margin: '8px 0 10px', fontWeight: 400, maxWidth: 820 };
const h2 = { fontSize: 24, lineHeight: 1.12, margin: '0 0 8px', fontWeight: 400 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, boxShadow: '0 4px 20px rgba(0,0,0,.04)' };
const bodyText = { color: C.mid, fontSize: 15, lineHeight: 1.6, margin: 0 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.sage, color: '#fff', borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.card, color: C.sage, border: '1px solid ' + C.border, borderRadius: 13, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
