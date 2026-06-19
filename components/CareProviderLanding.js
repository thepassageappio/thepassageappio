import { useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from './SiteChrome';
import { calendlyUrl } from '../lib/scheduling';

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
  rose: '#a75d55',
  roseFaint: '#fdf3f1',
};

const providerOptions = [
  ['hospice', 'Hospice'],
  ['assisted_living', 'Assisted living'],
  ['senior_living', 'Senior living'],
  ['home_care', 'Home care'],
  ['care_facility', 'Care facility'],
];

const purposes = [
  ['Care team', 'Give families a calm way to collect contacts, wishes, documents, and first-call context before a crisis handoff.'],
  ['Family', 'Keep ownership of the record, decide who can see it, and carry the same plan into urgent coordination when needed.'],
  ['Funeral-home handoff', 'If a family chooses to share, funeral homes receive cleaner context without the care team owning the downstream decision.'],
];

const boundaryRows = [
  'Family records stay family-owned unless access is explicitly invited.',
  'Care teams receive only the context their role requires.',
  'Passage is not a referral marketplace, lead router, or per-death placement system.',
  'The practical next step is a care-team inquiry, walkthrough, or a family care-prep record.',
];

const handoffSteps = [
  ['1', 'Family starts a care-prep record', 'Contacts, wishes, documents, and trusted helpers are organized before details scatter.'],
  ['2', 'Care team stays in its lane', 'The organization can support the handoff without owning the family record or downstream choices.'],
  ['3', 'Funeral-home handoff is cleaner', 'If the family activates urgent coordination, the funeral home receives better context and fewer repeated calls.'],
  ['4', 'Assigned helpers and vendors stay scoped', 'Helpers and vendors see only the request they are assigned, not the whole family record or private notes.'],
];

const planRows = [
  ['Single team', 'For one care team or location proving the handoff model.', 'Care team inquiry'],
  ['Multi-location', 'For operators that need repeatable family continuity across several locations.', 'Plan rollout'],
  ['Enterprise', 'For organizations that need governance, reporting, training, and account support.', 'Talk to Passage'],
];

