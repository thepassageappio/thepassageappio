import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseBrowser';
import { RoleActionStrip, SiteHeader, SiteFooter, SpineTrustStrip } from '../../components/SiteChrome';
import PacketGeneratorModal from '../../components/PacketGeneratorModal';
import SmartAddressInput from '../../components/SmartAddressInput';
import { taskDisplayTitle as sharedTaskTitle, taskExpectedUpdate, taskNextAction as sharedTaskNext } from '../../lib/communicationCenter';
import { taskActionConfirmation, taskActionOutcomeStatus, taskActionPlaceholder, taskActionPrompt } from '../../lib/taskActions';
import { taskExplanationFor, taskGuidanceFor, taskOutputFor, taskPreparedPacketFor, taskProofDestination, taskRequestDraftFor } from '../../lib/taskWorkspace';
import { orchestrateTasks, taskImportance } from '../../lib/taskOrchestration';
import { trackEvent } from '../../lib/trackEvent';
import { recordOnboardingProgress } from '../../lib/onboardingClient';

const C = { bg: '#f6f3ee', bgDark: '#1a1916', card: '#fff', ink: '#1a1916', mid: '#6a6560', soft: '#a09890', border: '#e4ddd4', sage: '#6b8f71', sageFaint: '#f0f5f1', rose: '#c47a7a', roseFaint: '#fdf3f3', amber: '#b07d2e', amberFaint: '#fdf8ee' };

const IMPORT_FIELDS = [
  ['deceased_name', 'Person who died', true],
  ['primary_contact_name', 'Family contact name', true],
  ['primary_contact_email', 'Family contact email', true],
  ['primary_contact_phone', 'Family contact phone', false],
  ['case_reference', 'Case reference', false],
  ['total_case_value', 'Total case value', false],
  ['is_prepaid', 'Prepaid / funded', false],
  ['prepaid_amount', 'Prepaid / policy amount', false],
  ['source_system', 'Source system', false],
  ['date_of_death', 'Date of death', false],
  ['pronouncement_date', 'Pronouncement date', false],
  ['release_date', 'Release / pickup date', false],
  ['arrangement_date', 'Arrangement meeting date', false],
  ['visitation_date', 'Wake / visitation date', false],
  ['funeral_date', 'Funeral / memorial date', false],
  ['burial_date', 'Burial / committal date', false],
  ['shiva_date', 'Shiva / mourning date', false],
  ['reception_date', 'Reception date', false],
  ['obituary_deadline', 'Obituary deadline', false],
  ['service_details', 'Service details', false],
  ['notes', 'Notes', false],
];

const IMPORT_ALIASES = {
  deceased_name: ['deceased_name', 'decedent_name', 'decedent', 'person_who_died', 'person_name', 'case_name', 'name'],
  primary_contact_name: ['primary_contact_name', 'family_contact', 'family_contact_name', 'informant_name', 'next_of_kin_name', 'coordinator_name', 'contact_name'],
  primary_contact_email: ['primary_contact_email', 'family_email', 'family_contact_email', 'informant_email', 'next_of_kin_email', 'coordinator_email', 'contact_email', 'email'],
  primary_contact_phone: ['primary_contact_phone', 'phone', 'family_phone', 'family_contact_phone', 'informant_phone', 'next_of_kin_phone', 'coordinator_phone', 'contact_phone'],
  date_of_death: ['date_of_death', 'death_date', 'dod'],
  case_reference: ['case_reference', 'case_id', 'case_number', 'contract_number', 'record_id', 'reference'],
  total_case_value: ['total_case_value', 'case_value', 'contract_value', 'arrangement_value', 'sale_amount', 'revenue', 'total_price', 'case_total'],
  is_prepaid: ['is_prepaid', 'prepaid', 'funded', 'pre_need_funded', 'preneed_funded', 'policy_funded'],
  prepaid_amount: ['prepaid_amount', 'prepaid_value', 'policy_amount', 'policy_value', 'funded_amount', 'pre_need_amount'],
  source_system: ['source_system', 'system', 'export_source', 'case_management_system'],
  pronouncement_date: ['pronouncement_date', 'official_pronouncement', 'pronouncement'],
  release_date: ['release_date', 'pickup_date', 'removal_date', 'transfer_date'],
  arrangement_date: ['arrangement_date', 'arrangement_meeting', 'arrangements_date'],
  visitation_date: ['visitation_date', 'wake_date', 'calling_hours_date'],
  funeral_date: ['funeral_date', 'service_date', 'memorial_date'],
  burial_date: ['burial_date', 'committal_date', 'cemetery_date', 'cremation_date'],
  shiva_date: ['shiva_date', 'mourning_date', 'mourning_period_date'],
  reception_date: ['reception_date', 'gathering_date'],
  obituary_deadline: ['obituary_deadline', 'obituary_due_date', 'publication_deadline'],
  service_details: ['service_details', 'service_notes', 'arrangement_notes', 'service_summary'],
  notes: ['notes', 'case_notes', 'internal_notes'],
};

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

