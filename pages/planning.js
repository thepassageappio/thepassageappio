import { useEffect, useState } from 'react';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { supabase } from '../lib/supabaseBrowser';

const C = {
  bg: '#f6f3ee',
  card: '#fffdf9',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#9a9288',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageDark: '#4a6e50',
  sageFaint: '#eef5ef',
  sageLight: '#c8deca',
  rose: '#c47a7a',
  roseFaint: '#fdf3f3',
};

const emptyForm = {
  personName: '',
  forWhom: 'Myself or someone I love',
  coordinatorEmail: '',
  executorName: '',
  executorEmail: '',
  secondConfirmerName: '',
  secondConfirmerEmail: '',
  healthcareProxyName: '',
  healthcareProxyEmail: '',
  disposition: '',
  serviceType: '',
  faithTradition: '',
  cemeteryName: '',
  documentLocation: '',
};

const input = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1.5px solid ${C.border}`,
  borderRadius: 13,
  padding: '12px 13px',
  fontFamily: 'Georgia,serif',
  fontSize: 14,
  color: C.ink,
  outline: 'none',
  background: '#fff',
};

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 10.5, color: C.sageDark, textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 900, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

export default function PlanningPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      const saved = window.localStorage.getItem('passage_planning_draft');
      if (saved) setForm(prev => ({ ...prev, ...JSON.parse(saved) }));
    } catch {}

    if (supabase?.auth) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!active) return;
        const currentUser = session?.user || null;
        setUser(currentUser);
        setAuthChecked(true);
        if (currentUser?.email) {
          setForm(prev => ({ ...prev, coordinatorEmail: prev.coordinatorEmail || currentUser.email }));
        }
      }).catch(() => {
        if (active) setAuthChecked(true);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setAuthChecked(true);
        if (currentUser?.email) {
          setForm(prev => ({ ...prev, coordinatorEmail: prev.coordinatorEmail || currentUser.email }));
        }
      });
      return () => {
        active = false;
        data?.subscription?.unsubscribe?.();
      };
    }
    setAuthChecked(true);
    return () => { active = false; };
  }, []);

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setMessage('');
    setMagicSent(false);
  }

  function validate() {
    if (!form.personName.trim()) return 'Add the name this plan protects.';
    if (!cleanEmail(form.coordinatorEmail)) return 'Add your email so Passage can save the planning record.';
    if (!cleanEmail(form.executorEmail)) return 'Add the primary trusted contact email.';
    if (!cleanEmail(form.secondConfirmerEmail)) return 'Add a second trusted contact email. Planning activation should never depend on one person.';
    if (cleanEmail(form.executorEmail) === cleanEmail(form.secondConfirmerEmail)) return 'Use two different trusted contacts.';
    return '';
  }

  async function emailSecureLink() {
    const error = validate();
    if (error) {
      setMessage(error);
      return;
    }
    if (!supabase?.auth) {
      setMessage('Sign-in is not configured in this environment.');
      return;
    }
    setSaving(true);
    try {
      window.localStorage.setItem('passage_planning_draft', JSON.stringify(form));
      const redirectTo = `${window.location.origin}/planning`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail(form.coordinatorEmail),
        options: { emailRedirectTo: redirectTo },
      });
      if (otpError) throw otpError;
      setMagicSent(true);
      setMessage('We sent a secure link. Open it on this device, then save the planning record.');
    } catch (err) {
      setMessage(err?.message || 'Passage could not send the secure link yet.');
    } finally {
      setSaving(false);
    }
  }

  async function savePlanningEstate() {
    const error = validate();
    if (error) {
      setMessage(error);
      return;
    }
    if (!user) {
      await emailSecureLink();
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Your session expired. Please sign in again so Passage can save this plan.');
      const response = await fetch('/api/planningEstate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Passage could not save this planning record yet.');
      try { window.localStorage.removeItem('passage_planning_draft'); } catch {}
      window.location.assign(`/estate?id=${encodeURIComponent(json.workflowId)}&from=planning`);
    } catch (err) {
      setMessage(err?.message || 'Passage could not save this planning record yet.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader user={user} authReady={authChecked} onSignOut={async () => { await supabase.auth.signOut(); setUser(null); }} />
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 28px 28px', display: 'grid', gridTemplateColumns: 'minmax(0,.72fr) minmax(380px,1fr)', gap: 18, alignItems: 'start' }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: '28px 30px', boxShadow: '0 18px 54px rgba(55,45,35,.055)' }}>
          <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>Planning path</div>
          <h1 style={{ fontSize: 52, lineHeight: .96, fontWeight: 400, margin: '0 0 12px' }}>Start a planning record before it is needed.</h1>
          <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.55, margin: '0 0 18px' }}>
            Passage saves wishes, trusted people, documents, and first-call context now, then requires trusted confirmation before a planning record becomes active later.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['Two trusted confirmations', 'A planning record cannot quietly become urgent from one person alone.'],
              ['Nothing sends automatically', 'Contacts are saved so the family knows who can confirm, review, and help.'],
              ['One calm family record', 'The planning record becomes the same task spine families use when support is actually needed.'],
            ].map(([title, body]) => (
              <div key={title} style={{ background: C.sageFaint, border: `1px solid ${C.sageLight}`, borderRadius: 15, padding: '13px 14px' }}>
                <div style={{ fontWeight: 900, fontSize: 15 }}>{title}</div>
                <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.45, marginTop: 3 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); savePlanningEstate(); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 22, boxShadow: '0 18px 54px rgba(55,45,35,.055)' }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>Planning Setup</div>
          <h2 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 400, lineHeight: 1.1 }}>Create the planning record.</h2>
          <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.5, margin: '0 0 16px' }}>Start with the person, the coordinator, and two trusted contacts. You can fill in the rest inside the estate.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Person this plan protects">
              <input value={form.personName} onChange={e => set('personName', e.target.value)} style={input} placeholder="Full name" />
            </Field>
            <Field label="Your email">
              <input type="email" value={form.coordinatorEmail} onChange={e => set('coordinatorEmail', e.target.value)} style={input} placeholder="you@example.com" />
            </Field>
            <Field label="Primary trusted contact">
              <input value={form.executorName} onChange={e => set('executorName', e.target.value)} style={input} placeholder="Name" />
            </Field>
            <Field label="Primary contact email">
              <input type="email" value={form.executorEmail} onChange={e => set('executorEmail', e.target.value)} style={input} placeholder="trusted@example.com" />
            </Field>
            <Field label="Second trusted contact">
              <input value={form.secondConfirmerName} onChange={e => set('secondConfirmerName', e.target.value)} style={input} placeholder="Name" />
            </Field>
            <Field label="Second contact email">
              <input type="email" value={form.secondConfirmerEmail} onChange={e => set('secondConfirmerEmail', e.target.value)} style={input} placeholder="backup@example.com" />
            </Field>
            <Field label="Healthcare proxy">
              <input value={form.healthcareProxyName} onChange={e => set('healthcareProxyName', e.target.value)} style={input} placeholder="Optional" />
            </Field>
            <Field label="Proxy email">
              <input type="email" value={form.healthcareProxyEmail} onChange={e => set('healthcareProxyEmail', e.target.value)} style={input} placeholder="Optional" />
            </Field>
            <Field label="Burial or cremation preference">
              <input value={form.disposition} onChange={e => set('disposition', e.target.value)} style={input} placeholder="Optional" />
            </Field>
            <Field label="Service preference">
              <input value={form.serviceType} onChange={e => set('serviceType', e.target.value)} style={input} placeholder="Optional" />
            </Field>
            <Field label="Faith or cultural notes">
              <input value={form.faithTradition} onChange={e => set('faithTradition', e.target.value)} style={input} placeholder="Optional" />
            </Field>
            <Field label="Documents location">
              <input value={form.documentLocation} onChange={e => set('documentLocation', e.target.value)} style={input} placeholder="Optional" />
            </Field>
          </div>

          {message && (
            <div style={{ marginTop: 14, background: magicSent ? C.sageFaint : C.roseFaint, border: `1px solid ${magicSent ? C.sageLight : '#e8caca'}`, color: magicSent ? C.sageDark : C.rose, borderRadius: 14, padding: '11px 12px', fontSize: 13.5, lineHeight: 1.45, fontWeight: 800 }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={saving} style={{ marginTop: 15, width: '100%', minHeight: 52, border: 'none', borderRadius: 14, background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 15, cursor: saving ? 'default' : 'pointer', opacity: saving ? .72 : 1 }}>
            {saving ? 'Working...' : user ? 'Create planning record' : 'Email me a secure link'}
          </button>
          <div style={{ color: C.soft, fontSize: 12.5, lineHeight: 1.45, marginTop: 10 }}>
            If you are already signed in, Passage saves the record now. If not, we send a secure link first so the record belongs to you.
          </div>
        </form>
      </section>
      <style jsx>{`
        @media (max-width: 860px) {
          section { grid-template-columns: 1fr !important; padding: 10px 18px 24px !important; }
          form > div:nth-of-type(3) { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteFooter />
    </main>
  );
}