export default function CareProviderLanding({ focus = 'hospice' }) {
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
  const requiredReady = Boolean(form.organizationName.trim() && form.contactEmail.trim());

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    const formEl = event.currentTarget;
    if (formEl && !formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    setState('sending');
    setError('');
    const response = await fetch('/api/careProviders/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        source: focus === 'assisted_living' ? 'assisted_living_page' : focus === 'hospice' ? 'hospice_page' : 'care_provider_page',
      }),
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
      <section style={shell}>
        <div className="care-hero" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(340px, .72fr)', gap: 16, alignItems: 'stretch' }}>
          <div style={heroCard}>
            <div style={eyebrow}>Care-team support</div>
            <h1 style={heroTitle}>Help families leave care with a clearer next step.</h1>
            <p style={lead}>
              Passage helps hospice, assisted living, senior living, home-care, and care-facility teams support families before the moment of loss. Families can organize a care-prep record, keep control of access, and carry the same context into funeral-home coordination when needed.
            </p>
            <div style={actionRow}>
              <a href="#care-provider-inquiry" style={primaryLink}>Start care-team inquiry</a>
              <a href={calendlyUrl({ source: 'Care provider discovery' })} target="_blank" rel="noreferrer" style={secondaryLink}>Book walkthrough</a>
              <Link href="/hospice#start-warm-workspace" style={secondaryLink}>Create family care-prep record</Link>
            </div>
            <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 13, color: C.mid, fontSize: 13.5, lineHeight: 1.55, marginTop: 14 }}>
              Start an inquiry, book a walkthrough, or help a family begin a care-prep record. Active family work stays inside permissioned Passage records.
            </div>
            <div className="care-purpose-grid" style={purposeGrid}>
              {purposes.map(([title, body]) => (
                <div key={title} style={miniCard}>
                  <div style={smallEyebrow}>{title}</div>
                  <div style={smallText}>{body}</div>
                </div>
              ))}
            </div>
          </div>

          <form id="care-provider-inquiry" onSubmit={submit} style={formCard}>
            <div style={eyebrow}>Care team inquiry</div>
            <h2 style={h2}>Tell us where the family handoff breaks.</h2>
            <p style={{ ...smallText, marginBottom: 12 }}>Use this for hospice, assisted living, senior living, home-care, or care-facility handoff conversations. Required: organization name and contact email. We will use it to understand the handoff, permission boundary, and rollout fit.</p>
            {state === 'sent' ? (
              <div style={successBox}>
                <div style={smallEyebrow}>Received</div>
                <h3 style={{ ...h3, marginTop: 6 }}>We have your inquiry.</h3>
                <p style={smallText}>A receipt was sent to the contact email. Recommended next action: book a short walkthrough so we can understand your family handoff, permissions, and rollout needs.</p>
                <a href={calendlyUrl({ name: form.contactName, email: form.contactEmail, source: 'Care provider discovery' })} target="_blank" rel="noreferrer" style={{ ...primaryLink, marginTop: 12 }}>Book the walkthrough</a>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 9 }}>
                <input required value={form.organizationName} onChange={e => update('organizationName', e.target.value)} placeholder="Organization or community name" style={inputStyle} />
                <select value={form.providerType} onChange={e => update('providerType', e.target.value)} style={inputStyle}>
                  {providerOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <div className="care-form-two" style={twoCol}>
                  <input value={form.contactName} onChange={e => update('contactName', e.target.value)} placeholder="Contact name" style={inputStyle} />
                  <input required type="email" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} placeholder="Contact email" style={inputStyle} />
                </div>
                <div className="care-form-two" style={twoCol}>
                  <input type="tel" value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)} placeholder="Phone" style={inputStyle} />
                  <input type="url" value={form.website} onChange={e => update('website', e.target.value)} placeholder="Website" style={inputStyle} />
                </div>
                <div className="care-form-two" style={twoCol}>
                  <input value={form.locationsCount} onChange={e => update('locationsCount', e.target.value)} placeholder="Locations or branches" style={inputStyle} />
                  <input value={form.activeFamiliesEstimate} onChange={e => update('activeFamiliesEstimate', e.target.value)} placeholder="Families supported monthly" style={inputStyle} />
                </div>
                <textarea value={form.message} onChange={e => update('message', e.target.value)} placeholder="What family handoff, care transition, or coordination problem should Passage help solve?" style={{ ...inputStyle, minHeight: 88, paddingTop: 11, resize: 'vertical' }} />
                {!requiredReady && <div style={hintBox}>Add organization name and contact email to send the inquiry.</div>}
                {error && <div style={errorBox}>{error}</div>}
                <button disabled={state === 'sending' || !requiredReady} style={{ ...primaryButton, background: state === 'sending' || !requiredReady ? C.border : C.sage, cursor: state === 'sending' ? 'wait' : !requiredReady ? 'not-allowed' : 'pointer' }}>{state === 'sending' ? 'Sending...' : requiredReady ? 'Send care-team inquiry' : 'Add required info'}</button>
              </div>
            )}
          </form>
        </div>
      </section>

      <section style={section}>
        <div className="care-two" style={twoPanelGrid}>
          <div style={panel}>
            <div style={eyebrow}>Care-team fit</div>
            <h2 style={h2}>A calmer handoff before the first urgent call.</h2>
            <p style={smallText}>Care teams can help families collect contacts, wishes, documents, and first-call context earlier, while day-to-day case work stays inside permissioned Passage dashboards.</p>
          </div>
          <div style={panel}>
            <div style={eyebrow}>Boundaries</div>
            <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
              {boundaryRows.map(item => <div key={item} style={statusRow}>{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section style={section}>
        <div style={sectionHeader}>
          <div style={eyebrow}>Care handoff path</div>
          <h2 style={h2}>Care providers sit upstream of the funeral-home handoff.</h2>
          <p style={lead}>They help families get organized earlier. When the family needs urgent or funeral-home coordination, Passage carries forward the right context instead of making everyone start over.</p>
        </div>
        <div style={stepGrid}>
          {handoffSteps.map(([num, title, body]) => (
            <div key={title} style={stepCard}>
              <span style={numberBubble}>{num}</span>
              <h3 style={h3}>{title}</h3>
              <p style={smallText}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <div className="care-two" style={twoPanelGrid}>
          <div style={panel}>
            <div style={eyebrow}>Operating model</div>
            <h2 style={h2}>Useful without creating referral pressure.</h2>
            <p style={smallText}>Passage makes care transitions easier while protecting family trust. Care teams support preparation without becoming a sales channel or owning downstream decisions.</p>
            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {[
                ['Family owned', 'The family decides who can see the record and what downstream providers receive.'],
                ['Scoped access', 'Care teams, funeral homes, helpers, and vendors only see what their role requires.'],
                ['Proof based', 'Important decisions, notes, handoffs, and request outcomes stay attached to the record.'],
              ].map(([title, body]) => (
                <div key={title} style={rowBox}><strong>{title}</strong><span>{body}</span></div>
              ))}
            </div>
          </div>
          <div style={panel}>
            <div style={eyebrow}>Ways to start</div>
            <h2 style={h2}>Start small, then scale by team or location.</h2>
            <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
              {planRows.map(([title, body, cta]) => (
                <div key={title} style={planCard}>
                  <div>
                    <div style={smallEyebrow}>{title}</div>
                    <div style={{ ...smallText, marginTop: 4 }}>{body}</div>
                  </div>
                  <a href="#care-provider-inquiry" style={smallButton}>{cta}</a>
                </div>
              ))}
            </div>
            <div style={noteBox}>Care-team inquiries are reviewed before billing or rollout so scope, family ownership, location needs, and training expectations are clear.</div>
          </div>
        </div>
      </section>

      <section style={{ ...section, paddingBottom: 64 }}>
        <div style={panel}>
          <div style={eyebrow}>Related front doors</div>
          <h2 style={h2}>Separate pages. Same family-owned record.</h2>
          <div style={relatedGrid}>
            {[
              ['/funeral-home', 'Funeral homes', 'For funeral homes that need calmer family and staff coordination.'],
              ['/participants', 'Invited helpers', 'For relatives, clergy, friends, or trusted helpers assigned to one clear request.'],
              ['/vendors', 'Vendors', 'For local vendors that receive scoped service requests without seeing private family records.'],
            ].map(([href, title, body]) => (
              <Link key={href} href={href} style={relatedCard}>
                <div style={smallEyebrow}>{title}</div>
                <h3 style={h3}>{title}</h3>
                <p style={smallText}>{body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <style jsx>{`
        @media (max-width: 860px) {
          .care-hero,
          .care-two,
          .care-purpose-grid,
          .care-form-two {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <SiteFooter />
    </main>
  );
}

const shell = { maxWidth: 1180, margin: '0 auto', padding: '22px 28px 18px' };
const heroCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 24, boxShadow: '0 14px 42px rgba(55,45,35,.05)' };
const formCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 20, boxShadow: '0 14px 42px rgba(55,45,35,.05)' };
const section = { maxWidth: 1180, margin: '0 auto', padding: '12px 28px 18px' };
const sectionHeader = { maxWidth: 780, marginBottom: 16 };
const eyebrow = { color: C.sage, fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 };
const smallEyebrow = { color: C.sage, fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900 };
const heroTitle = { fontSize: 54, lineHeight: 1.02, letterSpacing: 0, margin: '8px 0 12px', fontWeight: 400 };
const h2 = { fontSize: 32, lineHeight: 1.08, margin: '8px 0 10px', fontWeight: 400 };
const h3 = { fontSize: 21, lineHeight: 1.18, margin: '8px 0 6px' };
const lead = { color: C.mid, fontSize: 17, lineHeight: 1.58, margin: 0 };
const smallText = { color: C.mid, fontSize: 14, lineHeight: 1.55, margin: 0 };
const actionRow = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 };
const primaryLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 16px', background: C.sage, color: '#fff', textDecoration: 'none', borderRadius: 13, fontWeight: 900, fontSize: 14 };
const secondaryLink = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '0 16px', background: C.card, color: C.sage, textDecoration: 'none', borderRadius: 13, border: '1px solid #c8deca', fontWeight: 900, fontSize: 14 };
const primaryButton = { border: 'none', minHeight: 48, borderRadius: 13, background: C.sage, color: '#fff', padding: '0 16px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', fontSize: 14 };
const smallButton = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 38, padding: '0 12px', background: C.sage, color: '#fff', textDecoration: 'none', borderRadius: 11, fontWeight: 900, fontSize: 12.5, whiteSpace: 'nowrap' };
const inputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid ' + C.border, borderRadius: 12, background: C.card, minHeight: 44, padding: '0 13px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink };
const purposeGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginTop: 18 };
const miniCard = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 13 };
const panel = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 20, boxShadow: '0 10px 30px rgba(55,45,35,.04)' };
const twoCol = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 };
const twoPanelGrid = { display: 'grid', gridTemplateColumns: 'minmax(0, .94fr) minmax(0, 1.06fr)', gap: 14 };
const stepGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 };
const stepCard = { background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16 };
const numberBubble = { width: 34, height: 34, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.sageFaint, color: C.sage, fontWeight: 900 };
const rowBox = { display: 'grid', gridTemplateColumns: '125px minmax(0,1fr)', gap: 12, background: C.bg, border: '1px solid ' + C.border, borderRadius: 13, padding: '12px 13px', color: C.mid, fontSize: 14, lineHeight: 1.45 };
const statusRow = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: '11px 12px', color: C.mid, fontSize: 14, lineHeight: 1.5 };
const planCard = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center', background: C.bg, border: '1px solid ' + C.border, borderRadius: 14, padding: 13 };
const noteBox = { background: C.amberFaint, border: '1px solid #ead4ac', borderRadius: 14, padding: 13, color: C.mid, fontSize: 13.5, lineHeight: 1.55, marginTop: 13 };
const successBox = { background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 16 };
const errorBox = { background: C.roseFaint, color: C.rose, border: '1px solid #e6c7c1', borderRadius: 12, padding: 10, fontSize: 13 };
const hintBox = { background: C.bg, color: C.mid, border: '1px solid ' + C.border, borderRadius: 12, padding: 10, fontSize: 12.5, lineHeight: 1.4 };
const relatedGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 14 };
const relatedCard = { ...stepCard, color: C.ink, textDecoration: 'none', display: 'block' };