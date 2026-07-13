import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { supabase } from '../../lib/supabaseBrowser';
import { friendlyAuthError, isLikelyEmail, normalizeEmail } from '../../lib/authFeedback';

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
        .wrap { max-width: 1080px; margin: 0 auto; padding: 34px 24px 60px; }
        .grid { display: grid; grid-template-columns: minmax(0,.76fr) minmax(320px,1fr); gap: 18px; align-items: start; }
        .panel {
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 28px;
          box-shadow: var(--e2);
        }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(32px, 4.6vw, 46px);
          line-height: 1.04;
          letter-spacing: -.02em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; margin: 0; }
        .th-note {
          background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700);
          border-radius: var(--r-sm); padding: 12px 15px; font-size: 13px; line-height: 1.5; margin-top: 18px;
        }
        .th-error {
          background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700);
          border-radius: var(--r-sm); padding: 11px 14px; font-size: 13px; line-height: 1.48; margin-bottom: 4px;
        }
        .form-stack { display: grid; gap: 10px; margin-top: 18px; }
        .th-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
          border-radius: var(--r-full); padding: 0 20px; min-height: 50px;
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
        .field-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; }
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
        .card-stack { display: grid; gap: 10px; }
        .vcard {
          display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 14px; align-items: center;
          background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md);
          padding: 17px 18px; text-decoration: none; color: var(--ink-900); box-shadow: var(--e1);
          transition: transform .25s var(--ease), box-shadow .25s var(--ease);
        }
        .vcard:hover { transform: translateY(-2px); box-shadow: var(--e2); }
        .vcard.primary { background: var(--pine-50); border-color: #D5E4DC; }
        .vcard-eyebrow { display: block; color: var(--pine-700); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
        .vcard-title { display: block; font-size: 19px; line-height: 1.18; margin-top: 5px; font-weight: 600; }
        .vcard-body { display: block; color: var(--ink-500); font-size: 13.2px; line-height: 1.48; margin-top: 5px; }
        .vcard-action {
          border: 1px solid var(--line); background: var(--bone-50); color: var(--pine-800);
          border-radius: var(--r-full); padding: 8px 13px; font-size: 12.5px; font-weight: 600; white-space: nowrap;
        }

        @media (max-width: 720px) {
          .wrap { padding: 20px 16px 46px; }
          .grid { grid-template-columns: 1fr; }
          .field-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="wrap">
        <div className="grid">
          <div className="panel">
            <span className="eyebrow">Vendor dashboard</span>
            <h1>Respond only to the work requested.</h1>
            <p className="lede">
              Vendor owners manage the dashboard. Vendor employees open assigned work. Both are scoped to requests, timing, quote fields, and proof, never unrelated family records.
            </p>
            <div className="th-note">
              Approved vendor owners sign in here. Vendor employees can use the employee doorway or the link sent to their email. New vendors apply first so Passage can review service area, category, and response expectations.
            </div>
            {!user && (
              <div className="form-stack">
                {error && <div className="th-error">{error}</div>}
                <button onClick={signIn} className="th-btn th-btn-primary">Continue with Google</button>
                <div className="field-row">
                  <input
                    value={email}
                    onChange={event => { setEmail(event.target.value); setError(''); setSent(false); }}
                    type="email"
                    placeholder="vendor@example.com"
                    className={error ? 'has-error' : ''}
                  />
                  <button disabled={magicLoading} onClick={sendMagicLink} className="th-btn th-btn-secondary">{magicLoading ? 'Sending...' : 'Email link'}</button>
                </div>
                {sent && <div className="th-confirm">Check your email. The secure link opens your vendor dashboard.</div>}
              </div>
            )}
          </div>

          <div className="card-stack">
            {vendorCards.map((card) => (
              <Link key={card.title} href={card.href} className={card.tone === 'primary' ? 'vcard primary' : 'vcard'}>
                <span>
                  <span className="vcard-eyebrow">{card.eyebrow}</span>
                  <span className="vcard-title">{card.title}</span>
                  <span className="vcard-body">{card.body}</span>
                </span>
                <span className="vcard-action">{card.action}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
