import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader } from '../../components/SiteChrome';
import { vendorCategoryLabel } from '../../lib/vendors';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

export default function VendorAdmin() {
  const [token, setToken] = useState('');
  const [vendors, setVendors] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const accessToken = data?.session?.access_token || '';
      setToken(accessToken);
      if (accessToken) load(accessToken);
    });
  }, []);

  async function load(accessToken = token) {
    const res = await fetch('/api/vendors/admin', { headers: { Authorization: 'Bearer ' + accessToken } });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setVendors(json.vendors || []);
    else setMessage(json.error || 'Could not load vendors.');
  }

  async function setStatus(vendorId, status) {
    const res = await fetch('/api/vendors/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ vendorId, status }),
    });
    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? 'Vendor updated.' : json.error || 'Could not update vendor.');
    if (res.ok) load();
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '22px' }}>
        <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Passage admin</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: '8px 0 16px', fontWeight: 400 }}>Vendor applications</h1>
        {message && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 12, padding: 12, marginBottom: 12 }}>{message}</div>}
        <div style={{ display: 'grid', gap: 10 }}>
          {vendors.map((vendor) => (
            <div key={vendor.id} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 21 }}>{vendor.business_name}</div>
                  <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>{vendorCategoryLabel(vendor.category)} - {vendor.contact_email} - {(vendor.zip_codes_served || []).join(', ')}</div>
                  {vendor.short_description && <div style={{ color: C.mid, fontSize: 13, marginTop: 7, lineHeight: 1.5 }}>{vendor.short_description}</div>}
                </div>
                <span style={{ color: vendor.status === 'active' ? C.sage : vendor.status === 'rejected' ? C.rose : C.soft, background: vendor.status === 'rejected' ? C.roseFaint : C.sageFaint, borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 900 }}>{vendor.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {['active', 'inactive', 'rejected'].map((status) => (
                  <button key={status} onClick={() => setStatus(vendor.id, status)} style={{ border: '1px solid ' + C.border, background: status === 'active' ? C.sage : C.card, color: status === 'active' ? '#fff' : C.mid, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{status}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