function escapePreparedOutput(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function preparedOutputFilename(preview) {
  return `${String(preview?.title || 'passage-prepared-output')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'passage-prepared-output'}.txt`;
}

function downloadPreparedOutput(preview) {
  if (typeof window === 'undefined' || !preview?.text) return;
  trackEvent('partner_prepared_output_downloaded', { title: preview.title || '' });
  const content = [
    'Passage',
    'Powered by Passage | thepassageapp.io',
    '',
    preview.title || 'Prepared output',
    preview.subtitle || '',
    '',
    'Review before sharing. Nothing sends automatically from Passage.',
    '',
    preview.text,
  ].filter(line => line !== undefined).join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = preparedOutputFilename(preview);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printPreparedOutput(preview) {
  if (typeof window === 'undefined' || !preview?.text) return;
  trackEvent('partner_prepared_output_printed', { title: preview.title || '' });
  const win = window.open('', '_blank', 'noopener,noreferrer,width=820,height=900');
  if (!win) return;
  const title = escapePreparedOutput(preview.title || 'Passage prepared output');
  const subtitle = escapePreparedOutput(preview.subtitle || 'Family coordination spine');
  const text = escapePreparedOutput(preview.text);
  const purpose = escapePreparedOutput(preview.purpose || 'Review before copying, printing, or sharing. Nothing sends automatically.');
  win.document.write(`<!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { margin: 0.65in; }
          body { font-family: Georgia, serif; color: #1a1916; background: #fff; line-height: 1.55; }
          header { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; border-bottom:1px solid #e4ddd4; padding-bottom:14px; margin-bottom:18px; }
          .brand { font-size:22px; font-weight:900; }
          .muted { color:#6a6560; font-size:12px; }
          .eyebrow { color:#6b8f71; font-size:11px; letter-spacing:.14em; text-transform:uppercase; font-weight:900; }
          h1 { font-size:30px; line-height:1.12; margin:6px 0 4px; font-weight:400; }
          .notice { background:#f0f5f1; border:1px solid #c8deca; border-radius:12px; padding:10px 12px; color:#426347; font-size:13px; margin:16px 0; }
          pre { white-space:pre-wrap; font-family:Georgia, serif; font-size:14px; line-height:1.6; }
          footer { border-top:1px solid #e4ddd4; margin-top:22px; padding-top:10px; color:#a09890; font-size:11px; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <div class="brand">Passage</div>
            <div class="muted">Family coordination spine</div>
          </div>
          <div class="muted" style="text-align:right">Powered by Passage<br/>thepassageapp.io</div>
        </header>
        <div class="eyebrow">Prepared output</div>
        <h1>${title}</h1>
        <div class="muted">${subtitle}</div>
        <div class="notice">${purpose}</div>
        <pre>${text}</pre>
        <footer>Prepared by Passage. Review before sharing outside the family record. Powered by Passage | thepassageapp.io</footer>
        <script>window.onload = () => window.setTimeout(() => window.print(), 150);</script>
      </body>
    </html>`);
  win.document.close();
}

function vendorRequestLabel(value) {
  if (value === 'completed') return 'Completed';
  if (value === 'in_progress') return 'Quote accepted';
  if (value === 'accepted') return 'Quote ready';
  if (value === 'declined') return 'Declined';
  return 'Quote requested';
}

function partnerCaseTypeLabel(item) {
  const stage = String(item?.setup_stage || '');
  const mode = String(item?.mode || '');
  return stage.includes('preneed') || stage.includes('prepaid') || mode === 'green'
    ? 'Pre-need planning case'
    : 'At-need case';
}

function partnerFundingLabel(item) {
  const financials = item?.orchestration_summary?.partner_financials || item?.partner_financials || {};
  const total = financials.total_case_value || financials.case_value || financials.contract_value;
  const prepaid = financials.prepaid_amount || financials.policy_amount;
  if (total && financials?.is_prepaid) return `Case value ${moneyDisplay(total)} - prepaid ${prepaid ? moneyDisplay(prepaid) : 'noted'}`;
  if (total) return `Case value ${moneyDisplay(total)}`;
  if (financials?.is_prepaid) return `Prepaid / funded${prepaid ? `: ${moneyDisplay(prepaid)}` : ''}`;
  return '';
}

function moneyDisplay(value) {
  const raw = String(value || '').replace(/[$,]/g, '').trim();
  const number = Number(raw);
  if (!Number.isFinite(number) || number <= 0) return String(value || '');
  return `$${Math.round(number).toLocaleString()}`;
}

function moneyNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value || '').replace(/[$,\s]/g, '').trim();
  const number = Number(raw);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function caseFinancials(item) {
  return item?.orchestration_summary?.partner_financials || item?.partner_financials || {};
}

function caseValueNumber(item) {
  const financials = caseFinancials(item);
  return moneyNumber(financials.total_case_value || financials.case_value || financials.contract_value || financials.arrangement_value);
}

function prepaidValueNumber(item) {
  const financials = caseFinancials(item);
  return moneyNumber(financials.prepaid_amount || financials.policy_amount || financials.funded_amount);
}

function truthyFlag(value) {
  return ['true', 'yes', 'y', '1', 'paid', 'prepaid', 'funded'].includes(String(value || '').trim().toLowerCase());
}

function partnerLifecycleKey(item) {
  const text = [
    item?.setup_stage,
    item?.mode,
    item?.status,
    item?.activation_status,
    item?.case_type,
    item?.type,
  ].map(value => String(value || '').toLowerCase()).join(' ');
  if (/after|aftercare|closed|completed/.test(text)) return 'after';
  if (/hospice|warm|decline|care/.test(text)) return 'warm';
  if (/preneed|pre-need|planning|green/.test(text)) return 'green';
  const serviceEvents = item?.serviceEvents || item?.service_events || [];
  if (serviceEvents.length || /funeral|service|arrangement/.test(text)) return 'funeral';
  if (item?.date_of_death || /triggered|activated|at_need|at-need|red/.test(text)) return 'red';
  return 'funeral';
}

function importHeaderKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseImportCsv(text) {
  const rows = [];
  let cell = '';
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function suggestedImportMapping(headers) {
  const normalized = new Map(headers.map(header => [importHeaderKey(header), header]));
  const mapping = {};
  for (const [field, aliases] of Object.entries(IMPORT_ALIASES)) {
    const match = aliases.map(importHeaderKey).find(alias => normalized.has(alias));
    if (match) mapping[field] = normalized.get(match);
  }
  return mapping;
}

const miniPill = { background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '2px 7px', fontSize: 10.5, fontWeight: 900 };
const inputStyle = { border: `1.5px solid ${C.border}`, borderRadius: 10, background: C.card, padding: '9px 10px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 12.5, minWidth: 0 };

const demoPartnerContext = {
  organizations: [{
    role: 'director',
    organizations: {
      id: 'demo-org-hvfg',
      name: 'Hudson Valley Funeral Group',
      plan: 'pilot',
      marketplace_enabled: true,
    },
  }],
  activationStatus: 'active',
  partnerPlan: { name: 'Pilot', status: 'demo' },
  isPassageAdmin: true,
  staff: [
    { email: 'maria@hvfg.demo', role: 'director', scope: 'all_cases', status: 'active', annual_salary: '92000' },
    { email: 'robert@hvfg.demo', role: 'staff', scope: 'assigned', status: 'active', hourly_cost: '32' },
    { email: 'lena@hvfg.demo', role: 'location_manager', scope: 'main_location', status: 'active', annual_salary: '78000' },
  ],
  cases: [
    {
      id: 'demo-case-price',
      deceased_name: 'Eleanor Price',
      estate_name: 'Price family',
      coordinator_name: 'Michael Price',
      coordinator_email: 'michael@example.com',
      coordinator_phone: '845-555-0137',
      date_of_death: '2026-05-09',
      organization_case_reference: 'HV-1024',
      setup_stage: 'active',
      mode: 'red',
      status: 'active',
      orchestration_summary: {
        partner_financials: { total_case_value: '11800', is_prepaid: false, prepaid_amount: null },
      },
      tasks: [
        { id: 'demo-task-1', title: 'Confirm cemetery plot details', description: 'Ask family for section, lot number, and deed photo before the arrangement meeting.', status: 'waiting', assigned_to_name: 'Robert Alvarez', assigned_to_email: 'robert@hvfg.demo', created_at: '2026-05-08T13:00:00Z', last_action_at: '2026-05-08T14:30:00Z', proof_required: 'Family reply or cemetery record' },
        { id: 'demo-task-2', title: 'Prepare the funeral home meeting summary', description: 'Organize dates, family contact, service preferences, and open questions into one prepared packet.', status: 'assigned', assigned_to_name: 'Maria Ellis', assigned_to_email: 'maria@hvfg.demo', created_at: '2026-05-08T15:00:00Z', proof_required: 'Prepared packet' },
        { id: 'demo-task-3', title: 'Send obituary approval request', description: 'Send the family a clean approval request with the current obituary draft.', status: 'blocked', assigned_to_name: 'Lena Ortiz', assigned_to_email: 'lena@hvfg.demo', created_at: '2026-05-08T10:00:00Z', proof_required: 'Family approval' },
        { id: 'demo-task-4', title: 'Record hospital release confirmation', description: 'Hospital release was confirmed and saved for transportation.', status: 'handled', assigned_to_name: 'Maria Ellis', assigned_to_email: 'maria@hvfg.demo', created_at: '2026-05-08T09:00:00Z', last_action_at: '2026-05-08T11:00:00Z' },
      ],
      blockedTasks: [{ id: 'demo-task-3' }],
      communications: [{ id: 'c1', status: 'sent' }, { id: 'c2', status: 'waiting' }],
      waitingOnFamily: [{ id: 'wf1', title: 'Cemetery plot details' }],
      vendorRequests: [{ id: 'vr1', task_title: 'Livestream support', status: 'accepted', requested_at: '2026-05-08T12:00:00Z', estimated_value: 650 }],
      activity: [{ id: 'a1', status: 'handled' }, { id: 'a2', status: 'waiting' }],
      serviceEvents: [{ id: 'svc1', name: 'Arrangement meeting', date: '2026-05-12', time: '10:00 AM', location_name: 'Main location' }],
      coordinationSpine: {
        attentionItems: [
          { id: 'attn1', title: 'Family reply needed', detail: 'Cemetery plot details are waiting on Michael.', status: 'waiting', statusLabel: 'Waiting on family' },
          { id: 'attn2', title: 'Obituary approval blocked', detail: 'Draft needs one family decision before it can be sent.', status: 'blocked', statusLabel: 'Needs help' },
        ],
      },
    },
    {
      id: 'demo-case-green',
      deceased_name: 'Thomas Reed',
      estate_name: 'Reed planning file',
      coordinator_name: 'Anna Reed',
      coordinator_email: 'anna@example.com',
      organization_case_reference: 'MULTI-002',
      setup_stage: 'preneed',
      mode: 'green',
      status: 'active',
      orchestration_summary: {
        partner_financials: { total_case_value: '7200', is_prepaid: true, prepaid_amount: '7200' },
      },
      tasks: [
        { id: 'demo-green-1', title: 'Collect pre-need preferences', status: 'assigned', assigned_to_name: 'Lena Ortiz', assigned_to_email: 'lena@hvfg.demo', created_at: '2026-05-07T09:00:00Z' },
      ],
      blockedTasks: [],
      communications: [],
      waitingOnFamily: [],
      vendorRequests: [],
      activity: [],
      serviceEvents: [],
      coordinationSpine: { attentionItems: [] },
    },
  ],
  reports: {},
};

function exportCsvCell(value) {
  let text = value == null ? '' : String(value);
  const trimmed = text.replace(/^\s+/, '');
  if (/^[=+\-@]/.test(trimmed)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildDemoPartnerExport(data, view = 'spine') {
  const cases = data?.cases || [];
  const summaryView = view === 'cases';
  const rows = summaryView
    ? [['Case', 'Case type', 'Reference', 'Case value', 'Prepaid', 'Prepaid amount', 'Family contact', 'Family email', 'Location', 'Open tasks', 'Waiting tasks', 'Handled tasks', 'Next move', 'Updated at']]
    : [['Case', 'Record type', 'Case type', 'Reference', 'Case value', 'Prepaid', 'Family contact', 'Family email', 'Location', 'Task / request', 'Owner', 'Status', 'Waiting on', 'Proof / reporting']];

  for (const item of cases) {
    const tasks = [...(item.partnerTasks || []), ...(item.tasks || [])];
    const handled = tasks.filter(task => ['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
    const waiting = tasks.filter(task => ['sent', 'waiting', 'pending', 'assigned', 'blocked'].includes(String(task.status || '').toLowerCase()));
    const open = tasks.filter(task => !['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
    const caseName = item.estateName || item.deceasedName || item.familyName || item.name || 'Demo family';

    if (summaryView) {
      rows.push([
        caseName,
        item.caseType || item.mode || 'At-need',
        item.caseReference || item.reference || '',
        caseValueNumber(item) || '',
        caseFinancials(item)?.is_prepaid ? 'Yes' : 'No',
        prepaidValueNumber(item) || '',
        item.coordinatorName || item.primaryContactName || '',
        item.coordinatorEmail || item.primaryContactEmail || '',
        item.location || item.locationName || 'Main location',
        open.length,
        waiting.length,
        handled.length,
        item.nextTask?.title || open[0]?.title || 'No open task',
        item.updated_at || item.updatedAt || '',
      ]);
      continue;
    }

    if (!tasks.length) {
      rows.push([caseName, 'case', item.caseType || 'At-need', item.caseReference || '', caseValueNumber(item) || '', caseFinancials(item)?.is_prepaid ? 'Yes' : 'No', item.coordinatorName || '', item.coordinatorEmail || '', item.location || 'Main location', 'No open task', '', item.status || '', '', '']);
    }
    for (const task of tasks) {
      rows.push([
        caseName,
        'task',
        item.caseType || item.mode || 'At-need',
        item.caseReference || item.reference || '',
        caseValueNumber(item) || '',
        caseFinancials(item)?.is_prepaid ? 'Yes' : 'No',
        item.coordinatorName || item.primaryContactName || '',
        item.coordinatorEmail || item.primaryContactEmail || '',
        item.location || item.locationName || 'Main location',
        task.title,
        task.assigned_to_name || task.assigned_to_email || task.owner || '',
        task.status || '',
        task.waiting_on || task.playbook?.waitingOn || '',
        task.proof_required || task.playbook?.proofRequired || 'Status, proof, and export trail',
      ]);
    }
    for (const request of item.vendorRequests || []) {
      rows.push([
        caseName,
        'vendor_request',
        item.caseType || item.mode || 'At-need',
        item.caseReference || item.reference || '',
        caseValueNumber(item) || '',
        caseFinancials(item)?.is_prepaid ? 'Yes' : 'No',
        item.coordinatorName || item.primaryContactName || '',
        item.coordinatorEmail || item.primaryContactEmail || '',
        item.location || item.locationName || 'Main location',
        request.task_title || request.title || 'Vendor request',
        request.vendorName || request.business_name || '',
        request.status || '',
        request.waiting_on || 'Vendor response',
        'Viewed/responded timestamps and status report back to the case',
      ]);
    }
  }

  return rows.map(row => row.map(exportCsvCell).join(',')).join('\n');
}

function downloadCsvFile(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function FuneralHomeDashboard() {
  const router = useRouter();
  const demoMode = router.query.demoTour === 'funeral-home' || router.query.demo === '1';
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
  const [outputPreview, setOutputPreview] = useState(null);
  const [packetModal, setPacketModal] = useState(null);
  const [assignmentDraft, setAssignmentDraft] = useState({ taskId: '', name: '', email: '', role: '', phone: '' });
  const [activePartnerView, setActivePartnerView] = useState('work');
  const [reportView, setReportView] = useState('overview');
  const [reportRange, setReportRange] = useState('30');
  const [reportLocation, setReportLocation] = useState('all');
  const [reportStaff, setReportStaff] = useState('all');
  const [reportDates, setReportDates] = useState({ from: '', to: '' });
  const [caseDetailTabs, setCaseDetailTabs] = useState({});
  const [showAllCases, setShowAllCases] = useState(false);
  const [latestFamilyLink, setLatestFamilyLink] = useState(null);
  const [latestStaffInvite, setLatestStaffInvite] = useState(null);
  const [showDirectorHelp, setShowDirectorHelp] = useState(false);
  const [showStaffSetup, setShowStaffSetup] = useState(false);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [casePaneAutoOpened, setCasePaneAutoOpened] = useState(false);
  const [showPilotGuide, setShowPilotGuide] = useState(false);
  const [staffDraft, setStaffDraft] = useState({ name: '', email: '', role: 'staff', locationScope: 'all', annualSalary: '', hourlyCost: '' });
  const [locationDraft, setLocationDraft] = useState({ name: '', address: '', city: '', state: '', zip: '', country: '', placeId: '' });
  const [importDraft, setImportDraft] = useState(null);
  const [exportRange, setExportRange] = useState({ from: '', to: '' });
  const [copiedKey, setCopiedKey] = useState('');
  const casePanelRef = useRef(null);
  const [caseForm, setCaseForm] = useState({
    funeralHomeName: '',
    caseType: 'immediate',
    personName: '',
    locationName: '',
    locationAddress: '',
    locationCity: '',
    locationState: '',
    locationZip: '',
    locationCountry: '',
    locationPlaceId: '',
    dateOfDeath: '',
    coordinatorName: '',
    coordinatorEmail: '',
    coordinatorPhone: '',
    caseReference: '',
    isPrepaid: false,
    totalCaseValue: '',
    prepaidAmount: '',
    pronouncementDate: '',
    releaseDate: '',
    arrangementDate: '',
    visitationDate: '',
    funeralDate: '',
    burialDate: '',
    shivaDate: '',
    receptionDate: '',
    obituaryDeadline: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search || '');
    if (params.get('staff') === '1') {
      setActivePartnerView('staff');
      const emailHint = params.get('email');
      if (emailHint) {
        setPartnerEmail(emailHint);
        setNotice(`Staff sign-in opened for ${emailHint}.`);
      }
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (demoMode) {
      setUser({ id: 'demo-partner-user', email: 'maria@hvfg.demo' });
      setToken('demo-token');
      setData(demoPartnerContext);
      setPartnerEmail('maria@hvfg.demo');
      setVendorPrefs({
        vendors: [{ id: 'demo-vendor', business_name: 'Hudson Valley Livestream', category: 'livestream', status: 'active' }],
        preferred: [{ vendor_id: 'demo-vendor', category: 'livestream', active: true }],
        marketplaceEnabled: true,
      });
      setLoading(false);
      return;
    }
    if (!supabase?.auth) {
      setError('Supabase browser auth is not configured in this environment.');
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setToken(session?.access_token || '');
      if (session?.access_token) {
        load(session.access_token);
        loadPreferredVendors(session.access_token);
      }
      else setLoading(false);
    });
  }, [router.isReady, demoMode]);

  useEffect(() => {
    const modalOpen = showNewCase || showStaffSetup || showLocationSetup || Boolean(taskDraft?.task) || Boolean(assignmentDraft.taskId);
    if (!modalOpen || typeof window === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      setShowNewCase(false);
      setShowStaffSetup(false);
      setShowLocationSetup(false);
      setTaskDraft(null);
      setTaskDraftNote('');
      setAssignmentDraft({ taskId: '', name: '', email: '', role: '', phone: '' });
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNewCase, showStaffSetup, showLocationSetup, taskDraft?.task, assignmentDraft.taskId]);

  async function load(token) {
    setLoading(true);
    const demoMode = router.query.demo === '1' || router.query.demo === 'true';
    const res = await fetch(demoMode && !token ? '/api/partnerContext?demo=1' : '/api/partnerContext', token ? { headers: { Authorization: 'Bearer ' + token } } : undefined);
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
    if (!supabase?.auth) {
      setError('Supabase browser auth is not configured in this environment.');
      return;
    }
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
    if (!supabase?.auth) {
      setError('Supabase browser auth is not configured in this environment.');
      setSigningIn(false);
      return;
    }
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
      if (session?.user?.id) {
        supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', session.user.id).then(() => {});
      }
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
    if (!supabase?.auth) return;
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
        setNotice(json.confirmation || 'Proof saved. The family-facing status trail can show this without sending a live email.');
        await load(token);
      }
    } finally {
      setUpdating('');
    }
  }

  async function assignTaskOwner(task) {
    if (!token || !task?.id) return;
    const payload = {
      name: assignmentDraft.name,
      email: assignmentDraft.email,
      role: assignmentDraft.role,
      phone: assignmentDraft.phone,
      actor: user?.email || 'Funeral home staff',
    };
    if (!String(payload.email || '').trim()) {
      setError('Add an email so Passage can save the assignment and prepare the notification path.');
      return;
    }
    setUpdating(task.id + 'assign');
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/tasks/${task.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not assign this task.');
      } else {
        setData(prev => prev ? {
          ...prev,
          cases: (prev.cases || []).map(item => ({
            ...item,
            tasks: (item.tasks || []).map(t => t.id === task.id ? { ...t, ...(json.task || {}), status: t.status || 'assigned' } : t),
            partnerTasks: (item.partnerTasks || []).map(t => t.id === task.id ? { ...t, ...(json.task || {}), status: t.status || 'assigned' } : t),
          })),
        } : prev);
        setNotice(json.confirmation || 'Owner saved. Passage can route the task notification when approved.');
        setAssignmentDraft({ taskId: '', name: '', email: '', role: '', phone: '' });
        await load(token);
      }
    } finally {
      setUpdating('');
    }
  }

  async function addPartnerStaff(event) {
    event?.preventDefault?.();
    const email = String(staffDraft.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Add a staff email before saving.');
      return;
    }
    const savedMember = {
      email,
      role: staffDraft.role || 'staff',
      display_name: staffDraft.name || email,
      name: staffDraft.name || email,
      location_scope: staffDraft.locationScope || 'all',
      locationScope: staffDraft.locationScope || 'all',
      annual_salary: staffDraft.annualSalary || null,
      annualSalary: staffDraft.annualSalary || '',
      hourly_cost: staffDraft.hourlyCost || null,
      hourlyCost: staffDraft.hourlyCost || '',
      status: 'active',
      scope: /director|admin|manager|location/i.test(staffDraft.role || '') ? 'all_cases' : 'assigned_work',
    };
    if (demoMode || !token) {
      setData(prev => prev ? {
        ...prev,
        staff: [
          savedMember,
          ...(prev.staff || []).filter(member => String(member.email || '').toLowerCase() !== email),
        ],
      } : prev);
      setLatestStaffInvite(savedMember);
      setNotice('Employee saved for this demo. Copy the invite message; no email or SMS was sent.');
      setStaffDraft({ name: '', email: '', role: 'staff', locationScope: 'all', annualSalary: '', hourlyCost: '' });
      return;
    }
    setUpdating('partner_staff');
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/partnerStaff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          name: staffDraft.name,
          email,
          role: staffDraft.role || 'staff',
          locationScope: staffDraft.locationScope || 'all',
          annualSalary: staffDraft.annualSalary,
          hourlyCost: staffDraft.hourlyCost,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not save this staff profile.');
      } else {
        const persistedMember = json.member || savedMember;
        setLatestStaffInvite(persistedMember);
        setNotice(json.confirmation || 'Staff profile saved.');
        setStaffDraft({ name: '', email: '', role: 'staff', locationScope: 'all', annualSalary: '', hourlyCost: '' });
        await load(token);
      }
    } finally {
      setUpdating('');
    }
  }

  async function addPartnerLocation(event) {
    event?.preventDefault?.();
    const name = String(locationDraft.name || '').trim();
    if (!name) {
      setError('Name the location before saving it.');
      return;
    }
    const savedLocation = {
      id: `local_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      name,
      address: locationDraft.address || '',
      city: locationDraft.city || '',
      state: locationDraft.state || '',
      zip: locationDraft.zip || '',
      country: locationDraft.country || '',
      placeId: locationDraft.placeId || '',
      status: 'active',
      source: 'manual',
    };
    if (demoMode || !token) {
      setData(prev => prev ? {
        ...prev,
        partnerLocations: [
          savedLocation,
          ...(prev.partnerLocations || []).filter(location => String(location.name || '').toLowerCase() !== name.toLowerCase()),
        ],
      } : prev);
      setNotice('Location saved for this demo workspace. It is now available in staff scope, case setup, and reports.');
      setLocationDraft({ name: '', address: '', city: '', state: '', zip: '', country: '', placeId: '' });
      setShowLocationSetup(false);
      return;
    }
    setUpdating('partner_location');
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/partnerLocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(savedLocation),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not save this location.');
      } else {
        setData(prev => prev ? {
          ...prev,
          partnerLocations: [
            json.location || savedLocation,
            ...(prev.partnerLocations || []).filter(location => String(location.name || '').toLowerCase() !== name.toLowerCase()),
          ],
        } : prev);
        setNotice(json.confirmation || 'Location saved. It is now available in partner setup and reporting.');
        setLocationDraft({ name: '', address: '', city: '', state: '', zip: '', country: '', placeId: '' });
        setShowLocationSetup(false);
      }
    } finally {
      setUpdating('');
    }
  }

  function openPartnerWork(caseId) {
    if (!caseId) return;
    setShowPilotGuide(false);
    setShowTools(false);
    setActivePartnerView('work');
    setSelectedLocation('all');
    setExpandedCaseId(caseId);
    setNotice('Opening the case work queue.');
    const scrollToCase = () => {
      const panel = document.getElementById('partner-case-' + caseId);
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        window.setTimeout(() => window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' }), 80);
      } else {
        setNotice('Case work is open. If the case is filtered out, switch to All locations.');
      }
    };
    window.setTimeout(scrollToCase, 80);
    window.setTimeout(scrollToCase, 260);
  }

  function openPartnerPane(view, targetId, message) {
    setShowPilotGuide(false);
    setShowTools(false);
    setActivePartnerView(view);
    if (message) setNotice(message);
    scrollPartnerDemoTarget(targetId);
  }

  function openPartnerManagement(message = 'Opening locations, employees, roles, and permissions.') {
    setShowPilotGuide(false);
    setShowTools(false);
    setActivePartnerView('manage');
    if (message) setNotice(message);
    scrollPartnerDemoTarget('partner-management-section');
  }

  function moveDirectorFocus() {
    setShowPilotGuide(false);
    setShowTools(false);
    if (!isDirectorRole && firstStaffTask?.caseId) {
      openPartnerWork(firstStaffTask.caseId);
      return;
    }
    if (nextDirectorStep.key === 'staff') {
      openPartnerPane('staff', 'partner-staff-section', 'Opening staff queue so the next owner can be set.');
      return;
    }
    if (nextDirectorStep.key === 'report') {
      openPartnerPane('reports', 'partner-reports-section', 'Opening reports and export so proof can leave Passage cleanly.');
      return;
    }
    if (firstOpenCase?.id) {
      openPartnerWork(firstOpenCase.id);
      return;
    }
    openCasePanel('immediate');
    setNotice('Create the first case, then Passage will move the next task.');
  }

  function directorFocusButtonLabel() {
    if (!isDirectorRole) return firstStaffTask ? 'Open my task' : 'Open staff queue';
    if (nextDirectorStep.key === 'staff') return 'Open staff queue';
    if (nextDirectorStep.key === 'report') return 'Open reports';
    if (nextDirectorStep.key === 'case') return cases.length ? 'Open next case' : 'Create first case';
    if (nextDirectorStep.key === 'family') return 'Open family request';
    if (nextDirectorStep.key === 'proof') return 'Record proof';
    if (nextDirectorStep.key === 'local') return 'Open support request';
    return 'Open next case';
  }

  function scrollPartnerDemoTarget(id) {
    window.setTimeout(() => {
      const panel = document.getElementById(id);
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        window.setTimeout(() => window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' }), 80);
      }
    }, 100);
  }

  function focusPartnerDemoStep(step) {
    const clean = String(step || '').toLowerCase();
    if (!clean) return;

    if (clean === 'team') {
      setShowNewCase(false);
      setShowPilotGuide(false);
      setActivePartnerView('manage');
      setNotice('Demo step: locations, employees, permissions, and invite handoff.');
      scrollPartnerDemoTarget('partner-management-section');
      return;
    }

    if (clean === 'case') {
      setShowPilotGuide(false);
      setActivePartnerView('work');
      openCasePanel('immediate');
      setNotice('Demo step: create an at-need case with only the known details.');
      scrollPartnerDemoTarget('partner-case-form');
      return;
    }

    if (clean === 'dashboard') {
      setShowNewCase(false);
      setShowPilotGuide(false);
      setShowTools(false);
      setActivePartnerView('work');
      setNotice('Demo step: director sees active cases, waiting items, and ROI.');
      scrollPartnerDemoTarget('partner-today-section');
      return;
    }

    if (clean === 'task') {
      setShowNewCase(false);
      setShowPilotGuide(false);
      setShowTools(false);
      setActivePartnerView('work');
      if (firstOpenCase?.id) {
        openPartnerWork(firstOpenCase.id);
        scrollPartnerDemoTarget('partner-action-workspace-' + firstOpenCase.id);
      } else {
        setNotice('Demo step: create a case first, then Passage opens the task spine.');
        openCasePanel('immediate');
      }
      return;
    }

    if (clean === 'chat') {
      setShowNewCase(false);
      setShowPilotGuide(false);
      setShowTools(false);
      setActivePartnerView('work');
      if (firstOpenCase?.id) {
        openPartnerWork(firstOpenCase.id);
        setNotice('Demo step: communication, proof, and notifications stay attached to the selected case.');
        scrollPartnerDemoTarget('partner-coordination-spine-' + firstOpenCase.id);
      }
      return;
    }

    if (clean === 'export') {
      setShowNewCase(false);
      setShowPilotGuide(false);
      setActivePartnerView('reports');
      setShowTools(true);
      setNotice('Demo step: close with reporting, CSV export, and adoption trust.');
      scrollPartnerDemoTarget('partner-reports-section');
    }
  }

  function exportQuery(view = 'spine') {
    const params = new URLSearchParams();
    if (view === 'cases') params.set('view', 'cases');
    if (exportRange.from) params.set('from', exportRange.from);
    if (exportRange.to) params.set('to', exportRange.to);
    const text = params.toString();
    return text ? `?${text}` : '';
  }

  async function downloadExport(view = 'spine') {
    if (!token) return;
    setError('');
    if (demoMode) {
      const summaryView = view === 'cases';
      downloadCsvFile(
        buildDemoPartnerExport(data, view),
        summaryView ? 'passage-demo-case-summary.csv' : 'passage-demo-full-spine.csv'
      );
      setNotice(`${summaryView ? 'Case summary' : 'Full spine'} demo CSV downloaded locally. No Supabase, email, or production record was touched.`);
      return;
    }
    const res = await fetch('/api/partnerExport' + exportQuery(view), { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Could not export partner cases.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = view === 'cases' ? 'passage-partner-case-summary.csv' : 'passage-partner-full-spine.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function emailExport(view = 'spine') {
    if (!token) return;
    if (demoMode) {
      setNotice(`${view === 'cases' ? 'Case summary' : 'Full spine'} demo email skipped. Use Download to show the CSV without sending email.`);
      return;
    }
    const updateKey = view === 'cases' ? 'email_case_export' : 'email_export';
    setUpdating(updateKey);
    setError('');
    setNotice('');
    const res = await fetch('/api/partnerExport' + exportQuery(view), { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ view, from: exportRange.from, to: exportRange.to }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not email the CSV export.');
    else setNotice(`${view === 'cases' ? 'Case summary' : 'Full spine'} CSV export sent to ${json.emailedTo || user?.email || 'your email'}.`);
    setUpdating('');
  }

  function prepareImportDraft(csv, fileName = 'case export') {
    const rows = parseImportCsv(csv);
    if (rows.length < 2) {
      setError('CSV needs a header row and at least one case row.');
      return;
    }
    const headers = rows[0].filter(Boolean);
    setImportDraft({
      csv,
      fileName,
      headers,
      rows: rows.slice(1, 4),
      mapping: suggestedImportMapping(headers),
      preview: null,
      errors: [],
    });
    setShowTools(true);
    setNotice('Review the column mapping, then import. Nothing is saved until you confirm.');
  }

  function requiredImportFieldsMissing() {
    if (!importDraft?.mapping) return [];
    return IMPORT_FIELDS
      .filter(([, , required]) => required)
      .filter(([key]) => !importDraft.mapping?.[key])
      .map(([, label]) => label);
  }

  async function previewMappedImport() {
    if (!token || !importDraft?.csv) return;
    const requiredMissing = requiredImportFieldsMissing();
    if (requiredMissing.length) {
      setError(`Map required fields first: ${requiredMissing.join(', ')}.`);
      return;
    }
    setUpdating('partner_import_preview');
    setError('');
    setNotice('');
    const res = await fetch('/api/partnerImport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ csv: importDraft.csv, mapping: importDraft.mapping, funeralHomeName: org?.name || '', previewOnly: true }),
    });
    const json = await res.json().catch(() => ({}));
    setUpdating('');
    setImportDraft(prev => ({ ...prev, preview: json.preview || [], errors: json.errors || [], readyRows: json.readyRows || 0, totalRows: json.totalRows || 0, errorRows: json.errorRows || 0 }));
    if (!res.ok || json.errors?.length) {
      setError(json.error || json.errors?.[0] || 'Fix the import rows before saving.');
      return;
    }
    setNotice(`Preview ready: ${json.readyRows} case${json.readyRows === 1 ? '' : 's'} can be imported.`);
  }

  async function submitMappedImport() {
    if (!token || !importDraft?.csv) return;
    const requiredMissing = requiredImportFieldsMissing();
    if (requiredMissing.length) {
      setError(`Map required fields first: ${requiredMissing.join(', ')}.`);
      return;
    }
    if (!importDraft.preview) {
      await previewMappedImport();
      return;
    }
    setUpdating('partner_import');
    setError('');
    setNotice('');
    const res = await fetch('/api/partnerImport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ csv: importDraft.csv, mapping: importDraft.mapping, funeralHomeName: org?.name || '' }),
    });
    const json = await res.json().catch(() => ({}));
    setUpdating('');
    if (!res.ok) {
      setError(json.error || 'Could not import this CSV.');
      return;
    }
    setImportDraft(null);
    setNotice(`Imported ${json.imported} case${json.imported === 1 ? '' : 's'} into Passage.`);
    await load(token);
  }

  async function createCase(e) {
    e.preventDefault();
    trackEvent('partner_case_create_submitted', { demoMode, caseType: caseForm.caseType, hasFamilyEmail: Boolean(caseForm.coordinatorEmail), hasCaseValue: Boolean(caseForm.totalCaseValue), isPrepaid: Boolean(caseForm.isPrepaid) });
    if (!token) return;
    if (demoMode) {
      const now = new Date().toISOString();
      const id = 'demo-created-' + Date.now();
      const caseName = caseForm.personName.trim() || 'Demo family';
      const normalizedCaseType = caseForm.caseType === 'immediate' ? 'immediate' : 'preneed';
      const planning = normalizedCaseType === 'preneed';
      const savedLocationName = caseForm.locationName || caseForm.funeralHomeName || 'Main location';
      const demoCase = {
        id,
        deceased_name: planning ? '' : caseName,
        estate_name: planning ? `${caseName} planning file` : `${caseName} family`,
        coordinator_name: caseForm.coordinatorName || 'Family coordinator',
        coordinator_email: caseForm.coordinatorEmail || 'family@example.com',
        coordinator_phone: caseForm.coordinatorPhone || '',
        date_of_death: planning ? '' : caseForm.dateOfDeath,
        organization_case_reference: caseForm.caseReference || `DEMO-${String(Date.now()).slice(-4)}`,
        location_name: savedLocationName,
        location_address: caseForm.locationAddress || '',
        setup_stage: planning ? 'preneed' : 'active',
        mode: planning ? 'green' : 'red',
        orchestration_summary: {
          partner_case_type: normalizedCaseType,
          partner_financials: {
            is_prepaid: Boolean(caseForm.isPrepaid),
            total_case_value: caseForm.totalCaseValue || null,
            prepaid_amount: caseForm.prepaidAmount || null,
          },
          partner_location: {
            name: savedLocationName,
            address: caseForm.locationAddress || null,
            city: caseForm.locationCity || null,
            state: caseForm.locationState || null,
            postal_code: caseForm.locationZip || null,
            country: caseForm.locationCountry || null,
            place_id: caseForm.locationPlaceId || null,
          },
        },
        status: 'active',
        updated_at: now,
        tasks: [
          {
            id: id + '-task-1',
            title: planning ? 'Collect pre-need preferences' : 'Prepare the funeral home meeting summary',
            description: planning ? 'Capture wishes, contacts, and documents before the family needs them.' : 'Organize known facts, service preferences, family contact, and open questions into one prepared packet.',
            status: 'assigned',
            assigned_to_name: 'Maria Ellis',
            assigned_to_email: 'maria@hvfg.demo',
            created_at: now,
            proof_required: 'Prepared packet',
          },
        ],
        blockedTasks: [],
        communications: [],
        waitingOnFamily: [],
        vendorRequests: [],
        activity: [{ id: id + '-activity-1', status: 'assigned' }],
        serviceEvents: [
          caseForm.arrangementDate ? { id: id + '-arrangement', name: 'Arrangement meeting', date: caseForm.arrangementDate, location_name: savedLocationName, location_address: caseForm.locationAddress || '' } : null,
          caseForm.funeralDate ? { id: id + '-funeral', name: 'Funeral / memorial', date: caseForm.funeralDate, location_name: savedLocationName, location_address: caseForm.locationAddress || '' } : null,
        ].filter(Boolean),
        coordinationSpine: { attentionItems: [] },
      };
      setData(prev => prev ? { ...prev, cases: [demoCase, ...(prev.cases || [])] } : prev);
      setLatestFamilyLink(caseForm.coordinatorEmail ? {
        workflowId: id,
        email: caseForm.coordinatorEmail,
        url: `${window.location.origin}/accept?token=demo-family-handoff`,
      } : null);
      setNotice(caseForm.coordinatorEmail
        ? 'Demo case created locally. Family handoff link is prepared for the walkthrough; no production record, email, or SMS was created.'
        : 'Demo case created locally. Add a family email in a real case before preparing the family handoff link.');
      setShowNewCase(false);
      trackEvent('partner_case_created_demo', { caseType: normalizedCaseType, isPrepaid: Boolean(caseForm.isPrepaid), hasCaseValue: Boolean(caseForm.totalCaseValue), hasFamilyEmail: Boolean(caseForm.coordinatorEmail) });
      setExpandedCaseId(id);
      setCaseForm({ funeralHomeName: '', caseType: 'immediate', personName: '', locationName: '', locationAddress: '', locationCity: '', locationState: '', locationZip: '', locationCountry: '', locationPlaceId: '', dateOfDeath: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '', caseReference: '', isPrepaid: false, totalCaseValue: '', prepaidAmount: '', pronouncementDate: '', releaseDate: '', arrangementDate: '', visitationDate: '', funeralDate: '', burialDate: '', shivaDate: '', receptionDate: '', obituaryDeadline: '' });
      return;
    }
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
      trackEvent('partner_case_create_failed', { caseType: caseForm.caseType, message: json.error || 'Could not create this family case.' });
      setError(json.error || 'Could not create this family case.');
      return;
    }
    trackEvent('partner_case_created', { workflowId: json.workflowId, caseType: caseForm.caseType, isPrepaid: Boolean(caseForm.isPrepaid), hasCaseValue: Boolean(caseForm.totalCaseValue), familyParticipantCreated: Boolean(json.familyParticipant?.created) });
    await recordOnboardingProgress(supabase, 'partner_case_created', { workflowId: json.workflowId, caseType: caseForm.caseType });
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
    setCaseForm({ funeralHomeName: '', caseType: 'immediate', personName: '', locationName: '', locationAddress: '', locationCity: '', locationState: '', locationZip: '', locationCountry: '', locationPlaceId: '', dateOfDeath: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '', caseReference: '', isPrepaid: false, totalCaseValue: '', prepaidAmount: '', pronouncementDate: '', releaseDate: '', arrangementDate: '', visitationDate: '', funeralDate: '', burialDate: '', shivaDate: '', receptionDate: '', obituaryDeadline: '' });
    await load(token);
  }

  async function copyText(value, label = 'Copied.', key = '') {
    if (!value) return;
    const text = String(value);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement('textarea');
        input.value = text;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        input.style.top = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setNotice(label);
      if (key) {
        setCopiedKey(key);
        window.setTimeout(() => setCopiedKey(current => current === key ? '' : current), 2200);
      }
    } catch {
      try {
        const input = document.createElement('textarea');
        input.value = text;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        input.style.top = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setNotice(label);
        if (key) {
          setCopiedKey(key);
          window.setTimeout(() => setCopiedKey(current => current === key ? '' : current), 2200);
        }
      } catch {
        setError('Could not copy automatically. Select the prepared text and copy it manually.');
      }
    }
  }

  function staffHandoffUrl(email) {
    return `${siteOrigin}/funeral-home/dashboard?staff=1${email ? `&email=${encodeURIComponent(email)}` : ''}`;
  }

  function staffInviteMessage(member) {
    const email = member?.email || '';
    const role = roleLabel(member?.role || 'staff');
    const name = member?.display_name || member?.name || email;
    const locationScope = member?.location_scope || member?.locationScope || 'All locations';
    const link = staffHandoffUrl(email);
    return [
      `Hi ${name},`,
      '',
      `You have been added to Passage as ${role}.`,
      `Location scope: ${locationScope === 'all' ? 'All locations' : locationScope}.`,
      '',
      'Your first screen is My work: assigned case tasks, service timing, what is waiting, and the proof field. You only need to move the work you own.',
      '',
      'When something is handled, waiting, or needs family input, record that update in Passage so the family record and director view stay aligned.',
      '',
      'No email or SMS is sent from this copied message until your team chooses to send it.',
      '',
      link,
    ].join('\n');
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
    await recordOnboardingProgress(supabase, 'checkout_started', { planId, path: 'partner' });
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
  const totalCaseValue = cases.reduce((sum, item) => sum + caseValueNumber(item), 0);
  const prepaidCaseValue = cases.reduce((sum, item) => sum + prepaidValueNumber(item), 0);
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
  const billingStatus = data?.billingStatus || (partnerPlan?.status === 'demo' ? 'demo' : 'not_configured');
  const partnerTrialExpired = user && data && activationStatus === 'trial_expired';
  function riskAgeHours(value) {
    if (!value) return 0;
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return 0;
    return Math.max(0, Math.round((Date.now() - time) / 36e5));
  }
  function riskLabelForTask(task, caseItem) {
    const status = String(task?.status || '').toLowerCase();
    const age = riskAgeHours(task?.last_action_at || task?.updated_at || task?.created_at);
    const title = `${task?.title || ''} ${task?.description || ''}`.toLowerCase();
    if (['blocked', 'failed', 'needs_review'].includes(status)) return 'Escalating: blocked or needs help';
    if (['sent', 'waiting', 'pending', 'assigned'].includes(status) && age >= 24) return 'At risk: no response in 24h';
    if (/obituary|service|flowers|transport|cemetery|permit|pronouncement/.test(title) && ['draft', 'acknowledged', 'waiting', 'pending'].includes(status)) return 'At risk near service work';
    if ((caseItem?.vendorRequests || []).some(request => !['completed', 'declined'].includes(String(request.status || '').toLowerCase()) && riskAgeHours(request.requested_at) >= 24)) return 'At risk: vendor response overdue';
    return '';
  }
  const glanceItems = [
    ['Active cases', cases.length],
    ['Tasks handled by Passage', totalHandled],
    ['Waiting for response', totalWaiting],
    ['Blocked items', totalBlocked],
    ['Estimated calls avoided', callsAvoided],
    ['Estimated hours saved', timeSavedLabel],
  ];
  const detailGlanceItems = [
    ['Coordination time saved', timeSavedLabel],
    ['Recorded case value', totalCaseValue ? moneyDisplay(totalCaseValue) : '$0'],
    ['Local requests coordinated', totalVendorRequests],
    ['Tracked referral value', totalVendorValue ? `$${Math.round(totalVendorValue)}` : '$0'],
  ];
  function locationNameFor(item) {
    const ref = String(item.organization_case_reference || item.case_reference || '');
    if (/MULTI-002/i.test(ref)) return 'Poughkeepsie';
    if (/MULTI/i.test(ref)) return 'Beacon';
    const partnerLocation = item?.orchestration_summary?.partner_location || item?.partner_location || {};
    if (partnerLocation.name) return partnerLocation.name;
    if (partnerLocation.city || partnerLocation.state) return [partnerLocation.city, partnerLocation.state].filter(Boolean).join(', ');
    return item.location_name || item.branch_name || item.funeral_home_location || 'Main location';
  }

  function openCasePanel(caseType = 'immediate') {
    const normalizedCaseType = caseType === 'prepaid' ? 'preneed' : caseType;
    setCaseForm(prev => ({ ...prev, caseType: normalizedCaseType, isPrepaid: caseType === 'prepaid' ? true : prev.isPrepaid }));
    setShowNewCase(true);
    setShowTools(false);
    setNotice(normalizedCaseType === 'immediate'
      ? 'Create an at-need case. Add only what you know.'
      : 'Create a pre-need planning case. Add prepaid or funded details only if they apply.');
    window.setTimeout(() => {
      casePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      window.setTimeout(() => window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' }), 80);
      casePanelRef.current?.querySelector('input')?.focus?.();
    }, 0);
  }
  const savedPartnerLocations = data?.partnerLocations || data?.locations || [];
  const locations = Array.from(new Set([
    ...savedPartnerLocations.map(location => location.name || location.location_name || '').filter(Boolean),
    ...cases.map(locationNameFor).filter(Boolean),
  ]));
  const isMultiLocation = locations.length > 1 || /group|multi/i.test(String(org?.name || '') + ' ' + String(org?.plan || ''));
  const displayCases = isMultiLocation && selectedLocation !== 'all' ? cases.filter(item => locationNameFor(item) === selectedLocation) : cases;
  const caseOrchestrationRows = displayCases.map(item => ({
    caseItem: item,
    orchestration: orchestrateTasks({
      tasks: item.tasks || [],
      role: 'funeral_home',
      context: { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, deathDate: item.date_of_death, serviceEvents: item.serviceEvents || item.service_events || [], surface: 'case work' },
    }),
  }));
  const orchestrationByCaseId = new Map(caseOrchestrationRows.map(row => [row.caseItem.id, row.orchestration]));
  const caseInbox = caseOrchestrationRows
    .map(({ caseItem, orchestration }) => ({ caseItem, task: itemNextPartnerTask(caseItem, orchestration), locationName: locationNameFor(caseItem) }))
    .filter(row => row.task)
    .slice(0, 4);
  const riskItems = caseOrchestrationRows.flatMap(({ caseItem }) => (caseItem.tasks || []).map(task => ({
    task,
    caseItem,
    label: riskLabelForTask(task, caseItem),
  }))).filter(item => item.label).slice(0, 5);
  const spineInbox = caseOrchestrationRows.flatMap(({ caseItem }) => {
    const source = caseItem.coordinationSpine?.attentionItems || [];
    return source.map(event => ({
    ...event,
    caseId: caseItem.id,
    caseName: caseItem.deceased_name || caseItem.estate_name || caseItem.name || 'Family case',
    locationName: locationNameFor(caseItem),
    }));
  }).filter(event => {
    const status = String(event.status || '').toLowerCase();
    const text = `${event.title || ''} ${event.detail || ''} ${event.statusLabel || ''}`.toLowerCase();
    return ['blocked', 'failed', 'needs_review', 'waiting', 'pending', 'requested', 'sent', 'acknowledged'].includes(status)
      || /waiting|needs help|failed|request|asked|declined|quote|accepted|in progress/.test(text);
  }).slice(0, 6);
  const currentMembership = (partnerStaff || []).find(member => String(member.email || '').toLowerCase() === String(user?.email || '').toLowerCase()) || null;
  const currentRole = String(currentMembership?.role || data?.organizations?.[0]?.role || 'staff').toLowerCase();
  const isDirectorRole = /owner|admin|director|manager|location/i.test(currentRole);
  const currentUserEmail = String(user?.email || '').toLowerCase();
  const allPartnerTasks = displayCases.flatMap(item => (item.tasks || []).map(task => ({
    ...task,
    caseName: item.deceased_name || item.estate_name || item.name || 'Family case',
    caseId: item.id,
    locationName: locationNameFor(item),
    importance: taskImportance(task, { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, deathDate: item.date_of_death, serviceEvents: item.serviceEvents || item.service_events || [], surface: 'staff work' }),
  })));
  const assignedWorkQueue = allPartnerTasks
    .filter(task => !['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()))
    .filter(task => isDirectorRole || String(task.assigned_to_email || '').toLowerCase() === currentUserEmail || String(task.last_actor || '').toLowerCase() === currentUserEmail)
    .sort((a, b) => (a.importance?.rank ?? 9) - (b.importance?.rank ?? 9) || partnerTaskPriorityFromStatus(a.status) - partnerTaskPriorityFromStatus(b.status))
    .slice(0, 5);
  const firstStaffTask = assignedWorkQueue[0] || null;
  const staffQueuePreview = assignedWorkQueue.slice(firstStaffTask ? 1 : 0, firstStaffTask ? 3 : 4);
  const staffQueueHiddenCount = Math.max(0, assignedWorkQueue.length - (firstStaffTask ? 3 : 4));
  const staffRoster = (partnerStaff.length ? partnerStaff : [{ email: user?.email, role: currentRole || 'director', scope: isDirectorRole ? 'all_cases' : 'assigned' }])
    .map(member => ({
      email: String(member.email || '').toLowerCase(),
      label: member.display_name || member.name || member.email || (isDirectorRole ? 'Director' : 'Staff member'),
      role: member.role || (isDirectorRole ? 'director' : 'staff'),
      scope: member.scope || (isDirectorRole ? 'all_cases' : 'assigned'),
      locationScope: member.location_scope || member.locationScope || 'all',
      title: member.title || '',
      annualSalary: member.annual_salary || member.annualSalary || member.salary || member.salary_amount || '',
      hourlyCost: member.hourly_cost || member.hourlyCost || member.hourly_rate || member.private_hourly_cost || '',
    }));
  const staffRosterEmails = new Set(staffRoster.map(member => member.email).filter(Boolean));
  const assignedEmails = new Set(allPartnerTasks.map(task => String(task.assigned_to_email || '').toLowerCase()).filter(Boolean));
  assignedEmails.forEach(email => {
    if (!staffRosterEmails.has(email)) {
      staffRoster.push({ email, label: email, role: 'assigned contact', scope: 'assigned', locationScope: 'case assignment', title: '', annualSalary: '', hourlyCost: '' });
      staffRosterEmails.add(email);
    }
  });
  const unassignedStaffTasks = allPartnerTasks.filter(task => !task.assigned_to_email && !['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
  const staffWorkloads = staffRoster.map(member => {
    const rows = allPartnerTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === member.email);
    const openRows = rows.filter(task => !['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
    const waitingRows = openRows.filter(task => ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase()));
    const blockedRows = openRows.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase()));
    const handledRows = rows.filter(task => ['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
    const nextTask = openRows.sort((a, b) => (a.importance?.rank ?? 9) - (b.importance?.rank ?? 9) || partnerTaskPriorityFromStatus(a.status) - partnerTaskPriorityFromStatus(b.status))[0] || null;
    return { ...member, open: openRows.length, waiting: waitingRows.length, blocked: blockedRows.length, handled: handledRows.length, nextTask };
  }).concat(unassignedStaffTasks.length ? [{
    email: '',
    label: 'Unassigned work',
    role: 'needs owner',
    scope: 'director_attention',
    open: unassignedStaffTasks.length,
    waiting: unassignedStaffTasks.filter(task => ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase())).length,
    blocked: unassignedStaffTasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length,
    handled: 0,
    nextTask: unassignedStaffTasks.sort((a, b) => (a.importance?.rank ?? 9) - (b.importance?.rank ?? 9) || partnerTaskPriorityFromStatus(a.status) - partnerTaskPriorityFromStatus(b.status))[0] || null,
  }] : []).sort((a, b) => (b.blocked - a.blocked) || (b.open - a.open) || (b.waiting - a.waiting));
  const activeEmployeeRows = staffWorkloads.filter(member => member.email);
  const managedLocationRows = locations.map(location => {
    const rows = cases.filter(item => locationNameFor(item) === location);
    const employees = activeEmployeeRows.filter(member => member.locationScope === 'all' || member.locationScope === location);
    const saved = savedPartnerLocations.find(item => String(item.name || item.location_name || '').toLowerCase() === String(location).toLowerCase()) || {};
    return {
      name: location,
      address: saved.address || saved.location_address || '',
      cases: rows.length,
      employees: employees.length,
      caseValue: rows.reduce((sum, item) => sum + caseValueNumber(item), 0),
      source: saved.source || (rows.length ? 'case data' : 'manual'),
    };
  });
  const reportStaffOptions = staffRoster.filter(member => member.email);
  const reportRangeLabel = reportRange === 'custom'
    ? `${reportDates.from || 'Any start'} to ${reportDates.to || 'Any end'}`
    : reportRange === 'all'
      ? 'All available time'
      : `Last ${reportRange} days`;
  function reportDateValue(value) {
    if (!value) return null;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : null;
  }
  function caseReportDate(item) {
    return item.updated_at || item.updatedAt || item.last_action_at || item.created_at || item.date_of_death;
  }
  function taskReportDate(task, item) {
    return task.last_action_at || task.updated_at || task.created_at || caseReportDate(item);
  }
  function reportDateInScope(value) {
    if (reportRange === 'all') return true;
    const time = reportDateValue(value);
    if (!time) return true;
    if (reportRange === 'custom') {
      const from = reportDates.from ? new Date(reportDates.from + 'T00:00:00').getTime() : null;
      const to = reportDates.to ? new Date(reportDates.to + 'T23:59:59').getTime() : null;
      return (!from || time >= from) && (!to || time <= to);
    }
    const days = Number(reportRange || 30);
    return time >= Date.now() - days * 24 * 60 * 60 * 1000;
  }
  function reportLocationInScope(item) {
    return reportLocation === 'all' || locationNameFor(item) === reportLocation;
  }
  function reportStaffInScope(task) {
    if (reportStaff === 'all') return true;
    if (reportStaff === 'unassigned') return !task.assigned_to_email && !task.assigned_to_name;
    return String(task.assigned_to_email || '').toLowerCase() === reportStaff;
  }
  const reportScopedCases = cases.filter(item => reportLocationInScope(item) && reportDateInScope(caseReportDate(item)));
  const reportScopedTasks = cases.flatMap(item => (item.tasks || []).map(task => ({
    ...task,
    caseId: item.id,
    caseName: item.deceased_name || item.estate_name || item.name || 'Family case',
    locationName: locationNameFor(item),
    reportDate: taskReportDate(task, item),
  }))).filter(task => (reportLocation === 'all' || task.locationName === reportLocation) && reportStaffInScope(task) && reportDateInScope(task.reportDate));
  const reportScopedMessages = cases.flatMap(item => (item.communications || []).map(message => ({
    ...message,
    locationName: locationNameFor(item),
    reportDate: message.created_at || message.sent_at || message.updated_at || caseReportDate(item),
  }))).filter(message => (reportLocation === 'all' || message.locationName === reportLocation) && reportDateInScope(message.reportDate));
  const reportScopedVendorRequests = cases.flatMap(item => (item.vendorRequests || []).map(request => ({
    ...request,
    caseName: item.deceased_name || item.estate_name || item.name || 'Family case',
    locationName: locationNameFor(item),
    reportDate: request.requested_at || request.responded_at || request.completed_at || caseReportDate(item),
  }))).filter(request => (reportLocation === 'all' || request.locationName === reportLocation) && reportDateInScope(request.reportDate));
  const reportScopedParticipants = reportScopedCases.flatMap(item => (item.familyParticipants || []).map(participant => ({
    ...participant,
    caseId: item.id,
    caseName: item.deceased_name || item.estate_name || item.name || 'Family case',
    locationName: locationNameFor(item),
    reportDate: participant.accepted_at || participant.created_at || caseReportDate(item),
  }))).filter(participant => reportDateInScope(participant.reportDate));
  const reportAcceptedParticipants = reportScopedParticipants.filter(participant => participant.accepted_at || /accepted|active/i.test(String(participant.invite_status || '')));
  const reportHandledTasks = reportScopedTasks.filter(task => ['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
  const reportWaitingTasks = reportScopedTasks.filter(task => ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase()));
  const reportBlockedTasks = reportScopedTasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase()));
  const reportAssignments = reportScopedTasks.filter(task => task.assigned_to_email || task.assigned_to_name || task.owner_name || task.participant_id);
  const reportCallsAvoided = reportScopedMessages.length + reportAssignments.length + reportScopedVendorRequests.length;
  const reportVendorQuoteReady = reportScopedVendorRequests.filter(request => String(request.status || '').toLowerCase() === 'accepted').length;
  const reportVendorAccepted = reportScopedVendorRequests.filter(request => ['in_progress', 'completed'].includes(String(request.status || '').toLowerCase())).length;
  const reportVendorCompleted = reportScopedVendorRequests.filter(request => String(request.status || '').toLowerCase() === 'completed').length;
  const reportVendorValue = reportScopedVendorRequests.reduce((sum, request) => sum + vendorValue(request), 0);
  const reportActiveDays = reportRange === 'all'
    ? Math.max(1, new Set(reportScopedTasks.map(task => String(task.reportDate || '').slice(0, 10)).filter(Boolean)).size || 1)
    : reportRange === 'custom'
      ? Math.max(1, Math.round(((reportDateValue(reportDates.to) || Date.now()) - (reportDateValue(reportDates.from) || Date.now())) / 86400000) || 1)
      : Math.max(1, Number(reportRange || 30));
  const reportAvgTasksPerEstate = reportScopedCases.length ? Math.round((reportScopedTasks.length / reportScopedCases.length) * 10) / 10 : 0;
  const reportTasksPerDay = Math.round((reportHandledTasks.length / reportActiveDays) * 10) / 10;
  const reportCaseValue = reportScopedCases.reduce((sum, item) => sum + caseValueNumber(item), 0);
  const reportPrepaidValue = reportScopedCases.reduce((sum, item) => sum + prepaidValueNumber(item), 0);
  const reportAvgCaseValue = reportScopedCases.length ? Math.round(reportCaseValue / reportScopedCases.length) : 0;
  const hourlyCostForEmail = (email) => {
    const member = staffRoster.find(row => row.email && row.email === String(email || '').toLowerCase());
    const hourly = moneyNumber(member?.hourlyCost);
    if (hourly) return hourly;
    const annual = moneyNumber(member?.annualSalary);
    return annual ? annual / 2080 : 0;
  };
  const taskCostEstimate = (task) => {
    const hourly = hourlyCostForEmail(task.assigned_to_email || task.last_actor);
    return hourly ? (hourly * 8) / 60 : 0;
  };
  const reportLaborCost = reportHandledTasks.reduce((sum, task) => sum + taskCostEstimate(task), 0);
  const reportCostPerResolvedTask = reportHandledTasks.length ? reportLaborCost / reportHandledTasks.length : 0;
  const reportLocations = reportLocation === 'all' ? locations : [reportLocation];
  const reportLocationRows = reportLocations.map(location => {
    const rows = cases.filter(item => locationNameFor(item) === location && reportDateInScope(caseReportDate(item)));
    const tasks = reportScopedTasks.filter(task => task.locationName === location);
    const handled = tasks.filter(task => ['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase())).length;
    const waiting = tasks.filter(task => ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase())).length;
    const blocked = tasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length;
    const messages = reportScopedMessages.filter(message => message.locationName === location).length;
    const value = rows.reduce((sum, item) => sum + caseValueNumber(item), 0);
    return [location, rows.length, moneyDisplay(value), rows.length ? moneyDisplay(value / rows.length) : '$0', tasks.length, handled, waiting + blocked, messages + tasks.filter(task => task.assigned_to_email || task.assigned_to_name).length];
  }).filter(row => row[1] || row[2]);
  const reportEmployeeRows = (reportStaff === 'all' ? staffRoster : staffRoster.filter(member => member.email === reportStaff)).map(member => {
    const tasks = reportScopedTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === member.email);
    const hourly = hourlyCostForEmail(member.email);
    const handled = tasks.filter(task => ['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase()));
    const cost = handled.reduce((sum, task) => sum + taskCostEstimate(task), 0);
    return [
      member.label || member.email,
      roleLabel(member.role),
      hourly ? moneyDisplay(hourly) + '/hr' : 'Not set',
      tasks.length,
      handled.length,
      cost ? moneyDisplay(cost) : '$0',
      handled.length && cost ? moneyDisplay(cost / handled.length) : '$0',
      tasks.filter(task => ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase())).length,
      tasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length,
    ];
  }).filter(row => row[2] || reportStaff !== 'all');
  if ((reportStaff === 'all' || reportStaff === 'unassigned') && reportScopedTasks.some(task => !task.assigned_to_email && !task.assigned_to_name)) {
    const tasks = reportScopedTasks.filter(task => !task.assigned_to_email && !task.assigned_to_name);
    reportEmployeeRows.push(['Unassigned', 'Needs owner', 'Not set', tasks.length, 0, '$0', '$0', tasks.filter(task => ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase())).length, tasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length]);
  }
  const reportTaskSummaryRows = Array.from(reportScopedTasks.reduce((map, task) => {
    const title = sharedTaskTitle(task);
    const row = map.get(title) || { title, total: 0, handled: 0, waiting: 0, blocked: 0 };
    row.total += 1;
    if (['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase())) row.handled += 1;
    if (['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase())) row.waiting += 1;
    if (['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())) row.blocked += 1;
    map.set(title, row);
    return map;
  }, new Map()).values()).sort((a, b) => b.blocked - a.blocked || b.waiting - a.waiting || b.total - a.total).slice(0, 12).map(row => [row.title, row.total, row.handled, row.waiting, row.blocked]);
  const reportCaseRows = reportScopedCases.map(item => {
    const tasks = reportScopedTasks.filter(task => task.caseId === item.id);
    return [
      item.deceased_name || item.estate_name || item.name || 'Family case',
      locationNameFor(item),
      caseValueNumber(item) ? moneyDisplay(caseValueNumber(item)) : '$0',
      caseFinancials(item)?.is_prepaid ? 'Yes' : 'No',
      tasks.length,
      tasks.filter(task => ['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase())).length,
      tasks.filter(task => ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase())).length,
      tasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length,
    ];
  }).filter(row => row[2] || reportRange === 'all').slice(0, 18);
  const focusedDisplayCases = showAllCases
    ? displayCases
    : (expandedCaseId ? displayCases.filter(item => item.id === expandedCaseId) : displayCases.slice(0, 1));
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
  const pilotFirstDayRows = [
    ['1', 'Create/open case', cases.length ? `${cases.length} active` : 'Start here'],
    ['2', 'Move one task', firstOpenCase ? sharedTaskTitle(itemNextPartnerTask(firstOpenCase, orchestrationByCaseId.get(firstOpenCase.id)) || {}) : 'No case yet'],
    ['3', 'Ask or assign', assignmentsCoordinated ? `${assignmentsCoordinated} assigned` : familyRequestsOpen ? `${familyRequestsOpen} family request${familyRequestsOpen === 1 ? '' : 's'}` : 'Choose owner'],
    ['4', 'Export proof', callsAvoided ? `${callsAvoided} calls avoided` : 'After proof is saved'],
  ];
  const partnerSetupRows = [
    ['Cases', cases.length ? `${cases.length} active` : 'Create/import first case', cases.length > 0],
    ['Locations', locations.length > 1 ? `${locations.length} from case data` : 'Main location until imports add scope', locations.length > 0],
    ['Employees', partnerStaff.length ? `${partnerStaff.length} saved` : 'Add assignable staff', partnerStaff.length > 0],
    ['Roles', roleLabel(currentRole), !!currentRole],
    ['Assignments', assignmentsCoordinated ? `${assignmentsCoordinated} task owner${assignmentsCoordinated === 1 ? '' : 's'}` : 'Use the owner dropdown', assignmentsCoordinated > 0],
    ['Local support', vendorPrefs.preferred?.length ? `${vendorPrefs.preferred.length} preferred` : 'Choose approved vendors', (vendorPrefs.preferred || []).length > 0],
  ];
  const pilotLaunchRows = [
    ['1', 'Workspace', org?.name ? `${org.name} is active` : 'Create partner workspace', !!org?.name],
    ['2', 'Locations', isMultiLocation ? `${locations.length} visible` : 'Main location ready; CSV can add more', locations.length > 0],
    ['3', 'Employees', partnerStaff.length ? `${partnerStaff.length} assignable` : 'Add director, manager, staff', partnerStaff.length > 0],
    ['4', 'Cases', cases.length ? `${cases.length} case${cases.length === 1 ? '' : 's'} loaded` : 'Import CSV or create fresh', cases.length > 0],
    ['5', 'First owner', assignmentsCoordinated ? 'Assignment dropdown in use' : 'Assign the first task owner', assignmentsCoordinated > 0],
    ['6', 'Proof loop', proofEventsLogged || totalHandled ? 'Status/proof is visible' : 'Record waiting, proof, or request', proofEventsLogged > 0 || totalHandled > 0],
    ['7', 'Invite truth', latestStaffInvite || partnerStaff.length ? 'Invite copy ready; nothing auto-sent' : 'Add staff before sending handoffs', latestStaffInvite || partnerStaff.length > 0],
    ['8', 'Billing truth', billingStatus === 'paid' || billingStatus === 'demo' || activationStatus === 'active_trial' ? (partnerPlan?.plan ? `${partnerPlan.plan} visible` : 'Trial/demo visible') : 'Billing record not linked', billingStatus === 'paid' || billingStatus === 'demo' || activationStatus === 'active_trial'],
  ];
  const launchReadyCount = pilotLaunchRows.filter(row => row[3]).length;
  const launchReadyLabel = `${launchReadyCount}/${pilotLaunchRows.length} ready`;
  const notificationReadinessRows = [
    ['Email', 'Prepared and logged before delivery. Dry-run stays safe for QA.', true],
    ['SMS', 'Prepared only until Twilio/A2P registration is active; copy fallback remains visible.', false],
    ['Owner confirmation', assignmentsCoordinated ? 'Owner proof is already feeding the case spine.' : 'Assign the first task owner to create visible proof.', assignmentsCoordinated > 0],
  ];
  const billingReadinessRows = [
    ['Plan state', partnerPlan?.plan || partnerPlan?.name || activationStatus || 'Not linked'],
    ['Billing status', billingStatus === 'paid' ? 'Paid' : billingStatus === 'demo' ? 'Demo' : billingStatus === 'stripe_pending' ? 'Stripe pending' : 'Not configured'],
    ['Seats tracked', `${activeEmployeeRows.length || partnerStaff.length} employee${(activeEmployeeRows.length || partnerStaff.length) === 1 ? '' : 's'}`],
    ['Private ROI inputs', activeEmployeeRows.some(member => moneyNumber(member.hourlyCost) || moneyNumber(member.annualSalary)) ? 'Labor cost available' : 'Add salary/hourly cost for cost-per-task reporting'],
  ];
  const contractToProofRows = [
    ['Workspace active', 'The partner team can create or import cases, add staff, assign owners, and export proof.'],
    ['Workspace opened', 'Director confirms case source, locations, staff roles, and first-day expectations.'],
    ['Cases loaded', 'Import a CSV preview or create the first at-need/pre-need case in the UI.'],
    ['Owner assigned', 'Use saved employees, family contacts, participants, vendors, or clergy from the same owner pattern.'],
    ['Proof recorded', 'Staff marks waiting, asks family once, or records the proof that closes the loop.'],
  ];
  const pilotReadyGates = [
    ['Setup gate', org?.name && partnerStaff.length > 0, org?.name ? 'Workspace active' : 'Workspace not active'],
    ['Case gate', cases.length > 0, cases.length ? `${cases.length} case${cases.length === 1 ? '' : 's'} loaded` : 'No cases loaded'],
    ['Owner gate', assignmentsCoordinated > 0, assignmentsCoordinated ? `${assignmentsCoordinated} owner${assignmentsCoordinated === 1 ? '' : 's'} assigned` : 'First owner still needed'],
    ['Proof gate', proofEventsLogged > 0 || totalHandled > 0, proofEventsLogged || totalHandled ? 'Proof/status exists' : 'Record first proof'],
    ['Export gate', true, 'CSV export available'],
  ];
  const needsFirstDaySetup = Boolean(isDirectorRole && (cases.length === 0 || partnerStaff.length <= 1 || assignmentsCoordinated === 0 || (proofEventsLogged === 0 && totalHandled === 0)));
  const lifecycleRows = [
    ['green', 'Planning', 'pre-need cases; prepaid is a funding detail', 'Family record begins before crisis.'],
    ['warm', 'Warm / care', 'transition preparation', 'Hospice, facility, contacts, dates, wishes, and handoff notes travel forward.'],
    ['red', 'Death event', 'first-hour coordination', 'Immediate owners, calls, and proof become visible.'],
    ['funeral', 'Service coordination', 'arrangements and family logistics', 'Staff, family, vendors, and participants work from one spine.'],
    ['after', 'Aftercare', 'estate, remembrance, and continuity', 'Exports and status history keep the record useful after service.'],
  ].map(([key, label, body, value]) => {
    const count = cases.filter(item => partnerLifecycleKey(item) === key).length;
    return { key, label, body, value, count, active: count > 0 };
  });
  const partnerViewTabs = isDirectorRole
    ? [
      ['work', 'Command center', 'Cases and next moves'],
      ['staff', 'Work queue', 'Assigned work'],
      ['manage', 'Management', 'Locations and permissions'],
      ['reports', 'Reporting', 'ROI and operations'],
    ]
    : [
      ['staff', 'My work', 'Assigned first'],
      ['work', 'Case context', 'Family record'],
      ['reports', 'Proof trail', 'Reports'],
    ];

  useEffect(() => {
    function handleDemoStep(event) {
      focusPartnerDemoStep(event.detail?.target || event.detail?.step);
    }
    window.addEventListener('passage-demo-step', handleDemoStep);
    return () => window.removeEventListener('passage-demo-step', handleDemoStep);
  }, [firstOpenCase?.id, data]);

  useEffect(() => {
    if (router.query.demoTour !== 'funeral-home') return;
    const step = typeof router.query.demoStep === 'string' ? router.query.demoStep : '';
    if (!step || loading) return;
    if (step === 'team') setActivePartnerView('manage');
    if (step === 'dashboard') setShowPilotGuide(false);
    if (step === 'export') {
      setShowPilotGuide(false);
      setShowTools(true);
    }
    focusPartnerDemoStep(step);
  }, [router.query.demoTour, router.query.demoStep, loading, firstOpenCase?.id]);

  useEffect(() => {
    if (loading || !data || isDirectorRole || activePartnerView !== 'work') return;
    setActivePartnerView('staff');
  }, [loading, data, isDirectorRole, activePartnerView]);

  useEffect(() => {
    if (loading || !data || activePartnerView !== 'work' || expandedCaseId || casePaneAutoOpened || !focusedDisplayCases[0]?.id) return;
    setExpandedCaseId(focusedDisplayCases[0].id);
    setCasePaneAutoOpened(true);
  }, [loading, data, activePartnerView, expandedCaseId, focusedDisplayCases, casePaneAutoOpened]);

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

  function importanceStyle(importance) {
    const rank = importance?.rank ?? 9;
    if (rank <= 0) return { bg: C.roseFaint, color: C.rose, border: C.rose + '44' };
    if (rank <= 2) return { bg: C.amberFaint, color: C.amber, border: C.amber + '44' };
    return { bg: C.sageFaint, color: C.sage, border: C.sage + '22' };
  }

  function itemNextPartnerTask(item, orchestration) {
    const stillOpen = task => task && !['handled', 'completed', 'done'].includes(String(task.status || '').toLowerCase());
    return (stillOpen(item.nextPartnerTask) ? item.nextPartnerTask : null)
      || (stillOpen(orchestration?.nextTask) ? orchestration.nextTask : null)
      || (item.partnerTasks || []).find(t => !['handled', 'completed', 'done'].includes(t.status || ''))
      || (item.tasks || []).find(t => !['handled', 'completed', 'done'].includes(t.status || ''));
  }

  return (
    <main className="partner-dashboard-page" style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia,serif', color: C.ink, overflowX: 'clip' }}>
      <style>{`
        .partner-dashboard-page, .partner-dashboard-page * { box-sizing: border-box; }
        .partner-dashboard-page { overflow-x: clip; }
        .partner-dashboard-shell { width: min(1120px, 100%); margin: 0 auto; padding: 24px 28px 50px; }
        .partner-dashboard-shell, .partner-case-card, .partner-case-card * { min-width: 0; max-width: 100%; }
        @media (max-width: 760px) {
          .partner-dashboard-shell { width: 100% !important; padding: 18px 18px 42px !important; }
          .partner-dashboard-hero { display: grid !important; grid-template-columns: 1fr !important; gap: 12px !important; }
          .partner-dashboard-actions { justify-content: flex-start !important; }
          .partner-dashboard-actions button { flex: 1 1 140px !important; }
          .partner-case-card { width: 100% !important; min-width: 0 !important; }
          .partner-case-head { padding: 15px 16px 11px !important; }
          .partner-case-body { padding: 0 16px 16px !important; }
        }
      `}</style>
      <SiteHeader user={user} onSignOut={user ? signOut : null} />
      <section className="partner-dashboard-shell" data-demo-anchor="demo-page-primary">
        <div className="partner-dashboard-hero" style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 7 }}>Partner command center</div>
            <h1 style={{ fontSize: 30, lineHeight: 1.08, margin: 0, fontWeight: 400 }}>{org?.name || 'Funeral home dashboard'}</h1>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.45, maxWidth: 620, marginTop: 8 }}>One case at a time: next task, owner, waiting point, proof, and export.</p>
          </div>
          <div className="partner-dashboard-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {user && <button onClick={() => openCasePanel('immediate')} style={{ border: 'none', borderRadius: 12, minHeight: 44, padding: '0 14px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>New at-need case</button>}
            {user && <button onClick={() => openCasePanel('preneed')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 12, minHeight: 44, padding: '0 14px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Pre-need</button>}
            {user && <button onClick={() => downloadExport('cases')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 12, minHeight: 44, padding: '0 14px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Export</button>}
            {user && <button onClick={() => setShowTools(v => !v)} style={{ border: `1px solid ${C.border}`, borderRadius: 12, minHeight: 44, padding: '0 14px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>{showTools ? 'Hide tools' : 'Tools'}</button>}
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
              event.target.value = '';
              prepareImportDraft(csv, file.name);
            }}
          />
        )}

        {!user && (
          <div style={{ maxWidth: 540 }}>
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 18, padding: '16px 18px', marginBottom: 12 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Partner workspace</div>
              <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.25, marginBottom: 8 }}>What opens after sign-in</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  'Active cases with family progress and next steps',
                  'Staff queue showing who owns what',
                  'Proof and waiting states tied to the family record',
                  'CSV export back to your existing system',
                ].map(item => (
                  <div key={item} style={{ display: 'grid', gridTemplateColumns: '16px minmax(0,1fr)', gap: 7, color: C.mid, fontSize: 13.2, lineHeight: 1.45 }}>
                    <span style={{ color: C.sage, fontWeight: 900 }}>→</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 28, lineHeight: 1.12, marginBottom: 8 }}>Sign in to your partner workspace.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Only staff connected to a Passage partner organization can view cases, staff assignments, proof, and exports.</p>
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
                  style={{ border: `1.5px solid ${C.border}`, borderRadius: 13, background: C.bg, padding: '12px 13px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 14 }}
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
                  style={{ border: `1.5px solid ${C.border}`, borderRadius: 13, background: C.bg, padding: '12px 13px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 14 }}
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
          </div>
        )}

        {user && loading && <div style={{ color: C.soft }}>Loading partner cases...</div>}
        {user && error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16, color: C.rose }}>{error}</div>}
        {user && notice && <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}30`, borderRadius: 14, padding: 16, color: C.sage, marginBottom: 10 }}>{notice}</div>}
        {user && !loading && data?.demoData && (
          <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 14, padding: 14, color: C.amber, marginBottom: 10, lineHeight: 1.45, fontWeight: 900 }}>
            {data.demoLabel || 'Demo data is loaded for this walkthrough. No email, SMS, or production record is changed by demo actions.'}
          </div>
        )}
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
        {partnerTrialExpired && (
          <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, borderRadius: 14, padding: 16, color: C.rose, marginBottom: 12, lineHeight: 1.45 }}>
            This partner trial has ended. Existing cases stay visible; ask Passage to reactivate billing before creating new pilot cases.
          </div>
        )}

        {false && user && !loading && data && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '11px 12px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Partner command center</div>
              <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.4, marginTop: 3 }}>Cases are the work surface. Setup, lifecycle, import, and exports stay behind tools until needed.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setShowPilotGuide(prev => !prev)} style={{ border: `1px solid ${C.sage}33`, background: showPilotGuide ? C.sage : C.sageFaint, color: showPilotGuide ? '#fff' : C.sage, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}>{showPilotGuide ? 'Hide setup' : 'Setup'}</button>
              <button onClick={() => setShowTools(prev => !prev)} style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>{showTools ? 'Hide tools' : 'Tools'}</button>
            </div>
          </div>
        )}

        {user && !loading && data && isDirectorRole && showPilotGuide && (
          <HelpOverlay onClose={() => setShowPilotGuide(false)}>
            <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .9fr) minmax(280px, 1.1fr)', gap: 18, alignItems: 'start' }}>
                <div>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>First-day pilot setup</div>
                  <div style={{ color: C.ink, fontSize: 30, lineHeight: 1.08, marginTop: 6 }}>Set up once, then operate from the case pane.</div>
                  <p style={{ color: C.mid, fontSize: 13.5, lineHeight: 1.55, margin: '10px 0 0' }}>A signed home should not hunt around. Confirm the workspace, add employees, create or import cases, assign one owner, record proof, then export the record back out.</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                    <button onClick={() => { setShowPilotGuide(false); openCasePanel('immediate'); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Create first case</button>
                    <button onClick={() => { setShowPilotGuide(false); setShowTools(true); window.setTimeout(() => document.getElementById('partner-csv-upload')?.click(), 0); }} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Import CSV</button>
                    <button onClick={() => { openPartnerManagement('Opening employee setup. Add the director first, then managers and staff.'); setShowStaffSetup(true); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Add employees</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {pilotLaunchRows.map(([n, title, body, done]) => (
                    <div key={title} style={{ background: done ? C.sageFaint : C.bg, border: `1px solid ${done ? C.sage + '22' : C.border}`, borderRadius: 13, padding: '11px 12px', display: 'grid', gridTemplateColumns: '26px minmax(0,1fr)', gap: 9, alignItems: 'start' }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: done ? C.sage : C.card, color: done ? '#fff' : C.soft, fontSize: 11, fontWeight: 900 }}>{n}</span>
                      <span>
                        <span style={{ display: 'block', color: C.ink, fontSize: 13.5, fontWeight: 900 }}>{title}</span>
                        <span style={{ display: 'block', color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 3 }}>{body}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8, marginTop: 14 }}>
                {contractToProofRows.map(([title, body], index) => (
                  <div key={title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 11px' }}>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{index + 1}. {title}</div>
                    <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.42, marginTop: 4 }}>{body}</div>
                  </div>
                ))}
              </div>
            </section>
          </HelpOverlay>
        )}

        {false && user && !loading && data && (
          <div style={{ marginBottom: 10 }}>
            <SpineTrustStrip
              compact
              eyebrow="Partner proof boundary"
              title="Act on behalf of the family without trapping the record."
              rows={[
                ['Family sees', 'Status, approved updates, waiting points, and proof.'],
                ['Staff sees', 'Assigned case work, owner, next action, and proof requirement.'],
                ['Export keeps', 'Tasks, dates, owners, messages, vendor status, and proof trail.'],
              ]}
            />
          </div>
        )}

        {false && user && !loading && data && needsFirstDaySetup && !showPilotGuide && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 16, padding: 12, marginBottom: 10, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900 }}>First-day setup</div>
              <div style={{ color: C.ink, fontSize: 17, lineHeight: 1.25, fontWeight: 900, marginTop: 3 }}>{nextDirectorStep.label}: {nextDirectorStep.next}</div>
              <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>The full guide stays tucked away. Start with one case, one owner, one proof event, then export.</div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPilotGuide(true)} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Open guide</button>
              <button onClick={() => openCasePanel('immediate')} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Create case</button>
              <button onClick={() => openPartnerManagement('Opening locations, employees, roles, and permissions.')} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Add staff</button>
            </div>
          </div>
        )}

        {false && user && !loading && data && isDirectorRole && showPilotGuide && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 12, boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>First-day pilot launch</div>
                <div style={{ color: C.ink, fontSize: 24, lineHeight: 1.16, marginTop: 4 }}>Set up the operating spine, then load cases one of two ways.</div>
                <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.5, marginTop: 5 }}>After setup, every estate task reuses the same locations, saved employees, roles, family contacts, and preferred local support. Nobody should retype the same owner list case by case.</div>
              </div>
              <div style={{ color: C.soft, fontSize: 11.5, lineHeight: 1.4, maxWidth: 250 }}>Pilot-safe: imports preview first, invite messages are copied only, and no email or SMS is sent automatically.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 12 }}>
              {pilotLaunchRows.map(([n, title, body, done]) => (
                <div key={title} style={{ background: done ? C.sageFaint : C.bg, border: `1px solid ${done ? C.sage + '22' : C.border}`, borderRadius: 12, padding: '10px 11px', display: 'grid', gridTemplateColumns: '24px minmax(0,1fr)', gap: 8, alignItems: 'start', minHeight: 72 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: done ? C.sage : C.card, color: done ? '#fff' : C.soft, fontSize: 11, fontWeight: 900 }}>{n}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', color: C.ink, fontSize: 13, fontWeight: 900 }}>{title}</span>
                    <span style={{ display: 'block', color: C.mid, fontSize: 11.8, lineHeight: 1.35, marginTop: 3 }}>{body}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 14, padding: 12, marginTop: 12 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>First pilot day</div>
              <div style={{ color: C.ink, fontSize: 17, lineHeight: 1.25, fontWeight: 900, marginTop: 4 }}>A director should be able to do four things before lunch.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginTop: 10 }}>
                {[
                  ['Set the floor', 'Confirm locations, staff roles, and the first case source.'],
                  ['Load work', 'Import a CSV with preview or create one at-need case by hand.'],
                  ['Assign owner', 'Use the saved owner list so staff, family, vendors, and participants stay scoped.'],
                  ['Show proof', 'Record waiting/proof and export a case summary back to the existing system.'],
                ].map(([title, body]) => (
                  <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                    <div style={{ color: C.ink, fontSize: 13, fontWeight: 900 }}>{title}</div>
                    <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.4, marginTop: 3 }}>{body}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 10, marginTop: 12 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Contract to first proof</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>This is the day-one operating path. A director should not have to discover the product by clicking around.</div>
                <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
                  {contractToProofRows.map(([title, body], index) => (
                    <div key={title} style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr)', gap: 8, alignItems: 'start', background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 9px' }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{index + 1}</span>
                      <span>
                        <span style={{ display: 'block', color: C.ink, fontSize: 12.8, fontWeight: 900 }}>{title}</span>
                        <span style={{ display: 'block', color: C.mid, fontSize: 11.8, lineHeight: 1.35, marginTop: 2 }}>{body}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Pilot readiness gates</div>
                <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
                  {pilotReadyGates.map(([label, done, value]) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 8, alignItems: 'center', background: done ? C.sageFaint : C.amberFaint, border: `1px solid ${done ? C.sage + '22' : C.amber + '33'}`, borderRadius: 11, padding: '8px 9px' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, background: done ? C.sage : C.amber, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900 }}>{done ? 'OK' : '!'}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', color: C.ink, fontSize: 12.5, fontWeight: 900 }}>{label}</span>
                        <span style={{ display: 'block', color: C.mid, fontSize: 11.8, lineHeight: 1.35 }}>{value}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 10 }}>A pilot is ready to run when the director can create/import a case, assign one owner, record proof, and export the record without Passage staff doing the work for them.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 12 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Path A: import existing cases</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>Download the template, map columns, preview rows, then import. Location names from the file become the location filter and reporting scope.</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                  <a href="/api/partnerImportTemplate" style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '8px 10px', textDecoration: 'none', fontSize: 11.8, fontWeight: 900 }}>Download template</a>
                  <button onClick={() => { setShowTools(true); document.getElementById('partner-csv-upload')?.click(); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontSize: 11.8, fontWeight: 900, cursor: 'pointer' }}>Upload CSV</button>
                </div>
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Path B: start fresh in UI</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>Create one case, add the family coordinator, save known dates, then assign the next task from the owner dropdown.</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                  <button onClick={() => openCasePanel('immediate')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontSize: 11.8, fontWeight: 900, cursor: 'pointer' }}>Create at-need case</button>
                  <button onClick={() => openCasePanel('preneed')} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontSize: 11.8, fontWeight: 900, cursor: 'pointer' }}>Create pre-need case</button>
                </div>
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Then assign work</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>Add employees once. Directors, location managers, staff, family coordinators, and participants appear in the same assignment dropdown inside each estate task.</div>
                <button onClick={() => openPartnerManagement('Opening locations, employees, roles, and permissions.')} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontSize: 11.8, fontWeight: 900, cursor: 'pointer', marginTop: 10 }}>Open management</button>
              </div>
            </div>
          </div>
        )}

        {user && !loading && showTools && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Partner tools</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>Bring case data in, coordinate the family work here, and export the record back out when your existing system needs it.</div>
              </div>
              <button onClick={() => setShowTools(false)} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 9, padding: '6px 9px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginTop: 12 }}>
              <button onClick={() => document.getElementById('partner-csv-upload')?.click()} style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Upload CSV</button>
              <a href="/api/partnerImportTemplate" style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Download template</a>
              <button onClick={() => downloadExport('spine')} style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Download full spine</button>
              <button onClick={() => emailExport('cases')} style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>{updating === 'email_case_export' ? 'Sending...' : 'Email case summary'}</button>
              <button onClick={() => startPartnerCheckout('partner_pilot')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{partnerPlan?.plan ? `Billing: ${partnerPlan.plan}` : 'Start pilot billing'}</button>
            </div>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 11, marginTop: 10 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Export date range</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 8 }}>
                <label style={{ display: 'grid', gap: 4, color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                  Updated from
                  <input type="date" value={exportRange.from} onChange={event => setExportRange(prev => ({ ...prev, from: event.target.value }))} style={inputStyle} />
                </label>
                <label style={{ display: 'grid', gap: 4, color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                  Updated to
                  <input type="date" value={exportRange.to} onChange={event => setExportRange(prev => ({ ...prev, to: event.target.value }))} style={inputStyle} />
                </label>
                <div style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setExportRange({ from: '', to: '' })} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>All dates</button>
                  <button onClick={() => {
                    const to = new Date();
                    const from = new Date();
                    from.setDate(to.getDate() - 30);
                    setExportRange({ from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
                  }} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Last 30 days</button>
                </div>
              </div>
              <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 7 }}>Range filters by case updated date so weekly/monthly reports stay predictable for directors and location managers.</div>
            </div>
            {importDraft && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Map import columns</div>
                    <div style={{ color: C.ink, fontSize: 16, lineHeight: 1.25, marginTop: 3 }}>{importDraft.fileName}</div>
                  </div>
                  <div style={{ color: C.mid, fontSize: 12.3 }}>{importDraft.headers.length} columns detected</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 10 }}>
                  {IMPORT_FIELDS.map(([key, label, required]) => (
                    <label key={key} style={{ display: 'grid', gap: 4, color: required && !importDraft.mapping?.[key] ? C.rose : C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                      {label}{required ? ' *' : ''}
                      <select
                        value={importDraft.mapping?.[key] || ''}
                        onChange={event => setImportDraft(prev => ({ ...prev, preview: null, errors: [], mapping: { ...(prev?.mapping || {}), [key]: event.target.value } }))}
                        style={inputStyle}>
                        <option value="">Do not import</option>
                        {importDraft.headers.map(header => (
                          <option key={`${key}_${header}`} value={header}>{header}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 10 }}>
                  Required fields create the family case. Date fields feed the orchestration spine so Passage can rank work around pronouncement, arrangement, service, burial, reception, and obituary timing.
                </div>
                {importDraft.preview && (
                  <div style={{ background: C.card, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: 10, marginTop: 10 }}>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Import preview</div>
                    <div style={{ color: C.ink, fontSize: 14.5, lineHeight: 1.35, marginTop: 3 }}>{importDraft.readyRows || 0} ready of {importDraft.totalRows || 0} rows. {importDraft.errorRows ? `${importDraft.errorRows} need fixes.` : 'No row errors found.'}</div>
                    <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                      {(importDraft.preview || []).slice(0, 4).map(row => (
                        <div key={row.row} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 12.2, lineHeight: 1.4 }}>
                          <strong style={{ color: C.ink }}>Row {row.row}: {row.caseName}</strong> - {row.familyContact} ({row.familyEmail}){row.reference ? ` - Ref ${row.reference}` : ''}. {row.eventCount} lifecycle date{row.eventCount === 1 ? '' : 's'} mapped.
                        </div>
                      ))}
                    </div>
                    {importDraft.errors?.length > 0 && (
                      <div style={{ color: C.rose, fontSize: 12.2, lineHeight: 1.45, marginTop: 8 }}>
                        {importDraft.errors.slice(0, 3).join(' ')}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <button onClick={previewMappedImport} disabled={updating === 'partner_import_preview'} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: updating === 'partner_import_preview' ? 'wait' : 'pointer' }}>{updating === 'partner_import_preview' ? 'Checking...' : 'Preview mapped cases'}</button>
                  <button onClick={submitMappedImport} disabled={updating === 'partner_import' || !importDraft.preview || importDraft.errors?.length > 0} style={{ border: 'none', background: !importDraft.preview || importDraft.errors?.length > 0 ? C.border : C.sage, color: '#fff', borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: updating === 'partner_import' ? 'wait' : !importDraft.preview || importDraft.errors?.length > 0 ? 'not-allowed' : 'pointer' }}>{updating === 'partner_import' ? 'Importing...' : 'Import after preview'}</button>
                  <button onClick={() => setImportDraft(null)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 10 }}>
              {[
                ['Import accepts', 'Passage template plus common case-system names such as decedent, family contact, case number, service date, funeral date, burial date, and obituary deadline.'],
                ['Export includes', 'Case summary CSV for existing systems plus full-spine CSV for tasks, owners, messages, vendor requests, proof requirements, and payment/reporting fields where present.'],
                ['Pilot posture', "CSV bridge now. Direct adapters should be mapped after we see each home's actual Passare, Gather, SRS, Tribute, or local export shape."],
              ].map(([title, body]) => (
                <div key={title} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: '10px 11px' }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {false && user && !loading && data && (
          <div id="partner-today-section" style={{ background: C.card, color: C.ink, border: `1px solid ${C.border}`, borderBottom: 'none', borderRadius: '18px 18px 0 0', padding: 14, marginBottom: 0, boxShadow: '0 4px 20px rgba(0,0,0,.04)', scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 9 }}>
              <div>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Today</span>
                  <span style={{ color: isDirectorRole ? C.sage : C.amber, background: isDirectorRole ? C.sageFaint : C.amberFaint, border: `1px solid ${isDirectorRole ? C.sage : C.amber}22`, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 900 }}>{roleLabel(currentRole)}</span>
                </div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>{isDirectorRole ? 'All cases, staff queues, location scope, reports, and delegation.' : 'Assigned work first. Case context stays attached to each task.'}</div>
              </div>
              <button onClick={() => setShowDirectorHelp(true)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '8px 11px', fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>?</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {glanceItems.slice(0, 4).map(([label, value]) => (
                <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: '10px 12px', minHeight: 58 }} title={label === 'Estimated calls avoided' ? 'Based on messages sent and assignments coordinated through Passage.' : ''}>
                  <div style={{ color: C.sage, fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 22, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, background: isDirectorRole ? C.bg : C.sageFaint, border: `1px solid ${isDirectorRole ? C.border : C.sage + '22'}`, borderRadius: 13, padding: '11px 12px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ color: isDirectorRole ? C.sage : C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{isDirectorRole ? 'Director focus today' : 'My work today'}</div>
                <div style={{ color: C.ink, fontSize: 14.5, fontWeight: 900, lineHeight: 1.25, marginTop: 3 }}>
                  {isDirectorRole
                    ? `${nextDirectorStep.label}: ${nextDirectorStep.next}`
                    : firstStaffTask
                      ? sharedTaskTitle(firstStaffTask)
                      : 'No assigned work is waiting.'}
                </div>
                <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 3 }}>
                  {isDirectorRole
                    ? 'Use this to show the owner exactly where Passage reduces calls and dropped follow-up.'
                    : firstStaffTask
                      ? `Case: ${firstStaffTask.caseName}. Status: ${statusLabel(firstStaffTask.status)}.`
                      : 'When a director assigns work, it appears here first with case context and proof requirements.'}
                </div>
              </div>
              <button onClick={moveDirectorFocus} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {directorFocusButtonLabel()}
              </button>
            </div>
            {isDirectorRole && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 7, marginTop: 9 }}>
                {[
                  ['Waiting on family', () => firstOpenCase?.id && openPartnerWork(firstOpenCase.id)],
                  ['Reassign work', () => openPartnerPane('staff', 'partner-staff-section', 'Opening staff assignment.')],
                  ['Mark done / proof', () => firstOpenCase?.id && openPartnerWork(firstOpenCase.id)],
                  ['Export case data', () => downloadExport('cases')],
                ].map(([label, action]) => (
                  <button key={label} onClick={action} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.ink, borderRadius: 11, minHeight: 40, padding: '0 10px', fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
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
            {funeralHomeShare > 0 && <div style={{ color: C.sage, fontSize: 12.5, lineHeight: 1.45, marginTop: 9, fontWeight: 900 }}>Estimated partner share tracked: ${Math.round(funeralHomeShare)}.</div>}
            {false && isDirectorRole && showPilotGuide && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                {pilotFirstDayRows.map(([n, label, value]) => (
                  <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px', display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr)', gap: 8, alignItems: 'start' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.sageFaint, color: C.sage, fontSize: 11, fontWeight: 900 }}>{n}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', color: C.soft, fontSize: 9.5, letterSpacing: '.09em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</span>
                      <span style={{ display: 'block', color: C.ink, fontSize: 12.2, lineHeight: 1.3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {false && isDirectorRole && showPilotGuide && (
              <div style={{ marginTop: 10, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Partner setup path</div>
                    <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 3 }}>Set up once, then reuse the same cases, locations, staff, roles, and vendors from every estate task assignment.</div>
                  </div>
                  <div style={{ color: C.soft, fontSize: 11.5, fontWeight: 900 }}>Locations come from case/import data today.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 8, marginTop: 10 }}>
                  {partnerSetupRows.map(([label, value, done]) => (
                    <div key={label} style={{ background: done ? C.sageFaint : C.card, border: `1px solid ${done ? C.sage + '22' : C.border}`, borderRadius: 11, padding: '9px 10px', minHeight: 64 }}>
                      <div style={{ color: done ? C.sage : C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                      <div style={{ color: C.ink, fontSize: 12.2, lineHeight: 1.3, marginTop: 5, fontWeight: 900 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <button onClick={() => openCasePanel('immediate')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontSize: 11.8, fontWeight: 900, cursor: 'pointer' }}>Create case</button>
                  <button onClick={() => { setShowTools(true); setImportDraft(null); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontSize: 11.8, fontWeight: 800, cursor: 'pointer' }}>Import locations</button>
                  <button onClick={() => openPartnerManagement('Opening locations, employees, roles, and permissions.')} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontSize: 11.8, fontWeight: 900, cursor: 'pointer' }}>Set up employees</button>
                  <button onClick={() => openPartnerPane('reports', 'partner-reports-section', 'Opening reports.')} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontSize: 11.8, fontWeight: 800, cursor: 'pointer' }}>Check reporting</button>
                </div>
              </div>
            )}
          </div>
        )}

        {user && !loading && data && showDirectorHelp && (
          <HelpOverlay onClose={() => setShowDirectorHelp(false)}>
            <DirectorOperatingLoop
              steps={directorLoopSteps}
              nextStep={nextDirectorStep}
              useCases={directorUseCases}
              firstOpenCase={firstOpenCase}
              onCreateCase={() => { setShowDirectorHelp(false); openCasePanel('immediate'); }}
              onOpenCase={(caseId) => { setShowDirectorHelp(false); openPartnerWork(caseId); }}
              onExport={() => { setShowDirectorHelp(false); downloadExport(); }}
            />
          </HelpOverlay>
        )}

        {false && user && !loading && data && activePartnerView === 'work' && (
          <PartnerDirectorFocus
            riskItems={riskItems}
            inboxItems={spineInbox}
            caseItems={caseInbox}
            isMultiLocation={isMultiLocation}
            onOpenCase={openPartnerWork}
          />
        )}

        {user && !loading && data && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderBottom: activePartnerView === 'work' ? 'none' : `1px solid ${C.border}`, borderRadius: activePartnerView === 'work' ? '18px 18px 0 0' : 18, padding: 8, marginBottom: activePartnerView === 'work' ? 0 : 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
            {partnerViewTabs.map(([key, title, body]) => (
              <button key={key} onClick={() => setActivePartnerView(key)} style={{ flex: '1 1 150px', textAlign: 'left', border: `1px solid ${activePartnerView === key ? C.sage : C.border}`, background: activePartnerView === key ? C.sage : C.bg, color: activePartnerView === key ? '#fff' : C.ink, borderRadius: 12, padding: '10px 12px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{title}</div>
                <div style={{ fontSize: 11, opacity: .78, marginTop: 2 }}>{body}</div>
              </button>
            ))}
          </div>
        )}

        {user && !loading && data && activePartnerView === 'manage' && isDirectorRole && (
          <div id="partner-management-section" data-demo-anchor="demo-partner-setup" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,.05)', scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 14 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Partner management</div>
                <div style={{ fontSize: 24, lineHeight: 1.15, marginTop: 3 }}>Locations, employees, roles, permissions, and private economics.</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5, maxWidth: 720 }}>Set this up once. The same roster feeds case creation, owner dropdowns, staff queues, reporting, and exports.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowLocationSetup(true)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Add location</button>
                <button onClick={() => setShowStaffSetup(true)} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Add employee</button>
              </div>
            </div>

            <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 15, padding: 13, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Launch readiness</div>
                  <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.2, fontWeight: 900, marginTop: 3 }}>Can this home operate without Passage holding its hand?</div>
                </div>
                <div style={{ color: launchReadyCount === pilotLaunchRows.length ? C.sage : C.amber, background: C.card, border: `1px solid ${launchReadyCount === pilotLaunchRows.length ? C.sage + '33' : C.amber + '33'}`, borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 900 }}>{launchReadyLabel}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 8, marginTop: 10 }}>
                {pilotLaunchRows.map(([n, title, body, done]) => (
                  <div key={`manage_${title}`} style={{ background: done ? C.card : C.amberFaint, border: `1px solid ${done ? C.border : C.amber + '33'}`, borderRadius: 11, padding: '9px 10px', minHeight: 72 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <div style={{ color: done ? C.sage : C.amber, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{title}</div>
                      <span style={{ color: done ? C.sage : C.amber, fontSize: 11, fontWeight: 900 }}>{done ? 'Ready' : n}</span>
                    </div>
                    <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.4, marginTop: 6 }}>{body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, .8fr)', gap: 12, alignItems: 'start' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 14, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Locations</div>
                      <div style={{ color: C.ink, fontSize: 17, fontWeight: 900, marginTop: 3 }}>Scope work by chapel, branch, or care market.</div>
                    </div>
                    <button onClick={() => setShowLocationSetup(true)} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>New location</button>
                  </div>
                  <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
                    {managedLocationRows.length === 0 ? (
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '10px 11px', color: C.mid, fontSize: 12.5 }}>No locations yet. Add the main location first, or import cases with location names.</div>
                    ) : managedLocationRows.map(location => (
                      <div key={location.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) repeat(3, minmax(70px,.28fr))', gap: 8, alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: C.ink, fontSize: 13.2, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis' }}>{location.name}</div>
                          <div style={{ color: C.mid, fontSize: 11.6, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{location.address || location.source}</div>
                        </div>
                        <div><div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Cases</div><div style={{ color: C.ink, fontWeight: 900 }}>{location.cases}</div></div>
                        <div><div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Staff</div><div style={{ color: C.ink, fontWeight: 900 }}>{location.employees}</div></div>
                        <div><div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Value</div><div style={{ color: C.ink, fontWeight: 900 }}>{location.caseValue ? moneyDisplay(location.caseValue) : '$0'}</div></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 9 }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Employees</div>
                      <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>Saved employees become the owner list inside every case task. Invites stay prepared until your team sends them.</div>
                    </div>
                    <button onClick={() => setShowStaffSetup(true)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Add employee</button>
                  </div>
                  {activeEmployeeRows.length === 0 ? (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '10px 11px', color: C.mid, fontSize: 12.5 }}>No employees are saved yet. Add the funeral home owner/director first, then location managers and staff.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 7 }}>
                      {activeEmployeeRows.map(member => (
                        <div key={member.email} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(120px,.55fr) minmax(120px,.55fr) auto', gap: 8, alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: C.ink, fontSize: 13.2, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.label || member.email}</div>
                            <div style={{ color: C.mid, fontSize: 11.7, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
                          </div>
                          <div><div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Role</div><div style={{ color: C.ink, fontSize: 12.2, fontWeight: 900 }}>{roleLabel(member.role)}</div></div>
                          <div><div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Scope</div><div style={{ color: C.mid, fontSize: 12.2 }}>{member.locationScope === 'all' ? 'All locations' : member.locationScope || 'All locations'}</div></div>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button onClick={() => { setStaffDraft({ name: member.label === member.email ? '' : member.label || '', email: member.email || '', role: member.role || 'staff', locationScope: member.locationScope || 'all', annualSalary: member.annualSalary || '', hourlyCost: member.hourlyCost || '' }); setShowStaffSetup(true); }} style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => copyText(staffInviteMessage(member), 'Staff invite message copied.')} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Copy invite</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Role permissions</div>
                  <div style={{ display: 'grid', gap: 8, marginTop: 9 }}>
                    {[
                      ['Director / owner', 'All cases, all locations, staff setup, reports, exports, billing prompts, and pilot controls.'],
                      ['Location manager', 'Cases and reporting for their location scope; can assign staff and move work.'],
                      ['Staff', 'Assigned work first; can mark waiting, request family info, record proof, and close tasks.'],
                      ['Participant / family helper', 'Scoped to the task or estate slice they were invited to handle.'],
                    ].map(([title, body]) => (
                      <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                        <div style={{ color: C.ink, fontSize: 13, fontWeight: 900 }}>{title}</div>
                        <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.4, marginTop: 3 }}>{body}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 14, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Private economics</div>
                  <div style={{ color: C.ink, fontSize: 16, fontWeight: 900, marginTop: 4 }}>Salary, cost, and case value stay inside partner reporting.</div>
                  <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 5 }}>Families never see staff costs. Directors can compare case value, labor cost, tasks resolved, messages sent, and location efficiency in Reporting.</div>
                  <button onClick={() => setActivePartnerView('reports')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', marginTop: 10, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Open reporting</button>
                </div>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Billing and seats</div>
                  <div style={{ display: 'grid', gap: 7, marginTop: 9 }}>
                    {billingReadinessRows.map(([label, value]) => (
                      <div key={label} style={{ display: 'grid', gridTemplateColumns: '115px minmax(0,1fr)', gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 7, color: C.mid, fontSize: 12.1, lineHeight: 1.35 }}>
                        <strong style={{ color: C.ink }}>{label}</strong>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Notification truth</div>
                  <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 5 }}>Passage prepares the handoff, records proof, and keeps the fallback obvious. Nothing quietly sends from a demo or dry-run state.</div>
                  <div style={{ display: 'grid', gap: 7, marginTop: 9 }}>
                    {notificationReadinessRows.map(([label, body, ready]) => (
                      <div key={label} style={{ background: ready ? C.sageFaint : C.amberFaint, border: `1px solid ${ready ? C.sage + '22' : C.amber + '33'}`, borderRadius: 10, padding: '8px 9px' }}>
                        <div style={{ color: ready ? C.sage : C.amber, fontSize: 11, fontWeight: 900 }}>{label}</div>
                        <div style={{ color: C.mid, fontSize: 11.7, lineHeight: 1.4, marginTop: 3 }}>{body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {showStaffSetup && (
              <div onClick={() => setShowStaffSetup(false)} style={{ position: 'fixed', inset: 0, zIndex: 230, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                <form onSubmit={addPartnerStaff} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add employee" style={{ width: 'min(760px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Add employee</div>
                      <div style={{ color: C.ink, fontSize: 22, lineHeight: 1.2, fontWeight: 900, marginTop: 4 }}>Make someone assignable.</div>
                    </div>
                    <button type="button" onClick={() => setShowStaffSetup(false)} aria-label="Close staff setup" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 34, height: 34, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
                  </div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 }}>Save the employee, assign a role and location scope, then copy the invite message. Nothing sends automatically.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8, alignItems: 'center' }}>
                    <input value={staffDraft.name} onChange={event => setStaffDraft(prev => ({ ...prev, name: event.target.value }))} placeholder="Full name" style={inputStyle} />
                    <input value={staffDraft.email} onChange={event => setStaffDraft(prev => ({ ...prev, email: event.target.value }))} placeholder="employee@funeralhome.com" style={inputStyle} />
                    <select value={staffDraft.role} onChange={event => setStaffDraft(prev => ({ ...prev, role: event.target.value }))} style={inputStyle}>
                      <option value="director">Director / owner</option>
                      <option value="location_manager">Location manager</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select value={staffDraft.locationScope} onChange={event => setStaffDraft(prev => ({ ...prev, locationScope: event.target.value }))} style={inputStyle}>
                      <option value="all">All locations</option>
                      {locations.map(location => <option key={location} value={location}>{location}</option>)}
                    </select>
                    <input inputMode="decimal" value={staffDraft.annualSalary} onChange={event => setStaffDraft(prev => ({ ...prev, annualSalary: event.target.value }))} placeholder="Private annual salary" style={inputStyle} />
                    <input inputMode="decimal" value={staffDraft.hourlyCost} onChange={event => setStaffDraft(prev => ({ ...prev, hourlyCost: event.target.value }))} placeholder="Or hourly cost" style={inputStyle} />
                  </div>
                  <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>Role controls starting view and permissions. Cost fields stay private to partner reporting and power ROI, cost per task, and location efficiency.</div>
                  {latestStaffInvite && (
                    <div style={{ marginTop: 10, background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 12, padding: 10 }}>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Staff handoff ready</div>
                      <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 4 }}>{latestStaffInvite.email} can now be assigned work. Passage will not send the invite automatically.</div>
                      <button type="button" onClick={() => copyText(staffInviteMessage(latestStaffInvite), 'Staff invite message copied.')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', marginTop: 8 }}>Copy invite message</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <button disabled={updating === 'partner_staff'} style={{ border: 'none', background: updating === 'partner_staff' ? C.border : C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: updating === 'partner_staff' ? 'wait' : 'pointer' }}>{updating === 'partner_staff' ? 'Saving...' : 'Save as assignable staff'}</button>
                    <button type="button" onClick={() => setShowStaffSetup(false)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                  </div>
                </form>
              </div>
            )}

            {showLocationSetup && (
              <div onClick={() => setShowLocationSetup(false)} style={{ position: 'fixed', inset: 0, zIndex: 230, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                <form onSubmit={addPartnerLocation} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add location" style={{ width: 'min(720px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Add location</div>
                      <div style={{ color: C.ink, fontSize: 22, lineHeight: 1.2, fontWeight: 900, marginTop: 4 }}>Create a location scope.</div>
                    </div>
                    <button type="button" onClick={() => setShowLocationSetup(false)} aria-label="Close location setup" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 34, height: 34, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
                  </div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 }}>Locations scope cases, employees, reports, imports, and exports. Use a real branch, chapel, care market, or operating location.</div>
                  <input value={locationDraft.name} onChange={event => setLocationDraft(prev => ({ ...prev, name: event.target.value }))} placeholder="Location name, e.g. Main location" style={{ ...inputStyle, marginBottom: 10, width: '100%', boxSizing: 'border-box' }} />
                  <SmartAddressInput
                    compact
                    label="Location address"
                    value={locationDraft.address}
                    onChange={(value, parsed = {}) => setLocationDraft(prev => ({
                      ...prev,
                      address: value,
                      name: prev.name || parsed.placeName || '',
                      city: parsed.city || '',
                      state: parsed.state || '',
                      zip: parsed.postalCode || '',
                      country: parsed.country || '',
                      placeId: parsed.placeId || '',
                    }))}
                    colors={C}
                    inputStyle={{ background: C.bg }}
                    placeholder="Start typing the location address"
                    hint="Choose a suggestion to attach city, state, ZIP, and country."
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <button disabled={updating === 'partner_location'} style={{ border: 'none', background: updating === 'partner_location' ? C.border : C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: updating === 'partner_location' ? 'wait' : 'pointer' }}>{updating === 'partner_location' ? 'Saving...' : 'Save location'}</button>
                    <button type="button" onClick={() => setShowLocationSetup(false)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {user && !loading && data && activePartnerView === 'staff' && (
          <div id="partner-staff-section" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,.05)', scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Work queue</div>
                <div style={{ fontSize: 24, marginTop: 3 }}>{isDirectorRole ? 'Assign the next owner, then get out of the way.' : 'Your assigned queue comes first.'}</div>
              </div>
              {isDirectorRole && <button onClick={() => openPartnerManagement('Opening locations, employees, roles, and permissions.')} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Manage people</button>}
            </div>
            {false && isDirectorRole && (
              <>
                {showStaffSetup && (
                  <div onClick={() => setShowStaffSetup(false)} style={{ position: 'fixed', inset: 0, zIndex: 230, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                    <form onSubmit={addPartnerStaff} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add employee" style={{ width: 'min(680px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                        <div>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Add employee</div>
                          <div style={{ color: C.ink, fontSize: 22, lineHeight: 1.2, fontWeight: 900, marginTop: 4 }}>Make someone assignable.</div>
                        </div>
                        <button type="button" onClick={() => setShowStaffSetup(false)} aria-label="Close staff setup" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 34, height: 34, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
                      </div>
                      <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 }}>Save the employee, then copy the invite message. Nothing sends automatically. Once they create or sign into a Passage account with this email, their role controls where they land.</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 10 }}>
                        {[
                          ['1', 'Name and email'],
                          ['2', 'Role and location'],
                          ['3', 'Copy invite'],
                          ['4', 'Assign from case'],
                        ].map(([n, label]) => (
                          <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 9px', display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 7, alignItems: 'center' }}>
                            <span style={{ width: 22, height: 22, borderRadius: 999, background: C.sageFaint, color: C.sage, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>{n}</span>
                            <span style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.25, fontWeight: 800 }}>{label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8, alignItems: 'center' }}>
                        <input value={staffDraft.name} onChange={event => setStaffDraft(prev => ({ ...prev, name: event.target.value }))} placeholder="Full name" style={inputStyle} />
                        <input value={staffDraft.email} onChange={event => setStaffDraft(prev => ({ ...prev, email: event.target.value }))} placeholder="employee@funeralhome.com" style={inputStyle} />
                        <select value={staffDraft.role} onChange={event => setStaffDraft(prev => ({ ...prev, role: event.target.value }))} style={inputStyle}>
                          <option value="director">Director</option>
                          <option value="location_manager">Location manager</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                        <select value={staffDraft.locationScope} onChange={event => setStaffDraft(prev => ({ ...prev, locationScope: event.target.value }))} style={inputStyle}>
                          <option value="all">All locations</option>
                          {locations.map(location => <option key={location} value={location}>{location}</option>)}
                        </select>
                        <input inputMode="decimal" value={staffDraft.annualSalary} onChange={event => setStaffDraft(prev => ({ ...prev, annualSalary: event.target.value }))} placeholder="Private annual salary" style={inputStyle} />
                        <input inputMode="decimal" value={staffDraft.hourlyCost} onChange={event => setStaffDraft(prev => ({ ...prev, hourlyCost: event.target.value }))} placeholder="Or hourly cost" style={inputStyle} />
                      </div>
                      <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>This prepares access and assignment. Salary/hourly cost stays in the partner reporting layer so directors can see private ROI, cost per task, and location efficiency. It is never shown to families or participants.</div>
                      {latestStaffInvite && (
                        <div style={{ marginTop: 10, background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 12, padding: 10 }}>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Staff handoff ready</div>
                          <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 4 }}>{latestStaffInvite.email} can now be assigned work. The copied handoff points them to My work with scope, case context, waiting state, and proof. Passage will not send it automatically.</div>
                          <button type="button" onClick={() => copyText(staffInviteMessage(latestStaffInvite), 'Staff invite message copied.')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', marginTop: 8 }}>Copy invite message</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        <button disabled={updating === 'partner_staff'} style={{ border: 'none', background: updating === 'partner_staff' ? C.border : C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: updating === 'partner_staff' ? 'wait' : 'pointer' }}>{updating === 'partner_staff' ? 'Saving...' : 'Save as assignable staff'}</button>
                        <button type="button" onClick={() => setShowStaffSetup(false)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
            {false && isDirectorRole && (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 9 }}>
                  <div>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Active employees</div>
                    <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>Directors, location managers, and staff become the owner list inside every case task.</div>
                  </div>
                  <button onClick={() => setShowStaffSetup(true)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Add employee</button>
                </div>
                {activeEmployeeRows.length === 0 ? (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '10px 11px', color: C.mid, fontSize: 12.5 }}>No employees are saved yet. Add the funeral home director first, then add location managers and staff.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 7 }}>
                    {activeEmployeeRows.map(member => (
                      <div key={member.email} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(120px,.7fr) minmax(120px,.7fr) auto', gap: 8, alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: C.ink, fontSize: 13.2, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.label || member.email}</div>
                          <div style={{ color: C.mid, fontSize: 11.7, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
                        </div>
                        <div>
                          <div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Role</div>
                          <div style={{ color: C.ink, fontSize: 12.2, fontWeight: 900 }}>{roleLabel(member.role)}</div>
                        </div>
                        <div>
                          <div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Location</div>
                          <div style={{ color: C.mid, fontSize: 12.2 }}>{member.locationScope === 'all' ? 'All locations' : member.locationScope || 'All locations'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => { setStaffDraft({ name: member.label === member.email ? '' : member.label || '', email: member.email || '', role: member.role || 'staff', locationScope: member.locationScope || 'all', annualSalary: member.annualSalary || '', hourlyCost: member.hourlyCost || '' }); setShowStaffSetup(true); }} style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => copyText(staffInviteMessage(member), 'Staff invite message copied.')} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Copy invite</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {false && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 12 }}>
              {roleCards.map(([title, body, status]) => (
                <div key={title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{status}</div>
                  <div style={{ color: C.ink, fontSize: 16, fontWeight: 900, marginTop: 4 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
                </div>
              ))}
            </div>}
            {false && isDirectorRole && (
              <div style={{ marginTop: 12, background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 14, padding: 12 }}>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Role permissions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 8 }}>
                  {[
                    ['Director', 'All cases, all locations, employee setup, reports, exports, and billing prompts.'],
                    ['Location manager', 'Cases and reports for their location scope; can move work and assign staff.'],
                    ['Staff', 'Assigned work first; can mark waiting, request family info, record proof, and close tasks.'],
                    ['Admin', 'Partner account setup and billing/admin prompts; use sparingly for owners.'],
                  ].map(([title, body]) => (
                    <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                      <div style={{ color: C.ink, fontSize: 13, fontWeight: 900 }}>{title}</div>
                      <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.4, marginTop: 3 }}>{body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 8 }}>
                <div>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{isDirectorRole ? 'Delegation queue' : 'My assigned work'}</div>
                  <div style={{ fontSize: 18 }}>{isDirectorRole ? 'Next staff move' : 'Your next move'}</div>
                </div>
                <div style={{ color: C.mid, fontSize: 12.5 }}>Each task keeps estate context, status, proof, and audit together.</div>
              </div>
              {firstStaffTask && (() => {
                const output = taskOutputFor(firstStaffTask, { surface: 'staff work queue', caseName: firstStaffTask.caseName });
                const draft = taskRequestDraftFor(firstStaffTask, { surface: 'staff work queue', caseName: firstStaffTask.caseName });
                const proofDestination = taskProofDestination(firstStaffTask, { surface: 'staff work queue' });
                const packetText = taskPreparedPacketFor(firstStaffTask, { surface: 'staff work queue', caseName: firstStaffTask.caseName });
                return (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12, marginBottom: 10 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900 }}>Right now</div>
                  <div style={{ color: C.ink, fontSize: 18, fontWeight: 900, lineHeight: 1.22, marginTop: 4 }}>{sharedTaskTitle(firstStaffTask)}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>
                    Case: {firstStaffTask.caseName} - Service/context: {firstStaffTask.locationName}. Family status: {statusLabel(firstStaffTask.status)}.
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 12, lineHeight: 1.4, marginTop: 8 }}>
                    <strong style={{ color: C.ink }}>Proof to save:</strong> {proofDestination}
                  </div>
                  <div style={{ marginTop: 9 }}>
                    <RoleActionStrip
                      compact
                      role={isDirectorRole ? 'Director sees the floor; staff owns the assigned move.' : 'Assigned staff queue'}
                      action="Close with proof when the work is complete."
                      waiting={taskExpectedUpdate(firstStaffTask, 'funeral_home')}
                      proof={proofDestination}
                      privacy="Staff sees case context and their assigned work. Private ROI, billing, and unrelated cases stay in director/admin views."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 7, marginTop: 9 }}>
                    <button onClick={() => { setTaskDraft({ task: firstStaffTask, status: 'handled', label: 'Close with proof', prompt: 'Review or edit the Passage-prepared proof packet, then close this task so it no longer appears as waiting work.', draft, output, proofDestination }); setTaskDraftNote(packetText); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Close with proof</button>
                    <button onClick={() => { setTaskDraft({ task: firstStaffTask, status: 'waiting', label: 'Waiting update', prompt: taskActionPrompt('waiting', firstStaffTask, 'funeral_home'), draft, output, proofDestination }); setTaskDraftNote(`Waiting on ${firstStaffTask.playbook?.waitingOn || 'confirmation'} before ${sharedTaskTitle(firstStaffTask)} can move forward. Next update expected tomorrow morning.`); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Mark waiting</button>
                    <button onClick={() => { setTaskDraft({ task: firstStaffTask, status: 'blocked', label: 'Request this from family', prompt: taskActionPrompt('blocked', firstStaffTask, 'funeral_home'), draft, output, proofDestination }); setTaskDraftNote(draft); }} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Need family info</button>
                  </div>
                  <button onClick={() => openPartnerWork(firstStaffTask.caseId)} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '8px 10px', marginTop: 9, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Open full case context</button>
                </div>
              );})()}
              {assignedWorkQueue.length === 0 ? (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, color: C.mid, fontSize: 13 }}>
                  No assigned work is waiting.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {staffQueuePreview.map(task => {
                    const blocked = ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase());
                    const waiting = ['sent', 'waiting', 'pending', 'assigned'].includes(String(task.status || '').toLowerCase());
                    const tone = blocked ? C.rose : waiting ? C.amber : C.sage;
                    const guidance = taskGuidanceFor(task, { owner: task.assigned_to_name || task.assigned_to_email || 'staff', surface: 'staff work queue' });
                    return (
                    <div key={`${task.caseId}_${task.id}`} style={{ background: C.card, border: `1px solid ${blocked ? C.rose + '44' : C.border}`, borderLeft: `5px solid ${tone}`, borderRadius: 13, padding: 13, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10, alignItems: 'start' }}>
                      <div>
                        <div style={{ color: C.soft, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{task.caseName} - {task.locationName}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, marginTop: 3, lineHeight: 1.25 }}>{sharedTaskTitle(task)}</div>
                        <div style={{ color: C.mid, fontSize: 12.5, marginTop: 5 }}>Owner: <strong style={{ color: C.ink }}>{task.assigned_to_name || task.assigned_to_email || task.last_actor || 'Unassigned'}</strong> - {statusLabel(task.status)}</div>
                        <div style={{ background: blocked ? C.roseFaint : waiting ? C.amberFaint : C.sageFaint, borderRadius: 10, padding: '7px 8px', marginTop: 8, color: C.mid, fontSize: 12, lineHeight: 1.4 }}>
                          <strong style={{ color: C.ink }}>Expected update:</strong> {taskExpectedUpdate(task, 'funeral_home')}
                        </div>
                        <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.4, marginTop: 7 }}>
                          <strong style={{ color: C.ink }}>Why now:</strong> {guidance.why}
                          <br />
                          <strong style={{ color: C.ink }}>Proof:</strong> {taskProofDestination(task, { surface: 'staff work queue' })}
                        </div>
                      </div>
                      <button onClick={() => openPartnerWork(task.caseId)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', justifySelf: 'start' }}>Open work</button>
                    </div>
                  );})}
                  {staffQueueHiddenCount > 0 && (
                    <details style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 11px', color: C.mid, fontSize: 12.5 }}>
                      <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900 }}>Show {staffQueueHiddenCount} more assigned item{staffQueueHiddenCount === 1 ? '' : 's'}</summary>
                      <div style={{ display: 'grid', gap: 7, marginTop: 9 }}>
                        {assignedWorkQueue.slice(firstStaffTask ? 3 : 4).map(task => (
                          <button key={`${task.caseId}_${task.id}_hidden`} onClick={() => openPartnerWork(task.caseId)} style={{ textAlign: 'left', border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 10, padding: '8px 9px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                            <strong style={{ color: C.ink }}>{sharedTaskTitle(task)}</strong>
                            <span style={{ display: 'block', marginTop: 3 }}>{task.caseName} - {statusLabel(task.status)}</span>
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {user && !loading && data && activePartnerView === 'reports' && (
          <div id="partner-reports-section" data-demo-anchor="demo-reports" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,.05)', scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Funeral-home reporting</div>
                <div style={{ fontSize: 24, marginTop: 3 }}>See workload, response risk, and Passage value by time, location, staff, task, or case.</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>Reporting reads the same task spine: owner, message, proof, status, and export. No separate dashboard language for families.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => downloadExport('cases')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 12, padding: '9px 12px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Export case summary</button>
                <button onClick={() => downloadExport('spine')} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 12px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Export full spine</button>
              </div>
            </div>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, alignItems: 'end' }}>
                <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                  Time range
                  <select value={reportRange} onChange={event => setReportRange(event.target.value)} style={inputStyle}>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="all">All available time</option>
                    <option value="custom">Custom dates</option>
                  </select>
                </label>
                {reportRange === 'custom' && (
                  <>
                    <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                      From
                      <input type="date" value={reportDates.from} onChange={event => setReportDates(prev => ({ ...prev, from: event.target.value }))} style={inputStyle} />
                    </label>
                    <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                      To
                      <input type="date" value={reportDates.to} onChange={event => setReportDates(prev => ({ ...prev, to: event.target.value }))} style={inputStyle} />
                    </label>
                  </>
                )}
                <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                  Location
                  <select value={reportLocation} onChange={event => setReportLocation(event.target.value)} style={inputStyle}>
                    <option value="all">All locations</option>
                    {locations.map(location => <option key={location} value={location}>{location}</option>)}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                  Staff
                  <select value={reportStaff} onChange={event => setReportStaff(event.target.value)} style={inputStyle}>
                    <option value="all">All staff</option>
                    {reportStaffOptions.map(member => <option key={member.email} value={member.email}>{member.label || member.email}</option>)}
                    <option value="unassigned">Unassigned work</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                {[
                  ['overview', 'Overview'],
                  ['locations', 'Locations'],
                  ['staff', 'Staff'],
                  ['tasks', 'Tasks'],
                  ['cases', 'Cases'],
                ].map(([key, label]) => (
                  <button key={key} onClick={() => setReportView(key)} style={{ border: `1px solid ${reportView === key ? C.sage : C.border}`, background: reportView === key ? C.sage : C.card, color: reportView === key ? '#fff' : C.mid, borderRadius: 999, padding: '8px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ color: C.mid, fontSize: 12, marginTop: 8 }}>Scope: {reportRangeLabel}. {reportLocation === 'all' ? 'All locations' : reportLocation}. {reportStaff === 'all' ? 'All staff' : reportStaff === 'unassigned' ? 'Unassigned work' : reportStaff}.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 12 }}>
              {[
                ['Calls avoided', reportCallsAvoided],
                ['Case value', moneyDisplay(reportCaseValue)],
                ['Avg case value', moneyDisplay(reportAvgCaseValue)],
                ['Messages sent', reportScopedMessages.length],
                ['Participants invited', reportScopedParticipants.length],
                ['Participants accepted', reportAcceptedParticipants.length],
                ['Vendor quotes', reportVendorQuoteReady],
                ['Quotes accepted', reportVendorAccepted],
                ['Tasks resolved', reportHandledTasks.length],
                ['Cost / resolved task', reportCostPerResolvedTask ? moneyDisplay(reportCostPerResolvedTask) : '$0'],
                ['Avg tasks / estate', reports.avgTasksPerEstate ?? reportAvgTasksPerEstate],
                ['Tasks / day', reportTasksPerDay],
                ['Waiting + blocked', reportWaitingTasks.length + reportBlockedTasks.length],
              ].map(([label, value]) => (
                <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 20, marginTop: 3 }}>{value}</div>
                </div>
              ))}
            </div>
            {reportView === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                <ReportTable
                  title="Efficiency summary"
                  columns={['Metric', 'Value', 'Why it matters']}
                  rows={[
                    ['Calls avoided', reportCallsAvoided, 'Assignments, messages, and requests replace repeated status calls.'],
                    ['Recorded case value', moneyDisplay(reportCaseValue), 'Case economics entered at intake or imported from the case system.'],
                    ['Average case value', moneyDisplay(reportAvgCaseValue), 'Helps compare location revenue and case mix without creating a separate case type.'],
                    ['Prepaid / funded value', moneyDisplay(reportPrepaidValue), 'Funding detail on the same family record, not a separate workflow.'],
                    ['Tasks resolved', reportHandledTasks.length, 'Shows work that moved from waiting to proof.'],
                    ['Average tasks per estate', reportAvgTasksPerEstate, 'Helps price support load and compare case complexity.'],
                    ['Estimated labor cost', reportLaborCost ? moneyDisplay(reportLaborCost) : '$0', 'Private estimate from employee salary/hourly cost; not visible to families.'],
                    ['Cost per resolved task', reportCostPerResolvedTask ? moneyDisplay(reportCostPerResolvedTask) : '$0', 'Directional cost based on an 8-minute coordination unit.'],
                    ['Tasks completed per day', reportTasksPerDay, 'Shows throughput for the selected range.'],
                    ['Messages sent', reportScopedMessages.length, 'Measures family-facing coordination volume.'],
                    ['Participant activation', `${reportAcceptedParticipants.length}/${reportScopedParticipants.length}`, 'Shows whether family helpers accepted scoped access instead of joining the full workspace.'],
                    ['Vendor quote pipeline', `${reportScopedVendorRequests.length} requested / ${reportVendorQuoteReady} ready / ${reportVendorAccepted} accepted`, 'Shows local support requests without turning Passage into a directory.'],
                  ]}
                />
                <ReportTable
                  title="ROI signals"
                  columns={['Signal', 'Value', 'Source']}
                  rows={[
                    ['Estimated hours saved', reportCallsAvoided > 0 ? `${Math.max(1, Math.round((reportCallsAvoided * 8) / 60))} hr` : 'None yet', '8 minutes per avoided repeat call estimate'],
                    ['Marketplace value', money(reportVendorValue || reports.marketplace?.estimatedValue || totalVendorValue), 'Task-linked local support requests'],
                    ['Partner share', money(reports.marketplace?.funeralHomeShare ?? funeralHomeShare), 'Tracked only where value is present'],
                    ['Completed vendor work', reportVendorCompleted, 'Requests that reached proof/handled status.'],
                    ['Portable proof', `${reportHandledTasks.length + reportScopedMessages.length} rows`, 'Exports back to existing case systems'],
                  ]}
                />
              </div>
            )}
            {reportView === 'locations' && (
              <ReportTable
                title="By location"
                columns={['Location', 'Cases', 'Case value', 'Avg value', 'Tasks', 'Handled', 'Waiting / blocked', 'Calls avoided']}
                rows={reportLocationRows}
              />
            )}
            {reportView === 'staff' && (
              <ReportTable
                title="By employee"
                columns={['Employee', 'Role', 'Private cost', 'Tasks', 'Handled', 'Est. cost', 'Cost / task', 'Waiting', 'Blocked']}
                rows={reportEmployeeRows}
              />
            )}
            {reportView === 'tasks' && (
              <ReportTable
                title="By task type"
                columns={['Task', 'Total', 'Handled', 'Waiting', 'Blocked']}
                rows={reportTaskSummaryRows}
              />
            )}
            {reportView === 'cases' && (
              <ReportTable
                title="By case / estate"
                columns={['Case', 'Location', 'Case value', 'Prepaid', 'Tasks', 'Handled', 'Waiting', 'Blocked']}
                rows={reportCaseRows}
              />
            )}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, marginTop: 12 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Stack fit</div>
              <div style={{ color: C.ink, fontSize: 16, lineHeight: 1.25, marginTop: 4 }}>Passage is the coordination layer above the case system.</div>
              <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.5, marginTop: 4 }}>
                Import gets the case started without duplicate setup. Export returns the operational proof: task state, family communication, lifecycle dates, vendor requests, and who handled what.
              </div>
            </div>
          </div>
        )}

        {user && !loading && data?.organizations?.length > 0 && vendorPrefs.vendors.length > 0 && (showTools || activePartnerView === 'reports') && (
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
          <div id="partner-case-form" onClick={() => setShowNewCase(false)} style={{ position: 'fixed', inset: 0, zIndex: 230, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <form ref={casePanelRef} data-demo-anchor="demo-case-create" role="dialog" aria-modal="true" aria-label="Create family case" onClick={event => event.stopPropagation()} onSubmit={createCase} style={{ width: 'min(920px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{caseForm.caseType === 'immediate' ? 'New at-need case' : 'New pre-need case'}</div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>{caseForm.caseType === 'immediate' ? 'A death has occurred. Start with the family contact and the next partner-ready work.' : 'This may be a living client or family preparing ahead. Start with a contact and the plan details you already know.'}</div>
              </div>
              <button type="button" onClick={() => setShowNewCase(false)} aria-label="Close case creation" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 34, height: 34, cursor: 'pointer', fontFamily: 'Georgia,serif', fontWeight: 900 }}>x</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: 8, marginBottom: 10 }}>
              {[
                ['immediate', 'At-need case', 'A death has occurred and the family needs coordination now.'],
                ['preneed', 'Pre-need planning', 'A living client or family is preparing before it is urgent.'],
              ].map(([value, title, body]) => (
                <button key={value} type="button" onClick={() => setCaseForm(prev => ({ ...prev, caseType: value }))} style={{ textAlign: 'left', border: `1px solid ${caseForm.caseType === value ? C.sage : C.border}`, background: caseForm.caseType === value ? C.sageFaint : C.bg, borderRadius: 12, padding: 11, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.ink }}>{title}</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.35, color: C.mid, marginTop: 3 }}>{body}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: 8 }}>
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
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 11, marginTop: 10 }}>
              <SmartAddressInput
                compact
                label="Service / case location"
                value={caseForm.locationAddress}
                onChange={(value, parsed = {}) => setCaseForm(prev => ({
                  ...prev,
                  locationAddress: value,
                  locationName: parsed.placeName || prev.locationName,
                  locationCity: parsed.city || '',
                  locationState: parsed.state || '',
                  locationZip: parsed.postalCode || '',
                  locationCountry: parsed.country || '',
                  locationPlaceId: parsed.placeId || '',
                }))}
                colors={C}
                inputStyle={{ background: C.card }}
                placeholder="Start typing funeral home, chapel, cemetery, or family address"
                hint="Choose a suggestion to keep location, city, state, ZIP, and country attached to the case."
              />
            </div>
            <div style={{ background: C.sageFaint, border: `1px solid ${caseForm.totalCaseValue || caseForm.isPrepaid ? C.sage : C.sage + '22'}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Case economics</div>
              <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>Value belongs on every case when known. Prepaid is only a funding flag, and these numbers power private ROI reports for the funeral home.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: 8, marginTop: 10, alignItems: 'end' }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                  Total case value
                  <input inputMode="decimal" value={caseForm.totalCaseValue} onChange={e => setCaseForm(prev => ({ ...prev, totalCaseValue: e.target.value }))} placeholder="$8,500" style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.card, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
                </label>
                <label style={{ display: 'flex', gap: 9, alignItems: 'center', color: C.ink, fontSize: 13.5, fontWeight: 900, cursor: 'pointer', minHeight: 40 }}>
                  <input type="checkbox" checked={caseForm.isPrepaid} onChange={event => setCaseForm(prev => ({ ...prev, isPrepaid: event.target.checked }))} style={{ marginTop: 2, accentColor: C.sage }} />
                  Prepaid or funded
                </label>
                {caseForm.isPrepaid && (
                  <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                    Prepaid / policy amount
                    <input inputMode="decimal" value={caseForm.prepaidAmount} onChange={e => setCaseForm(prev => ({ ...prev, prepaidAmount: e.target.value }))} placeholder="$" style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.card, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
                  </label>
                )}
              </div>
            </div>
            {caseForm.caseType === 'immediate' && (
              <details style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.bg, padding: '9px 10px', marginTop: 10 }}>
                <summary style={{ cursor: 'pointer', color: C.ink, fontSize: 12.5, fontWeight: 900 }}>Known dates, if available</summary>
                <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, margin: '7px 0 9px' }}>Skip anything unknown. Passage will keep missing event dates visible only when they become urgent or needed for a family update.</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 8 }}>
                  {[
                    ['pronouncementDate', 'Official pronouncement'],
                    ['releaseDate', 'Release / pickup'],
                    ['arrangementDate', 'Arrangement meeting'],
                    ['visitationDate', 'Wake / visitation'],
                    ['funeralDate', 'Funeral / memorial'],
                    ['burialDate', 'Burial / cremation'],
                    ['shivaDate', 'Shiva / mourning'],
                    ['receptionDate', 'Reception'],
                    ['obituaryDeadline', 'Obituary deadline'],
                  ].map(([key, label]) => (
                    <label key={key} style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                      {label}
                      <input type="date" value={caseForm[key]} onChange={e => setCaseForm(prev => ({ ...prev, [key]: e.target.value }))} style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.card, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }} />
                    </label>
                  ))}
                </div>
              </details>
            )}
            <button disabled={creating || !caseForm.personName.trim()} style={{ marginTop: 10, width: '100%', border: 'none', borderRadius: 12, background: creating || !caseForm.personName.trim() ? C.border : C.sage, color: '#fff', padding: '11px 14px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: creating || !caseForm.personName.trim() ? 'not-allowed' : 'pointer' }}>
              {creating ? 'Creating case...' : caseForm.caseType === 'immediate' ? 'Create at-need case' : 'Create pre-need case'}
            </button>
          </form>
          </div>
        )}

        {user && !loading && data && data.organizations.length === 0 && !showNewCase && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>Create your partner workspace.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Create the first partner case to open the staff workspace.</p>
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
                ['1', 'Create case', 'At-need or pre-need. Add prepaid as a funding detail when relevant.'],
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
          <div id="partner-today-section" data-demo-anchor="demo-partner-command" style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 18px 18px', padding: 14, marginBottom: 12, boxShadow: '0 8px 26px rgba(55,45,35,.04)', scrollMarginTop: 92 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 12, alignItems: 'stretch' }}>
              <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 14, padding: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{isDirectorRole ? 'Command center' : 'My work'}</div>
                    <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.18, fontWeight: 900, marginTop: 4 }}>
                      {isDirectorRole ? `${nextDirectorStep.label}: ${nextDirectorStep.next}` : firstStaffTask ? sharedTaskTitle(firstStaffTask) : 'No assigned work is waiting.'}
                    </div>
                    <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>
                      {isDirectorRole
                        ? 'Start here each morning. This pane routes to the exact case, staff queue, management page, or report needed next.'
                        : firstStaffTask
                          ? `Case: ${firstStaffTask.caseName}. Owner, expected update, and proof travel with the task.`
                          : 'When a director assigns work, it appears here with case context and proof requirements.'}
                    </div>
                  </div>
                  <button onClick={moveDirectorFocus} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, minHeight: 42, padding: '0 13px', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {directorFocusButtonLabel()}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 8, marginTop: 12 }}>
                  {glanceItems.slice(0, 4).map(([label, value]) => (
                    <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', minHeight: 55 }}>
                      <div style={{ color: C.sage, fontSize: 9.6, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                      <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.1, marginTop: 3 }}>{value}</div>
                    </div>
                  ))}
                </div>
                {isDirectorRole && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 7, marginTop: 9 }}>
                    {[
                      ['Create/import', () => openCasePanel('immediate')],
                      ['Manage team', () => openPartnerManagement('Opening locations, employees, roles, and permissions.')],
                      ['Open report', () => openPartnerPane('reports', 'partner-reports-section', 'Opening reporting and ROI.')],
                      ['Export proof', () => downloadExport('cases')],
                    ].map(([label, action]) => (
                      <button key={label} onClick={action} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.ink, borderRadius: 10, minHeight: 38, padding: '0 10px', fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isDirectorRole && (
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', marginBottom: 8 }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Self-service gates</div>
                      <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.4, marginTop: 3 }}>A pilot home can operate alone when each gate is green.</div>
                    </div>
                    <button onClick={() => setShowPilotGuide(true)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '6px 9px', fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Guide</button>
                  </div>
                  <div style={{ display: 'grid', gap: 7 }}>
                    {pilotLaunchRows.map(([n, title, body, done]) => (
                      <button key={title} onClick={() => {
                        if (title === 'Employees' || title === 'Locations' || title === 'First owner' || title === 'Invite truth' || title === 'Billing truth') openPartnerManagement('Opening the setup spine for locations, employees, roles, invites, billing truth, and assignment readiness.');
                        else if (title === 'Cases') openCasePanel('immediate');
                        else if (title === 'Proof loop') moveDirectorFocus();
                      }} style={{ textAlign: 'left', border: `1px solid ${done ? C.sage + '22' : C.amber + '33'}`, background: done ? C.sageFaint : C.amberFaint, borderRadius: 10, padding: '7px 9px', display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 8, alignItems: 'center', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                        <span style={{ width: 18, height: 18, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: done ? C.sage : C.amber, color: '#fff', fontSize: 9, fontWeight: 900 }}>{done ? 'OK' : n}</span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', color: C.ink, fontSize: 12.2, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                          <span style={{ display: 'block', color: C.mid, fontSize: 11.4, lineHeight: 1.3, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{body}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {isMultiLocation && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: 'none', borderBottom: 'none', borderRadius: 0, padding: '10px 12px', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: showTools ? 10 : 0 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900, marginRight: 2 }}>Work scope</span>
                {['all', ...locations].map(location => (
                  <button key={location} onClick={() => setSelectedLocation(location)} style={{ border: `1px solid ${selectedLocation === location ? C.sage : C.border}`, background: selectedLocation === location ? C.sage : C.card, color: selectedLocation === location ? '#fff' : C.mid, borderRadius: 999, padding: '8px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                    {location === 'all' ? 'All locations' : location} {location !== 'all' ? `(${cases.filter(item => locationNameFor(item) === location).length})` : `(${cases.length})`}
                  </button>
                ))}
                </div>
                <button onClick={() => setShowTools(prev => !prev)} style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 999, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                  {showTools ? 'Hide metrics' : 'Location metrics'}
                </button>
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
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: isMultiLocation ? `1px solid ${C.border}` : 'none', borderBottom: 'none', padding: '11px 14px 9px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 0 }}>
            <div>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Selected case work</div>
              <div style={{ color: C.mid, fontSize: 12.5, marginTop: 3 }}>{showAllCases ? `${displayCases.length} cases visible` : 'Showing one case. Expand all only when you need the list.'}</div>
            </div>
            {displayCases.length > 1 && (
              <button onClick={() => setShowAllCases(prev => !prev)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.sage, borderRadius: 11, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                {showAllCases ? 'Show one case' : `Show all ${displayCases.length} cases`}
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 18px 18px', padding: '0 14px 14px', marginBottom: 16, boxShadow: '0 8px 26px rgba(55,45,35,.04)' }}>
            {focusedDisplayCases.map(item => {
              const handledCount = item.tasks.filter(t => ['handled', 'completed', 'done'].includes(t.status || '')).length;
              const waitingCount = item.tasks.filter(t => ['sent', 'waiting', 'pending', 'assigned'].includes(t.status || '')).length;
              const progressCount = item.tasks.filter(t => ['draft', 'acknowledged'].includes(t.status || '')).length;
              const open = item.tasks.length - handledCount;
              const blocked = item.tasks.filter(t => ['blocked', 'needs_review', 'failed'].includes(t.status || '')).length;
              const partnerTasks = item.partnerTasks || [];
              const waitingFamily = item.waitingOnFamily || [];
              const vendorRequests = item.vendorRequests || [];
              const familyParticipants = item.familyParticipants || [];
              const orchestration = orchestrationByCaseId.get(item.id) || orchestrateTasks({ tasks: item.tasks || [], role: 'funeral_home', context: { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, deathDate: item.date_of_death, serviceEvents: item.serviceEvents || item.service_events || [], surface: 'case work' } });
              const topTasks = (partnerTasks.length ? partnerTasks : orchestration.tasks.length ? orchestration.tasks : item.tasks).slice(0, 3);
              const nextPartnerTask = itemNextPartnerTask(item, orchestration);
              const nextImportance = nextPartnerTask ? (nextPartnerTask.orchestration?.importance || taskImportance(nextPartnerTask, { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, deathDate: item.date_of_death, serviceEvents: item.serviceEvents || item.service_events || [], surface: 'case work' })) : null;
              const nextImportanceTone = importanceStyle(nextImportance);
              const isDemoCase = /^DEMO/i.test(item.organization_case_reference || '') || /^Demo - /i.test(item.name || '');
              const isExpanded = expandedCaseId === item.id;
              const itemLocation = locationNameFor(item);
              const fundingLabel = partnerFundingLabel(item);
              const nextOwner = nextPartnerTask?.assigned_to_name || nextPartnerTask?.assigned_to_email || nextPartnerTask?.playbook?.partnerOwnerRole || 'Unassigned';
              const nextTaskClosed = nextPartnerTask && ['handled', 'completed', 'done'].includes(String(nextPartnerTask.status || '').toLowerCase());
              const nextExpectedUpdate = nextTaskClosed ? 'Handled - proof is saved on the case spine.' : nextPartnerTask ? (orchestration.nextAction?.expectedUpdate || taskExpectedUpdate(nextPartnerTask, 'funeral_home')) : 'The family status remains visible.';
              const conversationCount = item.coordinationSpine?.conversation?.length || 0;
              const proofCount = item.coordinationSpine?.proof?.length || 0;
              const notificationCount = item.coordinationSpine?.notifications?.length || 0;
              const familyUpdateHref = `/share?wid=${encodeURIComponent(item.id)}&dn=${encodeURIComponent(item.deceased_name || item.estate_name || item.name || 'Family case')}&cn=${encodeURIComponent(item.coordinator_name || 'the family')}`;
              const timelineEvents = (item.serviceEvents || item.service_events || [])
                .filter(event => event?.date)
                .slice()
                .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
                .slice(0, 3);
              const lifecycleEvents = (item.serviceEvents || item.service_events || [])
                .filter(event => event?.date)
                .slice()
                .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
              const todayKey = new Date().toISOString().slice(0, 10);
              const nextLifecycleEvent = lifecycleEvents.find(event => String(event.date || '') >= todayKey) || lifecycleEvents[0] || null;
              const nextLifecycleDate = nextLifecycleEvent ? new Date(String(nextLifecycleEvent.date).includes('T') ? nextLifecycleEvent.date : `${nextLifecycleEvent.date}T12:00:00`) : null;
              const nextLifecycleLabel = nextLifecycleEvent ? (nextLifecycleEvent.name || nextLifecycleEvent.title || nextLifecycleEvent.event_type || 'Lifecycle date') : '';
              const detailTab = caseDetailTabs[item.id] || 'proof';
              const detailTabs = [
                ['proof', 'Proof', proofCount + (item.activity?.length || 0)],
                ['family', 'Family', familyParticipants.length],
                ['local', 'Local help', vendorRequests.length],
                ['tasks', 'Tasks', topTasks.length],
              ];
              const missingTimeline = Array.isArray(item.orchestration_summary?.missing_timeline_watch)
                ? item.orchestration_summary.missing_timeline_watch.filter(Boolean).slice(0, 2)
                : [];
              return (
                <div id={'partner-case-' + item.id} key={item.id} style={{ background: C.bg, border: `1px solid ${blocked ? C.rose + '55' : C.border}`, borderRadius: 16, padding: 16, scrollMarginTop: 92 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 22, lineHeight: 1.25 }}>{item.deceased_name || item.estate_name || item.name || 'Family case'}</div>
                      <div style={{ color: C.mid, fontSize: 13, marginTop: 5 }}>{partnerCaseTypeLabel(item)} - {isMultiLocation ? `${itemLocation} - ` : ''}Coordinator: {item.coordinator_name || 'Family coordinator'}{item.coordinator_email ? ` (${item.coordinator_email})` : ''}</div>
                      {fundingLabel && <div style={{ color: C.sage, fontSize: 12.2, fontWeight: 900, marginTop: 5 }}>{fundingLabel}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button onClick={() => {
                        if (isExpanded) {
                          setExpandedCaseId('');
                          setCasePaneAutoOpened(true);
                          setShowAllCases(true);
                          setNotice('Work pane closed. Showing the case list again.');
                        } else {
                          setExpandedCaseId(item.id);
                          setShowAllCases(false);
                        }
                      }} style={{ color: '#fff', background: C.sage, border: 'none', borderRadius: 11, padding: '9px 13px', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{isExpanded ? 'Close work pane' : 'Open work pane'}</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10, alignItems: 'stretch', marginTop: 12 }}>
                    <div style={{ background: blocked ? C.roseFaint : C.sageFaint, border: `1px solid ${blocked ? C.rose + '35' : C.sage}22`, borderRadius: 15, padding: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 10.5, color: blocked ? C.rose : C.sage, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Family record next move</div>
                          <div style={{ fontSize: 18, lineHeight: 1.2, color: C.ink, fontWeight: 900 }}>{nextPartnerTask ? sharedTaskTitle(nextPartnerTask) : 'No partner-ready work is open'}</div>
                        </div>
                        {nextImportance && <span style={{ background: nextImportanceTone.bg, border: `1px solid ${nextImportanceTone.border}`, color: nextImportanceTone.color, borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 900 }}>{nextImportance.label}</span>}
                        <span style={{ background: C.card, color: nextOwner === 'Unassigned' ? C.amber : C.sage, borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 900 }}>{nextOwner}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.45, marginTop: 7 }}>
                        {nextPartnerTask ? (orchestration.nextAction?.reason || sharedTaskNext(nextPartnerTask, 'funeral_home')) : 'Nothing needs partner action right now.'}
                      </div>
                      {false && <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 7 }}>
                        Passage keeps this on the family continuity record. The funeral home is the current operating partner, not a separate case island.
                      </div>}
                      {false && nextPartnerTask && nextImportance?.reason && (
                        <div style={{ background: C.card, border: `1px solid ${nextImportanceTone.border}`, borderRadius: 11, padding: '8px 10px', marginTop: 8, color: C.mid, fontSize: 12.2, lineHeight: 1.45 }}>
                          <strong style={{ color: C.ink }}>Why this is next:</strong> {nextImportance.reason}
                        </div>
                      )}
                      <div style={{ background: C.card, borderLeft: `4px solid ${blocked ? C.rose : waitingCount ? C.amber : C.sage}`, borderRadius: 11, padding: '9px 10px', marginTop: 10, color: C.mid, fontSize: 12.4, lineHeight: 1.45 }}>
                        <strong style={{ color: C.ink }}>Next expected update:</strong> {nextExpectedUpdate}
                      </div>
                      {false && nextLifecycleEvent && (
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', marginTop: 8, color: C.mid, fontSize: 12.3, lineHeight: 1.45 }}>
                          <strong style={{ color: C.ink }}>Next lifecycle date:</strong> {nextLifecycleLabel.replace(/_/g, ' ')}{nextLifecycleDate && !Number.isNaN(nextLifecycleDate.getTime()) ? ` - ${nextLifecycleDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}{nextLifecycleEvent.time ? ` at ${nextLifecycleEvent.time}` : ''}{nextLifecycleEvent.location_name ? `, ${nextLifecycleEvent.location_name}` : ''}
                        </div>
                      )}
                    </div>
                    {false && <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 15, padding: 13 }}>
                      <div style={{ fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>Family-facing status</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 84px), 1fr))', gap: 7 }}>
                        {[['Done', handledCount, C.sage], ['Waiting', waitingCount + blocked, waitingCount + blocked ? C.amber : C.sage], ['Open', open, open ? C.ink : C.sage]].map(([label, value, color]) => (
                          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px' }}>
                            <div style={{ color: C.soft, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                            <div style={{ color, fontSize: 18, fontWeight: 900, marginTop: 2 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>This reduces the "where are we?" calls and keeps the family view aligned with staff work.</div>
                    </div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{item.tasks.length} tasks</span>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{partnerTasks.length} partner-ready</span>
                    {waitingFamily.length > 0 && <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{waitingFamily.length} waiting on family</span>}
                    {blocked > 0 && <span style={{ background: C.roseFaint, color: C.rose, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{blocked} need help</span>}
                    {isExpanded && isMultiLocation && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Location: {itemLocation}</span>}
                    {isExpanded && isAdminDemo && isDemoCase && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Demo data</span>}
                    {isExpanded && vendorRequests.length > 0 && <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{vendorRequests.length} local help requests</span>}
                    {isExpanded && (timelineEvents.length > 0
                      ? timelineEvents.slice(0, 1).map(event => (
                        <span key={`${event.event_type || event.name || event.title}_${event.date}`} style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{event.name || event.title || event.event_type || 'Event'}: {new Date(String(event.date).includes('T') ? event.date : `${event.date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      ))
                      : <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Event dates unknown</span>)}
                    {isExpanded && missingTimeline.map(label => (
                      <span key={`missing_${label}`} style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Add when known: {label}</span>
                    ))}
                    {isExpanded && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{conversationCount} convo / {proofCount} proof / {notificationCount} alerts</span>}
                  </div>
                  {isExpanded && <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Outputs</span>
                    <button onClick={() => setPacketModal({ estateId: item.id, packetType: 'funeral_home_arrangement' })} style={{ color: '#fff', background: C.sage, border: 'none', borderRadius: 999, padding: '6px 10px', textDecoration: 'none', fontSize: 11.5, fontWeight: 900, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Generate packet</button>
                    <Link href={`/packet?id=${encodeURIComponent(item.id)}&demoTour=funeral-home&demoStep=warm`} style={{ color: C.sage, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 999, padding: '6px 9px', textDecoration: 'none', fontSize: 11.5, fontWeight: 900 }}>Prepared packets</Link>
                    <Link href={familyUpdateHref} style={{ color: C.sage, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 999, padding: '6px 9px', textDecoration: 'none', fontSize: 11.5, fontWeight: 900 }}>Family update</Link>
                    <Link href={`/funeral-home/summary?id=${item.id}`} style={{ color: C.mid, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 999, padding: '6px 9px', textDecoration: 'none', fontSize: 11.5, fontWeight: 900 }}>Printable summary</Link>
                  </div>}
                  {isExpanded && nextPartnerTask && (() => {
                    const context = { caseName: item?.deceased_name || item?.estate_name || item?.name, coordinatorName: item?.coordinator_name, surface: 'case spine proof' };
                    const taskClosed = ['handled', 'completed', 'done'].includes(String(nextPartnerTask.status || '').toLowerCase());
                    const output = taskOutputFor(nextPartnerTask, context);
                    const guidance = taskGuidanceFor(nextPartnerTask, { ...context, owner: nextOwner });
                    const explanation = taskExplanationFor(nextPartnerTask, { ...context, output, guidance });
                    const draft = taskRequestDraftFor(nextPartnerTask, context);
                    const proofDestination = taskProofDestination(nextPartnerTask, context);
                    const assignOpen = assignmentDraft.taskId === nextPartnerTask.id;
                    const assignmentOptions = [];
                    const seenAssignees = new Set();
                    function addAssignee(option) {
                      const key = String(option.email || option.name || option.role || '').toLowerCase();
                      if (!key || seenAssignees.has(key)) return;
                      seenAssignees.add(key);
                      assignmentOptions.push(option);
                    }
                    (partnerStaff || []).forEach(member => {
                      const memberName = member.display_name || member.name || member.email || 'Staff member';
                      const memberLocation = member.location_scope || member.locationScope || '';
                      addAssignee({
                        type: 'staff',
                        name: memberName,
                        email: member.email || '',
                        role: member.role || 'staff',
                        phone: member.phone || '',
                        label: `${memberName} - ${roleLabel(member.role || 'staff')}${memberLocation && memberLocation !== 'all' ? ` (${memberLocation})` : ''}`,
                      });
                    });
                    if (item.coordinator_email) addAssignee({
                      type: 'family',
                      name: item.coordinator_name || item.coordinator_email,
                      email: item.coordinator_email,
                      role: 'family coordinator',
                      label: `${item.coordinator_name || item.coordinator_email} - family coordinator`,
                    });
                    familyParticipants.forEach(participant => addAssignee({
                      type: 'participant',
                      name: participant.name || participant.email || participant.role || 'Participant',
                      email: participant.email || '',
                      role: participant.role || 'participant',
                      label: `${participant.name || participant.email || 'Participant'} - ${participant.role || 'participant'}`,
                    }));
                    const firstAssignee = assignmentOptions[0] || null;
                    const applyAssignee = (option) => setAssignmentDraft(prev => ({
                      ...prev,
                      name: option?.name || '',
                      email: option?.email || '',
                      role: option?.role || '',
                      phone: option?.phone || '',
                    }));
                    const packetText = taskPreparedPacketFor(nextPartnerTask, {
                      caseName: item?.deceased_name || item?.estate_name || item?.name || 'this case',
                      coordinatorName: item.coordinator_name,
                      coordinatorEmail: item.coordinator_email,
                      coordinatorPhone: item.coordinator_phone,
                      funeralHomeName: org?.name,
                      caseReference: item.organization_case_reference || item.case_reference,
                      locationName: itemLocation,
                      openTasks: item.tasks || [],
                    });
                    const packetPreviewLines = packetText.split('\n').filter(Boolean).slice(0, 10);
                    const packetPurpose = output.label || 'Prepared case output';
                    const packetUse = 'This is the task work product: review it, print or save it as a Passage-branded PDF, then use Mark done to save it as proof. Nothing sends automatically.';
                    const coordinationRows = [
                      {
                        label: 'Conversation',
                        count: conversationCount,
                        body: item.coordinationSpine?.conversation?.[0]?.title || item.coordinationSpine?.conversation?.[0]?.detail || 'Human request or reply stays on this task.',
                      },
                      {
                        label: 'Proof',
                        count: proofCount,
                        body: item.coordinationSpine?.proof?.[0]?.title || item.coordinationSpine?.proof?.[0]?.detail || 'Outcome, actor, timestamp, note, and file live separately from chat.',
                      },
                      {
                        label: 'Notification',
                        count: notificationCount,
                        body: item.coordinationSpine?.notifications?.[0]?.title || item.coordinationSpine?.notifications?.[0]?.detail || 'Email, SMS, and in-app delivery route attention without becoming the work.',
                      },
                    ];
                    const loopRows = [
                      ['Owner', nextOwner, nextOwner === 'Unassigned' ? C.amber : C.sage],
                      ['Request', draft, C.mid],
                      ['Proof', output.label, C.sage],
                      ['Report', 'Exports with case spine', C.mid],
                    ];
                    return (
                      <div id={'partner-action-workspace-' + item.id} data-demo-anchor="demo-task-spine" style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 15, padding: 14, marginTop: 12, boxShadow: '0 8px 22px rgba(55,45,35,.04)', scrollMarginTop: 92 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12, alignItems: 'stretch' }}>
                          <div>
                            <div style={{ color: taskClosed ? C.sage : C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{taskClosed ? 'Closed on the spine' : 'Action workspace'}</div>
                            <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.18, fontWeight: 900, marginTop: 4 }}>{sharedTaskTitle(nextPartnerTask)}</div>
                            <div style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.5, marginTop: 5 }}>{taskClosed ? 'This task is already handled. Passage keeps the proof, notification, owner, and family-visible status together.' : 'Choose the next operational move. Passage keeps the owner, request, proof, and family-visible status on the same family record.'}</div>
                            <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', marginBottom: 8 }}>
                                <strong style={{ color: C.ink }}>What this task is:</strong> {explanation.what}
                                <br />
                                <strong style={{ color: C.ink }}>What done means:</strong> {explanation.done}
                              </div>
                              <strong style={{ color: C.ink }}>Why now:</strong> {guidance.why}
                              <br />
                              <strong style={{ color: C.ink }}>Expected timing:</strong> {guidance.timing}
                              <br />
                              <strong style={{ color: C.ink }}>Visibility:</strong> family-facing status and proof are shared; internal staff notes stay operational.
                            </div>
                          </div>
                          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: 11 }}>
                            <div style={{ color: C.sage, fontSize: 10.5, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Prepared output</div>
                            <div style={{ color: C.ink, fontSize: 13.5, fontWeight: 900, marginTop: 4 }}>{output.label}</div>
                            <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 4 }}>{output.body}</div>
                            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 11.5, lineHeight: 1.42, marginTop: 8 }}>
                              <strong style={{ color: C.ink }}>Purpose:</strong> {packetUse}
                            </div>
                            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 11.2, lineHeight: 1.38, marginTop: 8, maxHeight: 116, overflow: 'hidden' }}>
                              {packetPreviewLines.map((line, index) => (
                                <div key={`${line}_${index}`} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line}</div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
                              <button onClick={() => setOutputPreview({ title: packetPurpose, subtitle: sharedTaskTitle(nextPartnerTask), purpose: packetUse, text: packetText, copyKey: 'partner_output_' + item.id })} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Preview output</button>
                              <button onClick={() => copyText(packetText, 'Prepared output copied.', 'partner_output_' + item.id)} style={{ border: `1px solid ${C.sage}33`, background: copiedKey === 'partner_output_' + item.id ? C.sage : C.card, color: copiedKey === 'partner_output_' + item.id ? '#fff' : C.sage, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{copiedKey === 'partner_output_' + item.id ? 'Copied' : 'Copy packet'}</button>
                            </div>
                          </div>
                        </div>
                        {taskClosed ? (
                          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 12, padding: '11px 12px', color: C.sage, fontSize: 13, fontWeight: 900, marginTop: 12 }}>
                            Done. Proof is saved below; no new family request or waiting state is needed for this task.
                          </div>
                        ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 8, marginTop: 12 }}>
                          <button onClick={() => { setAssignmentDraft({ taskId: nextPartnerTask.id, name: nextPartnerTask.assigned_to_name || firstAssignee?.name || '', email: nextPartnerTask.assigned_to_email || firstAssignee?.email || '', role: nextPartnerTask.playbook?.partnerOwnerRole || firstAssignee?.role || 'staff', phone: '' }); setTaskDraft(null); setTaskDraftNote(''); }} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 11, padding: '11px 12px', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Assign owner<br /><span style={{ color: C.mid, fontWeight: 500 }}>staff or case contact</span></button>
                          <button onClick={() => { setTaskDraft({ task: nextPartnerTask, status: 'blocked', label: 'Family request', prompt: 'Write the missing detail needed from the family.', draft, output, proofDestination }); setTaskDraftNote(draft); setAssignmentDraft({ taskId: '', name: '', email: '', role: '', phone: '' }); }} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 11, padding: '11px 12px', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Request family info<br /><span style={{ color: C.mid, fontWeight: 500 }}>one request</span></button>
                          <button onClick={() => { setTaskDraft({ task: nextPartnerTask, status: 'handled', label: 'Close with proof', prompt: 'Review the Passage-prepared packet, add or edit the proof note, then close this task. After it closes, family request and waiting actions move out of the way.', draft, output, proofDestination }); setTaskDraftNote(packetText); setAssignmentDraft({ taskId: '', name: '', email: '', role: '', phone: '' }); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, padding: '11px 12px', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Record proof / close<br /><span style={{ color: 'rgba(255,255,255,.78)', fontWeight: 500 }}>moves out of active work</span></button>
                          <button onClick={() => { setTaskDraft({ task: nextPartnerTask, status: 'waiting', label: 'Waiting update', prompt: 'Write what is waiting and the next expected update.', draft, output, proofDestination }); setTaskDraftNote(`Waiting on ${nextPartnerTask.playbook?.waitingOn || 'confirmation'} before ${sharedTaskTitle(nextPartnerTask)} can move forward. Next update expected tomorrow morning.`); setAssignmentDraft({ taskId: '', name: '', email: '', role: '', phone: '' }); }} style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 11, padding: '11px 12px', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Mark waiting<br /><span style={{ color: C.soft, fontWeight: 500 }}>next update</span></button>
                        </div>
                        )}
                        <details style={{ border: `1px solid ${C.border}`, background: C.bg, borderRadius: 11, padding: '9px 10px', marginTop: 10 }}>
                          <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900, fontSize: 12.5 }}>Prepared routing, proof, and audit layers</summary>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                            {loopRows.map(([label, body, tone]) => (
                              <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', minHeight: 72 }}>
                                <div style={{ color: tone, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                                <div style={{ color: label === 'Owner' ? tone : C.mid, fontSize: 11.6, lineHeight: 1.35, marginTop: 5, fontWeight: label === 'Owner' ? 900 : 500 }}>{body}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 8, marginTop: 10 }}>
                            {coordinationRows.map(row => (
                              <div key={row.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                                  <span style={{ color: C.soft, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{row.label}</span>
                                  <span style={{ color: C.sage, fontSize: 11, fontWeight: 900 }}>{row.count}</span>
                                </div>
                                <div style={{ color: C.mid, fontSize: 11.6, lineHeight: 1.4, marginTop: 5 }}>{row.body}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                        {assignOpen && (
                          <div onClick={() => setAssignmentDraft({ taskId: '', name: '', email: '', role: '', phone: '' })} style={{ position: 'fixed', inset: 0, zIndex: 230, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                          <div role="dialog" aria-modal="true" aria-label="Assign task owner" onClick={event => event.stopPropagation()} style={{ width: 'min(700px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Assign owner</div>
                              <button onClick={() => setAssignmentDraft({ taskId: '', name: '', email: '', role: '', phone: '' })} aria-label="Close assignment" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 32, height: 32, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
                            </div>
                            <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 4 }}>Saved employees, roles, family coordinators, and participants appear here as the uniform owner list for this estate task. Location context stays attached to the case.</div>
                            {assignmentOptions.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 8, marginTop: 10, alignItems: 'center' }}>
                                <select
                                  value={assignmentDraft.email || ''}
                                  onChange={event => applyAssignee(assignmentOptions.find(option => option.email === event.target.value))}
                                  style={inputStyle}
                                >
                                  {assignmentOptions.map(option => (
                                    <option key={`${option.type}_${option.email || option.name}`} value={option.email}>{option.label}</option>
                                  ))}
                                </select>
                                <button onClick={() => setAssignmentDraft(prev => ({ ...prev, name: '', email: '', role: '', phone: '' }))} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '9px 11px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Manual</button>
                              </div>
                            ) : (
                              <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: '9px 10px', color: C.amber, fontSize: 12.2, lineHeight: 1.45, marginTop: 10 }}>
                                <div>No employees or case contacts are saved yet.</div>
                                <button onClick={() => openPartnerManagement('Add an employee or case contact first; saved people appear in this owner dropdown.')} style={{ border: `1px solid ${C.amber}44`, background: C.card, color: C.amber, borderRadius: 9, padding: '8px 10px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', marginTop: 8 }}>Open management</button>
                              </div>
                            )}
                            {(!assignmentDraft.email || !assignmentOptions.some(option => option.email === assignmentDraft.email)) && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                                <input value={assignmentDraft.name} onChange={event => setAssignmentDraft(prev => ({ ...prev, name: event.target.value }))} placeholder="Name or role" style={inputStyle} />
                                <input value={assignmentDraft.email} onChange={event => setAssignmentDraft(prev => ({ ...prev, email: event.target.value }))} placeholder="Email address" style={inputStyle} />
                                <input value={assignmentDraft.role} onChange={event => setAssignmentDraft(prev => ({ ...prev, role: event.target.value }))} placeholder="Role: staff, executor, clergy..." style={inputStyle} />
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
                              <button disabled={updating === nextPartnerTask.id + 'assign'} onClick={() => assignTaskOwner(nextPartnerTask)} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{updating === nextPartnerTask.id + 'assign' ? 'Saving...' : 'Save owner and proof'}</button>
                              <button onClick={() => setAssignmentDraft({ taskId: '', name: '', email: '', role: '', phone: '' })} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Cancel</button>
                            </div>
                          </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {isExpanded && (
                    <details id={'partner-coordination-spine-' + item.id} data-demo-anchor="demo-coordination" open={router.query.demoTour === 'funeral-home' && router.query.demoStep === 'chat'} style={{ border: `1px solid ${C.border}`, borderRadius: 13, background: C.bg, marginTop: 10, overflow: 'hidden', scrollMarginTop: 92 }}>
                      <summary style={{ cursor: 'pointer', padding: '10px 12px', color: C.ink, fontSize: 12.5, fontWeight: 900 }}>
                        Supporting details
                      </summary>
                      <div style={{ padding: '0 12px 12px' }}>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', paddingTop: 9 }}>
                    {detailTabs.map(([key, label, count]) => (
                      <button
                        key={key}
                        onClick={() => setCaseDetailTabs(prev => ({ ...prev, [item.id]: key }))}
                        style={{ border: `1px solid ${detailTab === key ? C.sage : C.border}`, background: detailTab === key ? C.sage : C.card, color: detailTab === key ? '#fff' : C.mid, borderRadius: 999, padding: '7px 10px', fontFamily: 'Georgia,serif', fontSize: 11.5, fontWeight: 900, cursor: 'pointer' }}>
                        {label} <span style={{ opacity: .72 }}>{count}</span>
                      </button>
                    ))}
                  </div>
                  {detailTab === 'proof' && orchestration.progress.length > 0 && (
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
                  {detailTab === 'proof' && item.activity?.length > 0 && (
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
                  {detailTab === 'proof' && (
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: C.sage, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 7 }}>Family status view</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 8 }}>
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
                  )}
                  {detailTab === 'family' && familyParticipants.length > 0 && (
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
                      <div style={{ color: C.soft, fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>Family access link ready.</div>
                    </div>
                  )}
                  {detailTab === 'family' && familyParticipants.length === 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10, color: C.mid, fontSize: 12.5 }}>No family access handoff is saved for this case yet.</div>
                  )}
                  {detailTab === 'proof' && item.coordinationSpine?.latest?.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Conversation, proof, and notifications</div>
                      {item.coordinationSpine.latest.slice(0, 5).map(message => (
                        <div key={message.id} style={{ fontSize: 12.3, color: C.mid, lineHeight: 1.45, padding: '5px 0', borderTop: `1px solid ${C.border}` }}>
                          <strong style={{ color: C.ink }}>{message.layerLabel ? `${message.layerLabel}: ` : ''}{message.title || message.subject || 'Family update'}</strong>
                          <div>{message.detail || `${message.channel || 'message'} to ${message.recipient_name || message.recipient_email || message.recipient_phone || message.recipient || 'recipient'} - ${message.statusLabel || statusLabel(message.status)}`}</div>
                          {message.expectedUpdate && <div style={{ color: C.sage, fontWeight: 800 }}>{message.expectedUpdate}</div>}
                          {(message.at || message.sent_at) && <div style={{ color: C.soft }}>{new Date(message.at || message.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>}
                          {message.error_message && <div style={{ color: C.rose }}>{message.error_message}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {detailTab === 'proof' && orchestration.progress.length === 0 && item.activity?.length === 0 && item.coordinationSpine?.latest?.length === 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10, color: C.mid, fontSize: 12.5 }}>No proof or coordination events are recorded yet.</div>
                  )}
                  {detailTab === 'local' && vendorRequests.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.soft, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 5 }}>Local support requests</div>
                      {vendorRequests.slice(0, 3).map(request => (
                        <div key={request.id} style={{ fontSize: 12.3, color: C.mid, lineHeight: 1.45, padding: '5px 0', borderTop: `1px solid ${C.border}` }}>
                          <strong style={{ color: C.ink }}>{request.task_title || 'Local help'}</strong>
                          <div>{request.vendors?.business_name || 'Vendor'} - {vendorRequestLabel(request.status)}{request.requested_at ? ` - ${new Date(request.requested_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</div>
                          <div style={{ color: C.soft, fontSize: 11.4 }}>{request.urgency === 'rush' ? 'Urgent timeframe' : 'Planned timeframe'}{request.vendor_note ? ` - ${request.vendor_note}` : ''}</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                            {request.viewed_at && <span style={miniPill}>Viewed</span>}
                            {request.responded_at && <span style={miniPill}>Quote ready</span>}
                            {request.in_progress_at && <span style={miniPill}>Quote accepted</span>}
                            {request.completed_at && <span style={miniPill}>Completed</span>}
                            {vendorValue(request) > 0 && <span style={miniPill}>Value ${Math.round(vendorValue(request))}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {detailTab === 'local' && vendorRequests.length === 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10, color: C.mid, fontSize: 12.5 }}>No task-linked local support requests are open for this case.</div>
                  )}
                  {detailTab === 'tasks' && topTasks.length === 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10, color: C.mid, fontSize: 12.5 }}>No partner-ready task details are open right now.</div>
                  )}
                  {detailTab === 'tasks' && topTasks.map(task => (
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
                          <button disabled={updating === task.id + 'waiting'} onClick={() => { setTaskDraft({ task, status: 'waiting', label: 'Waiting update', prompt: taskActionPrompt('waiting', task, 'funeral_home'), draft, output, proofDestination }); setTaskDraftNote(''); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Mark waiting</button>
                          <button disabled={updating === task.id + 'blocked'} onClick={() => { setTaskDraft({ task, status: 'blocked', label: 'Request this from family', prompt: taskActionPrompt('blocked', task, 'funeral_home'), draft, output, proofDestination }); setTaskDraftNote(draft); }} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Request from family</button>
                          <button disabled={updating === task.id + 'handle_for_family'} onClick={() => { setTaskDraft({ task, status: 'handled', label: 'Close with proof', prompt: 'Add the proof note that shows what happened, then close this task so it leaves the active queue.', draft, output, proofDestination }); setTaskDraftNote(''); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{updating === task.id + 'handle_for_family' ? 'Saving...' : 'Close with proof'}</button>
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
                    </details>
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}
        {user && taskDraft?.task && (
          <PartnerTaskActionDialog
            taskDraft={taskDraft}
            taskDraftNote={taskDraftNote}
            setTaskDraftNote={setTaskDraftNote}
            copiedKey={copiedKey}
            updating={updating}
            orgName={org?.name || 'Funeral home'}
            onCopyText={copyText}
            onPreviewOutput={(preview) => setOutputPreview(preview)}
            onClose={() => { setTaskDraft(null); setTaskDraftNote(''); }}
            onHandleForFamily={handleForFamily}
            onUpdateTask={updateTask}
          />
        )}
        {user && outputPreview && (
          <PreparedOutputPreviewDialog
            preview={outputPreview}
            copiedKey={copiedKey}
            onCopyText={copyText}
            onClose={() => setOutputPreview(null)}
          />
        )}
        {user && packetModal && (
          <PacketGeneratorModal
            estateId={packetModal.estateId}
            packetType={packetModal.packetType}
            accessToken={token}
            onClose={() => setPacketModal(null)}
            onComplete={({ packet, text }) => {
              setPacketModal(null);
              setOutputPreview({
                title: packet?.data?.title || 'Prepared Passage packet',
                subtitle: 'Generated from the case spine',
                purpose: packet?.data?.approvalBoundary || 'Review before sharing outside the family record.',
                text,
                copyKey: 'generated_packet_' + (packet?.estate_id || ''),
              });
            }}
          />
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
          <div style={{ color: '#b7d0bb', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Case flow</div>
          <h2 style={{ fontSize: 27, lineHeight: 1.12, margin: '7px 0 7px', fontWeight: 400 }}>Move the next case toward proof and report.</h2>
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
          <div style={{ color: '#b7d0bb', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Recommended next click</div>
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

function HelpOverlay({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(26,25,22,.42)', display: 'grid', placeItems: 'center', padding: 18 }}>
      <div style={{ width: 'min(960px, 100%)', maxHeight: '90vh', overflow: 'auto', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 14, boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, padding: '8px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PartnerDirectorFocus({ riskItems, inboxItems, caseItems, isMultiLocation, onOpenCase }) {
  const firstRisk = riskItems[0] || null;
  const firstInbox = inboxItems[0] || null;
  const firstCase = caseItems[0] || null;
  const empty = !firstRisk && !firstInbox && !firstCase;
  return (
    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Director focus</div>
          <div style={{ fontSize: 22, marginTop: 3 }}>Risk, replies, and next case work.</div>
        </div>
        <div style={{ color: C.mid, fontSize: 12.5 }}>{riskItems.length} at risk · {inboxItems.length} updates · {caseItems.length} next cases</div>
      </div>
      {empty ? (
        <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: 12, color: C.sage, fontSize: 13, fontWeight: 800 }}>
          No director attention items right now.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
          <FocusWidget
            label="At risk"
            count={riskItems.length}
            tone={C.amber}
            bg={C.amberFaint}
            title={firstRisk ? sharedTaskTitle(firstRisk.task) : 'No risk items'}
            body={firstRisk ? `${firstRisk.caseItem.deceased_name || firstRisk.caseItem.estate_name || firstRisk.caseItem.name || 'Family case'} - ${taskExpectedUpdate(firstRisk.task, 'funeral_home')}` : 'Nothing is escalating.'}
            cta={firstRisk ? 'Open case' : ''}
            onClick={firstRisk ? () => onOpenCase(firstRisk.caseItem.id) : null}
          />
          <FocusWidget
            label="Attention"
            count={inboxItems.length}
            tone={firstInbox?.attentionLevel === 'urgent' ? C.rose : firstInbox?.attentionLevel === 'waiting' ? C.amber : C.sage}
            bg={firstInbox?.attentionLevel === 'urgent' ? C.roseFaint : firstInbox?.attentionLevel === 'waiting' ? C.amberFaint : C.sageFaint}
            title={firstInbox ? (firstInbox.title || 'Update recorded') : 'No new replies'}
            body={firstInbox ? (firstInbox.expectedUpdate || firstInbox.detail || firstInbox.statusLabel || 'Open the case to respond.') : 'Family, staff, vendor, and proof updates are quiet.'}
            cta={firstInbox ? 'Open case' : ''}
            onClick={firstInbox ? () => onOpenCase(firstInbox.caseId) : null}
          />
          <FocusWidget
            label={isMultiLocation && firstCase ? (firstCase.locationName || 'Next case') : 'Next case'}
            count={caseItems.length}
            tone={C.sage}
            bg={C.sageFaint}
            title={firstCase ? (firstCase.caseItem.deceased_name || firstCase.caseItem.estate_name || firstCase.caseItem.name || 'Family case') : 'No open case work'}
            body={firstCase ? `${sharedTaskTitle(firstCase.task)} - ${sharedTaskNext(firstCase.task, 'funeral_home')}` : 'Nothing needs partner action right now.'}
            cta={firstCase ? 'Open work' : ''}
            onClick={firstCase ? () => onOpenCase(firstCase.caseItem.id) : null}
          />
        </div>
      )}
      {(riskItems.length > 1 || inboxItems.length > 1 || caseItems.length > 1) && (
        <details style={{ marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: C.mid, fontWeight: 900 }}>Show supporting queue</summary>
          <div style={{ display: 'grid', gap: 7, marginTop: 9 }}>
            {riskItems.slice(1, 4).map(({ task, caseItem, label }) => (
              <button key={`${caseItem.id}_${task.id}_${label}`} onClick={() => onOpenCase(caseItem.id)} style={queueButtonStyle(C.amber)}>
                <strong>{label}</strong> - {caseItem.deceased_name || caseItem.estate_name || caseItem.name || 'Family case'}: {sharedTaskTitle(task)}
              </button>
            ))}
            {inboxItems.slice(1, 4).map(item => (
              <button key={`${item.caseId}_${item.id}`} onClick={() => onOpenCase(item.caseId)} style={queueButtonStyle(item.attentionLevel === 'urgent' ? C.rose : C.sage)}>
                <strong>{item.attentionLabel || 'Attention'}</strong> - {item.caseName}: {item.title || item.detail || 'Update recorded'}
              </button>
            ))}
            {caseItems.slice(1, 4).map(({ caseItem, task }) => (
              <button key={`${caseItem.id}_${task.id}`} onClick={() => onOpenCase(caseItem.id)} style={queueButtonStyle(C.sage)}>
                <strong>{caseItem.deceased_name || caseItem.estate_name || caseItem.name || 'Family case'}</strong> - {sharedTaskTitle(task)}
              </button>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function FocusWidget({ label, count, tone, bg, title, body, cta, onClick }) {
  return (
    <button disabled={!onClick} onClick={onClick || undefined} style={{ textAlign: 'left', border: `1px solid ${tone}33`, borderLeft: `5px solid ${tone}`, background: bg, borderRadius: 14, padding: 13, fontFamily: 'Georgia,serif', cursor: onClick ? 'pointer' : 'default', minHeight: 150 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <div style={{ color: tone, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
        <span style={{ color: tone, background: C.card, borderRadius: 999, padding: '3px 7px', fontSize: 11, fontWeight: 900 }}>{count}</span>
      </div>
      <div style={{ color: C.ink, fontSize: 17, lineHeight: 1.18, fontWeight: 900, marginTop: 8 }}>{title}</div>
      <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 6 }}>{body}</div>
      {cta && <div style={{ color: tone, fontSize: 12, fontWeight: 900, marginTop: 10 }}>{cta}</div>}
    </button>
  );
}

function PreparedOutputPreviewDialog({ preview, copiedKey, onCopyText, onClose }) {
  if (!preview) return null;
  const copyKey = preview.copyKey || 'prepared_output_preview';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 240, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div role="dialog" aria-modal="true" aria-label="Prepared output preview" onClick={event => event.stopPropagation()} style={{ width: 'min(820px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
            <img src="/passage-icon-light-onbg.svg" alt="Passage" style={{ width: 34, height: 34, borderRadius: 9 }} />
            <div>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Prepared Passage output</div>
              <div style={{ color: C.ink, fontSize: 24, lineHeight: 1.15, fontWeight: 900, marginTop: 4 }}>{preview.title || 'Passage prepared output'}</div>
              {preview.subtitle && <div style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.45, marginTop: 4 }}>{preview.subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close prepared output preview" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 34, height: 34, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
        </div>
        <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 13, padding: '10px 11px', color: C.mid, fontSize: 12.5, lineHeight: 1.5, marginTop: 12 }}>
          <strong style={{ color: C.ink }}>What this is for:</strong> {preview.purpose || 'Review this before copying it into a case file, staff note, or approved family handoff. Passage does not send it automatically.'}
        </div>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 13, padding: 14, color: C.ink, fontFamily: 'Georgia,serif', fontSize: 12.5, lineHeight: 1.55, margin: '12px 0 0' }}>{preview.text}</pre>
        <div style={{ color: C.soft, fontSize: 11.2, lineHeight: 1.45, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
          Prepared by Passage. Review before sharing outside the family record. Powered by Passage | thepassageapp.io
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button onClick={() => onCopyText(preview.text, 'Prepared output copied.', copyKey)} style={{ border: 'none', background: copiedKey === copyKey ? C.ink : C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{copiedKey === copyKey ? 'Copied' : 'Copy reviewed output'}</button>
          <button onClick={() => downloadPreparedOutput(preview)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Download .txt</button>
          <button onClick={() => printPreparedOutput(preview)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Print / save PDF</button>
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function PartnerTaskActionDialog({ taskDraft, taskDraftNote, setTaskDraftNote, copiedKey, updating, orgName, onCopyText, onPreviewOutput, onClose, onHandleForFamily, onUpdateTask }) {
  const task = taskDraft?.task;
  if (!task) return null;
  const proofDestination = taskDraft.proofDestination || taskProofDestination(task, { surface: 'case spine proof' });
  const isSaving = updating === task.id + taskDraft.status || updating === task.id + 'handle_for_family';
  const canSave = !!String(taskDraftNote || '').trim() && !isSaving;
  const note = String(taskDraftNote || '').trim();
  const copyKey = taskDraft.status === 'blocked' ? 'task_request_' + task.id : 'task_output_' + task.id;
  const copyLabel = taskDraft.status === 'blocked' ? 'Copy family request' : 'Copy proof packet';
  const copiedLabel = taskDraft.status === 'blocked' ? 'Family request copied.' : 'Prepared output copied.';
  const saveLabel = taskDraft.status === 'handled'
    ? 'Close task with this proof'
    : taskDraft.status === 'blocked'
      ? 'Save family request'
      : 'Save waiting update';
  const previewTitle = taskDraft.status === 'blocked'
    ? 'Family request'
    : taskDraft.status === 'waiting'
      ? 'Waiting update'
      : 'Proof packet';
  const previewPurpose = taskDraft.status === 'blocked'
    ? 'Copy this reviewed request into email, text, or the case file. Nothing sends automatically from Passage.'
    : taskDraft.status === 'waiting'
      ? 'Use this reviewed update to show what is waiting, who owns it, and when the next follow-up is expected.'
      : 'Review this branded proof packet before saving it to the case spine or printing it for the arrangement file.';

  function saveTaskAction() {
    if (!canSave) return;
    if (taskDraft.status === 'handled') {
      onHandleForFamily(task, `${orgName} completed ${sharedTaskTitle(task)}: ${note}`);
      return;
    }
    onUpdateTask(
      task,
      taskDraft.status,
      `${orgName} ${taskDraft.status === 'blocked' ? 'requested family information' : 'updated waiting status'} for ${sharedTaskTitle(task)}: ${note}. ${proofDestination}`
    );
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 230, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div role="dialog" aria-modal="true" aria-label="Update partner task" onClick={event => event.stopPropagation()} style={{ width: 'min(760px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 16, padding: 16, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{taskDraft.label}</div>
            <div style={{ color: C.ink, fontSize: 17, fontWeight: 900, lineHeight: 1.25, marginTop: 3 }}>{sharedTaskTitle(task)}</div>
          </div>
          <button onClick={onClose} aria-label="Close task action" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 32, height: 32, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
        </div>
        <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 6 }}>{taskDraft.prompt}</div>
        <div style={{ marginTop: 9 }}>
          <RoleActionStrip
            compact
            role="Partner task owner"
            action={saveLabel}
            waiting={taskExpectedUpdate(task, 'funeral_home')}
            proof={proofDestination}
            privacy="This updates the case spine and reports. It does not send live email or SMS from this dialog."
          />
        </div>
        {taskDraft.output && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>
            <strong style={{ color: C.ink }}>{taskDraft.output.label}</strong>
            <div>{taskDraft.output.body}</div>
          </div>
        )}
        <textarea
          value={taskDraftNote}
          onChange={(e) => setTaskDraftNote(e.target.value)}
          placeholder={taskActionPlaceholder(taskDraft.status, task, 'funeral_home')}
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 112, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 12.5, lineHeight: 1.45, background: C.card, color: C.ink, marginTop: 9 }}
        />
        <div style={{ color: C.soft, fontSize: 11.4, lineHeight: 1.45, marginTop: 6 }}>{proofDestination}</div>
        {taskDraft.status === 'handled' && (
          <div style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>
            This is the proof packet that closes the task. Review it, copy or print it for the arrangement file if needed, then close the task so the waiting/request actions disappear.
          </div>
        )}
        {taskDraft.status === 'blocked' && (
          <div style={{ background: C.card, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>
            This request is saved as a waiting family item. Copy it for email/text when you are demoing; Passage does not send live messages here.
          </div>
        )}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
          {(taskDraft.status === 'handled' || taskDraft.status === 'blocked') && (
            <button
              disabled={!note}
              onClick={() => onCopyText(note, copiedLabel, copyKey)}
              style={{ border: `1px solid ${taskDraft.status === 'blocked' ? C.amber + '44' : C.sage + '33'}`, background: C.card, color: taskDraft.status === 'blocked' ? C.amber : C.sage, borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 900, cursor: note ? 'pointer' : 'not-allowed', opacity: note ? 1 : .55, fontFamily: 'Georgia,serif' }}>
              {copiedKey === copyKey ? 'Copied' : copyLabel}
            </button>
          )}
          <button
            disabled={!note}
            onClick={() => onPreviewOutput && onPreviewOutput({ title: previewTitle, subtitle: sharedTaskTitle(task), purpose: previewPurpose, text: note, copyKey })}
            style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 900, cursor: note ? 'pointer' : 'not-allowed', opacity: note ? 1 : .55, fontFamily: 'Georgia,serif' }}>
            Preview / print
          </button>
          <button
            disabled={!note}
            onClick={() => downloadPreparedOutput({ title: previewTitle, subtitle: sharedTaskTitle(task), purpose: previewPurpose, text: note })}
            style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 900, cursor: note ? 'pointer' : 'not-allowed', opacity: note ? 1 : .55, fontFamily: 'Georgia,serif' }}>
            Download
          </button>
          <button
            disabled={!canSave}
            onClick={saveTaskAction}
            style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 900, cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : .55, fontFamily: 'Georgia,serif' }}>
            {isSaving ? 'Saving...' : saveLabel}
          </button>
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function queueButtonStyle(tone) {
  return { textAlign: 'left', background: C.bg, border: `1px solid ${C.border}`, borderLeft: `4px solid ${tone}`, borderRadius: 10, padding: '9px 10px', color: C.mid, fontFamily: 'Georgia,serif', cursor: 'pointer', fontSize: 12.5 };
}

function PartnerAttentionInbox({ items, onOpenCase }) {
  return (
    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Attention inbox</div>
          <div style={{ fontSize: 21, marginTop: 3 }}>Replies and status changes.</div>
        </div>
        <div style={{ color: C.mid, fontSize: 12.5 }}>Messages, proof, and notification delivery stay attached to the case.</div>
      </div>
      {items.length === 0 ? (
        <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: 12, color: C.sage, fontSize: 13 }}>
          No open coordination updates need attention right now.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map(item => {
            const kind = item.kind === 'vendor' ? 'Vendor' : item.kind === 'message' ? 'Message' : item.kind === 'task' ? 'Task status' : 'Case update';
            const urgent = item.attentionLevel === 'urgent';
            const waiting = item.attentionLevel === 'waiting';
            const tone = urgent ? C.rose : waiting ? C.amber : C.sage;
            const bg = urgent ? C.roseFaint : waiting ? C.amberFaint : C.sageFaint;
            return (
              <button key={`${item.caseId}_${item.id}`} onClick={() => onOpenCase(item.caseId)} style={{ textAlign: 'left', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', border: `1px solid ${urgent ? C.rose + '44' : C.border}`, borderLeft: `5px solid ${tone}`, background: C.bg, borderRadius: 12, padding: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: tone, background: bg, borderRadius: 999, padding: '3px 8px', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 900 }}>{item.attentionLabel || kind}</span>
                    <span style={{ color: C.soft, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{item.caseName} - {item.locationName}</span>
                  </div>
                  <div style={{ color: C.ink, fontSize: 14.5, fontWeight: 900, marginTop: 3 }}>{item.title || 'Update recorded'}</div>
                  <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 3 }}>{item.detail || item.statusLabel || 'Open the case to respond or record proof.'}</div>
                  {item.expectedUpdate && <div style={{ color: tone, fontSize: 11.8, lineHeight: 1.4, fontWeight: 800, marginTop: 4 }}>{item.expectedUpdate}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
                    {item.actor && <span style={miniPill}>From {item.actor}</span>}
                    {item.recipient && <span style={miniPill}>To {item.recipient}</span>}
                    {item.statusLabel && <span style={miniPill}>{item.statusLabel}</span>}
                  </div>
                </div>
                <span style={{ color: C.sage, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>Open case</span>
              </button>
            );
          })}
        </div>
      )}
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
