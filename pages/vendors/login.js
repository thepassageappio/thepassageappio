import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { supabase } from '../../lib/supabaseBrowser';
import { friendlyAuthError, isLikelyEmail, normalizeEmail } from '../../lib/authFeedback';

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
    eyebrow: 'Vendor owner',
    title: 'Manage the vendor dashboard',
    body: 'Owners and managers sign in with the approved vendor email to see requests, invite employees, review payout readiness, and track completion proof.',
    href: '/vendors/request',
    action: 'Owner sign in',
    tone: 'primary',
  },
  {
    eyebrow: 'Vendor employee',
    title: 'Open assigned vendor work',
    body: 'Team members use the invited email or request link to see only the request, timing, quote fields, and proof needed.',
    href: '/vendors/accept',
    action: 'Employee sign in',
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
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);

  useEffect(() => {
    if (!supabase?.auth) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setError('');
    if (typeof window === 'undefined') return;
    window.location.assign('/auth/google?next=' + encodeURIComponent('/vendors/request'));
  }

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(email);
    setSent(false);
    if (!cleanEmail) return setError('Enter the email connected to your vendor profile or request.');
    if (!isLikelyEmail(cleanEmail)) return setError('Enter a valid email address, like name@example.com.');
    if (!supabase?.auth || typeof window === 'undefined') return setError('Sign-in is not configured in this environment.');
    setError('');
    setMagicLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: `${window.location.origin}/vendors/request` },
    });
    setMagicLoading(false);
    if (authError) setError(friendlyAuthError(authError));
    else {
      setEmail(cleanEmail);
      setSent(true);
    }
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
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor dashboard</div>
            <h1 style={{ fontSize: 52, lineHeight: .98, margin: '10px 0 12px', fontWeight: 400 }}>Respond only to the work requested.</h1>
            <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.62, margin: 0 }}>
              Vendor owners manage the dashboard. Vendor employees open assigned work. Both are scoped to requests, timing, quote fields, and proof, never unrelated family records.
            </p>
            <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 16 }}>
              Approved vendor owners sign in here. Vendor employees can use the employee doorway or the link sent to their email. New vendors apply first so Passage can review service area, category, and response expectations.
            </div>
            {!user && (
              <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
                {error && <div style={{ background: '#fdf3f3', border: '1px solid #c47a7a33', color: '#c47a7a', borderRadius: 12, padding: 10, fontSize: 13, lineHeight: 1.45 }}>{error}</div>}
                <button onClick={signIn} style={{ minHeight: 50, border: 'none', background: C.sage, color: '#fff', borderRadius: 14, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                  Continue with Google
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8 }}>
                  <input value={email} onChange={event => { setEmail(event.target.value); setError(''); setSent(false); }} type="email" placeholder="vendor@example.com" style={{ border: `1.5px solid ${error ? '#c47a7a' : C.border}`, borderRadius: 13, background: C.bg, padding: '13px 14px', fontFamily: 'Georgia,serif', fontSize: 14 }} />
                  <button disabled={magicLoading} onClick={sendMagicLink} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.ink, borderRadius: 13, padding: '0 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: magicLoading ? 'wait' : 'pointer', opacity: magicLoading ? .65 : 1 }}>{magicLoading ? 'Sending...' : 'Email link'}</button>
                </div>
                {sent && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: 10, color: C.sage, fontSize: 13, lineHeight: 1.45 }}>Check your email. The secure link opens your vendor dashboard.</div>}
              </div>
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