import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { money } from '../../lib/vendorEconomics';
import { vendorCategoryLabel } from '../../lib/vendors';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#b07d2e', amberFaint: '#fdf8ee' };
const SYSTEM_ADMIN_EMAILS = ['thepassageappio@gmail.com', 'steventurrisi@gmail.com'];

const demoRequest = {
  status: 'requested',
  task_title: 'Livestream support for Friday service',
  urgency: 'planned',
  requested_at: '2026-05-06T14:20:00Z',
  viewed_at: '2026-05-06T14:24:00Z',
  responded_at: '',
  estimated_value: 450,
  final_value: '',
  platform_fee_amount: 72,
  funeral_home_share_amount: 24,
  passage_share_amount: 48,
  vendors: { business_name: 'Hudson Valley Memorial Media' },
  workflows: { deceased_name: 'Marian Ellis' },
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
}

export default function VendorRequestPage() {
  const router = useRouter();
  const token = String(router.query.token || '');
  const demoQuery = router.query.demo === '1' || router.query.demo === 'true';
  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState('');
  const [vendorProfile, setVendorProfile] = useState(null);
  const [vendorRequests, setVendorRequests] = useState([]);
  const [vendorMessage, setVendorMessage] = useState('');
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [finalValue, setFinalValue] = useState('');
  const [pendingVendorAction, setPendingVendorAction] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setUserToken(data.session?.access_token || '');
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setUserToken(session?.access_token || '');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    load();
  }, [token]);

  useEffect(() => {
    if (!token && (demoQuery || isSystemAdmin(user))) {
      setRequest(demoRequest);
      setEstimatedValue(demoRequest.estimated_value || '');
      setFinalValue('');
      setError('');
      setLoading(false);
    }
  }, [token, user, demoQuery]);

  useEffect(() => {
    if (!token && user && !isSystemAdmin(user) && userToken) {
      loadVendorProfile(userToken);
    }
  }, [token, user, userToken]);

  async function load() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/vendorRequests/portal?token=' + encodeURIComponent(token));
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'Could not load this request.');
      return;
    }
    setRequest(json.request);
    setEstimatedValue(json.request?.estimated_value || '');
    setFinalValue(json.request?.final_value || '');
  }

  async function loadVendorProfile(accessToken = userToken) {
    setLoading(true);
    setError('');
    setVendorMessage('');
    try {
      const res = await fetch('/api/vendors/me', { headers: { Authorization: 'Bearer ' + accessToken } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not load your vendor profile.');
        return;
      }
      setVendorProfile(json.vendor || null);
      setVendorRequests(json.requests || []);
      setVendorMessage(json.message || '');
    } catch (err) {
      setError(err?.message || 'Could not load your vendor profile.');
    } finally {
      setLoading(false);
    }
  }

  async function update(action) {
    if (!token) {
      const next = applyVendorRequestTransition(request, action, { estimatedValue, finalValue });
      setRequest(next);
      setNotice(noticeForAction(action, true));
      setPendingVendorAction('');
      return;
    }
    setUpdating(action);
    setError('');
    setNotice('');
    const res = await fetch('/api/vendorRequests/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action, estimatedValue, finalValue }),
    });
    const json = await res.json().catch(() => ({}));
    setUpdating('');
    if (!res.ok) {
      setError(json.error || 'Could not update this request.');
      return;
    }
    setRequest(json.request);
    setNotice(noticeForAction(action, false));
    setPendingVendorAction('');
  }

  const familyName = request?.workflows?.deceased_name || request?.workflows?.estate_name || request?.workflows?.name || 'Family case';
  const vendorName = request?.vendors?.business_name || 'Vendor';
  const demoMode = !token && (demoQuery || isSystemAdmin(user));
  const requestStatus = labelForStatus(request?.status);
  const urgencyLabel = request?.urgency === 'rush' ? 'Needed within 24 hours' : 'Planning ahead';
  const nextExpected = request?.status === 'completed'
    ? 'Completed. Passage will show the family and funeral home this request is handled.'
    : request?.status === 'in_progress'
      ? 'In progress. Update again when the service is completed or if details are missing.'
      : request?.status === 'accepted'
        ? 'Accepted. The family and funeral home can see you are working on it.'
        : request?.status === 'declined'
          ? 'Declined. Passage will keep the request visible so another option can be found.'
        : 'Waiting for your response. Accept, ask for details, or decline if you cannot help.';
  const ownerLabel = request?.status === 'requested'
    ? vendorName
    : request?.status === 'declined'
      ? 'Passage coordinator'
      : vendorName;
  const waitingLabel = request?.status === 'completed'
    ? 'Nothing. Proof is saved.'
    : request?.status === 'declined'
      ? 'Another support option'
      : request?.status === 'accepted' || request?.status === 'in_progress'
        ? 'Completion update from vendor'
        : 'Vendor response';
  const proofLabel = request?.status === 'completed'
    ? 'Completion timestamp and value stay on the request.'
    : request?.status === 'declined'
      ? 'Decline reason/status stays visible for replacement.'
      : 'Viewed/responded timestamps and status changes report back to the case.';

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} />
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
        {loading && <div style={cardStyle}>Loading request...</div>}
        {error && <div style={{ ...cardStyle, background: C.roseFaint, color: C.rose, borderColor: C.rose + '44' }}>{error}</div>}
        {!loading && !token && !demoMode && (
          vendorProfile ? (
            <VendorDashboard vendor={vendorProfile} requests={vendorRequests} />
          ) : (
            <div style={cardStyle}>
              <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor portal</div>
              <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1.05, fontWeight: 400, margin: '10px 0' }}>{user ? 'No approved vendor profile yet.' : 'Sign in to manage vendor requests.'}</h1>
              <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65 }}>{vendorMessage || 'Vendors apply first, Passage system admin approves them, then the approved contact email can sign in here to manage the business and respond to task-native requests.'}</p>
              {!user && <button onClick={() => supabase?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } })} style={buttonStyle(C.sage)}>Sign in</button>}
            </div>
          )
        )}
        {!loading && request && (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 22, borderBottom: '1px solid ' + C.border, background: C.card }}>
              <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>{demoMode ? 'Demo scoped vendor request' : 'Scoped local support request'}</div>
              <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', lineHeight: 1.06, fontWeight: 400, margin: '10px 0' }}>{request.task_title || 'Local help request'}</h1>
              <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.65, margin: 0 }}>{demoMode ? 'Demo request. Button clicks update local screen state only.' : 'One scoped request connected to the family record.'}</p>
              <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: '10px 11px', color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 12 }}>
                <strong style={{ color: C.ink }}>Urgency:</strong> {urgencyLabel}. <strong style={{ color: C.ink }}>After accepting:</strong> the family and funeral home see the request status on the same coordination spine.
              </div>
            </div>
            {demoMode && (
              <div style={{ background: C.amberFaint, border: '1px solid #ead4ac', color: C.amber, borderRadius: 12, padding: 10, margin: '14px 22px 0', fontWeight: 800, fontSize: 13.5, lineHeight: 1.45 }}>
                Demo mode. No live messages, payments, or production request records are changed.
              </div>
            )}

            <div style={{ padding: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(220px, .8fr)', gap: 12, marginBottom: 14 }}>
              <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 15 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>What is needed now</div>
                <div style={{ color: C.ink, fontSize: 19, fontWeight: 900, lineHeight: 1.25 }}>{vendorName}</div>
                <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, marginTop: 6 }}>Respond for {familyName}. Status stays tied to this request.</div>
                <div style={{ background: C.card, borderLeft: '4px solid ' + (request?.status === 'declined' ? C.rose : request?.status === 'sent' ? C.amber : C.sage), borderRadius: 11, padding: '9px 10px', marginTop: 10, color: C.mid, fontSize: 12.5, lineHeight: 1.45 }}>
                  <strong style={{ color: C.ink }}>Next expected update:</strong> {nextExpected}
                </div>
              </div>
              <div style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 16, padding: 14 }}>
                <Info label="Family case" value={familyName} />
                <div style={{ height: 8 }} />
                <Info label="Urgency" value={urgencyLabel} />
                <div style={{ height: 8 }} />
                <Info label="Status" value={requestStatus} />
              </div>
            </div>

            <VendorRequestLoop
              next={request?.status === 'requested' ? 'Respond to the scoped request.' : nextExpected}
              owner={ownerLabel}
              waiting={waitingLabel}
              proof={proofLabel}
            />

            <details style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <summary style={{ cursor: 'pointer', color: C.sage, fontSize: 13, fontWeight: 900 }}>Status and proof trail</summary>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Pill label="Sent" time={request.requested_at} />
                {request.viewed_at && <Pill label="Viewed" time={request.viewed_at} />}
                {request.responded_at && (
                  <Pill
                    label={request.status === 'declined' ? 'Declined' : 'Accepted'}
                    time={request.responded_at}
                  />
                )}
                {request.in_progress_at && <Pill label="In progress" time={request.in_progress_at} />}
                {request.completed_at && <Pill label="Completed" time={request.completed_at} />}
              </div>
            </details>

            {notice && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 12, padding: 10, marginBottom: 10, fontWeight: 800 }}>{notice}</div>}
            {demoMode && request.local_demo_action_at && (
              <div style={{ color: C.mid, fontSize: 12.5, margin: '-2px 0 10px' }}>
                Last local demo action: {new Date(request.local_demo_action_at).toLocaleString()}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setPendingVendorAction('accepted')} disabled={!!updating} style={buttonStyle(C.sage)}>Accept request</button>
              <button onClick={() => setPendingVendorAction('in_progress')} disabled={!!updating} style={buttonStyle(C.amber)}>Mark in progress</button>
              <button onClick={() => setPendingVendorAction('completed')} disabled={!!updating} style={buttonStyle(C.sage)}>Mark completed</button>
              <button onClick={() => setPendingVendorAction('declined')} disabled={!!updating} style={{ ...buttonStyle('#fff'), color: C.rose, border: '1px solid ' + C.rose + '55' }}>Decline</button>
            </div>
            {pendingVendorAction && (
              <div onClick={() => setPendingVendorAction('')} style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                <div role="dialog" aria-modal="true" onClick={event => event.stopPropagation()} style={{ width: 'min(640px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor response</div>
                      <div style={{ color: C.ink, fontSize: 23, lineHeight: 1.15, fontWeight: 900, marginTop: 4 }}>{labelForStatus(pendingVendorAction)}</div>
                    </div>
                    <button onClick={() => setPendingVendorAction('')} aria-label="Close vendor response" style={{ border: '1px solid ' + C.border, background: C.card, color: C.mid, borderRadius: 999, width: 34, height: 34, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
                  </div>
                  <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, margin: '12px 0' }}>This response stays connected to the family case and task. Record value only when it helps the funeral home and family understand the request; keep it supportive, not salesy.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                    <label style={labelStyle}>Estimated value<input value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="250" style={inputStyle} /></label>
                    <label style={labelStyle}>Final value<input value={finalValue} onChange={(e) => setFinalValue(e.target.value)} placeholder="250" style={inputStyle} /></label>
                  </div>
                  {(request.platform_fee_amount || request.funeral_home_share_amount || request.passage_share_amount) && (
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9, fontSize: 12.5, color: C.mid }}>
                      {request.platform_fee_amount && <span>Tracked platform fee: <strong>{money(request.platform_fee_amount)}</strong></span>}
                      {request.funeral_home_share_amount && <span>Funeral home share: <strong>{money(request.funeral_home_share_amount)}</strong></span>}
                      {request.passage_share_amount && <span>Passage share: <strong>{money(request.passage_share_amount)}</strong></span>}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                    <button onClick={() => update(pendingVendorAction)} disabled={!!updating} style={buttonStyle(pendingVendorAction === 'declined' ? C.rose : C.sage)}>{updating ? 'Updating...' : 'Save response'}</button>
                    <button onClick={() => setPendingVendorAction('')} style={{ ...buttonStyle('#fff'), color: C.mid, border: '1px solid ' + C.border }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function applyVendorRequestTransition(current, action, values = {}) {
  const now = new Date().toISOString();
  const status = ['completed', 'in_progress', 'declined'].includes(action) ? action : 'accepted';
  const next = {
    ...current,
    status,
    viewed_at: current?.viewed_at || now,
    estimated_value: values.estimatedValue,
    final_value: values.finalValue,
  };
  if (status === 'accepted') {
    next.responded_at = now;
    next.in_progress_at = null;
    next.completed_at = null;
  }
  if (status === 'in_progress') {
    next.responded_at = current?.status === 'declined' ? now : current?.responded_at || now;
    next.in_progress_at = now;
    next.completed_at = null;
  }
  if (status === 'completed') {
    next.responded_at = current?.status === 'declined' ? now : current?.responded_at || now;
    next.in_progress_at = current?.status === 'declined' ? now : current?.in_progress_at || now;
    next.completed_at = now;
  }
  if (status === 'declined') {
    next.responded_at = now;
    next.in_progress_at = null;
    next.completed_at = null;
    next.final_value = '';
  }
  next.local_demo_action_at = now;
  return next;
}

function noticeForAction(action, demo) {
  const prefix = demo ? 'Demo update saved locally. ' : '';
  if (action === 'completed') return prefix + 'Marked completed. Passage will show the family and funeral home that this is handled.';
  if (action === 'in_progress') return prefix + 'Marked in progress. Passage will keep this visible while the vendor works.';
  if (action === 'declined') return prefix + 'Marked declined. Passage will show that this request needs another option.';
  return prefix + 'Request accepted. The family and funeral home will be notified that you are working on it.';
}

function VendorDashboard({ vendor, requests }) {
  const openRequests = requests.filter((item) => !['completed', 'declined'].includes(item.status));
  const primaryRequest = openRequests[0] || requests[0];
  return (
    <div style={cardStyle}>
      <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Approved vendor portal</div>
      <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', lineHeight: 1.05, fontWeight: 400, margin: '10px 0' }}>{vendor.business_name}</h1>
      <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65 }}>Your business is approved. Requests from families or funeral homes appear here when Passage recommends you inside a task.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, margin: '16px 0' }}>
        <Info label="Category" value={vendorCategoryLabel(vendor.category)} />
        <Info label="Open requests" value={openRequests.length} />
        <Info label="Service area" value={(vendor.zip_codes_served || []).join(', ') || 'Not set'} />
      </div>

      {primaryRequest && (
        <a href={`/vendors/request?token=${primaryRequest.response_token}`} style={{ display: 'block', background: C.sageFaint, border: '1px solid #c8deca', borderLeft: `5px solid ${C.sage}`, borderRadius: 14, padding: 13, color: C.ink, textDecoration: 'none', marginBottom: 12 }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Next request</div>
          <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2, marginTop: 5 }}>{primaryRequest.task_title || 'Local help request'}</div>
          <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 5 }}>{primaryRequest.workflows?.deceased_name || primaryRequest.workflows?.estate_name || primaryRequest.workflows?.name || 'Family case'} - {primaryRequest.urgency === 'rush' ? 'Needed within 24 hours' : 'Planning ahead'}</div>
        </a>
      )}

      <details style={{ border: '1px solid ' + C.border, borderRadius: 14, padding: 13 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 900, fontSize: 18 }}>Incoming requests ({requests.length})</summary>
        <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
          {!requests.length && <div style={{ color: C.mid }}>No requests yet. When one arrives, you can view it, quote it, accept it, or mark it completed from here.</div>}
          {requests.map((request) => {
            const familyName = request.workflows?.deceased_name || request.workflows?.estate_name || request.workflows?.name || 'Family case';
            return (
              <a key={request.id} href={`/vendors/request?token=${request.response_token}`} style={{ display: 'grid', gap: 6, background: C.bg, border: '1px solid ' + C.border, borderRadius: 13, padding: 12, color: C.ink, textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <strong>{request.task_title || 'Local help request'}</strong>
                  <span style={{ color: C.sage, background: C.sageFaint, borderRadius: 999, padding: '4px 8px', fontSize: 12, fontWeight: 900 }}>{labelForStatus(request.status)}</span>
                </div>
                <div style={{ color: C.mid, fontSize: 13 }}>{familyName} - {request.urgency === 'rush' ? 'Rush' : 'Planned'} - {new Date(request.requested_at).toLocaleString()}</div>
              </a>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 12, padding: 11 }}>
      <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 15, marginTop: 4 }}>{value || 'Not provided'}</div>
    </div>
  );
}

function VendorRequestLoop({ next, owner, waiting, proof }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, margin: '0 0 14px' }}>
      <Info label="What happens now" value={next} />
      <Info label="Who owns it" value={owner} />
      <Info label="Waiting on" value={waiting} />
      <Info label="Proof / reporting" value={proof} />
    </div>
  );
}

function Pill({ label, time }) {
  return <span style={{ background: C.card, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 }}>{label}{time ? ` - ${new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</span>;
}

function labelForStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'in_progress') return 'In progress';
  if (status === 'accepted') return 'Accepted';
  if (status === 'declined') return 'Declined';
  return 'Waiting for response';
}

function buttonStyle(background) {
  return { border: background === '#fff' ? '1px solid ' + C.border : 'none', background, color: background === '#fff' ? C.ink : '#fff', borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
}

const cardStyle = { background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 24 };
const labelStyle = { display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.12em' };
const inputStyle = { border: '1px solid ' + C.border, borderRadius: 11, background: C.card, padding: '10px 11px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink };
