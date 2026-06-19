import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseBrowser';
import { consumeSupabaseOAuthHash, destinationWithoutHash } from '../lib/supabaseOAuthHash';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { trackEvent } from '../lib/trackEvent';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
  amber: '#a97832',
  amberFaint: '#fbf5e8',
};

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

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState('');
  const isAdmin = isSystemAdminUser(user);
  const visiblePortalCards = portalCards.filter(card => !card.adminOnly || isAdmin);
  const requestedNext = typeof router.query.next === 'string' ? router.query.next : '';
  const safeNext = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '';
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
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} authReady={authChecked} onSignIn={!user ? signIn : null} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '26px 24px 46px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.76fr) minmax(320px,1fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Passage sign in</div>
            <h1 style={{ fontSize: 52, lineHeight: .98, fontWeight: 400, margin: '10px 0 12px' }}>Choose where to continue.</h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.62, margin: 0 }}>
              Passage has separate front doors for families, invited helpers, funeral-home teams, and vendor partners. The same family record connects the work after you sign in, with privacy boundaries for each role.
            </p>
            {authError && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 13, padding: '10px 12px', fontSize: 13.5, lineHeight: 1.45, marginTop: 14 }}>{authError}</div>}
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
              {!user && (
                <a href={googleSignInHref} onClick={() => trackEvent('login_google_clicked', { next: safeNext || '' })} style={{ minHeight: 48, display: 'inline-flex', alignItems: 'center', border: 'none', background: C.sage, color: '#fff', borderRadius: 13, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', textDecoration: 'none' }}>
                  Continue with Google
                </a>
              )}
              {user && (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}30`, borderRadius: 13, padding: '12px 14px', color: C.mid, fontSize: 13.5, lineHeight: 1.45 }}>
                  Signed in as <strong style={{ color: C.ink }}>{user.email}</strong>. Choose where to continue below.
                </div>
              )}
              <Link href="/urgent" onClick={() => trackEvent('login_urgent_clicked', { href: '/urgent' })} style={{ minHeight: 48, display: 'inline-flex', alignItems: 'center', border: `1px solid ${C.rose}33`, background: C.roseFaint, color: C.rose, borderRadius: 13, padding: '0 18px', textDecoration: 'none', fontWeight: 900 }}>
                Someone just passed
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {visiblePortalCards.map((card) => (
              <Link key={card.href} href={card.href} onClick={() => trackEvent('login_workspace_card_clicked', { title: card.title, href: card.href, action: card.action })} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', background: card.tone === 'primary' ? C.sageFaint : C.card, border: `1px solid ${card.tone === 'primary' ? C.sage + '33' : C.border}`, borderRadius: 16, padding: '15px 16px', textDecoration: 'none', color: C.ink, boxShadow: '0 8px 24px rgba(55,45,35,.04)' }}>
                <span>
                  <span style={{ display: 'block', color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{card.eyebrow}</span>
                  <span style={{ display: 'block', fontSize: 19, lineHeight: 1.18, marginTop: 4, fontWeight: 900 }}>{card.title}</span>
                  <span style={{ display: 'block', color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 4 }}>{card.body}</span>
                </span>
                <span style={{ border: `1px solid ${C.border}`, background: C.card, color: card.tone === 'primary' ? C.sage : C.mid, borderRadius: 999, padding: '8px 11px', fontSize: 12.5, fontWeight: 900, whiteSpace: 'nowrap' }}>
                  {card.action}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
