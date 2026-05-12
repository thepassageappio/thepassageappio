import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseBrowser';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

export default function AcceptInvitePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [emailLogin, setEmailLogin] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const inviteToken = String(router.query.token || router.query.invite || router.query.invite_token || '').trim();

  useEffect(() => {
    if (!router.isReady) return;
    if (!supabase?.auth) {
      setLoading(false);
      setError('Sign-in is not configured in this environment.');
      return undefined;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setToken(session?.access_token || '');
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setToken(session?.access_token || '');
    });
    return () => data.subscription.unsubscribe();
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) return;
    loadPreview();
  }, [router.isReady, inviteToken]);

  useEffect(() => {
    if (user && token && inviteToken) acceptInvite(token);
  }, [user, token, inviteToken]);

  async function loadPreview() {
    setLoading(true);
    setError('');
    if (!inviteToken) {
      setError('This invite link is missing its token.');
      setLoading(false);
      return;
    }
    const res = await fetch('/api/invitePreview?token=' + encodeURIComponent(inviteToken));
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not load this invite.');
    else setPreview(json);
    setLoading(false);
  }

  async function signIn() {
    if (!supabase?.auth) return setError('Sign-in is not configured in this environment.');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${SITE_URL}/accept?token=${encodeURIComponent(inviteToken)}` },
    });
  }

  async function sendMagicLink() {
    if (!emailLogin || !inviteToken) return;
    if (!supabase?.auth) return setError('Sign-in is not configured in this environment.');
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: emailLogin,
      options: { emailRedirectTo: `${SITE_URL}/accept?token=${encodeURIComponent(inviteToken)}` },
    });
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  async function acceptInvite(accessToken = token) {
    if (!accessToken || accepting) return;
    setAccepting(true);
    setError('');
    const res = await fetch('/api/acceptParticipantInvite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + accessToken },
      body: JSON.stringify({ inviteToken }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || 'Could not accept this invite.');
      setAccepting(false);
      return;
    }
    router.replace(json.redirectTo || `/participating?estate=${encodeURIComponent(json.estateId || '')}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setToken('');
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 920, margin: '0 auto', padding: '42px 28px 70px' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, boxShadow: '0 14px 42px rgba(55,45,35,.06)' }}>
          <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 10 }}>Passage invite</div>
          <h1 style={{ fontSize: 34, lineHeight: 1.08, margin: '0 0 10px', fontWeight: 400 }}>You have been asked to help.</h1>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65, maxWidth: 680, margin: '0 0 20px' }}>Sign in with the email that received this invite. Passage will show one responsibility at a time, keep the rest of the estate private, and send your response back to the coordinator.</p>

          {loading && <div style={{ color: C.soft }}>Checking invite...</div>}
          {error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 15, color: C.rose, marginBottom: 16 }}>{error}</div>}

          {preview && (
            <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
              <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 16, padding: 16 }}>
                <div style={{ color: C.sage, fontSize: 11, fontWeight: 900, letterSpacing: '.13em', textTransform: 'uppercase' }}>Estate</div>
                <div style={{ color: C.ink, fontSize: 22, lineHeight: 1.25, marginTop: 4 }}>{preview.estate?.name || 'Estate coordination'}</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>Coordinator: {preview.estate?.coordinatorName || 'Family coordinator'}</div>
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                <div style={{ color: C.sage, fontSize: 11, fontWeight: 900, letterSpacing: '.13em', textTransform: 'uppercase' }}>Your responsibility</div>
                <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.25, marginTop: 4 }}>{preview.task?.title || 'Open your assigned task'}</div>
                <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>{preview.task?.description || 'You can accept it, mark it waiting, ask for help, or record what happened.'}</div>
                {preview.participant?.emailHint && <div style={{ color: C.soft, fontSize: 12, marginTop: 8 }}>Invite email: {preview.participant.emailHint}</div>}
              </div>
            </div>
          )}

          {!user && (
            <div style={{ maxWidth: 540 }}>
              <button disabled={!inviteToken || loading} onClick={signIn} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 14, minHeight: 52, padding: '0 22px', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 900, cursor: loading ? 'default' : 'pointer', opacity: loading ? .6 : 1 }}>Continue with Google</button>
              <div style={{ height: 12 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center' }}>
                <input value={emailLogin} onChange={e => setEmailLogin(e.target.value)} type="email" placeholder="Or enter the invited email" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'Georgia,serif' }} />
                <button disabled={!emailLogin || !inviteToken} onClick={sendMagicLink} style={{ border: `1px solid ${C.border}`, borderRadius: 13, minHeight: 48, padding: '0 16px', background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: emailLogin ? 'pointer' : 'not-allowed', opacity: emailLogin ? 1 : .55 }}>Email link</button>
              </div>
              {magicSent && <p style={{ color: C.sage, fontSize: 13, lineHeight: 1.6, marginBottom: 0 }}>Check your email for a secure sign-in link. It will bring you back to this invite.</p>}
            </div>
          )}
          {user && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button disabled={accepting || !inviteToken} onClick={() => acceptInvite()} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 14, minHeight: 52, padding: '0 22px', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 900, cursor: accepting ? 'default' : 'pointer', opacity: accepting ? .65 : 1 }}>{accepting ? 'Accepting invite...' : 'Accept invite'}</button>
              <button onClick={signOut} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 14, minHeight: 52, padding: '0 18px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Use another email</button>
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <Link href="/participating" style={{ color: C.sage, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Already accepted? Open my tasks</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
