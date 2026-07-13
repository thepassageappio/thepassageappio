import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { trackEvent } from '../lib/trackEvent';

const steps = [
  ['1', 'You receive an invite', 'A family coordinator, funeral home, or care partner asks for help with one specific responsibility.'],
  ['2', 'You open one clear request', 'Passage shows what is needed, timing, waiting point, and proof needed. The full family record stays private.'],
  ['3', 'You answer once', 'Own the request, ask for help, show what is waiting, save a note, or mark done with proof.'],
  ['4', 'The coordinator sees the update', 'Your response returns to the shared record so the family is not chasing another thread.'],
];

const trustRows = [
  ['Scoped access', 'Participants see only the request, timing, and proof they were invited to handle.'],
  ['No noisy group chat', 'Updates are saved to the record instead of scattered across calls, texts, and inboxes.'],
  ['Proof-first', 'Notes, files, status, and timestamps stay attached to the responsibility.'],
];

export default function ParticipantsPage() {
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
        .wrap { max-width: 1040px; margin: 0 auto; padding: 34px 24px 58px; }
        .hero { display: grid; grid-template-columns: minmax(0,.9fr) minmax(300px,.72fr); gap: 18px; align-items: stretch; }
        .panel {
          background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg);
          padding: 26px; box-shadow: var(--e2);
        }
        .panel.tint { background: var(--pine-50); border-color: #D5E4DC; }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 {
          font-family: 'Fraunces', serif;
          font-weight: 440;
          font-size: clamp(30px, 4.2vw, 48px);
          line-height: .98;
          letter-spacing: -.02em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.6; margin: 0; max-width: 640px; }
        .actions { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
        .th-btn {
          min-height: 46px; border-radius: var(--r-full); display: inline-flex; align-items: center; justify-content: center;
          padding: 0 18px; font-weight: 600; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 13.5px;
          border: 1px solid transparent;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-secondary { background: var(--bone-50); color: var(--pine-800); border-color: var(--line); box-shadow: var(--e1); }
        .th-note {
          background: var(--clay-50); border: 1px solid var(--clay-200); border-radius: var(--r-sm);
          padding: 12px; color: var(--ink-600); font-size: 13px; line-height: 1.48; margin-top: 16px;
        }
        .step-row { display: grid; grid-template-columns: 34px minmax(0,1fr); gap: 11px; padding: 12px 0; border-bottom: 1px solid var(--line-soft); }
        .step-row:last-child { border-bottom: none; }
        .step-num {
          width: 28px; height: 28px; border-radius: var(--r-full); background: var(--bone-50); color: var(--pine-700);
          display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; box-shadow: var(--e1);
        }
        .step-title { color: var(--ink-900); font-size: 17.5px; line-height: 1.2; font-weight: 600; }
        .step-body { color: var(--ink-600); font-size: 13.2px; line-height: 1.48; margin-top: 4px; }
        .trust-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; margin-top: 14px; }
        .trust-card { padding: 18px; }
        .trust-body { color: var(--ink-500); font-size: 13.5px; line-height: 1.52; margin-top: 7px; }

        @media (max-width: 760px) {
          .wrap { padding: 20px 18px 44px; }
          .hero, .trust-grid { grid-template-columns: 1fr; }
          .actions { flex-direction: column; }
          .th-btn { width: 100%; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="wrap">
        <div className="hero">
          <div className="panel">
            <span className="eyebrow">For Invited Helpers</span>
            <h1>Help with one clear request, without opening the whole estate.</h1>
            <p className="lede">
              Passage is used when a family asks a relative, friend, clergy member, vendor, or trusted helper to handle one specific piece of work. You see the responsibility, the context needed to act, and the safest way to update the coordinator.
            </p>
            <div className="actions">
              <Link href="/participating" onClick={() => trackEvent('participant_public_cta_clicked', { label: 'Open your assigned request', href: '/participating' })} className="th-btn th-btn-primary">Open your assigned request</Link>
              <Link href="/login?next=/participating" onClick={() => trackEvent('participant_public_cta_clicked', { label: 'Participant sign in', href: '/login?next=/participating' })} className="th-btn th-btn-secondary">Participant sign in</Link>
              <Link href="/trust" onClick={() => trackEvent('participant_public_cta_clicked', { label: 'Read the Access Model', href: '/trust' })} className="th-btn th-btn-secondary">Read the Access Model</Link>
            </div>
            <div className="th-note">
              Use the email that received the Passage invite. If you were added under a different address, ask the coordinator to resend the assignment.
            </div>
          </div>

          <div className="panel tint">
            <span className="eyebrow">What Happens</span>
            {steps.map(([num, title, body]) => (
              <div className="step-row" key={title}>
                <div className="step-num">{num}</div>
                <div>
                  <div className="step-title">{title}</div>
                  <div className="step-body">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="trust-grid">
          {trustRows.map(([title, body]) => (
            <div key={title} className="panel trust-card">
              <span className="eyebrow">{title}</span>
              <div className="trust-body">{body}</div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
