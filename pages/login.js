import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseBrowser';
import { consumeSupabaseOAuthHash, destinationWithoutHash } from '../lib/supabaseOAuthHash';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { trackEvent } from '../lib/trackEvent';

const DEFAULT_SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function systemAdminEmails() {
  const configured = String(process.env.NEXT_PUBLIC_PASSAGE_ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_SYSTEM_ADMIN_EMAILS, ...configured]));
}

function isSystemAdminUser(user) {
  const email = normalizeEmail(user?.email);
  return !!email && systemAdminEmails().includes(email);
}

function safeNextFromValue(value) {
  const requested = typeof value === 'string' ? value : '';
  return requested.startsWith('/') && !requested.startsWith('//') ? requested : '';
}

const portalCards = [
  {
    eyebrow: 'Family record',
    title: 'Open your family record',
    body: 'For family coordinators managing the shared record, owners, documents, and next steps.',
    href: '/estate',
    action: 'Open my record',
    tone: 'primary',
  },
  {
    eyebrow: 'Participant request',
    title: 'See the one thing you were asked to handle',
    body: 'For relatives, friends, clergy, vendors, or helpers who received one scoped Passage request.',
    href: '/participating',
    action: 'Open my request',
  },
  {
    eyebrow: 'Funeral home director',
    title: 'Open the partner dashboard',
    body: 'For owners, directors, and managers reviewing cases, staff, warm inbounds, reporting, and setup.',
    href: '/funeral-home/login',
    action: 'Director sign in',
  },
  {
    eyebrow: 'Funeral home staff',
    title: 'Open assigned funeral-home work',
    body: 'For arrangers, location managers, and staff working assigned client steps with proof and case context.',
    href: '/funeral-home/staff',
    action: 'Staff sign in',
  },
  {
    eyebrow: 'Vendor partner',
    title: 'Open the vendor dashboard',
    body: 'For approved vendors reviewing quote requests, status updates, and completion proof.',
    href: '/vendors/login',
    action: 'Vendor owner portal',
  },
  {
    eyebrow: 'Vendor employee',
    title: 'Open assigned vendor work',
    body: 'For vendor team members responding to a request link or signing in with the email on their vendor profile.',
    href: '/vendors/accept',
    action: 'Vendor employee sign in',
  },
  {
    eyebrow: 'Passage admin',
    title: 'System admin and demo sandbox',
    body: 'For account access, sandbox walkthroughs, vendor review, metrics, and operational controls.',
    href: '/system/admin',
    action: 'Admin sign in',
    adminOnly: true,
  },
];

