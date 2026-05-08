import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader, SiteFooter } from '../../components/SiteChrome';
import { taskDisplayTitle as sharedTaskTitle, taskNextAction as sharedTaskNext } from '../../lib/communicationCenter';
import { taskActionConfirmation, taskActionOutcomeStatus, taskActionPlaceholder, taskActionPrompt } from '../../lib/taskActions';
import { taskOutputFor, taskProofDestination, taskRequestDraftFor } from '../../lib/taskWorkspace';
import { orchestrateTasks } from '../../lib/taskOrchestration';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C = { bg: '#f6f3ee', bgDark: '#1a1916', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#b07d2e', amberFaint: '#fdf8ee' };

function statusLabel(value) {
  if (value === 'handled' || value === 'completed' || value === 'done') return 'Handled';
  if (value === 'acknowledged') return 'Confirmed';
  if (value === 'blocked' || value === 'needs_review' || value === 'failed') return 'Needs help';
  if (value === 'sent' || value === 'waiting' || value === 'pending' || value === 'assigned') return 'Waiting for confirmation';
  return 'Draft';
}

function normalizedTaskStatus(value) {
  const clean = String(value || '').toLowerCase();
  if (clean === 'handled' || clean === 'completed' || clean === 'done') return 'done';
  if (clean === 'waiting' || clean === 'pending' || clean === 'sent' || clean === 'assigned') return 'pending';
  return clean || 'draft';
}

function vendorRequestLabel(value) {
  if (value === 'completed') return 'Completed';
  if (value === 'in_progress') return 'In progress';
  if (value === 'accepted') return 'Accepted';
  if (value === 'declined') return 'Declined';
  return 'Waiting for response';
}

function partnerCaseTypeLabel(item) {
  const stage = String(item?.setup_stage || '');
  const mode = String(item?.mode || '');
  return stage.includes('preneed') || stage.includes('prepaid') || mode === 'green'
    ? 'Pre-need / prepaid case'
    : 'At-need case';
}

const miniPill = { background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '2px 7px', fontSize: 10.5, fontWeight: 900 };

export default function FuneralHomeDashboard() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [data, setData] = useState(null);
  const [vendorPrefs, setVendorPrefs] = useState({ vendors: [], preferred: [], marketplaceEnabled: true });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');
  const [showNewCase, setShowNewCase] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [creating, setCreating] = useState(false);
  const [taskDraft, setTaskDraft] = useState(null);
  const [taskDraftNote, setTaskDraftNote] = useState('');
  const [activePartnerView, setActivePartnerView] = useState('work');
  const [latestFamilyLink, setLatestFamilyLink] = useState(null);
  const casePanelRef = useRef(null);
  const [caseForm, setCaseForm] = useState({
    funeralHomeName: '',
    caseType: 'immediate',
    personName: '',
    dateOfDeath: '',
    coordinatorName: '',
    coordinatorEmail: '',
    coordinatorPhone: '',
    caseReference: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setToken(session?.access_token || '');
      if (session?.access_token) {
        load(session.access_token);
        loadPreferredVendors(session.access_token);
      }
      else setLoading(false);
    });
  }, []);

  async function load(token) {
    setLoading(true);
    const res = await fetch('/api/partnerContext', { headers: { Authorization: 'Bearer ' + token } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not load partner dashboard.');
    else setData(json);
    setLoading(false);
  }

  async function loadPreferredVendors(accessToken = token) {
    if (!accessToken) return;
    const res = await fetch('/api/vendors/preferred', { headers: { Authorization: 'Bearer ' + accessToken } });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setVendorPrefs({ vendors: json.vendors || [], preferred: json.preferred || [], marketplaceEnabled: json.marketplaceEnabled !== false });
  }

  async function signIn() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/funeral-home/dashboard' } });
  }

  async function signInWithPassword(event) {
    event?.preventDefault?.();
    if (!partnerEmail.trim() || !partnerPassword) {
      setError('Enter the partner email and password for this workspace.');
      return;
    }
    setSigningIn(true);
    setError('');
    setNotice('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: partnerEmail.trim(),
        password: partnerPassword,
      });
      if (authError) {
        setError(authError.message || 'Could not sign in with that partner account.');
        return;
      }
      const session = authData?.session;
      setUser(session?.user || authData?.user || null);
      setToken(session?.access_token || '');
      if (session?.access_token) {
        await load(session.access_token);
        await loadPreferredVendors(session.access_token);
      }
      setNotice('Partner workspace opened. Cases, staff work, reports, and proof are ready below.');
    } finally {
      setSigningIn(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setToken('');
    setData(null);
    setVendorPrefs({ vendors: [], preferred: [], marketplaceEnabled: true });
  }

  async function toggleMarketplaceEnabled() {
    if (!token) return;
    const next = vendorPrefs.marketplaceEnabled === false;
    setUpdating('marketplace_enabled');
    const res = await fetch('/api/vendors/preferred', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ marketplaceEnabled: next }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not update local support visibility.');
    else setVendorPrefs(prev => ({ ...prev, marketplaceEnabled: next }));
    setUpdating('');
  }

  async function togglePreferredVendor(vendor) {
    if (!token || !vendor?.id) return;
    const isPreferred = (vendorPrefs.preferred || []).some(p => p.vendor_id === vendor.id && p.category === vendor.category && p.active !== false);
    setUpdating('vendor_' + vendor.id);
    const res = await fetch('/api/vendors/preferred', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ vendorId: vendor.id, category: vendor.category, active: !isPreferred }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not update preferred local support.');
    else await loadPreferredVendors(token);
    setUpdating('');
  }

  async function updateTask(task, status, detail) {
    if (!token || !task?.id) return;
    setUpdating(task.id + status);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          status,
          channel: 'record',
          recipient: task.playbook?.partnerOwnerRole || 'funeral home',
          detail,
          outcomeStatus: taskActionOutcomeStatus(status),
          actor: user?.email || 'Funeral home staff',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not update this task.');
      } else {
        const nextStatus = normalizedTaskStatus(json.task?.status || json.status || status);
        setData(prev => prev ? {
          ...prev,
          cases: (prev.cases || []).map(item => ({
            ...item,
            tasks: (item.tasks || []).map(t => t.id === task.id ? { ...t, status: nextStatus, last_action_at: new Date().toISOString(), last_actor: user?.email || 'Funeral home staff' } : t),
            partnerTasks: (item.partnerTasks || []).map(t => t.id === task.id ? { ...t, status: nextStatus, last_action_at: new Date().toISOString(), last_actor: user?.email || 'Funeral home staff' } : t),
          })),
        } : prev);
        setNotice(json.confirmation || taskActionConfirmation(status, task, 'funeral_home'));
        setTaskDraft(null);
        setTaskDraftNote('');
        await load(token);
      }
    } finally {
      setUpdating('');
    }
  }

  async function handleForFamily(task, note) {
    if (!token || !task?.id) return;
    const cleanNote = String(note || '').trim();
    if (!cleanNote) {
      setError('Add what your team actually completed before marking this handled.');
      return;
    }
    setUpdating(task.id + 'handle_for_family');
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/partnerHandleTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          taskId: task.id,
          note: cleanNote,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not handle this for the family.');
      } else {
        const nextStatus = normalizedTaskStatus(json.task?.status || json.status || 'done');
        setData(prev => prev ? {
          ...prev,
          cases: (prev.cases || []).map(item => ({
            ...item,
            tasks: (item.tasks || []).map(t => t.id === task.id ? { ...t, status: nextStatus, last_action_at: new Date().toISOString(), last_actor: user?.email || 'Funeral home staff' } : t),
            partnerTasks: (item.partnerTasks || []).map(t => t.id === task.id ? { ...t, status: nextStatus, last_action_at: new Date().toISOString(), last_actor: user?.email || 'Funeral home staff' } : t),
          })),
        } : prev);
        setTaskDraft(null);
        setTaskDraftNote('');
        setNotice(json.confirmation || 'Handled for the family. The family can see exactly what your team recorded.');
        await load(token);
      }
    } finally {
      setUpdating('');
    }
  }

  function openPartnerWork(caseId) {
    if (!caseId) return;
    setActivePartnerView('work');
    setSelectedLocation('all');
    setExpandedCaseId(caseId);
    setNotice('Opening the case work queue.');
    window.setTimeout(() => {
      const panel = document.getElementById('partner-case-' + caseId);
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setNotice('Case work is open. If the case is filtered out, switch to All locations.');
      }
    }, 80);
  }

  async function downloadExport() {
    if (!token) return;
    setError('');
    const res = await fetch('/api/partnerExport', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Could not export partner cases.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passage-partner-cases.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function emailExport() {
    if (!token) return;
    setUpdating('email_export');
    setError('');
    setNotice('');
    const res = await fetch('/api/partnerExport', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not email the CSV export.');
    else setNotice(`CSV export sent to ${json.emailedTo || user?.email || 'your email'}.`);
    setUpdating('');
  }

  async function createCase(e) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setError('');
    const res = await fetch('/api/partnerCase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(caseForm),
    });
    const json = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(json.error || 'Could not create this family case.');
      return;
    }
    if (json.familyParticipant?.created && json.familyParticipant?.inviteToken) {
      const familyUrl = `${window.location.origin}/accept?token=${json.familyParticipant.inviteToken}`;
      setLatestFamilyLink({
        workflowId: json.workflowId,
        email: caseForm.coordinatorEmail || user?.email || '',
        url: familyUrl,
      });
      setNotice('Case created. Family access is prepared; copy the handoff link when you are ready. No real email or SMS was sent.');
    } else {
      setLatestFamilyLink(null);
      setNotice(json.familyParticipant?.reason === 'missing_family_email'
        ? 'Case created. Add a family email before sending a family access link.'
        : 'Case created. Family access was not prepared yet; use the family view or coordinator email to complete the handoff.');
    }
    setShowNewCase(false);
    setCaseForm({ funeralHomeName: '', caseType: 'immediate', personName: '', dateOfDeath: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '', caseReference: '' });
    await load(token);
  }

  async function copyText(value, label = 'Copied.') {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setNotice(label);
    } catch {
      setError('Could not copy automatically. Select the link and copy it manually.');
    }
  }

  async function startPartnerCheckout(planId = 'partner_pilot') {
    if (!user || !token) return signIn();
    setError('');
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ planId, userId: user.id, userEmail: user.email }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || 'Could not start partner checkout.');
      return;
    }
    window.location.href = json.url;
  }

  const org = data?.organizations?.[0]?.organizations;
  const cases = data?.cases || [];
  const isAdminDemo = !!data?.isPassageAdmin;
  const totalBlocked = cases.reduce((sum, item) => sum + (item.blockedTasks?.length || 0), 0);
  const totalWaiting = cases.reduce((sum, item) => sum + (item.tasks || []).filter(t => ['sent', 'waiting', 'pending', 'assigned'].includes(t.status || '')).length, 0);
  const totalHandled = cases.reduce((sum, item) => sum + (item.tasks || []).filter(t => ['handled', 'completed', 'done'].includes(t.status || '')).length, 0);
  const totalCommunications = cases.reduce((sum, item) => sum + (item.communications?.length || 0), 0);
  const totalVendorRequests = cases.reduce((sum, item) => sum + (item.vendorRequests?.length || 0), 0);
  const vendorValue = (request) => Number(request?.final_value ?? (request?.final_value_cents != null ? Number(request.final_value_cents || 0) / 100 : request?.estimated_value) ?? 0);
  const totalVendorValue = cases.reduce((sum, item) => sum + (item.vendorRequests || []).reduce((inner, request) => inner + vendorValue(request), 0), 0);
  const funeralHomeShare = cases.reduce((sum, item) => sum + (item.vendorRequests || []).reduce((inner, request) => inner + Number(request.funeral_home_share_amount || 0), 0), 0);
  const assignmentsCoordinated = cases.reduce((sum, item) => sum + (item.tasks || []).filter(t => t.assigned_to_email || t.assigned_to_name || t.owner_name || t.participant_id).length, 0);
  const familyRequestsOpen = cases.reduce((sum, item) => sum + (item.waitingOnFamily?.length || 0) + (item.tasks || []).filter(t => ['blocked', 'needs_review'].includes(String(t.status || '').toLowerCase())).length, 0);
  const proofEventsLogged = cases.reduce((sum, item) => sum + (item.activity || []).filter(event => ['handled', 'completed', 'done', 'waiting', 'blocked', 'sent'].includes(String(event.status || '').toLowerCase())).length, 0);
  const callsAvoided = totalCommunications + assignmentsCoordinated + totalVendorRequests;
  const timeSavedMinutes = callsAvoided * 8;
  const timeSavedLabel = callsAvoided > 0 ? `${Math.max(1, Math.round(timeSavedMinutes / 60))} hr est.` : 'None yet';
  const reports = data?.reports || {};
  const partnerStaff = data?.staff || [];
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://www.thepassageapp.io';
  const activationStatus = data?.activationStatus || 'inactive';
  const partnerPlan = data?.partnerPlan || null;
  const partnerNeedsConfig = user && data && activationStatus === 'no_partner_record';
  const partnerTrialExpired = user && data && activationStatus === 'trial_expired';
  const glanceItems = [
    ['Active cases', cases.length],
    ['Tasks handled by Passage', totalHandled],
    ['Waiting for response', totalWaiting],
    ['Blocked items', totalBlocked],
    ['Estimated calls avoided', callsAvoided],
  ];
  const detailGlanceItems = [
    ['Coordination time saved', timeSavedLabel],
    ['Local requests coordinated', totalVendorRequests],
    ['Tracked referral value', totalVendorValue ? `$${Math.round(totalVendorValue)}` : '$0'],
  ];
  function locationNameFor(item) {
    const ref = String(item.organization_case_reference || item.case_reference || '');
    if (/MULTI-002/i.test(ref)) return 'Poughkeepsie';
    if (/MULTI/i.test(ref)) return 'Beacon';
    return item.location_name || item.branch_name || item.funeral_home_location || 'Main location';
  }

  function openCasePanel(caseType = 'immediate') {
    setCaseForm(prev => ({ ...prev, caseType }));
    setShowNewCase(true);
    setShowTools(false);
    setNotice(caseType === 'immediate'
      ? 'Create an at-need case. Add only what you know.'
      : caseType === 'prepaid'
        ? 'Create a prepaid case. Add the family contact and policy reference if you have it.'
        : 'Create a pre-need planning case. This can be for a living client or a family preparing ahead.');
    window.setTimeout(() => {
      casePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      casePanelRef.current?.querySelector('input')?.focus?.();
    }, 0);
  }
  const locations = Array.from(new Set(cases.map(locationNameFor).filter(Boolean)));
  const isMultiLocation = locations.length > 1 || /group|multi/i.test(String(org?.name || '') + ' ' + String(org?.plan || ''));
  const displayCases = isMultiLocation && selectedLocation !== 'all' ? cases.filter(item => locationNameFor(item) === selectedLocation) : cases;
  const caseOrchestrationRows = displayCases.map(item => ({
    caseItem: item,
    orchestration: orchestrateTasks({
      tasks: item.tasks || [],
      role: 'funeral_home',
      context: { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, surface: 'case work' },
    }),
  }));
  const orchestrationByCaseId = new Map(caseOrchestrationRows.map(row => [row.caseItem.id, row.orchestration]));
  const caseInbox = caseOrchestrationRows
    .map(({ caseItem, orchestration }) => ({ caseItem, task: itemNextPartnerTask(caseItem, orchestration) }))
    .filter(row => row.task)
    .slice(0, 4);
  const currentMembership = (partnerStaff || []).find(member => String(member.email || '').toLowerCase() === String(user?.email || '').toLowerCase()) || null;
  const currentRole = String(currentMembership?.role || data?.organizations?.[0]?.role || 'staff').toLowerCase();
  const isDirectorRole = /owner|admin|director|manager|location/i.test(currentRole);
  const currentUserEmail = String(user?.email || '').toLowerCase();
  const allPartnerTasks = displayCases.flatMap(item => (item.tasks || []).map(task => ({
    ...task,
    caseName: item.deceased_name || item.estate_name || item.name || 'Family case',
    caseId: item.id,
    locationName: locationNameFor(item),
  })));
  const assignedWorkQueue = allPartnerTasks
    .filter(task => !['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()))
    .filter(task => isDirectorRole || String(task.assigned_to_email || '').toLowerCase() === currentUserEmail || String(task.last_actor || '').toLowerCase() === currentUserEmail)
    .sort((a, b) => partnerTaskPriorityFromStatus(a.status) - partnerTaskPriorityFromStatus(b.status))
    .slice(0, 6);
  const roleCards = [
    ['Director / admin', 'All cases, locations, staff queues, reports, billing prompts.', isDirectorRole ? 'Your current view' : 'Managed by leadership'],
    ['Location manager', 'Location-scoped cases, staff queues, waiting items, exports.', /location|manager/i.test(currentRole) ? 'Your current view' : 'Next permission layer'],
    ['Staff / employee', 'Assigned tasks first, with case context, family messages, proof, and audit trail.', !isDirectorRole ? 'Your current view' : 'Delegation target'],
  ];
  const firstCase = displayCases[0] || cases[0] || null;
  const firstOpenCase = caseInbox[0]?.caseItem || firstCase;
  const directorLoopSteps = [
    {
      key: 'case',
      label: 'Case intake',
      proof: cases.length ? `${cases.length} active case${cases.length === 1 ? '' : 's'}` : 'No case created yet',
      done: cases.length > 0,
      waiting: false,
      next: cases.length ? 'Keep moving the oldest open family item.' : 'Create an at-need or pre-need case.',
    },
    {
      key: 'staff',
      label: 'Staff delegation',
      proof: assignmentsCoordinated ? `${assignmentsCoordinated} assignment${assignmentsCoordinated === 1 ? '' : 's'} coordinated` : 'No owner assigned yet',
      done: assignmentsCoordinated > 0,
      waiting: cases.length > 0 && assignmentsCoordinated === 0,
      next: assignmentsCoordinated ? 'Employees see assigned work first.' : 'Assign the next task to staff or a participant.',
    },
    {
      key: 'family',
      label: 'Family input',
      proof: familyRequestsOpen ? `${familyRequestsOpen} family request${familyRequestsOpen === 1 ? '' : 's'} open` : totalCommunications ? `${totalCommunications} family update${totalCommunications === 1 ? '' : 's'} logged` : 'No family request logged yet',
      done: totalCommunications > 0 || familyRequestsOpen > 0,
      waiting: familyRequestsOpen > 0,
      next: familyRequestsOpen ? 'Passage shows what is waiting and who owes it.' : 'Ask once through Passage instead of chasing calls.',
    },
    {
      key: 'proof',
      label: 'Proof and status',
      proof: proofEventsLogged ? `${proofEventsLogged} proof/status event${proofEventsLogged === 1 ? '' : 's'}` : totalHandled ? `${totalHandled} handled task${totalHandled === 1 ? '' : 's'}` : 'No proof saved yet',
      done: proofEventsLogged > 0 || totalHandled > 0,
      waiting: totalWaiting > 0,
      next: totalHandled || proofEventsLogged ? 'Family and staff see the same status truth.' : 'Record what was done, waiting, or blocked.',
    },
    {
      key: 'local',
      label: 'Local support',
      proof: totalVendorRequests ? `${totalVendorRequests} task-linked request${totalVendorRequests === 1 ? '' : 's'}` : 'No local support needed',
      done: totalVendorRequests > 0,
      waiting: totalVendorRequests > 0,
      next: totalVendorRequests ? 'Vendor status stays connected to the case.' : 'Offer trusted help only inside relevant tasks.',
    },
    {
      key: 'report',
      label: 'Report and ROI',
      proof: callsAvoided ? `${callsAvoided} call${callsAvoided === 1 ? '' : 's'} avoided estimate` : 'ROI starts after work is logged',
      done: callsAvoided > 0,
      waiting: false,
      next: callsAvoided ? 'Export a record for your existing system.' : 'Move work through Passage to produce the report.',
    },
  ];
  const nextDirectorStep = directorLoopSteps.find(step => !step.done || step.waiting) || directorLoopSteps[directorLoopSteps.length - 1];
  const directorUseCases = [
    ['Delegate', assignmentsCoordinated || assignedWorkQueue.length, 'assigned staff or participant work'],
    ['Reduce calls', callsAvoided, 'updates, assignments, and requests captured'],
    ['Ask family', familyRequestsOpen || totalCommunications, 'family inputs routed through the case'],
    ['Act for family', totalHandled, 'tasks handled with visible proof'],
    ['Coordinate support', totalVendorRequests, 'vendor requests without a directory'],
  ];

  function money(value) {
    return `$${Math.round(Number(value || 0)).toLocaleString()}`;
  }

  function roleLabel(role) {
    const clean = String(role || 'staff').replace(/_/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  function partnerTaskPriorityFromStatus(status) {
    const clean = String(status || '').toLowerCase();
    if (['blocked', 'failed', 'needs_review'].includes(clean)) return 0;
    if (['sent', 'waiting', 'pending', 'assigned'].includes(clean)) return 1;
    if (clean === 'acknowledged') return 2;
    return 3;
  }

  function itemNextPartnerTask(item, orchestration) {
    return item.nextPartnerTask
      || orchestration?.nextTask
      || (item.partnerTasks || []).find(t => !['handled', 'completed', 'done'].includes(t.status || ''))
      || (item.tasks || []).find(t => !['handled', 'completed', 'done'].includes(t.status || ''));
  }

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink }}>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 28px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Partner command center</div>
            <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: 0, fontWeight: 400 }}>{org?.name || 'Funeral home dashboard'}</h1>
            <p style={{ color: C.mid, fontSize: 15, lineHeight: 1.55, maxWidth: 620 }}>Create a case, move the next task, and keep the family informed.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {user && <button onClick={() => openCasePanel('immediate')} style={{ border: 'none', borderRadius: 14, minHeight: 52, padding: '0 18px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>New at-need case</button>}
            {user && <button onClick={() => openCasePanel('preneed')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 14, minHeight: 52, padding: '0 18px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>New pre-need case</button>}
            {user && <button onClick={downloadExport} style={{ border: `1px solid ${C.sage}33`, borderRadius: 14, minHeight: 52, padding: '0 18px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Export cases</button>}
            {user && <button onClick={() => setShowTools(v => !v)} style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 18px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>{showTools ? 'Hide tools' : 'More tools'}</button>}
            {org?.logo_url && <img src={org.logo_url} alt="" style={{ width: 54, height: 54, objectFit: 'contain', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, padding: 8 }} />}
          </div>
        </div>

        {user && (
          <input
            id="partner-csv-upload"
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file || !token) return;
              setError('');
              setNotice('');
              const csv = await file.text();
              const res = await fetch('/api/partnerImport', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                body: JSON.stringify({ csv, funeralHomeName: org?.name || '' }),
              });
              const json = await res.json().catch(() => ({}));
              event.target.value = '';
              if (!res.ok) setError(json.error || 'Could not import this CSV.');
              else {
                setNotice(`Imported ${json.imported} case${json.imported === 1 ? '' : 's'} into Passage.`);
                await load(token);
              }
            }}
          />
        )}

        {!user && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24, maxWidth: 520 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Sign in as partner staff.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Only staff connected to a Passage partner organization can view this dashboard.</p>
            {error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 12, padding: 11, color: C.rose, fontSize: 12.5, fontWeight: 800, lineHeight: 1.45, marginBottom: 10 }}>{error}</div>}
            <form onSubmit={signInWithPassword} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.11em', textTransform: 'uppercase', fontWeight: 900 }}>
                Partner email
                <input
                  value={partnerEmail}
                  onChange={event => setPartnerEmail(event.target.value)}
                  type="email"
                  placeholder="demo@collinsffh.com"
                  autoComplete="email"
                  style={{ border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.bg, padding: '12px 13px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 14 }}
                />
              </label>
              <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.11em', textTransform: 'uppercase', fontWeight: 900 }}>
                Password
                <input
                  value={partnerPassword}
                  onChange={event => setPartnerPassword(event.target.value)}
                  type="password"
                  placeholder="Partner password"
                  autoComplete="current-password"
                  style={{ border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.bg, padding: '12px 13px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 14 }}
                />
              </label>
              <button type="submit" disabled={signingIn} style={{ border: 'none', borderRadius: 13, padding: '13px 18px', background: signingIn ? C.border : C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: signingIn ? 'wait' : 'pointer' }}>
                {signingIn ? 'Opening workspace...' : 'Open partner workspace'}
              </button>
            </form>
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: 12, color: C.mid, fontSize: 12.5, lineHeight: 1.55, marginBottom: 12 }}>
              Demo partners can use the email and password Passage issued. Real partner teams can continue with Google when their domain is connected.
            </div>
            <button onClick={signIn} style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 18px', background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
          </div>
        )}

        {user && loading && <div style={{ color: C.soft }}>Loading partner cases...</div>}
        {user && error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16, color: C.rose }}>{error}</div>}
        {user && notice && <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}30`, borderRadius: 14, padding: 16, color: C.sage, marginBottom: 10 }}>{notice}</div>}
        {user && latestFamilyLink?.url && (
          <div style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 16, padding: 14, marginBottom: 14, boxShadow: '0 4px 18px rgba(0,0,0,.04)' }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Family handoff prepared</div>
            <div style={{ color: C.ink, fontSize: 17, fontWeight: 900, marginTop: 4 }}>Give the family this link when you are ready to invite them.</div>
            <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>This is the spine handoff: case created, family participant prepared, acceptance grants estate access, and future task proof stays on the case.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <input readOnly value={latestFamilyLink.url} style={{ minWidth: 0, border: `1px solid ${C.border}`, borderRadius: 11, background: C.bg, padding: '9px 10px', color: C.mid, fontFamily: 'Georgia,serif', fontSize: 12.5 }} />
              <button onClick={() => copyText(latestFamilyLink.url, 'Family handoff link copied.')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Copy link</button>
            </div>
          </div>
        )}
        {partnerNeedsConfig && (
          <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 14, padding: 16, color: C.amber, marginBottom: 12, lineHeight: 1.45 }}>
            Partner access is active, but billing/trial metadata is not linked yet. Cases and reports can still load; Passage admin should connect the partner billing record before a paid pilot.
          </div>
        )}
        {partnerTrialExpired && (
          <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, borderRadius: 14, padding: 16, color: C.rose, marginBottom: 12, lineHeight: 1.45 }}>
            This partner trial has ended. Existing cases stay visible; ask Passage to reactivate billing before creating new pilot cases.
          </div>
        )}

        {user && !loading && showTools && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Partner tools</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>Import, export, billing, and partner controls live here.</div>
              </div>
              <button onClick={() => setShowTools(false)} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 9, padding: '6px 9px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginTop: 12 }}>
              <button onClick={() => document.getElementById('partner-csv-upload')?.click()} style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Upload CSV</button>
              <a href="/api/partnerImportTemplate" style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Download template</a>
              <button onClick={emailExport} style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>{updating === 'email_export' ? 'Sending...' : 'Email CSV to me'}</button>
              <button onClick={() => startPartnerCheckout('partner_pilot')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{partnerPlan?.plan ? `Billing: ${partnerPlan.plan}` : 'Start pilot billing'}</button>
            </div>
          </div>
        )}

        {user && !loading && data && (
          <div style={{ background: C.card, color: C.ink, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Today at a glance</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>Cases, waiting items, and calls your team does not need to chase.</div>
              </div>
              <div style={{ color: C.sage, fontSize: 12, fontWeight: 800 }}>That is time back for staff.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {glanceItems.map(([label, value]) => (
                <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 14, padding: '14px 16px', minHeight: 82 }} title={label === 'Estimated calls avoided' ? 'Based on messages sent and assignments coordinated through Passage.' : ''}>
                  <div style={{ color: C.sage, fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 22, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
            {showTools && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginTop: 8 }}>
                {detailGlanceItems.map(([label, value]) => (
                  <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 10px' }}>
                    <div style={{ color: C.soft, fontSize: 9.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ color: C.ink, fontSize: 17, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 9 }}>
              CSV export is always available. Passage can sit on top of your existing system without trapping case data here.
              {funeralHomeShare > 0 && <strong style={{ color: C.sage }}> Estimated partner share tracked: ${Math.round(funeralHomeShare)}.</strong>}
            </div>
          </div>
        )}

        {user && !loading && data && (
          <DirectorOperatingLoop
            steps={directorLoopSteps}
            nextStep={nextDirectorStep}
            useCases={directorUseCases}
            firstOpenCase={firstOpenCase}
            onCreateCase={() => openCasePanel('immediate')}
            onOpenCase={openPartnerWork}
            onExport={downloadExport}
          />
        )}

        {user && !loading && data && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 12, marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              ['work', 'Case work', 'Move next tasks'],
              ['staff', 'Staff work', 'Roles and assigned work'],
              ['reports', 'Reports', 'ROI by location and employee'],
            ].map(([key, title, body]) => (
              <button key={key} onClick={() => setActivePartnerView(key)} style={{ flex: '1 1 190px', textAlign: 'left', border: `1px solid ${activePartnerView === key ? C.sage : C.border}`, background: activePartnerView === key ? C.sage : C.bg, color: activePartnerView === key ? '#fff' : C.ink, borderRadius: 14, padding: '12px 14px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{title}</div>
                <div style={{ fontSize: 11.5, opacity: .78, marginTop: 2 }}>{body}</div>
              </button>
            ))}
          </div>
        )}

        {user && !loading && data && activePartnerView === 'work' && caseInbox.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 18, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Case inbox</div>
                <div style={{ fontSize: 22, marginTop: 3 }}>Move the next item first.</div>
              </div>
              <div style={{ color: C.mid, fontSize: 12.5 }}>Each card is one place your team can reduce a follow-up call.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 12 }}>
              {caseInbox.map(({ caseItem, task }) => (
                <div key={`${caseItem.id}_${task.id}`} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 13, background: C.sageFaint }}>
                  <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{isMultiLocation ? locationNameFor(caseItem) : 'Next case'}</div>
                  <div style={{ color: C.ink, fontSize: 16, fontWeight: 900, lineHeight: 1.25, marginTop: 4 }}>{caseItem.deceased_name || caseItem.estate_name || caseItem.name || 'Family case'}</div>
                  <div style={{ color: C.sage, fontSize: 13, fontWeight: 900, lineHeight: 1.3, marginTop: 8 }}>{sharedTaskTitle(task)}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{sharedTaskNext(task, 'funeral_home')}</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                    <button onClick={() => openPartnerWork(caseItem.id)} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 900, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Open work</button>
                    <Link href={`/funeral-home/summary?id=${caseItem.id}`} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 900, textDecoration: 'none' }}>Family summary</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && !loading && data && activePartnerView === 'staff' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Staff operating spine</div>
                <div style={{ fontSize: 24, marginTop: 3 }}>Directors manage the whole floor. Employees work their queue.</div>
              </div>
              <div style={{ color: C.mid, fontSize: 12.5 }}>Role scoping uses the same task proof and communication spine.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {(partnerStaff.length ? partnerStaff : [{ email: user?.email, role: 'director', scope: 'all_cases', assignedOpen: 0, handled: totalHandled, waiting: totalWaiting, blocked: totalBlocked }]).map(member => (
                <div key={`${member.organization_id || 'org'}_${member.email || member.role}`} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 14, padding: 13 }}>
                  <div style={{ color: C.ink, fontSize: 15, fontWeight: 900 }}>{member.email || 'Invited staff member'}</div>
                  <div style={{ color: C.sage, fontSize: 11.5, fontWeight: 900, marginTop: 3 }}>{roleLabel(member.role)} - {member.scope === 'all_cases' ? 'Can see cases and reports' : 'Assigned work first'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 10 }}>
                    {[
                      ['Open', member.assignedOpen || 0],
                      ['Handled', member.handled || 0],
                      ['Waiting', member.waiting || 0],
                    ].map(([label, value]) => (
                      <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 8px' }}>
                        <div style={{ color: C.soft, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 900 }}>{label}</div>
                        <div style={{ fontSize: 17 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {member.blocked > 0 && <div style={{ color: C.rose, fontSize: 12, fontWeight: 900, marginTop: 8 }}>{member.blocked} blocked item{member.blocked === 1 ? '' : 's'}</div>}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 12 }}>
              {roleCards.map(([title, body, status]) => (
                <div key={title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{status}</div>
                  <div style={{ color: C.ink, fontSize: 16, fontWeight: 900, marginTop: 4 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8 }}>
                <div>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{isDirectorRole ? 'Delegation queue' : 'My assigned work'}</div>
                  <div style={{ fontSize: 18 }}>{isDirectorRole ? 'What staff should move next.' : 'What this employee should move next.'}</div>
                </div>
                <div style={{ color: C.mid, fontSize: 12.5 }}>Each task keeps estate context, status, proof, and audit together.</div>
              </div>
              {assignedWorkQueue.length === 0 ? (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, color: C.mid, fontSize: 13 }}>
                  No assigned work is waiting in this view. Directors can delegate from Case work; employees will land here with only their task queue and the surrounding case context they need.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {assignedWorkQueue.map(task => (
                    <div key={`${task.caseId}_${task.id}`} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                      <div>
                        <div style={{ color: C.soft, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{task.caseName} - {task.locationName}</div>
                        <div style={{ fontSize: 15.5, fontWeight: 900, marginTop: 3 }}>{sharedTaskTitle(task)}</div>
                        <div style={{ color: C.mid, fontSize: 12.5, marginTop: 3 }}>Owner: {task.assigned_to_name || task.assigned_to_email || task.last_actor || 'Unassigned'} - {statusLabel(task.status)}</div>
                      </div>
                      <button onClick={() => openPartnerWork(task.caseId)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Open work</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {user && !loading && data && activePartnerView === 'reports' && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>ROI and operations</div>
                <div style={{ fontSize: 24, marginTop: 3 }}>Show where Passage is saving work.</div>
              </div>
              <button onClick={downloadExport} style={{ border: `1px solid ${C.sage}33`, borderRadius: 12, padding: '9px 12px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Export report CSV</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 12 }}>
              {[
                ['Calls avoided', reports.callsAvoided ?? callsAvoided],
                ['Avg tasks / estate', reports.avgTasksPerEstate ?? (cases.length ? Math.round((cases.reduce((sum, item) => sum + item.tasks.length, 0) / cases.length) * 10) / 10 : 0)],
                ['Marketplace value', money(reports.marketplace?.estimatedValue ?? totalVendorValue)],
                ['Partner share', money(reports.marketplace?.funeralHomeShare ?? funeralHomeShare)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 20, marginTop: 3 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <ReportTable
                title="By location"
                columns={['Location', 'Cases', 'Handled', 'Waiting', 'Calls']}
                rows={(reports.byLocation || []).map(row => [row.location, row.cases, row.handledTasks, row.waitingTasks + row.blockedTasks, row.callsAvoided])}
              />
              <ReportTable
                title="By employee"
                columns={['Employee', 'Role', 'Open', 'Handled', 'Waiting']}
                rows={(reports.byEmployee || []).map(row => [row.email || 'Unassigned', roleLabel(row.role), row.openTasks, row.handledTasks, row.waitingTasks])}
              />
            </div>
          </div>
        )}

        {user && !loading && data && (
          <details style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 24 }}>
            <summary style={{ cursor: 'pointer', color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>How to use this today</summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 10 }}>
              {[
                ['1', 'Create or import a case', 'Start with the family contact and any service details you already know.'],
                ['2', 'Move the next task', 'Handle it, request family info, or mark it waiting with proof.'],
                ['3', 'Share status or export', 'Use the family view to reduce calls, then export when data needs to move.'],
              ].map(([n, title, body]) => (
                <div key={n} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 11, fontWeight: 900 }}>{n}</div>
                  <div style={{ fontSize: 15, marginTop: 2 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>{body}</div>
                </div>
              ))}
            </div>
          </details>
        )}

        {user && !loading && data?.organizations?.length > 0 && vendorPrefs.vendors.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Preferred local support</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>Choose the vendors families see first inside relevant tasks. This never becomes a public directory.</div>
              </div>
              <button onClick={toggleMarketplaceEnabled} disabled={updating === 'marketplace_enabled'} style={{ border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 10px', background: vendorPrefs.marketplaceEnabled === false ? C.roseFaint : C.sageFaint, color: vendorPrefs.marketplaceEnabled === false ? C.rose : C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                {vendorPrefs.marketplaceEnabled === false ? 'Local support hidden' : 'Local support visible'}
              </button>
            </div>
            <div style={{ color: C.mid, fontSize: 12.5, marginTop: 8 }}>Families stay in Passage. Requests, responses, booking value, and future rev-share are tracked in the case.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 10, opacity: vendorPrefs.marketplaceEnabled === false ? 0.55 : 1 }}>
              {vendorPrefs.vendors.slice(0, 6).map(vendor => {
                const isPreferred = (vendorPrefs.preferred || []).some(p => p.vendor_id === vendor.id && p.category === vendor.category && p.active !== false);
                return (
                  <button key={vendor.id} onClick={() => togglePreferredVendor(vendor)} disabled={updating === 'vendor_' + vendor.id} style={{ textAlign: 'left', border: `1px solid ${isPreferred ? C.sage : C.border}`, background: isPreferred ? C.sageFaint : C.bg, borderRadius: 13, padding: 11, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                    <div style={{ color: C.ink, fontSize: 13.5, fontWeight: 900 }}>{vendor.business_name}</div>
                    <div style={{ color: C.mid, fontSize: 11.5, marginTop: 3 }}>{vendor.category?.replace(/_/g, ' ')}</div>
                    <div style={{ color: isPreferred ? C.sage : C.soft, fontSize: 11, fontWeight: 900, marginTop: 6 }}>{isPreferred ? 'Preferred in tasks' : 'Click to prefer'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {user && showNewCase && (
          <form ref={casePanelRef} onSubmit={createCase} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 12, scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{caseForm.caseType === 'immediate' ? 'New at-need case' : caseForm.caseType === 'prepaid' ? 'New prepaid case' : 'New pre-need case'}</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>{caseForm.caseType === 'immediate' ? 'A death has occurred. Start with the family contact and the next partner-ready work.' : 'This may be a living client or family preparing ahead. Start with a contact and the plan details you already know.'}</div>
              </div>
              <button type="button" onClick={() => setShowNewCase(false)} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 9, padding: '6px 9px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
              {[
                ['immediate', 'At-need case', 'A death has occurred and the family needs coordination now.'],
                ['preneed', 'Pre-need planning', 'A living client or family is preparing before it is urgent.'],
                ['prepaid', 'Prepaid plan', 'Track funding, policy, and family contacts for a paid arrangement.'],
              ].map(([value, title, body]) => (
                <button key={value} type="button" onClick={() => setCaseForm(prev => ({ ...prev, caseType: value }))} style={{ textAlign: 'left', border: `1px solid ${caseForm.caseType === value ? C.sage : C.border}`, background: caseForm.caseType === value ? C.sageFaint : C.bg, borderRadius: 12, padding: 11, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.ink }}>{title}</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.35, color: C.mid, marginTop: 3 }}>{body}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              {[
                ['personName', caseForm.caseType === 'immediate' ? 'Person who died *' : 'Person / family name *'],
                ['dateOfDeath', caseForm.caseType === 'immediate' ? 'Date of death' : 'Planning date'],
                ['caseReference', 'Case reference'],
                ['coordinatorName', 'Family contact'],
                ['coordinatorEmail', 'Family email'],
                ['coordinatorPhone', 'Family phone'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                  {label}
                  <input type={key === 'dateOfDeath' ? 'date' : 'text'} value={caseForm[key]} onChange={e => setCaseForm(prev => ({ ...prev, [key]: e.target.value }))} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
                </label>
              ))}
              {!org?.id && (
                <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                  Funeral home name
                  <input value={caseForm.funeralHomeName} onChange={e => setCaseForm(prev => ({ ...prev, funeralHomeName: e.target.value }))} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
                </label>
              )}
            </div>
            <button disabled={creating || !caseForm.personName.trim()} style={{ marginTop: 10, width: '100%', border: 'none', borderRadius: 12, background: creating || !caseForm.personName.trim() ? C.border : C.sage, color: '#fff', padding: '11px 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: creating || !caseForm.personName.trim() ? 'not-allowed' : 'pointer' }}>
              {creating ? 'Creating case...' : caseForm.caseType === 'immediate' ? 'Create at-need case' : 'Create pre-need case'}
            </button>
          </form>
        )}

        {user && !loading && data && data.organizations.length === 0 && !showNewCase && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Create your partner workspace.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Start a pilot workspace from the first family case. Passage will connect this staff login to the funeral home automatically.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => openCasePanel('immediate')} style={{ border: 'none', borderRadius: 12, padding: '11px 14px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Create first case</button>
            </div>
          </div>
        )}

        {user && !loading && data && data.organizations.length > 0 && cases.length === 0 && !showNewCase && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Start with one family case.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, margin: '12px 0' }}>
              {[
                ['1', 'Create case', 'At-need, pre-need, or prepaid.'],
                ['2', 'Add family', 'Name the coordinator and best contact.'],
                ['3', 'Send first communication', 'Use Passage to show progress and reduce repeated calls.'],
              ].map(([n, title, body]) => (
                <div key={n} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 11, fontWeight: 900 }}>{n}</div>
                  <div style={{ fontSize: 15, marginTop: 2 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>{body}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => openCasePanel('immediate')} style={{ border: 'none', borderRadius: 12, padding: '11px 14px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Create first case</button>
            </div>
          </div>
        )}

        {user && activePartnerView === 'work' && cases.length > 0 && (
          <>
          {isMultiLocation && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.sage, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>Location view</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['all', ...locations].map(location => (
                  <button key={location} onClick={() => setSelectedLocation(location)} style={{ border: `1px solid ${selectedLocation === location ? C.sage : C.border}`, background: selectedLocation === location ? C.sage : C.card, color: selectedLocation === location ? '#fff' : C.mid, borderRadius: 999, padding: '8px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                    {location === 'all' ? 'All locations' : location} {location !== 'all' ? `(${cases.filter(item => locationNameFor(item) === location).length})` : `(${cases.length})`}
                  </button>
                ))}
              </div>
              {showTools && (
                <div style={{ marginTop: 12, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ color: C.soft, textAlign: 'left' }}>
                        <th style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>Location</th>
                        <th style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>Cases</th>
                        <th style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>Handled</th>
                        <th style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>Waiting</th>
                        <th style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>Calls avoided</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map(location => {
                        const rows = cases.filter(item => locationNameFor(item) === location);
                        const handled = rows.reduce((sum, item) => sum + item.tasks.filter(t => ['handled', 'completed', 'done'].includes(t.status || '')).length, 0);
                        const waiting = rows.reduce((sum, item) => sum + item.tasks.filter(t => ['sent', 'waiting', 'pending', 'assigned', 'blocked'].includes(t.status || '')).length, 0);
                        return (
                          <tr key={location}>
                            <td style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}`, fontWeight: 900 }}>{location}</td>
                            <td style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>{rows.length}</td>
                            <td style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>{handled}</td>
                            <td style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>{waiting}</td>
                            <td style={{ padding: '7px 8px', borderBottom: `1px solid ${C.border}` }}>{rows.reduce((sum, item) => sum + (item.communications?.length || 0) + (item.tasks?.filter(t => t.assigned_to_email || t.assigned_to_name).length || 0), 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'grid', gap: 12 }}>
            {displayCases.map(item => {
              const handledCount = item.tasks.filter(t => ['handled', 'completed', 'done'].includes(t.status || '')).length;
              const waitingCount = item.tasks.filter(t => ['sent', 'waiting', 'pending', 'assigned'].includes(t.status || '')).length;
              const progressCount = item.tasks.filter(t => ['draft', 'acknowledged'].includes(t.status || '')).length;
              const open = item.tasks.length - handledCount;
              const blocked = item.tasks.filter(t => ['blocked', 'needs_review', 'failed'].includes(t.status || '')).length;
              const partnerTasks = item.partnerTasks || [];
              const waitingFamily = item.waitingOnFamily || [];
              const vendorRequests = item.vendorRequests || [];
              const familyParticipants = item.familyParticipants || [];
              const orchestration = orchestrationByCaseId.get(item.id) || orchestrateTasks({ tasks: item.tasks || [], role: 'funeral_home', context: { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, surface: 'case work' } });
              const topTasks = (partnerTasks.length ? partnerTasks : orchestration.tasks.length ? orchestration.tasks : item.tasks).slice(0, 3);
              const nextPartnerTask = itemNextPartnerTask(item, orchestration);
              const isDemoCase = /^DEMO/i.test(item.organization_case_reference || '') || /^Demo - /i.test(item.name || '');
              const isExpanded = expandedCaseId === item.id;
              const itemLocation = locationNameFor(item);
              return (
                <div id={'partner-case-' + item.id} key={item.id} style={{ background: C.card, border: `1px solid ${blocked ? C.rose + '55' : C.border}`, borderRadius: 18, padding: 18, scrollMarginTop: 92 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 22, lineHeight: 1.25 }}>{item.deceased_name || item.estate_name || item.name || 'Family case'}</div>
                      <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>{partnerCaseTypeLabel(item)} - {isMultiLocation ? `${itemLocation} - ` : ''}Coordinator: {item.coordinator_name || 'Family coordinator'}{item.coordinator_email ? ` (${item.coordinator_email})` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button onClick={() => setExpandedCaseId(isExpanded ? '' : item.id)} style={{ color: C.sage, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 11, padding: '9px 12px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{isExpanded ? 'Hide work' : 'Show work'}</button>
                      <button onClick={() => setExpandedCaseId(isExpanded ? '' : item.id)} style={{ color: '#fff', background: C.sage, border: 'none', borderRadius: 11, padding: '9px 12px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{isExpanded ? 'Close case work' : 'Open case work'}</button>
                      <Link href={`/funeral-home/summary?id=${item.id}`} style={{ color: C.sage, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 11, padding: '9px 12px', textDecoration: 'none', fontSize: 13, fontWeight: 800 }}>Print family summary</Link>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{item.tasks.length} tasks</span>
                    {isMultiLocation && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Location: {itemLocation}</span>}
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{partnerTasks.length} partner-ready</span>
                    <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{open} open</span>
                    {isAdminDemo && isDemoCase && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Demo data</span>}
                    {waitingFamily.length > 0 && <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{waitingFamily.length} waiting on family</span>}
                    {blocked > 0 && <span style={{ background: C.roseFaint, color: C.rose, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{blocked} need help</span>}
                    {vendorRequests.length > 0 && <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{vendorRequests.length} local help requests</span>}
                  </div>
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12, marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: C.sage, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Next partner work</div>
                    <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.55 }}>
                      {nextPartnerTask ? (
                        <>Move this now: <strong style={{ color: C.ink }}>{sharedTaskTitle(nextPartnerTask)}</strong>. {orchestration.nextAction?.reason || sharedTaskNext(nextPartnerTask, 'funeral_home')} <strong style={{ color: C.sage }}>That is one less call your team has to take.</strong></>
                      ) : (
                        <>No partner-ready work is open for this case right now. <strong style={{ color: C.sage }}>The family status is still visible.</strong></>
                      )}
                    </div>
                  </div>
                  {orchestration.progress.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 7, marginTop: 9 }}>
                      {orchestration.progress.slice(0, 5).map(row => (
                        <div key={row.category} style={{ background: C.bg, border: `1px solid ${row.needsHelp ? C.rose + '44' : row.waiting ? C.amber + '33' : C.border}`, borderRadius: 11, padding: '8px 9px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                            <div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{row.category}</div>
                            <div style={{ color: row.needsHelp ? C.rose : row.waiting ? C.amber : C.sage, fontSize: 11, fontWeight: 900 }}>{row.percent}%</div>
                          </div>
                          <div style={{ height: 5, borderRadius: 999, background: C.border, marginTop: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${row.percent}%`, height: '100%', background: row.needsHelp ? C.rose : row.waiting ? C.amber : C.sage }} />
                          </div>
                          <div style={{ color: C.mid, fontSize: 11.2, marginTop: 5 }}>{row.open} open{row.waiting ? `, ${row.waiting} waiting` : ''}{row.needsHelp ? `, ${row.needsHelp} needs help` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpanded && item.activity?.length > 0 && (
                    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Recent proof</div>
                      {item.activity.slice(0, 3).map(event => (
                        <div key={event.id} style={{ fontSize: 12.3, color: C.mid, lineHeight: 1.45, padding: '4px 0', borderTop: `1px solid ${C.border}` }}>
                          <strong style={{ color: C.ink }}>{statusLabel(event.status)}</strong>{event.recipient ? ` - ${event.recipient}` : ''}{event.last_actor ? ` by ${event.last_actor}` : ''}{event.last_action_at ? ` at ${new Date(event.last_action_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                          {event.detail && <div style={{ color: C.soft }}>{event.detail}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: C.sage, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7 }}>Family status view</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                      {[
                        ['Done', handledCount],
                        ['In progress', progressCount],
                        ['Waiting', waitingCount + blocked],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 10px' }}>
                          <div style={{ color: C.soft, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                          <div style={{ fontSize: 18, marginTop: 2 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 8 }}>Share this status instead of answering another "where are we?" call.</div>
                  </div>
                  {familyParticipants.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Family access handoff</div>
                      {familyParticipants.slice(0, 3).map(participant => {
                        const inviteUrl = participant.invite_token ? `${siteOrigin}/accept?token=${participant.invite_token}` : '';
                        const accepted = !!participant.accepted_at || /accepted|active/i.test(String(participant.invite_status || ''));
                        return (
                          <div key={participant.id || participant.email} style={{ fontSize: 12.3, color: C.mid, lineHeight: 1.45, padding: '6px 0', borderTop: `1px solid ${C.border}` }}>
                            <strong style={{ color: C.ink }}>{participant.name || participant.email || 'Family participant'}</strong>
                            <div>{participant.email || 'No email saved'} - {accepted ? 'Accepted access' : 'Access prepared, not accepted yet'}</div>
                            {inviteUrl && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 6, alignItems: 'center', marginTop: 6 }}>
                                <input readOnly value={inviteUrl} style={{ minWidth: 0, border: `1px solid ${C.border}`, borderRadius: 9, background: C.bg, padding: '7px 8px', color: C.mid, fontFamily: 'Georgia,serif', fontSize: 11.5 }} />
                                <button onClick={() => copyText(inviteUrl, 'Family handoff link copied.')} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Copy</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div style={{ color: C.soft, fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>No message is sent from this screen. Use this prepared link when the director is ready for the family to accept their command center.</div>
                    </div>
                  )}
                  {isExpanded && (item.communicationCenter?.length > 0 || item.communications?.length > 0) && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Communication and proof log</div>
                      {(item.communicationCenter?.length ? item.communicationCenter : item.communications).slice(0, 5).map(message => (
                        <div key={message.id} style={{ fontSize: 12.3, color: C.mid, lineHeight: 1.45, padding: '5px 0', borderTop: `1px solid ${C.border}` }}>
                          <strong style={{ color: C.ink }}>{message.title || message.subject || 'Family update'}</strong>
                          <div>{message.detail || `${message.channel || 'message'} to ${message.recipient_name || message.recipient_email || message.recipient_phone || message.recipient || 'recipient'} - ${message.statusLabel || statusLabel(message.status)}`}</div>
                          {(message.at || message.sent_at) && <div style={{ color: C.soft }}>{new Date(message.at || message.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>}
                          {message.error_message && <div style={{ color: C.rose }}>{message.error_message}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpanded && vendorRequests.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Local support requests</div>
                      {vendorRequests.slice(0, 3).map(request => (
                        <div key={request.id} style={{ fontSize: 12.3, color: C.mid, lineHeight: 1.45, padding: '5px 0', borderTop: `1px solid ${C.border}` }}>
                          <strong style={{ color: C.ink }}>{request.task_title || 'Local help'}</strong>
                          <div>{request.vendors?.business_name || 'Vendor'} - {vendorRequestLabel(request.status)}{request.requested_at ? ` - ${new Date(request.requested_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                            {request.viewed_at && <span style={miniPill}>Viewed</span>}
                            {request.responded_at && <span style={miniPill}>Accepted</span>}
                            {request.in_progress_at && <span style={miniPill}>In progress</span>}
                            {request.completed_at && <span style={miniPill}>Completed</span>}
                            {vendorValue(request) > 0 && <span style={miniPill}>Value ${Math.round(vendorValue(request))}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpanded && topTasks.map(task => (
                    <div key={task.id} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11, marginTop: 11 }}>
                      {(() => {
                        const context = { caseName: item?.deceased_name || item?.estate_name || item?.name, coordinatorName: item?.coordinator_name, surface: 'Recent proof' };
                        const output = taskOutputFor(task, context);
                        const draft = taskRequestDraftFor(task, context);
                        const proofDestination = taskProofDestination(task, context);
                        return (
                          <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, alignItems: 'start' }}>
                        <div>
                          <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 800 }}>{sharedTaskTitle(task)}</div>
                          <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}><strong style={{ color: C.ink }}>Passage handles:</strong> {task.playbook?.automationLabel || 'status, notes, proof, and family visibility'}</div>
                          {task.playbook?.actionResultLabel && (
                            <div style={{ color: C.sage, fontSize: 11.5, lineHeight: 1.45, marginTop: 3, fontWeight: 800 }}>{task.playbook.actionResultLabel}</div>
                          )}
                          <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.45, marginTop: 2 }}><strong style={{ color: C.ink }}>Staff must do:</strong> {task.playbook?.waitingOn ? `confirm details with ${task.playbook.waitingOn}` : 'decide whether to handle, request family info, or mark done'}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '3px 8px', fontSize: 10.5, fontWeight: 800 }}>{task.playbook?.automationShortLabel || 'Task'}</span>
                            <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '3px 8px', fontSize: 10.5, fontWeight: 800 }}>Waiting on {task.playbook?.waitingOn || 'recipient'}</span>
                            {task.playbook?.proofRequired && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '3px 8px', fontSize: 10.5 }}>Proof: {task.playbook.proofRequired}</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: C.mid, whiteSpace: 'nowrap' }}>{statusLabel(task.status)}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 10 }}>
                        <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: 11 }}>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Output Passage prepares</div>
                          <div style={{ color: C.ink, fontSize: 14.5, fontWeight: 900, lineHeight: 1.25, marginTop: 5 }}>{output.label}</div>
                          <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 5 }}>{output.body}</div>
                        </div>
                        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 11 }}>
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Family communication</div>
                          <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 5 }}>{draft}</div>
                        </div>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 11 }}>
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Where the proof lives</div>
                          <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 5 }}>{proofDestination}</div>
                        </div>
                      </div>
                      {task.playbook?.funeralHomeEligible && !['handled', 'completed', 'done'].includes(task.status || '') && (
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
                          <button disabled={updating === task.id + 'waiting'} onClick={() => { setTaskDraft({ task, status: 'waiting', label: 'Start and track work', prompt: taskActionPrompt('waiting', task, 'funeral_home'), draft, output }); setTaskDraftNote(''); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Start tracking work</button>
                          <button disabled={updating === task.id + 'blocked'} onClick={() => { setTaskDraft({ task, status: 'blocked', label: 'Request this from family', prompt: taskActionPrompt('blocked', task, 'funeral_home'), draft, output }); setTaskDraftNote(draft); }} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Request from family</button>
                          <button disabled={updating === task.id + 'handle_for_family'} onClick={() => { setTaskDraft({ task, status: 'handled', label: 'Record proof and close task', prompt: taskActionPrompt('handled', task, 'funeral_home'), draft, output }); setTaskDraftNote(''); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{updating === task.id + 'handle_for_family' ? 'Handling...' : 'Record proof / complete output'}</button>
                        </div>
                      )}
                      {taskDraft?.task?.id === task.id && (
                        <div style={{ marginTop: 10, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 11, color: C.sage, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>Tell Passage what to track</div>
                          <div style={{ color: C.ink, fontSize: 13.5, fontWeight: 900, marginBottom: 4 }}>{taskDraft.label}</div>
                          <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginBottom: 8 }}>{taskDraft.prompt}</div>
                          {taskDraft.output && (
                            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 10px', marginBottom: 8 }}>
                              <div style={{ color: C.soft, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Output being updated</div>
                              <div style={{ color: C.ink, fontSize: 12.5, fontWeight: 900, marginTop: 3 }}>{taskDraft.output.label}</div>
                            </div>
                          )}
                          <textarea
                            value={taskDraftNote}
                            onChange={(e) => setTaskDraftNote(e.target.value)}
                            placeholder={taskActionPlaceholder(taskDraft.status, task, 'funeral_home')}
                            style={{ width: '100%', boxSizing: 'border-box', minHeight: 70, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 12.5, lineHeight: 1.45, background: C.card, color: C.ink }}
                          />
                          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
                            <button
                              disabled={!taskDraftNote.trim() || updating === task.id + taskDraft.status || updating === task.id + 'handle_for_family'}
                              onClick={() => taskDraft.status === 'handled'
                                ? handleForFamily(task, `${org?.name || 'Funeral home'} completed ${sharedTaskTitle(task)}: ${taskDraftNote.trim()}`)
                                : updateTask(task, taskDraft.status, `${org?.name || 'Funeral home'} ${taskDraft.status === 'blocked' ? 'requested family information' : 'started this on behalf of the family'} for ${sharedTaskTitle(task)}: ${taskDraftNote.trim()}. ${proofDestination}`)}
                              style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 900, cursor: taskDraftNote.trim() ? 'pointer' : 'not-allowed', opacity: taskDraftNote.trim() ? 1 : .55, fontFamily: 'Georgia,serif' }}>
                              {taskDraft.status === 'handled' ? 'Save proof and close' : taskDraft.status === 'blocked' ? 'Save family request' : 'Save waiting update'}
                            </button>
                            <button onClick={() => { setTaskDraft(null); setTaskDraftNote(''); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {['handled', 'completed', 'done'].includes(task.status || '') && (
                        <div style={{ marginTop: 8, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 10, padding: '8px 10px', color: C.sage, fontSize: 12.5, fontWeight: 900 }}>Handled for the family</div>
                      )}
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

function DirectorOperatingLoop({ steps, nextStep, useCases, firstOpenCase, onCreateCase, onOpenCase, onExport }) {
  const nextActionLabel = !firstOpenCase
    ? 'Create first case'
    : nextStep?.key === 'report'
      ? 'Export report CSV'
      : 'Open next case work';
  const handleNext = () => {
    if (!firstOpenCase) return onCreateCase?.();
    if (nextStep?.key === 'report') return onExport?.();
    return onOpenCase?.(firstOpenCase.id);
  };
  return (
    <section style={{ background: C.bgDark, color: '#fff', borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 12px 34px rgba(0,0,0,.12)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'start' }}>
        <div>
          <div style={{ color: '#b7d0bb', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Director operating loop</div>
          <h2 style={{ fontSize: 27, lineHeight: 1.12, margin: '7px 0 7px', fontWeight: 400 }}>One case spine from intake to proof to report.</h2>
          <p style={{ color: '#d7d0c7', fontSize: 13.5, lineHeight: 1.55, maxWidth: 650, margin: 0 }}>
            Passage should remove scattered calls, staff memory, loose vendor threads, and unclear family requests. The demo loop below is the work a director cares about.
          </p>
          <div style={{ display: 'grid', gap: 0, marginTop: 16, borderTop: '1px solid rgba(255,255,255,.16)' }}>
            {steps.map((step, index) => {
              const active = step.key === nextStep?.key;
              const status = step.done ? (step.waiting ? 'Waiting' : 'Ready') : 'Next';
              return (
                <div key={step.key} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr) 74px', gap: 10, alignItems: 'center', minHeight: 58, borderBottom: '1px solid rgba(255,255,255,.13)', color: active ? '#fff' : '#eee8df' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center', background: step.done && !step.waiting ? C.sage : active ? C.amber : 'rgba(255,255,255,.1)', color: '#fff', fontSize: 12, fontWeight: 900 }}>{index + 1}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 900 }}>{step.label}</div>
                    <div style={{ color: active ? '#e8cf9d' : '#aaa39b', fontSize: 11.5, marginTop: 2 }}>{step.proof}</div>
                    <div style={{ color: '#d7d0c7', fontSize: 12.5, lineHeight: 1.4, marginTop: 3 }}>{step.next}</div>
                  </div>
                  <div style={{ justifySelf: 'end', color: step.waiting ? '#e8cf9d' : step.done ? '#b7d0bb' : '#fff', fontSize: 11, fontWeight: 900 }}>{status}</div>
                </div>
              );
            })}
          </div>
        </div>
        <aside style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 15, padding: 14 }}>
          <div style={{ color: '#b7d0bb', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Move this now</div>
          <div style={{ fontSize: 20, lineHeight: 1.2, marginTop: 6 }}>{nextStep?.label || 'Start the loop'}</div>
          <div style={{ color: '#d7d0c7', fontSize: 12.5, lineHeight: 1.5, marginTop: 7 }}>{nextStep?.next || 'Create the first case and Passage will surface the next operating step.'}</div>
          <button onClick={handleNext} style={{ width: '100%', border: 'none', borderRadius: 12, background: C.sage, color: '#fff', padding: '11px 13px', marginTop: 12, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{nextActionLabel}</button>
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            {useCases.map(([label, value, body]) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '58px minmax(0, 1fr)', gap: 9, alignItems: 'baseline' }}>
                <div style={{ color: '#fff', fontSize: 20 }}>{value}</div>
                <div>
                  <div style={{ color: '#b7d0bb', fontSize: 11.5, fontWeight: 900 }}>{label}</div>
                  <div style={{ color: '#c8c1b8', fontSize: 11.5, lineHeight: 1.35 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function ReportTable({ title, columns, rows }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, overflowX: 'auto' }}>
      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? (
        <div style={{ color: C.mid, fontSize: 12.5 }}>No report rows yet. Data appears here as tasks are assigned, handled, and logged.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column} style={{ textAlign: 'left', color: C.soft, padding: '6px 7px', borderBottom: `1px solid ${C.border}`, fontWeight: 900 }}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={`${index}_${cellIndex}`} style={{ color: cellIndex === 0 ? C.ink : C.mid, padding: '7px', borderBottom: `1px solid ${C.border}`, fontWeight: cellIndex === 0 ? 900 : 400 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
