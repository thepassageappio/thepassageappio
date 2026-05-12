import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';

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

const portalCards = [
  {
    eyebrow: 'Family record',
    title: 'Open your estate workspace',
    body: 'For family coordinators managing the shared record, owners, documents, and next steps.',
    href: '/estate',
    action: 'Open my record',
    tone: 'primary',
  },
  {
    eyebrow: 'Participant task',
    title: 'See the one thing you were asked to handle',
    body: 'For relatives, friends, clergy, vendors, or helpers who received a scoped Passage task.',
    href: '/participating',
    action: 'Open my task',
  },
  {
    eyebrow: 'Funeral home director',
    title: 'Open the partner command center',
    body: 'For owners, directors, and managers reviewing cases, staff, warm inbounds, reporting, and setup.',
    href: '/funeral-home/login',
    action: 'Director sign in',
  },
  {
    eyebrow: 'Funeral home staff',
    title: 'Open assigned funeral-home work',
    body: 'For arrangers, location managers, and staff working assigned tasks with proof and case context.',
    href: '/funeral-home/staff',
    action: 'Staff sign in',
  },
  {
    eyebrow: 'Vendor partner',
    title: 'Manage vendor requests',
    body: 'For approved vendors reviewing quote requests, status updates, and completion proof.',
    href: '/vendors',
    action: 'Vendor owner portal',
  },
  {
    eyebrow: 'Vendor employee',
    title: 'Open assigned vendor work',
    body: 'For vendor team members responding to a request link or signing in with the email on their vendor profile.',
    href: '/vendors/login',
    action: 'Vendor employee sign in',
  },
  {
    eyebrow: 'Passage admin',
    title: 'System admin and demo sandbox',
    body: 'For internal QA, sandbox walkthroughs, vendor review, metrics, and operational controls.',
    href: '/system/admin',
    action: 'Admin sign in',
  },
];

export default function LoginPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase?.auth) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn() {
    if (!supabase?.auth || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '26px 24px 46px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.76fr) minmax(320px,1fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Passage sign in</div>
            <h1 style={{ fontSize: 'clamp(34px,4.6vw,58px)', lineHeight: .98, fontWeight: 400, margin: '10px 0 12px' }}>Choose the workspace you need.</h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.62, margin: 0 }}>
              Passage has separate front doors for families, invited helpers, funeral-home teams, vendor partners, and internal admins. The same spine connects the work after you sign in.
            </p>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
              {!user && (
                <button onClick={signIn} style={{ minHeight: 48, border: 'none', background: C.sage, color: '#fff', borderRadius: 13, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                  Continue with Google
                </button>
              )}
              {user && (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}30`, borderRadius: 13, padding: '12px 14px', color: C.mid, fontSize: 13.5, lineHeight: 1.45 }}>
                  Signed in as <strong style={{ color: C.ink }}>{user.email}</strong>. Choose a workspace below.
                </div>
              )}
              <Link href="/urgent" style={{ minHeight: 48, display: 'inline-flex', alignItems: 'center', border: `1px solid ${C.rose}33`, background: C.roseFaint, color: C.rose, borderRadius: 13, padding: '0 18px', textDecoration: 'none', fontWeight: 900 }}>
                Someone just passed
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {portalCards.map((card) => (
              <Link key={card.href} href={card.href} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', background: card.tone === 'primary' ? C.sageFaint : C.card, border: `1px solid ${card.tone === 'primary' ? C.sage + '33' : C.border}`, borderRadius: 16, padding: '15px 16px', textDecoration: 'none', color: C.ink, boxShadow: '0 8px 24px rgba(55,45,35,.04)' }}>
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
