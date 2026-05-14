import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { supabase } from '../../lib/supabaseBrowser';
import { friendlyAuthError, isLikelyEmail } from '../../lib/authFeedback';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
  amber: '#a97832',
  amberFaint: '#fbf5e8',
};

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export default function VendorAcceptPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState('');
  const emailHint = useMemo(() => normalizeEmail(router.query.email), [router.query.email]);
  const requestToken = String(router.query.token || '').trim();
  const workspaceHref = requestToken ? `/vendors/request?token=${encodeURIComponent(requestToken)}` : '/vendors/request';

  useEffect(() => {
    if (emailHint) setEmail(emailHint);
  }, [emailHint]);

  useEffect(() => {
    if (!supabase?.auth) return undefined;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    if (!supabase?.auth || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + workspaceHref },
    });
  }

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(email);
    setMagicSent(false);
    if (!cleanEmail) return setError('Enter the email address connected to the vendor profile or request.');
    if (!isLikelyEmail(cleanEmail)) return setError('Enter a valid email address, like name@example.com.');
    if (!supabase?.auth || typeof window === 'undefined') return setError('Sign-in is not configured in this environment.');
    setError('');
    setMagicLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin + workspaceHref },
    });
    setMagicLoading(false);
    if (authError) setError(friendlyAuthError(authError));
    else {
      setEmail(cleanEmail);
      setMagicSent(true);
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
      <section style={{ maxWidth: 920, margin: '0 auto', padding: '34px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(300px,.68fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 26, boxShadow: '0 14px 38px rgba(55,45,35,.06)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Passage vendor access</div>
            <h1 style={{ fontSize: 52, lineHeight: 1, fontWeight: 400, margin: '10px 0 12px' }}>Open scoped vendor work.</h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65, margin: 0 }}>
              Vendors see only the request, timing, quote fields, and proof needed to complete the service. They do not browse family records or unrelated case notes.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 9, marginTop: 18 }}>
              {[
                ['Quote request', 'Respond with price, availability, or a clarification request.'],
                ['Accepted work', 'Mark scheduled or complete when the family or funeral home approves.'],
                ['Proof trail', 'Viewed, quoted, accepted, and completed status returns to the case spine.'],
              ].map(([title, body]) => (
                <div key={title} style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 13 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 5 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 22, boxShadow: '0 10px 30px rgba(55,45,35,.045)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Sign in</div>
            <h2 style={{ fontSize: 25, lineHeight: 1.15, margin: '8px 0 10px', fontWeight: 400 }}>Use the vendor email.</h2>
            {error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 12, padding: 10, fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>{error}</div>}
            {user ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.5, lineHeight: 1.45 }}>
                  Signed in as <strong style={{ color: C.ink }}>{user.email}</strong>.
                </div>
                <Link href={workspaceHref} style={{ minHeight: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.sage, color: '#fff', borderRadius: 13, textDecoration: 'none', fontWeight: 900 }}>
                  Continue to vendor workspace
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <button onClick={signInWithGoogle} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 50, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Continue with Google</button>
                <div style={{ display: 'grid', gap: 7 }}>
                  <input value={email} onChange={event => { setEmail(event.target.value); setError(''); setMagicSent(false); }} type="email" placeholder="vendor@example.com" style={{ border: `1.5px solid ${error ? C.rose : C.border}`, borderRadius: 13, background: C.bg, padding: '13px 14px', fontFamily: 'Georgia,serif', fontSize: 14 }} />
                  <button disabled={magicLoading} onClick={sendMagicLink} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.ink, borderRadius: 13, minHeight: 48, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: magicLoading ? 'wait' : 'pointer', opacity: magicLoading ? .65 : 1 }}>{magicLoading ? 'Sending...' : 'Email me a sign-in link'}</button>
                </div>
                {magicSent && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: 10, color: C.sage, fontSize: 13, lineHeight: 1.45 }}>Check your email. The secure link opens the vendor workspace or request.</div>}
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
