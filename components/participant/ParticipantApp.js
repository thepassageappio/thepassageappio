// Passage — Participant scoped-surface container (site-migration Slice 4).
// Stateful container mirroring components/family/FamilyTodayApp.js +
// components/vendor/VendorRequestApp.js. It carries every legacy /participating
// mode onto the calm design system:
//   1. Signed-out: OTP email sign-in (Supabase signInWithOtp, friendly auth errors,
//      emailRedirectTo back to the participating path) + Google sign-in.
//   2. Authed context: GET /api/participantContext?estate=&task= (Bearer) -> estates[].
//      Multi-estate selector when more than one estate is returned.
//   3. Invite-token acceptance: POST /api/acceptParticipantInvite (?invite|token|
//      invite_token) before loading context, honoring redirectTo.
//   4. Demo (?demo=1 / ?demoTour=funeral-home): local-only, NO production writes.
//   Plus activation-circle confirm (POST /api/activationCircle) and optimistic
//   POST /api/participantAction with verbatim server-error surfacing (terminal-status
//   409s show as-is). Real persona surface, so AppShell frame="app". SSR-safe
//   (window/document guarded; search params read in effects, never at render).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DS, TYPE, SANS, present } from '../../lib/designSystem';
import { supabase } from '../../lib/supabaseBrowser';
import { AppShell, CalmStatusPill, HeroTask, ProgressLine, SectionLabel, TaskRow } from '../calm/CalmKit';
import { Banner, Button, Card, Input, Select } from '../calm/CalmControls';
import { friendlyAuthError, isLikelyEmail, normalizeEmail } from '../../lib/authFeedback';
import { taskActionConfirmation, taskActionRequiresNote, taskActionStatus } from '../../lib/taskActions';
import ParticipantTaskSheet from './ParticipantTaskSheet';
import {
  buildParticipantEstateModel,
  chooseParticipantEstateId,
  estateOptionLabel,
} from './participantAdapter';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const PARTICIPATING_PATH = '/participating';

// Demo context — mirrors the legacy demoParticipantContext shape exactly so sample
// behaviour stays intact. Local-only; no production writes.
const DEMO_CONTEXT = {
  email: 'demo-helper@passage.local',
  discountEligible: true,
  estates: [{
    id: 'demo-participant-estate',
    deceased_name: 'Eleanor Price',
    name: 'Plan for Eleanor Price',
    role: 'family helper',
    coordinator_name: 'Michael Price',
    coordinator_email: 'michael@example.com',
    status: 'active',
    activation_status: 'activated',
    events: [
      { id: 'demo-service', name: 'Arrangement meeting', event_type: 'arrangement', date: '2026-05-12', time: '10:00 AM', location_name: 'Hudson Valley Funeral Group' },
    ],
    tasks: [
      { id: 'demo-participant-task', title: 'Send cemetery plot details', description: 'Michael asked you for the cemetery section, lot number, and a photo of the deed if you have it.', status: 'assigned', notes: '' },
      { id: 'demo-participant-task-waiting', title: 'Confirm pallbearer names', description: 'Reply with the names you know, or mark waiting if you need to ask the family.', status: 'waiting', notes: '' },
    ],
    actions: [],
    coordinationSpine: { conversation: [], proof: [], notifications: [], attentionItems: [], latest: [] },
  }],
};

function statusForParticipantAction(action) {
  return action === 'save_note' ? null : (taskActionStatus(action) || 'needs_review');
}

function actionConfirmation(action) {
  return taskActionConfirmation(action, null, 'participant');
}

