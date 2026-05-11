import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseBrowser';
import { RoleActionStrip, SiteHeader, SiteFooter, StatusBadge } from '../components/SiteChrome';
import { taskDisplayTitle as sharedTaskTitle, taskExpectedUpdate } from '../lib/communicationCenter';
import { taskActionConfirmation, taskActionPlaceholder, taskActionPrompt, taskActionRequiresNote, taskActionStatus } from '../lib/taskActions';
import { getTaskPlaybook } from '../lib/taskPlaybooks';
import { taskWorkspaceFor } from '../lib/taskWorkspace';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#b07d2e', amberFaint: '#fdf8ee' };
const demoParticipantContext = {
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
      {
        id: 'demo-participant-task',
        title: 'Send cemetery plot details',
        description: 'Michael asked you for the cemetery section, lot number, and a photo of the deed if you have it.',
        status: 'assigned',
        notes: '',
      },
      {
        id: 'demo-participant-task-waiting',
        title: 'Confirm pallbearer names',
        description: 'Reply with the names you know, or mark waiting if you need to ask the family.',
        status: 'waiting',
        notes: '',
      },
    ],
    actions: [],
    coordinationSpine: {
      conversation: [],
      proof: [],
      notifications: [],
      attentionItems: [],
      latest: [
        {
          id: 'demo-latest-1',
          layer: 'notification',
          layerLabel: 'Notification',
          title: 'Assignment prepared',
          detail: 'Passage linked this request to the family record. Demo mode does not send email or SMS.',
          at: '2026-05-08T14:00:00Z',
          statusLabel: 'prepared',
        },
      ],
    },
  }],
};

async function signIn(returnTo = '/participating') {
  if (!supabase?.auth) return;
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: SITE_URL + returnTo } });
}

function statusLabel(value) {
  if (value === 'needs_review') return 'Needs review';
  if (value === 'blocked') return 'Blocked';
  if (value === 'acknowledged') return 'Confirmed';
  if (value === 'sent' || value === 'assigned' || value === 'waiting' || value === 'pending') return 'Waiting for confirmation';
  if (value === 'handled' || value === 'completed' || value === 'done') return 'Handled';
  return 'Draft';
}

function isHandled(value) {
  return ['handled', 'completed', 'done'].includes(value || '');
}

