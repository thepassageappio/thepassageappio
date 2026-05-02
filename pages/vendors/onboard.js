import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '../../components/SiteChrome';
import { VENDOR_CATEGORIES } from '../../lib/vendors';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

export default function VendorOnboard() {
  const [form, setForm] = useState({ businessName: '', category: 'florist', zipCodes: '', rushSupported: false, rushWindowHours: '24', plannedSupported: true, email: '', phone: '', website: '', description: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
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
    setMessage('Thank you. Passage reviews every local support partner before showing them to families.');
    setForm({ businessName: '', category: 'florist', zipCodes: '', rushSupported: false, rushWindowHours: '24', plannedSupported: true, email: '', phone: '', website: '', description: '' });
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 22px 46px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .9fr) minmax(360px, .7fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 26 }}>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 10 }}>Trusted local support</div>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 1.03, margin: 0, fontWeight: 400 }}>Help families at the moment your work matters most.</h1>
            <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.7, marginTop: 16 }}>Passage only suggests partners inside the task where they can help. No directory, no bidding wall, no hard sell.</p>
            <div style={{ display: 'grid', gap: 9, marginTop: 20 }}>
              {['Families see your help only when it fits the next step.', 'You receive a request by email and update it from a private Passage link.', 'Passage tracks the booking value so future payments and funeral-home partner share can stay inside the system.', 'Funeral homes can choose preferred local partners.'].map((item) => (
                <div key={item} style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: '10px 12px', color: C.mid, lineHeight: 1.5 }}>{item}</div>
              ))}
            </div>
          </div>
          <form onSubmit={submit} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 22 }}>
            <div style={{ fontSize: 24, lineHeight: 1.2, marginBottom: 6 }}>Apply as a support partner</div>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, marginTop: 0 }}>We review every application manually before recommendations appear in tasks.</p>
            <label style={labelStyle}>Business name<input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Category<select value={form.category} onChange={(e) => update('category', e.target.value)} style={inputStyle}>{Object.entries(VENDOR_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label style={labelStyle}>ZIP codes served<input value={form.zipCodes} onChange={(e) => update('zipCodes', e.target.value)} placeholder="12508, 12601, 10512" style={inputStyle} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label style={checkStyle}><input type="checkbox" checked={form.rushSupported} onChange={(e) => update('rushSupported', e.target.checked)} /> Rush support</label>
              <label style={checkStyle}><input type="checkbox" checked={form.plannedSupported} onChange={(e) => update('plannedSupported', e.target.checked)} /> Planned support</label>
            </div>
            {form.rushSupported && <label style={labelStyle}>Rush window<select value={form.rushWindowHours} onChange={(e) => update('rushWindowHours', e.target.value)} style={inputStyle}>{['4','12','24','48'].map((h) => <option key={h} value={h}>{h} hours</option>)}</select></label>}
            <label style={labelStyle}>Email<input value={form.email} onChange={(e) => update('email', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Phone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Website<input value={form.website} onChange={(e) => update('website', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>How you help families<textarea value={form.description} onChange={(e) => update('description', e.target.value)} style={{ ...inputStyle, minHeight: 82, resize: 'vertical' }} /></label>
            {error && <div style={{ background: C.roseFaint, border: '1px solid ' + C.rose + '33', color: C.rose, borderRadius: 11, padding: 10, marginBottom: 8 }}>{error}</div>}
            {message && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 11, padding: 10, marginBottom: 8, fontWeight: 800 }}>{message}</div>}
            <button disabled={submitting} style={{ width: '100%', border: 'none', background: C.sage, color: '#fff', borderRadius: 12, padding: '12px 14px', fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 900, cursor: submitting ? 'default' : 'pointer' }}>{submitting ? 'Submitting...' : 'Submit for review'}</button>
            <Link href="/funeral-home" style={{ display: 'block', textAlign: 'center', color: C.sage, textDecoration: 'none', fontSize: 12.5, marginTop: 12, fontWeight: 800 }}>Funeral home partner information</Link>
          </form>
        </div>
      </section>
    </main>
  );
}

const labelStyle = { display: 'grid', gap: 5, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 9 };
const inputStyle = { border: '1px solid ' + C.border, borderRadius: 11, background: C.bg, padding: '10px 11px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink, minWidth: 0 };
const checkStyle = { display: 'flex', alignItems: 'center', gap: 7, background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 11, padding: '10px 11px', color: C.mid, fontSize: 13, marginBottom: 9 };
