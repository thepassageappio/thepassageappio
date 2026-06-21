// Passage — Vendor scoped-request container (site-migration Slice 3).
// Stateful container mirroring components/family/FamilyTodayApp.js. It branches
// between the two legacy modes plus demo:
//   1. Token mode (?token=...): GET /api/vendorRequests/portal?token= then
//      POST /api/vendorRequests/portal for accepted|declined|in_progress|completed.
//      The server enforces the quote->approval->payment->schedule->complete gate;
//      409 (and other) errors surface verbatim.
//   2. Auth dashboard mode (no token): GET /api/vendors/me (Bearer). Each request
//      deep-links into token mode via response_token.
//   3. Demo mode (?demo=1, no token): local transitions only, NO production writes.
// Real persona surface, so AppShell frame="app". SSR-safe (window/document guarded;
// search params read in effects, never at render).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DS, TYPE, SANS } from '../../lib/designSystem';
import { supabase } from '../../lib/supabaseBrowser';
import { AppShell, CalmStatusPill, HeroTask, SectionLabel, TaskRow } from '../calm/CalmKit';
import { Banner, Button, Card } from '../calm/CalmControls';
import { vendorCategoryLabel } from '../../lib/vendors';
import VendorRequestSheet from './VendorRequestSheet';
import { buildVendorRequestModel, buildVendorDashboardModel } from './vendorRequestAdapter';

const SYSTEM_ADMIN_EMAILS = ['steventurrisi@gmail.com'];