export default function LoginPage({ initialNext = '' }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState('');
  const isAdmin = isSystemAdminUser(user);
  const visiblePortalCards = portalCards.filter(card => !card.adminOnly || isAdmin);
  const safeNext = safeNextFromValue(initialNext);
  const googleSignInHref = '/auth/google' + (safeNext ? `?next=${encodeURIComponent(safeNext)}` : '');

  useEffect(() => {
    if (!supabase?.auth) {
      setAuthChecked(true);
      return undefined;
    }
    function routeIfAdmin(currentUser) {
      if (!currentUser || typeof window === 'undefined') return;
      const adminUser = isSystemAdminUser(currentUser);
      const adminOnlyDestination = safeNext.startsWith('/system/');
      if (safeNext && (!adminOnlyDestination || adminUser)) {
        window.location.replace(destinationWithoutHash(safeNext));
        return;
      }
      if (adminUser) {
        window.location.replace(destinationWithoutHash('/system/admin'));
      }
    }
    Promise.resolve()
      .then(() => consumeSupabaseOAuthHash(supabase))
      .then(async (oauthSession) => {
        if (oauthSession) return { data: { session: oauthSession } };
        return supabase.auth.getSession();
      })
      .then(({ data }) => {
        const currentUser = data.session?.user || null;
        setUser(currentUser);
        setAuthChecked(true);
        routeIfAdmin(currentUser);
      })
      .catch((error) => {
        setAuthError(error?.message || 'Google sign-in could not be completed. Please try again.');
        setAuthChecked(true);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      setAuthChecked(true);
      routeIfAdmin(currentUser);
    });
    return () => data.subscription.unsubscribe();
  }, [safeNext]);

  async function signIn() {
    setAuthError('');
    if (typeof window === 'undefined') return;
    trackEvent('login_google_clicked', { next: safeNext || '' });
    window.location.assign(googleSignInHref);
  }
  async function signOut() {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
  }

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
        .wrap { max-width: 1080px; margin: 0 auto; padding: 34px 24px 60px; }
        .grid { display: grid; grid-template-columns: minmax(0,.76fr) minmax(320px,1fr); gap: 18px; align-items: start; }
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
          font-size: clamp(32px, 4.6vw, 50px);
          line-height: .98;
          letter-spacing: -.02em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; margin: 0; max-width: 620px; }
        .th-error {
          background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700);
          border-radius: var(--r-sm); padding: 11px 14px; font-size: 13px; line-height: 1.48; margin-top: 14px;
        }
        .actions { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
        .th-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13.5px;
          border-radius: var(--r-full); padding: 0 18px; min-height: 48px;
          border: 1px solid transparent; cursor: pointer; text-decoration: none;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-urgent {
          background: var(--clay-50); color: var(--clay-700); border-color: var(--clay-200);
        }
        .signed-in-note {
          background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-sm);
          padding: 12px 14px; color: var(--ink-600); font-size: 13.5px; line-height: 1.45;
        }
        .signed-in-note strong { color: var(--ink-900); }
        .card-stack { display: grid; gap: 10px; }
        .vcard {
          display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 14px; align-items: center;
          background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md);
          padding: 15px 16px; text-decoration: none; color: var(--ink-900); box-shadow: var(--e1);
          transition: transform .25s var(--ease), box-shadow .25s var(--ease);
        }
        .vcard:hover { transform: translateY(-2px); box-shadow: var(--e2); }
        .vcard.primary { background: var(--pine-50); border-color: #D5E4DC; }
        .vcard-eyebrow { display: block; color: var(--pine-700); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
        .vcard-title { display: block; font-size: 18.5px; line-height: 1.2; margin-top: 4px; font-weight: 600; }
        .vcard-body { display: block; color: var(--ink-500); font-size: 13px; line-height: 1.46; margin-top: 4px; }
        .vcard-action {
          border: 1px solid var(--line); background: var(--bone-50); color: var(--pine-800);
          border-radius: var(--r-full); padding: 8px 12px; font-size: 12px; font-weight: 600; white-space: nowrap;
        }
        .vcard.primary .vcard-action { color: var(--pine-700); }

        @media (max-width: 720px) {
          .wrap { padding: 20px 16px 46px; }
          .grid { grid-template-columns: 1fr; }
          .actions { flex-direction: column; }
          .th-btn { width: 100%; }
        }
      `}</style>
      <SiteHeader user={user} authReady={authChecked} onSignIn={!user ? signIn : null} onSignOut={user ? signOut : null} />
      <section className="wrap">
        <div className="grid">
          <div className="panel">
            <span className="eyebrow">Passage sign in</span>
            <h1>Choose where to continue.</h1>
            <p className="lede">
              Passage has separate front doors for families, invited helpers, funeral-home teams, and vendor partners. The same family record connects the work after you sign in, with privacy boundaries for each role.
            </p>
            {authError && <div className="th-error">{authError}</div>}
            <div className="actions">
              {!user && (
                <a href={googleSignInHref} onClick={() => trackEvent('login_google_clicked', { next: safeNext || '' })} className="th-btn th-btn-primary">
                  Continue with Google
                </a>
              )}
              {user && (
                <div className="signed-in-note">
                  Signed in as <strong>{user.email}</strong>. Choose where to continue below.
                </div>
              )}
              <Link href="/urgent" onClick={() => trackEvent('login_urgent_clicked', { href: '/urgent' })} className="th-btn th-btn-urgent">
                Someone just passed
              </Link>
            </div>
          </div>

          <div className="card-stack">
            {visiblePortalCards.map((card) => (
              <Link key={card.href} href={card.href} onClick={() => trackEvent('login_workspace_card_clicked', { title: card.title, href: card.href, action: card.action })} className={card.tone === 'primary' ? 'vcard primary' : 'vcard'}>
                <span>
                  <span className="vcard-eyebrow">{card.eyebrow}</span>
                  <span className="vcard-title">{card.title}</span>
                  <span className="vcard-body">{card.body}</span>
                </span>
                <span className="vcard-action">{card.action}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      initialNext: safeNextFromValue(query?.next),
    },
  };
}
