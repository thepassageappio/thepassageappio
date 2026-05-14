import { useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from './SiteChrome';
import { calendlyUrl } from '../lib/scheduling';
import {
  CARE_PROVIDER_BUSINESS_MODEL,
  CARE_PROVIDER_SCOPE_BOUNDARIES,
  CARE_PROVIDER_SPINE_STEPS,
  CARE_PROVIDER_TYPES,
} from '../lib/careProviderContent';

const C = {
  bg: '#f6f3ee',
  card: '#ffffff',
  ink: '#1a1916',
  mid: '#6a6560',
  soft: '#a09890',
  border: '#e4ddd4',
  sage: '#6b8f71',
  sageFaint: '#f0f5f1',
  amber: '#b07d2e',
  amberFaint: '#fdf8ee',
};

const providerOptions = [
  ['hospice', 'Hospice'],
  ['assisted_living', 'Assisted living'],
  ['senior_living', 'Senior living'],
  ['home_care', 'Home care'],
];

export default function CareProviderLanding({ focus = 'hospice' }) {
  const active = CARE_PROVIDER_TYPES[focus] || CARE_PROVIDER_TYPES.hospice;
  const [form, setForm] = useState({
    organizationName: '',
    providerType: focus === 'assisted_living' ? 'assisted_living' : focus,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    locationsCount: '',
    activeFamiliesEstimate: '',
    message: '',
  });
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setState('sending');
    setError('');
    const response = await fetch('/api/careProviders/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, source: focus === 'assisted_living' ? 'assisted_living_page' : focus === 'hospice' ? 'hospice_page' : 'care_provider_page' }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState('idle');
      setError(json.error || 'Could not send this inquiry yet.');
      return;
    }
    setState('sent');
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'Georgia,serif' }}>
      <SiteHeader />
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '18px 28px 18px' }}>
        <div className="care-hero" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(360px, .78fr)', gap: 18, alignItems: 'stretch' }}>
          <div style={heroCard}>
            <div style={eyebrow}>{active.eyebrow}</div>
            <h1 style={{ fontSize: 54, lineHeight: 1.02, letterSpacing: 0, margin: '8px 0 12px', fontWeight: 400 }}>
              A calmer handoff from care into everything that comes next.
            </h1>
            <p style={lead}>
              Passage gives hospice, assisted living, senior living, and home-care teams a family-owned coordination layer: contacts, wishes, first-call plans, funeral-home handoffs, tasks, messages, and proof in one spine.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <a href="#care-provider-inquiry" style={primaryLink}>Start a care partner conversation</a>
              <Link href="/hospice#start-warm-workspace" style={secondaryLink}>Create a family warm-path record</Link>
              <a href={calendlyUrl({ source: 'Care provider discovery' })} target="_blank" rel="noreferrer" style={secondaryLink}>Book walkthrough</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginTop: 18 }} className="care-proof-grid">
              {[
                ['Family-owned', 'The family controls permissions and keeps the record after the care handoff.'],
                ['Provider-scoped', 'Care teams see the context and work they are invited to support.'],
                ['Downstream-ready', 'The same record can activate red path, funeral-home handoff, and vendor tasks.'],
              ].map(([title, body]) => (
                <div key={title} style={miniCard}>
                  <div style={smallEyebrow}>{title}</div>
                  <div style={smallText}>{body}</div>
                </div>
              ))}
            </div>
          </div>
          <form id="care-provider-inquiry" onSubmit={submit} style={formCard}>
            <div style={eyebrow}>Care provider inquiry</div>
            <h2 style={h2}>Tell us where the handoff starts.</h2>
            <p style={{ ...smallText, marginBottom: 12 }}>Use this for hospice, assisted living, senior living, home-care, or care-facility partnership conversations.</p>
            {state === 'sent' ? (
              <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 16 }}>
                <div style={{ ...smallEyebrow, color: C.sage }}>Received</div>
                <h3 style={{ margin: '5px 0 6px', fontSize: 24, fontWeight: 400 }}>We have your inquiry.</h3>
                <p style={smallText}>A branded receipt was sent to the contact email. We will follow up about the right care-provider pilot path.</p>
                <a href={calendlyUrl({ name: form.contactName, email: form.contactEmail, source: 'Care provider discovery' })} target="_blank" rel="noreferrer" style={{ ...primaryLink, marginTop: 12 }}>Book the walkthrough</a>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 9 }}>
                <input required value={form.organizationName} onChange={e => update('organizationName', e.target.value)} placeholder="Organization or community name" style={inputStyle} />
                <select value={form.providerType} onChange={e => update('providerType', e.target.value)} style={inputStyle}>
                  {providerOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <div className="care-form-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  <input value={form.contactName} onChange={e => update('contactName', e.target.value)} placeholder="Contact name" style={inputStyle} />
                  <input required type="email" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} placeholder="Contact email" style={inputStyle} />
                </div>
                <div className="care-form-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  <input value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)} placeholder="Phone" style={inputStyle} />
                  <input value={form.website} onChange={e => update('website', e.target.value)} placeholder="Website" style={inputStyle} />
                </div>
                <div className="care-form-two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  <input value={form.locationsCount} onChange={e => update('locationsCount', e.target.value)} placeholder="Locations or branches" style={inputStyle} />
                  <input value={form.activeFamiliesEstimate} onChange={e => update('activeFamiliesEstimate', e.target.value)} placeholder="Families supported monthly" style={inputStyle} />
                </div>
                <textarea value={form.message} onChange={e => update('message', e.target.value)} placeholder="What handoff, family coordination, or pilot are you trying to improve?" style={{ ...inputStyle, minHeight: 88, paddingTop: 11, resize: 'vertical' }} />
                {error && <div style={{ background: '#fdf3f3', color: '#9a6842', border: '1px solid #edd0bd', borderRadius: 12, padding: 10, fontSize: 13 }}>{error}</div>}
                <button disabled={state === 'sending'} style={primaryButton}>{state === 'sending' ? 'Sending...' : 'Submit care-provider inquiry'}</button>
              </div>
            )}
          </form>
        </div>
      </section>

      <section style={section}>
        <div style={sectionHeader}>
          <div style={eyebrow}>One shared spine</div>
          <h2 style={h2}>Care providers are upstream continuity partners.</h2>
          <p style={lead}>They are not vendors, and they are not funeral homes. They help the family start earlier, then Passage carries the record into red path, funeral-home coordination, participants, vendors, and aftercare when needed.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {CARE_PROVIDER_SPINE_STEPS.map(([n, title, body]) => (
            <div key={title} style={stepCard}>
              <span style={numberBubble}>{n}</span>
              <h3 style={h3}>{title}</h3>
              <p style={smallText}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <div className="care-two" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .9fr) minmax(0, 1.1fr)', gap: 14 }}>
          <div style={panel}>
            <div style={eyebrow}>Business model</div>
            <h2 style={h2}>B2B fishing rods without awkward incentives.</h2>
            <p style={smallText}>Care partners should pay for coordination infrastructure, location rollout, family handoff quality, and reporting. We should not charge hospice per death event.</p>
            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {CARE_PROVIDER_BUSINESS_MODEL.map(([title, body]) => (
                <div key={title} style={rowBox}>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={panel}>
            <div style={eyebrow}>Product boundaries</div>
            <h2 style={h2}>Helpful, scoped, and family-first.</h2>
            <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
              {CARE_PROVIDER_SCOPE_BOUNDARIES.map(item => (
                <div key={item} style={statusRow}>{item}</div>
              ))}
            </div>
            <div style={{ background: C.amberFaint, border: '1px solid #ead4ac', borderRadius: 14, padding: 13, color: C.mid, fontSize: 13.5, lineHeight: 1.55, marginTop: 13 }}>
              P0 target: care provider creates or refers a family warm-path record, the family accepts ownership, and the same record can later trigger Green to Red validation and downstream handoffs.
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...section, paddingBottom: 64 }}>
        <div style={panel}>
          <div style={eyebrow}>Front doors</div>
          <h2 style={h2}>Separate messaging. Same operating spine.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 14 }}>
            {Object.values(CARE_PROVIDER_TYPES).map(item => (
              <Link key={item.label} href={item.path} style={{ ...stepCard, color: C.ink, textDecoration: 'none', display: 'block' }}>
                <div style={smallEyebrow}>{item.eyebrow}</div>
                <h3 style={h3}>{item.label}</h3>
                <p style={smallText}>{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <style jsx>{`
        @media (max-width: 860px) {
          .care-hero,
          .care-two,
          .care-proof-grid,
          .care-form-two {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <SiteFooter />
    </main>
  );
}

const heroCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 24, boxShadow: '0 14px 42px rgba(55,45,35,.05)' };
const formCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 20, boxShadow: '0 14px 42px rgba(55,45,35,.05)' };
const section = { maxWidth: 1180, margin: '0 auto', padding: '12px 28px 18px' };
const sectionHeader = { maxWidth: 780, marginBottom: 16 };
const eyebrow = { color: C.sage, fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const smallEyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900 };
const h2 = { fontSize: 32, lineHeight: 1.08, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { fontSize: 21, lineHeight: 1.18, margin: '8px 0 6px' };
const lead = { color: C.mid, fontSize: 17, lineHeight: 1.58, margin: 0 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.55, margin: 0 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 16px', background: C.sage, color: '#fff', textDecoration: 'none', borderRadius: 13, fontWeight: 900, fontSize: 14 };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 16px', background: C.card, color: C.sage, textDecoration: 'none', borderRadius: 13, border: '1px solid #c8deca', fontWeight: 900, fontSize: 14 };
const primaryButton = { border: 'none', minHeight: 48, borderRadius: 13, background: C.sage, color: '#fff', padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', fontSize: 14 };
const inputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid ' + C.border, borderRadius: 12, background: C.card, minHeight: 44, padding: '0 13px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink };
const miniCard = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 13 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 20, boxShadow: '0 10px 30px rgba(55,45,35,.04)' };
const stepCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16 };
const numberBubble = { width: 34, height: 34, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.sageFaint, color: C.sage, fontWeight: 900 };
const rowBox = { display: 'grid', gridTemplateColumns: '130px minmax(0,1fr)', gap: 12, background: C.bg, border: '1px solid ' + C.border, borderRadius: 13, padding: '12px 13px', color: C.mid, fontSize: 14, lineHeight: 1.45 };
const statusRow = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: '11px 12px', color: C.mid, fontSize: 14, lineHeight: 1.5 };

