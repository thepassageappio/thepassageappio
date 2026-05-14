import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import SmartAddressInput from '../../components/SmartAddressInput';
import { supabase } from '../../lib/supabaseBrowser';
import { friendlyAuthError, isLikelyEmail, normalizeEmail } from '../../lib/authFeedback';

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
};

export default function FuneralHomeSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    organizationName: '',
    directorName: '',
    supportEmail: '',
    supportPhone: '',
    locationName: 'Main location',
    locationAddress: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    placeId: '',
  });

  useEffect(() => {
    if (!supabase?.auth) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setToken(data.session?.access_token || '');
      if (data.session?.user?.email) {
        setEmail(data.session.user.email);
        setForm(prev => ({ ...prev, supportEmail: prev.supportEmail || data.session.user.email, directorName: prev.directorName || data.session.user.user_metadata?.full_name || '' }));
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setToken(session?.access_token || '');
      if (session?.user?.email) {
        setEmail(session.user.email);
        setForm(prev => ({ ...prev, supportEmail: prev.supportEmail || session.user.email, directorName: prev.directorName || session.user.user_metadata?.full_name || '' }));
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signInGoogle() {
    if (!supabase?.auth || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(email);
    setMagicSent(false);
    if (!cleanEmail) return setError('Enter your work email first.');
    if (!isLikelyEmail(cleanEmail)) return setError('Enter a valid email address, like name@example.com.');
    if (!supabase?.auth || typeof window === 'undefined') return setError('Sign-in is not configured in this environment.');
    setError('');
    setMagicLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.href },
    });
    setMagicLoading(false);
    if (authError) setError(friendlyAuthError(authError));
    else {
      setEmail(cleanEmail);
      setMagicSent(true);
    }
  }

  async function createWorkspace(event) {
    event.preventDefault();
    if (!token) return setError('Sign in before creating the workspace.');
    setLoading(true);
    setError('');
    const response = await fetch('/api/partnerSelfServeSetup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        organizationName: form.organizationName,
        directorName: form.directorName,
        supportEmail: form.supportEmail || user?.email,
        supportPhone: form.supportPhone,
        location: {
          name: form.locationName,
          address: form.locationAddress,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
          placeId: form.placeId,
        },
      }),
    });
    const json = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(json.error || 'Could not create the partner workspace.');
    router.push(`/funeral-home/dashboard?partner=1&email=${encodeURIComponent(user.email)}`);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} />
      <section style={{ maxWidth: 980, margin: '0 auto', padding: '30px 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.8fr) minmax(320px,1fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 26, boxShadow: '0 14px 38px rgba(55,45,35,.06)' }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Partner setup</div>
            <h1 style={{ fontSize: 52, lineHeight: 1, margin: '10px 0 12px', fontWeight: 400 }}>Create the funeral-home workspace.</h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65, margin: 0 }}>
              Start with the organization, owner, and first location. After setup, Passage opens the command center so you can add employees, create or import cases, and review warm inbound family requests.
            </p>
            <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
              {['1. Confirm workspace and co-branding', '2. Add locations and employees', '3. Create or import first cases', '4. Assign one next task from the case spine'].map(item => (
                <div key={item} style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: 11, color: C.mid, fontSize: 13.5, lineHeight: 1.45, fontWeight: 800 }}>{item}</div>
              ))}
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 22, boxShadow: '0 10px 30px rgba(55,45,35,.045)' }}>
            {!user ? (
              <div>
                <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Sign in first</div>
                <h2 style={{ fontSize: 26, lineHeight: 1.15, margin: '8px 0 10px', fontWeight: 400 }}>Use your work email.</h2>
                {error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 12, padding: 10, fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>{error}</div>}
                <button onClick={signInGoogle} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 13, minHeight: 50, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', width: '100%', marginBottom: 9 }}>Continue with Google</button>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8 }}>
                  <input value={email} onChange={event => { setEmail(event.target.value); setError(''); setMagicSent(false); }} type="email" placeholder="director@funeralhome.com" style={{ border: `1.5px solid ${error ? C.rose : C.border}`, borderRadius: 13, background: C.bg, padding: '13px 14px', fontFamily: 'Georgia,serif', fontSize: 14 }} />
                  <button disabled={magicLoading} onClick={sendMagicLink} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.ink, borderRadius: 13, padding: '0 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: magicLoading ? 'wait' : 'pointer', opacity: magicLoading ? .65 : 1 }}>{magicLoading ? 'Sending...' : 'Email link'}</button>
                </div>
                {magicSent && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: 10, color: C.sage, fontSize: 13, lineHeight: 1.45, marginTop: 10 }}>Check your email. Come back here after signing in.</div>}
              </div>
            ) : (
              <form onSubmit={createWorkspace} style={{ display: 'grid', gap: 10 }}>
                <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Workspace details</div>
                <input required value={form.organizationName} onChange={event => setForm(prev => ({ ...prev, organizationName: event.target.value }))} placeholder="Funeral home name" style={inputStyle} />
                <input value={form.directorName} onChange={event => setForm(prev => ({ ...prev, directorName: event.target.value }))} placeholder="Director / owner name" style={inputStyle} />
                <input value={form.supportEmail} onChange={event => setForm(prev => ({ ...prev, supportEmail: event.target.value }))} placeholder="Family support email" style={inputStyle} />
                <input value={form.supportPhone} onChange={event => setForm(prev => ({ ...prev, supportPhone: event.target.value }))} placeholder="Family support phone" style={inputStyle} />
                <input value={form.locationName} onChange={event => setForm(prev => ({ ...prev, locationName: event.target.value }))} placeholder="Main location name" style={inputStyle} />
                <SmartAddressInput
                  label="Main location address"
                  value={form.locationAddress}
                  onChange={(value, parsed = {}) => setForm(prev => ({
                    ...prev,
                    locationAddress: value,
                    city: parsed.city || prev.city,
                    state: parsed.state || prev.state,
                    zip: parsed.postalCode || parsed.zip || prev.zip,
                    country: parsed.country || prev.country,
                    placeId: parsed.placeId || prev.placeId,
                  }))}
                  colors={C}
                  placeholder="Start typing the location address"
                />
                {error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 12, padding: 10, fontSize: 13, lineHeight: 1.45 }}>{error}</div>}
                <button disabled={loading} style={{ border: 'none', background: loading ? C.border : C.sage, color: '#fff', borderRadius: 13, minHeight: 52, padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: loading ? 'wait' : 'pointer' }}>
                  {loading ? 'Creating workspace...' : 'Create workspace and open command center'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

const inputStyle = { border: `1.5px solid ${C.border}`, borderRadius: 13, background: C.bg, padding: '13px 14px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink };
