import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseBrowser';
import { RoleActionStrip, SiteHeader, SiteFooter, StatusBadge } from '../components/SiteChrome';
import { taskDisplayTitle as sharedTaskTitle, taskExpectedUpdate } from '../lib/communicationCenter';
import { taskActionConfirmation, taskActionPlaceholder, taskActionPrompt, taskActionRequiresNote, taskActionStatus } from '../lib/taskActions';
import { getTaskPlaybook } from '../lib/taskPlaybooks';
import { taskExplanationFor, taskWorkspaceFor } from '../lib/taskWorkspace';
import { friendlyAuthError, isLikelyEmail, normalizeEmail } from '../lib/authFeedback';

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
      notifications: [
        {
          id: 'demo-participant-notice-1',
          recipient: 'demo-helper@passage.local',
          status: 'sent',
          statusLabel: 'sent',
          title: 'Task assignment email',
          subject: 'Passage task assignment: Send cemetery plot details',
          detail: 'Passage emailed this scoped request and saved the delivery trail for the coordinator.',
          at: '2026-05-08T14:00:00Z',
        },
      ],
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
  if (value === 'blocked') return 'Needs help';
  if (value === 'acknowledged') return 'Confirmed';
  if (value === 'sent' || value === 'assigned' || value === 'waiting' || value === 'pending') return 'Waiting for confirmation';
  if (value === 'handled' || value === 'completed' || value === 'done') return 'Handled';
  return 'Draft';
}

function isHandled(value) {
  if (value && typeof value === 'object') {
    const status = String(value.status || value.delivery_status || value.outcome_status || '').toLowerCase();
    const outcome = String(value.outcome_status || '').toLowerCase();
    return ['handled', 'completed', 'done', 'not_applicable', 'cancelled'].includes(status)
      || ['handled', 'completed', 'done'].includes(outcome)
      || Boolean(value.completed_at || value.handled_at);
  }
  return ['handled', 'completed', 'done', 'not_applicable', 'cancelled'].includes(String(value || '').toLowerCase());
}

function effectiveItemStatus(item) {
  if (isHandled(item)) return 'handled';
  const status = String(item?.status || '').toLowerCase();
  const delivery = String(item?.delivery_status || '').toLowerCase();
  if (isHandled(delivery) || ['blocked', 'waiting', 'acknowledged', 'needs_review'].includes(delivery)) return delivery;
  return status || delivery || 'assigned';
}

function recommendedParticipantAction(availableActions, status) {
  const normalized = String(status || '').toLowerCase();
  const findAction = (key) => availableActions.find(([action]) => action === key);
  if (['assigned', 'sent', 'pending', ''].includes(normalized)) {
    return findAction('accept') || availableActions[0];
  }
  if (['acknowledged', 'waiting', 'blocked', 'needs_review'].includes(normalized)) {
    return findAction('handled') || findAction('confirmed') || availableActions[0];
  }
  return findAction('handled') || findAction('confirmed') || availableActions[0];
}

function recommendedParticipantCopy(action) {
  if (action === 'accept') return 'Start here if you can take this on. Passage keeps the request open until you mark what is waiting or say it is done.';
  if (action === 'waiting') return 'Use this if you started but need a reply, document, date, or decision before the coordinator can move on.';
  if (action === 'handled' || action === 'confirmed') return 'Use this only when your part is truly complete. Passage saves your note and moves this out of your active work.';
  return 'Send one clear update so the coordinator knows what changed.';
}

function participantActionSaveLabel(action) {
  if (action === 'save_note') return 'Save update';
  if (action === 'accept') return 'I own this';
  if (action === 'waiting') return 'Mark waiting';
  if (action === 'handled' || action === 'confirmed') return 'Mark done with proof';
  if (action === 'help' || action === 'needs_details' || action === 'unavailable') return 'Ask coordinator for help';
  if (action === 'quoted') return 'Save quote update';
  if (action === 'scheduled') return 'Save scheduled update';
  return 'Send update';
}

