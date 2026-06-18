import { useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { VENDOR_CATEGORIES } from '../../lib/vendors';
import SmartAddressInput from '../../components/SmartAddressInput';
import { calendlyUrl } from '../../lib/scheduling';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

export default function VendorOnboard() {
  const [form, setForm] = useState({ businessName: '', category: 'florist', serviceAddress: '', serviceCity: '', serviceState: '', serviceCountry: '', zipCodes: '', rushSupported: false, rushWindowHours: '24', plannedSupported: true, email: '', phone: '', website: '', description: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requiredReady = Boolean(form.businessName.trim() && form.zipCodes.trim() && form.email.trim());
  const setupPath = [
    ['Apply', 'Tell us the work you do, where you serve families, and how quickly you can respond.'],
    ['Review', 'Passage reviews each provider before any recommendation appears in a family request.'],
    ['Respond', 'Approved providers receive one scoped request at a time, then send quote, schedule, and completion proof back to the case.'],
  ];

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (formEl && !formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    const response = await fetch('/api/vendors/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) {
      setError(data.error || 'Could not submit this vendor application.');
      return;
    }
    setMessage('Application received. Recommended next action: book a vendor conversation or watch your email for review status. Nothing appears to families until Passage approves the provider.');
    setForm({ businessName: '', category: 'florist', serviceAddress: '', serviceCity: '', serviceState: '', serviceCountry: '', zipCodes: '', rushSupported: false, rushWindowHours: '24', plannedSupported: true, email: '', phone: '', website: '', description: '' });
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '2px 22px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .8fr) minmax(340px, 1fr)', gap: 14, alignItems: 'start' }}>
          <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 15, boxShadow: '0 10px 30px rgba(55,45,35,.045)' }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>Trusted local support</div>
            <h1 style={{ fontSize: 32, lineHeight: 1, margin: 0, fontWeight: 400 }}>Help when a family actually needs you.</h1>
            <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.35, margin: '8px 0 0' }}>Passage suggests local support only when the family request needs it. No public directory, no bidding wall, no browsing family records.</p>
            <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
              {['Families see your help only when it fits the next step.', 'You receive one scoped request with the details needed to answer.', 'Your response sends quote, schedule, and completion status back so nobody has to chase it.'].map((item) => (
                <div key={item} style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 11, padding: '8px 10px', color: C.mid, fontSize: 12.5, lineHeight: 1.35 }}>{item}</div>
              ))}
            </div>
            <details style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 13, padding: 8, marginTop: 8 }}>
              <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900 }}>How approval works</summary>
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {setupPath.map(([title, body]) => (
                  <div key={title} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 11, padding: '9px 10px' }}>
                    <div style={{ color: C.ink, fontSize: 13, fontWeight: 900 }}>{title}</div>
                    <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.4, marginTop: 3 }}>{body}</div>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <form onSubmit={submit} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 14, boxShadow: '0 10px 30px rgba(55,45,35,.045)' }}>
            <div style={{ fontSize: 21, lineHeight: 1.1, marginBottom: 3 }}>Apply as a support provider</div>
            <p style={{ color: C.mid, fontSize: 12, lineHeight: 1.3, margin: '0 0 6px' }}>We review every application manually before a vendor can receive Passage requests.</p>
            <p style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.35, margin: '0 0 8px' }}>Required: business name, service ZIPs, and email. Recommended next action: submit the application, then book a vendor conversation. Nothing appears to families until Passage approves the provider.</p>
            <label style={labelStyle}>Business name<input required value={form.businessName} onChange={(e) => update('businessName', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Category<select value={form.category} onChange={(e) => update('category', e.target.value)} style={inputStyle}>{Object.entries(VENDOR_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(150px, .65fr)', gap: 8, marginBottom: 7 }}>
              <SmartAddressInput
                compact
                label="Business or service area"
                value={form.serviceAddress}
                onChange={(value, parsed = {}) => setForm(prev => ({
                  ...prev,
                  serviceAddress: value,
                  serviceCity: parsed.city || '',
                  serviceState: parsed.state || '',
                  serviceCountry: parsed.country || '',
                  zipCodes: parsed.postalCode ? parsed.postalCode.slice(0, 5) : prev.zipCodes,
                }))}
                colors={C}
                inputStyle={{ background: C.bg }}
                placeholder="Start typing your address or primary service area"
                hint="Choose a suggestion to fill the ZIP field below."
              />
              <label style={{ ...labelStyle, marginBottom: 0 }}>ZIP codes served<input required inputMode="numeric" value={form.zipCodes} onChange={(e) => update('zipCodes', e.target.value)} placeholder="12508, 12601" style={inputStyle} /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 8 }}>
              <label style={checkStyle}><input type="checkbox" checked={form.rushSupported} onChange={(e) => update('rushSupported', e.target.checked)} /> Rush support</label>
              <label style={checkStyle}><input type="checkbox" checked={form.plannedSupported} onChange={(e) => update('plannedSupported', e.target.checked)} /> Planned support</label>
            </div>
            {form.rushSupported && <label style={labelStyle}>Rush window<select value={form.rushWindowHours} onChange={(e) => update('rushWindowHours', e.target.value)} style={inputStyle}>{['4','12','24','48'].map((h) => <option key={h} value={h}>{h} hours</option>)}</select></label>}
            <label style={labelStyle}>Email<input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Phone<input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Website<input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>How you help families<textarea value={form.description} onChange={(e) => update('description', e.target.value)} style={{ ...inputStyle, minHeight: 44, resize: 'vertical' }} /></label>
            {!requiredReady && <div style={{ background: C.bg, border: '1px solid ' + C.border, color: C.mid, borderRadius: 11, padding: 10, marginBottom: 8, fontSize: 12.5 }}>Add business name, service ZIPs, and email to submit.</div>}
            {error && <div style={{ background: C.roseFaint, border: '1px solid ' + C.rose + '33', color: C.rose, borderRadius: 11, padding: 10, marginBottom: 8 }}>{error}</div>}
            {message && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 11, padding: 10, marginBottom: 8, fontWeight: 800 }}>{message}</div>}
            <button disabled={submitting || !requiredReady} style={{ width: '100%', border: 'none', background: submitting || !requiredReady ? C.border : C.sage, color: '#fff', borderRadius: 12, padding: '10px 14px', fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 900, cursor: submitting ? 'wait' : !requiredReady ? 'not-allowed' : 'pointer' }}>{submitting ? 'Submitting...' : requiredReady ? 'Submit application' : 'Add required info'}</button>
            <a href={calendlyUrl({ name: form.businessName, email: form.email, source: 'Vendor conversation' })} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', color: C.ink, background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: '9px 12px', textDecoration: 'none', fontSize: 12.5, marginTop: 8, fontWeight: 900 }}>Recommended next action: book a vendor conversation</a>
            <Link href="/funeral-home" style={{ display: 'block', textAlign: 'center', color: C.sage, textDecoration: 'none', fontSize: 12, marginTop: 9, fontWeight: 800 }}>Funeral home information</Link>
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

const labelStyle = { display: 'grid', gap: 3, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 };
const inputStyle = { border: '1px solid ' + C.border, borderRadius: 10, background: C.bg, padding: '7px 10px', fontFamily: 'Georgia,serif', fontSize: 12.5, color: C.ink, minWidth: 0 };
const checkStyle = { display: 'flex', alignItems: 'center', gap: 7, background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 10, padding: '7px 10px', color: C.mid, fontSize: 12.2, marginBottom: 5 };