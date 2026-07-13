import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import SmartAddressInput from '../../components/SmartAddressInput';
import { supabase } from '../../lib/supabaseBrowser';
import { friendlyAuthError, isLikelyEmail, normalizeEmail } from '../../lib/authFeedback';
import { FUNERAL_HOME_PLAN_OPTIONS, partnerPlanFor } from '../../lib/partnerPlans';

const ADDRESS_COLORS = {
  ink: '#1C1917',
  mid: '#5A5348',
  soft: '#79705F',
  border: '#E6DDCB',
  card: '#FBF8F3',
  bg: '#FBF8F3',
  sage: '#245A4B',
  sageFaint: '#F2F6F3',
};

const setupOutcomes = [
  ['1', 'Confirm customer dashboard', 'Name, support contact, subscription, and first location.'],
  ['2', 'Add operating roles', 'Invite directors and staff so each person starts in the right permission lane.'],
  ['3', 'Create first case', 'Add one real family case or import the case list from the system you already use.'],
  ['4', 'Assign the first next step', 'Every live case should show what staff does next, who owns it, who we are waiting on, the drafted message, and where proof saves.'],
];

const doneRows = [
  ['First next-step owner', 'A director can see who owns the next step before opening the full case.'],
  ['First family update', 'A family-facing message is drafted for review. Nothing sends automatically.'],
  ['First proof packet', 'Release, service detail, work outcome, and note proof have a place to land.'],
];

