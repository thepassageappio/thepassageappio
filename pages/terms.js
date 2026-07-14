import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

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
        h1 { font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(30px,4.6vw,44px); line-height: 1.05; margin: 8px 0 10px; max-width: 820px; letter-spacing: -.015em; color: var(--pine-950); }
        p.lead { color: var(--ink-500); font-size: 16px; line-height: 1.6; margin: 0; max-width: 760px; }
        .safety-box { background: var(--clay-50); border: 1px solid var(--clay-600); border-radius: var(--r-lg); padding: 18px; margin-top: 18px; }
        .safety-title { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        .safety-body { color: var(--ink-500); font-size: 15px; line-height: 1.6; margin: 8px 0 0; }
        .rows { display: grid; gap: 12px; margin-top: 16px; }
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
        <div className="eyebrow">Terms of service</div>
        <h1>Clear product boundaries for sensitive coordination work.</h1>
        <p className="lead">
          Effective May 13, 2026. These terms explain responsibilities, limits, billing boundaries, third-party boundaries, and human-review expectations that apply when using Passage.
        </p>

        <section className="safety-box">
          <div className="safety-title">Important boundary</div>
          <p className="safety-body">
            Passage helps organize practical work, but it does not replace emergency services, medical care, legal advice, funeral-director judgment, government requirements, financial institutions, clergy, or local authorities.
          </p>
        </section>

        <div className="rows">
          {terms.map(([title, body]) => (
            <section key={title} className="panel">
              <h2>{title}</h2>
              <p className="body-text">{body}</p>
            </section>
          ))}
        </div>

        <section className="panel panel-pine" style={{ marginTop: 14 }}>
          <h2>Need help with account, billing, or policy questions?</h2>
          <p className="body-text">Use Contact so the request is captured and can be routed to support, billing, product, or policy review.</p>
          <div className="link-row">
            <Link href="/contact" className="th-btn th-btn-primary">Contact Passage</Link>
            <Link href="/privacy" className="th-btn th-btn-secondary">Privacy overview</Link>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
