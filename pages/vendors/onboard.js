import { useState } from 'react';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { VENDOR_CATEGORIES } from '../../lib/vendors';
import SmartAddressInput from '../../components/SmartAddressInput';
import { calendlyUrl } from '../../lib/scheduling';

const TH = {
  pine950: '#0A1F1A', pine800: '#153A31', pine700: '#1C4A3E', pine600: '#245A4B',
  pine100: '#E7EFEA', pine50: '#F2F6F3',
  clay700: '#9A4F26', clay600: '#B5622F', clay200: '#EBC6A4', clay50: '#FBF0E7',
  bone50: '#FEFDFB', bone100: '#FBF8F3',
  ink900: '#1C1917', ink600: '#5A5348', ink500: '#79705F',
  line: '#E6DDCB', lineSoft: '#EFE8DA',
};

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
    <main className="th-shell">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,440;9..144,520&family=Inter:wght@400;500;600;700&display=swap');
        :root{
          --pine-950:#0A1F1A; --pine-800:#153A31; --pine-700:#1C4A3E; --pine-600:#245A4B;
          --pine-100:#E7EFEA; --pine-50:#F2F6F3;
          --clay-700:#9A4F26; --clay-600:#B5622F; --clay-200:#EBC6A4; --clay-50:#FBF0E7;
          --bone-50:#FEFDFB; --bone-100:#FBF8F3;
          --ink-900:#1C1917; --ink-600:#5A5348; --ink-500:#79705F;
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
        .wrap { max-width: 1080px; margin: 0 auto; padding: 26px 22px 56px; }
        .grid { display: grid; grid-template-columns: minmax(0,.78fr) minmax(340px,1fr); gap: 16px; align-items: start; }
        .panel {
          background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg);
          padding: 22px; box-shadow: var(--e2);
        }
        .eyebrow { color: var(--clay-600); font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 {
          font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(26px, 3.6vw, 36px);
          line-height: 1.06; letter-spacing: -.018em; color: var(--pine-950); margin: 10px 0 10px;
        }
        p.lede { color: var(--ink-500); font-size: 13.5px; line-height: 1.55; margin: 0; }
        .pill-list { display: grid; gap: 8px; margin-top: 14px; }
        .pill-item { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-sm); padding: 10px 12px; color: var(--ink-600); font-size: 12.5px; line-height: 1.42; }
        details.how {
          background: var(--bone-100); border: 1px solid var(--line-soft); border-radius: var(--r-md); padding: 12px; margin-top: 12px;
        }
        details.how summary { cursor: pointer; color: var(--pine-700); font-weight: 700; font-size: 13px; }
        .how-step { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-sm); padding: 10px 11px; margin-top: 8px; }
        .how-step-title { color: var(--ink-900); font-size: 13px; font-weight: 600; }
        .how-step-body { color: var(--ink-500); font-size: 12px; line-height: 1.4; margin-top: 3px; }

        form.apply { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 20px; box-shadow: var(--e2); }
        .apply-title { font-family: 'Fraunces', serif; font-weight: 460; font-size: 21px; color: var(--pine-950); margin-bottom: 4px; }
        .apply-sub { color: var(--ink-500); font-size: 12px; line-height: 1.4; margin: 0 0 6px; }
        .apply-note { color: var(--ink-500); font-size: 11.6px; line-height: 1.42; margin: 0 0 10px; }
        label.field { display: grid; gap: 4px; font-size: 10.5px; color: var(--clay-600); font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 8px; }
        input, select, textarea {
          border: 1.5px solid var(--line); border-radius: var(--r-sm); background: var(--bone-100);
          padding: 9px 11px; font-family: 'Inter', sans-serif; font-size: 13px; color: var(--ink-900); outline: none; min-width: 0;
        }
        .addr-row { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(150px,.65fr); gap: 8px; margin-bottom: 8px; }
        .check-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); gap: 8px; }
        .check-item {
          display: flex; align-items: center; gap: 7px; background: var(--pine-50); border: 1px solid #D5E4DC;
          border-radius: var(--r-sm); padding: 8px 10px; color: var(--ink-600); font-size: 12px; margin-bottom: 5px;
        }
        .info-note { background: var(--bone-100); border: 1px solid var(--line-soft); color: var(--ink-500); border-radius: var(--r-sm); padding: 10px; margin-bottom: 8px; font-size: 12px; }
        .th-error { background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700); border-radius: var(--r-sm); padding: 10px; margin-bottom: 8px; font-size: 12.5px; }
        .th-confirm { background: var(--pine-50); border: 1px solid #D5E4DC; color: var(--pine-700); border-radius: var(--r-sm); padding: 10px; margin-bottom: 8px; font-size: 12.5px; font-weight: 600; }
        .th-btn {
          width: 100%; border: none; border-radius: var(--r-full); padding: 12px 14px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: transform .18s var(--ease), box-shadow .18s var(--ease);
        }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-primary {
          background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff;
          box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35);
        }
        .th-btn-disabled { background: var(--line-soft); color: var(--ink-500); cursor: not-allowed; box-shadow: none; }
        .th-link-btn {
          display: block; text-align: center; color: var(--pine-800); background: var(--pine-50); border: 1px solid #D5E4DC;
          border-radius: var(--r-full); padding: 9px 12px; text-decoration: none; font-size: 12px; margin-top: 8px; font-weight: 600;
        }
        .th-plain-link { display: block; text-align: center; color: var(--pine-700); text-decoration: none; font-size: 12px; margin-top: 9px; font-weight: 600; }

        @media (max-width: 780px) {
          .wrap { padding: 18px 16px 40px; }
          .grid { grid-template-columns: 1fr; }
          .addr-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <SiteHeader />
      <section className="wrap">
        <div className="grid">
          <div className="panel">
            <span className="eyebrow">Trusted local support</span>
            <h1>Help when a family actually needs you.</h1>
            <p className="lede">Passage suggests local support only when the family request needs it. No public directory, no bidding wall, no browsing family records.</p>
            <div className="pill-list">
              {['Families see your help only when it fits the next step.', 'You receive one scoped request with the details needed to answer.', 'Your response sends quote, schedule, and completion status back so nobody has to chase it.'].map((item) => (
                <div key={item} className="pill-item">{item}</div>
              ))}
            </div>
            <details className="how">
              <summary>How approval works</summary>
              {setupPath.map(([title, body]) => (
                <div key={title} className="how-step">
                  <div className="how-step-title">{title}</div>
                  <div className="how-step-body">{body}</div>
                </div>
              ))}
            </details>
          </div>
          <form onSubmit={submit} className="apply">
            <div className="apply-title">Apply as a support provider</div>
            <p className="apply-sub">We review every application manually before a vendor can receive Passage requests.</p>
            <p className="apply-note">Required: business name, service ZIPs, and email. Recommended next action: submit the application, then book a vendor conversation. Nothing appears to families until Passage approves the provider.</p>
            <label className="field">Business name<input required value={form.businessName} onChange={(e) => update('businessName', e.target.value)} /></label>
            <label className="field">Category<select value={form.category} onChange={(e) => update('category', e.target.value)}>{Object.entries(VENDOR_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div className="addr-row">
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
                colors={{ bg: TH.bone100, card: TH.bone50, ink: TH.ink900, mid: TH.ink500, soft: TH.ink500, border: TH.line, sage: TH.pine700, sageFaint: TH.pine50, rose: TH.clay600, roseFaint: TH.clay50 }}
                inputStyle={{ background: TH.bone100 }}
                placeholder="Start typing your address or primary service area"
                hint="Type an address or service area, or choose a suggestion. If suggestions do not appear, use the typed address and enter ZIP codes below."
              />
              <label className="field" style={{ marginBottom: 0 }}>ZIP codes served<input required inputMode="numeric" value={form.zipCodes} onChange={(e) => update('zipCodes', e.target.value)} placeholder="12508, 12601" /></label>
            </div>
            <div className="check-row">
              <label className="check-item"><input type="checkbox" checked={form.rushSupported} onChange={(e) => update('rushSupported', e.target.checked)} /> Rush support</label>
              <label className="check-item"><input type="checkbox" checked={form.plannedSupported} onChange={(e) => update('plannedSupported', e.target.checked)} /> Planned support</label>
            </div>
            {form.rushSupported && <label className="field">Rush window<select value={form.rushWindowHours} onChange={(e) => update('rushWindowHours', e.target.value)}>{['4','12','24','48'].map((h) => <option key={h} value={h}>{h} hours</option>)}</select></label>}
            <label className="field">Email<input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
            <label className="field">Phone<input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
            <label className="field">Website<input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} /></label>
            <label className="field">How you help families<textarea value={form.description} onChange={(e) => update('description', e.target.value)} style={{ minHeight: 44, resize: 'vertical' }} /></label>
            {!requiredReady && <div className="info-note">Add business name, service ZIPs, and email to submit.</div>}
            {error && <div className="th-error">{error}</div>}
            {message && <div className="th-confirm">{message}</div>}
            <button disabled={submitting || !requiredReady} className={submitting || !requiredReady ? 'th-btn th-btn-disabled' : 'th-btn th-btn-primary'}>{submitting ? 'Submitting...' : requiredReady ? 'Submit application' : 'Add required info'}</button>
            <a href={calendlyUrl({ name: form.businessName, email: form.email, source: 'Vendor conversation' })} target="_blank" rel="noreferrer" className="th-link-btn">Recommended next action: book a vendor conversation</a>
            <Link href="/funeral-home" className="th-plain-link">Funeral home information</Link>
          </form>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
