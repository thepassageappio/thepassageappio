import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { supabase } from '../../lib/supabaseBrowser';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#a97832',
  amberFaint: '#fbf5e8',
};

const vendorCards = [
  {
    eyebrow: 'Approved vendor',
    title: 'Manage request queue',
    body: 'Sign in with the email connected to your approved vendor profile to see quote requests and completion proof.',
    href: '/vendors/request',
    action: 'Vendor sign in',
    tone: 'primary',
  },
  {
    eyebrow: 'Request link',
    title: 'Open one scoped request',
    body: 'If Passage sent you a request link, open it directly from the email or text. You will see only that task.',
    href: '/vendors/request',
    action: 'Open request',
  },
  {
    eyebrow: 'New vendor',
    title: 'Apply as a support partner',
    body: 'Tell Passage what you provide, where you serve, and whether you support urgent or planned family needs.',
    href: '/vendors/onboard',
    action: 'Apply',
  },
];

export default function VendorLogin() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabase?.auth) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn() {
    if (!supabase?.auth || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/vendors/request` } });
  }

  async function signOut() {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '30px 24px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.78fr) minmax(320px,1fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor workspace</div>
            <h1 style={{ fontSize: 'clamp(34px,4.6vw,56px)', lineHeight: .98, margin: '10px 0 12px', fontWeight: 400 }}>Respond only to the work requested.</h1>
            <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.62, margin: 0 }}>
              Vendor access is scoped. You do not browse family records; you see the request, timing, quote fields, and proof needed to complete one service.
            </p>
            <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 16 }}>
              Approved vendor teams can sign in with Google. New vendors apply first so Passage can review service area, category, and response expectations.
            </div>
            {!user && (
              <button onClick={signIn} style={{ minHeight: 50, border: 'none', background: C.sage, color: '#fff', borderRadius: 14, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', marginTop: 16 }}>
                Continue with Google
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {vendorCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 14, alignItems: 'center', background: card.tone === 'primary' ? C.sageFaint : C.card, border: `1px solid ${card.tone === 'primary' ? C.sage + '33' : C.border}`, borderRadius: 16, padding: '16px 17px', textDecoration: 'none', color: C.ink, boxShadow: '0 8px 24px rgba(55,45,35,.04)' }}
              >
                <span>
                  <span style={{ display: 'block', color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{card.eyebrow}</span>
                  <span style={{ display: 'block', fontSize: 20, lineHeight: 1.15, marginTop: 4, fontWeight: 900 }}>{card.title}</span>
                  <span style={{ display: 'block', color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 4 }}>{card.body}</span>
                </span>
                <span style={{ border: `1px solid ${C.border}`, background: C.card, color: card.tone === 'primary' ? C.sage : C.mid, borderRadius: 999, padding: '8px 11px', fontSize: 12.5, fontWeight: 900, whiteSpace: 'nowrap' }}>{card.action}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