function participantActionEffectCopy(action) {
  if (action === 'save_note') return 'This saves a note for the coordinator without changing the task status.';
  if (action === 'accept') return 'This tells the coordinator you are taking responsibility. The task stays open until you save proof or a waiting update.';
  if (action === 'waiting') return 'This keeps the task open and shows exactly what you are waiting on.';
  if (action === 'handled' || action === 'confirmed') return 'This marks your part done, saves your note, and moves it out of your active work.';
  if (action === 'help' || action === 'needs_details' || action === 'unavailable') return 'This keeps the task visible as needing help so the coordinator can step in.';
  if (action === 'quoted' || action === 'scheduled') return 'This saves your update to the same family record without exposing the full workspace.';
  return 'This update goes back to the coordinator and stays attached to the family record.';
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

function openItemCount(estate) {
  return normalizeItems(estate).filter(item => !isHandled(item)).length;
}

function chooseParticipantEstate(estates = [], query = {}, previousId = '') {
  const linkedEstate = String(query.estate || '').trim();
  if (linkedEstate && estates.some(estate => estate.id === linkedEstate)) return linkedEstate;
  const linkedTask = String(query.task || '').trim();
  if (linkedTask) {
    const taskEstate = estates.find(estate => normalizeItems(estate).some(item => item.id === linkedTask));
    if (taskEstate?.id) return taskEstate.id;
  }
  if (previousId && estates.some(estate => estate.id === previousId && openItemCount(estate) > 0)) return previousId;
  const firstOpen = estates.find(estate => openItemCount(estate) > 0);
  return firstOpen?.id || previousId || estates[0]?.id || '';
}

function participantEstateLabel(estate) {
  return estate?.deceased_name || estate?.name || 'Family record';
}

function itemTitle(item) {
  return sharedTaskTitle(item);
}

function itemDescription(item) {
  return item.description || item.body || '';
}

function itemStatus(item) {
  return effectiveItemStatus(item);
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
    ['handled', 'Mark done with proof'],
  ];
  if (kind === 'executor') return [
    ['accept', 'I own this'],
    ['waiting', 'Mark waiting'],
    ['needs_details', 'Documents needed'],
    ['handled', 'Done with proof'],
  ];
  return [
    ['accept', 'I own this'],
    ['waiting', 'Mark waiting'],
    ['handled', 'Mark done with proof'],
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
    label: 'Assigned family request',
    action: 'Choose I own this if you can help, or mark waiting so the family is not guessing.',
    authority: 'Only handle legal, financial, or account steps if you have authority or the coordinator confirms it.',
    serviceLine: 'Estate: ' + (estate?.deceased_name || estate?.name || 'this estate'),
    payer: 'Keep confirmation numbers, deadlines, and document requests in the notes.'
  };
  return {
    label: 'Your part',
    action: 'Accept it if you can help, mark waiting if you are stuck, or ask for help.',
    authority: 'You are responsible for this request only, not the whole family record.',
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

function ActivationReviewCard({ estate, onConfirm }) {
  const review = estate?.activationReview;
  if (!review?.request || review.request.status !== 'pending') return null;
  const requester = review.request.requested_by_name || review.request.requested_by_email || 'Someone in the activation circle';
  const already = review.alreadyConfirmed;
  const needsSecond = review.needsSecondConfirmation;
  return (
    <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}55`, borderRadius: 18, padding: 16, marginBottom: 14 }}>
      <div style={{ color: C.amber, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Activation review</div>
      <div style={{ color: C.ink, fontSize: 21, lineHeight: 1.2, fontWeight: 900 }}>Confirm whether this planning record should become active.</div>
      <div style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.6, marginTop: 8 }}>
        {requester} started the review. Passage requires two different trusted confirmations before a planning record becomes active urgent coordination.
      </div>
      {review.request.reason && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 11px', color: C.mid, fontSize: 12.8, lineHeight: 1.5, marginTop: 10 }}>
          <strong style={{ color: C.ink }}>Reason shared:</strong> {review.request.reason}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 8, marginTop: 10 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px' }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Your role</div>
          <div style={{ color: C.ink, fontSize: 12.5, lineHeight: 1.35, fontWeight: 900, marginTop: 3 }}>{review.witness?.role || 'Activation witness'}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px' }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Progress</div>
          <div style={{ color: C.ink, fontSize: 12.5, lineHeight: 1.35, fontWeight: 900, marginTop: 3 }}>{review.confirmations?.length || 1} of 2 confirmations saved</div>
        </div>
      </div>
      {already ? (
        <div style={{ color: C.sage, background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 11px', fontSize: 13, fontWeight: 900, lineHeight: 1.45, marginTop: 10 }}>
          Your confirmation is saved. Passage is waiting for a second trusted person before activation completes.
        </div>
      ) : needsSecond ? (
        <button onClick={() => onConfirm(estate.id, review.request.id)} style={{ width: '100%', minHeight: 46, border: 'none', borderRadius: 13, background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, fontSize: 14, cursor: 'pointer', marginTop: 12 }}>
          Confirm activation
        </button>
      ) : (
        <div style={{ color: C.amber, fontSize: 12.8, lineHeight: 1.5, fontWeight: 800, marginTop: 10 }}>
          A second trusted person must confirm. The person who started the request cannot be the second validator.
        </div>
      )}
    </div>
  );
}

function ParticipantItem({ item, notes, onNotes, onAction, linked, primary, estate }) {
  const handled = isHandled(item);
  const kind = roleKind(estate?.role, item);
  const contract = requestContract(kind, estate, item);
  const playbook = getTaskPlaybook(itemTitle(item));
  const workspace = taskWorkspaceFor({ ...item, playbook }, {
    estateName: estate?.deceased_name || estate?.name || 'this estate',
    coordinatorName: estate?.coordinator_name || 'the coordinator',
    surface: 'your assigned task',
  });
  const explanation = taskExplanationFor(item, {
    estateName: estate?.deceased_name || estate?.name || 'this family record',
    coordinatorName: estate?.coordinator_name || 'the coordinator',
    roleKind: kind,
    output: workspace.output,
    guidance: workspace.guidance,
  });
  const officialStatus = handled ? "Status: Handled" : itemStatus(item) === 'acknowledged' ? 'Status: Confirmed' : itemStatus(item) === 'blocked' ? 'Status: Needs help' : itemStatus(item) === 'assigned' || itemStatus(item) === 'sent' ? 'Status: Awaiting your confirmation' : 'This has been requested by the family';
  const rawExpectedUpdate = taskExpectedUpdate(item, 'participant');
  const expectedUpdate = /waiting for an owner/i.test(rawExpectedUpdate)
    ? 'Waiting for your update - accept it, mark what is waiting, or record proof.'
    : rawExpectedUpdate;
  const statusTone = handled ? C.sage : itemStatus(item) === 'blocked' ? C.rose : C.amber;
  const statusBg = handled ? C.sageFaint : itemStatus(item) === 'blocked' ? C.roseFaint : C.amberFaint;
  const [savedPulse, setSavedPulse] = useState(false);
  const [localSavedNote, setLocalSavedNote] = useState('');
  const [proofWarning, setProofWarning] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const responseDialogOpen = Boolean(pendingAction || detailsOpen);
  const availableActions = actionSet(kind);
  const recommendedAction = recommendedParticipantAction(availableActions, itemStatus(item));
  const savedNote = String(localSavedNote || item.notes || '').trim();
  const coordinatorLabel = estate?.coordinator_name || 'The coordinator';
  const assignedIdentity = String(item.assigned_to_name || item.assigned_to_email || item.recipient_name || item.recipient_email || '').trim();
  const ownerSummary = handled
    ? 'Handled by you'
    : assignedIdentity
      ? `Assigned to ${assignedIdentity}`
      : 'Assigned to you';
  const notificationSummary = handled
    ? `${coordinatorLabel} can see the proof, timestamp, and note.`
    : `${coordinatorLabel} receives your update. Nothing is shared with everyone else from this card.`;
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
  useEffect(() => {
    setLocalSavedNote('');
    setSavedPulse(false);
  }, [item.id, item.notes]);
  const noteChange = (value) => {
    onNotes(value);
    setSavedPulse(false);
    setProofWarning('');
  };
  const submitAction = (action) => {
    if (taskActionRequiresNote(action) && !String(notes || '').trim()) {
      setProofWarning('Add a short note first so the coordinator knows what changed.');
      return;
    }
    setProofWarning('');
    onAction(action);
    setPendingAction('');
    setDetailsOpen(false);
  };
  const actionLabel = (action) => {
    if (action === 'save_note') return 'Save update';
    if (action === 'help') return 'I need help';
    if (action === 'unavailable') return "I can't handle this";
    const found = actionSet(kind).find(row => row[0] === action);
    return found ? found[1] : 'Send update';
  };
  return (
    <div style={{ border: `1px solid ${linked ? C.sage : C.border}`, borderLeft: `5px solid ${statusTone}`, background: '#fffdf9', borderRadius: 18, padding: primary ? 18 : 15, marginTop: 12, color: C.mid, fontSize: 14, lineHeight: 1.45, boxShadow: primary ? '0 10px 26px rgba(55,45,35,.055)' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: primary ? 20 : 16, color: C.ink, fontWeight: 800, lineHeight: 1.25 }}>{itemTitle(item)}</div>
          {primary && <div style={{ fontSize: 11, color: C.sage, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 5 }}>Your part in this family record</div>}
        </div>
        <StatusBadge status={itemStatus(item)} label={statusLabel(itemStatus(item))} />
      </div>
      <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 15, padding: primary ? '14px 15px' : '12px 13px', marginBottom: 10 }}>
        <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>Your one request</div>
        <div style={{ color: C.ink, fontSize: primary ? 16 : 14, lineHeight: 1.42, fontWeight: 900 }}>{explanation.what}</div>
        <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 6 }}>Owner: <strong style={{ color: C.ink }}>{ownerSummary}</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 8, marginTop: 11 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px' }}>
            <div style={{ color: C.sage, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Action needed</div>
            <div style={{ color: C.ink, fontSize: 12.2, lineHeight: 1.35, fontWeight: 900, marginTop: 3 }}>{contract.action}</div>
          </div>
          <div style={{ background: statusBg, border: `1px solid ${statusTone}33`, borderRadius: 12, padding: '9px 10px' }}>
            <div style={{ color: statusTone, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Waiting on</div>
            <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.35, fontWeight: 800, marginTop: 3 }}>{expectedUpdate}</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px' }}>
            <div style={{ color: C.sage, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Status and proof</div>
            <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.35, fontWeight: 800, marginTop: 3 }}>{notificationSummary}</div>
          </div>
        </div>
      </div>
      <details style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px', marginBottom: 9 }}>
        <summary style={{ color: C.sage, cursor: 'pointer', fontSize: 12.5, fontWeight: 900 }}>Why this matters and what done means</summary>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 7, marginTop: 9 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px' }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Why it matters</div>
            <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 3 }}>{explanation.why}</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px' }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>What done means</div>
            <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 3 }}>{explanation.done}</div>
          </div>
        </div>
        <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 8 }}>
          <strong style={{ color: C.ink }}>Access boundary:</strong> The full estate workspace, private notes, and unrelated requests stay hidden.
        </div>
      </details>
      {(savedPulse || savedNote) && (
        <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 12, padding: '10px 11px', marginTop: 8, marginBottom: 9, color: C.mid, fontSize: 12.6, lineHeight: 1.45 }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>{savedPulse ? 'Saved to the record' : 'Saved note the coordinator can see'}</div>
          <div style={{ color: C.ink, fontWeight: 800 }}>{savedNote || 'Your note was saved to Passage.'}</div>
          {item.last_action_at && <div style={{ color: C.soft, fontSize: 11.5, marginTop: 5 }}>Saved {new Date(item.last_action_at).toLocaleString()}</div>}
        </div>
      )}
      {!handled && (
        <>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 9, marginTop: 8 }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Best next step</div>
            <button onClick={() => setPendingAction(recommendedAction[0])} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, minHeight: 42, padding: '0 12px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontSize: 12.8, fontWeight: 900, width: '100%', textAlign: 'left' }}>{recommendedAction[1]}</button>
            <div style={{ color: C.mid, fontSize: 11.6, lineHeight: 1.4, marginTop: 6 }}>{recommendedParticipantCopy(recommendedAction[0])}</div>
          </div>
          <div className="participant-action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 7, marginTop: 8 }}>
            {availableActions.filter(([action]) => action !== recommendedAction[0]).map(([action, label]) => (
              <button key={action} onClick={() => setPendingAction(action)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 11, minHeight: 38, padding: '0 10px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontSize: 12.2, fontWeight: 800 }}>{label}</button>
            ))}
            <button onClick={() => setPendingAction('save_note')} style={{ border: `1px solid ${C.sage}55`, background: C.sageFaint, color: C.sage, borderRadius: 11, minHeight: 38, padding: '0 10px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontWeight: 800, fontSize: 12.2 }}>Save update</button>
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
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px', color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 12 }}>
                      <strong style={{ color: C.ink }}>After you save:</strong> {participantActionEffectCopy(pendingAction)}
                    </div>
                    <textarea value={notes} onChange={e => noteChange(e.target.value)} placeholder={taskActionPlaceholder(pendingAction === 'save_note' ? 'handled' : pendingAction, item, 'participant') || 'Add proof, what is waiting, or what help you need'} style={{ width: '100%', boxSizing: 'border-box', minHeight: primary ? 112 : 92, marginTop: 12, padding: '10px 11px', borderRadius: 11, border: `1px solid ${proofWarning ? C.rose : C.border}`, background: C.bg, color: C.ink, fontFamily: 'Georgia,serif', fontSize: 13, lineHeight: 1.45 }} />
                    <div style={{ fontSize: 11.5, color: proofWarning ? C.rose : C.soft, fontWeight: proofWarning ? 800 : 400, marginTop: 6 }}>
                      {proofWarning || 'This update goes back to the coordinator and stays attached to the family record.'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      <button onClick={() => {
                        if (pendingAction === 'save_note') {
                          const trimmedNote = String(notes || '').trim();
                          if (!trimmedNote) {
                            setProofWarning('Add the note you want the coordinator to see before saving.');
                            return;
                          }
                          setLocalSavedNote(trimmedNote);
                          onAction('save_note');
                          setSavedPulse(true);
                          setPendingAction('');
                          setDetailsOpen(false);
                          setTimeout(() => setSavedPulse(false), 1800);
                          return;
                        }
                        submitAction(pendingAction);
                      }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 12, minHeight: 44, padding: '0 14px', fontFamily: 'Georgia,serif', cursor: 'pointer', fontWeight: 900 }}>{participantActionSaveLabel(pendingAction)}</button>
                      <button onClick={() => { setPendingAction(''); setDetailsOpen(false); setProofWarning(''); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 12, minHeight: 44, padding: '0 14px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {handled && (
        <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 12, padding: '10px 11px', color: C.sage, fontWeight: 800, fontSize: 12.5, lineHeight: 1.45 }}>
          Done. No more action is needed here. The coordinator can see your proof, timestamp, and note on the family record.
        </div>
      )}
    </div>
  );
}

function participantUrgentContext(estate = {}) {
  const context = estate?.scopedUrgentContext || estate?.orchestration_summary?.chaplain_context || estate?.orchestration_summary?.planning_context || {};
  const maps = {
    deathContext: {
      unexpected: 'At home and unexpected',
      hospice: 'Under hospice care',
      hospital: 'In a hospital',
      facility: 'In a care facility',
      home_expected: 'Expected at home',
      past: 'Past first official steps',
    },
    pronouncementStatus: {
      confirmed: 'Officially confirmed',
      needed: 'Needs confirmation',
      unsure: 'Not sure yet',
    },
    funeralHomeHandoffIntent: {
      known: 'Funeral home known',
      request_help: 'Family needs help choosing',
      not_ready: 'Not ready yet',
    },
  };
  return [
    ['Situation', maps.deathContext[context.deathContext] || context.deathContext],
    ['Pronouncement', maps.pronouncementStatus[context.pronouncementStatus] || context.pronouncementStatus],
    ['Funeral home', maps.funeralHomeHandoffIntent[context.funeralHomeHandoffIntent] || context.funeralHomeHandoffIntent],
  ].filter(([, value]) => String(value || '').trim());
}

export default function ParticipatingPage() {
  const router = useRouter();
  const [clientSearch, setClientSearch] = useState('');
  const requestedDemoMode = router.query.demoTour === 'funeral-home' || router.query.demo === '1' || clientSearch.includes('demoTour=funeral-home') || clientSearch.includes('demo=1');
  const [demoMode, setDemoMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [emailLogin, setEmailLogin] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState('');
  const [notesByItem, setNotesByItem] = useState({});
  const [expandedEstateId, setExpandedEstateId] = useState('');
  const [showHandled, setShowHandled] = useState({});
  const [showOtherOpen, setShowOtherOpen] = useState({});
  const [actionNotice, setActionNotice] = useState('');
  const [acceptedInviteToken, setAcceptedInviteToken] = useState('');
  const [lastFocusedItem, setLastFocusedItem] = useState(null);

  function openParticipantEstate(estateId) {
    setExpandedEstateId(estateId);
    setActionNotice('');
    if (router.query.estate === estateId) return;
    router.push({ pathname: '/participating', query: { estate: estateId } }, undefined, { shallow: true });
  }

  useEffect(() => {
    if (typeof window !== 'undefined') setClientSearch(window.location.search || '');
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (requestedDemoMode) {
      setDemoMode(true);
      setData(demoParticipantContext);
      setExpandedEstateId('demo-participant-estate');
      setLoading(false);
      if (supabase?.auth) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) setUser(session.user);
        }).catch(() => {});
      }
      return undefined;
    }
    if (!supabase?.auth) {
      setLoading(false);
      setError('Sign-in is not configured in this environment.');
      return undefined;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setDemoMode(false);
      setUser(session?.user || null);
      if (session?.access_token) load(session.access_token);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setDemoMode(false);
      setUser(session?.user || null);
      if (session?.access_token) load(session.access_token);
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [router.isReady, router.query.estate, router.query.task, requestedDemoMode]);

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
      setExpandedEstateId(prev => chooseParticipantEstate(json.estates, {
        estate: router.query.estate || acceptedInvite?.estateId,
        task: router.query.task || acceptedInvite?.taskId,
      }, prev));
    }
    setLoading(false);
  }

  async function participantAction(kind, id, action) {
    setLastFocusedItem({ kind, id });
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
          actions: (estate.actions || []).map(item => item.id === id ? { ...item, status: nextStatus || item.status, delivery_status: nextStatus || item.delivery_status, notes: note || item.notes, last_action_at: new Date().toISOString() } : item),
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
      setActionNotice((action === 'handled' ? 'Handled. ' : 'Demo update saved. ') + 'The coordinator would see this update on the family record.');
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

  async function confirmActivation(estateId, requestId) {
    if (!supabase?.auth) {
      setActionNotice('Sign in to confirm activation.');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    const response = await fetch('/api/activationCircle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        workflowId: estateId,
        action: 'confirm',
        requestId,
        note: 'Reviewed and confirmed from the participant workspace.',
      }),
    });
    const json = await response.json().catch(() => ({}));
    setActionNotice(response.ok
      ? (json.activated ? 'Activation confirmed. The planning record is now active.' : 'Your activation confirmation is saved. Passage is waiting for the second trusted confirmation.')
      : (json.error || 'Passage could not save this activation confirmation.'));
    await load(token);
  }

  async function signOut() {
    if (!supabase?.auth) return;
    await supabase.auth.signOut();
    setUser(null);
    setData(null);
  }

  async function sendMagicLink() {
    const cleanEmail = normalizeEmail(emailLogin);
    setMagicError('');
    setMagicSent(false);
    if (!cleanEmail) {
      setMagicError('Enter the email address that received the invite.');
      return;
    }
    if (!isLikelyEmail(cleanEmail)) {
      setMagicError('Enter a valid email address, like name@example.com.');
      return;
    }
    if (!supabase?.auth) {
      setMagicError('Sign-in is not configured in this environment.');
      return;
    }
    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail, options: { emailRedirectTo: SITE_URL + (router.asPath || '/participating') } });
    setMagicLoading(false);
    if (error) setMagicError(friendlyAuthError(error));
    else {
      setEmailLogin(cleanEmail);
      setMagicSent(true);
    }
  }

  return (
    <main className="participant-page" style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <style>{`
        .participant-page, .participant-page * { box-sizing: border-box; }
        .participant-page { overflow-x: hidden; }
        .participant-shell { width: min(1040px, 100%); margin: 0 auto; padding: 22px 28px 36px; }
        .participant-shell, .participant-estate-card, .participant-estate-card * { min-width: 0; max-width: 100%; }
        @media (max-width: 760px) {
          .participant-layout { grid-template-columns: 1fr !important; }
          .participant-estate-summary { grid-template-columns: 1fr !important; }
          .participant-action-grid { grid-template-columns: 1fr !important; }
          .participant-helper-points { grid-template-columns: 1fr !important; }
          .participant-shell { width: 100% !important; padding: 18px 18px 30px !important; }
          .participant-estate-card { width: 100% !important; min-width: 0 !important; }
          .participant-estate-head { padding: 15px 16px 10px !important; }
          .participant-estate-body { padding: 0 16px 16px !important; }
          .participant-estate-head-main { flex-direction: column !important; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />

      <section className="participant-shell">
        <div style={{ maxWidth: 760, marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Private family request</div>
          <h1 style={{ fontSize: 30, lineHeight: 1.08, margin: '0 0 7px', fontWeight: 400 }}>{user || demoMode ? 'Open the family request assigned to you.' : 'Sign in to open your assigned request.'}</h1>
          <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.5, margin: 0 }}>
            {user || demoMode
              ? 'Passage shows only the part the family or coordinator asked you to handle. Work one request at a time, then leave the rest of the record private.'
              : 'Use the email that received the invite. Passage opens only your assigned request; unrelated estate details stay private.'}
          </p>
        </div>

        {!user && !demoMode && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.78fr) minmax(320px,1fr)', gap: 18, alignItems: 'start' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
              <div style={{ color: C.sage, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900 }}>Participant access</div>
              <h2 style={{ fontSize: 52, lineHeight: .98, margin: '10px 0 12px', fontWeight: 400 }}>Help with one request, without opening the whole record.</h2>
              <p style={{ color: C.mid, fontSize: 15.5, lineHeight: 1.62, margin: 0 }}>
                Participants are relatives, friends, clergy, vendors, or helpers invited to handle one specific responsibility. Passage shows the request, waiting point, and proof needed. The full estate workspace stays private.
              </p>
              <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 13, padding: 12, color: C.mid, fontSize: 13.2, lineHeight: 1.45, marginTop: 16 }}>
                Use the same email that received the invite. If you were added under a different email, sign in with that address or ask the coordinator to resend the assignment.
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, boxShadow: '0 12px 34px rgba(55,45,35,.055)' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>Open your private Passage request.</div>
                <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7, marginTop: 0 }}>
                  Sign in with Google or send a secure email link. After sign-in, you will land on the specific request assigned to you.
                </p>
                <button onClick={() => signIn(router.asPath || '/participating')} style={{ width: '100%', border: 'none', borderRadius: 13, padding: '14px 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
                <div style={{ height: 12 }} />
                {!magicSent ? (
                  <>
                    <input value={emailLogin} onChange={e => { setEmailLogin(e.target.value); setMagicError(''); setMagicSent(false); }} type="email" placeholder="Or enter your email" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 13, border: `1.5px solid ${magicError ? C.rose : C.border}`, fontFamily: 'Georgia,serif', marginBottom: 8 }} />
                    {magicError && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 12, padding: 10, fontSize: 13, lineHeight: 1.45, marginBottom: 8 }}>{magicError}</div>}
                    <button disabled={magicLoading} onClick={sendMagicLink} style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 18px', background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: magicLoading ? 'wait' : 'pointer', opacity: magicLoading ? .65 : 1 }}>{magicLoading ? 'Sending...' : 'Email me a sign-in link'}</button>
                  </>
                ) : (
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 14, padding: '14px 15px', color: C.mid, fontSize: 13.2, lineHeight: 1.55 }}>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>Sent</div>
                    <strong style={{ color: C.ink }}>Check your email.</strong> We sent a secure sign-in link to <strong style={{ color: C.ink }}>{emailLogin}</strong>. Open it on this device to see the task the family assigned to you.
                  </div>
                )}
              </div>
              {[
                ['See your part', 'Only the assigned request, details, and safe service context appear.'],
                ['Answer once', 'Accept it, ask for help, mark waiting, save a note, or close with proof.'],
                ['Coordinator sees it', 'Your update returns to the family record with status, note, and timestamp.'],
              ].map(([title, body]) => (
                <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '15px 16px' }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 13.3, lineHeight: 1.45, marginTop: 5 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {demoMode && <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, color: C.amber, borderRadius: 14, padding: 13, marginBottom: 14, fontWeight: 900 }}>Demo participant view. Updates change this screen only; no email, SMS, or production record is changed.</div>}
        {(user || demoMode) && loading && <div style={{ color: C.soft }}>Loading participating estates...</div>}
        {(user || demoMode) && error && <div style={{ color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16 }}>{error}</div>}

        {(user || demoMode) && !loading && data && (
          <div className="participant-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
            <div>
              {data.estates.length > 0 && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 18, marginBottom: 14, boxShadow: '0 12px 34px rgba(55,45,35,.045)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: 520 }}>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Private helper view</div>
                      <div style={{ color: C.ink, fontSize: 22, lineHeight: 1.18, fontWeight: 900 }}>Your role is intentionally scoped.</div>
                      <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.6, margin: '7px 0 0' }}>
                        You can answer the request, leave a note, or mark what is waiting. The coordinator sees the update; unrelated family details stay out of view.
                      </p>
                    </div>
                    <div className="participant-helper-points" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(130px, 1fr))', gap: 8, flex: '1 1 390px' }}>
                      {[
                        ['See your request', 'Only the assigned work appears.'],
                        ['Reply once', 'No repeated calls or side threads.'],
                        ['Proof is saved', 'Status and notes return to the record.'],
                      ].map(([title, body]) => (
                        <div key={title} style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 13, padding: '10px 11px' }}>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{title}</div>
                          <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.42, marginTop: 4 }}>{body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
                      : 'If someone invited you with a different email, sign in with that address. When you are assigned a request, it will appear here.'}
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
                        const openCount = items.filter(item => !isHandled(item)).length;
                        const selected = expandedEstateId === estate.id;
                        const label = participantEstateLabel(estate);
                        return (
                          <button key={estate.id} onClick={() => openParticipantEstate(estate.id)} style={{ border: `1px solid ${selected ? C.sage : C.border}`, background: selected ? C.sageFaint : C.card, color: selected ? C.sage : C.mid, borderRadius: 999, minHeight: 38, padding: '0 13px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer', fontSize: 12.8 }}>
                            {selected ? 'Viewing' : 'Switch to'} {label} - {openCount ? `${openCount} open` : 'All clear'}
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
                  const openItems = items.filter(item => !isHandled(item));
                  const handledItems = items.filter(item => isHandled(item));
                  const linkedItem = items.find(item => item.id === router.query.task);
                  const focusedItem = lastFocusedItem ? items.find(item => item.id === lastFocusedItem.id && item._kind === lastFocusedItem.kind) : null;
                  const activeLinkedItem = linkedItem && !isHandled(linkedItem) ? linkedItem : null;
                  const activeFocusedItem = focusedItem && !isHandled(focusedItem) ? focusedItem : null;
                  const primaryItem = activeLinkedItem || activeFocusedItem || openItems[0] || linkedItem || focusedItem || handledItems[0];
                  const otherOpen = openItems.filter(item => item.id !== primaryItem?.id);
                  const showOpenList = showOtherOpen[estate.id];
                  const allClear = openItems.length === 0;
                  const urgentContext = participantUrgentContext(estate);
                  return (
                <div className="participant-estate-card" key={estate.id} data-demo-anchor="demo-participant-work" style={{ background: C.card, border: `1px solid ${C.sage}88`, borderRadius: 22, padding: 0, marginBottom: 14, overflow: 'hidden', boxShadow: '0 14px 38px rgba(55,45,35,.05)' }}>
                  <div className="participant-estate-head" style={{ width: '100%', background: C.sageFaint, border: 'none', padding: '20px 22px 14px', fontFamily: 'Georgia,serif', textAlign: 'left' }}>
                  <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Family request workspace</div>
                  <div className="participant-estate-head-main" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: 22, lineHeight: 1.2, color: C.ink }}>{estate.deceased_name || estate.name || 'Estate plan'}</div>
                      <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>You are helping as {estate.role || 'a participant'}. Coordinator: {estate.coordinator_name || 'Family coordinator'}{estate.coordinator_email ? ` (${estate.coordinator_email})` : ''}</div>
                      <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 7 }}>
                        {allClear
                          ? 'Nothing else is needed from you right now. This page becomes your receipt for what was handled and when it was saved.'
                          : 'Start with the request below. You can accept it, explain what is waiting, ask for help, or mark it done with proof.'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: openItems.length ? C.rose : C.sage, background: openItems.length ? C.roseFaint : C.sageFaint, borderRadius: 999, padding: '4px 9px' }}>{openItems.length ? `${openItems.length} need you` : 'All clear'}</span>
                        {handledItems.length > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: C.sage, background: C.sageFaint, borderRadius: 999, padding: '4px 9px' }}>{handledItems.length} handled</span>}
                        {estate.events.length > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: C.mid, background: C.sageFaint, borderRadius: 999, padding: '4px 9px' }}>{estate.events.length} service detail{estate.events.length === 1 ? '' : 's'}</span>}
                      </div>
                    </div>
                    <span style={{ background: C.card, color: estate.status === 'triggered' ? C.rose : C.sage, borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}>{estate.status || 'active'}</span>
                  </div>
                  {urgentContext.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 14, padding: '10px 11px', marginTop: 12 }}>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Context for your request</div>
                      <div style={{ color: C.mid, fontSize: 12.4, lineHeight: 1.45, marginTop: 5 }}>The coordinator is asking for help from an active family record. You only see the context needed for your assigned work.</div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
                        {urgentContext.map(([label, value]) => (
                          <span key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 999, padding: '5px 8px', color: C.mid, fontSize: 11.5 }}>
                            <strong style={{ color: C.ink }}>{label}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>

                    <div className="participant-estate-body" style={{ padding: '18px 22px 22px' }}>
                      <div className="participant-estate-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9, marginBottom: 12 }}>
                        {[
                          ['Your request', allClear ? 'Everything assigned to you is handled' : primaryItem ? itemTitle(primaryItem) : 'Nothing open'],
                          ['Needs your reply', openItems.length],
                          ['Saved for coordinator', estate.coordinationSpine?.latest?.length || 0],
                        ].map(([label, value]) => (
                          <div key={label} style={{ background: label === 'Your request' ? C.card : C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 13, padding: '11px 12px' }}>
                            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                            <div style={{ fontSize: label === 'Your request' ? 13 : 18, color: C.ink, marginTop: 3, lineHeight: 1.25, fontWeight: 800 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 14, padding: '11px 12px', marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Notification status</div>
                            <div style={{ color: C.ink, fontSize: 15, lineHeight: 1.25, fontWeight: 900, marginTop: 3 }}>What Passage has sent or saved for you</div>
                          </div>
                          <span style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 999, padding: '5px 9px', color: C.sage, fontSize: 11.5, fontWeight: 900 }}>
                            {(estate.coordinationSpine?.notifications || []).length} notice{(estate.coordinationSpine?.notifications || []).length === 1 ? '' : 's'}
                          </span>
                        </div>
                        {(estate.coordinationSpine?.notifications || []).length > 0 ? (
                          <div style={{ display: 'grid', gap: 7, marginTop: 9 }}>
                            {estate.coordinationSpine.notifications.slice(0, 3).map(row => (
                              <div key={row.id || row.at || row.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 9px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                                  <strong style={{ color: C.ink, fontSize: 12.6 }}>{row.recipient || row.recipient_email || row.title || 'Passage notice'}</strong>
                                  <span style={{ color: /failed|blocked|cancelled/i.test(String(row.status || '')) ? C.rose : C.sage, fontSize: 11, fontWeight: 900 }}>{row.statusLabel || row.status || 'recorded'}</span>
                                </div>
                                <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.38, marginTop: 3 }}>{row.detail || row.subject || row.title || 'Delivery tracked in Passage.'}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: C.mid, fontSize: 12.4, lineHeight: 1.45, marginTop: 7 }}>If Passage emails you, assigns you a task, or sends a reminder, the coordinator can see that delivery trail here. Your replies and notes are saved back to the family record.</div>
                        )}
                      </div>
                      {allClear && (
                        <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 18, padding: 18, marginBottom: 12, color: C.mid }}>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>All set</div>
                          <div style={{ color: C.ink, fontSize: 22, lineHeight: 1.18, fontWeight: 900 }}>You are all set.</div>
                          <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: '8px 0 0' }}>
                            Nothing else is needed from you on this family record right now. The coordinator can see your status, timestamp, and proof in Passage. If they need another update, Passage will bring you back to one clear request.
                          </p>
                          {primaryItem && (
                            <div style={{ marginTop: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 11px' }}>
                              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Most recent handled item</div>
                              <div style={{ color: C.ink, fontSize: 15, fontWeight: 900, marginTop: 4 }}>{itemTitle(primaryItem)}</div>
                              <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{taskExpectedUpdate(primaryItem, 'participant') || 'Saved to the family record.'}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {primaryItem && !allClear && (
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

                      <ActivationReviewCard estate={estate} onConfirm={confirmActivation} />

                      {estate.coordinationSpine?.latest?.length > 0 && (
                        <details style={{ marginTop: 12, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', background: C.card }}>
                          <summary style={{ cursor: 'pointer', color: C.ink, fontSize: 13, fontWeight: 900 }}>Updates saved to the family record</summary>
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
                            {showHandled[estate.id] ? 'Hide completed receipt' : allClear ? 'Show completed receipt' : `Show ${handledItems.length} handled item${handledItems.length === 1 ? '' : 's'}`}
                          </button>
                          {showHandled[estate.id] && handledItems.slice(0, 8).map(item => (
                            <div key={(item.id || itemTitle(item)) + 'handled'} style={{ borderTop: `1px solid ${C.border}`, padding: '9px 2px', fontSize: 13, color: C.mid }}>
                              <strong style={{ color: C.ink }}>{itemTitle(item)}</strong><br />Handled. The coordinator can see this on the family record.
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