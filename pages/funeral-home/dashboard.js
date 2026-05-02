import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader, SiteFooter } from '../../components/SiteChrome';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { bg: '#f6f3ee', bgDark: '#1a1916', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#b07d2e', amberFaint: '#fdf8ee' };

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
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [showNewCase, setShowNewCase] = useState(false);
  const [creating, setCreating] = useState(false);
  const [caseForm, setCaseForm] = useState({
    funeralHomeName: '',
    caseType: 'immediate',
    personName: '',
    dateOfDeath: '',
    coordinatorName: '',
    coordinatorEmail: '',
    coordinatorPhone: '',
    caseReference: '',
  });
  const [demoForm, setDemoForm] = useState({
    localName: 'Beacon Family Funeral Home',
    multiName: 'Hudson Valley Funeral Group',
    logoUrl: '',
    primaryColor: '#6b8f71',
  });

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
    else {
      setNotice(status === 'blocked'
        ? 'Family information requested. This stays visible until it is resolved.'
        : 'Started on behalf of the family. Passage is tracking this so your staff does not have to chase it manually.');
      await load(token);
    }
    setUpdating('');
  }

  async function handleForFamily(task, caseItem) {
    if (!token || !task?.id) return;
    setUpdating(task.id + 'handle_for_family');
    setError('');
    const res = await fetch('/api/partnerHandleTask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        taskId: task.id,
        note: `${org?.name || 'Funeral home'} handled ${task.title} for ${caseItem?.coordinator_name || 'the family'}.`,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not handle this for the family.');
    else {
      setNotice('Handled for the family. The family can see who handled it, when it happened, and what was sent.');
      await load(token);
    }
    setUpdating('');
  }

  async function downloadExport() {
    if (!token) return;
    setError('');
    const res = await fetch('/api/partnerExport', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Could not export partner cases.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passage-partner-cases.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function emailExport() {
    if (!token) return;
    setUpdating('email_export');
    setError('');
    setNotice('');
    const res = await fetch('/api/partnerExport', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not email the CSV export.');
    else setNotice(`CSV export sent to ${json.emailedTo || user?.email || 'your email'}.`);
    setUpdating('');
  }

  async function createCase(e) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError('');
    const res = await fetch('/api/partnerCase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(caseForm),
    });
    const json = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(json.error || 'Could not create this family case.');
      return;
    }
    setShowNewCase(false);
    setCaseForm({ funeralHomeName: '', caseType: 'immediate', personName: '', dateOfDeath: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '', caseReference: '' });
    await load(token);
  }

  async function createDemoCase(kind = 'local') {
    if (!token) return;
    setCreating(true);
    setError('');
    const localCases = [{
      funeralHomeName: demoForm.localName,
      caseType: 'immediate',
      personName: 'Marian Ellis',
      dateOfDeath: '2026-04-29',
      coordinatorName: 'Claire Ellis',
      coordinatorEmail: user?.email || '',
      coordinatorPhone: '+1 845 555 0142',
      caseReference: 'DEMO-LOCAL-001',
      demoType: 'local',
    }];
    const multiCases = [
      {
        funeralHomeName: demoForm.multiName,
        caseType: 'immediate',
        personName: 'Robert Alvarez',
        dateOfDeath: '2026-04-30',
        coordinatorName: 'Dana Alvarez',
        coordinatorEmail: user?.email || '',
        coordinatorPhone: '+1 845 555 0184',
        caseReference: 'DEMO-MULTI-001',
        demoType: 'multi',
      },
      {
        funeralHomeName: demoForm.multiName,
        caseType: 'prepaid',
        personName: 'Eleanor Price',
        coordinatorName: 'Michael Price',
        coordinatorEmail: user?.email || '',
        coordinatorPhone: '+1 845 555 0192',
        caseReference: 'DEMO-MULTI-002',
        demoType: 'multi',
      },
    ];
    const payloads = kind === 'multi' ? multiCases : localCases;
    for (const payload of payloads) {
      const res = await fetch('/api/partnerCase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          ...payload,
          demo: true,
          demoLogoUrl: demoForm.logoUrl,
          demoPrimaryColor: demoForm.primaryColor,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreating(false);
        setError(json.error || 'Could not create demo case.');
        return;
      }
    }
    setShowNewCase(false);
    setNotice(kind === 'multi' ? 'Multi-location demo is ready with at-need and prepaid cases.' : 'Local one-location demo is ready.');
    await load(token);
    setCreating(false);
  }

  async function startPartnerCheckout(planId = 'partner_pilot') {
    if (!user || !token) return signIn();
    setError('');
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ planId, userId: user.id, userEmail: user.email }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || 'Could not start partner checkout.');
      return;
    }
    window.location.href = json.url;
  }

  const org = data?.organizations?.[0]?.organizations;
  const cases = data?.cases || [];
  const isAdminDemo = !!data?.isPassageAdmin;
  const totalBlocked = cases.reduce((sum, item) => sum + (item.blockedTasks?.length || 0), 0);
  const totalWaiting = cases.reduce((sum, item) => sum + (item.tasks || []).filter(t => ['sent', 'waiting', 'assigned'].includes(t.status || '')).length, 0);
  const totalHandled = cases.reduce((sum, item) => sum + (item.tasks || []).filter(t => ['handled', 'completed'].includes(t.status || '')).length, 0);
  const totalCommunications = cases.reduce((sum, item) => sum + (item.communications?.length || 0), 0);
  const assignmentsCoordinated = cases.reduce((sum, item) => sum + (item.tasks || []).filter(t => t.assigned_to || t.owner_name || t.participant_id).length, 0);
  const callsAvoided = totalCommunications + assignmentsCoordinated;
  const glanceItems = [
    ['Active cases', cases.length],
    ['Tasks handled by Passage', totalHandled],
    ['Waiting for response', totalWaiting],
    ['Estimated calls avoided', callsAvoided],
  ];

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 22px 44px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Partner command center</div>
            <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', lineHeight: 1.05, margin: 0, fontWeight: 400 }}>{org?.name || 'Funeral home dashboard'}</h1>
            <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.55, maxWidth: 720 }}>Pilot view for family cases, task status, death-certificate handoffs, and work your team can complete on behalf of families.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {user && <button onClick={() => setShowNewCase(v => !v)} style={{ border: 'none', borderRadius: 12, padding: '10px 13px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>New family case</button>}
            {user && <button onClick={() => document.getElementById('partner-csv-upload')?.click()} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Import CSV</button>}
            {user && <a href="/api/partnerImportTemplate" style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer', textDecoration: 'none' }}>Template</a>}
            {user && cases.length > 0 && <button onClick={downloadExport} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Export my data</button>}
            {user && cases.length > 0 && <button onClick={emailExport} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>{updating === 'email_export' ? 'Sending...' : 'Email data'}</button>}
            {user && <button onClick={() => startPartnerCheckout('partner_pilot')} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', background: C.card, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Start pilot billing</button>}
            {org?.logo_url && <img src={org.logo_url} alt="" style={{ width: 54, height: 54, objectFit: 'contain', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, padding: 8 }} />}
          </div>
        </div>

        {user && (
          <input
            id="partner-csv-upload"
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file || !token) return;
              setError('');
              setNotice('');
              const csv = await file.text();
              const res = await fetch('/api/partnerImport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ csv, funeralHomeName: org?.name || '' }),
              });
              const json = await res.json().catch(() => ({}));
              event.target.value = '';
              if (!res.ok) setError(json.error || 'Could not import this CSV.');
              else {
                setNotice(`Imported ${json.imported} case${json.imported === 1 ? '' : 's'} into Passage.`);
                await load(token);
              }
            }}
          />
        )}

        {!user && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, maxWidth: 520 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Sign in as partner staff.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Only staff connected to a Passage partner organization can view this dashboard.</p>
            <button onClick={signIn} style={{ border: 'none', borderRadius: 13, padding: '13px 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
          </div>
        )}

        {user && loading && <div style={{ color: C.soft }}>Loading partner cases...</div>}
        {user && error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16, color: C.rose }}>{error}</div>}
        {user && notice && <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}30`, borderRadius: 14, padding: 16, color: C.sage, marginBottom: 10 }}>{notice}</div>}

        {user && !loading && isAdminDemo && (
          <div style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 18, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 10 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Admin sales demo mode</div>
                <div style={{ fontSize: 20, marginTop: 3 }}>Build the demo you are walking into.</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 4 }}>Visible only to Passage admins. Real partner users never see demo launch controls.</div>
              </div>
              {demoForm.logoUrl && <img src={demoForm.logoUrl} alt="" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 14, border: `1px solid ${C.border}`, background: C.bg, padding: 8 }} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                Local demo name
                <input value={demoForm.localName} onChange={e => setDemoForm(prev => ({ ...prev, localName: e.target.value }))} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                Multi-location demo name
                <input value={demoForm.multiName} onChange={e => setDemoForm(prev => ({ ...prev, multiName: e.target.value }))} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                Logo URL
                <input value={demoForm.logoUrl} onChange={e => setDemoForm(prev => ({ ...prev, logoUrl: e.target.value }))} placeholder="https://..." style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                Brand color
                <input value={demoForm.primaryColor} onChange={e => setDemoForm(prev => ({ ...prev, primaryColor: e.target.value }))} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              <button onClick={() => createDemoCase('local')} disabled={creating} style={{ border: 'none', borderRadius: 12, padding: '10px 13px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: creating ? 'default' : 'pointer' }}>{creating ? 'Creating...' : 'Create local one-location demo'}</button>
              <button onClick={() => createDemoCase('multi')} disabled={creating} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', background: C.card, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: creating ? 'default' : 'pointer' }}>{creating ? 'Creating...' : 'Create multi-location demo'}</button>
            </div>
          </div>
        )}

        {user && !loading && data && (
          <div style={{ background: C.card, color: C.ink, border: `1px solid ${C.border}`, borderRadius: 18, padding: '14px 16px', marginBottom: 12, boxShadow: '0 18px 42px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Today at a glance</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>Based on messages sent, assignments made, and tasks handled in Passage.</div>
              </div>
              <div style={{ color: C.sage, fontSize: 12, fontWeight: 800 }}>Work your team does not have to chase manually.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {glanceItems.map(([label, value]) => (
                <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: '10px 12px' }} title={label === 'Estimated calls avoided' ? 'Based on messages sent and assignments coordinated through Passage.' : ''}>
                  <div style={{ color: C.sage, fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 22, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && showNewCase && (
          <form onSubmit={createCase} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Create a family case</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>Start with only the details you know. Passage creates the partner-ready task set.</div>
              </div>
              <button type="button" onClick={() => setShowNewCase(false)} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 9, padding: '6px 9px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
              {[
                ['immediate', 'At-need case', 'A death has occurred and the family needs coordination now.'],
                ['preneed', 'Pre-need planning', 'A living client or family is preparing before it is urgent.'],
                ['prepaid', 'Prepaid plan', 'Track funding, policy, and family contacts for a paid arrangement.'],
              ].map(([value, title, body]) => (
                <button key={value} type="button" onClick={() => setCaseForm(prev => ({ ...prev, caseType: value }))} style={{ textAlign: 'left', border: `1px solid ${caseForm.caseType === value ? C.sage : C.border}`, background: caseForm.caseType === value ? C.sageFaint : C.bg, borderRadius: 12, padding: 11, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.ink }}>{title}</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.35, color: C.mid, marginTop: 3 }}>{body}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              {[
                ['personName', caseForm.caseType === 'immediate' ? 'Person who died *' : 'Person / family name *'],
                ['dateOfDeath', caseForm.caseType === 'immediate' ? 'Date of death' : 'Planning date'],
                ['caseReference', 'Case reference'],
                ['coordinatorName', 'Family contact'],
                ['coordinatorEmail', 'Family email'],
                ['coordinatorPhone', 'Family phone'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                  {label}
                  <input type={key === 'dateOfDeath' ? 'date' : 'text'} value={caseForm[key]} onChange={e => setCaseForm(prev => ({ ...prev, [key]: e.target.value }))} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
                </label>
              ))}
              {!org?.id && (
                <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                  Funeral home name
                  <input value={caseForm.funeralHomeName} onChange={e => setCaseForm(prev => ({ ...prev, funeralHomeName: e.target.value }))} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
                </label>
              )}
            </div>
            <button disabled={creating || !caseForm.personName.trim()} style={{ marginTop: 10, width: '100%', border: 'none', borderRadius: 12, background: creating || !caseForm.personName.trim() ? C.border : C.sage, color: '#fff', padding: '11px 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: creating ? 'default' : 'pointer' }}>
              {creating ? 'Creating case...' : 'Create case and task set'}
            </button>
          </form>
        )}

        {user && !loading && data && data.organizations.length === 0 && !showNewCase && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Create your partner workspace.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Start a pilot workspace from the first family case. Passage will connect this staff login to the funeral home automatically.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setShowNewCase(true)} style={{ border: 'none', borderRadius: 12, padding: '11px 14px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Create first case</button>
            </div>
          </div>
        )}

        {user && !loading && data && data.organizations.length > 0 && cases.length === 0 && !showNewCase && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Create your first case.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, margin: '12px 0' }}>
              {[
                ['1', 'Create case', 'At-need, pre-need, or prepaid.'],
                ['2', 'Add family', 'Name the coordinator and best contact.'],
                ['3', 'Send first communication', 'Use Passage to show progress and reduce repeated calls.'],
              ].map(([n, title, body]) => (
                <div key={n} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 11, fontWeight: 900 }}>{n}</div>
                  <div style={{ fontSize: 15, marginTop: 2 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>{body}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setShowNewCase(true)} style={{ border: 'none', borderRadius: 12, padding: '11px 14px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Create case</button>
            </div>
          </div>
        )}

        {user && cases.length > 0 && (
          <>
          <div style={{ display: 'grid', gap: 12 }}>
            {cases.map(item => {
              const handledCount = item.tasks.filter(t => ['handled', 'completed'].includes(t.status || '')).length;
              const waitingCount = item.tasks.filter(t => ['sent', 'waiting', 'assigned'].includes(t.status || '')).length;
              const progressCount = item.tasks.filter(t => ['draft', 'acknowledged'].includes(t.status || '')).length;
              const open = item.tasks.length - handledCount;
              const blocked = item.tasks.filter(t => ['blocked', 'needs_review', 'failed'].includes(t.status || '')).length;
              const partnerTasks = item.partnerTasks || [];
              const waitingFamily = item.waitingOnFamily || [];
              const topTasks = partnerTasks.length ? partnerTasks.slice(0, 5) : item.tasks.slice(0, 4);
              const isDemoCase = /^DEMO/i.test(item.organization_case_reference || '') || /^Demo - /i.test(item.name || '');
              return (
                <div key={item.id} style={{ background: C.card, border: `1px solid ${blocked ? C.rose + '55' : C.border}`, borderRadius: 18, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 22, lineHeight: 1.25 }}>{item.deceased_name || item.estate_name || item.name || 'Family case'}</div>
                      <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>{item.mode === 'funeral_home_preneed' ? 'Pre-need / prepaid case' : 'At-need case'} - Coordinator: {item.coordinator_name || 'Family coordinator'}{item.coordinator_email ? ` (${item.coordinator_email})` : ''}</div>
                    </div>
                    <Link href={`/estate?id=${item.id}`} style={{ color: '#fff', background: C.sage, borderRadius: 11, padding: '9px 12px', textDecoration: 'none', fontSize: 13, fontWeight: 800 }}>Open case</Link>
                    <Link href={`/funeral-home/summary?id=${item.id}`} style={{ color: C.sage, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 11, padding: '9px 12px', textDecoration: 'none', fontSize: 13, fontWeight: 800 }}>Print family summary</Link>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{item.tasks.length} tasks</span>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{partnerTasks.length} partner-ready</span>
                    <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{open} open</span>
                    {isAdminDemo && isDemoCase && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Demo data</span>}
                    {waitingFamily.length > 0 && <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{waitingFamily.length} waiting on family</span>}
                    {blocked > 0 && <span style={{ background: C.roseFaint, color: C.rose, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{blocked} need help</span>}
                  </div>
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12, marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: C.sage, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Next partner work</div>
                    <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.55 }}>Prioritized for work a funeral home can actually move: certificates, service coordination, cemetery/crematory, obituary, and family approvals.</div>
                  </div>
                  {item.activity?.length > 0 && (
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Recent proof</div>
                      {item.activity.slice(0, 3).map(event => (
                        <div key={event.id} style={{ fontSize: 12.3, color: C.mid, lineHeight: 1.45, padding: '4px 0', borderTop: `1px solid ${C.border}` }}>
                          <strong style={{ color: C.ink }}>{statusLabel(event.status)}</strong>{event.recipient ? ` - ${event.recipient}` : ''}{event.last_actor ? ` by ${event.last_actor}` : ''}{event.last_action_at ? ` at ${new Date(event.last_action_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                          {event.detail && <div style={{ color: C.soft }}>{event.detail}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: C.sage, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7 }}>Family status view</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                      {[
                        ['Done', handledCount],
                        ['In progress', progressCount],
                        ['Waiting', waitingCount + blocked],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 10px' }}>
                          <div style={{ color: C.soft, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                          <div style={{ fontSize: 18, marginTop: 2 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 8 }}>Share this status instead of answering another "where are we?" call.</div>
                  </div>
                  {item.communications?.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Communication log</div>
                      {item.communications.slice(0, 4).map(message => (
                        <div key={message.id} style={{ fontSize: 12.3, color: C.mid, lineHeight: 1.45, padding: '5px 0', borderTop: `1px solid ${C.border}` }}>
                          <strong style={{ color: C.ink }}>{message.subject || 'Family update'}</strong>
                          <div>{message.channel || 'message'} to {message.recipient_name || message.recipient_email || message.recipient_phone || 'recipient'} - {statusLabel(message.status)}{message.sent_at ? ` - ${new Date(message.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</div>
                          {message.error_message && <div style={{ color: C.rose }}>{message.error_message}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {topTasks.map(task => (
                    <div key={task.id} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11, marginTop: 11 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'start' }}>
                        <div>
                          <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 800 }}>{task.title}</div>
                          <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}><strong style={{ color: C.ink }}>Passage handles:</strong> {task.playbook?.automationLabel || 'status, notes, proof, and family visibility'}</div>
                          <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.45, marginTop: 2 }}><strong style={{ color: C.ink }}>Staff must do:</strong> {task.playbook?.waitingOn ? `confirm details with ${task.playbook.waitingOn}` : 'decide whether to handle, request family info, or mark done'}</div>
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
                          <button disabled={updating === task.id + 'waiting'} onClick={() => updateTask(task, 'waiting', `${org?.name || 'Funeral home'} is working on ${task.title}. Waiting for confirmation.`)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Start on behalf of family</button>
                          <button disabled={updating === task.id + 'blocked'} onClick={() => updateTask(task, 'blocked', `${org?.name || 'Funeral home'} needs family information for ${task.title}.`)} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Need family info</button>
                          <button disabled={updating === task.id + 'handle_for_family'} onClick={() => handleForFamily(task, item)} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{updating === task.id + 'handle_for_family' ? 'Handling...' : 'Handle this for family'}</button>
                        </div>
                      )}
                      {['handled', 'completed'].includes(task.status || '') && (
                        <div style={{ marginTop: 8, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 10, padding: '8px 10px', color: C.sage, fontSize: 12.5, fontWeight: 900 }}>Handled for the family</div>
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