export default function FuneralHomeSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    organizationName: '',
    directorName: '',
    supportEmail: '',
    supportPhone: '',
    locationName: 'Main location',
    locationAddress: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    placeId: '',
    planId: 'partner_local',
  });

  const selectedPlan = partnerPlanFor(form.planId);
  const setupReady = Boolean(form.organizationName.trim() && form.locationAddress.trim());

  useEffect(() => {
    if (!supabase?.auth) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setToken(data.session?.access_token || '');
      if (data.session?.user?.email) {
        setEmail(data.session.user.email);
        setForm(prev => ({ ...prev, supportEmail: prev.supportEmail || data.session.user.email, directorName: prev.directorName || data.session.user.user_metadata?.full_name || '' }));
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setToken(session?.access_token || '');
      if (session?.user?.email) {
        setEmail(session.user.email);
        setForm(prev => ({ ...prev, supportEmail: prev.supportEmail || session.user.email, directorName: prev.directorName || session.user.user_metadata?.full_name || '' }));
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signInGoogle() {
    setError('');
    if (typeof window === 'undefined') return;
    window.location.assign('/auth/google?next=' + encodeURIComponent('/funeral-home/setup'));
  }

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(email);
    setMagicSent(false);
    if (!cleanEmail) return setError('Enter your work email first.');
    if (!isLikelyEmail(cleanEmail)) return setError('Enter a valid email address, like name@example.com.');
    if (!supabase?.auth || typeof window === 'undefined') return setError('Sign-in is not configured in this environment.');
    setError('');
    setMagicLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.href },
    });
    setMagicLoading(false);
    if (authError) setError(friendlyAuthError(authError));
    else {
      setEmail(cleanEmail);
      setMagicSent(true);
    }
  }

  async function createWorkspace(event) {
    event.preventDefault();
    const formEl = event.currentTarget;
    if (formEl && !formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    if (!token) return setError('Sign in before creating the dashboard.');
    if (!setupReady) return setError('Add funeral-home name and main location address before creating the dashboard.');
    setLoading(true);
    setError('');
    const response = await fetch('/api/partnerSelfServeSetup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        organizationName: form.organizationName,
        directorName: form.directorName,
        supportEmail: form.supportEmail || user?.email,
        supportPhone: form.supportPhone,
        planId: form.planId,
        location: {
          name: form.locationName,
          address: form.locationAddress,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
          placeId: form.placeId,
        },
      }),
    });
    const json = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(json.error || 'Could not create the funeral-home dashboard.');
    router.push(`/funeral-home/dashboard?partner=1&email=${encodeURIComponent(user.email)}`);
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
        .wrap { max-width: 1040px; margin: 0 auto; padding: 30px 24px 60px; }
        .grid { display: grid; grid-template-columns: minmax(0,.8fr) minmax(320px,1fr); gap: 18px; align-items: start; }
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
          font-size: clamp(30px, 4.6vw, 44px);
          line-height: 1.06;
          letter-spacing: -.018em;
          color: var(--pine-950);
          margin: 12px 0 14px;
        }
        h2 {
          font-family: 'Fraunces', serif;
          font-weight: 460;
          font-size: 25px;
          line-height: 1.16;
          letter-spacing: -.01em;
          color: var(--pine-950);
          margin: 8px 0 10px;
        }
        p.lede { color: var(--ink-500); font-size: 15.5px; line-height: 1.62; margin: 0; }
        .outcome-list { display: grid; gap: 9px; margin-top: 20px; }
        .outcome-row {
          display: grid;
          grid-template-columns: 32px minmax(0,1fr);
          gap: 12px;
          background: var(--pine-50);
          border: 1px solid #D5E4DC;
          border-radius: var(--r-md);
          padding: 13px;
          color: var(--ink-600);
          font-size: 13.5px;
          line-height: 1.48;
          box-shadow: var(--e1);
        }
        .outcome-num {
          color: var(--pine-700);
          text-align: center;
          font-weight: 700;
          font-family: 'Fraunces', serif;
          font-size: 16px;
        }
        .outcome-row strong { color: var(--ink-900); }
        .callout {
          border-radius: var(--r-md);
          padding: 14px;
          font-size: 13.2px;
          line-height: 1.52;
          margin-top: 16px;
        }
        .callout.clay { background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--ink-600); }
        .callout.clay strong { color: var(--clay-700); }
        .callout.pine { background: var(--pine-50); border: 1px solid #D5E4DC; color: var(--ink-600); }
        .callout.pine strong { color: var(--pine-700); }
        .th-error {
          background: var(--clay-50);
          border: 1px solid var(--clay-200);
          color: var(--clay-700);
          border-radius: var(--r-sm);
          padding: 11px 14px;
          font-size: 13px;
          line-height: 1.48;
          margin-bottom: 10px;
        }
        .th-confirm {
          background: var(--pine-50);
          border: 1px solid #D5E4DC;
          color: var(--pine-700);
          border-radius: var(--r-sm);
          padding: 11px 14px;
          font-size: 13px;
          line-height: 1.48;
          margin-top: 10px;
        }
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
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn:disabled { cursor: not-allowed; opacity: .68; transform: none; }
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
        }
        .th-btn-full { width: 100%; min-height: 50px; margin-bottom: 9px; }
        input, select {
          border: 1.5px solid var(--line);
          border-radius: var(--r-sm);
          background: var(--bone-100);
          padding: 13px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--ink-900);
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        input.has-error { border-color: var(--clay-600); }
        .field-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; }
        .plan-block {
          background: var(--pine-50);
          border: 1px solid #D5E4DC;
          border-radius: var(--r-md);
          padding: 14px;
        }
        .plan-label {
          display: block;
          color: var(--pine-700);
          font-size: 10.5px;
          letter-spacing: .14em;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .plan-note { color: var(--ink-500); font-size: 12.5px; line-height: 1.48; margin: 9px 0 0; }
        .done-rows { display: grid; gap: 7px; }
        .done-row {
          background: var(--bone-100);
          border: 1px solid var(--line-soft);
          border-radius: var(--r-sm);
          padding: 9px 11px;
          color: var(--ink-500);
          font-size: 12.5px;
          line-height: 1.42;
        }
        .done-row strong { color: var(--ink-900); }
        .not-ready { color: var(--ink-500); font-size: 12.5px; line-height: 1.48; }
        form { display: grid; gap: 10px; }

        @media (max-width: 780px) {
          .wrap { padding: 18px 16px 44px; }
          .grid { grid-template-columns: 1fr; }
          .panel { padding: 20px; border-radius: var(--r-md); }
          .field-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <SiteHeader user={user} />
      <section className="wrap">
        <div className="grid">
          <div className="panel">
            <span className="eyebrow">Funeral-home setup</span>
            <h1>Create the funeral-home dashboard.</h1>
            <p className="lede">
              Start with the funeral-home name, owner, subscription, and first location. Setup is complete only when staff can open a case and see what to do next, who owns it, who Passage is waiting on, the family message, and where proof saves.
            </p>
            <div className="outcome-list">
              {setupOutcomes.map(([number, title, body]) => (
                <div key={title} className="outcome-row">
                  <span className="outcome-num">{number}</span>
                  <span><strong>{title}</strong><br />{body}</span>
                </div>
              ))}
            </div>
            <div className="callout clay">
              <strong>What done means:</strong> the first case has an owner, a visible next step, a drafted family message, and a proof packet destination before the team starts using Passage with families.
            </div>
            <div className="callout pine">
              <strong>Recommended next action:</strong> sign in as an owner or director, add the funeral-home name and main location, then create one real case so staff can see who owns the next step and where proof saves.
            </div>
          </div>

          <div className="panel">
            {!user ? (
              <div>
                <span className="eyebrow">Sign in first</span>
                <h2>Use your work email.</h2>
                <p className="lede" style={{ fontSize: 13.2, marginBottom: 12 }}>Only an approved funeral-home owner or director should create the dashboard. Staff should use the staff queue after they are invited.</p>
                {error && <div className="th-error">{error}</div>}
                <button onClick={signInGoogle} className="th-btn th-btn-primary th-btn-full">Continue with Google</button>
                <div className="field-row">
                  <input value={email} onChange={event => { setEmail(event.target.value); setError(''); setMagicSent(false); }} type="email" placeholder="director@funeralhome.com" className={error ? 'has-error' : ''} />
                  <button disabled={magicLoading} onClick={sendMagicLink} className="th-btn th-btn-secondary">{magicLoading ? 'Sending...' : 'Email link'}</button>
                </div>
                {magicSent && <div className="th-confirm">Check your email. Come back here after signing in.</div>}
              </div>
            ) : (
              <form onSubmit={createWorkspace}>
                <span className="eyebrow">Dashboard details</span>
                <div className="callout pine" style={{ marginTop: 8 }}>
                  <strong>Recommended next action:</strong> add the funeral-home name and main location first. Then open the dashboard, create one real case, assign the next-step owner, and confirm where proof saves.
                </div>
                <input required value={form.organizationName} onChange={event => setForm(prev => ({ ...prev, organizationName: event.target.value }))} placeholder="Funeral home name" />
                <input value={form.directorName} onChange={event => setForm(prev => ({ ...prev, directorName: event.target.value }))} placeholder="Director / owner name" />
                <input type="email" value={form.supportEmail} onChange={event => setForm(prev => ({ ...prev, supportEmail: event.target.value }))} placeholder="Family support email" />
                <input type="tel" value={form.supportPhone} onChange={event => setForm(prev => ({ ...prev, supportPhone: event.target.value }))} placeholder="Family support phone" />
                <div className="plan-block">
                  <label className="plan-label">Subscription and location slots</label>
                  <select value={form.planId} onChange={event => setForm(prev => ({ ...prev, planId: event.target.value }))}>
                    {Object.values(FUNERAL_HOME_PLAN_OPTIONS).map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.label} - {plan.includedLocationSlots} location{plan.includedLocationSlots === 1 ? '' : 's'} included</option>
                    ))}
                  </select>
                  <p className="plan-note">
                    {selectedPlan.description} Additional locations are tracked as paid slots at ${(selectedPlan.additionalLocationFeeCents / 100).toFixed(0)}/mo each.
                  </p>
                </div>
                <input value={form.locationName} onChange={event => setForm(prev => ({ ...prev, locationName: event.target.value }))} placeholder="Main location name" />
                <SmartAddressInput
                  label="Main location address"
                  value={form.locationAddress}
                  onChange={(value, parsed = {}) => {
                    setError('');
                    setForm(prev => ({
                      ...prev,
                      locationAddress: value,
                      city: parsed.city || prev.city,
                      state: parsed.state || prev.state,
                      zip: parsed.postalCode || parsed.zip || prev.zip,
                      country: parsed.country || prev.country,
                      placeId: parsed.placeId || prev.placeId,
                    }));
                  }}
                  colors={ADDRESS_COLORS}
                  inputStyle={{ fontFamily: 'Inter, sans-serif', borderRadius: 12 }}
                  placeholder="Start typing the location address"
                />
                <div className="done-rows">
                  {doneRows.map(([title, body]) => (
                    <div key={title} className="done-row">
                      <strong>{title}:</strong> {body}
                    </div>
                  ))}
                </div>
                {error && <div className="th-error">{error}</div>}
                {!setupReady && <div className="not-ready">Add required info: funeral-home name and main location address.</div>}
                <button disabled={loading || !setupReady} className="th-btn th-btn-primary th-btn-full" style={{ minHeight: 52 }}>
                  {loading ? 'Creating dashboard...' : setupReady ? 'Create dashboard and open funeral-home dashboard' : 'Add required info'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
