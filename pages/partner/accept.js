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
  soft: '#a09890',
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

export default function PartnerAcceptPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState('');

  const role = String(router.query.role || '').toLowerCase() === 'staff' ? 'staff' : 'director';
  const emailHint = useMemo(() => normalizeEmail(router.query.email), [router.query.email]);
  const dashboardHref = role === 'staff'
    ? `/funeral-home/dashboard?staff=1${emailHint ? `&email=${encodeURIComponent(emailHint)}` : ''}`
    : `/funeral-home/dashboard?partner=1${emailHint ? `&email=${encodeURIComponent(emailHint)}` : ''}`;

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
      options: { redirectTo: window.location.origin + dashboardHref },
    });
  }

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(email);
    setMagicSent(false);
    if (!cleanEmail) return setError('Enter the email address that received the Passage invite.');
    if (!isLikelyEmail(cleanEmail)) return setError('Enter a valid email address, like name@example.com.');
    if (!supabase?.auth || typeof window === 'undefined') return setError('Sign-in is not configured in this environment.');
    setError('');
    setMagicLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin + dashboardHref },
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
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '34px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(300px,.7fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 26, boxShadow: '0 14px 38px rgba(55,45,35,.06)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Passage partner invite</div>
            <h1 style={{ fontSize: 52, lineHeight: 1, fontWeight: 400, margin: '10px 0 12px' }}>
              {role === 'staff' ? 'Open your assigned funeral-home work.' : 'Set up your partner workspace.'}
            </h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65, margin: 0 }}>
              {role === 'staff'
                ? 'Use the invited email. Passage opens the staff queue first: due work, waiting points, family-safe updates, and proof.'
                : 'Use the invited owner email. Passage opens setup first: co-branding, locations, employees, first cases, warm inbounds, and reporting.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 9, marginTop: 18 }}>
              {[
                ['Role scoped', role === 'staff' ? 'Staff see assigned work, not business setup.' : 'Directors see cases, setup, staff, billing prompts, and reports.'],
                ['Same record', 'Requests keep owner, message, waiting point, proof, and history together.'],
                ['Invite-safe', 'Nothing sends from this page. Sign-in only opens the workspace tied to your email.'],
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
            <h2 style={{ fontSize: 25, lineHeight: 1.15, margin: '8px 0 10px', fontWeight: 400 }}>Use the invited email.</h2>
            {error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 12, padding: 10, fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>{error}</div>}
            {user ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.5, lineHeight: 1.45 }}>
                  Signed in as <strong style={{ color: C.ink }}>{user.email}</strong>.
                </div>
                <Link href={dashboardHref} style={{ minHeight: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.sage, color: '#fff', borderRadius: 13, textDecoration: 'none', fontWeight: 900 }}>
                  Continue
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <button onClick={signInWithGoogle} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 50, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Continue with Google</button>
                <div style={{ display: 'grid', gap: 7 }}>
                  <input value={email} onChange={event => { setEmail(event.target.value); setError(''); setMagicSent(false); }} type="email" placeholder="invited@funeralhome.com" style={{ border: `1.5px solid ${error ? C.rose : C.border}`, borderRadius: 13, background: C.bg, padding: '13px 14px', fontFamily: 'Georgia,serif', fontSize: 14 }} />
                  <button disabled={magicLoading} onClick={sendMagicLink} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.ink, borderRadius: 13, minHeight: 48, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: magicLoading ? 'wait' : 'pointer', opacity: magicLoading ? .65 : 1 }}>{magicLoading ? 'Sending...' : 'Email me a sign-in link'}</button>
                </div>
                {magicSent && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: 10, color: C.sage, fontSize: 13, lineHeight: 1.45 }}>Check your email. The secure link opens the correct Passage dashboard or request.</div>}
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}