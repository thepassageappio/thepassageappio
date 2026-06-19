import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { trackEvent } from '../lib/trackEvent';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#a97832',
  amberFaint: '#fbf5e8',
};

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
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <style>{`
        .participants-shell, .participants-shell * { box-sizing:border-box; }
        .participants-shell { max-width:1040px; margin:0 auto; padding:28px 24px 54px; }
        .participants-hero { display:grid; grid-template-columns:minmax(0,.9fr) minmax(300px,.72fr); gap:18px; align-items:stretch; }
        .participants-card { background:${C.card}; border:1px solid ${C.border}; border-radius:18px; padding:24px; box-shadow:0 12px 34px rgba(55,45,35,.055); }
        .participants-kicker { color:${C.sage}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; font-weight:900; }
        .participants-title { font-size:52px; line-height:.96; margin:10px 0 12px; font-weight:400; letter-spacing:0; }
        .participants-lede { color:${C.mid}; font-size:16px; line-height:1.58; margin:0; max-width:680px; }
        .participants-actions { display:flex; gap:9px; flex-wrap:wrap; margin-top:18px; }
        .participants-button { min-height:46px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; padding:0 17px; font-weight:900; text-decoration:none; font-family:inherit; font-size:13.5px; }
        .participants-primary { background:${C.ink}; color:white; border:1px solid ${C.ink}; }
        .participants-secondary { background:${C.card}; color:${C.sage}; border:1px solid #c8deca; }
        .participants-step { display:grid; grid-template-columns:34px minmax(0,1fr); gap:11px; padding:12px 0; border-bottom:1px solid ${C.border}; }
        .participants-step:last-child { border-bottom:none; }
        .participants-num { width:28px; height:28px; border-radius:999px; background:${C.sageFaint}; color:${C.sage}; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; }
        .participants-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:14px; }
        @media (max-width:760px) {
          .participants-shell { padding:18px 18px 42px; }
          .participants-hero, .participants-grid { grid-template-columns:1fr; }
          .participants-actions { flex-direction:column; }
          .participants-button { width:100%; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="participants-shell">
        <div className="participants-hero">
          <div className="participants-card">
            <div className="participants-kicker">For Invited Helpers</div>
            <h1 className="participants-title">Help with one clear request, without opening the whole estate.</h1>
            <p className="participants-lede">
              Passage is used when a family asks a relative, friend, clergy member, vendor, or trusted helper to handle one specific piece of work. You see the responsibility, the context needed to act, and the safest way to update the coordinator.
            </p>
            <div className="participants-actions">
              <Link href="/participating" onClick={() => trackEvent('participant_public_cta_clicked', { label: 'Open your assigned request', href: '/participating' })} className="participants-button participants-primary">Open your assigned request</Link>
              <Link href="/login?next=/participating" onClick={() => trackEvent('participant_public_cta_clicked', { label: 'Participant sign in', href: '/login?next=/participating' })} className="participants-button participants-secondary">Participant sign in</Link>
              <Link href="/trust" onClick={() => trackEvent('participant_public_cta_clicked', { label: 'Read the Access Model', href: '/trust' })} className="participants-button participants-secondary">Read the Access Model</Link>
            </div>
            <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 16 }}>
              Use the email that received the Passage invite. If you were added under a different address, ask the coordinator to resend the assignment.
            </div>
          </div>

          <div className="participants-card" style={{ background: C.sageFaint, borderColor: '#c8deca' }}>
            <div className="participants-kicker">What Happens</div>
            {steps.map(([num, title, body]) => (
              <div className="participants-step" key={title}>
                <div className="participants-num">{num}</div>
                <div>
                  <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.2, fontWeight: 900 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 13.4, lineHeight: 1.48, marginTop: 4 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="participants-grid">
          {trustRows.map(([title, body]) => (
            <div key={title} className="participants-card" style={{ padding: 18 }}>
              <div className="participants-kicker">{title}</div>
              <div style={{ color: C.mid, fontSize: 14, lineHeight: 1.55, marginTop: 7 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
