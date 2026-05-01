import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader, SiteFooter } from '../../components/SiteChrome';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#b07d2e', amberFaint: '#fdf8ee' };

function statusLabel(value) {
  if (value === 'handled' || value === 'completed') return 'Handled';
  if (value === 'acknowledged') return 'Confirmed';
  if (value === 'blocked' || value === 'needs_review' || value === 'failed') return 'Needs help';
  if (value === 'sent' || value === 'waiting' || value === 'assigned') return 'Waiting for confirmation';
  return 'Draft';
}

export default function FuneralHomeDashboard() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setToken(session?.access_token || '');
      if (session?.access_token) load(session.access_token);
      else setLoading(false);
    });
  }, []);

  async function load(token) {
    setLoading(true);
    const res = await fetch('/api/partnerContext', { headers: { Authorization: 'Bearer ' + token } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not load partner dashboard.');
    else setData(json);
    setLoading(false);
  }

  async function signIn() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/funeral-home/dashboard' } });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setToken('');
    setData(null);
  }

  async function updateTask(task, status, detail) {
    if (!token || !task?.id) return;
    setUpdating(task.id + status);
    setError('');
    const res = await fetch(`/api/tasks/${task.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        status,
        channel: 'record',
        recipient: task.playbook?.partnerOwnerRole || 'funeral home',
        detail,
        actor: user?.email || 'Funeral home staff',
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not update this task.');
    else await load(token);
    setUpdating('');
  }

  const org = data?.organizations?.[0]?.organizations;
  const cases = data?.cases || [];
  const totalPartnerTasks = cases.reduce((sum, item) => sum + (item.partnerTasks?.length || 0), 0);
  const totalBlocked = cases.reduce((sum, item) => sum + (item.blockedTasks?.length || 0), 0);
  const totalWaiting = cases.reduce((sum, item) => sum + (item.tasks || []).filter(t => ['sent', 'waiting', 'assigned'].includes(t.status || '')).length, 0);

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 22px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Partner command center</div>
            <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', lineHeight: 1.05, margin: 0, fontWeight: 400 }}>{org?.name || 'Funeral home dashboard'}</h1>
            <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.55, maxWidth: 720 }}>Pilot view for family cases, task status, death-certificate handoffs, and the work your team can complete on behalf of families.</p>
          </div>
          {org?.logo_url && <img src={org.logo_url} alt="" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, padding: 8 }} />}
        </div>

        {!user && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, maxWidth: 520 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Sign in as partner staff.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Only staff connected to a Passage partner organization can view this dashboard.</p>
            <button onClick={signIn} style={{ border: 'none', borderRadius: 13, padding: '13px 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
          </div>
        )}

        {user && loading && <div style={{ color: C.soft }}>Loading partner cases...</div>}
        {user && error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16, color: C.rose }}>{error}</div>}

        {user && !loading && data && data.organizations.length === 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>No partner organization connected yet.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Add this staff email to an organization before using the funeral home dashboard.</p>
          </div>
        )}

        {user && cases.length > 0 && (
          <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
            {[
              ['Partner-ready tasks', totalPartnerTasks],
              ['Waiting confirmations', totalWaiting],
              ['Need help', totalBlocked],
            ].map(([label, value]) => (
              <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13 }}>
                <div style={{ color: C.soft, fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 24, marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {cases.map(item => {
              const open = item.tasks.filter(t => !['handled', 'completed'].includes(t.status || '')).length;
              const blocked = item.tasks.filter(t => ['blocked', 'needs_review', 'failed'].includes(t.status || '')).length;
              const partnerTasks = item.partnerTasks || [];
              const waitingFamily = item.waitingOnFamily || [];
              const topTasks = partnerTasks.length ? partnerTasks.slice(0, 5) : item.tasks.slice(0, 4);
              return (
                <div key={item.id} style={{ background: C.card, border: `1px solid ${blocked ? C.rose + '55' : C.border}`, borderRadius: 18, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 22, lineHeight: 1.25 }}>{item.deceased_name || item.name || 'Family case'}</div>
                      <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>Coordinator: {item.coordinator_name || 'Family coordinator'}{item.coordinator_email ? ` (${item.coordinator_email})` : ''}</div>
                    </div>
                    <Link href={`/estate?id=${item.id}`} style={{ color: '#fff', background: C.sage, borderRadius: 11, padding: '9px 12px', textDecoration: 'none', fontSize: 13, fontWeight: 800 }}>Open case</Link>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{item.tasks.length} tasks</span>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{partnerTasks.length} partner-ready</span>
                    <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{open} open</span>
                    {waitingFamily.length > 0 && <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{waitingFamily.length} waiting on family</span>}
                    {blocked > 0 && <span style={{ background: C.roseFaint, color: C.rose, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{blocked} need help</span>}
                  </div>
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12, marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: C.sage, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Next partner work</div>
                    <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.55 }}>Prioritized for work a funeral home can actually move: certificates, service coordination, cemetery/crematory, obituary, and family approvals.</div>
                  </div>
                  {topTasks.map(task => (
                    <div key={task.id} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11, marginTop: 11 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'start' }}>
                        <div>
                          <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 800 }}>{task.title}</div>
                          <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}>{task.playbook?.automationLabel || 'Passage can prepare this'}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '3px 8px', fontSize: 10.5, fontWeight: 800 }}>{task.playbook?.automationShortLabel || 'Task'}</span>
                            <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '3px 8px', fontSize: 10.5, fontWeight: 800 }}>Waiting on {task.playbook?.waitingOn || 'recipient'}</span>
                            {task.playbook?.proofRequired && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '3px 8px', fontSize: 10.5 }}>Proof: {task.playbook.proofRequired}</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: C.mid, whiteSpace: 'nowrap' }}>{statusLabel(task.status)}</div>
                      </div>
                      {task.playbook?.funeralHomeEligible && !['handled', 'completed'].includes(task.status || '') && (
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
                          <button disabled={updating === task.id + 'waiting'} onClick={() => updateTask(task, 'waiting', `${org?.name || 'Funeral home'} is working on ${task.title}. Waiting for confirmation.`)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Mark in progress</button>
                          <button disabled={updating === task.id + 'blocked'} onClick={() => updateTask(task, 'blocked', `${org?.name || 'Funeral home'} needs family information for ${task.title}.`)} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Need family info</button>
                          <button disabled={updating === task.id + 'handled'} onClick={() => updateTask(task, 'handled', `${org?.name || 'Funeral home'} marked ${task.title} as handled.`)} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Mark handled</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
