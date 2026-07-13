import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { vendorCategoryLabel } from '../../lib/vendors';

const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

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
  const [connectDrafts, setConnectDrafts] = useState({});

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
    const draft = connectDrafts[vendorId] || {};
    const res = await fetch('/api/vendors/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        vendorId,
        status,
        stripeConnectAccountId: draft.stripeConnectAccountId,
        marketplaceFeePercent: draft.marketplaceFeePercent || 12,
        stripeChargesEnabled: !!draft.stripeConnectAccountId,
        stripePayoutsEnabled: !!draft.stripePayoutsEnabled,
      }),
    });
    const json = await res.json().catch(() => ({}));
    const vendor = json.vendor || vendors.find((item) => item.id === vendorId);
    setUpdating('');
    setMessage(res.ok ? statusMessage(status, vendor) : '');
    if (!res.ok) setError(json.error || 'Could not update vendor.');
    if (res.ok) load();
  }

  function updateConnectDraft(vendorId, key, value) {
    setConnectDrafts(prev => ({ ...prev, [vendorId]: { ...prev[vendorId], [key]: value } }));
  }

  async function signIn() {
    if (!supabase || typeof window === 'undefined') return;
    window.location.assign('/auth/google?next=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash));
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
        .eyebrow { color: var(--clay-600); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
        h1 {
          font-family: 'Fraunces', serif; font-weight: 440; font-size: clamp(28px, 4vw, 40px);
          line-height: 1.06; letter-spacing: -.018em; color: var(--pine-950); margin: 10px 0 14px;
        }
        p.lede { color: var(--ink-500); font-size: 14.5px; line-height: 1.58; max-width: 720px; margin-top: -4px; }
        .status-panel {
          background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 18px;
          margin: 16px 0; display: flex; justify-content: space-between; gap: 14px; align-items: center; flex-wrap: wrap;
          box-shadow: var(--e2);
        }
        .status-title { font-size: 17px; font-weight: 600; margin-top: 4px; color: var(--ink-900); }
        .status-sub { color: var(--ink-500); font-size: 13px; line-height: 1.45; margin-top: 3px; }
        .path-panel { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 18px; margin: 16px 0; box-shadow: var(--e1); }
        .path-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; margin-top: 10px; }
        .path-card { background: var(--pine-50); border: 1px solid #D5E4DC; border-radius: var(--r-md); padding: 12px; }
        .path-num { color: var(--pine-700); font-size: 11px; font-weight: 700; }
        .path-title { font-size: 15px; font-weight: 600; margin-top: 4px; color: var(--ink-900); }
        .path-body { color: var(--ink-500); font-size: 12.5px; line-height: 1.45; margin-top: 4px; }
        .th-confirm { background: var(--pine-50); border: 1px solid #D5E4DC; color: var(--pine-700); border-radius: var(--r-sm); padding: 12px; margin-bottom: 12px; font-size: 13px; }
        .th-error { background: var(--clay-50); border: 1px solid var(--clay-200); color: var(--clay-700); border-radius: var(--r-sm); padding: 12px; margin-bottom: 12px; font-size: 13px; }
        .empty-panel { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-lg); padding: 20px; color: var(--ink-900); margin-bottom: 14px; box-shadow: var(--e1); }
        .empty-title { font-size: 21px; margin-bottom: 6px; font-weight: 600; }
        .empty-body { color: var(--ink-500); line-height: 1.55; margin-top: 0; font-size: 14px; }
        .th-btn { border: none; border-radius: var(--r-full); padding: 12px 16px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13.5px; cursor: pointer; transition: transform .18s var(--ease); text-decoration: none; display: inline-flex; }
        .th-btn:hover { transform: translateY(-1px); }
        .th-btn-primary { background: linear-gradient(155deg, var(--pine-600), var(--pine-800)); color: #fff; box-shadow: 0 1px 2px rgba(15,42,36,.15), 0 8px 16px -6px rgba(15,42,36,.35); }
        .filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
        .filter-btn {
          border: 1px solid var(--line); background: var(--bone-50); color: var(--ink-500);
          border-radius: var(--r-full); padding: 9px 13px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 12.5px; cursor: pointer;
        }
        .filter-btn.active { border-color: var(--pine-600); background: var(--pine-600); color: #fff; }
        .vendor-list { display: grid; gap: 10px; }
        .vendor-card { background: var(--bone-50); border: 1px solid var(--line-soft); border-radius: var(--r-md); padding: 16px; box-shadow: var(--e1); }
        .vendor-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
        .vendor-name { font-size: 19px; font-weight: 600; color: var(--ink-900); }
        .vendor-meta { color: var(--ink-500); font-size: 13px; margin-top: 3px; }
        .vendor-contact { color: var(--ink-500); font-size: 12.5px; margin-top: 5px; opacity: .85; }
        .vendor-desc { color: var(--ink-500); font-size: 13px; margin-top: 7px; line-height: 1.5; }
        .connect-row { display: grid; grid-template-columns: minmax(220px,1fr) 130px 150px; gap: 8px; margin-top: 10px; max-width: 620px; }
        .connect-row input[type='text'], .connect-row input:not([type]) {
          border: 1px solid var(--line); background: var(--bone-100); color: var(--ink-900);
          border-radius: var(--r-sm); padding: 8px 9px; font-family: 'Inter', sans-serif; font-size: 12.5px; min-width: 0;
        }
        .status-pill {
          border-radius: var(--r-full); padding: 5px 10px; font-size: 12px; font-weight: 700;
        }
        .status-pill.active { color: var(--pine-700); background: var(--pine-50); }
        .status-pill.rejected { color: var(--clay-700); background: var(--clay-50); }
        .status-pill.other { color: var(--ink-500); background: var(--bone-100); }
        .vendor-bottom { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 12px; }
        .vendor-avail { color: var(--ink-500); font-size: 12.5px; }
        .action-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .small-btn {
          border: 1px solid var(--line); background: var(--bone-50); color: var(--ink-500);
          border-radius: var(--r-full); padding: 8px 11px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 12px; cursor: pointer;
        }
        .small-btn.approve { background: var(--pine-600); color: #fff; border-color: var(--pine-600); }
        .small-btn.reject { color: var(--clay-700); }

        @media (max-width: 780px) {
          .wrap { padding: 18px 16px 40px; }
          .path-grid { grid-template-columns: 1fr 1fr; }
          .connect-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <SiteHeader user={user} onSignIn={user ? null : signIn} onSignOut={user ? signOut : null} />
      <section className="wrap">
        <span className="eyebrow">Passage admin</span>
        <h1>Vendor applications</h1>
        <p className="lede">Review trusted local support partners before they appear inside family requests. Approval makes the vendor active; the vendor signs in with the application email to manage requests from the vendor page.</p>

        <div className="status-panel">
          <div>
            <span className="eyebrow">Admin status</span>
            <div className="status-title">{loading ? 'Checking access...' : admin ? 'Signed in as system admin' : 'System admin sign-in required'}</div>
            <div className="status-sub">{user ? user.email : 'Only Passage system admins can approve vendors before they appear in task recommendations.'}</div>
          </div>
          <button onClick={() => token && admin ? load(token) : signIn()} className="th-btn th-btn-primary">{token && admin ? 'Refresh applications' : 'Sign in to review'}</button>
        </div>

        <div className="path-panel">
          <span className="eyebrow">Approval path</span>
          <div className="path-grid">
            {[
              ['1', 'Vendor applies', 'Business, category, ZIPs, email, and phone are captured.'],
              ['2', 'System admin reviews', 'Only Passage system admins can approve, pause, or reject.'],
              ['3', 'Vendor signs in', 'Their contact email becomes the business login identity.'],
              ['4', 'Task-native requests', 'Families see vendors only inside relevant tasks.'],
            ].map(([number, title, body]) => (
              <div key={title} className="path-card">
                <div className="path-num">{number}</div>
                <div className="path-title">{title}</div>
                <div className="path-body">{body}</div>
              </div>
            ))}
          </div>
        </div>

        {message && <div className="th-confirm">{message}</div>}
        {error && <div className="th-error">{error}</div>}

        {!user && !loading && (
          <div className="empty-panel">
            <div className="empty-title">Sign in as a Passage system admin.</div>
            <p className="empty-body">Vendor approvals are restricted because approving a vendor controls who families may see inside tasks.</p>
            <button onClick={signIn} className="th-btn th-btn-primary">Sign in with Google</button>
          </div>
        )}

        {user && !admin && !loading && (
          <div className="empty-panel">
            <div className="empty-title">This vendor approval area is not available for this account.</div>
            <p className="empty-body">Vendor approval is restricted to Passage system admins.</p>
          </div>
        )}

        {user && admin && (
          <div className="filter-row">
            {[
              ['pending', `Pending (${counts.pending})`],
              ['active', `Approved (${counts.active})`],
              ['inactive', `Paused (${counts.inactive})`],
              ['rejected', `Rejected (${counts.rejected})`],
              ['all', `All (${counts.all})`],
            ].map(([value, label]) => (
              <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'filter-btn active' : 'filter-btn'}>{label}</button>
            ))}
          </div>
        )}

        {loading && <div className="empty-panel">Loading vendor applications...</div>}

        {user && admin && !loading && vendors.length === 0 && (
          <div className="empty-panel">
            <div className="empty-title">No vendor applications yet.</div>
            <p className="empty-body">When a vendor submits the support partner form, it will appear here for system-admin approval.</p>
            <Link href="/vendors/onboard" className="th-btn th-btn-primary">Open vendor application form</Link>
          </div>
        )}

        {user && admin && !loading && vendors.length > 0 && visibleVendors.length === 0 && (
          <div className="empty-panel">No {filter} vendors right now.</div>
        )}

        <div className="vendor-list">
          {admin && visibleVendors.map((vendor) => (
            <div key={vendor.id} className="vendor-card">
              <div className="vendor-top">
                <div>
                  <div className="vendor-name">{vendor.business_name}</div>
                  <div className="vendor-meta">{vendorCategoryLabel(vendor.category)} - {vendor.contact_email || 'no email yet'} - {(vendor.zip_codes_served || []).join(', ') || 'no ZIPs yet'}</div>
                  <div className="vendor-contact">{vendor.contact_phone || 'No phone'}{vendor.website ? ` - ${vendor.website}` : ''}</div>
                  {vendor.short_description && <div className="vendor-desc">{vendor.short_description}</div>}
                  <div className="connect-row">
                    <input
                      value={connectDrafts[vendor.id]?.stripeConnectAccountId ?? vendor.stripe_connect_account_id ?? ''}
                      onChange={(event) => updateConnectDraft(vendor.id, 'stripeConnectAccountId', event.target.value)}
                      placeholder="Stripe connected account ID, acct_..."
                    />
                    <input
                      value={connectDrafts[vendor.id]?.marketplaceFeePercent ?? vendor.marketplace_fee_percent ?? 12}
                      onChange={(event) => updateConnectDraft(vendor.id, 'marketplaceFeePercent', event.target.value)}
                      type="number"
                      min="0"
                      max="40"
                      step="0.1"
                      placeholder="Fee %"
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-500)', fontSize: 12.5, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(connectDrafts[vendor.id]?.stripePayoutsEnabled ?? vendor.stripe_payouts_enabled)}
                        onChange={(event) => updateConnectDraft(vendor.id, 'stripePayoutsEnabled', event.target.checked)}
                      />
                      Payouts ready
                    </label>
                  </div>
                </div>
                <span className={`status-pill ${vendor.status === 'active' ? 'active' : vendor.status === 'rejected' ? 'rejected' : 'other'}`}>{vendor.status}</span>
              </div>
              <div className="vendor-bottom">
                <div className="vendor-avail">Availability: {vendor.rush_supported ? `rush${vendor.rush_window_hours ? ` (${vendor.rush_window_hours}h)` : ''}` : 'planned'}{vendor.planned_supported ? ' + planned' : ''} — Payment: {vendor.stripe_connect_account_id ? 'Connect linked' : 'Connect needed'} — Fee {vendor.marketplace_fee_percent ?? 12}%</div>
                <div className="action-row">
                  <button disabled={updating === vendor.id + ':active'} onClick={() => setStatus(vendor.id, 'active')} className="small-btn approve">{updating === vendor.id + ':active' ? 'Approving...' : 'Approve vendor'}</button>
                  <button disabled={updating === vendor.id + ':inactive'} onClick={() => setStatus(vendor.id, 'inactive')} className="small-btn">{updating === vendor.id + ':inactive' ? 'Pausing...' : 'Pause'}</button>
                  <button disabled={updating === vendor.id + ':rejected'} onClick={() => setStatus(vendor.id, 'rejected')} className="small-btn reject">{updating === vendor.id + ':rejected' ? 'Rejecting...' : 'Reject'}</button>
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
  if (status === 'rejected') return 'Vendor rejected. They will not appear in family requests.';
  return 'Vendor updated.';
}
