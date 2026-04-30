import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

async function signIn() {
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: SITE_URL + '/participating' } });
}

function statusLabel(value) {
  if (value === 'needs_review') return 'Needs review';
  if (value === 'sent' || value === 'assigned') return 'Assigned';
  if (value === 'handled' || value === 'completed') return 'Handled';
  return 'Waiting';
}

export default function ParticipatingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [emailLogin, setEmailLogin] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [notesByItem, setNotesByItem] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.access_token) load(session.access_token);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.access_token) load(session.access_token);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load(token) {
    setLoading(true);
    setError('');
    const r = await fetch('/api/participantContext', { headers: { Authorization: 'Bearer ' + token } });
    const json = await r.json();
    if (!r.ok) setError(json.error || 'Could not load participating estates.');
    else setData(json);
    setLoading(false);
  }

  async function participantAction(kind, id, action) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    await fetch('/api/participantAction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ kind, id, action, notes: notesByItem[kind + ':' + id] || '' }),
    });
    await load(token);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setData(null);
  }

  async function sendMagicLink() {
    if (!emailLogin) return;
    const { error } = await supabase.auth.signInWithOtp({ email: emailLogin, options: { emailRedirectTo: SITE_URL + '/participating' } });
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <nav style={{ maxWidth: 1040, margin: '0 auto', padding: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: C.ink, textDecoration: 'none', fontSize: 24, fontWeight: 700 }}>Passage</Link>
        <div style={{ display: 'flex', gap: 14, fontSize: 13, alignItems: 'center' }}>
          <Link href="/mission" style={{ color: C.mid, textDecoration: 'none' }}>Mission</Link>
          <Link href="/pricing" style={{ color: C.mid, textDecoration: 'none' }}>Pricing</Link>
          <Link href="/contact" style={{ color: C.mid, textDecoration: 'none' }}>Contact</Link>
          {user && <button onClick={signOut} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 9, padding: '7px 12px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Sign out</button>}
        </div>
      </nav>

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 22px 84px' }}>
        <div style={{ maxWidth: 760, marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: C.sage, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 14 }}>Participating in an estate</div>
          <h1 style={{ fontSize: 44, lineHeight: 1.08, margin: '0 0 14px', fontWeight: 400 }}>See the estates where someone has asked you to help.</h1>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.75, margin: 0 }}>Family members, pastors, attorneys, funeral directors, florists, and other helpers should have a calm place to see their role, tasks, and service information without hunting through texts and emails.</p>
        </div>

        {!user && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, maxWidth: 520 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Sign in with the email that received the Passage invite.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Passage will look for estate roles and tasks connected to your email address.</p>
            <button onClick={signIn} style={{ border: 'none', borderRadius: 13, padding: '14px 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
            <div style={{ height: 12 }} />
            <input value={emailLogin} onChange={e => setEmailLogin(e.target.value)} type="email" placeholder="Or enter your email" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'Georgia,serif', marginBottom: 8 }} />
            <button onClick={sendMagicLink} style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 18px', background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Email me a sign-in link</button>
            {magicSent && <p style={{ color: C.sage, fontSize: 13, lineHeight: 1.6 }}>Check your email for a secure sign-in link.</p>}
          </div>
        )}

        {user && loading && <div style={{ color: C.soft }}>Loading participating estates...</div>}
        {user && error && <div style={{ color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16 }}>{error}</div>}

        {user && !loading && data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 18 }}>
            <div>
              {data.estates.length === 0 ? (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>No estate roles found for {data.email} yet.</div>
                  <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>If someone invited you with a different email, sign in with that address. When you are assigned a task, it will appear here.</p>
                </div>
              ) : data.estates.map(estate => (
                <div key={estate.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: 22, lineHeight: 1.2 }}>{estate.deceased_name || estate.name || 'Estate plan'}</div>
                      <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>Role: {estate.role} | Coordinator: {estate.coordinator_name || 'Family coordinator'}</div>
                    </div>
                    <span style={{ background: estate.status === 'triggered' || estate.activation_status === 'activated' ? C.roseFaint : C.sageFaint, color: estate.status === 'triggered' ? C.rose : C.sage, borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>{estate.status || 'active'}</span>
                  </div>

                  {estate.events.length > 0 && (
                    <div style={{ marginTop: 16, background: C.sageFaint, borderRadius: 13, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.sage, marginBottom: 8 }}>Service information</div>
                      {estate.events.map(ev => (
                        <div key={ev.id} style={{ fontSize: 13, color: C.mid, lineHeight: 1.65, borderTop: `1px solid ${C.border}`, padding: '7px 0' }}>
                          <strong style={{ color: C.ink }}>{ev.name || ev.event_type}</strong>{ev.date ? ` - ${ev.date}` : ''}{ev.time ? ` at ${ev.time}` : ''}<br />
                          {ev.location_name || ''}{ev.location_address ? `, ${ev.location_address}` : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.soft, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Your tasks and notices</div>
                    {[...estate.tasks.map(t => ({ ...t, _kind: 'task' })), ...estate.actions.map(a => ({ ...a, _kind: 'action' }))].slice(0, 8).map(item => (
                      <div key={(item.id || item.title) + item.status} style={{ borderTop: `1px solid ${C.border}`, padding: '10px 0', color: C.mid, fontSize: 13, lineHeight: 1.55 }}>
                        <strong style={{ color: C.ink }}>{item.title || item.subject || item.action_type || 'Estate coordination'}</strong><br />
                        {item.description && <span>{item.description}<br /></span>}
                        Status: {statusLabel(item.status || item.delivery_status)}
                        <textarea value={notesByItem[item._kind + ':' + item.id] || item.notes || ''} onChange={e => setNotesByItem(prev => ({ ...prev, [item._kind + ':' + item.id]: e.target.value }))} placeholder="Add notes for the coordinator" style={{ width: '100%', boxSizing: 'border-box', minHeight: 72, marginTop: 8, padding: '9px 10px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontSize: 13, lineHeight: 1.45 }} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => participantAction(item._kind, item.id, 'accept')} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 9, padding: '6px 10px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Accept</button>
                          <button onClick={() => participantAction(item._kind, item.id, 'handled')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '6px 10px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Mark handled</button>
                          <button onClick={() => participantAction(item._kind, item.id, 'help')} style={{ color: C.mid, background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: '6px 10px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Ask for help</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <aside style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, alignSelf: 'start' }}>
              <div style={{ fontSize: 20, lineHeight: 1.25, marginBottom: 8 }}>Planning for your own family?</div>
              <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.7 }}>Participants are often the people who understand the value first. When participant pricing is enabled, Passage can offer a quieter discounted path to set up their own family plan.</p>
              {data.discountEligible && <div style={{ background: C.sageFaint, color: C.sage, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Participant discount eligible</div>}
              <Link href="/pricing?participant=1" style={{ display: 'block', textAlign: 'center', background: C.sage, color: '#fff', borderRadius: 12, padding: '12px 14px', textDecoration: 'none', fontWeight: 800 }}>See participant pricing</Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
