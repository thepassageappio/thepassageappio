import { useState } from 'react';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { supabase } from '../../lib/supabaseBrowser';
import { friendlyAuthError, isLikelyEmail, normalizeEmail } from '../../lib/authFeedback';

const featureRows = [
  ['Your queue', 'Only client steps assigned to you appear first.'],
  ['Case context', 'You see the family-facing status and the next expected update.'],
  ['Proof', 'Notes, proof, and completion updates return to the case record.'],
];

function FeatureIcon({ index }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (index === 0) {
    return (
      <svg {...common}>
        <path d="M4 6h16M4 12h11M4 18h7" />
        <circle cx="19.5" cy="17.5" r="2" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M9 12.5l2 2 4.5-4.5" />
      <path d="M4.5 6.5C6 5 9 4 12 4s6 1 7.5 2.5C21 8 21 10 21 12s0 4-1.5 5.5C18 19 15 20 12 20s-6-1-7.5-2.5C3 16 3 14 3 12s0-4 1.5-5.5z" />
    </svg>
  );
}

export default function FuneralHomeStaffLogin() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(email);
    setSent(false);
    if (!cleanEmail) return setError('Enter the email your director invited.');
    if (!isLikelyEmail(cleanEmail)) return setError('Enter a valid email address, like name@example.com.');
    if (!supabase?.auth || typeof window === 'undefined') return setError('Sign-in is not configured in this environment.');
    setError('');
    setMagicLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: `${window.location.origin}/funeral-home/dashboard?staff=1&email=${encodeURIComponent(cleanEmail)}` },
    });
    setMagicLoading(false);
    if (authError) setError(friendlyAuthError(authError));
    else {
      setEmail(cleanEmail);
      setSent(true);
    }
  }

  async function signInGoogle() {
    if (!supabase?.auth || typeof window === 'undefined') return;
    window.location.assign('/auth/google?next=' + encodeURIComponent('/funeral-home/dashboard?staff=1'));
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
          --wait-700:#946B23; --wait-100:#F5EAD6;
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
        .wrap { max-width: 780px; margin: 0 auto; padding: 34px 24px 60px; }
        .card {
          background: var(--bone-50);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-lg);
          padding: 32px;
          box-shadow: var(--e2);
        }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(30px, 5vw, 42px);
          line-height: 1.06;
          letter-spacing: -.018em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; margin: 0; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin: 22px 0; }
        .feature-card {
          background: var(--pine-50);
          border: 1px solid #D5E4DC;
          border-radius: var(--r-md);
          padding: 14px;
          box-shadow: var(--e1);
        }
        .feature-icon {
          width: 34px; height: 34px;
          border-radius: var(--r-xs);
          background: var(--pine-100);
          color: var(--pine-700);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px;
        }
        .feature-title { color: var(--pine-700); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
        .feature-body { color: var(--ink-600); font-size: 13px; line-height: 1.48; margin-top: 5px; }
        .th-error {
          background: var(--clay-50);
          border: 1px solid var(--clay-200);
          color: var(--clay-700);
          border-radius: var(--r-sm);
          padding: 11px 14px;
          font-size: 13px;
          line-height: 1.48;
          margin-bottom: 12px;
        }
        .field-group { display: grid; gap: 7px; max-width: 560px; }
        .field-label { color: var(--pine-700); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; }
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
        }
        input[type='email'].has-error { border-color: var(--clay-600); }
        .th-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          border-radius: var(--r-full);
          padding: 12px 20px;
          min-height: 48px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
          white-space: nowrap;
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn:disabled { cursor: wait; opacity: .68; transform: none; }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800));
          color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-secondary {
          background: var(--bone-50);
          color: var(--pine-800);
          border-color: var(--line);
          box-shadow: var(--e1);
          margin-top: 10px;
          width: 100%;
        }
        .th-confirm {
          background: var(--pine-50);
          border: 1px solid #D5E4DC;
          color: var(--pine-700);
          border-radius: var(--r-sm);
          padding: 11px 14px;
          font-size: 13px;
          line-height: 1.48;
          margin-top: 12px;
        }

        @media (max-width: 640px) {
          .wrap { padding: 20px 16px 44px; }
          .card { padding: 22px 18px; border-radius: var(--r-md); }
          .field-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div className="card">
          <span className="eyebrow">Funeral-home staff</span>
          <h1>Open the work assigned to you.</h1>
          <p className="lede">
            Staff sign in with the email invited by a director. Passage opens assigned client steps first: what is due, what is waiting, and what proof closes the loop.
          </p>
          <div className="feature-grid">
            {featureRows.map(([title, body], index) => (
              <div className="feature-card" key={title}>
                <span className="feature-icon"><FeatureIcon index={index} /></span>
                <div className="feature-title">{title}</div>
                <div className="feature-body">{body}</div>
              </div>
            ))}
          </div>
          {error && <div className="th-error">{error}</div>}
          <div className="field-group">
            <label htmlFor="funeral-home-staff-email" className="field-label">Work email</label>
            <div className="field-row">
              <input
                id="funeral-home-staff-email"
                value={email}
                onChange={event => { setEmail(event.target.value); setError(''); setSent(false); }}
                type="email"
                placeholder="employee@funeralhome.com"
                className={error ? 'has-error' : ''}
              />
              <button disabled={magicLoading} onClick={sendMagicLink} className="th-btn th-btn-primary">{magicLoading ? 'Sending...' : 'Email link'}</button>
            </div>
          </div>
          {sent && <div className="th-confirm">Check your email. The secure link opens your staff queue.</div>}
          <button onClick={signInGoogle} className="th-btn th-btn-secondary">Continue with Google</button>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