function serviceLine(estate) {
  const service = (estate?.events || [])[0];
  if (!service) return '';
  return `${service.name || service.event_type || 'Service'}${service.date ? `, ${service.date}` : ''}${service.time ? ` at ${service.time}` : ''}${service.location_name ? `, ${service.location_name}` : ''}`;
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

const PREVIEW_ITEMS = [
  { statusKey: 'yours_now', title: 'Send cemetery plot details', body: 'The coordinator asked you for the section and lot number.' },
  { statusKey: 'waiting', who: 'the coordinator', title: 'Confirm pallbearer names', body: 'Waiting on a reply before this can move.' },
  { statusKey: 'done', proof: true, title: 'Shared service photo', body: 'Saved to this scoped request.' },
];

// Signed-out OTP sign-in landing. Mirrors AppCalm EmailLinkForm + the legacy
// magic-link flow, with friendly auth errors and emailRedirectTo back to the
// participating path (preserving query params so deep-links survive sign-in).
function SignInPanel({ redirectPath, onGoogle }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const emailId = 'participant-otp-email';

  const sendLink = async () => {
    const clean = normalizeEmail(email);
    setError('');
    setSent(false);
    if (!clean) { setError('Enter the email address that received the invite.'); return; }
    if (!isLikelyEmail(clean)) { setError('Enter a valid email address, like name@example.com.'); return; }
    if (!supabase?.auth) { setError('Sign-in is not configured in this environment.'); return; }
    setSending(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: SITE_URL + (redirectPath || PARTICIPATING_PATH) },
    });
    setSending(false);
    if (authError) { setError(friendlyAuthError(authError)); return; }
    setEmail(clean);
    setSent(true);
  };

  return (
    <div style={{ padding: '18px 18px 60px' }}>
      <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 4px' }}>Your scoped requests</p>
      <h1 style={{ ...TYPE.display, color: DS.color.ink, margin: '0 0 8px' }}>Sign in to see what the coordinator asked you to help with.</h1>
      <p style={{ ...TYPE.body, color: DS.color.mid, margin: '0 0 14px' }}>
        Use the email address that received the invite. You only see your scoped requests for this family &mdash; never the full family record.
      </p>

      <Card pad={16} style={{ marginBottom: 14 }}>
        <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 10px' }}>What waits for you</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {PREVIEW_ITEMS.map((item) => {
            const view = present(item.statusKey, { who: item.who, proof: item.proof });
            return (
              <div key={item.title} style={{ border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.md, padding: 12, background: DS.color.cream, minWidth: 0 }}>
                <CalmStatusPill view={view} />
                <p style={{ ...TYPE.body, color: DS.color.ink, margin: '9px 0 0', fontWeight: 600 }}>{item.title}</p>
                <p style={{ ...TYPE.micro, color: DS.color.mid, margin: '4px 0 0' }}>{item.body}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 9 }}>
        <label htmlFor={emailId} style={{ display: 'block', ...TYPE.small, fontWeight: 500, color: DS.color.ink }}>Secure email link</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 8 }}>
          <Input id={emailId} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <Button disabled={sending} onClick={sendLink} style={{ width: '100%' }}>{sending ? 'Sending' : 'Send link'}</Button>
        </div>
        {sent && <Banner tone="success">Check {email} for a secure sign-in link to continue.</Banner>}
        {error && <Banner tone="danger">{error}</Banner>}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onGoogle}>Sign in with Google</Button>
      </div>
    </div>
  );
}

// Activation-circle review card. Calm rebuild of the legacy ActivationReviewCard;
// keeps the two-trusted-confirmation rule and the second-validator boundary.
function ActivationReview({ estate, onConfirm }) {
  const review = estate?.raw?.activationReview;
  if (!review?.request || review.request.status !== 'pending') return null;
  const requester = review.request.requested_by_name || review.request.requested_by_email || 'Someone in the activation circle';
  return (
    <div style={{ marginBottom: 14 }}>
      <Card style={{ borderLeft: `4px solid ${DS.color.amber}` }}>
        <p style={{ ...TYPE.label, color: '#7a4f10', margin: '0 0 6px' }}>Activation review</p>
        <h3 style={{ ...TYPE.h2, color: DS.color.ink, margin: '0 0 6px' }}>Confirm whether this planning record should become active.</h3>
        <p style={{ ...TYPE.small, color: DS.color.mid, margin: '0 0 10px' }}>
          {requester} started the review. Passage needs two different trusted confirmations before a planning record becomes active.
        </p>
        {review.request.reason && <Banner tone="info">Reason shared: {review.request.reason}</Banner>}
        <p style={{ ...TYPE.micro, color: DS.color.mid, margin: '10px 0 0' }}>{review.confirmations?.length || 1} of 2 confirmations saved.</p>
        {review.alreadyConfirmed ? (
          <div style={{ marginTop: 10 }}><Banner tone="success">Your confirmation is saved. Passage is waiting for a second trusted person.</Banner></div>
        ) : review.needsSecondConfirmation ? (
          <Button full style={{ marginTop: 12 }} onClick={() => onConfirm(estate.id, review.request.id)}>Confirm activation</Button>
        ) : (
          <div style={{ marginTop: 10 }}><Banner tone="warn">A second trusted person must confirm. The person who started the request cannot be the second validator.</Banner></div>
        )}
      </Card>
    </div>
  );
}

