import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
const C = { bg: '#f6f3ee', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3' };

async function signIn(returnTo = '/participating') {
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: SITE_URL + returnTo } });
}

function statusLabel(value) {
  if (value === 'needs_review') return 'Needs review';
  if (value === 'acknowledged') return 'Acknowledged';
  if (value === 'sent' || value === 'assigned') return 'Assigned';
  if (value === 'handled' || value === 'completed') return 'Handled';
  return 'Waiting';
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
  return item.title || item.subject || item.action_type || 'Estate coordination';
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
    ['delivered', 'Delivered'],
  ];
  if (kind === 'executor') return [
    ['accept', 'I own this task'],
    ['waiting', 'Waiting on reply'],
    ['needs_details', 'Documents needed'],
    ['handled', 'This is handled'],
  ];
  return [
    ['accept', 'I can handle this'],
    ['waiting', 'Waiting on reply'],
    ['handled', 'This is handled'],
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
  if (action === 'confirmed') return 'Availability confirmed. The coordinator can see it.';
  if (action === 'delivered') return 'Marked delivered. The coordinator can see it.';
  if (action === 'scheduled') return 'Marked scheduled. The coordinator can see it.';
  if (action === 'quoted') return 'Quote status saved. The coordinator can see it.';
  if (action === 'needs_details') return 'Saved as needing details. The coordinator can see what is missing.';
  if (action === 'waiting') return 'Saved as waiting. This stays visible.';
  if (action === 'unavailable') return 'Saved as unavailable. The coordinator can reassign it.';
  if (action === 'help') return 'Help request saved. The coordinator can see it.';
  if (action === 'handled') return 'This is handled. The coordinator can see your update.';
  return 'Accepted. The coordinator can see that you own this task.';
}

