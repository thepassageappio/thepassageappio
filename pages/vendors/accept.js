import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { supabase } from '../../lib/supabaseBrowser';
import { friendlyAuthError, isLikelyEmail } from '../../lib/authFeedback';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function ScopeIcon({ index }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (index === 0) {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <path d="M9 12.5l2 2 4.5-4.5" />
        <circle cx="12" cy="12" r="8.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4.5 6.5C6 5 9 4 12 4s6 1 7.5 2.5C21 8 21 10 21 12s0 4-1.5 5.5C18 19 15 20 12 20s-6-1-7.5-2.5C3 16 3 14 3 12s0-4 1.5-5.5z" />
    </svg>
  );
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
    window.location.assign('/auth/google?next=' + encodeURIComponent(workspaceHref));
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

  const scopeItems = [
    ['Quote request', 'Respond with price, availability, or a clarification request.'],
    ['Accepted work', 'Mark scheduled or complete when the family or funeral home approves.'],
    ['Proof trail', 'Viewed, quoted, accepted, and completed status returns to the case record.'],
  ];

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
        .wrap { max-width: 940px; margin: 0 auto; padding: 34px 24px 64px; }
        .grid { display: grid; grid-template-columns: minmax(0,.88fr) minmax(300px,.66fr); gap: 16px; align-items: start; }
        .panel {
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 26px;
          box-shadow: var(--e2);
        }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(30px, 4.4vw, 44px);
          line-height: 1.04;
          letter-spacing: -.02em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        h2 {
          font-family: 'Fraunces', serif;
          font-weight: 460;
          font-size: 22px;
          letter-spacing: -.015em;
          color: var(--pine-950);
          margin: 8px 0 10px;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; margin: 0; }
        .scope-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px,1fr)); gap: 10px; margin-top: 18px; }
        .scope-card { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-md); padding: 13px; box-shadow: var(--e1); }
        .scope-icon {
          width: 30px; height: 30px; border-radius: var(--r-xs); background: var(--pine-100); color: var(--pine-700);
          display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
        }
        .scope-title { color: var(--pine-700); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
        .scope-body { color: var(--ink-600); font-size: 13px; line-height: 1.48; margin-top: 5px; }
        .th-error {
          background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700);
          border-radius: var(--r-sm); padding: 11px 14px; font-size: 13px; line-height: 1.48; margin-bottom: 10px;
        }
        .signed-in-note {
          background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-sm);
          padding: 12px; color: var(--ink-600); font-size: 13.5px; line-height: 1.45;
        }
        .signed-in-note strong { color: var(--ink-900); }
        .form-stack { display: grid; gap: 10px; }
        .th-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          border-radius: var(--r-full); padding: 0 18px; min-height: 50px;
          border: 1px solid transparent; cursor: pointer; text-decoration: none;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn:disabled { cursor: wait; opacity: .68; transform: none; }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-secondary {
          background: var(--bone-50); color: var(--pine-800); border-color: var(--line); box-shadow: var(--e1);
        }
        input[type='email'] {
          border: 1.5px solid var(--line);
          border-radius: var(--r-sm);
          background: var(--bone-100);
          padding: 13px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--ink-900);
          outline: none;
        }
        input[type='email'].has-error { border-color: var(--clay-600); }
        .th-confirm {
          background: var(--pine-50); border: 1px solid #D5E4DC; color: var(--pine-700);
          border-radius: var(--r-sm); padding: 11px 14px; font-size: 13px; line-height: 1.48;
        }

        @media (max-width: 720px) {
          .wrap { padding: 20px 16px 48px; }
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="wrap">
        <div className="grid">
          <div className="panel">
            <span className="eyebrow">Passage vendor access</span>
            <h1>Open scoped vendor work.</h1>
            <p className="lede">
              Vendors see only the request, timing, quote fields, and proof needed to complete the service. They do not browse family records or unrelated case notes.
            </p>
            <div className="scope-grid">
              {scopeItems.map(([title, body], index) => (
                <div className="scope-card" key={title}>
                  <span className="scope-icon"><ScopeIcon index={index} /></span>
                  <div className="scope-title">{title}</div>
                  <div className="scope-body">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <span className="eyebrow">Sign in</span>
            <h2>Use the vendor email.</h2>
            {error && <div className="th-error">{error}</div>}
            {user ? (
              <div className="form-stack">
                <div className="signed-in-note">Signed in as <strong>{user.email}</strong>.</div>
                <Link href={workspaceHref} className="th-btn th-btn-primary">Continue to vendor dashboard</Link>
              </div>
            ) : (
              <div className="form-stack">
                <button onClick={signInWithGoogle} className="th-btn th-btn-primary">Continue with Google</button>
                <input
                  value={email}
                  onChange={event => { setEmail(event.target.value); setError(''); setMagicSent(false); }}
                  type="email"
                  placeholder="vendor@example.com"
                  className={error ? 'has-error' : ''}
                />
                <button disabled={magicLoading} onClick={sendMagicLink} className="th-btn th-btn-secondary">{magicLoading ? 'Sending...' : 'Email me a sign-in link'}</button>
                {magicSent && <div className="th-confirm">Check your email. The secure link opens the vendor dashboard or request.</div>}
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
