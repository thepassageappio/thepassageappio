import { useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { VENDOR_CATEGORIES } from '../../lib/vendors';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

export default function VendorOnboard() {
  const [form, setForm] = useState({ businessName: '', category: 'florist', zipCodes: '', rushSupported: false, rushWindowHours: '24', plannedSupported: true, email: '', phone: '', website: '', description: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setupPath = [
    ['Apply', 'Tell us the work you do, where you serve families, and how quickly you can respond.'],
    ['Review', 'Passage reviews each partner before any recommendation appears in a family task.'],
    ['Respond', 'Approved partners receive scoped requests and send status back to the family record.'],
  ];

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
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '8px 22px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .8fr) minmax(340px, 1fr)', gap: 14, alignItems: 'start' }}>
          <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, boxShadow: '0 10px 30px rgba(55,45,35,.045)' }}>
            <div style={{ color: C.sage, fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 7 }}>Trusted local support</div>
            <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', lineHeight: 1, margin: 0, fontWeight: 400 }}>Help when a family actually needs you.</h1>
            <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.42, margin: '10px 0 0' }}>Passage suggests local support only inside the task where it helps. No public directory, no bidding wall, no browsing family records.</p>
            <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
              {['Families see your help only when it fits the next step.', 'You receive one scoped request with the details needed to answer.', 'Your response updates the case so nobody has to chase status.'].map((item) => (
                <div key={item} style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 11, padding: '8px 10px', color: C.mid, fontSize: 12.5, lineHeight: 1.35 }}>{item}</div>
              ))}
            </div>
            <details style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 13, padding: 10, marginTop: 10 }}>
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
          <form onSubmit={submit} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, boxShadow: '0 10px 30px rgba(55,45,35,.045)' }}>
            <div style={{ fontSize: 22, lineHeight: 1.15, marginBottom: 4 }}>Apply as a support partner</div>
            <p style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.38, margin: '0 0 8px' }}>We review every application manually before recommendations appear in tasks.</p>
            <label style={labelStyle}>Business name<input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Category<select value={form.category} onChange={(e) => update('category', e.target.value)} style={inputStyle}>{Object.entries(VENDOR_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label style={labelStyle}>ZIP codes served<input value={form.zipCodes} onChange={(e) => update('zipCodes', e.target.value)} placeholder="12508, 12601, 10512" style={inputStyle} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 8 }}>
              <label style={checkStyle}><input type="checkbox" checked={form.rushSupported} onChange={(e) => update('rushSupported', e.target.checked)} /> Rush support</label>
              <label style={checkStyle}><input type="checkbox" checked={form.plannedSupported} onChange={(e) => update('plannedSupported', e.target.checked)} /> Planned support</label>
            </div>
            {form.rushSupported && <label style={labelStyle}>Rush window<select value={form.rushWindowHours} onChange={(e) => update('rushWindowHours', e.target.value)} style={inputStyle}>{['4','12','24','48'].map((h) => <option key={h} value={h}>{h} hours</option>)}</select></label>}
            <label style={labelStyle}>Email<input value={form.email} onChange={(e) => update('email', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Phone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Website<input value={form.website} onChange={(e) => update('website', e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>How you help families<textarea value={form.description} onChange={(e) => update('description', e.target.value)} style={{ ...inputStyle, minHeight: 58, resize: 'vertical' }} /></label>
            {error && <div style={{ background: C.roseFaint, border: '1px solid ' + C.rose + '33', color: C.rose, borderRadius: 11, padding: 10, marginBottom: 8 }}>{error}</div>}
            {message && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 11, padding: 10, marginBottom: 8, fontWeight: 800 }}>{message}</div>}
            <button disabled={submitting} style={{ width: '100%', border: 'none', background: C.sage, color: '#fff', borderRadius: 12, padding: '10px 14px', fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 900, cursor: submitting ? 'default' : 'pointer' }}>{submitting ? 'Submitting...' : 'Submit for review'}</button>
            <Link href="/funeral-home" style={{ display: 'block', textAlign: 'center', color: C.sage, textDecoration: 'none', fontSize: 12, marginTop: 9, fontWeight: 800 }}>Funeral home partner information</Link>
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

const labelStyle = { display: 'grid', gap: 4, fontSize: 9.8, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7 };
const inputStyle = { border: '1px solid ' + C.border, borderRadius: 10, background: C.bg, padding: '8px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink, minWidth: 0 };
const checkStyle = { display: 'flex', alignItems: 'center', gap: 7, background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 10, padding: '8px 10px', color: C.mid, fontSize: 12.5, marginBottom: 7 };