function ParticipantItem({ item, notes, onNotes, onAction, linked, primary, estate }) {
  const handled = isHandled(itemStatus(item));
  const kind = roleKind(estate?.role, item);
  const contract = requestContract(kind, estate, item);
  const officialStatus = handled ? "Status: Handled" : itemStatus(item) === 'acknowledged' ? 'Status: Confirmed' : itemStatus(item) === 'assigned' || itemStatus(item) === 'sent' ? 'Status: Awaiting your confirmation' : 'This has been requested by the family';
  const [savedPulse, setSavedPulse] = useState(false);
  const noteChange = (value) => {
    onNotes(value);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1400);
  };
  return (
    <div style={{ border: `1px solid ${linked ? C.sage : C.border}`, background: linked || primary ? C.sageFaint : C.card, borderRadius: 14, padding: primary ? 15 : 12, marginTop: 10, color: C.mid, fontSize: 13, lineHeight: 1.55 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: primary ? 17 : 14, color: C.ink, fontWeight: 800, lineHeight: 1.3 }}>{itemTitle(item)}</div>
          {primary && <div style={{ fontSize: 11, color: C.sage, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 5 }}>Start here</div>}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: handled ? C.sage : C.rose, background: handled ? C.card : C.roseFaint, borderRadius: 999, padding: '4px 8px', flexShrink: 0 }}>{statusLabel(itemStatus(item))}</span>
      </div>
      {primary && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '10px 11px', marginBottom: 8 }}>
          <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 800, marginBottom: 4 }}>You've been assigned this responsibility for {(estate?.deceased_name || estate?.name || 'this family')}'s estate.</div>
          <div style={{ display: 'inline-flex', color: handled ? C.sage : C.rose, background: handled ? C.sageFaint : C.roseFaint, borderRadius: 999, padding: '4px 9px', fontSize: 11.5, fontWeight: 800, marginBottom: 7 }}>{officialStatus}</div>
          <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 800 }}>Start with this one task. Passage will tell the coordinator what you decide.</div>
          <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.55, marginTop: 4 }}>
            {estate?.coordinator_name || 'The coordinator'} will see your update. You are not responsible for the whole estate.
          </div>
        </div>
      )}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '10px 11px', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', marginBottom: 5 }}>
          <div style={{ fontSize: 11, color: C.sage, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em' }}>{contract.label}</div>
          <div style={{ fontSize: 11, color: C.mid, fontWeight: 800 }}>{statusLabel(itemStatus(item))}</div>
        </div>
        <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.5, fontWeight: 800 }}>{contract.action}</div>
        <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.5, marginTop: 5 }}>{contract.serviceLine}</div>
        <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.45, marginTop: 5 }}>{contract.authority}</div>
        <div style={{ fontSize: 12, color: C.soft, lineHeight: 1.45, marginTop: 4 }}>{contract.payer}</div>
      </div>
      {itemDescription(item) && <div style={{ marginBottom: 8 }}>{itemDescription(item)}</div>}
      {!handled && (
        <>
          <textarea value={notes} onChange={e => noteChange(e.target.value)} placeholder="Add notes for the coordinator" style={{ width: '100%', boxSizing: 'border-box', minHeight: primary ? 78 : 58, marginTop: 6, padding: '9px 10px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontSize: 13, lineHeight: 1.45 }} />
          {savedPulse && <div style={{ fontSize: 11.5, color: C.sage, fontWeight: 800, marginTop: 4 }}>Saved</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {actionSet(kind).map(([action, label]) => (
              <button key={action} onClick={() => onAction(action)} style={{ border: action === 'handled' || action === 'confirmed' || action === 'delivered' ? 'none' : `1px solid ${C.border}`, background: action === 'handled' || action === 'confirmed' || action === 'delivered' ? C.sage : C.card, color: action === 'handled' || action === 'confirmed' || action === 'delivered' ? '#fff' : C.mid, borderRadius: 9, padding: '7px 11px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>{label}</button>
            ))}
            <button onClick={() => onAction('help')} style={{ color: C.mid, background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 11px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Ask for help</button>
          </div>
        </>
      )}
      {handled && <div style={{ color: C.sage, fontWeight: 800, fontSize: 12 }}>This is handled. The coordinator can see your update.</div>}
    </div>
  );
}

export default function ParticipatingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [emailLogin, setEmailLogin] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [notesByItem, setNotesByItem] = useState({});
  const [expandedEstateId, setExpandedEstateId] = useState('');
  const [showHandled, setShowHandled] = useState({});
  const [actionNotice, setActionNotice] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.access_token) load(session.access_token);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.access_token) load(session.access_token);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load(token) {
    setLoading(true);
    setError('');
    const r = await fetch('/api/participantContext', { headers: { Authorization: 'Bearer ' + token } });
    const json = await r.json();
    if (!r.ok) setError(json.error || 'Could not load participating estates.');
    else setData(json);
    if (json?.estates?.length) {
      const linkedEstate = router.query.estate;
      setExpandedEstateId(prev => prev || linkedEstate || json.estates[0].id);
    }
    setLoading(false);
  }

  async function participantAction(kind, id, action) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    const r = await fetch('/api/participantAction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ kind, id, action, notes: notesByItem[kind + ':' + id] || '' }),
    });
    setActionNotice(r.ok ? actionConfirmation(action) : 'Passage could not save that update. Please try again.');
    await load(token);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setData(null);
  }

  async function sendMagicLink() {
    if (!emailLogin) return;
    const { error } = await supabase.auth.signInWithOtp({ email: emailLogin, options: { emailRedirectTo: SITE_URL + (router.asPath || '/participating') } });
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />

      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '26px 22px 58px' }}>
        <div style={{ maxWidth: 760, marginBottom: 18 }}>
          <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Participating in an estate</div>
          <h1 style={{ fontSize: 'clamp(30px, 4vw, 40px)', lineHeight: 1.06, margin: '0 0 10px', fontWeight: 400 }}>Your Passage assignments, in one calm place.</h1>
          <p style={{ color: C.mid, fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>See the estate, the task that needs you now, and the notes the coordinator needs back. No hunting through old texts.</p>
        </div>

        {!user && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, maxWidth: 520 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Open the task someone sent you.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>
              Sign in with the email that received the Passage invite. You will only see the estate work connected to you, with the task, notes, and service details the coordinator shared.
            </p>
            <button onClick={() => signIn(router.asPath || '/participating')} style={{ border: 'none', borderRadius: 13, padding: '14px 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
            <div style={{ height: 12 }} />
            <input value={emailLogin} onChange={e => setEmailLogin(e.target.value)} type="email" placeholder="Or enter your email" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, fontFamily: 'Georgia,serif', marginBottom: 8 }} />
            <button onClick={sendMagicLink} style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 18px', background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Email me a sign-in link</button>
            {magicSent && <p style={{ color: C.sage, fontSize: 13, lineHeight: 1.6 }}>Check your email for a secure sign-in link.</p>}
          </div>
        )}

        {user && loading && <div style={{ color: C.soft }}>Loading participating estates...</div>}
        {user && error && <div style={{ color: C.rose, background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16 }}>{error}</div>}

        {user && !loading && data && (
          <div style={{ display: 'grid', gridTemplateColumns: (router.query.estate || router.query.task) ? 'minmax(0, 760px)' : 'minmax(0, 1fr) minmax(280px, 360px)', gap: 18, alignItems: 'start' }}>
            <div>
              {(router.query.estate || router.query.task) && (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 17, color: C.ink, lineHeight: 1.35, marginBottom: 6 }}>This is the task someone asked you to help with.</div>
                  <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.65 }}>
                    Start with the task below. You can accept it, ask for details, or record what happened. The coordinator will see your update in Passage.
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
                  <div style={{ fontSize: 20, marginBottom: 8 }}>No estate roles found for {data.email} yet.</div>
                  <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>If someone invited you with a different email, sign in with that address. When you are assigned a task, it will appear here.</p>
                </div>
              ) : data.estates
                .slice()
                .filter(estate => !router.query.estate || estate.id === router.query.estate)
                .sort((a, b) => (a.id === router.query.estate ? -1 : b.id === router.query.estate ? 1 : 0))
                .map(estate => {
                  const items = normalizeItems(estate).sort((a, b) => (a.id === router.query.task ? -1 : b.id === router.query.task ? 1 : 0));
                  const openItems = items.filter(item => !isHandled(itemStatus(item)));
                  const handledItems = items.filter(item => isHandled(itemStatus(item)));
                  const linkedItem = items.find(item => item.id === router.query.task);
                  const primaryItem = linkedItem || openItems[0] || handledItems[0];
                  const otherOpen = openItems.filter(item => item.id !== primaryItem?.id);
                  const expanded = expandedEstateId === estate.id;
                  const focusedInvite = Boolean(router.query.estate || router.query.task);
                  return (
                <div key={estate.id} style={{ background: C.card, border: `1px solid ${expanded ? C.sage : C.border}`, borderRadius: 18, padding: 0, marginBottom: 14, overflow: 'hidden', boxShadow: expanded ? '0 14px 38px rgba(55,45,35,.05)' : 'none' }}>
                  <button onClick={() => setExpandedEstateId(expanded ? '' : estate.id)} style={{ width: '100%', background: 'none', border: 'none', padding: 20, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>
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
                  </button>

                  {expanded && (
                    <div style={{ padding: '0 20px 20px' }}>
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

                  {estate.events.length > 0 && (
                    <div style={{ marginTop: 14, background: C.sageFaint, borderRadius: 13, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.sage, marginBottom: 8 }}>Service information</div>
                      {estate.events.slice(0, 3).map(ev => (
                        <div key={ev.id} style={{ fontSize: 13, color: C.mid, lineHeight: 1.65, borderTop: `1px solid ${C.border}`, padding: '7px 0' }}>
                          <strong style={{ color: C.ink }}>{ev.name || ev.event_type}</strong>{ev.date ? ` - ${ev.date}` : ''}{ev.time ? ` at ${ev.time}` : ''}<br />
                          {ev.location_name || ''}{ev.location_address ? `, ${ev.location_address}` : ''}
                        </div>
                      ))}
                      {estate.events.length > 3 && <div style={{ fontSize: 12, color: C.soft, marginTop: 6 }}>{estate.events.length - 3} more service detail{estate.events.length - 3 === 1 ? '' : 's'} saved.</div>}
                    </div>
                  )}

                      {otherOpen.length > 0 && !focusedInvite && (
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: C.soft, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Also assigned to you</div>
                          {otherOpen.slice(0, 4).map(item => (
                            <ParticipantItem
                              key={(item.id || itemTitle(item)) + itemStatus(item)}
                              item={item}
                              notes={notesByItem[item._kind + ':' + item.id] || item.notes || ''}
                              onNotes={(value) => setNotesByItem(prev => ({ ...prev, [item._kind + ':' + item.id]: value }))}
                              onAction={(action) => participantAction(item._kind, item.id, action)}
                              estate={estate}
                            />
                          ))}
                          {otherOpen.length > 4 && <div style={{ fontSize: 12, color: C.soft, padding: '8px 0' }}>{otherOpen.length - 4} more open item{otherOpen.length - 4 === 1 ? '' : 's'} hidden to keep this page readable.</div>}
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
                  )}
                </div>
              )})}
            </div>

            {!(router.query.estate || router.query.task) && (
              <aside style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, alignSelf: 'start' }}>
                <div style={{ fontSize: 20, lineHeight: 1.25, marginBottom: 8 }}>Planning for your own family?</div>
                <p style={{ color: C.mid, fontSize: 13, lineHeight: 1.7 }}>Participants are often the people who understand the value first. Passage can offer a quieter path to set up their own family plan.</p>
                {data.discountEligible && <div style={{ background: C.sageFaint, color: C.sage, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Participant discount eligible</div>}
                <Link href="/pricing?participant=1" style={{ display: 'block', textAlign: 'center', background: C.sage, color: '#fff', borderRadius: 12, padding: '12px 14px', textDecoration: 'none', fontWeight: 800 }}>See participant pricing</Link>
              </aside>
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