export default function ParticipantApp() {
  const [routeReady, setRouteReady] = useState(false);
  const [query, setQuery] = useState({});
  const [redirectPath, setRedirectPath] = useState(PARTICIPATING_PATH);
  const [demoMode, setDemoMode] = useState(false);

  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const [data, setData] = useState(null);
  const [estateId, setEstateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [acceptedInviteToken, setAcceptedInviteToken] = useState('');
  const taskOpenerRef = useRef(null);

  // Read route params once on mount (SSR-safe: never during render).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = {};
    params.forEach((value, key) => { q[key] = value; });
    setQuery(q);
    setRedirectPath((window.location.pathname || PARTICIPATING_PATH) + (window.location.search || ''));
    setDemoMode(params.get('demo') === '1' || params.get('demo') === 'true' || params.get('demoTour') === 'funeral-home');
    setRouteReady(true);
  }, []);

  // Auth session.
  useEffect(() => {
    if (!supabase?.auth) { setSessionChecked(true); return undefined; }
    supabase.auth.getSession().then(({ data: sessionData }) => {
      setUser(sessionData?.session?.user || null);
      setSessionChecked(true);
    }).catch(() => setSessionChecked(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setSessionChecked(true);
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const load = useCallback(async (token) => {
    setLoading(true);
    setError('');
    let acceptedInvite = null;
    // Invite-token acceptance before loading context.
    const inviteToken = String(query.invite || query.token || query.invite_token || '').trim();
    if (inviteToken && inviteToken !== acceptedInviteToken) {
      try {
        const inviteRes = await fetch('/api/acceptParticipantInvite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ inviteToken }),
        });
        const inviteJson = await inviteRes.json().catch(() => ({}));
        setAcceptedInviteToken(inviteToken);
        if (inviteRes.ok) {
          acceptedInvite = inviteJson;
          setNotice('Invite accepted. Your assigned requests are ready below.');
        } else {
          setError(inviteJson.error || 'Could not accept this invite.');
        }
      } catch (err) {
        setError(err?.message || 'Could not accept this invite.');
      }
    }
    const params = new URLSearchParams();
    if (query.estate || acceptedInvite?.estateId) params.set('estate', String(query.estate || acceptedInvite.estateId));
    if (query.task || acceptedInvite?.taskId) params.set('task', String(query.task || acceptedInvite.taskId));
    try {
      const res = await fetch('/api/participantContext' + (params.toString() ? '?' + params.toString() : ''), { headers: { Authorization: 'Bearer ' + token } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || 'Could not load your scoped requests.'); }
      else {
        setData(json);
        if (json?.estates?.length) {
          setEstateId((prev) => chooseParticipantEstateId(json.estates, {
            estate: query.estate || acceptedInvite?.estateId,
            task: query.task || acceptedInvite?.taskId,
          }, prev));
        }
      }
    } catch (err) {
      setError(err?.message || 'Could not load your scoped requests.');
    } finally {
      setLoading(false);
    }
  }, [query, acceptedInviteToken]);

  // Demo mode (local-only).
  useEffect(() => {
    if (!routeReady) return;
    if (demoMode) {
      setData(DEMO_CONTEXT);
      setEstateId('demo-participant-estate');
      setError('');
      setLoading(false);
    }
  }, [routeReady, demoMode]);

  // Authed context load.
  useEffect(() => {
    if (!routeReady || demoMode) return;
    if (!sessionChecked) return;
    if (!supabase?.auth) { setLoading(false); setError('Sign-in is not configured in this environment.'); return; }
    if (!user) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: sessionData }) => {
      const token = sessionData?.session?.access_token;
      if (token) load(token);
      else setLoading(false);
    });
  }, [routeReady, demoMode, sessionChecked, user, load]);

  const estates = useMemo(() => (Array.isArray(data?.estates) ? data.estates : []), [data]);
  const selectedEstate = estates.find((estate) => String(estate.id) === String(estateId)) || estates[0] || null;
  const model = useMemo(() => (selectedEstate ? buildParticipantEstateModel(selectedEstate) : null), [selectedEstate]);

  const openTask = (task) => {
    if (typeof document !== 'undefined') {
      const opener = document.activeElement;
      taskOpenerRef.current = opener && typeof opener.focus === 'function' ? opener : null;
    }
    setSelectedTask(task);
    setSaveError('');
    setNotice('');
  };

  const closeTaskSheet = useCallback(() => {
    setSelectedTask(null);
    const opener = taskOpenerRef.current;
    taskOpenerRef.current = null;
    if (opener && typeof opener.focus === 'function') {
      if (typeof window !== 'undefined') window.setTimeout(() => opener.focus(), 0);
      else opener.focus();
    }
  }, []);

  // Optimistically update one scoped item in local state. Mirrors the legacy
  // setData reducer so the surface reflects the change before the reload.
  const applyLocalUpdate = (kind, id, action, note) => {
    const nextStatus = statusForParticipantAction(action);
    setData((prev) => {
      if (!prev?.estates) return prev;
      return {
        ...prev,
        estates: prev.estates.map((estate) => ({
          ...estate,
          tasks: kind === 'task' ? (estate.tasks || []).map((item) => (item.id === id ? { ...item, status: nextStatus || item.status, notes: note || item.notes, last_action_at: new Date().toISOString() } : item)) : estate.tasks,
          actions: kind === 'action' ? (estate.actions || []).map((item) => (item.id === id ? { ...item, status: nextStatus || item.status, delivery_status: nextStatus || item.delivery_status, notes: note || item.notes, last_action_at: new Date().toISOString() } : item)) : estate.actions,
        })),
      };
    });
  };

  // participantAction — note-gated POST /api/participantAction (or local demo write).
  // Terminal-status 409s and other server errors surface verbatim.
  const participantAction = async (task, action, note) => {
    const kind = task._kind || 'task';
    const id = task.id;
    if (taskActionRequiresNote(action) && !String(note || '').trim()) {
      setSaveError('Add a short proof, waiting, or help note first so the coordinator knows what changed.');
      return;
    }
    // Demo: local transition only, no production write.
    if (demoMode) {
      applyLocalUpdate(kind, id, action, note);
      setNotice((action === 'handled' ? 'Handled. ' : 'Demo update saved. ') + 'The coordinator would see this update on the family record. No production record changed.');
      closeTaskSheet();
      return;
    }
    if (!supabase?.auth) {
      setSaveError('Sign-in is not configured in this environment. Demo mode can preview this without saving.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setNotice('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { setSaveError('Your session expired. Sign in again to save this.'); return; }
      const res = await fetch('/api/participantAction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ kind, id, action, notes: note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setSaveError(json.error || 'Passage could not save that update. Please try again.'); return; }
      applyLocalUpdate(kind, id, action, note);
      setNotice((json.confirmation || actionConfirmation(action)) + (action === 'handled' ? ' Thanks - this helps keep the family on track.' : ' Passage is tracking this for the coordinator.'));
      closeTaskSheet();
      await load(token);
    } catch (err) {
      setSaveError(err?.message || 'Passage could not save that update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Activation-circle confirm (POST /api/activationCircle).
  const confirmActivation = async (workflowId, requestId) => {
    if (!supabase?.auth) { setNotice('Sign in to confirm activation.'); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    try {
      const res = await fetch('/api/activationCircle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ workflowId, action: 'confirm', requestId, note: 'Reviewed and confirmed from the participant workspace.' }),
      });
      const json = await res.json().catch(() => ({}));
      setNotice(res.ok
        ? (json.activated ? 'Activation confirmed. The planning record is now active.' : 'Your activation confirmation is saved. Passage is waiting for the second trusted confirmation.')
        : (json.error || 'Passage could not save this activation confirmation.'));
      await load(token);
    } catch (err) {
      setNotice(err?.message || 'Passage could not save this activation confirmation.');
    }
  };

  const changeEstate = (nextId) => {
    setEstateId(nextId);
    setNotice('');
    if (typeof window !== 'undefined' && !demoMode) {
      const url = new URL(window.location.href);
      url.searchParams.set('estate', nextId);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const signOut = async () => {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
    setData(null);
  };

  const startGoogle = () => {
    if (typeof window === 'undefined') return;
    window.location.assign('/auth/google?next=' + encodeURIComponent(redirectPath || PARTICIPATING_PATH));
  };

  const signedOut = sessionChecked && !user && !demoMode;

  return (
    <div style={{ minHeight: '100vh', background: DS.color.page, fontFamily: SANS, padding: '18px 8px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <AppShell brand="Passage" active="People" frame="app">
        {!routeReady || (loading && !signedOut) ? <LoadingState /> : signedOut ? (
          <SignInPanel redirectPath={redirectPath} onGoogle={startGoogle} />
        ) : (
          <div style={{ padding: '18px 18px 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 4px' }}>{demoMode ? 'Sample scoped requests' : 'Your scoped requests'}</p>
                <h1 style={{ ...TYPE.display, color: DS.color.ink, margin: 0 }}>{model?.estateName || 'Family record'}</h1>
              </div>
              {user && !demoMode && (
                <button type="button" onClick={signOut} style={{ minHeight: DS.tap.min, border: `1px solid ${DS.color.border}`, background: DS.color.card, color: DS.color.mid, borderRadius: DS.radius.md, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, padding: '8px 10px', cursor: 'pointer' }}>Sign out</button>
              )}
            </div>

            {demoMode && <div style={{ marginBottom: 12 }}><Banner tone="warn">Sample mode. No live messages or production request records are changed.</Banner></div>}

            {estates.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <Select aria-label="Choose family record" value={estateId} onChange={(event) => changeEstate(event.target.value)}>
                  {estates.map((estate) => <option key={estate.id} value={estate.id}>{estateOptionLabel(estate)}</option>)}
                </Select>
              </div>
            )}

            {error && <div style={{ marginBottom: 14 }}><Banner tone="danger">{error}</Banner></div>}

            {model && (
              <p style={{ ...TYPE.small, color: DS.color.mid, margin: '0 0 12px' }}>
                You are helping {model.coordinatorName} with this family. You only see your scoped requests &mdash; never the full family record.
              </p>
            )}

            {model && <ActivationReview estate={model} onConfirm={confirmActivation} />}

            {model && serviceLine(model.raw) && (
              <div style={{ marginBottom: 14 }}>
                <Banner tone="info">Service: {serviceLine(model.raw)}</Banner>
              </div>
            )}

            {model ? (
              <>
                <ProgressLine done={model.done} total={model.total} />

                {model.startHere ? (
                  <>
                    <SectionLabel>Start here</SectionLabel>
                    <HeroTask task={model.startHere} onOpen={openTask} />
                  </>
                ) : (
                  <Card style={{ marginTop: 18 }}>
                    <p style={{ ...TYPE.label, color: DS.color.sageDeep, margin: '0 0 8px' }}>Nothing needs you right now</p>
                    <h2 style={{ ...TYPE.h2, color: DS.color.ink, margin: 0 }}>Your scoped requests are quiet.</h2>
                    <p style={{ ...TYPE.small, color: DS.color.mid, margin: '8px 0 0' }}>When the coordinator asks you to help with something, Passage will bring it back to the top.</p>
                  </Card>
                )}

                {model.whenReady.length > 0 && (
                  <>
                    <SectionLabel>When you&rsquo;re ready</SectionLabel>
                    <Card pad={6}>{model.whenReady.map((task) => <TaskRow key={task.id} task={task} onOpen={openTask} />)}</Card>
                  </>
                )}

                {model.waiting.length > 0 && (
                  <>
                    <SectionLabel>Waiting on others</SectionLabel>
                    <Card pad={6}>{model.waiting.map((task) => <TaskRow key={task.id} task={task} onOpen={openTask} muted />)}</Card>
                  </>
                )}

                {model.proofSaved.length > 0 && (
                  <>
                    <SectionLabel>Proof saved</SectionLabel>
                    <Card pad={6}>{model.proofSaved.map((task) => <TaskRow key={task.id} task={task} onOpen={openTask} muted />)}</Card>
                  </>
                )}

                {notice && <div style={{ marginTop: 14 }}><Banner tone="success">{notice}</Banner></div>}

                <div style={{ marginTop: 14 }}>
                  <Banner tone="info">You only see your scoped requests for this family. Private notes, unrelated requests, and the full family record stay hidden.</Banner>
                </div>
              </>
            ) : (!error && (
              <Card style={{ marginTop: 14 }}>
                <p style={{ ...TYPE.body, color: DS.color.mid, margin: 0 }}>
                  No scoped requests yet. When the coordinator asks you to help, your request appears here so you can own it, mark waiting, ask for help, or save proof.
                </p>
              </Card>
            ))}
          </div>
        )}
      </AppShell>

      <ParticipantTaskSheet
        task={selectedTask}
        saving={saving}
        error={saveError}
        notice={notice}
        onClose={closeTaskSheet}
        onSave={(task, action, note) => participantAction(task, action, note)}
      />
    </div>
  );
}
