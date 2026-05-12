import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { vendorCategoryLabel } from '../../lib/vendors';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com', 'thepassageappio@gmail.com'];

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(String(user?.email || '').trim().toLowerCase());
}

export default function VendorAdmin() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [vendors, setVendors] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError('Vendor admin needs Supabase public environment variables before it can load applications.');
      return undefined;
    }
    let alive = true;
    const slowTimer = setTimeout(() => {
      if (alive) setMessage('Still checking your system-admin session. If this stays here, refresh or sign in again.');
    }, 5000);
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      clearTimeout(slowTimer);
      setUser(data?.session?.user || null);
      const accessToken = data?.session?.access_token || '';
      setToken(accessToken);
      if (accessToken && isSystemAdmin(data?.session?.user)) load(accessToken);
      else setLoading(false);
    }).catch((err) => {
      if (!alive) return;
      clearTimeout(slowTimer);
      setLoading(false);
      setError(err?.message || 'Could not check your admin session.');
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token || '';
      setUser(session?.user || null);
      setToken(accessToken);
      if (accessToken && isSystemAdmin(session?.user)) load(accessToken);
      else {
        setVendors([]);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      clearTimeout(slowTimer);
      data.subscription.unsubscribe();
    };
  }, []);

  async function load(accessToken = token) {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/vendors/admin', { headers: { Authorization: 'Bearer ' + accessToken } });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setVendors(json.vendors || []);
      } else {
        setError(json.error || 'Could not load vendor applications.');
      }
    } catch (err) {
      setError(err?.message || 'Could not reach vendor admin.');
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(vendorId, status) {
    if (!token) {
      setError('Please sign in before reviewing vendor applications.');
      return;
    }
    setUpdating(vendorId + ':' + status);
    setError('');
    setMessage('');
    const res = await fetch('/api/vendors/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ vendorId, status }),
    });
    const json = await res.json().catch(() => ({}));
    const vendor = json.vendor || vendors.find((item) => item.id === vendorId);
    setUpdating('');
    setMessage(res.ok ? statusMessage(status, vendor) : '');
    if (!res.ok) setError(json.error || 'Could not update vendor.');
    if (res.ok) load();
  }

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setVendors([]);
  }

  const counts = useMemo(() => ({
    all: vendors.length,
    pending: vendors.filter((vendor) => vendor.status === 'pending').length,
    active: vendors.filter((vendor) => vendor.status === 'active').length,
    inactive: vendors.filter((vendor) => vendor.status === 'inactive').length,
    rejected: vendors.filter((vendor) => vendor.status === 'rejected').length,
  }), [vendors]);
  const visibleVendors = filter === 'all' ? vendors : vendors.filter((vendor) => vendor.status === filter);
  const admin = isSystemAdmin(user);

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignIn={user ? null : signIn} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '22px' }}>
        <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Passage admin</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: '8px 0 16px', fontWeight: 400 }}>Vendor applications</h1>
        <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.6, maxWidth: 720, marginTop: -4 }}>Review trusted local support partners before they appear inside family tasks. Approval makes the vendor active; the vendor signs in with the application email to manage requests from the vendor page.</p>

        <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, margin: '18px 0', display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Admin status</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{loading ? 'Checking access...' : admin ? 'Signed in as system admin' : 'System admin sign-in required'}</div>
            <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 3 }}>{user ? user.email : 'Only Passage system admins can approve vendors before they appear in task recommendations.'}</div>
          </div>
          <button onClick={() => token && admin ? load(token) : signIn()} style={primaryButton}>{token && admin ? 'Refresh applications' : 'Sign in to review'}</button>
        </div>

        <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 16, margin: '18px 0', display: 'grid', gap: 12 }}>
          <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Approval path</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            {[
              ['1', 'Vendor applies', 'Business, category, ZIPs, email, and phone are captured.'],
              ['2', 'System admin reviews', 'Only Passage system admins can approve, pause, or reject.'],
              ['3', 'Vendor signs in', 'Their contact email becomes the business login identity.'],
              ['4', 'Task-native requests', 'Families see vendors only inside relevant tasks.'],
            ].map(([number, title, body]) => (
              <div key={title} style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 12 }}>
                <div style={{ color: C.sage, fontSize: 11, fontWeight: 900 }}>{number}</div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>{title}</div>
                <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        {message && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 12, padding: 12, marginBottom: 12 }}>{message}</div>}
        {error && <div style={{ background: C.roseFaint, border: '1px solid ' + C.rose + '55', color: C.rose, borderRadius: 12, padding: 12, marginBottom: 12 }}>{error}</div>}

        {!user && !loading && (
          <div style={emptyStyle}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>Sign in as a Passage system admin.</div>
            <p style={{ color: C.mid, lineHeight: 1.6, marginTop: 0 }}>Vendor approvals are restricted because approving a vendor controls who families may see inside tasks.</p>
            <button onClick={signIn} style={primaryButton}>Sign in with Google</button>
          </div>
        )}

        {user && !admin && !loading && (
          <div style={emptyStyle}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>This vendor approval area is not available for this account.</div>
            <p style={{ color: C.mid, lineHeight: 1.6, marginTop: 0 }}>Vendor approval is restricted to Passage system admins.</p>
          </div>
        )}

        {user && admin && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              ['pending', `Pending (${counts.pending})`],
              ['active', `Approved (${counts.active})`],
              ['inactive', `Paused (${counts.inactive})`],
              ['rejected', `Rejected (${counts.rejected})`],
              ['all', `All (${counts.all})`],
            ].map(([value, label]) => (
              <button key={value} onClick={() => setFilter(value)} style={{ border: '1px solid ' + (filter === value ? C.sage : C.border), background: filter === value ? C.sage : C.card, color: filter === value ? '#fff' : C.mid, borderRadius: 999, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
        )}

        {loading && <div style={emptyStyle}>Loading vendor applications...</div>}

        {user && admin && !loading && vendors.length === 0 && (
          <div style={emptyStyle}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>No vendor applications yet.</div>
            <p style={{ color: C.mid, lineHeight: 1.6, marginTop: 0 }}>When a vendor submits the support partner form, it will appear here for system-admin approval.</p>
            <Link href="/vendors/onboard" style={{ ...primaryButton, display: 'inline-flex', textDecoration: 'none' }}>Open vendor application form</Link>
          </div>
        )}

        {user && admin && !loading && vendors.length > 0 && visibleVendors.length === 0 && (
          <div style={emptyStyle}>No {filter} vendors right now.</div>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {admin && visibleVendors.map((vendor) => (
            <div key={vendor.id} style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 21 }}>{vendor.business_name}</div>
                  <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>{vendorCategoryLabel(vendor.category)} - {vendor.contact_email || 'no email yet'} - {(vendor.zip_codes_served || []).join(', ') || 'no ZIPs yet'}</div>
                  <div style={{ color: C.soft, fontSize: 12.5, marginTop: 5 }}>{vendor.contact_phone || 'No phone'}{vendor.website ? ` - ${vendor.website}` : ''}</div>
                  {vendor.short_description && <div style={{ color: C.mid, fontSize: 13, marginTop: 7, lineHeight: 1.5 }}>{vendor.short_description}</div>}
                </div>
                <span style={{ color: vendor.status === 'active' ? C.sage : vendor.status === 'rejected' ? C.rose : C.soft, background: vendor.status === 'rejected' ? C.roseFaint : C.sageFaint, borderRadius: 999, padding: '5px 9px', fontSize: 12, fontWeight: 900 }}>{vendor.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
                <div style={{ color: C.mid, fontSize: 13 }}>Availability: {vendor.rush_supported ? `rush${vendor.rush_window_hours ? ` (${vendor.rush_window_hours}h)` : ''}` : 'planned'}{vendor.planned_supported ? ' + planned' : ''}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button disabled={updating === vendor.id + ':active'} onClick={() => setStatus(vendor.id, 'active')} style={{ ...smallButton, background: C.sage, color: '#fff', borderColor: C.sage }}>{updating === vendor.id + ':active' ? 'Approving...' : 'Approve vendor'}</button>
                  <button disabled={updating === vendor.id + ':inactive'} onClick={() => setStatus(vendor.id, 'inactive')} style={smallButton}>{updating === vendor.id + ':inactive' ? 'Pausing...' : 'Pause'}</button>
                  <button disabled={updating === vendor.id + ':rejected'} onClick={() => setStatus(vendor.id, 'rejected')} style={{ ...smallButton, color: C.rose }}>{updating === vendor.id + ':rejected' ? 'Rejecting...' : 'Reject'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function statusMessage(status, vendor) {
  const email = vendor?.contact_email;
  if (status === 'active') {
    return email
      ? `Vendor approved. Passage sent ${email} a vendor workspace link. They can also open /vendors/accept with this email.`
      : 'Vendor approved. Add a contact email so they can sign in and manage their vendor page.';
  }
  if (status === 'inactive') return 'Vendor paused. They will not be recommended inside tasks while paused.';
  if (status === 'rejected') return 'Vendor rejected. They will not appear in family tasks.';
  return 'Vendor updated.';
}

const emptyStyle = { background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, color: C.ink, marginBottom: 14 };
const primaryButton = { border: 'none', background: C.sage, color: '#fff', borderRadius: 12, padding: '12px 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
const smallButton = { border: '1px solid ' + C.border, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