const DEMO_REQUEST = {
  id: 'demo-vendor-request',
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
  vendors: { business_name: 'Hudson Valley Memorial Media' },
  workflows: { deceased_name: 'Marian Ellis' },
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isSystemAdmin(user) {
  return SYSTEM_ADMIN_EMAILS.includes(normalizeEmail(user?.email));
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

// Demo-only local transition. No production writes. Mirrors the legacy
// applyVendorRequestTransition so sample behaviour stays intact.
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
  if (status === 'quoted') { next.responded_at = now; next.in_progress_at = null; next.completed_at = null; }
  if (status === 'in_progress') { next.responded_at = current?.responded_at || now; next.in_progress_at = now; next.completed_at = null; }
  if (status === 'completed') { next.responded_at = current?.responded_at || now; next.in_progress_at = current?.in_progress_at || now; next.completed_at = now; }
  if (status === 'declined') { next.responded_at = now; next.in_progress_at = null; next.completed_at = null; next.final_value = ''; }
  next.local_demo_action_at = now;
  return next;
}

function noticeForAction(action, demo) {
  const prefix = demo ? 'Demo update saved locally. ' : '';
  if (action === 'completed') return prefix + 'Marked completed. Passage will show the family and funeral home that this is handled.';
  if (action === 'in_progress') return prefix + 'Marked scheduled. Passage will keep this visible while you work.';
  if (action === 'declined') return prefix + 'Marked declined. Passage will show that this request needs another option.';
  return prefix + 'Quote sent for review. The family or funeral home can approve it before work starts.';
}

function valuesFromRequest(request = {}) {
  return {
    estimatedValue: request.estimated_value || '',
    finalValue: request.final_value || '',
    vendorNote: request.vendor_note || '',
    serviceDate: request.service_date || '',
    serviceStartAt: toLocalInputValue(request.service_start_at),
    serviceLocation: request.service_location || '',
    serviceNotes: request.service_notes || '',
  };
}

function LoadingState() {
  return (
    <div style={{ padding: '22px 20px 60px' }}>
      <div style={{ height: 22, width: '66%', background: DS.color.hair, borderRadius: DS.radius.pill, marginBottom: 10 }} />
      <div style={{ height: 13, width: '82%', background: DS.color.hair, borderRadius: DS.radius.pill, marginBottom: 22 }} />
      {[0, 1, 2].map((item) => (
        <div key={item} style={{ height: item === 0 ? 142 : 72, background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.lg, marginBottom: 12 }} />
      ))}
    </div>
  );
}

function ScopedNote() {
  return (
    <div style={{ marginTop: 12 }}>
      <Banner tone="info">
        You can respond to this request only. Private family notes, unrelated requests, and the family record stay hidden. You only see what is needed to answer this request.
      </Banner>
    </div>
  );
}

export default function VendorRequestApp() {
  const [token, setToken] = useState('');
  const [demoQuery, setDemoQuery] = useState(false);
  const [routeReady, setRouteReady] = useState(false);

  const [user, setUser] = useState(null);
  const [userToken, setUserToken] = useState('');

  const [request, setRequest] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [requests, setRequests] = useState([]);
  const [vendorMessage, setVendorMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetAction, setSheetAction] = useState('accepted');
  const [values, setValues] = useState({});
  const sheetOpenerRef = useRef(null);

  const demoMode = !token && demoQuery;

  // Read route params once on mount (SSR-safe: never during render).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setToken(String(params.get('token') || ''));
    setDemoQuery(params.get('demo') === '1' || params.get('demo') === 'true');
    setRouteReady(true);
  }, []);

  // Auth session (used in dashboard mode).
  useEffect(() => {
    if (!supabase) { return undefined; }
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

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/vendorRequests/portal?token=' + encodeURIComponent(token));
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || 'Could not load this request.'); setRequest(null); return; }
      setRequest(json.request);
      setValues(valuesFromRequest(json.request || {}));
    } catch (err) {
      setError(err?.message || 'Could not load this request.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadVendorProfile = useCallback(async (accessToken) => {
    const bearer = accessToken || userToken;
    setLoading(true);
    setError('');
    setVendorMessage('');
    try {
      const res = await fetch('/api/vendors/me', { headers: { Authorization: 'Bearer ' + bearer } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || 'Could not load your vendor profile.'); return; }
      setVendor(json.vendor ? { ...json.vendor, membership: json.membership, team: json.team || [], revenue: json.revenue || {}, payments: json.payments || [] } : null);
      setRequests(json.requests || []);
      setVendorMessage(json.message || '');
    } catch (err) {
      setError(err?.message || 'Could not load your vendor profile.');
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  // Token mode load.
  useEffect(() => {
    if (!routeReady) return;
    if (token) loadRequest();
  }, [routeReady, token, loadRequest]);

  // Demo mode (no token).
  useEffect(() => {
    if (!routeReady) return;
    if (!token && demoQuery) {
      setRequest(DEMO_REQUEST);
      setValues(valuesFromRequest(DEMO_REQUEST));
      setError('');
      setLoading(false);
    }
  }, [routeReady, token, demoQuery]);

  // Dashboard mode (no token, signed in non-admin).
  useEffect(() => {
    if (!routeReady) return;
    if (!token && !demoQuery) {
      if (user && !isSystemAdmin(user) && userToken) loadVendorProfile(userToken);
      else if (!user) setLoading(false);
      else setLoading(false);
    }
  }, [routeReady, token, demoQuery, user, userToken, loadVendorProfile]);

  const requestModel = useMemo(() => (request ? buildVendorRequestModel({ request }) : null), [request]);
  const dashboardModel = useMemo(() => buildVendorDashboardModel({ vendor, requests }), [vendor, requests]);

  const openSheet = (action) => {
    if (typeof document !== 'undefined') {
      const opener = document.activeElement;
      sheetOpenerRef.current = opener && typeof opener.focus === 'function' ? opener : null;
    }
    setSheetAction(action || requestModel?.recommendedAction?.[0] || 'accepted');
    setSaveError('');
    setNotice('');
    setSheetOpen(true);
  };

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    const opener = sheetOpenerRef.current;
    sheetOpenerRef.current = null;
    if (opener && typeof opener.focus === 'function') {
      if (typeof window !== 'undefined') window.setTimeout(() => opener.focus(), 0);
      else opener.focus();
    }
  }, []);

  const changeValue = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  // Save a response. Mirrors the legacy gate guards client-side, then writes (or
  // applies a local demo transition).
  const saveResponse = async (action) => {
    const { estimatedValue, finalValue, vendorNote, serviceDate, serviceStartAt, serviceLocation, serviceNotes } = values;
    const quoteAmount = Number(finalValue || estimatedValue || request?.final_value || request?.estimated_value || 0);
    const proofNote = String(serviceNotes || vendorNote || '').trim();
    const scheduleDetail = String(serviceDate || serviceStartAt || serviceLocation || serviceNotes || '').trim();
    if (action === 'accepted' && quoteAmount <= 0) { setSaveError('Add the quote amount before sending it for approval.'); return; }
    if (action === 'in_progress' && !scheduleDetail) { setSaveError('Add a scheduled date, time, location, or note before marking this scheduled.'); return; }
    if (action === 'completed' && proofNote.length < 8) { setSaveError('Add completion proof before saving this as completed.'); return; }

    // Demo mode: local transition only, no production write.
    if (!token) {
      const next = applyVendorRequestTransition(request, action, values);
      setRequest(next);
      setNotice(noticeForAction(action, true));
      closeSheet();
      return;
    }

    setSaving(true);
    setSaveError('');
    setNotice('');
    try {
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
      if (!res.ok) { setSaveError(json.error || 'Could not update this request.'); return; }
      setRequest(json.request);
      setValues(valuesFromRequest(json.request || {}));
      setNotice(noticeForAction(action, false));
      closeSheet();
    } catch (err) {
      setSaveError(err?.message || 'Could not update this request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.color.page, fontFamily: SANS, padding: '18px 8px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <AppShell brand="Passage" active="Today" frame="app">
        {loading ? <LoadingState /> : (
          <div style={{ padding: '18px 18px 60px' }}>
            {error && <div style={{ marginBottom: 14 }}><Banner tone="danger">{error}</Banner></div>}

            {/* Token mode + demo mode: single scoped request. */}
            {requestModel && (token || demoMode) && (
              <ScopedRequestView
                model={requestModel}
                demoMode={demoMode}
                notice={notice}
                onOpen={openSheet}
              />
            )}

            {/* Dashboard mode: signed-in vendor queue. */}
            {!token && !demoMode && vendor && (
              <VendorDashboard model={dashboardModel} />
            )}

            {/* Dashboard mode: no approved profile / signed out. */}
            {!token && !demoMode && !vendor && !error && (
              <SignedOutPanel user={user} message={vendorMessage} />
            )}
          </div>
        )}
      </AppShell>

      <VendorRequestSheet
        open={sheetOpen}
        model={requestModel}
        initialAction={sheetAction}
        values={values}
        saving={saving}
        error={saveError}
        notice={notice}
        demoMode={demoMode}
        onChange={changeValue}
        onClose={closeSheet}
        onSave={saveResponse}
      />
    </div>
  );
}

function ScopedRequestView({ model, demoMode, notice, onOpen }) {
  const heroTask = {
    statusKey: model.statusKey,
    who: model.who,
    title: model.title,
    why: model.why,
    action: model.recommendedAction ? `Recommended: ${model.recommendedAction[1]}` : 'View saved status',
  };
  return (
    <div>
      <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 4px' }}>{demoMode ? 'Sample scoped vendor request' : 'Scoped local support request'}</p>
      <h1 style={{ ...TYPE.display, color: DS.color.ink, margin: '0 0 6px' }}>{model.title}</h1>
      <p style={{ ...TYPE.small, color: DS.color.mid, margin: '0 0 12px' }}>
        {demoMode ? 'Sample scoped request. No live family record is changed.' : 'One scoped request connected to the case. You only see what is needed to answer this request.'}
      </p>

      {demoMode && <div style={{ marginBottom: 12 }}><Banner tone="warn">Sample mode. No live messages, payments, or production request records are changed.</Banner></div>}

      <Banner tone="success">
        Urgency: {model.urgency}. After your quote, the family or funeral home approves it before work begins.
      </Banner>

      <SectionLabel>Respond now</SectionLabel>
      {model.recommendedAction ? (
        <HeroTask task={heroTask} onOpen={() => onOpen(model.recommendedAction[0])} />
      ) : (
        <Card><p style={{ ...TYPE.body, color: DS.color.sageDeep, margin: 0, fontWeight: 600 }}>{model.passiveState}</p></Card>
      )}

      {model.secondaryActions.length > 0 && (
        <>
          <SectionLabel>Other responses</SectionLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {model.secondaryActions.map(([action, label]) => (
              <Button key={action} variant={action === 'declined' ? 'danger' : 'secondary'} onClick={() => onOpen(action)}>{label}</Button>
            ))}
          </div>
        </>
      )}

      {model.requestNote && (
        <>
          <SectionLabel>What you need to know</SectionLabel>
          <Card><p style={{ ...TYPE.body, color: DS.color.ink, margin: 0 }}>{model.requestNote}</p></Card>
        </>
      )}

      <SectionLabel>Request loop</SectionLabel>
      <Card><p style={{ ...TYPE.small, color: DS.color.mid, margin: 0 }}>
        <strong style={{ color: DS.color.ink }}>Next expected update:</strong> {model.nextExpected}
      </p></Card>

      <SectionLabel>Scoped details</SectionLabel>
      <div style={{ background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.lg, padding: '3px 14px' }}>
        {model.details.map(([label, value], index) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, borderTop: index === 0 ? 'none' : `1px solid ${DS.color.hair}`, padding: '12px 0', ...TYPE.small }}>
            <span style={{ color: DS.color.mid }}>{label}</span>
            <span style={{ textAlign: 'right', color: DS.color.ink, fontWeight: 500, overflowWrap: 'anywhere' }}>{value}</span>
          </div>
        ))}
      </div>

      {model.history.length > 0 && (
        <>
          <SectionLabel>Status history</SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {model.history.map(([label, time]) => (
              <span key={label} style={{ background: DS.color.sageFaint, color: DS.color.sageDeep, borderRadius: DS.radius.pill, padding: '5px 10px', ...TYPE.micro, fontWeight: 600 }}>
                {label}{time ? ` · ${new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
              </span>
            ))}
          </div>
        </>
      )}

      {notice && <div style={{ marginTop: 14 }}><Banner tone="success">{notice}</Banner></div>}
      <ScopedNote />
    </div>
  );
}

function VendorDashboard({ model }) {
  return (
    <div>
      <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 4px' }}>Vendor dashboard</p>
      <h1 style={{ ...TYPE.display, color: DS.color.ink, margin: '0 0 6px' }}>{model.businessName}</h1>
      <p style={{ ...TYPE.small, color: DS.color.mid, margin: '0 0 12px' }}>
        Your business is approved. Requests appear only when Passage recommends you inside a relevant request. Responding updates the scoped request status; this is not a public listing or open inbox.
      </p>

      <Banner tone="info">
        Vendor scope: see the request, urgency, case label, and response status. Approvals, proof, and broader coordination stay outside this view.
      </Banner>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10, margin: '14px 0' }}>
        {[
          ['Category', vendorCategoryLabel(model.category)],
          ['Open requests', model.openCount],
          ['Service area', model.serviceArea],
        ].map(([label, value]) => (
          <div key={label} style={{ background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.md, padding: 11, minWidth: 0 }}>
            <p style={{ ...TYPE.micro, color: DS.color.soft, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{label}</p>
            <p style={{ ...TYPE.body, color: DS.color.ink, margin: 0, overflowWrap: 'anywhere' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <Banner tone={model.payoutReady ? 'success' : 'warn'}>
          {model.payoutReady ? 'Stripe payouts are ready.' : 'Finish payout setup before paid jobs can be collected. Payouts are handled through Stripe Connect after a request is approved.'}
        </Banner>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: 10, marginBottom: 6 }}>
        {[
          ['Paid jobs', model.revenue.paidJobs],
          ['Gross paid', model.revenue.grossPaid],
          ['Passage fees', model.revenue.passageFees],
          ['Vendor balance', model.revenue.vendorNet],
        ].map(([label, value]) => (
          <div key={label} style={{ background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.md, padding: 11, minWidth: 0 }}>
            <p style={{ ...TYPE.micro, color: DS.color.soft, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{label}</p>
            <p style={{ ...TYPE.body, color: DS.color.ink, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {model.startHere && (
        <>
          <SectionLabel>Next request</SectionLabel>
          <a href={`/vendors/request?token=${model.startHere.responseToken}`} style={{ display: 'block', textDecoration: 'none' }}>
            <Card style={{ borderLeft: `4px solid ${DS.color.sage}` }}>
              <CalmStatusPill view={model.startHere.statusView} />
              <p style={{ ...TYPE.h2, color: DS.color.ink, margin: '9px 0 4px' }}>{model.startHere.title}</p>
              <p style={{ ...TYPE.small, color: DS.color.mid, margin: 0 }}>{model.startHere.caseLabel} · {model.startHere.urgency}</p>
            </Card>
          </a>
        </>
      )}

      {model.whenReady.length > 0 && (
        <>
          <SectionLabel>Needs you</SectionLabel>
          <Card pad={6}>
            {model.whenReady.map((row) => (
              <RequestLinkRow key={row.id} row={row} />
            ))}
          </Card>
        </>
      )}

      {model.waiting.length > 0 && (
        <>
          <SectionLabel>Waiting on others</SectionLabel>
          <Card pad={6}>
            {model.waiting.map((row) => (
              <RequestLinkRow key={row.id} row={row} muted />
            ))}
          </Card>
        </>
      )}

      {model.closed.length > 0 && (
        <>
          <SectionLabel>Closed</SectionLabel>
          <Card pad={6}>
            {model.closed.map((row) => (
              <RequestLinkRow key={row.id} row={row} muted />
            ))}
          </Card>
        </>
      )}

      {model.rows.length === 0 && (
        <Card style={{ marginTop: 14 }}>
          <p style={{ ...TYPE.body, color: DS.color.mid, margin: 0 }}>
            No requests yet. When one arrives, you can view it, send a quote, ask for details, mark work scheduled, or save completion proof from here.
          </p>
        </Card>
      )}
    </div>
  );
}

function RequestLinkRow({ row, muted = false }) {
  return (
    <a href={`/vendors/request?token=${row.responseToken}`} style={{ display: 'block', textDecoration: 'none' }}>
      <TaskRow
        task={{ id: row.id, statusKey: row.statusKey, who: row.who, title: row.title, eta: row.statusLabel }}
        muted={muted}
      />
    </a>
  );
}

function SignedOutPanel({ user, message }) {
  const signIn = () => window.location.assign('/auth/google?next=' + encodeURIComponent('/vendors/request'));
  return (
    <div>
      <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 4px' }}>Vendor portal</p>
      <h1 style={{ ...TYPE.display, color: DS.color.ink, margin: '0 0 8px' }}>{user ? 'No approved vendor profile yet.' : 'Sign in to manage vendor requests.'}</h1>
      <p style={{ ...TYPE.body, color: DS.color.mid, margin: '0 0 14px' }}>
        {message || 'Vendors apply first. Once approved, the primary contact can sign in here to respond to scoped requests. Vendors do not browse families or cases.'}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {!user && <Button onClick={signIn}>Sign in</Button>}
        <Button variant="secondary" onClick={() => window.location.assign('/vendors/onboard')}>Apply as a vendor</Button>
        <Button variant="ghost" onClick={() => window.location.assign('/contact?category=vendor')}>Ask a question</Button>
      </div>
      <div style={{ marginTop: 14 }}>
        <Banner tone="info">
          If you already applied, use the same email you submitted. If not, start with the vendor application so Passage can review your category, service area, payout setup, and response expectations.
        </Banner>
      </div>
    </div>
  );
}
