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
  rose: '#B5622F',
  roseFaint: '#FBF0E7',
};

const BODY_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MOMENT_FONT = "'Fraunces', serif";
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');";

const terms = [
  ['Guidance and coordination', 'Passage organizes practical workflows, tasks, messages, proof, and records. It does not make emergency, medical, legal, religious, financial, funeral, government, or family-authority decisions for users.'],
  ['User and professional judgment', 'Families, participants, funeral homes, vendors, and professionals remain responsible for confirming the right action for their specific situation and local rules.'],
  ['Emergency boundaries', 'If someone may still be alive, is in danger, needs urgent medical help, or local rules require immediate authority involvement, users should contact emergency services or the appropriate professional authority directly.'],
  ['Accounts and authorized use', 'Users are responsible for using accurate account information, keeping sign-in credentials secure, and only accessing records, cases, requests, or organizations where they have permission. Misuse, scraping, harassment, unlawful activity, or attempts to bypass access controls are not permitted.'],
  ['Subscriptions, billing, and refunds', 'Paid plans, urgent records, partner plans, and marketplace payments may be processed through Stripe. Plan terms, pricing, renewal timing, cancellation, refunds, and taxes are shown at checkout or in the relevant partner agreement when payment is enabled.'],
  ['Workflow customization', 'Passage provides best-practice workflows that can be customized. Customized workflows and user-entered instructions remain subject to human review and user responsibility.'],
  ['Notifications and delivery', 'Passage should log attempted email, SMS, and in-app communications, but delivery depends on providers, recipient information, carrier/email systems, and account configuration.'],
  ['Vendors and third parties', 'Vendors, funeral homes, clergy, cemeteries, banks, government agencies, and other third parties are independent. Passage can coordinate requests and status, but it does not control their decisions or performance.'],
  ['Marketplace and partner services', 'When vendor commerce is enabled, vendor quotes, family approval, payment, Passage fees, vendor payouts, cancellation, and dispute handling will be governed by the disclosed vendor terms and the payment flow shown before payment. Vendors remain independent service providers.'],
  ['Intellectual property and content', 'Passage owns the platform, product design, software, brand, and templates. Users retain responsibility for the information, uploads, notes, and instructions they provide, and grant Passage permission to process that content to provide the service.'],
  ['Limitation of liability', 'To the maximum extent allowed by law, Passage is not responsible for indirect, incidental, special, consequential, or punitive damages, or for decisions made by users, professionals, providers, or third parties outside Passage.'],
  ['Termination and suspension', 'Passage may suspend or terminate access when an account is misused, payment fails, legal obligations require it, or continued access creates security, privacy, or operational risk. Users may request account help through Contact.'],
  ['Governing law and disputes', 'Formal governing-law, venue, arbitration, and partner-specific terms may be provided in the applicable customer, vendor, or partner agreement. For now, unresolved account or policy questions should be sent through Contact for review.'],
];

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: BODY_FONT }}>
      <style>{FONT_IMPORT}</style>
      <SiteHeader />
      <section style={{ maxWidth: 980, margin: '0 auto', padding: '24px 28px 48px' }}>
        <div style={eyebrow}>Terms of service</div>
        <h1 style={h1}>Clear product boundaries for sensitive coordination work.</h1>
        <p style={lead}>
          Effective May 13, 2026. These terms explain responsibilities, limits, billing boundaries, third-party boundaries, and human-review expectations that apply when using Passage.
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
const h1 = { fontFamily: MOMENT_FONT, fontWeight: 440, fontSize: 52, lineHeight: 1.03, margin: '8px 0 10px', maxWidth: 820, letterSpacing: '-.015em' };
const h2 = { fontSize: 24, lineHeight: 1.12, margin: '0 0 8px', fontWeight: 600 };
const lead = { color: C.mid, fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 760 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 18, boxShadow: '0 2px 6px rgba(20,30,25,.05), 0 10px 24px -8px rgba(20,30,25,.10)' };
const bodyText = { color: C.mid, fontSize: 15, lineHeight: 1.6, margin: 0 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: `linear-gradient(155deg, ${C.sage}, #153A31)`, color: '#fff', borderRadius: 999, padding: '0 16px', textDecoration: 'none', fontWeight: 900, boxShadow: '0 1px 2px rgba(20,30,25,.15), 0 8px 16px -6px rgba(20,30,25,.35)' };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', minHeight: 44, background: C.card, color: C.sage, border: '1px solid ' + C.border, borderRadius: 999, padding: '0 16px', textDecoration: 'none', fontWeight: 900 };
