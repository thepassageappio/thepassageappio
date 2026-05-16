import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { trackEvent } from '../../lib/trackEvent';

const C = { bg: '#f6f3ee', card: '#fffdf9', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', amber: '#a97832', amberFaint: '#fbf5e8' };

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

  async function signIn() {
    if (!supabase?.auth || typeof window === 'undefined') return;
    trackEvent('vendor_sign_in_clicked', { source: 'vendor_front_door' });
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/vendors/request` } });
  }

  const cards = [
    {
      eyebrow: 'Approved vendor',
      title: 'Open your request portal',
      body: 'Respond to family or funeral-home requests, share quotes, mark scheduled, and save completion proof.',
      href: '/vendors/request',
      action: user ? 'Open vendor work' : 'Vendor sign in',
      onClick: user ? null : signIn,
      tone: 'primary',
    },
    {
      eyebrow: 'New support partner',
      title: 'Apply to be recommended in Passage tasks',
      body: 'Tell us what you provide, where you serve, and whether you support urgent or planned requests.',
      href: '/vendors/onboard',
      action: 'Apply to join',
    },
    {
      eyebrow: 'Scoped access',
      title: 'Vendors never browse family records',
      body: 'A request contains only the task, timing, contact boundary, and proof needed to complete the work.',
      href: '/trust',
      action: 'Trust model',
    },
  ];

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 24px 54px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.82fr) minmax(320px,1fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor portal</div>
            <h1 style={{ fontSize: 52, lineHeight: .98, margin: '10px 0 12px', fontWeight: 400 }}>Local help, only when the task needs it.</h1>
            <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.62, margin: 0 }}>
              Passage keeps vendor work tied to one family task: what was requested, when it is needed, what quote was shared, and what proof completed the loop.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <Link href="/vendors/onboard" onClick={() => trackEvent('vendor_apply_clicked', { href: '/vendors/onboard' })} style={{ display: 'inline-flex', minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 13, background: C.sage, color: '#fff', textDecoration: 'none', padding: '0 16px', fontWeight: 900, fontSize: 14 }}>
                Apply to join
              </Link>
              <button type="button" onClick={signIn} style={{ display: 'inline-flex', minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 13, background: C.card, color: C.sage, border: `1px solid ${C.border}`, padding: '0 16px', fontWeight: 900, fontSize: 14, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                Vendor sign in
              </button>
            </div>
            <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 16 }}>
              Vendor employees use the same portal. Approved vendor teams can respond from the request link or sign in with the email connected to their vendor profile.
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {cards.map((card) => {
              const actionStyle = {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 40,
                border: `1px solid ${C.border}`,
                background: card.tone === 'primary' ? C.sage : C.card,
                color: card.tone === 'primary' ? '#fff' : C.sage,
                borderRadius: 999,
                padding: '0 14px',
                fontSize: 12.5,
                fontWeight: 900,
                textDecoration: 'none',
                fontFamily: 'Georgia,serif',
                cursor: 'pointer',
              };
              const cardStyle = {
                background: card.tone === 'primary' ? C.sageFaint : C.card,
                border: `1px solid ${card.tone === 'primary' ? C.sage + '33' : C.border}`,
                borderRadius: 16,
                padding: '17px 18px',
                color: C.ink,
                boxShadow: '0 8px 24px rgba(55,45,35,.04)',
                width: '100%',
                boxSizing: 'border-box',
              };
              if (card.onClick) {
                return (
                  <article key={card.title} style={cardStyle}>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{card.eyebrow}</div>
                    <h2 style={{ color: C.ink, fontSize: 20, lineHeight: 1.15, margin: '4px 0 5px', fontWeight: 900 }}>{card.title}</h2>
                    <p style={{ color: C.mid, fontSize: 13.2, lineHeight: 1.45, margin: 0 }}>{card.body}</p>
                    <button type="button" onClick={card.onClick} style={{ ...actionStyle, marginTop: 12 }}>{card.action}</button>
                  </article>
                );
              }
              return (
                <article key={card.title} style={cardStyle}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{card.eyebrow}</div>
                  <h2 style={{ color: C.ink, fontSize: 20, lineHeight: 1.15, margin: '4px 0 5px', fontWeight: 900 }}>{card.title}</h2>
                  <p style={{ color: C.mid, fontSize: 13.2, lineHeight: 1.45, margin: 0 }}>{card.body}</p>
                  <Link href={card.href} onClick={() => trackEvent('vendor_card_clicked', { title: card.title, href: card.href, action: card.action })} style={{ ...actionStyle, marginTop: 12 }}>
                    {card.action}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <style jsx>{`
        @media (max-width: 720px) {
          section > div {
            grid-template-columns: 1fr !important;
          }
          a, button {
            max-width: 100%;
          }
        }
      `}</style>
      <SiteFooter />
    </main>
  );
}
