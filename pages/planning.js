import { useEffect, useState } from 'react';
import { SiteFooter, SiteHeader } from '../components/SiteChrome';
import { supabase } from '../lib/supabaseBrowser';

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

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function Field({ label, children }) {
  return (
    <label className="th-field">
      <div className="th-field-label">{label}</div>
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
        .wrap { max-width: 1120px; margin: 0 auto; padding: 20px 28px 32px; display: grid; grid-template-columns: minmax(0,.72fr) minmax(380px,1fr); gap: 18px; align-items: start; }
        .panel { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 28px 30px; box-shadow: var(--e2); }
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; display: block; }
        h1 { font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(34px,4.6vw,50px); line-height: .96; margin: 0 0 12px; letter-spacing: -.02em; color: var(--pine-950); }
        p.lede { color: var(--ink-500); font-size: 16px; line-height: 1.55; margin: 0 0 18px; }
        .bullet-stack { display: grid; gap: 10px; }
        .bullet { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-md); padding: 13px 14px; }
        .bullet-title { font-weight: 600; font-size: 15px; color: var(--ink-900); }
        .bullet-body { color: var(--ink-500); font-size: 13.5px; line-height: 1.45; margin-top: 3px; }
        form.th-form { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 22px; box-shadow: var(--e2); }
        .form-eyebrow { color: var(--clay-600); font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; display: block; }
        h2 { font-family: 'Fraunces', serif; font-weight: 460; font-size: 26px; margin: 0 0 6px; line-height: 1.1; letter-spacing: -.015em; color: var(--pine-950); }
        p.form-sub { color: var(--ink-500); font-size: 13.5px; line-height: 1.5; margin: 0 0 16px; }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .th-field-label { font-size: 10.5px; color: var(--pine-700); text-transform: uppercase; letter-spacing: .14em; font-weight: 700; margin-bottom: 6px; }
        input {
          width: 100%; box-sizing: border-box; border: 1.5px solid var(--line); border-radius: var(--r-sm);
          padding: 12px 13px; font-family: 'Inter', sans-serif; font-size: 14px; color: var(--ink-900);
          outline: none; background: var(--bone-100);
        }
        .status-msg { margin-top: 14px; border-radius: var(--r-md); padding: 11px 12px; font-size: 13.5px; line-height: 1.45; font-weight: 600; }
        .status-msg.ok { background: var(--pine-50); border: 1px solid #D5E4DC; color: var(--pine-700); }
        .status-msg.err { background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700); }
        .submit-btn {
          margin-top: 15px; width: 100%; min-height: 52px; border: none; border-radius: var(--r-full);
          font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; cursor: pointer;
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .submit-btn:disabled { opacity: .72; cursor: default; }
        .footnote { color: var(--ink-400); font-size: 12.5px; line-height: 1.45; margin-top: 10px; }

        @media (max-width: 860px) {
          .wrap { grid-template-columns: 1fr !important; padding: 16px 18px 26px !important; }
          .field-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <SiteHeader user={user} authReady={authChecked} onSignOut={async () => { await supabase.auth.signOut(); setUser(null); }} />
      <section className="wrap">
        <div className="panel">
          <span className="eyebrow">Planning path</span>
          <h1>Start a planning record before it is needed.</h1>
          <p className="lede">
            Passage saves wishes, trusted people, documents, and first-call context now, then requires trusted confirmation before a planning record becomes active later.
          </p>
          <div className="bullet-stack">
            {[
              ['Two trusted confirmations', 'A planning record cannot quietly become urgent from one person alone.'],
              ['Nothing sends automatically', 'Contacts are saved so the family knows who can confirm, review, and help.'],
              ['One calm family record', 'The planning record becomes the same action plan families use when support is actually needed.'],
            ].map(([title, body]) => (
              <div key={title} className="bullet">
                <div className="bullet-title">{title}</div>
                <div className="bullet-body">{body}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); savePlanningEstate(); }} className="th-form">
          <span className="form-eyebrow">Planning Setup</span>
          <h2>Create the planning record.</h2>
          <p className="form-sub">Start with the person, the coordinator, and two trusted contacts. You can fill in the rest inside the estate.</p>

          <div className="field-grid">
            <Field label="Person this plan protects">
              <input value={form.personName} onChange={e => set('personName', e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Your email">
              <input type="email" value={form.coordinatorEmail} onChange={e => set('coordinatorEmail', e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Primary trusted contact">
              <input value={form.executorName} onChange={e => set('executorName', e.target.value)} placeholder="Name" />
            </Field>
            <Field label="Primary contact email">
              <input type="email" value={form.executorEmail} onChange={e => set('executorEmail', e.target.value)} placeholder="trusted@example.com" />
            </Field>
            <Field label="Second trusted contact">
              <input value={form.secondConfirmerName} onChange={e => set('secondConfirmerName', e.target.value)} placeholder="Name" />
            </Field>
            <Field label="Second contact email">
              <input type="email" value={form.secondConfirmerEmail} onChange={e => set('secondConfirmerEmail', e.target.value)} placeholder="backup@example.com" />
            </Field>
            <Field label="Healthcare proxy">
              <input value={form.healthcareProxyName} onChange={e => set('healthcareProxyName', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Proxy email">
              <input type="email" value={form.healthcareProxyEmail} onChange={e => set('healthcareProxyEmail', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Burial or cremation preference">
              <input value={form.disposition} onChange={e => set('disposition', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Service preference">
              <input value={form.serviceType} onChange={e => set('serviceType', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Faith or cultural notes">
              <input value={form.faithTradition} onChange={e => set('faithTradition', e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Documents location">
              <input value={form.documentLocation} onChange={e => set('documentLocation', e.target.value)} placeholder="Optional" />
            </Field>
          </div>

          {message && (
            <div className={magicSent ? 'status-msg ok' : 'status-msg err'}>
              {message}
            </div>
          )}

          <button type="submit" disabled={saving} className="submit-btn">
            {saving ? 'Working...' : user ? 'Create planning record' : 'Email me a secure link'}
          </button>
          <div className="footnote">
            If you are already signed in, Passage saves the record now. If not, we send a secure link first so the record belongs to you.
          </div>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
