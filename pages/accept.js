import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseBrowser';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import { friendlyAuthError, isLikelyEmail, normalizeEmail } from '../lib/authFeedback';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

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
  const [magicLoading, setMagicLoading] = useState(false);
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
    const next = '/accept?token=' + encodeURIComponent(inviteToken || '');
    window.location.assign('/auth/google?next=' + encodeURIComponent(next));
  }

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(emailLogin);
    setMagicSent(false);
    if (!inviteToken) return setError('This invite link is missing its token.');
    if (!cleanEmail) return setError('Enter the email address that received this invite.');
    if (!isLikelyEmail(cleanEmail)) return setError('Enter a valid email address, like name@example.com.');
    if (!supabase?.auth) return setError('Sign-in is not configured in this environment.');
    setError('');
    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: `${SITE_URL}/accept?token=${encodeURIComponent(inviteToken)}` },
    });
    setMagicLoading(false);
    if (error) setError(friendlyAuthError(error));
    else {
      setEmailLogin(cleanEmail);
      setMagicSent(true);
    }
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
        .wrap { max-width: 800px; margin: 0 auto; padding: 40px 24px 68px; }
        .panel {
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 28px;
          box-shadow: var(--e2);
        }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; display: block; }
        h1 {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(26px, 3.6vw, 36px);
          line-height: 1.06;
          letter-spacing: -.015em;
          color: var(--pine-950);
          margin: 0 0 10px;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; max-width: 640px; margin: 0 0 20px; }
        .loading-note { color: var(--ink-400); }
        .th-error {
          background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700);
          border-radius: var(--r-sm); padding: 13px 15px; font-size: 13.5px; line-height: 1.5; margin-bottom: 16px;
        }
        .preview-stack { display: grid; gap: 12px; margin-bottom: 18px; }
        .preview-card {
          background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-md); padding: 16px;
        }
        .preview-card.neutral { background: var(--bone-50); border-color: var(--line-soft); }
        .preview-title { color: var(--pine-700); font-size: 10.5px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
        .preview-heading { color: var(--ink-900); font-size: 20px; line-height: 1.24; margin-top: 5px; font-weight: 600; }
        .preview-sub { color: var(--ink-500); font-size: 12.5px; margin-top: 5px; line-height: 1.5; }
        .form-stack { display: grid; gap: 10px; max-width: 520px; }
        .th-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14.5px;
          border-radius: var(--r-full); padding: 0 20px; min-height: 52px;
          border: 1px solid transparent; cursor: pointer; text-decoration: none;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn:disabled { cursor: wait; opacity: .62; transform: none; }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-secondary {
          background: var(--bone-50); color: var(--pine-800); border-color: var(--line); box-shadow: var(--e1);
        }
        .field-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; align-items: center; }
        input[type='email'] {
          border: 1.5px solid var(--line);
          border-radius: var(--r-sm);
          background: var(--bone-100);
          padding: 13px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--ink-900);
          outline: none;
          box-sizing: border-box;
          width: 100%;
        }
        .th-confirm {
          background: var(--pine-50); border: 1px solid #D5E4DC; color: var(--pine-700);
          border-radius: var(--r-sm); padding: 11px 14px; font-size: 13px; line-height: 1.48; margin: 0;
        }
        .action-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .link-row { margin-top: 20px; }
        .link-row a { color: var(--pine-700); font-size: 13px; font-weight: 600; text-decoration: none; }

        @media (max-width: 640px) {
          .wrap { padding: 22px 16px 48px; }
          .panel { padding: 20px; }
          .action-row { flex-direction: column; align-items: stretch; }
          .th-btn { width: 100%; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="wrap">
        <div className="panel">
          <span className="eyebrow">Passage invite</span>
          <h1>You have been asked to help.</h1>
          <p className="lede">Sign in with the email that received this invite. Passage will show one responsibility at a time, keep the rest of the estate private, and send your response back to the coordinator.</p>

          {loading && <div className="loading-note">Checking invite...</div>}
          {error && <div className="th-error">{error}</div>}

          {preview && (
            <div className="preview-stack">
              <div className="preview-card">
                <div className="preview-title">Estate</div>
                <div className="preview-heading">{preview.estate?.name || 'Estate coordination'}</div>
                <div className="preview-sub">Coordinator: {preview.estate?.coordinatorName || 'Family coordinator'}</div>
              </div>
              <div className="preview-card neutral">
                <div className="preview-title" style={{ color: 'var(--clay-600)' }}>Your responsibility</div>
                <div className="preview-heading">{preview.task?.title || 'Open your assigned task'}</div>
                <div className="preview-sub">{preview.task?.description || 'You can accept it, mark it waiting, ask for help, or record what happened.'}</div>
                {preview.participant?.emailHint && <div className="preview-sub" style={{ marginTop: 6 }}>Invite email: {preview.participant.emailHint}</div>}
              </div>
            </div>
          )}

          {!user && (
            <div className="form-stack">
              <button disabled={!inviteToken || loading} onClick={signIn} className="th-btn th-btn-primary">Continue with Google</button>
              <div className="field-row">
                <input value={emailLogin} onChange={e => { setEmailLogin(e.target.value); setError(''); setMagicSent(false); }} type="email" placeholder="Or enter the invited email" />
                <button disabled={!emailLogin || !inviteToken || magicLoading} onClick={sendMagicLink} className="th-btn th-btn-secondary">{magicLoading ? 'Sending...' : 'Email link'}</button>
              </div>
              {magicSent && <p className="th-confirm">Check your email for a secure sign-in link. It will bring you back to this invite.</p>}
            </div>
          )}
          {user && (
            <div className="action-row">
              <button disabled={accepting || !inviteToken} onClick={() => acceptInvite()} className="th-btn th-btn-primary">{accepting ? 'Accepting invite...' : 'Accept invite'}</button>
              <button onClick={signOut} className="th-btn th-btn-secondary">Use another email</button>
            </div>
          )}
          <div className="link-row">
            <Link href="/participating">Already accepted? Open my tasks</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
