import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { calendlyUrl } from '../../lib/scheduling';

const roleCards = [
  {
    eyebrow: 'Customer login',
    title: 'Director or manager',
    body: 'Open the actual funeral-home dashboard: My Day, cases, employees, family requests, proof, family updates, and exports.',
    href: '/funeral-home/dashboard?partner=1',
    action: 'Open dashboard',
    tone: 'primary',
    icon: 'dashboard',
  },
  {
    eyebrow: 'Customer login',
    title: 'Staff queue',
    body: 'Open assigned client steps first: what is due, what is waiting, the drafted ask, and the proof needed to close the loop.',
    href: '/funeral-home/staff',
    action: 'Open staff login',
    icon: 'queue',
  },
  {
    eyebrow: 'New customer dashboard',
    title: 'Set up a dashboard',
    body: 'Start setup after Passage activates your funeral-home account: organization, locations, employees, family view, and first cases.',
    href: '/funeral-home/setup',
    action: 'Start setup',
    icon: 'setup',
  },
];

const helperCards = [
  ['Learn functionality', '/funeral-home', 'See how Passage helps directors coordinate cases, staff, family updates, proof, and exports.'],
  ['Book a demo', calendlyUrl({ source: 'funeral home login doorway' }), 'For funeral homes evaluating Passage or needing help getting started.'],
  ['View sample case', '/funeral-home/sample-case', 'Explore a safe sample case before logging into a real customer dashboard.'],
];

function RoleIcon({ name }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
      </svg>
    );
  }
  if (name === 'queue') {
    return (
      <svg {...common}>
        <path d="M4 6h16M4 12h11M4 18h7" />
        <circle cx="19.5" cy="17.5" r="2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 8v4l2.6 2.6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

export default function FuneralHomeLogin() {
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
        .wrap { max-width: 1080px; margin: 0 auto; padding: 28px 24px 58px; }
        .hero-grid { display: grid; grid-template-columns: minmax(0,.82fr) minmax(320px,1fr); gap: 20px; align-items: start; }
        .hero-card {
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 30px;
          box-shadow: var(--e2);
        }
        .eyebrow {
          display: block;
          color: var(--clay-600);
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .hero-title {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(32px, 4.6vw, 48px);
          line-height: 1.06;
          letter-spacing: -.018em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        .hero-lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; margin: 0; }
        .th-notice {
          background: var(--clay-50);
          border: 1px solid var(--clay-200);
          color: var(--clay-700);
          border-radius: var(--r-sm);
          padding: 13px 16px;
          font-size: 13.2px;
          line-height: 1.5;
          margin-top: 18px;
        }
        .role-list { display: grid; gap: 10px; }
        .role-card {
          display: grid;
          grid-template-columns: 40px minmax(0,1fr) auto;
          gap: 14px;
          align-items: center;
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-md);
          padding: 16px 17px;
          text-decoration: none;
          color: var(--ink-900);
          box-shadow: var(--e1);
          transition: transform .22s var(--ease), box-shadow .22s var(--ease);
        }
        .role-card:hover { transform: translateY(-2px); box-shadow: var(--e2); }
        .role-card.primary { background: var(--pine-50); border-color: #D5E4DC; }
        .role-icon {
          width: 40px; height: 40px;
          border-radius: var(--r-xs);
          background: var(--pine-100);
          color: var(--pine-700);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .role-title { display: block; color: var(--ink-900); font-size: 19px; line-height: 1.18; margin-top: 3px; font-weight: 600; font-family: 'Fraunces', serif; letter-spacing: -.01em; }
        .role-body { display: block; color: var(--ink-500); font-size: 13.2px; line-height: 1.48; margin-top: 4px; }
        .role-action {
          border-radius: var(--r-full);
          padding: 9px 14px;
          font-size: 12.5px;
          font-weight: 600;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .role-action.is-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .role-action.is-secondary {
          background: var(--bone-100);
          color: var(--pine-800);
          border: 1px solid var(--line);
        }
        .helper-section {
          margin-top: 22px;
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 22px;
          box-shadow: var(--e1);
        }
        .helper-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 14px; }
        .helper-card {
          background: var(--bone-100);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-md);
          padding: 15px;
          color: var(--ink-900);
          text-decoration: none;
          display: grid;
          gap: 6px;
          transition: transform .22s var(--ease), box-shadow .22s var(--ease);
        }
        .helper-card:hover { transform: translateY(-2px); box-shadow: var(--e1); }
        .helper-title { font-size: 16.5px; line-height: 1.2; font-family: 'Fraunces', serif; font-weight: 500; letter-spacing: -.008em; }
        .helper-body { color: var(--ink-500); font-size: 12.8px; line-height: 1.48; }
        .helper-cta { color: var(--pine-700); font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; }

        @media (max-width: 780px) {
          .wrap { padding: 18px 16px 44px; }
          .hero-grid { grid-template-columns: 1fr; }
          .role-card { grid-template-columns: 36px minmax(0,1fr); }
          .role-action { grid-column: 1 / -1; justify-self: start; margin-top: 4px; }
        }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div className="hero-grid">
          <div className="hero-card">
            <span className="eyebrow">Funeral-home portal</span>
            <h1 className="hero-title">Customers sign in. Prospects learn or book a demo.</h1>
            <p className="hero-lede">
              This is the doorway to the working funeral-home product. If your organization already uses Passage, choose your role. If you are evaluating Passage, use the sales page, sample case, or walkthrough instead.
            </p>
            <div className="th-notice">
              Use the email invited to your funeral-home organization. Directors see the business dashboard; staff see assigned work. Public visitors should use the sales page, sample case, or walkthrough before opening customer work.
            </div>
          </div>

          <div className="role-list">
            {roleCards.map((card) => (
              <Link key={card.title} href={card.href} className={`role-card${card.tone === 'primary' ? ' primary' : ''}`}>
                <span className="role-icon"><RoleIcon name={card.icon} /></span>
                <span>
                  <span className="eyebrow">{card.eyebrow}</span>
                  <span className="role-title">{card.title}</span>
                  <span className="role-body">{card.body}</span>
                </span>
                <span className={`role-action ${card.tone === 'primary' ? 'is-primary' : 'is-secondary'}`}>{card.action} <ArrowIcon /></span>
              </Link>
            ))}
          </div>
        </div>

        <section className="helper-section">
          <span className="eyebrow">Not a customer yet?</span>
          <div className="helper-grid">
            {helperCards.map(([title, href, body]) => {
              const external = href.startsWith('http');
              return (
                <Link key={title} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="helper-card">
                  <span className="helper-title">{title}</span>
                  <span className="helper-body">{body}</span>
                  <span className="helper-cta">{external ? 'Open booking page' : 'Open'} <ArrowIcon /></span>
                </Link>
              );
            })}
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
