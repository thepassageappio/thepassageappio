import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseBrowser';
import { SiteFooter, SiteHeader, SpineTrustStrip } from '../../components/SiteChrome';
import { money } from '../../lib/vendorEconomics';
import { vendorCategoryLabel } from '../../lib/vendors';
import { paymentStatusLabel, vendorNextExpected, vendorStatusLabel } from '../../lib/vendorLifecycle';

const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#b07d2e', amberFaint: '#fdf8ee' };
const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

const demoRequest = {
  status: 'requested',
  task_title: 'Livestream support for Friday service',
  urgency: 'planned',
  requested_at: '2026-05-06T14:20:00Z',
  request_note: 'Family needs livestream coverage for the Friday service. Please quote setup, service coverage, and recording delivery.',
  viewed_at: '2026-05-06T14:24:00Z',
  responded_at: '',
  estimated_value: 450,
  final_value: '',
  vendor_note: '',
  service_date: '2026-05-15',
  service_start_at: '2026-05-15T14:00:00Z',
  service_location: 'Hudson Valley Funeral Group, Main Chapel',
  family_contact_name: 'Michael Price',
  family_contact_phone: '845-555-0137',
  payment_collection_status: 'quote_needed',
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
  const [vendorNote, setVendorNote] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceStartAt, setServiceStartAt] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
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
    if (!token && demoQuery) {
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

  useEffect(() => {
    if (!pendingVendorAction || typeof window === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    function handleKeyDown(event) {
      if (event.key === 'Escape') setPendingVendorAction('');
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingVendorAction]);

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
    setVendorNote(json.request?.vendor_note || '');
    setServiceDate(json.request?.service_date || '');
    setServiceStartAt(toLocalInputValue(json.request?.service_start_at));
    setServiceLocation(json.request?.service_location || '');
    setServiceNotes(json.request?.service_notes || '');
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
      setVendorProfile(json.vendor ? { ...json.vendor, membership: json.membership, team: json.team || [], revenue: json.revenue || {}, payments: json.payments || [] } : null);
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
      const next = applyVendorRequestTransition(request, action, { estimatedValue, finalValue, vendorNote, serviceDate, serviceStartAt, serviceLocation, serviceNotes });
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
      body: JSON.stringify({
        token,
        action,
        estimatedValue,
        finalValue,
        vendorNote,
        serviceDate,
        serviceStartAt: fromLocalInputValue(serviceStartAt),
        serviceLocation,
        serviceNotes,
      }),
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
  const demoMode = !token && demoQuery;
  const requestStatus = labelForStatus(request?.status);
  const urgencyLabel = request?.urgency === 'rush' ? 'Needed within 24 hours' : 'Planning ahead';
  const nextExpected = vendorNextExpected(request?.status, request?.payment_collection_status);
  const canonicalStatus = request?.status === 'accepted' ? 'quoted' : request?.status === 'in_progress' ? 'scheduled' : request?.status;
  const ownerLabel = ['requested', 'viewed'].includes(canonicalStatus)
    ? vendorName
    : request?.status === 'declined'
      ? 'Passage coordinator'
      : vendorName;
  const paymentState = request?.payment_collection_status || '';
  const quoteReady = ['quoted', 'accepted'].includes(canonicalStatus);
  const quoteApproved = canonicalStatus === 'family_accepted' || paymentState === 'family_accepted';
  const paymentWaiting = ['payment_pending', 'checkout_created'].includes(canonicalStatus) || ['payment_pending', 'checkout_created'].includes(paymentState);
  const paymentConfirmed = canonicalStatus === 'paid' || paymentState === 'paid';
  const workScheduled = ['scheduled', 'in_progress'].includes(canonicalStatus);
  const requestClosed = ['completed', 'declined', 'cancelled', 'refunded'].includes(canonicalStatus);
  const waitingLabel = canonicalStatus === 'completed'
    ? 'Nothing. Status is saved.'
    : canonicalStatus === 'declined'
      ? 'Another support option'
      : quoteReady
        ? 'Family or funeral-home quote approval'
        : quoteApproved || paymentWaiting
          ? 'Secure payment before work begins'
          : paymentConfirmed || workScheduled
            ? 'Completion update from vendor'
            : 'Vendor response';
  const proofLabel = canonicalStatus === 'completed'
    ? 'Completion timestamp, proof note, and value stay on the request.'
    : canonicalStatus === 'declined'
      ? 'Decline reason/status stays visible for replacement.'
      : quoteReady
        ? 'Quote details are saved; scheduling stays locked until approval/payment.'
        : 'Viewed/responded timestamps and status changes are saved to the request.';
  const needRows = vendorRequestNeedRows(request || {});
  const recommendedVendorAction = ['requested', 'viewed', '', undefined].includes(canonicalStatus)
    ? ['accepted', 'Send quote']
    : paymentConfirmed && !workScheduled
      ? ['in_progress', 'Mark scheduled']
      : workScheduled
        ? ['completed', 'Save completion proof']
        : null;
  const passiveVendorState = requestClosed
    ? 'This request is closed. The case now has the vendor status and completion note.'
    : quoteReady
      ? 'Quote sent. Waiting for the family or funeral home to approve before work begins.'
      : quoteApproved || paymentWaiting
        ? 'Quote approved. Waiting for secure payment before scheduling or completion proof.'
        : 'Waiting for the next approved request step.';
  const secondaryVendorActions = (
    ['requested', 'viewed', '', undefined].includes(canonicalStatus)
      ? [['accepted', 'Send quote'], ['declined', 'Decline']]
      : quoteReady
        ? [['accepted', 'Revise quote'], ['declined', 'Decline']]
        : paymentConfirmed && !workScheduled
          ? [['in_progress', 'Mark scheduled']]
          : workScheduled
            ? [['completed', 'Save completion proof']]
            : []
  ).filter(([action]) => !recommendedVendorAction || action !== recommendedVendorAction[0]);

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} />
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
        {loading && <div style={cardStyle}>Loading request...</div>}
        {error && <div style={{ ...cardStyle, background: C.roseFaint, color: C.rose, borderColor: C.rose + '44' }}>{error}</div>}
        {!loading && !token && !demoMode && (
          vendorProfile ? (
            <VendorDashboard vendor={vendorProfile} requests={vendorRequests} authToken={userToken} onRefresh={() => loadVendorProfile(userToken)} />
          ) : (
            <div style={cardStyle}>
              <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor portal</div>
              <h1 style={{ fontSize: 32, lineHeight: 1.05, fontWeight: 400, margin: '10px 0' }}>{user ? 'No approved vendor profile yet.' : 'Sign in to manage vendor requests.'}</h1>
              <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65 }}>{vendorMessage || 'Vendors apply first. Once approved, the primary contact can sign in here to respond to scoped requests. Vendors do not browse families or cases.'}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                {!user && <Link href={'/api/auth/google?next=' + encodeURIComponent('/vendors/request')} style={{ ...buttonStyle(C.sage), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Sign in</Link>}
                <Link href="/vendors/onboard" style={{ ...buttonStyle(C.sage), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  Apply as a vendor
                </Link>
                <Link href="/contact?category=vendor" style={{ ...buttonStyle(C.card), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.sage, border: '1px solid ' + C.sage + '33', textDecoration: 'none' }}>
                  Ask a question
                </Link>
              </div>
              <div style={{ marginTop: 13, background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 13, padding: '11px 12px', color: C.mid, fontSize: 13.2, lineHeight: 1.45 }}>
                If you already applied, use the same email you submitted. If you have not applied yet, start with the vendor application so Passage can review your category, service area, payout setup, and response expectations.
              </div>
            </div>
          )
        )}
        {!loading && request && (
          <div data-demo-anchor="demo-vendor-request" style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 22, borderBottom: '1px solid ' + C.border, background: C.card }}>
              <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>{demoMode ? 'Sample scoped vendor request' : 'Scoped local support request'}</div>
              <h1 style={{ fontSize: 32, lineHeight: 1.06, fontWeight: 400, margin: '10px 0' }}>{request.task_title || 'Local help request'}</h1>
              <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.65, margin: 0 }}>{demoMode ? 'Sample scoped request. No live family record is changed.' : 'One scoped request connected to the family record. You only see what is needed to answer this request.'}</p>
              <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 12, padding: '10px 11px', color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 12 }}>
                <strong style={{ color: C.ink }}>Urgency:</strong> {urgencyLabel}. <strong style={{ color: C.ink }}>After your quote:</strong> the family or funeral home approves it before work begins.
              </div>
              <div style={{ marginTop: 12 }}>
                <SpineTrustStrip
                  compact
                  eyebrow="Scoped request"
                  title="One request, not a family file."
                  rows={[
                    ['Vendor sees', 'Request, timing, family/case label, and response status.'],
                    ['Kept private', 'Private notes, unrelated requests, and the full family record.'],
                    ['Family record sees', 'Viewed, quoted, approved, completed, or needs details.'],
                  ]}
                />
              </div>
            </div>
            {demoMode && (
              <div style={{ background: C.amberFaint, border: '1px solid #ead4ac', color: C.amber, borderRadius: 12, padding: 10, margin: '14px 22px 0', fontWeight: 800, fontSize: 13.5, lineHeight: 1.45 }}>
                Sample mode. No live messages, payments, or production request records are changed.
              </div>
            )}

            <div style={{ padding: 22 }}>
            <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 15, padding: '12px 13px', marginBottom: 14 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>Simple request path</div>
              <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginBottom: 8 }}>Owner: <strong style={{ color: C.ink }}>{ownerLabel}</strong></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 8 }}>
                <Info label="Action needed" value={recommendedVendorAction ? recommendedVendorAction[1] : passiveVendorState} />
                <Info label="Waiting on" value={waitingLabel} />
                <Info label="Status and proof" value={proofLabel} />
              </div>
              <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 9 }}>
                <strong style={{ color: C.ink }}>Access boundary:</strong> You can respond to this request only. Private family notes, unrelated requests, and the full family record stay hidden.
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(220px, .8fr)', gap: 12, marginBottom: 14 }}>
              <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 16, padding: 15 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Do this now</div>
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
                <div style={{ height: 8 }} />
                <Info label="Quote/value" value={request?.final_value || request?.estimated_value ? money(request?.final_value || request?.estimated_value) : 'Not quoted yet'} />
              </div>
            </div>

            <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 13, marginBottom: 14 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>What you need to know</div>
              {request?.request_note && (
                <div style={{ color: C.mid, fontSize: 13.2, lineHeight: 1.5, marginTop: 6 }}>
                  <strong style={{ color: C.ink }}>Request note:</strong> {request.request_note}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                {needRows.map(([label, value]) => (
                  <Info key={label} label={label} value={value} />
                ))}
              </div>
              <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 9 }}>
                Vendors only see scoped request details. The family record, private notes, unrelated requests, and payment setup stay outside this request view.
              </div>
            </div>

            {request?.vendor_note && (
              <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 14, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.5, marginBottom: 14 }}>
                <strong style={{ color: C.ink }}>Vendor note:</strong> {request.vendor_note}
              </div>
            )}

            <VendorRequestLoop
              next={request?.status === 'requested' ? 'Respond to the scoped request.' : nextExpected}
              owner={ownerLabel}
              waiting={waitingLabel}
              proof={proofLabel}
            />

            <details style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 14, marginBottom: 14 }}>
              <summary style={{ cursor: 'pointer', color: C.sage, fontSize: 13, fontWeight: 900 }}>Status history</summary>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Pill label="Sent" time={request.requested_at} />
                {request.viewed_at && <Pill label="Viewed" time={request.viewed_at} />}
                {request.responded_at && (
                  <Pill
                    label={request.status === 'declined' ? 'Declined' : 'Quote sent'}
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
            <div style={{ display: 'grid', gap: 8 }}>
              {recommendedVendorAction ? (
                <button onClick={() => setPendingVendorAction(recommendedVendorAction[0])} disabled={!!updating} style={{ ...buttonStyle(C.sage), minHeight: 46, fontSize: 14, textAlign: 'left' }}>Recommended: {recommendedVendorAction[1]}</button>
              ) : (
                <div style={{ background: requestClosed ? C.sageFaint : C.amberFaint, border: '1px solid ' + (requestClosed ? '#c8deca' : '#ead4ac'), borderRadius: 12, padding: 11, color: requestClosed ? C.sage : C.amber, fontWeight: 900, fontSize: 13, lineHeight: 1.45 }}>{passiveVendorState}</div>
              )}
              {secondaryVendorActions.length > 0 && (
                <details style={{ border: '1px solid ' + C.border, borderRadius: 12, padding: '9px 10px', background: C.card }}>
                  <summary style={{ cursor: 'pointer', color: C.mid, fontWeight: 900, fontSize: 12.5 }}>Other responses</summary>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
                    {secondaryVendorActions.map(([action, label]) => (
                      <button key={action} onClick={() => setPendingVendorAction(action)} disabled={!!updating} style={action === 'declined' ? { ...buttonStyle('#fff'), color: C.rose, border: '1px solid ' + C.rose + '55' } : buttonStyle(action === 'in_progress' ? C.amber : C.sage)}>{label}</button>
                    ))}
                  </div>
                </details>
              )}
            </div>
            {pendingVendorAction && (
              <div onClick={() => setPendingVendorAction('')} style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                <div role="dialog" aria-modal="true" aria-label="Respond to vendor request" onClick={event => event.stopPropagation()} style={{ width: 'min(640px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.card, border: '1px solid ' + C.border, borderRadius: 18, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor response</div>
                      <div style={{ color: C.ink, fontSize: 23, lineHeight: 1.15, fontWeight: 900, marginTop: 4 }}>{vendorActionTitle(pendingVendorAction)}</div>
                    </div>
                    <button onClick={() => setPendingVendorAction('')} aria-label="Close vendor response" style={{ border: '1px solid ' + C.border, background: C.card, color: C.mid, borderRadius: 999, width: 34, height: 34, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
                  </div>
                  <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, margin: '12px 0' }}>This response stays connected to the family case and request. It does not expose the full family record, and it does not send a live family message from this screen.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                    <label style={labelStyle}>Estimated quote<input value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="250" style={inputStyle} /></label>
                    <label style={labelStyle}>Final value<input value={finalValue} onChange={(e) => setFinalValue(e.target.value)} placeholder="250" style={inputStyle} /></label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 9 }}>
                    <label style={labelStyle}>Service date<input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} style={inputStyle} /></label>
                    <label style={labelStyle}>Service time<input type="datetime-local" value={serviceStartAt} onChange={(e) => setServiceStartAt(e.target.value)} style={inputStyle} /></label>
                    <label style={labelStyle}>Location<input value={serviceLocation} onChange={(e) => setServiceLocation(e.target.value)} placeholder="Venue, cemetery, home..." style={inputStyle} /></label>
                  </div>
                  <label style={{ ...labelStyle, marginTop: 9 }}>Quote note / availability<textarea value={vendorNote} onChange={(e) => setVendorNote(e.target.value)} placeholder="Available Friday afternoon. Quote includes setup, service coverage, and delivery of recording." style={{ ...inputStyle, minHeight: 74, resize: 'vertical' }} /></label>
                  <label style={{ ...labelStyle, marginTop: 9 }}>Work details and proof note<textarea value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} placeholder="Arrival instructions, delivery details, proof expected, or what the family should know." style={{ ...inputStyle, minHeight: 62, resize: 'vertical' }} /></label>
                  {request.payment_collection_status && (
                    <div style={{ marginTop: 9, fontSize: 12.5, color: C.mid, lineHeight: 1.45 }}>
                      Payment setup stays private. The vendor sees only the quote, scheduling, and completion details needed to respond.
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
  const status = action === 'accepted' ? 'quoted' : ['completed', 'in_progress', 'declined'].includes(action) ? action : 'requested';
  const next = {
    ...current,
    status,
    viewed_at: current?.viewed_at || now,
    estimated_value: values.estimatedValue,
    final_value: values.finalValue,
    vendor_note: values.vendorNote || current?.vendor_note || '',
    service_date: values.serviceDate || current?.service_date || '',
    service_start_at: fromLocalInputValue(values.serviceStartAt) || current?.service_start_at || '',
    service_location: values.serviceLocation || current?.service_location || '',
    service_notes: values.serviceNotes || current?.service_notes || '',
  };
  if (status === 'quoted') {
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

function toLocalInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function vendorRequestNeedRows(request = {}) {
  const serviceDate = request.service_date
    ? new Date(String(request.service_date).includes('T') ? request.service_date : `${request.service_date}T12:00:00`)
    : null;
  const serviceStart = request.service_start_at ? new Date(request.service_start_at) : null;
  return [
    ['Timing', serviceDate && !Number.isNaN(serviceDate.getTime()) ? serviceDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Quote timing or availability'],
    ['Start', serviceStart && !Number.isNaN(serviceStart.getTime()) ? serviceStart.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not confirmed yet'],
    ['Location', request.service_location || 'Share your service area or ask for the exact address'],
    ['Contact boundary', request.family_contact_name || request.family_contact_phone ? `${request.family_contact_name || 'Family contact'}${request.family_contact_phone ? `, ${request.family_contact_phone}` : ''}` : 'Coordinate through Passage until approved'],
    ['Payment', paymentStatusLabel(request.payment_collection_status || 'quote_needed')],
  ];
}

function vendorActionTitle(action) {
  if (action === 'accepted') return 'Send quote for review';
  if (action === 'in_progress') return 'Mark scheduled after approval/payment';
  if (action === 'completed') return 'Save completion proof';
  if (action === 'declined') return 'Decline this request';
  return labelForStatus(action);
}

function noticeForAction(action, demo) {
  const prefix = demo ? 'Demo update saved locally. ' : '';
  if (action === 'completed') return prefix + 'Marked completed. Passage will show the family and funeral home that this is handled.';
  if (action === 'in_progress') return prefix + 'Marked scheduled. Passage will keep this visible while the vendor works.';
  if (action === 'declined') return prefix + 'Marked declined. Passage will show that this request needs another option.';
  return prefix + 'Quote sent for review. The family or funeral home can approve it before work starts.';
}

function VendorDashboard({ vendor, requests, authToken, onRefresh }) {
  const openRequests = requests.filter((item) => !['completed', 'declined'].includes(item.status));
  const primaryRequest = openRequests[0] || requests[0];
  const payoutReady = vendor?.stripe_charges_enabled && vendor?.stripe_payouts_enabled;
  const revenue = vendor?.revenue || {};
  const [invite, setInvite] = useState({ email: '', displayName: '', role: 'staff' });
  const [inviteNotice, setInviteNotice] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState('');
  const canInvite = ['owner', 'manager'].includes(vendor?.membership?.role || 'owner');

  async function startConnect() {
    if (!authToken) {
      setConnectError('Sign in again before setting up payouts.');
      return;
    }
    setConnectLoading(true);
    setConnectError('');
    const response = await fetch('/api/vendors/connect/start', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + authToken },
    });
    const json = await response.json().catch(() => ({}));
    setConnectLoading(false);
    if (!response.ok || !json.url) {
      setConnectError(json.error || 'Could not start Stripe payout setup.');
      return;
    }
    window.location.href = json.url;
  }

  async function sendVendorInvite(event) {
    event.preventDefault();
    if (!authToken) return setInviteError('Sign in again before inviting a vendor employee.');
    setInviteSending(true);
    setInviteError('');
    setInviteNotice('');
    const response = await fetch('/api/vendors/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
      body: JSON.stringify(invite),
    });
    const json = await response.json().catch(() => ({}));
    setInviteSending(false);
    if (!response.ok) {
      setInviteError(json.error || 'Could not send this vendor invite.');
      return;
    }
    setInviteNotice(json.invite?.skipped ? 'Invite prepared, but email sending is not configured.' : 'Vendor employee invite sent.');
    setInvite({ email: '', displayName: '', role: 'staff' });
    if (onRefresh) onRefresh();
  }

  return (
    <div style={cardStyle}>
      <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor dashboard</div>
      <h1 style={{ fontSize: 32, lineHeight: 1.05, fontWeight: 400, margin: '10px 0' }}>{vendor.business_name}</h1>
      <p style={{ color: C.mid, fontSize: 16, lineHeight: 1.65 }}>Your business is approved. Requests appear only when Passage recommends you inside a relevant family request. Responding updates the scoped request status; this is not a public listing or open inbox.</p>
      <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 14, padding: 13, color: C.mid, fontSize: 13.2, lineHeight: 1.5, marginBottom: 14 }}>
        <strong style={{ color: C.ink }}>Vendor scope:</strong> see the request, urgency, family-facing context, and response status. The family record keeps approvals, proof, and broader coordination without exposing unrelated details.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, margin: '16px 0' }}>
        <Info label="Category" value={vendorCategoryLabel(vendor.category)} />
        <Info label="Open requests" value={openRequests.length} />
        <Info label="Service area" value={(vendor.zip_codes_served || []).join(', ') || 'Not set'} />
      </div>

      <div style={{ background: payoutReady ? C.sageFaint : C.amberFaint, border: '1px solid ' + (payoutReady ? '#c8deca' : '#ead4ac'), borderRadius: 15, padding: 14, marginBottom: 14, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
        <div>
          <div style={{ color: payoutReady ? C.sage : C.amber, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Payout readiness</div>
          <div style={{ color: C.ink, fontSize: 18, fontWeight: 900, marginTop: 4 }}>{payoutReady ? 'Stripe payouts are ready.' : 'Finish payout setup before paid jobs can be collected.'}</div>
          <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>Payment setup and payout details are handled through Stripe Connect after the request is approved.</div>
          {connectError && <div style={{ color: C.rose, fontSize: 12.5, marginTop: 6 }}>{connectError}</div>}
        </div>
        {!payoutReady && <button onClick={startConnect} disabled={connectLoading} style={buttonStyle(C.sage)}>{connectLoading ? 'Opening...' : 'Set up payouts'}</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
        <Info label="Paid jobs" value={revenue.paidJobs || 0} />
        <Info label="Gross paid" value={money(revenue.grossPaid) || '$0'} />
        <Info label="Passage fees" value={money(revenue.passageFees) || '$0'} />
        <Info label="Vendor balance" value={money(revenue.vendorNet) || '$0'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(260px,.75fr)', gap: 12, margin: '0 0 14px' }}>
        <div style={{ background: C.sageFaint, border: '1px solid #c8deca', borderRadius: 15, padding: 14 }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Request loop</div>
          <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.22, fontWeight: 900, marginTop: 5 }}>Requested, quoted, approved, completed.</div>
          <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.5, margin: '7px 0 0' }}>
            Every response stays attached to the scoped request. Families and funeral homes see status and proof without giving vendors access to the full record.
          </p>
        </div>
        <div style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 15, padding: 14 }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Team access</div>
          <div style={{ color: C.ink, fontSize: 17, fontWeight: 900, marginTop: 5 }}>{(vendor.team || []).length || 1} workspace user{((vendor.team || []).length || 1) === 1 ? '' : 's'}</div>
          <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>Employees sign in from the vendor front door and see the same scoped queue.</div>
        </div>
      </div>

      {primaryRequest && (
        <a href={`/vendors/request?token=${primaryRequest.response_token}`} style={{ display: 'block', background: C.sageFaint, border: '1px solid #c8deca', borderLeft: `5px solid ${C.sage}`, borderRadius: 14, padding: 13, color: C.ink, textDecoration: 'none', marginBottom: 12 }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Next request</div>
          <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.2, marginTop: 5 }}>{primaryRequest.task_title || 'Local help request'}</div>
          <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 5 }}>{primaryRequest.workflows?.deceased_name || primaryRequest.workflows?.estate_name || primaryRequest.workflows?.name || 'Family case'} - {primaryRequest.urgency === 'rush' ? 'Needed within 24 hours' : 'Planning ahead'}</div>
        </a>
      )}

      {canInvite && (
        <details style={{ border: '1px solid ' + C.border, borderRadius: 14, padding: 13, marginBottom: 12, background: C.card }}>
          <summary style={{ cursor: 'pointer', fontWeight: 900, fontSize: 18 }}>Invite vendor employee</summary>
          <form onSubmit={sendVendorInvite} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45 }}>
              Invite an employee to respond to quote requests and save vendor proof. They will not see unrelated family records.
            </div>
            {inviteError && <div style={{ background: C.roseFaint, border: '1px solid ' + C.rose + '33', color: C.rose, borderRadius: 11, padding: 10, fontSize: 12.5 }}>{inviteError}</div>}
            {inviteNotice && <div style={{ background: C.sageFaint, border: '1px solid #c8deca', color: C.sage, borderRadius: 11, padding: 10, fontSize: 12.5, fontWeight: 900 }}>{inviteNotice}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) 140px', gap: 8 }}>
              <input value={invite.displayName} onChange={(event) => setInvite(prev => ({ ...prev, displayName: event.target.value }))} placeholder="Name or role" style={inputStyle} />
              <input value={invite.email} onChange={(event) => setInvite(prev => ({ ...prev, email: event.target.value }))} type="email" placeholder="employee@vendor.com" style={inputStyle} />
              <select value={invite.role} onChange={(event) => setInvite(prev => ({ ...prev, role: event.target.value }))} style={inputStyle}>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <button disabled={inviteSending} style={{ ...buttonStyle(C.sage), minHeight: 44, justifySelf: 'start' }}>{inviteSending ? 'Sending...' : 'Send vendor invite'}</button>
          </form>
        </details>
      )}

      {(vendor.team || []).length > 0 && (
        <details style={{ border: '1px solid ' + C.border, borderRadius: 14, padding: 13, marginBottom: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 900, fontSize: 18 }}>Vendor team ({vendor.team.length})</summary>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {vendor.team.map(member => (
              <div key={member.id || member.email} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, alignItems: 'center', background: C.bg, border: '1px solid ' + C.border, borderRadius: 12, padding: 10 }}>
                <div>
                  <div style={{ color: C.ink, fontWeight: 900 }}>{member.display_name || member.email}</div>
                  <div style={{ color: C.mid, fontSize: 12.5 }}>{member.email}</div>
                </div>
                <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '5px 8px', fontSize: 11.5, fontWeight: 900 }}>{member.role} / {member.status}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <details style={{ border: '1px solid ' + C.border, borderRadius: 14, padding: 13 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 900, fontSize: 18 }}>Incoming requests ({requests.length})</summary>
        <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
          {!requests.length && <div style={{ color: C.mid }}>No requests yet. When one arrives, you can view it, send a quote, ask for details, mark work scheduled, or save completion proof from here.</div>}
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, margin: '0 0 14px' }}>
      <Info label="Action needed" value={next} />
      <Info label="Owner" value={owner} />
      <Info label="Waiting on" value={waiting} />
      <Info label="Status and proof" value={proof} />
    </div>
  );
}

function Pill({ label, time }) {
  return <span style={{ background: C.card, color: C.sage, border: '1px solid #c8deca', borderRadius: 999, padding: '5px 8px', fontSize: 12, fontWeight: 900 }}>{label}{time ? ` - ${new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</span>;
}

function labelForStatus(status) {
  return vendorStatusLabel(status);
}

function buttonStyle(background) {
  return { border: background === '#fff' ? '1px solid ' + C.border : 'none', background, color: background === '#fff' ? C.ink : '#fff', borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' };
}

const cardStyle = { background: C.card, border: '1px solid ' + C.border, borderRadius: 20, padding: 24 };
const labelStyle = { display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.12em' };
const inputStyle = { border: '1px solid ' + C.border, borderRadius: 11, background: C.card, padding: '10px 11px', fontFamily: 'Georgia,serif', fontSize: 14, color: C.ink };