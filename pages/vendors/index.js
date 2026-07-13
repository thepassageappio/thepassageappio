import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { trackEvent } from '../../lib/trackEvent';

function CardIcon({ index }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (index === 0) {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg {...common}>
        <path d="M12 4v16M4 12h16" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4.5 6.5C6 5 9 4 12 4s6 1 7.5 2.5C21 8 21 10 21 12s0 4-1.5 5.5C18 19 15 20 12 20s-6-1-7.5-2.5C3 16 3 14 3 12s0-4 1.5-5.5z" />
      <path d="M9 12.5l2 2 4.5-4.5" />
    </svg>
  );
}

export default function VendorFrontDoor() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase?.auth) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  const cards = [
    {
      eyebrow: 'Vendor owner',
      title: 'Sign in to manage the vendor profile',
      body: 'For approved owners and managers. Review requests, invite employees, confirm payout readiness, and see saved proof.',
      href: user ? '/vendors/request' : '/vendors/login',
      action: user ? 'Open owner workspace' : 'Owner sign in',
      tone: 'primary',
    },
    {
      eyebrow: 'Vendor employee',
      title: 'Open one assigned request',
      body: 'For employees or service team members. Use the invited email or request link to see only the job, date, location, quote fields, payment status, and proof needed.',
      href: '/vendors/accept',
      action: 'Vendor employee sign in',
    },
    {
      eyebrow: 'New support partner',
      title: 'Apply to receive scoped Passage requests',
      body: 'Tell us what you provide, where you serve, and whether you support urgent or planned requests.',
      href: '/vendors/onboard',
      action: 'Apply to join',
    },
    {
      eyebrow: 'Scoped access',
      title: 'Vendors never browse family records',
      body: 'A request contains only the work requested, timing, contact boundary, and proof needed to complete it.',
      href: '/trust',
      action: 'Trust model',
    },
  ];

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
        .wrap { max-width: 1080px; margin: 0 auto; padding: 32px 24px 60px; }
        .grid { display: grid; grid-template-columns: minmax(0,.8fr) minmax(320px,1fr); gap: 18px; align-items: start; }
        .panel {
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 28px;
          box-shadow: var(--e2);
        }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(32px, 4.6vw, 46px);
          line-height: 1.04;
          letter-spacing: -.02em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; margin: 0; }
        .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
        .th-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          border-radius: var(--r-full); padding: 0 20px; min-height: 46px;
          border: 1px solid transparent; cursor: pointer; text-decoration: none;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
          white-space: nowrap;
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-secondary {
          background: var(--bone-50); color: var(--pine-800); border-color: var(--line); box-shadow: var(--e1);
        }
        .th-note {
          background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700);
          border-radius: var(--r-sm); padding: 12px 15px; font-size: 13px; line-height: 1.5; margin-top: 18px;
        }
        .card-stack { display: grid; gap: 10px; }
        .card {
          background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md);
          padding: 18px; box-shadow: var(--e1);
          transition: transform .25s var(--ease), box-shadow .25s var(--ease);
        }
        .card:hover { transform: translateY(-2px); box-shadow: var(--e2); }
        .card.primary { background: var(--pine-50); border-color: #D5E4DC; }
        .card-icon {
          width: 34px; height: 34px; border-radius: var(--r-xs); background: var(--pine-100); color: var(--pine-700);
          display: flex; align-items: center; justify-content: center; margin-bottom: 10px;
        }
        .card-eyebrow { color: var(--pine-700); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
        .card-title { color: var(--ink-900); font-size: 19px; line-height: 1.18; margin: 6px 0 6px; font-weight: 600; }
        .card-body { color: var(--ink-500); font-size: 13.2px; line-height: 1.48; margin: 0; }
        .card-action {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 40px; border-radius: var(--r-full); padding: 0 15px; margin-top: 12px;
          font-size: 12.5px; font-weight: 600; text-decoration: none;
          border: 1px solid var(--line); background: var(--bone-50); color: var(--pine-800);
        }
        .card.primary .card-action {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff; border-color: transparent;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 6px 14px -6px rgba(15,42,36,.35);
        }

        @media (max-width: 720px) {
          .wrap { padding: 20px 16px 46px; }
          .grid { grid-template-columns: 1fr; }
          .actions { flex-direction: column; }
          .th-btn { width: 100%; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="wrap">
        <div className="grid">
          <div className="panel">
            <span className="eyebrow">Vendor portal</span>
            <h1>Local help, only when a family request needs it.</h1>
            <p className="lede">
              Passage keeps vendor work tied to one scoped family request: what was requested, when it is needed, what quote was shared, and what proof completed the work.
            </p>
            <div className="actions">
              <Link href="/vendors/onboard" onClick={() => trackEvent('vendor_apply_clicked', { href: '/vendors/onboard' })} className="th-btn th-btn-primary">
                Apply to join
              </Link>
              <Link href="/vendors/login" onClick={() => trackEvent('vendor_owner_sign_in_clicked', { href: '/vendors/login' })} className="th-btn th-btn-secondary">
                Vendor owner sign in
              </Link>
              <Link href="/vendors/accept" onClick={() => trackEvent('vendor_employee_sign_in_clicked', { href: '/vendors/accept' })} className="th-btn th-btn-secondary">
                Vendor employee sign in
              </Link>
            </div>
            <div className="th-note">
              New vendors apply first. Approved vendor owners manage the business profile and payout setup. Vendor employees open only assigned work. Nobody browses families or unrelated cases.
            </div>
          </div>
          <div className="card-stack">
            {cards.map((card, index) => (
              <article className={card.tone === 'primary' ? 'card primary' : 'card'} key={card.title}>
                <span className="card-icon"><CardIcon index={index} /></span>
                <div className="card-eyebrow">{card.eyebrow}</div>
                <h2 className="card-title">{card.title}</h2>
                <p className="card-body">{card.body}</p>
                <Link
                  href={card.href}
                  onClick={() => trackEvent('vendor_card_clicked', { title: card.title, href: card.href, action: card.action })}
                  className="card-action"
                >
                  {card.action}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