function normalizeItems(estate) {
  const seen = new Set();
  return [...(estate.tasks || []).map(t => ({ ...t, _kind: 'task' })), ...(estate.actions || []).map(a => ({ ...a, _kind: 'action' }))]
    .filter(item => {
      const title = item.title || item.subject || item.action_type || 'Estate coordination';
      const key = [item._kind, item.id || title, title, item.status || item.delivery_status || ''].join(':');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function itemTitle(item) {
  return sharedTaskTitle(item);
}

function itemDescription(item) {
  return item.description || item.body || '';
}

function itemStatus(item) {
  return item.status || item.delivery_status || 'assigned';
}

function roleKind(role, item) {
  const text = [role, itemTitle(item), itemDescription(item)].join(' ').toLowerCase();
  if (text.includes('florist') || text.includes('flower') || text.includes('vendor') || text.includes('caterer')) return 'vendor';
  if (text.includes('pastor') || text.includes('officiant') || text.includes('rabbi') || text.includes('priest') || text.includes('imam') || text.includes('clergy')) return 'officiant';
  if (text.includes('executor') || text.includes('attorney') || text.includes('probate') || text.includes('bank') || text.includes('insurance')) return 'executor';
  return 'helper';
}

function actionSet(kind) {
  if (kind === 'officiant') return [
    ['confirmed', 'I can officiate'],
    ['needs_details', 'I need service details'],
    ['unavailable', 'I cannot help'],
  ];
  if (kind === 'vendor') return [
    ['needs_details', 'Need details'],
    ['quoted', 'Quote sent'],
    ['scheduled', 'Scheduled'],
    ['handled', 'Mark handled'],
  ];
  if (kind === 'executor') return [
    ['accept', 'I own this task'],
    ['waiting', 'Waiting on reply'],
    ['needs_details', 'Documents needed'],
    ['handled', 'This is handled'],
  ];
  return [
    ['accept', 'Accept responsibility'],
    ['waiting', 'Waiting on reply'],
    ['handled', 'Mark done'],
  ];
}

function requestContract(kind, estate, item) {
  const coordinator = estate?.coordinator_name || 'The coordinator';
  const service = (estate?.events || [])[0];
  const serviceLine = service ? `${service.name || service.event_type || 'Service'}${service.date ? `, ${service.date}` : ''}${service.time ? ` at ${service.time}` : ''}${service.location_name ? `, ${service.location_name}` : ''}` : 'Service details will appear here when the family adds them.';
  if (kind === 'vendor') return {
    label: 'Vendor request',
    action: 'Confirm whether you can provide this service, or ask for the missing details.',
    authority: 'This is a coordination request. Treat payment, pricing, and final approval as separate until the coordinator confirms them.',
    serviceLine,
    payer: 'Payment / approval: confirm with ' + coordinator + ' before placing an order.'
  };
  if (kind === 'officiant') return {
    label: 'Officiant request',
    action: 'Confirm whether you are available, or ask for service details if anything is missing.',
    authority: coordinator + ' is the family contact for this request.',
    serviceLine,
    payer: 'No payment or honorarium is confirmed inside Passage unless the coordinator adds it in notes.'
  };
  if (kind === 'executor') return {
    label: 'Responsible family task',
    action: 'Accept ownership if you can carry this, or mark what is waiting so the family is not guessing.',
    authority: 'Only handle legal, financial, or account steps if you have authority or the coordinator confirms it.',
    serviceLine: 'Estate: ' + (estate?.deceased_name || estate?.name || 'this estate'),
    payer: 'Keep confirmation numbers, deadlines, and document requests in the notes.'
  };
  return {
    label: 'Family helper task',
    action: 'Accept it if you can help, mark waiting if you are blocked, or ask for help.',
    authority: 'You are responsible for this task only, not the whole estate.',
    serviceLine,
    payer: 'The coordinator will see your update.'
  };
}

function actionConfirmation(action) {
  return taskActionConfirmation(action, null, 'participant');
}

function statusForParticipantAction(action) {
  return taskActionStatus(action) || 'needs_review';
}

function ParticipantItem({ item, notes, onNotes, onAction, linked, primary, estate }) {
  const handled = isHandled(itemStatus(item));
  const kind = roleKind(estate?.role, item);
  const contract = requestContract(kind, estate, item);
  const playbook = getTaskPlaybook(itemTitle(item));
  const workspace = taskWorkspaceFor({ ...item, playbook }, {
    estateName: estate?.deceased_name || estate?.name || 'this estate',
    coordinatorName: estate?.coordinator_name || 'the coordinator',
    surface: 'your assigned task',
  });
  const officialStatus = handled ? "Status: Handled" : itemStatus(item) === 'acknowledged' ? 'Status: Confirmed' : itemStatus(item) === 'blocked' ? 'Status: Needs help' : itemStatus(item) === 'assigned' || itemStatus(item) === 'sent' ? 'Status: Awaiting your confirmation' : 'This has been requested by the family';
  const rawExpectedUpdate = taskExpectedUpdate(item, 'participant');
  const expectedUpdate = /waiting for an owner/i.test(rawExpectedUpdate)
    ? 'Waiting for your update - accept it, mark what is waiting, or record proof.'
    : rawExpectedUpdate;
  const statusTone = handled ? C.sage : itemStatus(item) === 'blocked' ? C.rose : C.amber;
  const statusBg = handled ? C.sageFaint : itemStatus(item) === 'blocked' ? C.roseFaint : C.amberFaint;
  const [savedPulse, setSavedPulse] = useState(false);
  const [proofWarning, setProofWarning] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const responseDialogOpen = Boolean(pendingAction || detailsOpen);
  const availableActions = actionSet(kind);
  const recommendedAction = availableActions.find(([action]) => action === 'handled' || action === 'confirmed') || availableActions[0];
  useEffect(() => {
    if (!responseDialogOpen || typeof window === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setPendingAction('');
        setDetailsOpen(false);
        setProofWarning('');
      }
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [responseDialogOpen]);
  const noteChange = (value) => {
    onNotes(value);
    setSavedPulse(false);
    setProofWarning('');
  };
  const submitAction = (action) => {
    if (taskActionRequiresNote(action) && !String(notes || '').trim()) {
      setProofWarning('Add a short proof, blocker, or waiting note first so the coordinator knows what changed.');
      return;
    }
    setProofWarning('');
    onAction(action);
    setPendingAction('');
    setDetailsOpen(false);
  };
  const actionLabel = (action) => {
    if (action === 'save_note') return 'Save note';
    if (action === 'help') return 'I need help';
    if (action === 'unavailable') return "I can't handle this";
    const found = actionSet(kind).find(row => row[0] === action);
    return found ? found[1] : 'Send update';
  };
  return (
    <div style={{ border: `1px solid ${linked ? C.sage : C.border}`, borderLeft: `5px solid ${statusTone}`, background: C.card, borderRadius: 16, padding: primary ? 15 : 13, marginTop: 12, color: C.mid, fontSize: 14, lineHeight: 1.45, boxShadow: primary ? '0 4px 18px rgba(0,0,0,.04)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: primary ? 20 : 16, color: C.ink, fontWeight: 800, lineHeight: 1.25 }}>{itemTitle(item)}</div>
          {primary && <div style={{ fontSize: 11, color: C.sage, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 5 }}>Your next responsibility</div>}
        </div>
        <StatusBadge status={itemStatus(item)} label={statusLabel(itemStatus(item))} />
      </div>
      {primary && (
        <div style={{ marginBottom: 9 }}>
          <RoleActionStrip
            compact
            role={contract.label}
            action={contract.action}
            waiting={expectedUpdate}
            proof={`${estate?.coordinator_name || 'The coordinator'} sees status, note, and timestamp.`}
            privacy="The full estate workspace, private notes, and unrelated tasks stay hidden."
          />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(160px, .8fr)', gap: 8, marginBottom: 9 }}>
        <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px' }}>
          <div style={{ fontSize: 10, color: C.sage, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{contract.label}</div>
          <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.38, fontWeight: 800, marginTop: 3 }}>{contract.action}</div>
        </div>
        <div style={{ background: statusBg, border: `1px solid ${statusTone}33`, borderRadius: 12, padding: '9px 10px' }}>
          <div style={{ fontSize: 10, color: statusTone, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Waiting point</div>
          <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.38, marginTop: 3 }}>{expectedUpdate}</div>
        </div>
      </div>
      {!handled && (
        <>
          {savedPulse && <div style={{ fontSize: 11.5, color: C.sage, fontWeight: 800, marginTop: 4 }}>Note saved to Passage.</div>}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 9, marginTop: 8 }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Recommended next action</div>
            <button onClick={() => setPendingAction(recommendedAction[0])} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, minHeight: 42, padding: '0 12px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontSize: 12.8, fontWeight: 900, width: '100%', textAlign: 'left' }}>{recommendedAction[1]}</button>
            <div style={{ color: C.mid, fontSize: 11.6, lineHeight: 1.4, marginTop: 6 }}>Use this when the task is truly handled. If something is missing, choose another response below so the coordinator sees the waiting point.</div>
          </div>
          <div className="participant-action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 7, marginTop: 8 }}>
            {availableActions.filter(([action]) => action !== recommendedAction[0]).map(([action, label]) => (
              <button key={action} onClick={() => setPendingAction(action)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 11, minHeight: 38, padding: '0 10px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontSize: 12.2, fontWeight: 800 }}>{label}</button>
            ))}
            <button onClick={() => setPendingAction('save_note')} style={{ border: `1px solid ${C.sage}55`, background: C.sageFaint, color: C.sage, borderRadius: 11, minHeight: 38, padding: '0 10px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontWeight: 800, fontSize: 12.2 }}>Save note</button>
            <button onClick={() => setPendingAction('help')} style={{ color: C.mid, background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, minHeight: 38, padding: '0 10px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontSize: 12.2 }}>I need help</button>
            <button onClick={() => setPendingAction('unavailable')} style={{ color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 11, minHeight: 38, padding: '0 10px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontSize: 12.2 }}>Can't handle</button>
          </div>
          <button onClick={() => setDetailsOpen(true)} style={{ border: 'none', background: 'transparent', color: C.sage, fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, padding: '9px 0 0', cursor: 'pointer' }}>Open details, proof, and visibility</button>
          {(pendingAction || detailsOpen) && (
            <div onClick={() => { setPendingAction(''); setDetailsOpen(false); setProofWarning(''); }} style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
              <div role="dialog" aria-modal="true" aria-label="Respond to assigned task" onClick={event => event.stopPropagation()} style={{ width: 'min(640px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: C.sage, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.12em' }}>Task response</div>
                    <div style={{ fontSize: 21, color: C.ink, lineHeight: 1.2, fontWeight: 900, marginTop: 4 }}>{pendingAction ? actionLabel(pendingAction) : itemTitle(item)}</div>
                  </div>
                  <button onClick={() => { setPendingAction(''); setDetailsOpen(false); setProofWarning(''); }} aria-label="Close response" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 34, height: 34, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
                </div>
                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 12, padding: 11, color: C.mid, fontSize: 12.5, lineHeight: 1.48 }}>
                    <strong style={{ color: C.ink }}>Proof:</strong> {workspace.proofDestination}<br />
                    <strong style={{ color: C.ink }}>Output/request:</strong> {workspace.output.label}. {workspace.output.body}<br />
                    {workspace.guidance?.why && <><strong style={{ color: C.ink }}>Why this matters:</strong> {workspace.guidance.why}<br /></>}
                    <strong style={{ color: C.ink }}>Visibility:</strong> you only see this responsibility; the coordinator sees the update in the family record. No email or SMS is sent from this dialog.
                    {itemDescription(item) && <div style={{ marginTop: 6 }}>{itemDescription(item)}</div>}
                  </div>
                </div>
                {pendingAction && (
                  <>
                    <textarea value={notes} onChange={e => noteChange(e.target.value)} placeholder={taskActionPlaceholder(pendingAction === 'save_note' ? 'handled' : pendingAction, item, 'participant') || 'Add proof, what is waiting, or what help you need'} style={{ width: '100%', boxSizing: 'border-box', minHeight: primary ? 112 : 92, marginTop: 12, padding: '10px 11px', borderRadius: 11, border: `1px solid ${proofWarning ? C.rose : C.border}`, background: C.bg, color: C.ink, fontFamily: 'Georgia,serif', fontSize: 13, lineHeight: 1.45 }} />
                    <div style={{ fontSize: 11.5, color: proofWarning ? C.rose : C.soft, fontWeight: proofWarning ? 800 : 400, marginTop: 6 }}>
                      {proofWarning || 'This update goes back to the coordinator and stays attached to the family record.'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <button onClick={() => {
                        if (pendingAction === 'save_note') {
                          onAction('save_note');
                          setSavedPulse(true);
                          setPendingAction('');
                          setDetailsOpen(false);
                          setTimeout(() => setSavedPulse(false), 1800);
                          return;
                        }
                        submitAction(pendingAction);
                      }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 12, minHeight: 44, padding: '0 14px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontWeight: 900 }}>Send update</button>
                      <button onClick={() => { setPendingAction(''); setDetailsOpen(false); setProofWarning(''); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 12, minHeight: 44, padding: '0 14px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {handled && <div style={{ color: C.sage, fontWeight: 800, fontSize: 12 }}>This is handled. The coordinator can see your update.</div>}
    </div>
  );
}

export default function ParticipatingPage() {
  const router = useRouter();
  const [clientSearch, setClientSearch] = useState('');
  const demoMode = router.query.demoTour === 'funeral-home' || router.query.demo === '1' || clientSearch.includes('demoTour=funeral-home') || clientSearch.includes('demo=1');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [emailLogin, setEmailLogin] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [notesByItem, setNotesByItem] = useState({});
  const [expandedEstateId, setExpandedEstateId] = useState('');
  const [showHandled, setShowHandled] = useState({});
  const [showOtherOpen, setShowOtherOpen] = useState({});
  const [actionNotice, setActionNotice] = useState('');
  const [acceptedInviteToken, setAcceptedInviteToken] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setClientSearch(window.location.search || '');
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (demoMode) {
      setUser({ email: demoParticipantContext.email });
      setData(demoParticipantContext);
      setExpandedEstateId('demo-participant-estate');
      setLoading(false);
      return undefined;
    }
    if (!supabase?.auth) {
      setLoading(false);
      setError('Sign-in is not configured in this environment. Use the demo participant view to inspect the flow.');
      return undefined;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.access_token) load(session.access_token);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.access_token) load(session.access_token);
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [router.isReady, router.query.estate, router.query.task, demoMode]);

  async function load(token) {
    setLoading(true);
    setError('');
    let acceptedInvite = null;
    const inviteToken = String(router.query.invite || router.query.token || router.query.invite_token || '').trim();
    if (inviteToken && inviteToken !== acceptedInviteToken) {
      const inviteRes = await fetch('/api/acceptParticipantInvite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ inviteToken }),
      });
      const inviteJson = await inviteRes.json().catch(() => ({}));
      if (inviteRes.ok) {
        acceptedInvite = inviteJson;
        setAcceptedInviteToken(inviteToken);
        setActionNotice('Invite accepted. Your assigned estate work is ready below.');
        if (inviteJson.redirectTo && !(router.query.estate || router.query.task)) {
          router.replace(inviteJson.redirectTo, undefined, { shallow: true });
        }
      } else {
        setAcceptedInviteToken(inviteToken);
        setActionNotice('');
        setError(inviteJson.error || 'Could not accept this invite.');
      }
    }
    const params = new URLSearchParams();
    if (router.query.estate || acceptedInvite?.estateId) params.set('estate', String(router.query.estate || acceptedInvite.estateId));
    if (router.query.task || acceptedInvite?.taskId) params.set('task', String(router.query.task || acceptedInvite.taskId));
    const r = await fetch('/api/participantContext' + (params.toString() ? '?' + params.toString() : ''), { headers: { Authorization: 'Bearer ' + token } });
    const json = await r.json();
    if (!r.ok) setError(json.error || 'Could not load participating estates.');
    else setData(json);
    if (json?.estates?.length) {
      const linkedEstate = router.query.estate;
      setExpandedEstateId(prev => linkedEstate || prev || json.estates[0].id);
    }
    setLoading(false);
  }

  async function participantAction(kind, id, action) {
    if (demoMode) {
      const note = notesByItem[kind + ':' + id] || '';
      if (taskActionRequiresNote(action) && !String(note || '').trim()) {
        setActionNotice('Add a short proof, waiting, or help note first so the coordinator knows what changed.');
        return;
      }
      const nextStatus = action === 'save_note' ? null : statusForParticipantAction(action);
      setData(prev => ({
        ...prev,
        estates: (prev?.estates || []).map(estate => ({
          ...estate,
          tasks: (estate.tasks || []).map(item => item.id === id ? { ...item, status: nextStatus || item.status, notes: note || item.notes, last_action_at: new Date().toISOString() } : item),
          coordinationSpine: {
            ...(estate.coordinationSpine || { conversation: [], proof: [], notifications: [], attentionItems: [], latest: [] }),
            latest: [{
              id: 'demo-response-' + Date.now(),
              layer: 'conversation',
              layerLabel: 'Conversation',
              title: action === 'save_note' ? 'Note saved' : actionConfirmation(action).replace(/\.$/, ''),
              detail: note || 'Demo update saved locally. No production record changed.',
              at: new Date().toISOString(),
              statusLabel: nextStatus || 'saved',
            }, ...((estate.coordinationSpine && estate.coordinationSpine.latest) || [])],
          },
        })),
      }));
      setActionNotice((action === 'handled' ? 'Handled. ' : 'Demo update saved. ') + 'The coordinator would see this update on the family record spine.');
      return;
    }
    if (!supabase?.auth) {
      setActionNotice('Sign-in is not configured in this environment. Demo mode can preview this update without saving.');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    const note = notesByItem[kind + ':' + id] || '';
    if (taskActionRequiresNote(action) && !String(note || '').trim()) {
      setActionNotice('Add a short proof, waiting, or help note before saving this update.');
      return;
    }
    const r = await fetch('/api/participantAction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ kind, id, action, notes: note }),
    });
    const json = await r.json().catch(() => ({}));
    if (r.ok) {
      const nextStatus = action === 'save_note' ? null : statusForParticipantAction(action);
      setData(prev => {
        if (!prev?.estates) return prev;
        return {
          ...prev,
          estates: prev.estates.map(estate => {
            const hasItem = kind === 'task'
              ? (estate.tasks || []).some(item => item.id === id)
              : (estate.actions || []).some(item => item.id === id);
            if (!hasItem) return estate;
            const updateItem = item => {
              if (item.id !== id) return item;
              return {
                ...item,
                status: nextStatus || item.status,
                notes: note || item.notes,
                last_action_at: new Date().toISOString(),
              };
            };
            return {
              ...estate,
              tasks: kind === 'task' ? (estate.tasks || []).map(updateItem) : estate.tasks,
              actions: kind === 'action' ? (estate.actions || []).map(updateItem) : estate.actions,
              coordinationSpine: {
                ...(estate.coordinationSpine || { conversation: [], proof: [], notifications: [], attentionItems: [], latest: [] }),
                conversation: [
                  {
                    id: 'local-' + kind + '-' + id + '-' + Date.now(),
                    layer: 'conversation',
                    layerLabel: 'Conversation',
                    title: action === 'save_note' ? 'Note saved' : (json.confirmation || actionConfirmation(action)).replace(/\.$/, ''),
                    detail: json.eventDetail || note || 'Saved in Passage.',
                    at: new Date().toISOString(),
                    statusLabel: nextStatus || 'saved',
                  },
                  ...((estate.coordinationSpine && estate.coordinationSpine.conversation) || []),
                ],
                latest: [
                {
                  id: 'local-' + kind + '-' + id + '-' + Date.now(),
                  layer: 'conversation',
                  layerLabel: 'Conversation',
                  title: action === 'save_note' ? 'Note saved' : (json.confirmation || actionConfirmation(action)).replace(/\.$/, ''),
                  detail: json.eventDetail || note || 'Saved in Passage.',
                  at: new Date().toISOString(),
                  statusLabel: nextStatus || 'saved',
                },
                  ...((estate.coordinationSpine && estate.coordinationSpine.latest) || []),
                ],
              },
            };
          }),
        };
      });
    }
    setActionNotice(r.ok
      ? (json.confirmation || actionConfirmation(action)) + (action === 'handled' ? ' Thanks - this helps keep the family on track.' : ' Passage is tracking this for the coordinator.')
      : (json.error || 'Passage could not save that update. Please try again.'));
    await load(token);
  }

  async function signOut() {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
    setData(null);
  }

  async function sendMagicLink() {
    if (!emailLogin) return;
    if (!supabase?.auth) {
      setError('Sign-in is not configured in this environment.');
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email: emailLogin, options: { emailRedirectTo: SITE_URL + (router.asPath || '/participating') } });
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <style>{`
        @media (max-width: 760px) {
          .participant-layout { grid-template-columns: 1fr !important; }
          .participant-estate-summary { grid-template-columns: 1fr !important; }
          .participant-action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '22px 28px 36px' }}>
        <div style={{ maxWidth: 760, marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Participant task spine</div>
          <h1 style={{ fontSize: 30, lineHeight: 1.08, margin: '0 0 7px', fontWeight: 400 }}>One assigned task. One safe update.</h1>
          <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.5, margin: 0 }}>Work from one estate at a time. Switch only when the family asked you to help with a different record.</p>
        </div>

        {!user && !demoMode && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, maxWidth: 520 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Open the task someone sent you.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>
              Sign in with the email that received the Passage invite. Passage will show one responsibility at a time, keep the rest of the estate private, and record proof for the coordinator.
            </p>
            <div style={{ display: 'grid', gap: 8, margin: '14px 0 16px' }}>
              {[
                ['1', 'Open the invite sent to your email.'],
                ['2', 'See the one task you were asked to help with.'],
                ['3', 'Accept, ask for details, mark waiting, or record proof.'],
                ['4', 'The coordinator sees your update in the family record.'],
              ].map(([step, text]) => (
                <div key={step} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', gap: 8, alignItems: 'flex-start', color: C.mid, fontSize: 12.8, lineHeight: 1.45 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 999, background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>{step}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => signIn(router.asPath || '/participating')} style={{ border: 'none', borderRadius: 13, padding: '14px 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
            <div style={{ height: 12 }} />
            {!magicSent ? (
              <>
                <input value={emailLogin} onChange={e => setEmailLogin(e.target.value)} type="email" placeholder="Or enter your email" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 13, border: `1.5px solid ${C.border}`, fontFamily: 'Georgia,serif', marginBottom: 8 }} />
                <button onClick={sendMagicLink} style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 18px', background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Email me a sign-in link</button>
              </>
            ) : (
              <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 14, padding: '14px 15px', color: C.mid, fontSize: 13.2, lineHeight: 1.55 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>Sent</div>
                <strong style={{ color: C.ink }}>Check your email.</strong> We sent a secure sign-in link to <strong style={{ color: C.ink }}>{emailLogin}</strong>. Open it on this device to see the task the family assigned to you.
              </div>
            )}
          </div>
        )}

        {demoMode && <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, color: C.amber, borderRadius: 14, padding: 13, marginBottom: 14, fontWeight: 900 }}>Demo participant view. Updates change this screen only; no email, SMS, or production record is changed.</div>}
        {user && loading && <div style={{ color: C.soft }}>Loading participating estates...</div>}
        {user && error && <div style={{ color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16 }}>{error}</div>}

        {user && !loading && data && (
          <div className="participant-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
            <div>
              {(router.query.estate || router.query.task) && (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 17, color: C.ink, lineHeight: 1.35, marginBottom: 6 }}>The one thing to answer first</div>
                  <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65 }}>
                    Accept it, ask for details, or record what happened. Your update goes back to the coordinator, and you can stop after this responsibility is handled.
                  </div>
                </div>
              )}
              {actionNotice && (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, marginBottom: 14, color: C.sage, fontSize: 13, fontWeight: 800, lineHeight: 1.5 }}>
                  {actionNotice}
                </div>
              )}
              {data.estates.length === 0 ? (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>
                    {(router.query.estate || router.query.task) ? 'We could not match this invite to your signed-in email.' : `No estate roles found for ${data.email} yet.`}
                  </div>
                  <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>
                    {(router.query.estate || router.query.task)
                      ? `You are signed in as ${data.email}. If the invite was sent to another address, sign out and use that email. If this is the right email, ask the coordinator to resend the assignment.`
                      : 'If someone invited you with a different email, sign in with that address. When you are assigned a task, it will appear here.'}
                  </p>
                  <button onClick={async () => {
                    if (!supabase?.auth) return;
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData?.session?.access_token) await load(sessionData.session.access_token);
                  }} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 14px', background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer', marginRight: 8 }}>Check again</button>
                  <button onClick={signOut} style={{ border: 'none', borderRadius: 12, padding: '11px 14px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Sign in with another email</button>
                </div>
              ) : <>
                {data.estates.length > 1 && !(router.query.estate || router.query.task) && (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 14, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: C.sage, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Switch estate</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {data.estates.map(estate => {
                        const items = normalizeItems(estate);
                        const openCount = items.filter(item => !isHandled(itemStatus(item))).length;
                        const selected = expandedEstateId === estate.id;
                        return (
                          <button key={estate.id} onClick={() => setExpandedEstateId(estate.id)} style={{ border: `1px solid ${selected ? C.sage : C.border}`, background: selected ? C.sageFaint : C.card, color: selected ? C.sage : C.mid, borderRadius: 999, minHeight: 38, padding: '0 13px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer', fontSize: 12.8 }}>
                            {(estate.deceased_name || estate.name || 'Estate')} ({openCount} task{openCount === 1 ? '' : 's'})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {data.estates
                .slice()
                .filter(estate => !router.query.estate || estate.id === router.query.estate)
                .filter(estate => router.query.estate || router.query.task || !expandedEstateId || estate.id === expandedEstateId)
                .sort((a, b) => (a.id === router.query.estate ? -1 : b.id === router.query.estate ? 1 : 0))
                .map(estate => {
                  const items = normalizeItems(estate).sort((a, b) => (a.id === router.query.task ? -1 : b.id === router.query.task ? 1 : 0));
                  const openItems = items.filter(item => !isHandled(itemStatus(item)));
                  const handledItems = items.filter(item => isHandled(itemStatus(item)));
                  const linkedItem = items.find(item => item.id === router.query.task);
                  const primaryItem = linkedItem || openItems[0] || handledItems[0];
                  const otherOpen = openItems.filter(item => item.id !== primaryItem?.id);
                  const showOpenList = showOtherOpen[estate.id];
                  return (
                <div key={estate.id} data-demo-anchor="demo-participant-work" style={{ background: C.card, border: `1px solid ${C.sage}`, borderRadius: 18, padding: 0, marginBottom: 14, overflow: 'hidden', boxShadow: '0 14px 38px rgba(55,45,35,.05)' }}>
                  <div style={{ width: '100%', background: 'none', border: 'none', padding: '17px 20px 12px', fontFamily: 'Georgia,serif', textAlign: 'left' }}>
                  <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Participant operating spine</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: 22, lineHeight: 1.2, color: C.ink }}>{estate.deceased_name || estate.name || 'Estate plan'}</div>
                      <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>Role: {estate.role} | Coordinator: {estate.coordinator_name || 'Family coordinator'}{estate.coordinator_email ? ` (${estate.coordinator_email})` : ''}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: openItems.length ? C.rose : C.sage, background: openItems.length ? C.roseFaint : C.sageFaint, borderRadius: 999, padding: '4px 9px' }}>{openItems.length ? `${openItems.length} need you` : 'All clear'}</span>
                        {handledItems.length > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: C.sage, background: C.sageFaint, borderRadius: 999, padding: '4px 9px' }}>{handledItems.length} handled</span>}
                        {estate.events.length > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: C.mid, background: C.sageFaint, borderRadius: 999, padding: '4px 9px' }}>{estate.events.length} service detail{estate.events.length === 1 ? '' : 's'}</span>}
                      </div>
                    </div>
                    <span style={{ background: estate.status === 'triggered' || estate.activation_status === 'activated' ? C.roseFaint : C.sageFaint, color: estate.status === 'triggered' ? C.rose : C.sage, borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>{estate.status || 'active'}</span>
                  </div>
                  </div>

                    <div style={{ padding: '0 20px 20px' }}>
                      <div className="participant-estate-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
                        {[
                          ['Asked of you', primaryItem ? itemTitle(primaryItem) : 'Nothing open'],
                          ['Still waiting', openItems.length],
                          ['Saved updates', estate.coordinationSpine?.latest?.length || 0],
                        ].map(([label, value]) => (
                          <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                            <div style={{ fontSize: 10, color: C.sage, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                            <div style={{ fontSize: label === 'Asked of you' ? 12.5 : 18, color: C.ink, marginTop: 3, lineHeight: 1.25, fontWeight: 800 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {primaryItem && (
                        <ParticipantItem
                          item={primaryItem}
                          linked={primaryItem.id === router.query.task}
                          notes={notesByItem[primaryItem._kind + ':' + primaryItem.id] || primaryItem.notes || ''}
                          onNotes={(value) => setNotesByItem(prev => ({ ...prev, [primaryItem._kind + ':' + primaryItem.id]: value }))}
                          onAction={(action) => participantAction(primaryItem._kind, primaryItem.id, action)}
                          estate={estate}
                          primary
                        />
                      )}

                      {estate.coordinationSpine?.latest?.length > 0 && (
                        <details style={{ marginTop: 12, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', background: C.card }}>
                          <summary style={{ cursor: 'pointer', color: C.ink, fontSize: 13, fontWeight: 900 }}>Recent updates the coordinator can see</summary>
                          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                            {estate.coordinationSpine.latest.slice(0, 5).map(row => (
                              <div key={row.id || row.at || row.title} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 7, color: C.mid, fontSize: 12.3, lineHeight: 1.45 }}>
                                <strong style={{ color: C.ink }}>{row.layerLabel ? `${row.layerLabel}: ` : ''}{row.title || 'Update recorded'}</strong>
                                <div>{row.detail || row.statusLabel || 'Saved in Passage.'}</div>
                                {row.expectedUpdate && <div style={{ color: C.sage, fontSize: 11.5, fontWeight: 800 }}>{row.expectedUpdate}</div>}
                                {row.at && <div style={{ color: C.soft, fontSize: 11 }}>{new Date(row.at).toLocaleString()}</div>}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                  {estate.events.length > 0 && (
                    <details style={{ marginTop: 14, background: C.sageFaint, borderRadius: 13, padding: 14 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 800, color: C.sage }}>Service information</summary>
                      {estate.events.slice(0, 3).map(ev => (
                        <div key={ev.id} style={{ fontSize: 13, color: C.mid, lineHeight: 1.65, borderTop: `1px solid ${C.border}`, padding: '7px 0' }}>
                          <strong style={{ color: C.ink }}>{ev.name || ev.event_type}</strong>{ev.date ? ` - ${ev.date}` : ''}{ev.time ? ` at ${ev.time}` : ''}<br />
                          {ev.location_name || ''}{ev.location_address ? `, ${ev.location_address}` : ''}
                        </div>
                      ))}
                      {estate.events.length > 3 && <div style={{ fontSize: 12, color: C.soft, marginTop: 6 }}>{estate.events.length - 3} more service detail{estate.events.length - 3 === 1 ? '' : 's'} saved.</div>}
                    </details>
                  )}

                      {otherOpen.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <button onClick={() => setShowOtherOpen(prev => ({ ...prev, [estate.id]: !prev[estate.id] }))} style={{ width: '100%', border: `1px solid ${C.border}`, background: C.card, borderRadius: 11, padding: '9px 12px', color: C.mid, cursor: 'pointer', fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 800, textAlign: 'left' }}>
                            {showOpenList ? 'Hide other assigned tasks' : `Show ${otherOpen.length} more task${otherOpen.length === 1 ? '' : 's'} assigned to you`}
                          </button>
                          {showOpenList && otherOpen.slice(0, 4).map(item => (
                            <ParticipantItem
                              key={(item.id || itemTitle(item)) + itemStatus(item)}
                              item={item}
                              notes={notesByItem[item._kind + ':' + item.id] || item.notes || ''}
                              onNotes={(value) => setNotesByItem(prev => ({ ...prev, [item._kind + ':' + item.id]: value }))}
                              onAction={(action) => participantAction(item._kind, item.id, action)}
                              estate={estate}
                            />
                          ))}
                          {showOpenList && otherOpen.length > 4 && <div style={{ fontSize: 12, color: C.soft, padding: '8px 0' }}>{otherOpen.length - 4} more open item{otherOpen.length - 4 === 1 ? '' : 's'} hidden to keep this page readable.</div>}
                        </div>
                      )}

                      {handledItems.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <button onClick={() => setShowHandled(prev => ({ ...prev, [estate.id]: !prev[estate.id] }))} style={{ width: '100%', border: `1px solid ${C.border}`, background: C.card, borderRadius: 11, padding: '9px 12px', color: C.mid, cursor: 'pointer', fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 800 }}>
                            {showHandled[estate.id] ? 'Hide handled items' : `Show ${handledItems.length} handled item${handledItems.length === 1 ? '' : 's'}`}
                          </button>
                          {showHandled[estate.id] && handledItems.slice(0, 8).map(item => (
                            <div key={(item.id || itemTitle(item)) + 'handled'} style={{ borderTop: `1px solid ${C.border}`, padding: '9px 2px', fontSize: 13, color: C.mid }}>
                              <strong style={{ color: C.ink }}>{itemTitle(item)}</strong><br />Handled
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
              )})}
              </>}
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
