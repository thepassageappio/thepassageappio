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
import { recommendedFuneralHomeNextAction } from '../../lib/funeralHomeNextActions';
import { trackEvent } from '../../lib/trackEvent';
import { recordOnboardingProgress } from '../../lib/onboardingClient';
import { isPassageAdmin } from '../../lib/adminAccess';

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

function taskStatusValue(task) {
  if (typeof task === 'string') return task.toLowerCase();
  return String(task?.status || task?.delivery_status || task?.outcome_status || '').toLowerCase();
}

function taskIsClosed(task) {
  const status = taskStatusValue(task);
  const outcome = String(task?.outcome_status || '').toLowerCase();
  return ['handled', 'completed', 'done', 'not_applicable', 'cancelled'].includes(status)
    || ['handled', 'completed', 'done'].includes(outcome)
    || Boolean(task?.completed_at || task?.handled_at);
}

function taskIsOpen(task) {
  return !taskIsClosed(task);
}

function taskIsWaiting(task) {
  return taskIsOpen(task) && ['sent', 'waiting', 'pending', 'assigned', 'acknowledged'].includes(taskStatusValue(task));
}

function taskNeedsHelp(task) {
  return taskIsOpen(task) && ['blocked', 'failed', 'needs_review'].includes(taskStatusValue(task));
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
  const subtitle = escapePreparedOutput(preview.subtitle || 'Family coordination record');
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
            <div class="muted">Family coordination record</div>
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
  if (value === 'in_progress') return 'Quote approved';
  if (value === 'accepted') return 'Quote ready';
  if (value === 'declined') return 'Declined';
  return 'Quote requested';
}

function partnerPlanDisplayName(value, fallback = 'Single-location plan') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const clean = raw.toLowerCase();
  if (/group|multi/.test(clean)) return 'Multi-location plan';
  if (/local|single/.test(clean)) return 'Single-location plan';
  if (/pilot|trial/.test(clean)) return 'Guided rollout plan';
  if (/demo/.test(clean)) return 'Demo plan';
  return raw
    .replace(/^partner[_\s-]*/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
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

function partnerUrgentContext(item = {}) {
  const context = item?.scopedUrgentContext || item?.orchestration_summary?.chaplain_context || item?.orchestration_summary?.planning_context || {};
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
  partnerPlan: { name: 'Sample plan', status: 'demo' },
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
        chaplain_context: {
          deathContext: 'hospital',
          pronouncementStatus: 'confirmed',
          funeralHomeHandoffIntent: 'known',
        },
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
          { id: 'attn2', title: 'Obituary approval needs decision', detail: 'Draft needs one family decision before it can be sent.', status: 'blocked', statusLabel: 'Needs help' },
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
  funeralHomeRequests: [
    {
      id: 'demo-inbound-1',
      workflow_id: 'demo-case-green',
      requested_provider_name: 'Hudson Valley Funeral Group',
      requested_by_name: 'Anna Reed',
      requested_by_email: 'anna@example.com',
      requested_by_phone: '845-555-0188',
      address: 'Beacon, NY',
      city: 'Beacon',
      state: 'NY',
      status: 'matched_partner',
      urgency: 'soon',
      source: 'green_path',
      family_permission_to_contact: true,
      notes: 'Family is planning ahead and wants a director conversation this week.',
      estimated_case_value: 7200,
      requested_at: '2026-05-11T14:20:00Z',
      case_name: 'Reed planning file',
      location_name: 'Beacon',
    },
    {
      id: 'demo-inbound-2',
      workflow_id: 'demo-case-price',
      requested_provider_name: 'Hudson Valley Funeral Group',
      requested_by_name: 'Michael Price',
      requested_by_email: 'michael@example.com',
      requested_by_phone: '845-555-0137',
      address: 'Poughkeepsie, NY',
      city: 'Poughkeepsie',
      state: 'NY',
      status: 'accepted',
      urgency: 'urgent',
      source: 'red_path',
      family_permission_to_contact: true,
      notes: 'Family requested help connecting the active record to the funeral home.',
      estimated_case_value: 11800,
      requested_at: '2026-05-10T10:15:00Z',
      accepted_at: '2026-05-10T10:42:00Z',
      case_name: 'Price family',
      location_name: 'Poughkeepsie',
    },
  ],
  reports: {},
};

function demoPartnerContextForPersona(persona = '', email = '') {
  const cleanPersona = String(persona || '').toLowerCase();
  const staffPersona = /employee|staff/.test(cleanPersona);
  const staffEmail = String(email || 'staff@passagefh.example').toLowerCase();
  const context = JSON.parse(JSON.stringify(demoPartnerContext));
  if (!staffPersona) return context;

  context.organizations = (context.organizations || []).map(row => ({
    ...row,
    role: 'staff',
  }));
  context.staff = [
    { email: staffEmail, role: 'staff', scope: 'assigned_work', status: 'active', display_name: 'Demo staff member', location_scope: 'Main location', hourly_cost: '32' },
    ...(context.staff || []),
  ];
  context.cases = (context.cases || []).map(item => ({
    ...item,
    tasks: (item.tasks || []).map(task => {
      const assigned = String(task.assigned_to_email || '').toLowerCase();
      if (assigned && !/robert|staff|hvfg/.test(assigned)) return task;
      return {
        ...task,
        assigned_to_name: 'Demo staff member',
        assigned_to_email: staffEmail,
      };
    }),
  }));
  return context;
}

const publicDemoUser = {
  id: 'public-funeral-home-demo',
  email: 'sample@thepassageapp.io',
  user_metadata: { full_name: 'Sample funeral-home director' },
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
    ? [['Case', 'Case type', 'Reference', 'Case value', 'Prepaid', 'Prepaid amount', 'Family contact', 'Family email', 'Location', 'Open client steps', 'Waiting client steps', 'Handled client steps', 'Next move', 'Updated at']]
    : [['Case', 'Record type', 'Case type', 'Reference', 'Case value', 'Prepaid', 'Family contact', 'Family email', 'Location', 'Client step / request', 'Owner', 'Status', 'Waiting on', 'Proof / reporting']];

  for (const item of cases) {
    const tasks = [...(item.partnerTasks || []), ...(item.tasks || [])];
    const handled = tasks.filter(taskIsClosed);
    const waiting = tasks.filter(task => taskIsWaiting(task) || taskNeedsHelp(task));
    const open = tasks.filter(taskIsOpen);
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
        item.nextTask?.title || open[0]?.title || 'No open work',
        item.updated_at || item.updatedAt || '',
      ]);
      continue;
    }

    if (!tasks.length) {
      rows.push([caseName, 'case', item.caseType || 'At-need', item.caseReference || '', caseValueNumber(item) || '', caseFinancials(item)?.is_prepaid ? 'Yes' : 'No', item.coordinatorName || '', item.coordinatorEmail || '', item.location || 'Main location', 'No open work', '', item.status || '', '', '']);
    }
    for (const task of tasks) {
      rows.push([
        caseName,
        'work_item',
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
  const requestedDemoMode = router.query.demoTour === 'funeral-home' || router.query.demo === '1';
  const [demoMode, setDemoMode] = useState(false);
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
  const [assignmentDraft, setAssignmentDraft] = useState({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' });
  const [activePartnerView, setActivePartnerView] = useState('work');
  const [reportView, setReportView] = useState('overview');
  const [reportRange, setReportRange] = useState('30');
  const [reportLocation, setReportLocation] = useState('all');
  const [reportStaff, setReportStaff] = useState('all');
  const [reportDates, setReportDates] = useState({ from: '', to: '' });
  const [caseDetailTabs, setCaseDetailTabs] = useState({});
  const [staffCaseContextOpen, setStaffCaseContextOpen] = useState(false);
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
  const [brandingDraft, setBrandingDraft] = useState({ organizationName: '', familyPortalName: '', supportEmail: '', supportPhone: '', logoUrl: '', primaryColor: '#6b8f71', whiteLabelEnabled: true });
  const [importDraft, setImportDraft] = useState(null);
  const [exportRange, setExportRange] = useState({ from: '', to: '' });
  const [copiedKey, setCopiedKey] = useState('');
  const casePanelRef = useRef(null);
  const [caseForm, setCaseForm] = useState({
    funeralHomeName: '',
    caseType: 'immediate',
    personName: '',
    locationId: '',
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
    if (params.get('partner') === '1') {
      setActivePartnerView('manage');
      const emailHint = params.get('email');
      if (emailHint) setPartnerEmail(emailHint);
      setNotice('Workspace invite opened. Sign in with the invited email, then confirm brand, locations, employees, and first cases.');
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (!supabase?.auth) {
      setError('Supabase browser auth is not configured in this environment.');
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user || null;
      const sessionToken = session?.access_token || '';
      if (requestedDemoMode) {
        const persona = router.query.persona || router.query.role || '';
        const adminDemo = isPassageAdmin(sessionUser?.email);
        const demoEmail = sessionUser?.email || (/employee|staff/.test(String(persona || router.query.role || '').toLowerCase()) ? 'arranger@samplefuneralhome.example' : 'director@samplefuneralhome.example');
        const personaContext = demoPartnerContextForPersona(persona, demoEmail);
        personaContext.demoData = true;
        personaContext.isPassageAdmin = adminDemo;
        personaContext.demoLabel = adminDemo
          ? 'Demo mode. Actions are simulated unless you leave demo mode.'
          : 'Sample funeral-home workspace. Actions are simulated and no live records or messages are changed.';
        setDemoMode(true);
        setUser(sessionUser || publicDemoUser);
        setToken(sessionToken || '');
        setData(personaContext);
        setPartnerEmail(demoEmail);
        setVendorPrefs({
          vendors: [{ id: 'demo-vendor', business_name: 'Hudson Valley Livestream', category: 'livestream', status: 'active' }],
          preferred: [{ vendor_id: 'demo-vendor', category: 'livestream', active: true }],
          marketplaceEnabled: true,
        });
        setLoading(false);
        return;
      }
      setDemoMode(false);
      setUser(sessionUser);
      setToken(sessionToken);
      if (sessionToken) {
        load(sessionToken);
        loadPreferredVendors(sessionToken);
      }
      else {
        setLoading(false);
      }
    });
  }, [router.isReady, requestedDemoMode]);

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
      setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' });
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
    const useDemoContext = demoMode && !token;
    const res = await fetch(useDemoContext ? '/api/partnerContext?demo=1' : '/api/partnerContext', token ? { headers: { Authorization: 'Bearer ' + token } } : undefined);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not load the funeral-home dashboard.');
    else setData(json);
    setLoading(false);
  }

  async function loadPreferredVendors(accessToken = token) {
    if (!accessToken) return;
    const res = await fetch('/api/vendors/preferred', { headers: { Authorization: 'Bearer ' + accessToken } });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setVendorPrefs({ vendors: json.vendors || [], preferred: json.preferred || [], marketplaceEnabled: json.marketplaceEnabled !== false });
  }

  async function getFreshPartnerToken() {
    if (demoMode) return token;
    if (!supabase?.auth) return token;
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;
    const expiresAtMs = session?.expires_at ? session.expires_at * 1000 : 0;
    const hasUsableSession = session?.access_token && (!expiresAtMs || expiresAtMs - Date.now() > 60 * 1000);
    if (hasUsableSession) {
      if (session.access_token !== token) setToken(session.access_token);
      return session.access_token;
    }

    const { data: refreshed } = await supabase.auth.refreshSession();
    const refreshedToken = refreshed?.session?.access_token || session?.access_token || '';
    if (refreshedToken && refreshedToken !== token) setToken(refreshedToken);
    return refreshedToken || token;
  }

  async function partnerAuthedFetch(url, options = {}) {
    const freshToken = await getFreshPartnerToken();
    if (!freshToken) {
      return new Response(JSON.stringify({ error: 'Sign in to your funeral-home workspace before changing live client steps.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const withAuth = (accessToken) => ({
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: 'Bearer ' + accessToken,
      },
    });
    let res = await fetch(url, withAuth(freshToken));
    if (res.status === 401 && supabase?.auth && !demoMode) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      const refreshedToken = refreshed?.session?.access_token || '';
      if (refreshedToken) {
        setToken(refreshedToken);
        res = await fetch(url, withAuth(refreshedToken));
      }
    }
    return res;
  }

  function updateLocalTask(taskId, updates = {}) {
    setData(prev => prev ? {
      ...prev,
      cases: (prev.cases || []).map(item => ({
        ...item,
        tasks: (item.tasks || []).map(t => t.id === taskId ? { ...t, ...updates } : t),
        partnerTasks: (item.partnerTasks || []).map(t => t.id === taskId ? { ...t, ...updates } : t),
      })),
    } : prev);
  }

  function demoTaskAction(task, status, confirmation, extra = {}) {
    const now = new Date().toISOString();
    const nextStatus = normalizedTaskStatus(status);
    updateLocalTask(task.id, {
      status: nextStatus,
      last_action_at: now,
      last_actor: user?.email || 'Demo funeral home user',
      ...extra,
    });
    setNotice(confirmation || taskActionConfirmation(status, task, 'funeral_home'));
    setTaskDraft(null);
    setTaskDraftNote('');
    setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' });
  }

  async function signIn() {
    if (!supabase?.auth) {
      setError('Supabase browser auth is not configured in this environment.');
      return;
    }
    window.location.assign('/auth/google?next=' + encodeURIComponent('/funeral-home/dashboard'));
  }

  async function signInWithPassword(event) {
    event?.preventDefault?.();
    if (!partnerEmail.trim() || !partnerPassword) {
      setError('Enter the work email and password for this workspace.');
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
        setError(authError.message || 'Could not sign in with that funeral-home account.');
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
      setNotice('Funeral-home dashboard opened. Cases, staff queue, reports, and proof are ready below.');
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
    const res = await partnerAuthedFetch('/api/vendors/preferred', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await partnerAuthedFetch('/api/vendors/preferred', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: vendor.id, category: vendor.category, active: !isPreferred }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not update preferred local support.');
    else await loadPreferredVendors(token);
    setUpdating('');
  }

  async function updateTask(task, status, detail) {
    if ((!token && !demoMode) || !task?.id) return;
    setUpdating(task.id + status);
    setError('');
    setNotice('');
    if (demoMode) {
      demoTaskAction(task, status, taskActionConfirmation(status, task, 'funeral_home'));
      setUpdating('');
      return;
    }
    try {
      const res = await partnerAuthedFetch(`/api/tasks/${task.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setError(json.error || 'Could not update this client step.');
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
        await load(await getFreshPartnerToken());
      }
    } finally {
      setUpdating('');
    }
  }

  async function handleForFamily(task, note) {
    if ((!token && !demoMode) || !task?.id) return;
    const cleanNote = String(note || '').trim();
    if (!cleanNote) {
      setError('Add what your team actually completed before marking this handled.');
      return;
    }
    setUpdating(task.id + 'handle_for_family');
    setError('');
    setNotice('');
    try {
      if (demoMode) {
        demoTaskAction(task, 'handled', 'Demo proof saved. The client step moved out of active client steps without sending a live message.', {
          notes: cleanNote,
          outcome_status: 'completed',
          completed_at: new Date().toISOString(),
        });
        return;
      }
      const res = await partnerAuthedFetch('/api/partnerHandleTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        const closedTaskUpdates = {
          ...(json.task || {}),
          status: nextStatus,
          outcome_status: json.task?.outcome_status || 'completed',
          completed_at: json.task?.completed_at || new Date().toISOString(),
          last_action_at: json.task?.last_action_at || new Date().toISOString(),
          last_actor: json.task?.last_actor || user?.email || 'Funeral home staff',
        };
        setData(prev => prev ? {
          ...prev,
          cases: (prev.cases || []).map(item => ({
            ...item,
            tasks: (item.tasks || []).map(t => t.id === task.id ? { ...t, ...closedTaskUpdates } : t),
            partnerTasks: (item.partnerTasks || []).map(t => t.id === task.id ? { ...t, ...closedTaskUpdates } : t),
          })),
        } : prev);
        setTaskDraft(null);
        setTaskDraftNote('');
        setNotice(json.confirmation || 'Proof saved. The family-facing status trail can show this without sending a live email.');
        await load(await getFreshPartnerToken());
      }
    } finally {
      setUpdating('');
    }
  }

  async function assignTaskOwner(task) {
    if ((!token && !demoMode) || !task?.id) return;
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
      if (demoMode) {
        demoTaskAction(task, 'assigned', 'Demo owner saved. In a live dashboard this updates the next-step owner and prepares the invite path.', {
          assigned_to_name: payload.name || payload.email,
          assigned_to_email: payload.email,
          recipient: payload.email,
        });
        return;
      }
      const res = await partnerAuthedFetch(`/api/tasks/${task.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not assign this client step.');
      } else {
        setData(prev => prev ? {
          ...prev,
          cases: (prev.cases || []).map(item => ({
            ...item,
            tasks: (item.tasks || []).map(t => t.id === task.id ? { ...t, ...(json.task || {}), status: t.status || 'assigned' } : t),
            partnerTasks: (item.partnerTasks || []).map(t => t.id === task.id ? { ...t, ...(json.task || {}), status: t.status || 'assigned' } : t),
          })),
        } : prev);
        setNotice(json.confirmation || 'Owner saved. Passage can route the next-step notification when approved.');
        setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' });
        await load(await getFreshPartnerToken());
      }
    } finally {
      setUpdating('');
    }
  }

  async function assignCaseTasks(caseItem, scope = 'unassigned_open') {
    if ((!token && !demoMode) || !caseItem?.id) return;
    const payload = {
      name: assignmentDraft.name,
      email: assignmentDraft.email,
      role: assignmentDraft.role,
      phone: assignmentDraft.phone,
      scope,
      actor: user?.email || 'Funeral home director',
    };
    if (!String(payload.email || '').trim()) {
      setError('Choose an employee before assigning this case.');
      return;
    }
    setUpdating(caseItem.id + 'assign_case');
    setError('');
    setNotice('');
    try {
      if (demoMode) {
        const ids = new Set((caseItem.tasks || [])
          .filter(taskIsOpen)
          .filter(t => scope === 'all_open' || (!t.assigned_to_email && !t.assigned_to_name))
          .map(t => t.id));
        const now = new Date().toISOString();
        setData(prev => prev ? {
          ...prev,
          cases: (prev.cases || []).map(item => item.id === caseItem.id ? {
            ...item,
            tasks: (item.tasks || []).map(t => ids.has(t.id) ? { ...t, assigned_to_name: payload.name || payload.email, assigned_to_email: payload.email, recipient: payload.email, last_actor: payload.actor, last_action_at: now } : t),
            partnerTasks: (item.partnerTasks || []).map(t => ids.has(t.id) ? { ...t, assigned_to_name: payload.name || payload.email, assigned_to_email: payload.email, recipient: payload.email, last_actor: payload.actor, last_action_at: now } : t),
          } : item),
        } : prev);
        setNotice(`${ids.size} demo client step${ids.size === 1 ? '' : 's'} assigned. In a live dashboard this updates the shared case record and staff queue.`);
        setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' });
        return;
      }
      const res = await partnerAuthedFetch(`/api/workflows/${caseItem.id}/assign-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not assign this case.');
      } else {
        const ids = new Set((caseItem.tasks || [])
          .filter(taskIsOpen)
          .filter(t => scope === 'all_open' || (!t.assigned_to_email && !t.assigned_to_name))
          .map(t => t.id));
        setData(prev => prev ? {
          ...prev,
          cases: (prev.cases || []).map(item => item.id === caseItem.id ? {
            ...item,
            tasks: (item.tasks || []).map(t => ids.has(t.id) ? { ...t, assigned_to_name: payload.name || payload.email, assigned_to_email: payload.email, recipient: payload.email, last_actor: payload.actor, last_action_at: new Date().toISOString() } : t),
            partnerTasks: (item.partnerTasks || []).map(t => ids.has(t.id) ? { ...t, assigned_to_name: payload.name || payload.email, assigned_to_email: payload.email, recipient: payload.email, last_actor: payload.actor, last_action_at: new Date().toISOString() } : t),
          } : item),
        } : prev);
        setNotice(json.confirmation || 'Case steps assigned. Staff can now work from their queue.');
        setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' });
        await load(await getFreshPartnerToken());
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
      setNotice('Employee saved for this demo. Review the prepared invite below; demo mode will not send email.');
      setStaffDraft({ name: '', email: '', role: 'staff', locationScope: 'all', annualSalary: '', hourlyCost: '' });
      return;
    }
    setUpdating('partner_staff');
    setError('');
    setNotice('');
    try {
      const res = await partnerAuthedFetch('/api/partnerStaff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setNotice(json.confirmation || 'Employee saved. Review and send the Passage invite below.');
        setStaffDraft({ name: '', email: '', role: 'staff', locationScope: 'all', annualSalary: '', hourlyCost: '' });
        await load(token);
      }
    } finally {
      setUpdating('');
    }
  }

  async function sendStaffInvite(member = latestStaffInvite) {
    const email = String(member?.email || '').trim().toLowerCase();
    if (!email) {
      setError('Save an employee before sending the invite.');
      return;
    }
    if (demoMode || !token) {
      setNotice('Employee invite preview prepared. No message was sent.');
      return;
    }
    setUpdating(`staff_invite_${email}`);
    setError('');
    try {
      const res = await partnerAuthedFetch('/api/partnerStaffInvite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not send this employee invite.');
        return;
      }
      setNotice(json.skipped ? (json.message || 'Invite prepared, but email is not configured.') : `Invite sent to ${email}. They can open Passage and sign in with that email.`);
      setLatestStaffInvite({ ...member, inviteSent: !json.skipped, inviteUrl: json.inviteUrl || staffHandoffUrl(email) });
    } finally {
      setUpdating('');
    }
  }

  async function updateFuneralHomeInbound(request, action) {
    if (!request?.id) return;
    const nextStatus = action === 'accept' ? 'accepted' : action === 'convert' ? 'converted' : action === 'archive' ? 'archived' : 'declined';
    const localRequest = {
      ...request,
      status: nextStatus,
      accepted_at: action === 'accept' ? new Date().toISOString() : request.accepted_at,
      converted_at: action === 'convert' ? new Date().toISOString() : request.converted_at,
    };
    const applyLocal = (message) => {
      setData(prev => prev ? {
        ...prev,
        funeralHomeRequests: (prev.funeralHomeRequests || []).map(item => item.id === request.id ? localRequest : item),
      } : prev);
      setNotice(message);
    };

    if (demoMode || !token) {
      applyLocal(action === 'accept'
        ? 'Family request accepted into the funeral-home queue. No live message was sent.'
        : action === 'convert'
          ? 'Inbound marked converted for reporting.'
          : 'Inbound request updated.');
      return;
    }

    setUpdating(`fh_request_${request.id}_${action}`);
    setError('');
    setNotice('');
    try {
      const res = await partnerAuthedFetch('/api/funeralHomeRequests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not update this family request.');
        return;
      }
      const updatedRequest = json.request || localRequest;
      setData(prev => prev ? {
        ...prev,
        funeralHomeRequests: (prev.funeralHomeRequests || []).map(item => item.id === request.id ? { ...item, ...updatedRequest } : item),
      } : prev);
      setNotice(json.confirmation || (action === 'accept'
        ? 'Family request accepted. The family record is now ready to coordinate from the funeral-home case list.'
        : 'Family request updated.'));
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
      setNotice('Location saved. It is now available in staff scope, case setup, and reports.');
      setLocationDraft({ name: '', address: '', city: '', state: '', zip: '', country: '', placeId: '' });
      setShowLocationSetup(false);
      return;
    }
    setUpdating('partner_location');
    setError('');
    setNotice('');
    try {
      const res = await partnerAuthedFetch('/api/partnerLocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setNotice(json.confirmation || 'Location saved. It is now available in workspace setup and reporting.');
        setLocationDraft({ name: '', address: '', city: '', state: '', zip: '', country: '', placeId: '' });
        setShowLocationSetup(false);
      }
    } finally {
      setUpdating('');
    }
  }

  async function savePartnerBranding(event) {
    event?.preventDefault?.();
    if (demoMode || !token) {
      setData(prev => prev ? {
        ...prev,
        organizations: (prev.organizations || []).map((membership, index) => index === 0 ? {
          ...membership,
          organizations: {
            ...(membership.organizations || {}),
            name: brandingDraft.organizationName || membership.organizations?.name,
            from_name: brandingDraft.familyPortalName || brandingDraft.organizationName || membership.organizations?.from_name,
            family_portal_name: brandingDraft.familyPortalName || brandingDraft.organizationName || membership.organizations?.family_portal_name,
            support_email: brandingDraft.supportEmail || membership.organizations?.support_email,
            support_phone: brandingDraft.supportPhone || membership.organizations?.support_phone,
            logo_url: brandingDraft.logoUrl || membership.organizations?.logo_url,
            primary_color: brandingDraft.primaryColor || membership.organizations?.primary_color,
            white_label_enabled: brandingDraft.whiteLabelEnabled,
          },
        } : membership),
      } : prev);
      setNotice('Demo brand saved locally. In production this updates the family-facing funeral-home view.');
      return;
    }
    setUpdating('partner_branding');
    setError('');
    setNotice('');
    try {
      const res = await partnerAuthedFetch('/api/partnerBranding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandingDraft),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not save family-facing brand settings.');
        return;
      }
      setData(prev => prev ? {
        ...prev,
        organizations: (prev.organizations || []).map((membership, index) => index === 0 ? {
          ...membership,
          organizations: { ...(membership.organizations || {}), ...(json.organization || {}) },
        } : membership),
      } : prev);
      setNotice(json.confirmation || 'Family-facing brand saved.');
      await load(token);
    } finally {
      setUpdating('');
    }
  }

  function openPartnerWork(caseId, taskId = '') {
    if (!caseId) return;
    setShowPilotGuide(false);
    setShowTools(false);
    setStaffCaseContextOpen(true);
    setActivePartnerView('work');
    setSelectedLocation('all');
    setExpandedCaseId(caseId);
    setCaseDetailTabs(prev => ({ ...prev, [caseId]: taskId ? 'proof' : (prev[caseId] || 'family') }));
    setNotice(taskId ? 'Opening the recommended next step.' : (isDirectorRole ? 'Opening the full case context.' : 'Opening the scoped case context.'));
    const scrollToCase = () => {
      const panel = document.getElementById(taskId ? 'partner-action-workspace-' + caseId : 'partner-case-' + caseId);
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        window.setTimeout(() => window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' }), 80);
      } else {
        setNotice('Case steps are open. If the case is filtered out, switch to All locations.');
      }
    };
    window.setTimeout(scrollToCase, 80);
    window.setTimeout(scrollToCase, 260);
  }

  function openPartnerPane(view, targetId, message) {
    setShowPilotGuide(false);
    setShowTools(false);
    if (view !== 'work') setStaffCaseContextOpen(false);
    setActivePartnerView(view);
    if (message) setNotice(message);
    scrollPartnerDemoTarget(targetId);
  }

  function openPartnerManagement(message = 'Opening locations, employees, roles, and permissions.') {
    setShowPilotGuide(false);
    setShowTools(false);
    setStaffCaseContextOpen(false);
    setActivePartnerView('manage');
    if (message) setNotice(message);
    scrollPartnerDemoTarget('partner-management-section');
  }

  function moveDirectorFocus() {
    setShowPilotGuide(false);
    setShowTools(false);
    if (recommendedActionCase?.id) {
      openPartnerWork(recommendedActionCase.id, recommendedActionTask?.id || '');
      setNotice('Opening recommended next action: ' + recommendedNextAction.label + '.');
      return;
    }
    if (!cases.length) {
      openCasePanel('immediate');
      setNotice('Create the first case, then Passage will recommend the next move.');
      return;
    }
    if (!isDirectorRole) {
      openPartnerPane('staff', 'partner-staff-section', 'Opening your assigned work.');
      return;
    }
    if (nextDirectorStep.key === 'staff') {
      openPartnerPane('staff', 'partner-staff-section', 'Opening staff coverage so the next owner can be set.');
      return;
    }
    if (nextDirectorStep.key === 'report') {
      openPartnerPane('reports', 'partner-reports-section', 'Opening reports and export so proof can leave Passage cleanly.');
      return;
    }
    openPartnerPane('work', 'partner-today-section', 'Opening My Day for the recommended next action.');
  }

  function directorFocusButtonLabel() {
    if (recommendedActionCase?.id) return recommendedActionTask ? 'Open next action' : 'Open recommended case';
    if (!cases.length) return 'Create case';
    if (!isDirectorRole) return firstStaffTask ? 'Open my client step' : 'Open my work';
    if (nextDirectorStep.key === 'staff') return unassignedTaskCount ? 'Resolve coverage' : 'Open staff';
    if (nextDirectorStep.key === 'report') return 'Open reports';
    return 'Open next action';
  }

  function recommendedActionMessagePath() {
    const target = recommendedNextAction?.messageTo || {};
    const channel = String(recommendedNextAction?.channel || target.channel || '').replace(/_/g, ' ');
    const cleanChannel = channel ? channel.replace(/\b\w/g, char => char.toUpperCase()) : '';
    const recipient = target.name || target.email || target.phone || recommendedNextAction?.owner || '';
    if (!cleanChannel && !recipient) return '';
    return cleanChannel && recipient ? `${cleanChannel} to ${recipient}` : cleanChannel || recipient;
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
      setNotice('Opening locations, employees, permissions, and invite handoff.');
      scrollPartnerDemoTarget('partner-management-section');
      return;
    }

    if (clean === 'case') {
      setShowPilotGuide(false);
      setActivePartnerView('work');
      openCasePanel('immediate');
      setNotice('Opening case creation with only the known details required.');
      scrollPartnerDemoTarget('partner-case-form');
      return;
    }

    if (clean === 'dashboard') {
      setShowNewCase(false);
      setShowPilotGuide(false);
      setShowTools(false);
      setActivePartnerView('work');
      setNotice('Opening My Day: next case, waiting point, owner, proof, and draft.');
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
        setNotice('Create a case first, then Passage opens the next action.');
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
        setNotice('Opening communication, proof, and notifications for the selected case.');
        scrollPartnerDemoTarget('partner-coordination-spine-' + firstOpenCase.id);
      }
      return;
    }

    if (clean === 'export') {
      setShowNewCase(false);
      setShowPilotGuide(false);
      setActivePartnerView('reports');
      setShowTools(true);
      setNotice('Opening operating signals, CSV export, and proof.');
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
        summaryView ? 'passage-demo-case-summary.csv' : 'passage-demo-full-record.csv'
      );
      setNotice(`${summaryView ? 'Case summary' : 'Full record'} demo CSV downloaded locally. No Supabase, email, or production record was touched.`);
      return;
    }
    const res = await fetch('/api/partnerExport' + exportQuery(view), { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || 'Could not export funeral-home cases.');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = view === 'cases' ? 'passage-partner-case-summary.csv' : 'passage-partner-full-record.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function emailExport(view = 'spine') {
    if (!token) return;
    if (demoMode) {
      setNotice(`${view === 'cases' ? 'Case summary' : 'Full record'} demo email skipped. Use Download to show the CSV without sending email.`);
      return;
    }
    const updateKey = view === 'cases' ? 'email_case_export' : 'email_export';
    setUpdating(updateKey);
    setError('');
    setNotice('');
    const res = await fetch('/api/partnerExport' + exportQuery(view), { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ view, from: exportRange.from, to: exportRange.to }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setError(json.error || 'Could not email the CSV export.');
    else setNotice(`${view === 'cases' ? 'Case summary' : 'Full record'} CSV export sent to ${json.emailedTo || user?.email || 'your email'}.`);
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
      setCaseForm({ funeralHomeName: org?.name || '', caseType: 'immediate', personName: '', locationId: '', locationName: '', locationAddress: '', locationCity: '', locationState: '', locationZip: '', locationCountry: '', locationPlaceId: '', dateOfDeath: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '', caseReference: '', isPrepaid: false, totalCaseValue: '', prepaidAmount: '', pronouncementDate: '', releaseDate: '', arrangementDate: '', visitationDate: '', funeralDate: '', burialDate: '', shivaDate: '', receptionDate: '', obituaryDeadline: '' });
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
    setCaseForm({ funeralHomeName: org?.name || '', caseType: 'immediate', personName: '', locationId: '', locationName: '', locationAddress: '', locationCity: '', locationState: '', locationZip: '', locationCountry: '', locationPlaceId: '', dateOfDeath: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '', caseReference: '', isPrepaid: false, totalCaseValue: '', prepaidAmount: '', pronouncementDate: '', releaseDate: '', arrangementDate: '', visitationDate: '', funeralDate: '', burialDate: '', shivaDate: '', receptionDate: '', obituaryDeadline: '' });
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
      'Your first screen is My work: assigned client steps, service timing, who is waiting, and the proof field. You only need to move the work you own.',
      '',
      'When something is handled, waiting, or needs family input, record that update in Passage so the family record and director view stay aligned.',
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
  const partnerBrand = {
    organizationName: org?.name || '',
    familyPortalName: org?.family_portal_name || org?.from_name || org?.name || '',
    supportEmail: org?.support_email || '',
    supportPhone: org?.support_phone || '',
    logoUrl: org?.logo_url || '',
    primaryColor: org?.primary_color || C.sage,
    whiteLabelEnabled: org?.white_label_enabled !== false,
  };
  const cases = data?.cases || [];
  const isAdminDemo = !!data?.isPassageAdmin;
  const warmInbounds = data?.funeralHomeRequests || [];
  const openWarmInbounds = warmInbounds.filter(request => !['declined', 'archived', 'converted'].includes(String(request.status || '').toLowerCase()));
  const acceptedWarmInbounds = warmInbounds.filter(request => ['accepted', 'converted'].includes(String(request.status || '').toLowerCase()));
  const totalBlocked = cases.reduce((sum, item) => sum + (item.blockedTasks?.length || 0), 0);
  const totalWaiting = cases.reduce((sum, item) => sum + (item.tasks || []).filter(taskIsWaiting).length, 0);
  const totalHandled = cases.reduce((sum, item) => sum + (item.tasks || []).filter(taskIsClosed).length, 0);
  const totalCommunications = cases.reduce((sum, item) => sum + (item.communications?.length || 0), 0);
  const totalVendorRequests = cases.reduce((sum, item) => sum + (item.vendorRequests?.length || 0), 0);
  const vendorValue = (request) => Number(request?.final_value ?? (request?.final_value_cents != null ? Number(request.final_value_cents || 0) / 100 : request?.estimated_value) ?? 0);
  const totalCaseValue = cases.reduce((sum, item) => sum + caseValueNumber(item), 0);
  const prepaidCaseValue = cases.reduce((sum, item) => sum + prepaidValueNumber(item), 0);
  const totalVendorValue = cases.reduce((sum, item) => sum + (item.vendorRequests || []).reduce((inner, request) => inner + vendorValue(request), 0), 0);
  const funeralHomeShare = cases.reduce((sum, item) => sum + (item.vendorRequests || []).reduce((inner, request) => inner + Number(request.funeral_home_share_amount || 0), 0), 0);
  const assignmentsCoordinated = cases.reduce((sum, item) => sum + (item.tasks || []).filter(t => t.assigned_to_email || t.assigned_to_name || t.owner_name || t.participant_id).length, 0);
  const familyRequestsOpen = cases.reduce((sum, item) => sum + (item.waitingOnFamily?.filter?.(taskIsOpen)?.length || item.waitingOnFamily?.length || 0) + (item.tasks || []).filter(taskNeedsHelp).length, 0);
  const proofEventsLogged = cases.reduce((sum, item) => sum + (item.activity || []).filter(event => ['handled', 'completed', 'done', 'waiting', 'blocked', 'sent'].includes(String(event.status || '').toLowerCase())).length, 0);
  const callsAvoided = totalCommunications + assignmentsCoordinated + totalVendorRequests;
  const timeSavedMinutes = callsAvoided * 8;
  const timeSavedLabel = callsAvoided > 0 ? `${Math.max(1, Math.round(timeSavedMinutes / 60))} hr est.` : 'None yet';
  const reports = data?.reports || {};
  const partnerStaff = data?.staff || [];
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://www.thepassageapp.io';
  const activationStatus = data?.activationStatus || 'inactive';
  const partnerPlan = data?.partnerPlan || null;
  const locationSlots = data?.locationSlots || {
    planId: partnerPlan?.plan || 'partner_local',
    planLabel: partnerPlanDisplayName(partnerPlan?.name || partnerPlan?.plan, 'Single-location plan'),
    includedLocationSlots: partnerPlan?.includedLocationSlots || 1,
    usedLocationSlots: 0,
    remainingLocationSlots: 1,
    needsUpgradeForNextLocation: false,
    additionalLocationFeeCents: partnerPlan?.additionalLocationFeeCents || 9900,
  };
  const billingStatus = data?.billingStatus || (partnerPlan?.status === 'demo' ? 'demo' : 'not_configured');
  const partnerTrialExpired = user && data && activationStatus === 'trial_expired';

  useEffect(() => {
    if (!org) return;
    setBrandingDraft(prev => ({
      organizationName: prev.organizationName || org.name || '',
      familyPortalName: prev.familyPortalName || org.family_portal_name || org.from_name || org.name || '',
      supportEmail: prev.supportEmail || org.support_email || '',
      supportPhone: prev.supportPhone || org.support_phone || '',
      logoUrl: prev.logoUrl || org.logo_url || '',
      primaryColor: prev.primaryColor || org.primary_color || C.sage,
      whiteLabelEnabled: org.white_label_enabled !== false,
    }));
  }, [org?.id]);

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
    if (taskIsClosed(task)) return '';
    if (taskNeedsHelp(task)) return 'Needs help: decision or owner';
    if (taskIsWaiting(task) && age >= 24) return 'At risk: no response in 24h';
    if (/obituary|service|flowers|transport|cemetery|permit|pronouncement/.test(title) && ['draft', 'acknowledged', 'waiting', 'pending'].includes(status)) return 'At risk near service work';
    if ((caseItem?.vendorRequests || []).some(request => !['completed', 'declined'].includes(String(request.status || '').toLowerCase()) && riskAgeHours(request.requested_at) >= 24)) return 'At risk: vendor response overdue';
    return '';
  }
  const glanceItems = [
    ['Active cases', cases.length],
    ['Work handled by Passage', totalHandled],
    ['Waiting for response', totalWaiting],
    ['Needs help', totalBlocked],
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

  function locationPatchForCaseForm(location = {}) {
    return {
      locationId: location.id || '',
      locationName: location.name || location.location_name || 'Main location',
      locationAddress: location.address || location.location_address || '',
      locationCity: location.city || '',
      locationState: location.state || '',
      locationZip: location.zip || location.postal_code || '',
      locationCountry: location.country || '',
      locationPlaceId: location.placeId || location.place_id || '',
    };
  }

  function openCasePanel(caseType = 'immediate') {
    const normalizedCaseType = caseType === 'prepaid' ? 'preneed' : caseType;
    const defaultLocation = caseLocationOptions[0] || {};
    setCaseForm(prev => ({
      ...prev,
      caseType: normalizedCaseType,
      funeralHomeName: prev.funeralHomeName || org?.name || '',
      isPrepaid: caseType === 'prepaid' ? true : prev.isPrepaid,
      ...(!prev.locationName && !prev.locationAddress ? locationPatchForCaseForm(defaultLocation) : {}),
    }));
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
  const planSupportsMultipleLocations = Number(locationSlots.includedLocationSlots || 1) > 1
    || /group|multi/i.test(String(locationSlots.planId || '') + ' ' + String(locationSlots.planLabel || '') + ' ' + String(partnerPlan?.plan || ''));
  const isMultiLocation = locations.length > 1 || planSupportsMultipleLocations;
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
  const vendorQuoteItems = caseOrchestrationRows.flatMap(({ caseItem }) => {
    const requests = caseItem.vendorRequests || caseItem.vendor_requests || [];
    return requests.map(request => ({
      request,
      caseItem,
      locationName: locationNameFor(caseItem),
    }));
  }).filter(({ request }) => {
    const status = String(request.status || '').toLowerCase();
    const payment = String(request.payment_collection_status || '').toLowerCase();
    return ['accepted', 'quoted', 'family_accepted', 'payment_pending'].includes(status) && payment !== 'paid';
  }).slice(0, 5);
  const vendorQuoteInbox = vendorQuoteItems.map(({ request, caseItem, locationName }) => {
    const amount = Number(request.final_value || request.estimated_value || request.gross_amount || 0);
    const title = request.task_title || request.title || 'Vendor quote';
    const amountText = amount > 0 ? `$${Math.round(amount)} ` : '';
    return {
      id: `vendor_${request.id}`,
      caseId: caseItem.id,
      caseName: caseItem.deceased_name || caseItem.estate_name || caseItem.name || 'Family case',
      locationName,
      status: 'needs_review',
      attentionLevel: 'urgent',
      attentionLabel: 'Quote review',
      title: `${title} quote needs review`,
      detail: `${amountText}${request.vendors?.business_name || 'Vendor'} quote is ready. Approve and pay, or choose another option before work begins.`,
      expectedUpdate: 'Open the case to review the quote, payment, and next step.',
    };
  });
  const spineAttentionItems = caseOrchestrationRows.flatMap(({ caseItem }) => {
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
  });
  const spineInbox = vendorQuoteInbox.concat(spineAttentionItems).slice(0, 6);
  const currentMembership = (partnerStaff || []).find(member => String(member.email || '').toLowerCase() === String(user?.email || '').toLowerCase()) || null;
  const allPartnerLocationOptions = savedPartnerLocations
    .map(location => ({
      id: location.id || '',
      name: location.name || location.location_name || 'Main location',
      address: location.address || location.location_address || '',
      city: location.city || '',
      state: location.state || '',
      zip: location.zip || location.postal_code || '',
      country: location.country || '',
      placeId: location.place_id || location.placeId || '',
    }))
    .filter(location => location.name);
  const currentLocationScope = String(currentMembership?.location_scope || currentMembership?.locationScope || 'all').trim();
  const scopedPartnerLocationOptions = currentLocationScope && currentLocationScope !== 'all'
    ? allPartnerLocationOptions.filter(location => String(location.name || '').toLowerCase() === currentLocationScope.toLowerCase() || String(location.id || '') === currentLocationScope)
    : allPartnerLocationOptions;
  const caseLocationOptions = scopedPartnerLocationOptions.length
    ? scopedPartnerLocationOptions
    : (locations.length ? locations.map(name => ({ id: '', name, address: '', city: '', state: '', zip: '', country: '', placeId: '' })) : [{ id: '', name: 'Main location', address: '', city: '', state: '', zip: '', country: '', placeId: '' }]);
  const currentRole = String(currentMembership?.role || data?.organizations?.[0]?.role || 'staff').toLowerCase();
  const isDirectorRole = /owner|admin|director|manager|location/i.test(currentRole);
  const currentScopeLabel = currentLocationScope && currentLocationScope !== 'all' ? currentLocationScope : 'All locations';
  const currentUserEmail = String(user?.email || '').toLowerCase();
  const allPartnerTasks = displayCases.flatMap(item => (item.tasks || []).map(task => ({
    ...task,
    caseName: item.deceased_name || item.estate_name || item.name || 'Family case',
    caseId: item.id,
    locationName: locationNameFor(item),
    importance: taskImportance(task, { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, deathDate: item.date_of_death, serviceEvents: item.serviceEvents || item.service_events || [], surface: 'staff work' }),
  })));
  const openTasksForCase = (item) => (item.tasks || []).filter(taskIsOpen);
  const unassignedTasksForCase = (item) => openTasksForCase(item).filter(task => !task.assigned_to_email && !task.assigned_to_name && !task.owner_name && !task.participant_id);
  const unassignedCaseRows = displayCases
    .map(item => ({ caseItem: item, unassignedTasks: unassignedTasksForCase(item), openTasks: openTasksForCase(item) }))
    .filter(row => row.openTasks.length > 0 && row.unassignedTasks.length > 0);
  const unassignedCaseCount = unassignedCaseRows.length;
  const unassignedTaskCount = unassignedCaseRows.reduce((sum, row) => sum + row.unassignedTasks.length, 0);
  const assignedWorkQueue = allPartnerTasks
    .filter(taskIsOpen)
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
  const unassignedStaffTasks = allPartnerTasks.filter(task => !task.assigned_to_email && taskIsOpen(task));
  const staffWorkloads = staffRoster.map(member => {
    const rows = allPartnerTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === member.email);
    const openRows = rows.filter(taskIsOpen);
    const waitingRows = openRows.filter(taskIsWaiting);
    const blockedRows = openRows.filter(taskNeedsHelp);
    const handledRows = rows.filter(taskIsClosed);
    const nextTask = openRows.sort((a, b) => (a.importance?.rank ?? 9) - (b.importance?.rank ?? 9) || partnerTaskPriorityFromStatus(a.status) - partnerTaskPriorityFromStatus(b.status))[0] || null;
    return { ...member, open: openRows.length, waiting: waitingRows.length, blocked: blockedRows.length, handled: handledRows.length, nextTask };
  }).concat(unassignedStaffTasks.length ? [{
    email: '',
    label: 'Unassigned work',
    role: 'needs owner',
    scope: 'director_attention',
    open: unassignedStaffTasks.length,
    waiting: unassignedStaffTasks.filter(taskIsWaiting).length,
    blocked: unassignedStaffTasks.filter(taskNeedsHelp).length,
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
  const reportHandledTasks = reportScopedTasks.filter(taskIsClosed);
  const reportWaitingTasks = reportScopedTasks.filter(taskIsWaiting);
  const reportBlockedTasks = reportScopedTasks.filter(taskNeedsHelp);
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
    const handled = tasks.filter(taskIsClosed).length;
    const waiting = tasks.filter(taskIsWaiting).length;
    const blocked = tasks.filter(taskNeedsHelp).length;
    const messages = reportScopedMessages.filter(message => message.locationName === location).length;
    const value = rows.reduce((sum, item) => sum + caseValueNumber(item), 0);
    return [location, rows.length, moneyDisplay(value), rows.length ? moneyDisplay(value / rows.length) : '$0', tasks.length, handled, waiting + blocked, messages + tasks.filter(task => task.assigned_to_email || task.assigned_to_name).length];
  }).filter(row => row[1] || row[2]);
  const reportEmployeeRows = (reportStaff === 'all' ? staffRoster : staffRoster.filter(member => member.email === reportStaff)).map(member => {
    const tasks = reportScopedTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === member.email);
    const hourly = hourlyCostForEmail(member.email);
    const handled = tasks.filter(taskIsClosed);
    const cost = handled.reduce((sum, task) => sum + taskCostEstimate(task), 0);
    return [
      member.label || member.email,
      roleLabel(member.role),
      hourly ? moneyDisplay(hourly) + '/hr' : 'Not set',
      tasks.length,
      handled.length,
      cost ? moneyDisplay(cost) : '$0',
      handled.length && cost ? moneyDisplay(cost / handled.length) : '$0',
      tasks.filter(taskIsWaiting).length,
      tasks.filter(taskNeedsHelp).length,
    ];
  }).filter(row => row[2] || reportStaff !== 'all');
  if ((reportStaff === 'all' || reportStaff === 'unassigned') && reportScopedTasks.some(task => !task.assigned_to_email && !task.assigned_to_name)) {
    const tasks = reportScopedTasks.filter(task => !task.assigned_to_email && !task.assigned_to_name);
    reportEmployeeRows.push(['Unassigned', 'Needs owner', 'Not set', tasks.length, 0, '$0', '$0', tasks.filter(taskIsWaiting).length, tasks.filter(taskNeedsHelp).length]);
  }
  const reportTaskSummaryRows = Array.from(reportScopedTasks.reduce((map, task) => {
    const title = sharedTaskTitle(task);
    const row = map.get(title) || { title, total: 0, handled: 0, waiting: 0, blocked: 0 };
    row.total += 1;
    if (taskIsClosed(task)) row.handled += 1;
    if (taskIsWaiting(task)) row.waiting += 1;
    if (taskNeedsHelp(task)) row.blocked += 1;
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
      tasks.filter(taskIsClosed).length,
      tasks.filter(taskIsWaiting).length,
      tasks.filter(taskNeedsHelp).length,
    ];
  }).filter(row => row[2] || reportRange === 'all').slice(0, 18);
  const focusedDisplayCases = showAllCases
    ? displayCases
    : (expandedCaseId ? displayCases.filter(item => item.id === expandedCaseId) : displayCases.slice(0, 1));
  const roleCards = [
    ['Director / admin', 'All cases, locations, staff queues, reports, billing prompts.', isDirectorRole ? 'Your current view' : 'Managed by leadership'],
    ['Location manager', 'Location-scoped cases, staff queues, waiting items, exports.', /location|manager/i.test(currentRole) ? 'Your current view' : 'Next permission layer'],
    ['Staff / employee', 'Assigned work first, with case context, family messages, proof, and audit trail.', !isDirectorRole ? 'Your current view' : 'Delegation target'],
  ];
  const firstCase = displayCases[0] || cases[0] || null;
  const firstOpenCase = caseInbox[0]?.caseItem || firstCase;
  const recommendedActionCase = (firstStaffTask?.caseId ? displayCases.find(item => item.id === firstStaffTask.caseId) : null) || firstOpenCase;
  const recommendedActionTask = firstStaffTask || (recommendedActionCase ? itemNextPartnerTask(recommendedActionCase, orchestrationByCaseId.get(recommendedActionCase.id)) : null);
  const recommendedNextAction = recommendedFuneralHomeNextAction({
    caseItem: recommendedActionCase,
    task: recommendedActionTask,
    role: isDirectorRole ? 'director' : 'staff',
    hasCases: cases.length > 0,
  });
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
      proof: proofEventsLogged ? `${proofEventsLogged} proof/status event${proofEventsLogged === 1 ? '' : 's'}` : totalHandled ? `${totalHandled} handled client step${totalHandled === 1 ? '' : 's'}` : 'No proof saved yet',
      done: proofEventsLogged > 0 || totalHandled > 0,
      waiting: totalWaiting > 0,
      next: totalHandled || proofEventsLogged ? 'Family and staff see the same status truth.' : 'Record what was done, what is waiting, or where help is needed.',
    },
    {
      key: 'local',
      label: 'Local support',
      proof: totalVendorRequests ? `${totalVendorRequests} case-linked request${totalVendorRequests === 1 ? '' : 's'}` : 'No local support needed',
      done: totalVendorRequests > 0,
      waiting: totalVendorRequests > 0,
      next: totalVendorRequests ? 'Vendor status stays connected to the case.' : 'Offer trusted help only inside relevant tasks.',
    },
    {
      key: 'report',
      label: 'Proof and export',
      proof: callsAvoided ? `${callsAvoided} call${callsAvoided === 1 ? '' : 's'} avoided estimate` : 'Operating signals start after work is logged',
      done: callsAvoided > 0,
      waiting: false,
      next: callsAvoided ? 'Export a record for your existing system.' : 'Move work through Passage to produce the export.',
    },
  ];
  const nextDirectorStep = directorLoopSteps.find(step => !step.done || step.waiting) || directorLoopSteps[directorLoopSteps.length - 1];
  const proofGapCount = cases.reduce((sum, item) => sum + (item.tasks || []).filter(task => taskIsClosed(task) && !String(task.notes || task.waiting_on || task.last_actor || '').trim()).length, 0);
  const operatingRealityItems = isDirectorRole
    ? [
      {
        label: 'Calls avoided',
        value: callsAvoided,
        tone: callsAvoided ? 'good' : 'neutral',
        body: callsAvoided ? 'Updates, assignments, and requests are captured instead of repeated by phone.' : 'Move one update or assignment through Passage to create the first visible save.',
      },
      {
        label: 'Family waits',
        value: familyRequestsOpen,
        tone: familyRequestsOpen ? 'warn' : 'good',
        body: familyRequestsOpen ? 'These are the items most likely to become repeated family calls.' : 'No family-owned wait is open right now.',
      },
      {
        label: 'Needs help',
        value: totalBlocked || riskItems.length,
        tone: totalBlocked || riskItems.length ? 'risk' : 'good',
        body: totalBlocked || riskItems.length ? 'Clear these stuck points before the director promises an update.' : 'No client steps need help in the front queue.',
      },
      {
        label: 'Proof gaps',
        value: proofGapCount,
        tone: proofGapCount ? 'warn' : 'good',
        body: proofGapCount ? 'Handled client steps needs a note, reference, actor, or timestamp.' : 'Handled client steps has enough visible proof for the family record.',
      },
    ]
    : [
      {
        label: 'My next task',
        value: firstStaffTask ? '1' : '0',
        tone: firstStaffTask ? 'warn' : 'good',
        body: firstStaffTask ? sharedTaskTitle(firstStaffTask) : 'No assigned work is waiting for you.',
      },
      {
        label: 'Waiting detail',
        value: firstStaffTask?.waiting_on ? 'Saved' : firstStaffTask ? 'Needed' : 'Clear',
        tone: firstStaffTask && !firstStaffTask.waiting_on ? 'warn' : 'good',
        body: firstStaffTask?.waiting_on || 'When work waits, name who or what it is waiting on.',
      },
      {
        label: 'Where proof saves',
        value: firstStaffTask ? 'Visible' : 'Clear',
        tone: firstStaffTask ? 'neutral' : 'good',
        body: firstStaffTask ? 'Record proof, a stuck point, or a waiting point before leaving the client step.' : 'New assignments will show the proof requirement here.',
      },
    ];
  const directorUseCases = [
    ['Delegate', assignmentsCoordinated || assignedWorkQueue.length, 'assigned staff or helper steps'],
    ['Reduce calls', callsAvoided, 'updates, assignments, and requests captured'],
    ['Ask family', familyRequestsOpen || totalCommunications, 'family inputs routed through the case'],
    ['Resolve for family', totalHandled, 'client steps closed with visible proof'],
    ['Coordinate support', totalVendorRequests, 'vendor requests without a directory'],
  ];
  const pilotFirstDayRows = [
    ['1', 'Create/open case', cases.length ? `${cases.length} active` : 'Start here'],
    ['2', 'Move one client step', firstOpenCase ? sharedTaskTitle(itemNextPartnerTask(firstOpenCase, orchestrationByCaseId.get(firstOpenCase.id)) || {}) : 'No case yet'],
    ['3', 'Ask or assign', assignmentsCoordinated ? `${assignmentsCoordinated} assigned` : familyRequestsOpen ? `${familyRequestsOpen} family request${familyRequestsOpen === 1 ? '' : 's'}` : 'Choose owner'],
    ['4', 'Export proof', callsAvoided ? `${callsAvoided} calls avoided` : 'After proof is saved'],
  ];
  const partnerSetupRows = [
    ['Cases', cases.length ? `${cases.length} active` : 'Create/import first case', cases.length > 0],
    ['Locations', locations.length > 1 ? `${locations.length} from case data` : 'Main location until imports add scope', locations.length > 0],
    ['Employees', partnerStaff.length ? `${partnerStaff.length} saved` : 'Add assignable staff', partnerStaff.length > 0],
    ['Roles', roleLabel(currentRole), !!currentRole],
    ['Assignments', assignmentsCoordinated ? `${assignmentsCoordinated} next-step owner${assignmentsCoordinated === 1 ? '' : 's'}` : 'Use the owner dropdown', assignmentsCoordinated > 0],
    ['Local support', vendorPrefs.preferred?.length ? `${vendorPrefs.preferred.length} preferred` : 'Choose approved vendors', (vendorPrefs.preferred || []).length > 0],
  ];
  const pilotLaunchRows = [
    ['1', 'Workspace', org?.name ? `${org.name} is active` : 'Create funeral-home workspace', !!org?.name],
    ['2', 'Locations', isMultiLocation ? `${locations.length} visible` : 'Main location ready; CSV can add more', locations.length > 0],
    ['3', 'Employees', partnerStaff.length ? `${partnerStaff.length} assignable` : 'Add director, manager, staff', partnerStaff.length > 0],
    ['4', 'Cases', cases.length ? `${cases.length} case${cases.length === 1 ? '' : 's'} loaded` : 'Import CSV or create fresh', cases.length > 0],
    ['5', 'First owner', assignmentsCoordinated ? 'Assignment dropdown in use' : 'Assign the first next-step owner', assignmentsCoordinated > 0],
    ['6', 'Proof trail', proofEventsLogged || totalHandled ? 'Status/proof is visible' : 'Record waiting, proof, or request', proofEventsLogged > 0 || totalHandled > 0],
    ['7', 'Invite review', latestStaffInvite || partnerStaff.length ? 'Invite copy ready; nothing auto-sent' : 'Add staff before sending handoffs', latestStaffInvite || partnerStaff.length > 0],
    ['8', 'Billing setup', billingStatus === 'paid' || billingStatus === 'demo' || activationStatus === 'active_trial' ? (partnerPlan ? `${partnerPlanDisplayName(partnerPlan.name || partnerPlan.plan)} visible` : 'Guided rollout visible') : 'Set up after approval', billingStatus === 'paid' || billingStatus === 'demo' || activationStatus === 'active_trial'],
  ];
  const visiblePilotLaunchRows = isAdminDemo ? pilotLaunchRows : pilotLaunchRows.filter(row => !['Invite review', 'Billing setup'].includes(row[1]));
  const launchReadyCount = visiblePilotLaunchRows.filter(row => row[3]).length;
  const launchReadyLabel = `${launchReadyCount}/${visiblePilotLaunchRows.length} ready`;
  const notificationReadinessRows = [
    ['Email', 'Prepared, reviewed, delivered, and logged on the case record.', true],
    ['SMS', 'Text fallback remains visible until carrier registration is active.', false],
    ['Owner confirmation', assignmentsCoordinated ? 'Owner proof is already feeding the case record.' : 'Assign the first next-step owner to create visible proof.', assignmentsCoordinated > 0],
  ];
  const billingReadinessRows = [
    ['Plan', partnerPlanDisplayName(partnerPlan?.name || partnerPlan?.plan, activationStatus === 'active_trial' ? 'Guided rollout plan' : 'Setup pending')],
    ['Billing', billingStatus === 'paid' ? 'Paid' : billingStatus === 'demo' ? 'Demo' : billingStatus === 'stripe_pending' ? 'Stripe pending' : 'Set up after approval'],
    ['Seats tracked', `${activeEmployeeRows.length || partnerStaff.length} employee${(activeEmployeeRows.length || partnerStaff.length) === 1 ? '' : 's'}`],
    ['Private operating inputs', activeEmployeeRows.some(member => moneyNumber(member.hourlyCost) || moneyNumber(member.annualSalary)) ? 'Labor cost available' : 'Add salary/hourly cost for staffing efficiency'],
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
    ['funeral', 'Service coordination', 'arrangements and family logistics', 'Staff, family, vendors, and participants work from one case record.'],
    ['after', 'Aftercare', 'estate, remembrance, and continuity', 'Exports and status history keep the record useful after service.'],
  ].map(([key, label, body, value]) => {
    const count = cases.filter(item => partnerLifecycleKey(item) === key).length;
    return { key, label, body, value, count, active: count > 0 };
  });
  const partnerViewTabs = isDirectorRole
    ? [
      ['work', 'My Day', 'Next case and proof'],
      ['staff', 'Owner coverage', 'Owners and assignments'],
      ['inbounds', 'Family requests', openWarmInbounds.length ? String(openWarmInbounds.length) + ' open' : 'Family handoffs'],
      ['manage', 'Locations & access', 'Locations and permissions'],
      ['reports', 'Reports', 'Proof and export'],
    ]
    : [
      ['staff', 'My work', 'Assigned first'],
      ['work', 'Case context', 'Family record'],
    ];
  const headerUser = user?.id === publicDemoUser.id ? null : user;
  const guidedDemoSteps = [
    ['dashboard', '1', 'My Day', 'See waiting families, family requests, coverage, proof, and work that needs help from one queue.'],
    ['task', '2', 'Work action', 'Open the next case and show owner, waiting point, prepared message, proof, and family-visible status.'],
    ['chat', '3', 'Communication proof', 'Show how notes, family updates, and notifications stay attached to the case instead of living in inboxes.'],
    ['export', '4', 'Operating signals and export', 'Close with CSV/export proof: calls avoided, time saved, staff workload, and case export.'],
    ['team', '5', 'Locations and staff', 'Show the rollout path: locations, employee scope, invites, and plan limits.'],
  ];

  useEffect(() => {
    function handleDemoStep(event) {
      focusPartnerDemoStep(event.detail?.target || event.detail?.step);
    }
    window.addEventListener('passage-demo-step', handleDemoStep);
    return () => window.removeEventListener('passage-demo-step', handleDemoStep);
  }, [firstOpenCase?.id, data]);

  useEffect(() => {
    if (!demoMode || router.query.demoTour !== 'funeral-home') return;
    const step = typeof router.query.demoStep === 'string' ? router.query.demoStep : '';
    if (!step || loading) return;
    if (step === 'team') setActivePartnerView('manage');
    if (step === 'dashboard') setShowPilotGuide(false);
    if (step === 'export') {
      setShowPilotGuide(false);
      setShowTools(true);
    }
    focusPartnerDemoStep(step);
  }, [demoMode, router.query.demoTour, router.query.demoStep, loading, firstOpenCase?.id]);

  useEffect(() => {
    if (loading || !data || isDirectorRole || activePartnerView !== 'work' || staffCaseContextOpen) return;
    setActivePartnerView('staff');
  }, [loading, data, isDirectorRole, activePartnerView, staffCaseContextOpen]);

  useEffect(() => {
    if (loading || !data || isDirectorRole || activePartnerView !== 'reports') return;
    setActivePartnerView('staff');
    setShowTools(false);
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
    const stillOpen = task => task && taskIsOpen(task);
    return (stillOpen(item.nextPartnerTask) ? item.nextPartnerTask : null)
      || (stillOpen(orchestration?.nextTask) ? orchestration.nextTask : null)
      || (item.partnerTasks || []).find(taskIsOpen)
      || (item.tasks || []).find(taskIsOpen);
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
      <SiteHeader user={headerUser} onSignOut={headerUser ? signOut : null} />
      <section className="partner-dashboard-shell" data-demo-anchor="demo-page-primary">
        <div className="partner-dashboard-hero" style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10.5, color: C.sage, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 7 }}>Funeral-home dashboard</div>
            <h1 style={{ fontSize: 30, lineHeight: 1.08, margin: 0, fontWeight: 400 }}>{org?.name || 'Funeral-home sign-in'}</h1>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.45, maxWidth: 680, marginTop: 8 }}>{!user ? 'Sign in with your invited work email to open My Day, cases, staff queue, family updates, proof, and exports.' : needsFirstDaySetup ? 'First finish setup: confirm locations, add employees, and create or import the first case. My Day becomes useful after real work exists.' : 'Start with My Day, then open the case, client step, owner, proof, or report that needs attention.'}</p>
            {user && org && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 999, padding: '6px 10px', color: C.sage, fontSize: 12, fontWeight: 900 }}>
                Family-facing view: {partnerBrand.familyPortalName || org.name} + Passage
              </div>
            )}
            {user && org && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 999, padding: '6px 10px', color: C.mid, fontSize: 12, fontWeight: 900 }}>
                  Plan: {locationSlots.planLabel || partnerPlanDisplayName(partnerPlan?.name || partnerPlan?.plan, 'Single-location plan')}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', background: locationSlots.needsUpgradeForNextLocation ? C.amberFaint : C.sageFaint, border: `1px solid ${locationSlots.needsUpgradeForNextLocation ? C.amber + '44' : C.sage + '22'}`, borderRadius: 999, padding: '6px 10px', color: locationSlots.needsUpgradeForNextLocation ? C.amber : C.sage, fontSize: 12, fontWeight: 900 }}>
                  Locations: {locationSlots.usedLocationSlots ?? locations.length} of {locationSlots.includedLocationSlots || 1} included
                </span>
              </div>
            )}
          </div>
          <div className="partner-dashboard-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {user && isDirectorRole && <button onClick={() => openCasePanel('immediate')} style={{ border: 'none', borderRadius: 12, minHeight: 44, padding: '0 14px', background: C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>New at-need case</button>}
            {user && isDirectorRole && <button onClick={() => openCasePanel('preneed')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 12, minHeight: 44, padding: '0 14px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Pre-need</button>}
            {user && isDirectorRole && <button onClick={() => downloadExport('cases')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 12, minHeight: 44, padding: '0 14px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Export</button>}
            {user && isDirectorRole && <button onClick={() => setShowTools(v => !v)} style={{ border: `1px solid ${C.border}`, borderRadius: 12, minHeight: 44, padding: '0 14px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>{showTools ? 'Hide tools' : 'Tools'}</button>}
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
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 6 }}>Funeral-home dashboard</div>
              <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.25, marginBottom: 8 }}>
                {router.query.staff === '1' ? 'Staff sign-in opens assigned work.' : router.query.partner === '1' ? 'Director sign-in opens setup and My Day.' : 'What opens after sign-in'}
              </div>
              {router.query.partner === '1' && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px', color: C.mid, fontSize: 12.8, lineHeight: 1.45, marginBottom: 9 }}>
                  Sign in with the invited email. The first setup screen confirms your co-branded family view, locations, employees, and first cases.
                </div>
              )}
              {router.query.staff === '1' && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px', color: C.mid, fontSize: 12.8, lineHeight: 1.45, marginBottom: 9 }}>
                  Sign in with the email your director invited. Staff see assigned work first: what is due, what is waiting, and what proof closes the loop.
                </div>
              )}
              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  'Active cases with family progress and next steps',
                  'Staff queue showing who owns what',
                  'Co-branded family handoff with your funeral home and Passage',
                  'Proof and waiting states tied to the family record',
                  'CSV export back to your existing system',
                ].map(item => (
                  <div key={item} style={{ display: 'grid', gridTemplateColumns: '16px minmax(0,1fr)', gap: 7, color: C.mid, fontSize: 13.2, lineHeight: 1.45 }}>
                    <span style={{ color: C.sage, fontWeight: 900 }}>-&gt;</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
            <div style={{ fontSize: 28, lineHeight: 1.12, marginBottom: 8 }}>Sign in to your funeral-home dashboard.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Only staff connected to your funeral-home organization can view cases, staff assignments, proof, and exports.</p>
            {error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 12, padding: 11, color: C.rose, fontSize: 12.5, fontWeight: 800, lineHeight: 1.45, marginBottom: 10 }}>{error}</div>}
            <form onSubmit={signInWithPassword} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              <label style={{ display: 'grid', gap: 5, color: C.soft, fontSize: 10.5, letterSpacing: '.11em', textTransform: 'uppercase', fontWeight: 900 }}>
                Work email
                <input
                  value={partnerEmail}
                  onChange={event => setPartnerEmail(event.target.value)}
                  type="email"
                  placeholder="director@funeralhome.com"
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
                  placeholder="Workspace password"
                  autoComplete="current-password"
                  style={{ border: `1.5px solid ${C.border}`, borderRadius: 13, background: C.bg, padding: '12px 13px', color: C.ink, fontFamily: 'Georgia,serif', fontSize: 14 }}
                />
              </label>
              <button type="submit" disabled={signingIn} style={{ border: 'none', borderRadius: 13, padding: '13px 18px', background: signingIn ? C.border : C.sage, color: '#fff', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: signingIn ? 'wait' : 'pointer' }}>
                {signingIn ? 'Opening workspace...' : 'Open funeral-home dashboard'}
              </button>
            </form>
            <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: 12, color: C.mid, fontSize: 12.5, lineHeight: 1.55, marginBottom: 12 }}>
              Use the email and password Passage issued for your funeral-home organization. Google sign-in can be enabled when your domain is connected.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={signIn} style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 18px', background: C.card, color: C.ink, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
              <Link href="/login" style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 18px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, textDecoration: 'none' }}>All sign-in options</Link>
            </div>
          </div>
          </div>
        )}

        {user && loading && <div style={{ color: C.soft }}>Loading funeral-home cases...</div>}
        {user && error && <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}30`, borderRadius: 14, padding: 16, color: C.rose }}>{error}</div>}
        {user && notice && <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}30`, borderRadius: 14, padding: 16, color: C.sage, marginBottom: 10 }}>{notice}</div>}
        {user && !loading && data?.demoData && (
          <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 14, padding: 14, color: C.amber, marginBottom: 10, lineHeight: 1.45, fontWeight: 900 }}>
            {data.demoLabel || 'Sample data is loaded for this walkthrough. No email, SMS, or production record is changed by sample actions.'}
          </div>
        )}
        {user && !loading && data?.demoData && isDirectorRole && (
          <div style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 18, padding: 14, marginBottom: 12, boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>90-second funeral-home tour</div>
                <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.18, fontWeight: 900, marginTop: 4 }}>Demo the case loop without hunting.</div>
                <div style={{ color: C.mid, fontSize: 12.6, lineHeight: 1.45, marginTop: 4 }}>Use these stops in order: director floor, work action, communication proof, signals/export, then rollout setup.</div>
              </div>
              <button
                type="button"
                onClick={() => focusPartnerDemoStep('dashboard')}
                style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, minHeight: 40, padding: '0 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}
              >
                Start tour
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8, marginTop: 12 }}>
              {guidedDemoSteps.map(([step, number, label, body]) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => focusPartnerDemoStep(step)}
                  style={{ textAlign: 'left', border: `1px solid ${C.border}`, background: C.bg, borderRadius: 13, padding: '10px 11px', minHeight: 104, cursor: 'pointer', fontFamily: 'Georgia,serif' }}
                >
                  <span style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center', background: C.sageFaint, color: C.sage, fontSize: 11, fontWeight: 900, marginBottom: 7 }}>{number}</span>
                  <span style={{ display: 'block', color: C.ink, fontSize: 14.5, lineHeight: 1.18, fontWeight: 900 }}>{label}</span>
                  <span style={{ display: 'block', color: C.mid, fontSize: 11.8, lineHeight: 1.35, marginTop: 4 }}>{body}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {user && latestFamilyLink?.url && (
          <div style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 16, padding: 14, marginBottom: 14, boxShadow: '0 4px 18px rgba(0,0,0,.04)' }}>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Family handoff prepared</div>
            <div style={{ color: C.ink, fontSize: 17, fontWeight: 900, marginTop: 4 }}>Give the family this link when you are ready to invite them.</div>
            <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>This is the handoff: case created, family participant prepared, acceptance grants estate access, and future task proof stays on the case.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <input readOnly value={latestFamilyLink.url} style={{ minWidth: 0, border: `1px solid ${C.border}`, borderRadius: 11, background: C.bg, padding: '9px 10px', color: C.mid, fontFamily: 'Georgia,serif', fontSize: 12.5 }} />
              <button onClick={() => copyText(latestFamilyLink.url, 'Family handoff link copied.')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, padding: '10px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Copy link</button>
            </div>
          </div>
        )}
        {partnerTrialExpired && (
          <div style={{ background: C.roseFaint, border: `1px solid ${C.rose}33`, borderRadius: 14, padding: 16, color: C.rose, marginBottom: 12, lineHeight: 1.45 }}>
            This account trial has ended. Existing cases stay visible; ask Passage to reactivate billing before creating new cases.
          </div>
        )}

        {user && !loading && data && isDirectorRole && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 14, marginBottom: 12, boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 10 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Director focus</div>
                <div style={{ color: C.ink, fontSize: 21, lineHeight: 1.18, fontWeight: 900, marginTop: 4 }}>Start with the next case.</div>
                <div style={{ color: C.mid, fontSize: 12.6, lineHeight: 1.45, marginTop: 4 }}>My Day shows the next case, waiting point, owner, proof, and draft. Everything else is a support view.</div>
              </div>
              <button onClick={moveDirectorFocus} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, minHeight: 40, padding: '0 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                {directorFocusButtonLabel()}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 9 }}>
              {[
                {
                  label: 'My Day',
                  value: totalBlocked ? `${totalBlocked} needs help` : totalWaiting ? `${totalWaiting} waiting` : `${cases.length} active case${cases.length === 1 ? '' : 's'}`,
                  detail: nextDirectorStep?.next || 'Cases and next moves',
                  tone: totalBlocked ? C.rose : totalWaiting ? C.amber : C.sage,
                  bg: totalBlocked ? C.roseFaint : totalWaiting ? C.amberFaint : C.sageFaint,
                  action: () => setActivePartnerView('work'),
                },
                {
                  label: 'Unassigned work',
                  value: unassignedTaskCount ? `${unassignedTaskCount} unassigned` : 'All assigned',
                  detail: unassignedCaseCount ? String(unassignedCaseCount) + ' case' + (unassignedCaseCount === 1 ? '' : 's') + ' need an owner' : 'Every open client step has an owner',
                  tone: unassignedTaskCount ? C.amber : C.sage,
                  bg: unassignedTaskCount ? C.amberFaint : C.sageFaint,
                  action: () => unassignedCaseRows[0]?.caseItem?.id ? openPartnerWork(unassignedCaseRows[0].caseItem.id) : setActivePartnerView('staff'),
                },
                {
                  label: 'Family requests',
                  value: `${openWarmInbounds.length} open`,
                  detail: warmInbounds.length ? `${warmInbounds.length} total family request${warmInbounds.length === 1 ? '' : 's'}` : 'No family requests yet',
                  tone: openWarmInbounds.length ? C.amber : C.sage,
                  bg: openWarmInbounds.length ? C.amberFaint : C.sageFaint,
                  action: () => setActivePartnerView('inbounds'),
                },
                {
                  label: 'Staff',
                  value: `${activeEmployeeRows.length || partnerStaff.length} employee${(activeEmployeeRows.length || partnerStaff.length) === 1 ? '' : 's'}`,
                  detail: (activeEmployeeRows.length || partnerStaff.length)
                    ? `${staffWorkloads.filter(member => member.open > 0).length} with open assigned work`
                    : 'Set up employees before assigning client steps',
                  tone: C.sage,
                  bg: C.sageFaint,
                  action: () => (activeEmployeeRows.length || partnerStaff.length)
                    ? setActivePartnerView('staff')
                    : openPartnerManagement('Opening employee setup. Add the director first, then managers and staff.'),
                },
                {
                  label: 'Reports',
                  value: timeSavedLabel,
                  detail: String(callsAvoided) + ' calls avoided with exportable proof',
                  tone: C.sage,
                  bg: C.sageFaint,
                  action: () => setActivePartnerView('reports'),
                },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{ textAlign: 'left', border: `1px solid ${item.tone}33`, background: item.bg, borderRadius: 14, padding: '11px 12px', minHeight: 98, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                  <div style={{ color: item.tone, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{item.label}</div>
                  <div style={{ color: C.ink, fontSize: 19, lineHeight: 1.12, fontWeight: 900, marginTop: 5 }}>{item.value}</div>
                  <div style={{ color: C.mid, fontSize: 12.1, lineHeight: 1.35, marginTop: 5 }}>{item.detail}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {user && !loading && data && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '11px 12px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Funeral-home dashboard</div>
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
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>First-day setup</div>
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

        {user && !loading && data && (
          <div style={{ marginBottom: 10 }}>
            <SpineTrustStrip
              compact
              eyebrow="Operating boundary"
              title="Know what staff can do, what families see, and what stays exportable."
              rows={[
                ['Family sees', 'Status, approved updates, waiting points, and proof.'],
                ['Staff sees', 'Assigned client steps, owner, next action, and proof requirement.'],
                ['Export keeps', 'Client steps, dates, owners, messages, vendor status, and proof trail.'],
              ]}
            />
          </div>
        )}

        {user && !loading && data && isDirectorRole && needsFirstDaySetup && !showPilotGuide && (
          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 16, padding: 14, marginBottom: 12, boxShadow: '0 8px 26px rgba(55,45,35,.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900 }}>Director onboarding</div>
              <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.2, fontWeight: 900, marginTop: 3 }}>Finish setup before My Day becomes useful.</div>
              <div style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.5, marginTop: 4 }}>Confirm the workspace, add at least one location, add employees, then create or import the first case. After that, My Day becomes the daily operating view.</div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPilotGuide(true)} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Open guide</button>
              <button onClick={() => openPartnerManagement('Opening locations, employees, roles, and permissions.')} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Set up locations and employees</button>
              <button onClick={() => openCasePanel('immediate')} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Create first case</button>
            </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 8, marginTop: 12 }}>
              {visiblePilotLaunchRows.map(([n, title, body, done]) => (
                <button key={title} onClick={() => {
                  if (title === 'Locations' || title === 'Employees') openPartnerManagement('Opening locations, employees, roles, and permissions.');
                  else if (title === 'Cases') openCasePanel('immediate');
                  else if (title === 'Workspace') setShowPilotGuide(true);
                  else setShowPilotGuide(true);
                }} style={{ textAlign: 'left', background: done ? C.card : C.bg, border: `1px solid ${done ? C.sage + '33' : C.border}`, borderRadius: 12, padding: '10px 11px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center', background: done ? C.sage : C.card, color: done ? '#fff' : C.soft, fontSize: 11, fontWeight: 900, marginRight: 7 }}>{n}</span>
                  <span style={{ color: C.ink, fontSize: 13.2, fontWeight: 900 }}>{title}</span>
                  <span style={{ display: 'block', color: C.mid, fontSize: 12, lineHeight: 1.35, marginTop: 5 }}>{body}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {false && user && !loading && data && isDirectorRole && showPilotGuide && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 12, boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>First-day setup</div>
                <div style={{ color: C.ink, fontSize: 24, lineHeight: 1.16, marginTop: 4 }}>Set up the workspace, then load cases one of two ways.</div>
                <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.5, marginTop: 5 }}>After setup, every case reuses the same locations, saved employees, roles, family contacts, and preferred local support. Nobody should retype the same owner list case by case.</div>
              </div>
              <div style={{ color: C.soft, fontSize: 11.5, lineHeight: 1.4, maxWidth: 250 }}>Safe setup: imports preview first, invite messages are copied only, and no email or SMS is sent automatically.</div>
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
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>First day</div>
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
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Readiness gates</div>
                <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
                  {pilotReadyGates.map(([label, done, value]) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 8, alignItems: 'center', background: done ? C.sageFaint : C.amberFaint, border: `1px solid ${done ? C.sage + '22' : C.amber + '33'}`, borderRadius: 11, padding: '8px 9px' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, background: done ? C.sage : C.amber, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 900 }}>{done ? 'OK' : '!'}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', color: C.ink, fontSize: 12.5, fontWeight: 900 }}>{label}</span>
                        <span style={{ display: 'block', color: C.mid, fontSize: 11.8, lineHeight: 1.35 }}>{value}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 10 }}>An account is ready to operate when the director can create or import a case, assign one owner, record proof, and export the record without Passage staff doing the work for them.</div>
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
              <button onClick={() => downloadExport('spine')} style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Download full record</button>
              <button onClick={() => emailExport('cases')} style={{ border: `1px solid ${C.border}`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.bg, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>{updating === 'email_case_export' ? 'Sending...' : 'Email case summary'}</button>
              <button onClick={() => startPartnerCheckout('partner_pilot')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 14, minHeight: 52, padding: '0 16px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{partnerPlan ? `Billing: ${partnerPlanDisplayName(partnerPlan.name || partnerPlan.plan)}` : 'Set up billing'}</button>
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
                  Required fields create the family case. Date fields feed the action plan so Passage can rank work around pronouncement, arrangement, service, burial, reception, and obituary timing.
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
                ['Export includes', 'Case summary CSV for existing systems plus full record CSV for client steps, owners, messages, vendor requests, proof requirements, and reporting fields where present.'],
                ['Rollout posture', "CSV bridge now. Direct adapters should be mapped after we see each home's actual Passare, Gather, SRS, Tribute, or local export shape."],
              ].map(([title, body]) => (
                <div key={title} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: '10px 11px' }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{title}</div>
                  <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 4 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && !loading && data && (
          <div id="partner-today-section" style={{ background: C.card, color: C.ink, border: `1px solid ${C.border}`, borderBottom: 'none', borderRadius: '18px 18px 0 0', padding: 14, marginBottom: 0, boxShadow: '0 4px 20px rgba(0,0,0,.04)', scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 9 }}>
              <div>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Today</span>
                  <span style={{ color: isDirectorRole ? C.sage : C.amber, background: isDirectorRole ? C.sageFaint : C.amberFaint, border: `1px solid ${isDirectorRole ? C.sage : C.amber}22`, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 900 }}>{roleLabel(currentRole)}</span>
                </div>
                <div style={{ color: C.mid, fontSize: 13, marginTop: 3 }}>{isDirectorRole ? 'All cases, staff queues, location scope, reports, and delegation.' : 'Assigned client steps first. Case context stays attached to each step.'}</div>
              </div>
              <button onClick={() => setShowDirectorHelp(true)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '8px 11px', fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>?</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {glanceItems.slice(0, 4).map(([label, value]) => (
                <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: '10px 12px', minHeight: 58 }} title={label === 'Estimated calls avoided' ? 'Based on messages sent and assignments coordinated through Passage.' : ''}>
                  <div style={{ color: C.sage, fontSize: 10.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: C.ink, fontSize: 22, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, background: isDirectorRole ? C.bg : C.sageFaint, border: `1px solid ${isDirectorRole ? C.border : C.sage + '22'}`, borderRadius: 13, padding: '11px 12px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Recommended next action</div>
                {recommendedNextAction.timingLabel && (
                  <div style={{ color: C.sage, fontSize: 11.4, lineHeight: 1.35, marginTop: 3, fontWeight: 900 }}>
                    {recommendedNextAction.timingLabel}
                  </div>
                )}
                <div style={{ color: C.ink, fontSize: 14.5, fontWeight: 900, lineHeight: 1.25, marginTop: 3 }}>
                  {recommendedNextAction.label}
                </div>
                <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 3 }}>
                  {recommendedNextAction.action}
                </div>
                <div style={{ color: C.soft, fontSize: 11.4, lineHeight: 1.35, marginTop: 5 }}>
                  {recommendedNextAction.context} | Owner: {recommendedNextAction.owner} | Proof: {recommendedNextAction.proof}
                </div>
              </div>
              <button onClick={moveDirectorFocus} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {directorFocusButtonLabel()}
              </button>
            </div>
            {recommendedNextAction.reason && (
              <div style={{ marginTop: 8, background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '9px 11px', display: 'grid', gap: 5 }}>
                <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.11em', textTransform: 'uppercase', fontWeight: 900 }}>Why now</div>
                <div style={{ color: C.ink, fontSize: 12.4, lineHeight: 1.4 }}>{recommendedNextAction.timingReason || recommendedNextAction.reason}</div>
                {recommendedNextAction.draft && <div style={{ color: C.mid, fontSize: 12.1, lineHeight: 1.4 }}><strong style={{ color: C.sage }}>Draft:</strong> {recommendedNextAction.draft}</div>}
                {(recommendedActionMessagePath() || recommendedNextAction.automation || recommendedNextAction.requiredProof) && (
                  <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 10, padding: '8px 9px', display: 'grid', gap: 4, color: C.mid, fontSize: 11.9, lineHeight: 1.35 }}>
                    {recommendedActionMessagePath() && <div><strong style={{ color: C.sage }}>Message path:</strong> {recommendedActionMessagePath()}</div>}
                    {recommendedNextAction.automation && <div><strong style={{ color: C.sage }}>Prepared action:</strong> {recommendedNextAction.automation}</div>}
                    {recommendedNextAction.requiredProof && <div><strong style={{ color: C.sage }}>Proof:</strong> {recommendedNextAction.requiredProof}</div>}
                  </div>
                )}
              </div>
            )}
            {isDirectorRole && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 7, marginTop: 9 }}>
                {[
                  ['Family waiting', () => firstOpenCase?.id && openPartnerWork(firstOpenCase.id)],
                  ['Assign owner', () => openPartnerPane('staff', 'partner-staff-section', 'Opening staff assignment.')],
                  ['Save proof', () => firstOpenCase?.id && openPartnerWork(firstOpenCase.id)],
                  ['Export case', () => downloadExport('cases')],
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
                    <div style={{ color: C.soft, fontSize: 10.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ color: C.ink, fontSize: 17, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {false && isDirectorRole && showPilotGuide && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                {pilotFirstDayRows.map(([n, label, value]) => (
                  <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px', display: 'grid', gridTemplateColumns: '24px minmax(0, 1fr)', gap: 8, alignItems: 'start' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.sageFaint, color: C.sage, fontSize: 11, fontWeight: 900 }}>{n}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', color: C.soft, fontSize: 10.5, letterSpacing: '.09em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</span>
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
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Workspace setup path</div>
                    <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 3 }}>Set up once, then reuse the same cases, locations, staff, roles, and vendors from every family-record work assignment.</div>
                  </div>
                  <div style={{ color: C.soft, fontSize: 11.5, fontWeight: 900 }}>Locations come from case/import data today.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 8, marginTop: 10 }}>
                  {partnerSetupRows.map(([label, value, done]) => (
                    <div key={label} style={{ background: done ? C.sageFaint : C.card, border: `1px solid ${done ? C.sage + '22' : C.border}`, borderRadius: 11, padding: '9px 10px', minHeight: 64 }}>
                      <div style={{ color: done ? C.sage : C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
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

        {user && !loading && data && activePartnerView === 'work' && (
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

        {user && !loading && data && activePartnerView === 'inbounds' && isDirectorRole && (
          <div id="partner-inbounds-section" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,.05)', scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 14 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Warm family requests</div>
                <div style={{ fontSize: 24, lineHeight: 1.15, marginTop: 3 }}>Review warm family handoffs before they become cases.</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5, maxWidth: 760 }}>
                  Requests start from the family record, not a cold directory. Accepting one brings the family context into your case record; nothing is sent outside Passage without review.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(90px, 1fr))', gap: 8, minWidth: 300 }}>
                {[
                  ['Open', openWarmInbounds.length],
                  ['Accepted', acceptedWarmInbounds.length],
                  ['Estimated value', moneyDisplay(warmInbounds.reduce((sum, request) => sum + Number(request.estimated_case_value || 0), 0))],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: '9px 10px' }}>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                    <div style={{ color: C.ink, fontSize: 18, fontWeight: 900, marginTop: 3 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {warmInbounds.length === 0 ? (
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ color: C.ink, fontSize: 17, fontWeight: 900 }}>No family requests yet.</div>
                <div style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.5, marginTop: 5 }}>
                  When a family chooses or requests this funeral home from a Passage record, the request appears here with urgency, permission, and the context your team needs to respond.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {warmInbounds.map(request => {
                  const status = String(request.status || 'requested').toLowerCase();
                  const active = !['declined', 'archived', 'converted'].includes(status);
                  const contactLine = [request.requested_by_name, request.requested_by_email, request.requested_by_phone].filter(Boolean).join(' | ');
                  const addressText = String(request.address || '');
                  const addressAlreadyScoped = addressText && [request.city, request.state, request.zip].filter(Boolean).some(part => addressText.toLowerCase().includes(String(part).toLowerCase()));
                  const placeLine = addressAlreadyScoped ? addressText : [request.address, request.city, request.state, request.zip].filter(Boolean).join(', ');
                  return (
                    <div key={request.id} style={{ background: active ? C.sageFaint : C.bg, border: `1px solid ${active ? C.sage + '33' : C.border}`, borderRadius: 15, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{request.urgency || 'normal'} request</div>
                          <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.2, fontWeight: 900, marginTop: 3 }}>{request.case_name || request.requested_provider_name || 'Family request'}</div>
                          <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>
                            {contactLine || 'Family contact not shared yet'}{placeLine ? ` | ${placeLine}` : ''}
                          </div>
                        </div>
                        <span style={{ background: status === 'accepted' || status === 'converted' ? C.sage : status === 'declined' ? C.rose : C.card, color: status === 'accepted' || status === 'converted' ? '#fff' : status === 'declined' ? '#fff' : C.mid, border: `1px solid ${status === 'accepted' || status === 'converted' ? C.sage : status === 'declined' ? C.rose : C.border}`, borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 900 }}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8, marginTop: 10 }}>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Permission</div>
                          <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 3 }}>{request.family_permission_to_contact ? 'Family approved contact through Passage.' : 'Review before contacting outside Passage.'}</div>
                        </div>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Source</div>
                          <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 3 }}>{String(request.source || 'family record').replace(/_/g, ' ')}</div>
                        </div>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Value</div>
                          <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.4, marginTop: 3 }}>{request.estimated_case_value ? moneyDisplay(request.estimated_case_value) : 'Add value once known'}</div>
                        </div>
                      </div>
                      {request.notes && (
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', color: C.mid, fontSize: 12.4, lineHeight: 1.45, marginTop: 8 }}>{request.notes}</div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <button disabled={updating === `fh_request_${request.id}_accept` || status === 'accepted'} onClick={() => updateFuneralHomeInbound(request, 'accept')} style={{ border: 'none', background: status === 'accepted' ? C.border : C.sage, color: '#fff', borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: status === 'accepted' ? 'default' : 'pointer' }}>{status === 'accepted' ? 'Accepted' : 'Accept into cases'}</button>
                        <button disabled={updating === `fh_request_${request.id}_decline`} onClick={() => updateFuneralHomeInbound(request, 'decline')} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Decline</button>
                        <button disabled={updating === `fh_request_${request.id}_convert`} onClick={() => updateFuneralHomeInbound(request, 'convert')} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Mark converted</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                <button onClick={() => setShowLocationSetup(true)} style={{ border: `1px solid ${locationSlots.needsUpgradeForNextLocation ? C.amber + '55' : C.sage + '33'}`, background: locationSlots.needsUpgradeForNextLocation ? C.amberFaint : C.sageFaint, color: locationSlots.needsUpgradeForNextLocation ? C.amber : C.sage, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{locationSlots.needsUpgradeForNextLocation ? 'Upgrade / add location' : 'Add location'}</button>
                <button onClick={() => setShowStaffSetup(true)} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Add employee</button>
              </div>
            </div>

            <form onSubmit={savePartnerBranding} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 15, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Co-branded family view</div>
                  <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.2, fontWeight: 900, marginTop: 3 }}>Families should recognize the funeral home while Passage carries the coordination.</div>
                  <div style={{ color: C.mid, fontSize: 12.4, lineHeight: 1.45, marginTop: 5 }}>These settings feed the partner header, family handoff language, employee invites, and Passage-branded packet context.</div>
                </div>
                <button type="submit" disabled={updating === 'partner_branding'} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: updating === 'partner_branding' ? 'wait' : 'pointer', opacity: updating === 'partner_branding' ? .65 : 1 }}>{updating === 'partner_branding' ? 'Saving...' : 'Save brand'}</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, .45fr)', gap: 12, alignItems: 'stretch' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 8 }}>
                  <input value={brandingDraft.organizationName} onChange={event => setBrandingDraft(prev => ({ ...prev, organizationName: event.target.value }))} placeholder="Funeral home legal/display name" style={inputStyle} />
                  <input value={brandingDraft.familyPortalName} onChange={event => setBrandingDraft(prev => ({ ...prev, familyPortalName: event.target.value }))} placeholder="Family-facing name" style={inputStyle} />
                  <input value={brandingDraft.supportEmail} onChange={event => setBrandingDraft(prev => ({ ...prev, supportEmail: event.target.value }))} placeholder="Support email families can recognize" style={inputStyle} />
                  <input value={brandingDraft.supportPhone} onChange={event => setBrandingDraft(prev => ({ ...prev, supportPhone: event.target.value }))} placeholder="Support phone" style={inputStyle} />
                  <input value={brandingDraft.logoUrl} onChange={event => setBrandingDraft(prev => ({ ...prev, logoUrl: event.target.value }))} placeholder="Logo URL (optional)" style={inputStyle} />
                  <input value={brandingDraft.primaryColor} onChange={event => setBrandingDraft(prev => ({ ...prev, primaryColor: event.target.value }))} placeholder="#6b8f71" style={inputStyle} />
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {brandingDraft.logoUrl ? <img src={brandingDraft.logoUrl} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'contain', border: `1px solid ${C.border}`, background: C.bg, padding: 5 }} /> : <div style={{ width: 42, height: 42, borderRadius: 10, display: 'grid', placeItems: 'center', background: C.sageFaint, color: C.sage, border: `1px solid ${C.sage}22`, fontWeight: 900 }}>P</div>}
                    <div>
                      <div style={{ color: C.ink, fontSize: 15.5, fontWeight: 900 }}>{brandingDraft.familyPortalName || brandingDraft.organizationName || org?.name || 'Your funeral home'}</div>
                      <div style={{ color: C.mid, fontSize: 12.2, marginTop: 2 }}>Coordinated with Passage</div>
                    </div>
                  </div>
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', marginTop: 10, color: C.mid, fontSize: 12.2, lineHeight: 1.4 }}>
                    Family-safe preview: next task, owner, waiting point, proof, and contact details stay in one record.
                  </div>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.mid, fontSize: 12.2, marginTop: 9 }}>
                    <input type="checkbox" checked={brandingDraft.whiteLabelEnabled} onChange={event => setBrandingDraft(prev => ({ ...prev, whiteLabelEnabled: event.target.checked }))} />
                    Show funeral-home name beside Passage
                  </label>
                </div>
              </div>
            </form>

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
                      <div style={{ color: done ? C.sage : C.amber, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{title}</div>
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
                    <button onClick={() => setShowLocationSetup(true)} style={{ border: `1px solid ${locationSlots.needsUpgradeForNextLocation ? C.amber + '55' : C.sage + '33'}`, background: C.card, color: locationSlots.needsUpgradeForNextLocation ? C.amber : C.sage, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{locationSlots.needsUpgradeForNextLocation ? 'Upgrade' : 'New location'}</button>
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${locationSlots.needsUpgradeForNextLocation ? C.amber + '44' : C.border}`, borderRadius: 11, padding: '9px 10px', marginTop: 10, color: C.mid, fontSize: 12.3, lineHeight: 1.45 }}>
                    <strong style={{ color: locationSlots.needsUpgradeForNextLocation ? C.amber : C.sage }}>{locationSlots.planLabel || 'Location slots'}:</strong> {managedLocationRows.length} of {locationSlots.includedLocationSlots || 1} included location slot{Number(locationSlots.includedLocationSlots || 1) === 1 ? '' : 's'} used. {locationSlots.needsUpgradeForNextLocation ? `Add a paid location slot (${moneyDisplay((locationSlots.additionalLocationFeeCents || 9900) / 100)}/mo) or move this partner to multi-location before adding another branch.` : 'Additional branches will trigger the upgrade path before they can be saved.'}
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
                        <div><div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Cases</div><div style={{ color: C.ink, fontWeight: 900 }}>{location.cases}</div></div>
                        <div><div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Staff</div><div style={{ color: C.ink, fontWeight: 900 }}>{location.employees}</div></div>
                        <div><div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Value</div><div style={{ color: C.ink, fontWeight: 900 }}>{location.caseValue ? moneyDisplay(location.caseValue) : '$0'}</div></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 9 }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Employees</div>
                      <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>Saved employees become the owner list inside every case. Invites stay prepared until your team sends them.</div>
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
                          <div><div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Role</div><div style={{ color: C.ink, fontSize: 12.2, fontWeight: 900 }}>{roleLabel(member.role)}</div></div>
                          <div><div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Scope</div><div style={{ color: C.mid, fontSize: 12.2 }}>{member.locationScope === 'all' ? 'All locations' : member.locationScope || 'All locations'}</div></div>
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
                      ['Director / owner', 'All cases, all locations, staff setup, reports, exports, billing prompts, and setup controls.'],
                      ['Location manager', 'Cases and reporting for their location scope; can assign staff and move work.'],
                      ['Staff', 'Assigned client steps first; can mark waiting, request family info, record proof, and close client steps.'],
                      ['Participant / family helper', 'Scoped to the request or family-record slice they were invited to handle.'],
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
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Notification delivery</div>
                  <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 5 }}>Passage prepares the handoff, records proof, and keeps the fallback obvious. Your team reviews messages before they leave the workspace.</div>
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
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 }}>Save the employee, assign a role and location scope, then review and send their Passage invite. They will land on the staff workspace and authenticate with the same email.</div>
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
                  <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>Role controls starting view and permissions. Cost fields stay private to the director view and power staffing, task load, and location efficiency.</div>
                  {latestStaffInvite && (
                    <div style={{ marginTop: 10, background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 12, padding: 10 }}>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Review employee invite</div>
                      <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 4 }}>{latestStaffInvite.email} can now be assigned client steps. Send this Passage email so they can open the staff workspace and sign in with Google or email.</div>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: '9px 0 0', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, color: C.mid, fontFamily: 'Georgia,serif', fontSize: 11.7, lineHeight: 1.45, maxHeight: 160, overflowY: 'auto' }}>{staffInviteMessage(latestStaffInvite)}</pre>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
                        <button type="button" disabled={updating === `staff_invite_${latestStaffInvite.email}`} onClick={() => sendStaffInvite(latestStaffInvite)} style={{ border: 'none', background: updating === `staff_invite_${latestStaffInvite.email}` ? C.border : C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', fontSize: 11.5, fontWeight: 900, cursor: updating === `staff_invite_${latestStaffInvite.email}` ? 'wait' : 'pointer', fontFamily: 'Georgia,serif' }}>{updating === `staff_invite_${latestStaffInvite.email}` ? 'Sending...' : 'Send Passage invite'}</button>
                        <button type="button" onClick={() => copyText(staffInviteMessage(latestStaffInvite), 'Staff invite message copied.')} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '8px 10px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Copy instead</button>
                      </div>
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
                  {locationSlots.needsUpgradeForNextLocation && (
                    <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}44`, borderRadius: 13, padding: '11px 12px', color: C.mid, fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 }}>
                      <strong style={{ color: C.amber }}>Location slot needed.</strong> This {locationSlots.planLabel || 'single-location'} workspace already uses its included location slot. Upgrade to multi-location or add a paid location slot before saving another location.
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
                        <button type="button" onClick={() => startPartnerCheckout('partner_group')} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Upgrade to multi-location</button>
                        <button type="button" onClick={() => setShowLocationSetup(false)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Not now</button>
                      </div>
                    </div>
                  )}
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
                    <button disabled={updating === 'partner_location' || locationSlots.needsUpgradeForNextLocation} style={{ border: 'none', background: updating === 'partner_location' || locationSlots.needsUpgradeForNextLocation ? C.border : C.sage, color: '#fff', borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: updating === 'partner_location' || locationSlots.needsUpgradeForNextLocation ? 'not-allowed' : 'pointer' }}>{updating === 'partner_location' ? 'Saving...' : locationSlots.needsUpgradeForNextLocation ? 'Upgrade needed' : 'Save location'}</button>
                    <button type="button" onClick={() => setShowLocationSetup(false)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {user && !loading && data && activePartnerView === 'staff' && (
          <div id="partner-staff-section" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: isDirectorRole ? 18 : 16, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,.05)', scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{isDirectorRole ? 'Staff coverage' : 'My work today'}</div>
                <div style={{ fontSize: isDirectorRole ? 24 : 28, lineHeight: 1.12, marginTop: 3 }}>{isDirectorRole ? 'Assign the next owner, then get out of the way.' : 'Here is what needs your attention today.'}</div>
                {!isDirectorRole && (
                  <div style={{ color: C.mid, fontSize: 13, lineHeight: 1.45, marginTop: 6, maxWidth: 660 }}>
                    Work one request at a time. Each item includes the family case, what is waiting, and the proof that closes the loop.
                  </div>
                )}
              </div>
              {isDirectorRole && <button onClick={() => openPartnerManagement('Opening locations, employees, roles, and permissions.')} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Manage people</button>}
            </div>
            {!isDirectorRole && (
              <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 14, padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(180px,.55fr)', gap: 10, alignItems: 'end' }}>
                  <div>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Workspace</div>
                    <div style={{ color: C.ink, fontSize: 17, lineHeight: 1.2, fontWeight: 900, marginTop: 4 }}>{org?.name || 'Funeral home'} staff workspace</div>
                    <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.4, marginTop: 4 }}>Role: {roleLabel(currentRole)}. Location scope: {currentScopeLabel}. Directors control location access in Management.</div>
                  </div>
                  <label style={{ display: 'grid', gap: 4, color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>
                    Location view
                    <select
                      value={currentLocationScope && currentLocationScope !== 'all' ? currentLocationScope : selectedLocation}
                      onChange={event => setSelectedLocation(event.target.value)}
                      disabled={currentLocationScope && currentLocationScope !== 'all'}
                      style={{ ...inputStyle, background: currentLocationScope && currentLocationScope !== 'all' ? C.bg : C.card }}
                    >
                      {(!currentLocationScope || currentLocationScope === 'all') && <option value="all">All assigned locations</option>}
                      {(currentLocationScope && currentLocationScope !== 'all' ? [currentLocationScope] : locations).map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}
            {!isDirectorRole && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 145px), 1fr))', gap: 8, marginBottom: 12 }}>
                {[
                  ['Assigned to you', assignedWorkQueue.length],
                  ['Waiting', assignedWorkQueue.filter(taskIsWaiting).length],
                  ['Needs help', assignedWorkQueue.filter(taskNeedsHelp).length],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 12, padding: '10px 11px' }}>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                    <div style={{ color: C.ink, fontSize: 21, lineHeight: 1.1, marginTop: 4, fontWeight: 900 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
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
                      <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>This prepares access and assignment. Salary/hourly cost stays in the director-only operating view so directors can see staffing, task load, and location efficiency. It is never shown to families or participants.</div>
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
                    <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>Directors, location managers, and staff become the owner list inside every case.</div>
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
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Role</div>
                          <div style={{ color: C.ink, fontSize: 12.2, fontWeight: 900 }}>{roleLabel(member.role)}</div>
                        </div>
                        <div>
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Location</div>
                          <div style={{ color: C.mid, fontSize: 12.2 }}>{member.locationScope === 'all' ? 'All locations' : member.locationScope || 'All locations'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => { setStaffDraft({ name: member.label === member.email ? '' : member.label || '', email: member.email || '', role: member.role || 'staff', locationScope: member.locationScope || 'all', annualSalary: member.annualSalary || '', hourlyCost: member.hourlyCost || '' }); setShowStaffSetup(true); }} style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => { setLatestStaffInvite(member); setShowStaffSetup(true); }} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 9, padding: '7px 9px', fontSize: 11.5, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Invite</button>
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
                    ['Staff', 'Assigned client steps first; can mark waiting, request family info, record proof, and close client steps.'],
                    ['Admin', 'Account setup and billing prompts; use sparingly for owners.'],
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
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{isDirectorRole ? 'Delegation queue' : 'My assigned client steps'}</div>
                  <div style={{ fontSize: 18 }}>{isDirectorRole ? 'Next staff move' : 'Your next move'}</div>
                </div>
                <div style={{ color: C.mid, fontSize: 12.5 }}>Each client step shows the case, next action, owner, waiting point, proof, and status trail.</div>
              </div>
              {firstStaffTask && (() => {
                const output = taskOutputFor(firstStaffTask, { surface: 'staff client-step queue', caseName: firstStaffTask.caseName });
                const draft = taskRequestDraftFor(firstStaffTask, { surface: 'staff client-step queue', caseName: firstStaffTask.caseName });
                const proofDestination = taskProofDestination(firstStaffTask, { surface: 'staff client-step queue' });
                const packetText = taskPreparedPacketFor(firstStaffTask, { surface: 'staff client-step queue', caseName: firstStaffTask.caseName });
                return (
                <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12, marginBottom: 10 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900 }}>Action needed</div>
                  <div style={{ color: C.ink, fontSize: 18, fontWeight: 900, lineHeight: 1.22, marginTop: 4 }}>{sharedTaskTitle(firstStaffTask)}</div>
                  <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>
                    Case: {firstStaffTask.caseName} - Service/context: {firstStaffTask.locationName}. Status: {statusLabel(firstStaffTask.status)}.
                  </div>
                  <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 12, lineHeight: 1.4 }}>
                      <strong style={{ color: C.ink }}>Action needed:</strong> {taskGuidanceFor(firstStaffTask, { owner: firstStaffTask.assigned_to_name || firstStaffTask.assigned_to_email || 'staff', surface: 'staff client-step queue' }).nextStep || taskExpectedUpdate(firstStaffTask, 'funeral_home')}
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 12, lineHeight: 1.4 }}>
                      <strong style={{ color: C.ink }}>Message ready:</strong> {draft}
                    </div>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 12, lineHeight: 1.4 }}>
                      <strong style={{ color: C.ink }}>Proof/status:</strong> {proofDestination}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 7, marginTop: 9 }}>
                    <button onClick={() => { setTaskDraft({ task: firstStaffTask, status: 'handled', label: 'Done - save proof', prompt: 'Review or edit the Passage-prepared proof packet, then close this step so it no longer appears as waiting.', draft, output, proofDestination }); setTaskDraftNote(packetText); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Done - save proof</button>
                    <button onClick={() => { setTaskDraft({ task: firstStaffTask, status: 'waiting', label: 'Waiting update', prompt: taskActionPrompt('waiting', firstStaffTask, 'funeral_home'), draft, output, proofDestination }); setTaskDraftNote(`Waiting on ${firstStaffTask.playbook?.waitingOn || 'confirmation'} before ${sharedTaskTitle(firstStaffTask)} can move forward. Next update expected tomorrow morning.`); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Waiting - add update</button>
                    <button onClick={() => { setTaskDraft({ task: firstStaffTask, status: 'blocked', label: 'Request this from family', prompt: taskActionPrompt('blocked', firstStaffTask, 'funeral_home'), draft, output, proofDestination }); setTaskDraftNote(draft); }} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Ask family for info</button>
                  </div>
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 10px', color: C.mid, fontSize: 11.8, lineHeight: 1.4, marginTop: 9 }}><strong style={{ color: C.ink }}>Need director support?</strong> Mark waiting if something is blocked, request one family detail if that is the blocker, or open the case context before calling the family.</div>
                  <button onClick={() => openPartnerWork(firstStaffTask.caseId)} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '8px 10px', marginTop: 9, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>{isDirectorRole ? 'Open full case context' : 'Open case context'}</button>
                </div>
              );})()}
              {assignedWorkQueue.length === 0 ? (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, color: C.mid, fontSize: 13 }}>
                  No assigned client steps need your attention right now. New requests from your director will appear here with family context, the waiting point, and proof needed.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {staffQueuePreview.map(task => {
                    const blocked = taskNeedsHelp(task);
                    const waiting = taskIsWaiting(task);
                    const tone = blocked ? C.rose : waiting ? C.amber : C.sage;
                    const guidance = taskGuidanceFor(task, { owner: task.assigned_to_name || task.assigned_to_email || 'staff', surface: 'staff client-step queue' });
                    const proofDestination = taskProofDestination(task, { surface: 'staff client-step queue' });
                    const preparedOutput = taskOutputFor(task, { caseName: task.caseName, surface: 'staff client-step queue' });
                    const preparedDraft = taskRequestDraftFor(task, { caseName: task.caseName, coordinatorName: task.assigned_to_name || task.assigned_to_email || '', surface: 'staff client-step queue' });
                    const rightPerson = task.assigned_to_name || task.assigned_to_email || task.last_actor || task.playbook?.waitingOn || 'the right owner';
                    return (
                    <div key={`${task.caseId}_${task.id}`} style={{ background: C.card, border: `1px solid ${blocked ? C.rose + '44' : C.border}`, borderLeft: `5px solid ${tone}`, borderRadius: 13, padding: 13, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10, alignItems: 'start' }}>
                      <div>
                        <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{task.caseName} - {task.locationName}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, marginTop: 3, lineHeight: 1.25 }}>{sharedTaskTitle(task)}</div>
                        <div style={{ color: C.mid, fontSize: 12.5, marginTop: 5 }}>Action status: <strong style={{ color: C.ink }}>{statusLabel(task.status)}</strong> | Owner: <strong style={{ color: C.ink }}>{rightPerson}</strong></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 9 }}>
                          <div style={{ background: blocked ? C.roseFaint : waiting ? C.amberFaint : C.sageFaint, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 12, lineHeight: 1.4 }}>
                            <strong style={{ color: C.ink }}>Action needed:</strong> {guidance.nextStep || taskExpectedUpdate(task, 'funeral_home')}
                          </div>
                          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 12, lineHeight: 1.4 }}>
                            <strong style={{ color: C.ink }}>Message ready:</strong> {preparedDraft}
                          </div>
                          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 12, lineHeight: 1.4 }}>
                            <strong style={{ color: C.ink }}>Proof/status:</strong> {proofDestination}
                          </div>
                        </div>
                        <details style={{ color: C.mid, fontSize: 12, lineHeight: 1.4, marginTop: 8 }}>
                          <summary style={{ color: C.sage, fontWeight: 900, cursor: 'pointer' }}>What Passage prepared</summary>
                          <div style={{ marginTop: 5 }}><strong style={{ color: C.ink }}>{preparedOutput.label}:</strong> {preparedOutput.body}</div>
                        </details>
                      </div>
                      <button onClick={() => openPartnerWork(task.caseId, task.id)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 10, padding: '8px 10px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer', justifySelf: 'start' }}>Open this step</button>
                    </div>
                  );})}
                  {staffQueueHiddenCount > 0 && (
                    <details style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 11px', color: C.mid, fontSize: 12.5 }}>
                      <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900 }}>Show {staffQueueHiddenCount} more assigned step{staffQueueHiddenCount === 1 ? '' : 's'}</summary>
                      <div style={{ display: 'grid', gap: 7, marginTop: 9 }}>
                        {assignedWorkQueue.slice(firstStaffTask ? 3 : 4).map(task => (
                          <button key={`${task.caseId}_${task.id}_hidden`} onClick={() => openPartnerWork(task.caseId, task.id)} style={{ textAlign: 'left', border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 10, padding: '8px 9px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
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

        {user && !loading && data && isDirectorRole && activePartnerView === 'reports' && (
          <div id="partner-reports-section" data-demo-anchor="demo-reports" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: '0 4px 20px rgba(0,0,0,.05)', scrollMarginTop: 92 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Funeral-home reporting</div>
                <div style={{ fontSize: 24, marginTop: 3 }}>See staff load, response risk, and Passage value by time, location, staff, request, or case.</div>
                <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>Reporting reads the same case record: owner, message, proof, status, and export. No separate dashboard language for families.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => downloadExport('cases')} style={{ border: `1px solid ${C.sage}33`, borderRadius: 12, padding: '9px 12px', background: C.sageFaint, color: C.sage, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>Export case summary</button>
                <button onClick={() => downloadExport('spine')} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 12px', background: C.card, color: C.mid, fontFamily: 'Georgia,serif', fontWeight: 800, cursor: 'pointer' }}>Export full record</button>
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
                    <option value="unassigned">Needs owner</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                {[
                  ['overview', 'Overview'],
                  ['locations', 'Locations'],
                  ['staff', 'Staff'],
                  ['tasks', 'Tasks'],
                  ['inbounds', 'Family requests'],
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
                ['Family requests', reports.warmInboundRequests ?? warmInbounds.length],
                ['Open requests', reports.warmInboundOpen ?? openWarmInbounds.length],
                ['Vendor quotes', reportVendorQuoteReady],
                ['Quotes accepted', reportVendorAccepted],
                ['Work resolved', reportHandledTasks.length],
                ['Cost / resolved step', reportCostPerResolvedTask ? moneyDisplay(reportCostPerResolvedTask) : '$0'],
                ['Avg client steps / case', reports.avgTasksPerEstate ?? reportAvgTasksPerEstate],
                ['Steps / day', reportTasksPerDay],
                ['Waiting + needs help', reportWaitingTasks.length + reportBlockedTasks.length],
              ].map(([label, value]) => (
                <div key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 13, padding: 12 }}>
                  <div style={{ color: C.sage, fontSize: 10.5, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
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
                    ['Work resolved', reportHandledTasks.length, 'Shows work that moved from waiting to proof.'],
                    ['Average tasks per estate', reportAvgTasksPerEstate, 'Helps price support load and compare case complexity.'],
                    ['Estimated labor cost', reportLaborCost ? moneyDisplay(reportLaborCost) : '$0', 'Private estimate from employee salary/hourly cost; not visible to families.'],
                    ['Cost per resolved task', reportCostPerResolvedTask ? moneyDisplay(reportCostPerResolvedTask) : '$0', 'Directional cost based on an 8-minute coordination unit.'],
                    ['Tasks completed per day', reportTasksPerDay, 'Shows throughput for the selected range.'],
                    ['Messages sent', reportScopedMessages.length, 'Measures family-facing coordination volume.'],
                    ['Participant activation', `${reportAcceptedParticipants.length}/${reportScopedParticipants.length}`, 'Shows whether family helpers accepted scoped access instead of joining the full workspace.'],
                    ['Warm family requests', `${warmInbounds.length} total / ${openWarmInbounds.length} open / ${acceptedWarmInbounds.length} accepted`, 'Families who asked to connect their record to this funeral home.'],
                    ['Vendor quote pipeline', `${reportScopedVendorRequests.length} requested / ${reportVendorQuoteReady} ready / ${reportVendorAccepted} accepted`, 'Shows local support requests without turning Passage into a directory.'],
                  ]}
                />
                <ReportTable
                  title="Operating signals"
                  columns={['Signal', 'Value', 'Source']}
                  rows={[
                    ['Estimated hours saved', reportCallsAvoided > 0 ? `${Math.max(1, Math.round((reportCallsAvoided * 8) / 60))} hr` : 'None yet', '8 minutes per avoided repeat call estimate'],
                    ['Marketplace value', money(reportVendorValue || reports.marketplace?.estimatedValue || totalVendorValue), 'Case-linked local support requests'],
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
                columns={['Location', 'Cases', 'Case value', 'Avg value', 'Tasks', 'Handled', 'Waiting / needs help', 'Calls avoided']}
                rows={reportLocationRows}
              />
            )}
            {reportView === 'staff' && (
              <ReportTable
                title="By employee"
                columns={['Employee', 'Role', 'Private cost', 'Tasks', 'Handled', 'Est. cost', 'Cost / task', 'Waiting', 'Needs help']}
                rows={reportEmployeeRows}
              />
            )}
            {reportView === 'tasks' && (
              <ReportTable
                title="By task type"
                columns={['Task', 'Total', 'Handled', 'Waiting', 'Needs help']}
                rows={reportTaskSummaryRows}
              />
            )}
            {reportView === 'inbounds' && (
              <ReportTable
                title="Warm family requests"
                columns={['Family / case', 'Urgency', 'Status', 'Source', 'Permission', 'Estimated value']}
                rows={warmInbounds.map(request => [
                  request.case_name || request.requested_by_name || request.requested_provider_name || 'Family request',
                  request.urgency || 'normal',
                  String(request.status || 'requested').replace(/_/g, ' '),
                  String(request.source || 'family record').replace(/_/g, ' '),
                  request.family_permission_to_contact ? 'Approved' : 'Review first',
                  request.estimated_case_value ? moneyDisplay(request.estimated_case_value) : '$0',
                ])}
              />
            )}
            {reportView === 'cases' && (
              <ReportTable
                title="By case / estate"
                columns={['Case', 'Location', 'Case value', 'Prepaid', 'Tasks', 'Handled', 'Waiting', 'Needs help']}
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

        {user && !loading && data?.organizations?.length > 0 && vendorPrefs.vendors.length > 0 && (showTools || (isDirectorRole && activePartnerView === 'reports')) && (
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
                    <div style={{ color: isPreferred ? C.sage : C.soft, fontSize: 11, fontWeight: 900, marginTop: 6 }}>{isPreferred ? 'Preferred for requests' : 'Click to prefer'}</div>
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
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 8, marginTop: 10 }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                Funeral home
                <input
                  readOnly={Boolean(org?.id)}
                  value={caseForm.funeralHomeName || org?.name || ''}
                  onChange={e => setCaseForm(prev => ({ ...prev, funeralHomeName: e.target.value }))}
                  placeholder={org?.name || 'Funeral home name'}
                  style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: org?.id ? C.sageFaint : C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }}
                />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 10.5, color: C.soft, fontWeight: 900, letterSpacing: '.11em', textTransform: 'uppercase' }}>
                Location
                <select
                  value={caseForm.locationId || caseForm.locationName || caseLocationOptions[0]?.name || ''}
                  onChange={event => {
                    const value = event.target.value;
                    const selected = caseLocationOptions.find(location => String(location.id || location.name) === value || String(location.name) === value) || { name: value };
                    setCaseForm(prev => ({ ...prev, ...locationPatchForCaseForm(selected) }));
                  }}
                  style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: '9px 10px', fontFamily: 'Georgia,serif', fontSize: 13, color: C.ink }}
                >
                  {caseLocationOptions.map(location => {
                    const value = location.id || location.name;
                    return <option key={`${value}-${location.name}`} value={value}>{location.name}</option>;
                  })}
                </select>
              </label>
            </div>
            <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.45, marginTop: 6 }}>
              This case will be created under {caseForm.funeralHomeName || org?.name || 'your funeral-home dashboard'}{caseForm.locationName ? ` - ${caseForm.locationName}` : ''}. Staff see only the work their role and location allow.
            </div>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: 11, marginTop: 10 }}>
              <SmartAddressInput
                compact
                label="Service / case address"
                value={caseForm.locationAddress}
                onChange={(value, parsed = {}) => setCaseForm(prev => ({
                  ...prev,
                  locationAddress: value,
                  locationName: prev.locationName || parsed.placeName || 'Main location',
                  locationCity: parsed.city || '',
                  locationState: parsed.state || '',
                  locationZip: parsed.postalCode || '',
                  locationCountry: parsed.country || '',
                  locationPlaceId: parsed.placeId || '',
                }))}
                colors={C}
                inputStyle={{ background: C.card }}
                placeholder="Start typing a service address, cemetery, chapel, or family address"
                hint="Choose a Google suggestion when available. Passage saves city, state, ZIP, country, and place context with the case."
              />
            </div>
            <div style={{ background: C.sageFaint, border: `1px solid ${caseForm.totalCaseValue || caseForm.isPrepaid ? C.sage : C.sage + '22'}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Case economics</div>
              <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>Value belongs on every case when known. Prepaid is only a funding flag, and these numbers power private operating signals for the funeral home.</div>
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
            <div style={{ fontSize: 22, marginBottom: 8 }}>Create your funeral-home workspace.</div>
            <p style={{ color: C.mid, fontSize: 14, lineHeight: 1.7 }}>Create the first funeral-home case to open the staff dashboard.</p>
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
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{isDirectorRole ? 'My Day' : 'My work'}</div>
                    <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.18, fontWeight: 900, marginTop: 4 }}>
                      {isDirectorRole ? `${nextDirectorStep.label}: ${nextDirectorStep.next}` : firstStaffTask ? sharedTaskTitle(firstStaffTask) : 'No assigned work is waiting.'}
                    </div>
                    <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 5 }}>
                      {isDirectorRole
                        ? 'Start here. The first screen should answer what is stuck, who owns it, what the family can be told, and what proof exists.'
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
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                      <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.1, marginTop: 3 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                  {operatingRealityItems.map(item => {
                    const tone = item.tone === 'risk' ? { border: C.rose + '55', bg: C.roseFaint, color: C.rose } : item.tone === 'warn' ? { border: C.amber + '55', bg: C.amberFaint, color: C.amber } : item.tone === 'good' ? { border: C.sage + '33', bg: C.card, color: C.sage } : { border: C.border, bg: C.card, color: C.mid };
                    return (
                      <div key={item.label} style={{ background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 11, padding: '10px 11px', minHeight: 98 }}>
                        <div style={{ color: tone.color, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{item.label}</div>
                        <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.1, marginTop: 3 }}>{item.value}</div>
                        <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.35, marginTop: 5 }}>{item.body}</div>
                      </div>
                    );
                  })}
                </div>
                {isDirectorRole && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 7, marginTop: 9 }}>
                    {[
                      ['Create/import', () => openCasePanel('immediate')],
                      ['Manage team', () => openPartnerManagement('Opening locations, employees, roles, and permissions.')],
                      ['Open report', () => openPartnerPane('reports', 'partner-reports-section', 'Opening operating signals and export.')],
                      ['Export proof', () => downloadExport('cases')],
                    ].map(([label, action]) => (
                      <button key={label} onClick={action} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.ink, borderRadius: 10, minHeight: 38, padding: '0 10px', fontFamily: 'Georgia,serif', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isDirectorRole && isAdminDemo && (
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', marginBottom: 8 }}>
                    <div>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Dashboard readiness</div>
                      <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.4, marginTop: 3 }}>A quick setup check before the first case moves.</div>
                    </div>
                    <button onClick={() => setShowPilotGuide(true)} style={{ border: `1px solid ${C.sage}33`, background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '6px 9px', fontFamily: 'Georgia,serif', fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>Guide</button>
                  </div>
                  <div style={{ display: 'grid', gap: 7 }}>
                    {visiblePilotLaunchRows.map(([n, title, body, done]) => (
                      <button key={title} onClick={() => {
                        if (title === 'Employees' || title === 'Locations' || title === 'First owner' || title === 'Invite review' || title === 'Billing setup') openPartnerManagement('Opening the setup checklist for locations, employees, roles, invites, billing setup, and assignment readiness.');
                        else if (title === 'Cases') openCasePanel('immediate');
                        else if (title === 'Proof trail') moveDirectorFocus();
                      }} style={{ textAlign: 'left', border: `1px solid ${done ? C.sage + '22' : C.amber + '33'}`, background: done ? C.sageFaint : C.amberFaint, borderRadius: 10, padding: '7px 9px', display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: 8, alignItems: 'center', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                        <span style={{ width: 18, height: 18, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: done ? C.sage : C.amber, color: '#fff', fontSize: 10.5, fontWeight: 900 }}>{done ? 'OK' : n}</span>
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
          {isDirectorRole && (
            <div style={{ background: unassignedTaskCount ? C.amberFaint : C.sageFaint, border: `1px solid ${unassignedTaskCount ? C.amber + '33' : C.sage + '22'}`, borderRadius: 16, padding: 13, marginBottom: 12, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ color: unassignedTaskCount ? C.amber : C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Assignment coverage</div>
                <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.2, fontWeight: 900, marginTop: 3 }}>
                  {unassignedTaskCount
                    ? `${unassignedTaskCount} client step${unassignedTaskCount === 1 ? '' : 's'} need an owner across ${unassignedCaseCount} case${unassignedCaseCount === 1 ? '' : 's'}.`
                    : '0 client steps need an owner. All visible open work is assigned.'}
                </div>
                <div style={{ color: C.mid, fontSize: 12.4, lineHeight: 1.45, marginTop: 4 }}>
                  Directors can assign a whole case to one employee, or open a case and assign individual client steps when the home works role-by-role.
                </div>
              </div>
              <button disabled={!unassignedTaskCount} onClick={() => unassignedCaseRows[0]?.caseItem?.id && openPartnerWork(unassignedCaseRows[0].caseItem.id)} style={{ border: `1px solid ${unassignedTaskCount ? C.amber + '55' : C.sage + '33'}`, background: unassignedTaskCount ? C.card : C.sageFaint, color: unassignedTaskCount ? C.amber : C.sage, borderRadius: 11, padding: '9px 12px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: unassignedTaskCount ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                {unassignedTaskCount ? 'Assign first case' : 'Coverage ready'}
              </button>
            </div>
          )}
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
                        const handled = rows.reduce((sum, item) => sum + item.tasks.filter(taskIsClosed).length, 0);
                        const waiting = rows.reduce((sum, item) => sum + item.tasks.filter(task => taskIsWaiting(task) || taskNeedsHelp(task)).length, 0);
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
              <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>Selected case steps</div>
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
              const handledCount = item.tasks.filter(taskIsClosed).length;
              const waitingCount = item.tasks.filter(taskIsWaiting).length;
              const progressCount = item.tasks.filter(t => ['draft', 'acknowledged'].includes(t.status || '')).length;
              const open = item.tasks.length - handledCount;
              const openCaseTasks = openTasksForCase(item);
              const unassignedCaseTasks = unassignedTasksForCase(item);
              const blocked = item.tasks.filter(taskNeedsHelp).length;
              const partnerTasks = item.partnerTasks || [];
              const waitingFamily = item.waitingOnFamily || [];
              const vendorRequests = item.vendorRequests || [];
              const quoteDecisionRequests = vendorRequests.filter(request => {
                const status = String(request.status || '').toLowerCase();
                const payment = String(request.payment_collection_status || '').toLowerCase();
                return ['accepted', 'quoted', 'family_accepted', 'payment_pending'].includes(status) && payment !== 'paid';
              });
              const firstQuoteDecision = quoteDecisionRequests[0] || null;
              const familyParticipants = item.familyParticipants || [];
              const orchestration = orchestrationByCaseId.get(item.id) || orchestrateTasks({ tasks: item.tasks || [], role: 'funeral_home', context: { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, deathDate: item.date_of_death, serviceEvents: item.serviceEvents || item.service_events || [], surface: 'case work' } });
              const topTasks = (partnerTasks.length ? partnerTasks : orchestration.tasks.length ? orchestration.tasks : item.tasks).slice(0, 3);
              const nextPartnerTask = (item.id === recommendedActionCase?.id && recommendedActionTask?.id ? recommendedActionTask : null) || itemNextPartnerTask(item, orchestration);
              const nextImportance = nextPartnerTask ? (nextPartnerTask.orchestration?.importance || taskImportance(nextPartnerTask, { caseName: item.deceased_name || item.estate_name || item.name, coordinatorName: item.coordinator_name, deathDate: item.date_of_death, serviceEvents: item.serviceEvents || item.service_events || [], surface: 'case work' })) : null;
              const nextImportanceTone = importanceStyle(nextImportance);
              const isDemoCase = /^DEMO/i.test(item.organization_case_reference || '') || /^Demo - /i.test(item.name || '');
              const isExpanded = expandedCaseId === item.id;
              const itemLocation = locationNameFor(item);
              const fundingLabel = partnerFundingLabel(item);
              const urgentContext = partnerUrgentContext(item);
              const nextOwner = nextPartnerTask?.assigned_to_name || nextPartnerTask?.assigned_to_email || nextPartnerTask?.playbook?.partnerOwnerRole || 'Unassigned';
              const nextTaskClosed = nextPartnerTask && taskIsClosed(nextPartnerTask);
              const nextExpectedUpdate = nextTaskClosed ? 'Handled - proof is saved on the case record.' : nextPartnerTask ? (orchestration.nextAction?.expectedUpdate || taskExpectedUpdate(nextPartnerTask, 'funeral_home')) : 'The family status remains visible.';
              const nextStateMachine = orchestration.nextAction?.stateMachine || nextPartnerTask?.orchestration?.stateMachine || null;
              const nextSuggestedOutputs = orchestration.nextAction?.suggestedOutputs || nextPartnerTask?.orchestration?.outputActions || [];
              const workflowStates = orchestration.workflowStates || { states: [], activeState: null };
              const conversationCount = item.coordinationSpine?.conversation?.length || 0;
              const proofCount = item.coordinationSpine?.proof?.length || 0;
              const notificationCount = item.coordinationSpine?.notifications?.length || 0;
              const familyUpdateHref = `/share?wid=${encodeURIComponent(item.id)}&dn=${encodeURIComponent(item.deceased_name || item.estate_name || item.name || 'Family case')}&cn=${encodeURIComponent(item.coordinator_name || 'the family')}`;
              const packetHref = demoMode
                ? `/packet?id=${encodeURIComponent(item.id)}&demo=1`
                : `/packet?id=${encodeURIComponent(item.id)}`;
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
                ['tasks', 'Work', topTasks.length],
              ];
              const missingTimeline = Array.isArray(item.orchestration_summary?.missing_timeline_watch)
                ? item.orchestration_summary.missing_timeline_watch.filter(Boolean).slice(0, 2)
                : [];
              const caseProofGapCount = item.tasks.filter(task => taskIsClosed(task) && !String(task.notes || task.waiting_on || task.last_actor || '').trim()).length;
              const waitingLabel = blocked
                ? `${blocked} item${blocked === 1 ? '' : 's'} need help`
                : waitingFamily.length
                  ? `${waitingFamily.length} family item${waitingFamily.length === 1 ? '' : 's'} waiting`
                  : waitingCount
                    ? `${waitingCount} client step${waitingCount === 1 ? '' : 's'} waiting`
                    : 'Nothing urgent waiting';
              const proofEventCount = proofCount + (item.activity?.length || 0);
              const proofLabel = caseProofGapCount
                ? `${caseProofGapCount} proof gap${caseProofGapCount === 1 ? '' : 's'}`
                : proofEventCount
                  ? `${proofEventCount} proof event${proofEventCount === 1 ? '' : 's'}`
                  : 'No proof yet';
              const familyUpdateLabel = nextPartnerTask
                ? nextExpectedUpdate
                : open
                  ? 'Open client steps remains; assign the next clear owner before the family update.'
                  : 'Family can be told there is no open funeral-home work right now.';
              const caseOperatingContract = [
                ['Action needed', nextPartnerTask ? sharedTaskTitle(nextPartnerTask) : 'No staff action ready', nextPartnerTask ? (orchestration.nextAction?.reason || sharedTaskNext(nextPartnerTask, 'funeral_home')) : 'No staff action is required right now.', nextPartnerTask ? C.ink : C.mid],
                ['Owner', nextOwner, nextOwner === 'Unassigned' ? 'Assign an owner before this can reliably move.' : 'This person owns the next visible move.', nextOwner === 'Unassigned' ? C.amber : C.sage],
                ['Waiting on', waitingLabel, waitingFamily[0]?.title || waitingFamily[0]?.detail || nextPartnerTask?.waiting_on || 'Waiting points create repeated family calls when they are not owned.', blocked ? C.rose : waitingCount || waitingFamily.length ? C.amber : C.sage],
                ['Proof/status', proofLabel, caseProofGapCount ? 'Close the proof gap before using this as a family status record.' : 'Proof stays attached to the case record.', caseProofGapCount ? C.amber : C.sage],
                ['Family update', familyUpdateLabel, 'Use this line to answer the next where-are-we call.', C.mid],
              ];
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
                          if (!isDirectorRole) setStaffCaseContextOpen(false);
                          setCasePaneAutoOpened(true);
                          setShowAllCases(true);
                          setNotice('Case steps closed. Showing the case list again.');
                        } else {
                          setExpandedCaseId(item.id);
                          setShowAllCases(false);
                        }
                      }} style={{ color: '#fff', background: C.sage, border: 'none', borderRadius: 11, padding: '9px 13px', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{isExpanded ? 'Close case steps' : 'Open case steps'}</button>
                    </div>
                  </div>
                  {urgentContext.length > 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 13, padding: '10px 11px', marginTop: 10 }}>
                      <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Family handoff context</div>
                      <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 4 }}>
                        This is the same stabilization context the family saved before funeral-home support began.
                      </div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
                        {urgentContext.map(([label, value]) => (
                          <span key={label} style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, color: C.mid, borderRadius: 999, padding: '5px 8px', fontSize: 11.5, fontWeight: 700 }}>
                            <strong style={{ color: C.ink }}>{label}:</strong> {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10 }}>
                    <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Case at a glance</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginTop: 9 }}>
                      {caseOperatingContract.map(([label, value, body, color]) => (
                        <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', minHeight: 92 }}>
                          <div style={{ color, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                          <div style={{ color: C.ink, fontSize: 13.5, fontWeight: 900, lineHeight: 1.25, marginTop: 4 }}>{value}</div>
                          <div style={{ color: C.mid, fontSize: 11.5, lineHeight: 1.35, marginTop: 5 }}>{body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {firstQuoteDecision && (
                    <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderLeft: `5px solid ${C.amber}`, borderRadius: 13, padding: 13, marginTop: 10 }}>
                      <div style={{ color: C.amber, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Vendor quote needing decision</div>
                      <div style={{ color: C.ink, fontSize: 18, lineHeight: 1.2, fontWeight: 900, marginTop: 5 }}>{firstQuoteDecision.task_title || 'Vendor service'} quote is ready.</div>
                      <div style={{ color: C.mid, fontSize: 12.5, lineHeight: 1.45, marginTop: 6 }}>
                        {firstQuoteDecision.vendors?.business_name || 'Vendor'} is waiting. Approve and pay, or choose another option before work begins.
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 9 }}>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px' }}>
                          <div style={{ color: C.amber, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Quote</div>
                          <div style={{ color: C.ink, fontSize: 13, fontWeight: 900, marginTop: 3 }}>{moneyDisplay(firstQuoteDecision.final_value || firstQuoteDecision.estimated_value || firstQuoteDecision.gross_amount || 0) || 'Amount not recorded'}</div>
                        </div>
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px' }}>
                          <div style={{ color: C.amber, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Next step</div>
                          <div style={{ color: C.ink, fontSize: 13, fontWeight: 900, marginTop: 3 }}>Review, pay, or choose another option</div>
                        </div>
                      </div>
                      {firstQuoteDecision.vendor_note && <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 8 }}>Vendor note: {firstQuoteDecision.vendor_note}</div>}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <button onClick={() => { window.location.href = `/estate?id=${encodeURIComponent(item.id)}&vendor_request=${encodeURIComponent(firstQuoteDecision.id)}`; }} style={{ border: 'none', background: C.amber, color: '#fff', borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}>Review quote and payment</button>
                        <button onClick={() => setNotice('Open the family record to choose another option and keep the decision visible to the family and staff.')} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 10, padding: '9px 11px', fontFamily: 'Georgia,serif', fontSize: 12.5, fontWeight: 900, cursor: 'pointer' }}>Need another option</button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10, alignItems: 'stretch', marginTop: 12 }}>
                    <div style={{ background: blocked ? C.roseFaint : C.sageFaint, border: `1px solid ${blocked ? C.rose + '35' : C.sage}22`, borderRadius: 15, padding: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 10.5, color: blocked ? C.rose : C.sage, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>Recommended next action</div>
                          <div style={{ fontSize: 18, lineHeight: 1.2, color: C.ink, fontWeight: 900 }}>{nextPartnerTask ? sharedTaskTitle(nextPartnerTask) : 'No staff action is open'}</div>
                        </div>
                        {nextImportance && <span style={{ background: nextImportanceTone.bg, border: `1px solid ${nextImportanceTone.border}`, color: nextImportanceTone.color, borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 900 }}>{nextImportance.label}</span>}
                        <span style={{ background: C.card, color: nextOwner === 'Unassigned' ? C.amber : C.sage, borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 900 }}>{nextOwner}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: C.mid, lineHeight: 1.45, marginTop: 7 }}>
                        {nextPartnerTask ? (orchestration.nextAction?.reason || sharedTaskNext(nextPartnerTask, 'funeral_home')) : 'Nothing needs funeral-home action right now.'}
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
                        <strong style={{ color: C.ink }}>Status change expected:</strong> {nextExpectedUpdate}
                      </div>
                      {nextStateMachine && (
                        <div style={{ background: C.card, border: `1px solid ${nextStateMachine.escalation || nextStateMachine.state === 'blocked_by_dependency' ? C.amber + '44' : C.sage + '33'}`, borderRadius: 11, padding: '9px 10px', marginTop: 8, color: C.mid, fontSize: 12.2, lineHeight: 1.45 }}>
                          <strong style={{ color: C.ink }}>Why this is next:</strong> {` ${nextStateMachine.label}. ${nextStateMachine.reassurance}`}
                          {nextStateMachine.escalation ? <div style={{ marginTop: 4 }}><strong style={{ color: C.ink }}>If stuck:</strong> {nextStateMachine.escalation}</div> : null}
                        </div>
                      )}
                      {workflowStates.activeState && (
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', marginTop: 8 }}>
                          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Case stage</div>
                          <div style={{ color: C.ink, fontSize: 13.5, lineHeight: 1.35, fontWeight: 900, marginTop: 4 }}>{workflowStates.activeState.label}: {workflowStates.activeState.statusLabel}</div>
                          <div style={{ color: C.mid, fontSize: 12.1, lineHeight: 1.4, marginTop: 3 }}>{workflowStates.activeState.reassurance}</div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                            {workflowStates.states.slice(0, 5).map(state => (
                              <span key={state.key} style={{ background: state.key === workflowStates.activeState?.key ? C.sageFaint : C.bg, border: `1px solid ${state.key === workflowStates.activeState?.key ? C.sage + '33' : C.border}`, color: state.status === 'complete' ? C.sage : state.status === 'needs_help' || state.status === 'blocked_by_dependency' ? C.rose : state.status === 'waiting' || state.status === 'needs_owner' ? C.amber : C.mid, borderRadius: 999, padding: '4px 7px', fontSize: 10.8, fontWeight: 900 }}>
                                {state.label}: {state.statusLabel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {nextSuggestedOutputs.length > 0 && (
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
                          {nextSuggestedOutputs.slice(0, 2).map(output => (
                            <button key={output.packetType} onClick={() => setPacketModal({ estateId: item.id, packetType: output.packetType })} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 999, padding: '6px 9px', fontSize: 11.5, fontWeight: 900, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>{output.label}</button>
                          ))}
                        </div>
                      )}
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
                            <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                            <div style={{ color, fontSize: 18, fontWeight: 900, marginTop: 2 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>This reduces the "where are we?" calls and keeps the family view aligned with staff steps.</div>
                    </div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{item.tasks.length} client steps</span>
                    <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{partnerTasks.length} partner-ready</span>
                    {waitingFamily.length > 0 && <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{waitingFamily.length} waiting on family</span>}
                    {blocked > 0 && <span style={{ background: C.roseFaint, color: C.rose, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{blocked} need help</span>}
                    {isExpanded && isMultiLocation && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Location: {itemLocation}</span>}
                    {isExpanded && isAdminDemo && isDemoCase && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>Demo data</span>}
                    {openCaseTasks.length > 0 && <span style={{ background: C.bg, color: C.mid, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>{openCaseTasks.length} open</span>}
                    {unassignedCaseTasks.length > 0 && <span style={{ background: C.amberFaint, color: C.amber, borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 900 }}>{unassignedCaseTasks.length} to assign</span>}
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
                  {isExpanded && isDirectorRole && openCaseTasks.length > 0 && (
                    <div style={{ background: unassignedCaseTasks.length ? C.amberFaint : C.sageFaint, border: `1px solid ${unassignedCaseTasks.length ? C.amber + '33' : C.sage + '22'}`, borderRadius: 13, padding: '10px 11px', marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ color: unassignedCaseTasks.length ? C.amber : C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Case assignment</div>
                        <div style={{ color: C.mid, fontSize: 12.4, lineHeight: 1.45, marginTop: 3 }}>
                          {unassignedCaseTasks.length
                            ? `${unassignedCaseTasks.length} open client step${unassignedCaseTasks.length === 1 ? '' : 's'} still need an owner.`
                            : 'Every open client step on this case has an owner.'}
                        </div>
                      </div>
                      <button onClick={() => {
                        const firstAssignee = staffRoster.find(member => member.email) || null;
                        setAssignmentDraft({
                          taskId: nextPartnerTask?.id || '',
                          caseId: item.id,
                          scope: unassignedCaseTasks.length ? 'unassigned_open' : 'all_open',
                          mode: 'case',
                          name: firstAssignee?.label || '',
                          email: firstAssignee?.email || '',
                          role: firstAssignee?.role || 'staff',
                          phone: '',
                        });
                      }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 10, padding: '8px 11px', fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>
                        Assign case steps
                      </button>
                    </div>
                  )}
                  {isExpanded && <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Outputs</span>
                    <button onClick={() => setPacketModal({ estateId: item.id, packetType: 'funeral_home_arrangement' })} style={{ color: '#fff', background: C.sage, border: 'none', borderRadius: 999, padding: '6px 10px', textDecoration: 'none', fontSize: 11.5, fontWeight: 900, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>Generate packet</button>
                    <Link href={packetHref} style={{ color: C.sage, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 999, padding: '6px 9px', textDecoration: 'none', fontSize: 11.5, fontWeight: 900 }}>Prepared packets</Link>
                    <Link href={familyUpdateHref} style={{ color: C.sage, background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 999, padding: '6px 9px', textDecoration: 'none', fontSize: 11.5, fontWeight: 900 }}>Family update</Link>
                    <Link href={`/funeral-home/summary?id=${item.id}`} style={{ color: C.mid, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 999, padding: '6px 9px', textDecoration: 'none', fontSize: 11.5, fontWeight: 900 }}>Printable summary</Link>
                  </div>}
                  {isExpanded && nextPartnerTask && (() => {
                    const context = { caseName: item?.deceased_name || item?.estate_name || item?.name, coordinatorName: item?.coordinator_name, surface: 'case proof record' };
                    const taskClosed = taskIsClosed(nextPartnerTask);
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
                      mode: 'saved',
                      name: option?.name || '',
                      email: option?.email || '',
                      role: option?.role || '',
                      phone: option?.phone || '',
                    }));
                    const assigningNewOwner = assignmentDraft.mode === 'new' || !assignmentOptions.length || !assignmentDraft.email || !assignmentOptions.some(option => option.email === assignmentDraft.email);
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
                    const packetUse = 'This is the prepared work product: review it, print or save it as a Passage-branded PDF, then use Save proof to attach it to the case. Nothing sends automatically.';
                    const coordinationRows = [
                      {
                        label: 'Conversation',
                        count: conversationCount,
                        body: item.coordinationSpine?.conversation?.[0]?.title || item.coordinationSpine?.conversation?.[0]?.detail || 'Human request or reply stays on this client step.',
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
                      ['Report', 'Exports with case record', C.mid],
                    ];
                    const actionContractRows = [
                      ['Passage prepared', output.label || 'Prepared task packet'],
                      ['Action needed', nextPartnerTask ? sharedTaskNext(nextPartnerTask) : 'No staff action is open'],
                      ['Waiting on', nextPartnerTask?.waiting_on || nextPartnerTask?.playbook?.waitingOn || (nextOwner === 'Unassigned' ? 'An owner' : 'Next response')],
                      ['Proof/status saves', proofDestination || output.label || 'Case record'],
                    ];
                    const ownerMissing = nextOwner === 'Unassigned';
                    return (
                      <div id={'partner-action-workspace-' + item.id} data-demo-anchor="demo-task-action" style={{ background: C.card, border: `1px solid ${C.sage}33`, borderRadius: 15, padding: 14, marginTop: 12, boxShadow: '0 8px 22px rgba(55,45,35,.04)', scrollMarginTop: 92 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 12, alignItems: 'stretch' }}>
                          <div>
                            <div style={{ color: taskClosed ? C.sage : C.sage, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 900 }}>{taskClosed ? 'Closed with proof' : 'Action needed'}</div>
                            <div style={{ color: C.ink, fontSize: 20, lineHeight: 1.18, fontWeight: 900, marginTop: 4 }}>{sharedTaskTitle(nextPartnerTask)}</div>
                            <div style={{ color: C.mid, fontSize: 12.8, lineHeight: 1.5, marginTop: 5 }}>{taskClosed ? 'This step is already handled. Passage keeps the proof, owner, notification, and family-visible status together.' : 'This step has one owner, one needed action, one waiting point, and one proof/status note.'}</div>
                            <div style={{ color: C.mid, fontSize: 12.2, lineHeight: 1.45, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 9px', marginBottom: 8 }}>
                                <strong style={{ color: C.ink }}>What this is:</strong> {explanation.what}
                                <br />
                                <strong style={{ color: C.ink }}>What done means:</strong> {explanation.done}
                              </div>
                              <strong style={{ color: C.ink }}>Why now:</strong> {guidance.why}
                              <br />
                              <strong style={{ color: C.ink }}>Expected timing:</strong> {guidance.timing}
                              <br />
                              <strong style={{ color: C.ink }}>Family can see:</strong> approved status and proof. Staff notes stay in the funeral-home record.<br /><strong style={{ color: C.ink }}>Need support:</strong> mark the step waiting, request one family detail, or assign a director before promising the family a new update.
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 8, marginTop: 12 }}>
                          {actionContractRows.map(([label, body]) => (
                            <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', minHeight: 70 }}>
                              <div style={{ color: C.sage, fontSize: 10.4, letterSpacing: '.11em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                              <div style={{ color: C.ink, fontSize: 11.8, lineHeight: 1.35, marginTop: 5, fontWeight: 800 }}>{body}</div>
                            </div>
                          ))}
                        </div>
                        {taskClosed ? (
                          <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 12, padding: '11px 12px', color: C.sage, fontSize: 13, fontWeight: 900, marginTop: 12 }}>
                            Done. Proof is saved below; no new family request or waiting state is needed for this client step.
                          </div>
                        ) : (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(160px, .7fr)', gap: 8 }}>
                              {ownerMissing ? (
                                <button onClick={() => { setAssignmentDraft({ taskId: nextPartnerTask.id, caseId: item.id, scope: 'task', name: nextPartnerTask.assigned_to_name || firstAssignee?.name || '', email: nextPartnerTask.assigned_to_email || firstAssignee?.email || '', role: nextPartnerTask.playbook?.partnerOwnerRole || firstAssignee?.role || 'staff', phone: '' }); setTaskDraft(null); setTaskDraftNote(''); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, padding: '12px 13px', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Assign owner<br /><span style={{ color: 'rgba(255,255,255,.78)', fontWeight: 500 }}>{unassignedCaseTasks.length ? `${unassignedCaseTasks.length} to assign` : 'staff or case contact'}</span></button>
                              ) : (
                                <button onClick={() => { setTaskDraft({ task: nextPartnerTask, status: 'handled', label: 'Save proof + close', prompt: 'Review the Passage-prepared packet, add or edit the proof note, then close this client step. After it closes, family request and waiting actions move out of the way.', draft, output, proofDestination }); setTaskDraftNote(packetText); setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' }); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 11, padding: '12px 13px', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Done - save proof<br /><span style={{ color: 'rgba(255,255,255,.78)', fontWeight: 500 }}>removes from active steps</span></button>
                              )}
                              <button onClick={() => { setTaskDraft({ task: nextPartnerTask, status: 'waiting', label: 'Waiting update', prompt: 'Write what is waiting and the next expected update.', draft, output, proofDestination }); setTaskDraftNote(`Waiting on ${nextPartnerTask.playbook?.waitingOn || 'confirmation'} before ${sharedTaskTitle(nextPartnerTask)} can move forward. Next update expected tomorrow morning.`); setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' }); }} style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.mid, borderRadius: 11, padding: '12px 13px', fontSize: 12.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Waiting - add update<br /><span style={{ color: C.soft, fontWeight: 500 }}>who or what is blocking it</span></button>
                            </div>
                            <details style={{ border: `1px solid ${C.border}`, background: C.bg, borderRadius: 11, padding: '8px 10px', marginTop: 8 }}>
                              <summary style={{ cursor: 'pointer', color: C.mid, fontWeight: 900, fontSize: 12.2 }}>More actions</summary>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 8, marginTop: 9 }}>
                                {!ownerMissing && <button onClick={() => { setAssignmentDraft({ taskId: nextPartnerTask.id, caseId: item.id, scope: 'task', name: nextPartnerTask.assigned_to_name || firstAssignee?.name || '', email: nextPartnerTask.assigned_to_email || firstAssignee?.email || '', role: nextPartnerTask.playbook?.partnerOwnerRole || firstAssignee?.role || 'staff', phone: '' }); setTaskDraft(null); setTaskDraftNote(''); }} style={{ border: `1px solid ${C.sage}33`, background: C.card, color: C.sage, borderRadius: 10, padding: '9px 10px', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Change owner</button>}
                                <button onClick={() => { setTaskDraft({ task: nextPartnerTask, status: 'blocked', label: 'Family request', prompt: 'Write the missing detail needed from the family.', draft, output, proofDestination }); setTaskDraftNote(draft); setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' }); }} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 10, padding: '9px 10px', fontSize: 12, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif', textAlign: 'left' }}>Request family info<br /><span style={{ color: C.mid, fontWeight: 500 }}>one clear request</span></button>
                              </div>
                            </details>
                          </div>
                        )}
                        <details style={{ border: `1px solid ${C.border}`, background: C.bg, borderRadius: 11, padding: '9px 10px', marginTop: 10 }}>
                          <summary style={{ cursor: 'pointer', color: C.sage, fontWeight: 900, fontSize: 12.5 }}>What Passage saves</summary>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                            {loopRows.map(([label, body, tone]) => (
                              <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px', minHeight: 72 }}>
                                <div style={{ color: tone, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
                                <div style={{ color: label === 'Owner' ? tone : C.mid, fontSize: 11.6, lineHeight: 1.35, marginTop: 5, fontWeight: label === 'Owner' ? 900 : 500 }}>{body}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 8, marginTop: 10 }}>
                            {coordinationRows.map(row => (
                              <div key={row.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                                  <span style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{row.label}</span>
                                  <span style={{ color: C.sage, fontSize: 11, fontWeight: 900 }}>{row.count}</span>
                                </div>
                                <div style={{ color: C.mid, fontSize: 11.6, lineHeight: 1.4, marginTop: 5 }}>{row.body}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                        {assignOpen && (
                          <div onClick={() => setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' })} style={{ position: 'fixed', inset: 0, zIndex: 230, background: 'rgba(26,25,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                          <div role="dialog" aria-modal="true" aria-label="Assign next-step owner" onClick={event => event.stopPropagation()} style={{ width: 'min(700px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>Assign owner</div>
                              <button onClick={() => setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' })} aria-label="Close assignment" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 32, height: 32, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
                            </div>
                            <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 4 }}>
                              Choose a saved employee or case contact. Assign only this client step, all unassigned work in this case, or every open client step when one staff member owns the whole case.
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 7, marginTop: 10 }}>
                              {[
                                ['task', 'This client step', sharedTaskTitle(nextPartnerTask)],
                                ['unassigned_open', `Unassigned in case (${unassignedCaseTasks.length})`, 'Only open client steps without an owner'],
                                ['all_open', `All open in case (${openCaseTasks.length})`, 'Move the whole case queue to one employee'],
                              ].map(([scopeKey, label, body]) => (
                                <button key={scopeKey} onClick={() => setAssignmentDraft(prev => ({ ...prev, scope: scopeKey, caseId: item.id }))} style={{ textAlign: 'left', border: `1px solid ${assignmentDraft.scope === scopeKey ? C.sage : C.border}`, background: assignmentDraft.scope === scopeKey ? C.sageFaint : C.card, color: assignmentDraft.scope === scopeKey ? C.sage : C.mid, borderRadius: 10, padding: '8px 9px', fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                                  <span style={{ display: 'block', color: assignmentDraft.scope === scopeKey ? C.sage : C.ink, fontSize: 12.2, fontWeight: 900 }}>{label}</span>
                                  <span style={{ display: 'block', fontSize: 11.3, lineHeight: 1.35, marginTop: 2 }}>{body}</span>
                                </button>
                              ))}
                            </div>
                            {assignmentOptions.length > 0 && assignmentDraft.mode !== 'new' ? (
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
                                <button onClick={() => setAssignmentDraft(prev => ({ ...prev, mode: 'new', name: '', email: '', role: 'staff', phone: '' }))} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '9px 11px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Add one-time owner</button>
                              </div>
                            ) : (
                              <div style={{ background: C.amberFaint, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: '9px 10px', color: C.amber, fontSize: 12.2, lineHeight: 1.45, marginTop: 10 }}>
                                <div>{assignmentOptions.length ? 'Adding a one-time owner for this client step. They will not become a saved employee until you add them in Management.' : 'No employees or case contacts are saved yet.'}</div>
                                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
                                  {assignmentOptions.length > 0 && <button onClick={() => applyAssignee(firstAssignee)} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '8px 10px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Use saved person</button>}
                                  <button onClick={() => { setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' }); openPartnerManagement('Opening employee setup. Add employees here so they appear in every owner dropdown with role and location context.'); setShowStaffSetup(true); }} style={{ border: `1px solid ${C.amber}44`, background: C.card, color: C.amber, borderRadius: 9, padding: '8px 10px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Create employee in Management</button>
                                </div>
                              </div>
                            )}
                            {assigningNewOwner && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginTop: 10 }}>
                                <input value={assignmentDraft.name} onChange={event => setAssignmentDraft(prev => ({ ...prev, mode: 'new', name: event.target.value }))} placeholder="New owner name" style={inputStyle} />
                                <input value={assignmentDraft.email} onChange={event => setAssignmentDraft(prev => ({ ...prev, mode: 'new', email: event.target.value }))} placeholder="Email for assignment" style={inputStyle} />
                                <input value={assignmentDraft.role} onChange={event => setAssignmentDraft(prev => ({ ...prev, mode: 'new', role: event.target.value }))} placeholder="Role: staff, executor, clergy..." style={inputStyle} />
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
                              <button disabled={updating === nextPartnerTask.id + 'assign' || updating === item.id + 'assign_case'} onClick={() => assignmentDraft.scope === 'task' ? assignTaskOwner(nextPartnerTask) : assignCaseTasks(item, assignmentDraft.scope)} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 900, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                                {updating === nextPartnerTask.id + 'assign' || updating === item.id + 'assign_case'
                                  ? 'Saving...'
                                  : assignmentDraft.scope === 'all_open'
                                    ? `Assign ${openCaseTasks.length} open client step${openCaseTasks.length === 1 ? '' : 's'}`
                                    : assignmentDraft.scope === 'unassigned_open'
                                      ? `Assign ${unassignedCaseTasks.length} unassigned`
                                      : assigningNewOwner ? 'Save one-time owner' : 'Save owner'}
                              </button>
                              <button onClick={() => setAssignmentDraft({ taskId: '', caseId: '', scope: 'task', name: '', email: '', role: '', phone: '' })} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '8px 11px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Cancel</button>
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
                            <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{row.category}</div>
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
                          <div style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{label}</div>
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
                            {request.in_progress_at && <span style={miniPill}>Quote approved</span>}
                            {request.completed_at && <span style={miniPill}>Completed</span>}
                            {vendorValue(request) > 0 && <span style={miniPill}>Value ${Math.round(vendorValue(request))}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {detailTab === 'local' && vendorRequests.length === 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10, color: C.mid, fontSize: 12.5 }}>No case-linked local support requests are open for this case.</div>
                  )}
                  {detailTab === 'tasks' && topTasks.length === 0 && (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 12, marginTop: 10, color: C.mid, fontSize: 12.5 }}>No staff step details are open right now.</div>
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
                            <span style={{ background: C.sageFaint, color: C.sage, borderRadius: 999, padding: '3px 8px', fontSize: 10.5, fontWeight: 800 }}>{task.playbook?.automationShortLabel || 'Work'}</span>
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
                      {task.playbook?.funeralHomeEligible && taskIsOpen(task) && (
                        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
                          <button disabled={updating === task.id + 'waiting'} onClick={() => { setTaskDraft({ task, status: 'waiting', label: 'Waiting update', prompt: taskActionPrompt('waiting', task, 'funeral_home'), draft, output, proofDestination }); setTaskDraftNote(''); }} style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Set waiting</button>
                          <button disabled={updating === task.id + 'blocked'} onClick={() => { setTaskDraft({ task, status: 'blocked', label: 'Request this from family', prompt: taskActionPrompt('blocked', task, 'funeral_home'), draft, output, proofDestination }); setTaskDraftNote(draft); }} style={{ border: `1px solid ${C.amber}55`, background: C.amberFaint, color: C.amber, borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Request from family</button>
                          <button disabled={updating === task.id + 'handle_for_family'} onClick={() => { setTaskDraft({ task, status: 'handled', label: 'Save proof + close', prompt: 'Add the proof note that shows what happened, then close this client step so it leaves the active queue.', draft, output, proofDestination }); setTaskDraftNote(''); }} style={{ border: 'none', background: C.sage, color: '#fff', borderRadius: 9, padding: '7px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{updating === task.id + 'handle_for_family' ? 'Saving...' : 'Close with proof'}</button>
                        </div>
                      )}
                      {taskIsClosed(task) && (
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
                subtitle: 'Generated from the case record',
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
      : 'Open next case step';
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
          <div style={{ fontSize: 22, marginTop: 3 }}>Risk, replies, and next case step.</div>
        </div>
        <div style={{ color: C.mid, fontSize: 12.5 }}>{riskItems.length} at risk | {inboxItems.length} updates | {caseItems.length} next cases</div>
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
            title={firstCase ? (firstCase.caseItem.deceased_name || firstCase.caseItem.estate_name || firstCase.caseItem.name || 'Family case') : 'No open case steps'}
            body={firstCase ? `${sharedTaskTitle(firstCase.task)} - ${sharedTaskNext(firstCase.task, 'funeral_home')}` : 'Nothing needs funeral-home action right now.'}
            cta={firstCase ? 'Open client steps' : ''}
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
  const proofDestination = taskDraft.proofDestination || taskProofDestination(task, { surface: 'case proof record' });
  const isSaving = updating === task.id + taskDraft.status || updating === task.id + 'handle_for_family';
  const canSave = !!String(taskDraftNote || '').trim() && !isSaving;
  const note = String(taskDraftNote || '').trim();
  const copyKey = taskDraft.status === 'blocked' ? 'task_request_' + task.id : 'task_output_' + task.id;
  const copyLabel = taskDraft.status === 'blocked' ? 'Copy family request' : 'Copy proof packet';
  const copiedLabel = taskDraft.status === 'blocked' ? 'Family request copied.' : 'Prepared output copied.';
  const saveLabel = taskDraft.status === 'handled'
    ? 'Done - save proof and close'
    : taskDraft.status === 'blocked'
      ? 'Save family request'
      : 'Waiting - save update';
  const previewTitle = taskDraft.status === 'blocked'
    ? 'Family request'
    : taskDraft.status === 'waiting'
      ? 'Waiting update'
      : 'Proof packet';
  const previewPurpose = taskDraft.status === 'blocked'
    ? 'Copy this reviewed request into email, text, or the case file. Nothing sends automatically from Passage.'
    : taskDraft.status === 'waiting'
      ? 'Use this reviewed update to show what is waiting, who owns it, and when the next follow-up is expected.'
      : 'Review this branded proof packet before saving it to the case record or printing it for the arrangement file.';

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
      <div role="dialog" aria-modal="true" aria-label="Update case step" onClick={event => event.stopPropagation()} style={{ width: 'min(760px, 100%)', maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', background: C.sageFaint, border: `1px solid ${C.sage}22`, borderRadius: 16, padding: 16, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <div>
            <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 900 }}>{taskDraft.label}</div>
            <div style={{ color: C.ink, fontSize: 17, fontWeight: 900, lineHeight: 1.25, marginTop: 3 }}>{sharedTaskTitle(task)}</div>
          </div>
          <button onClick={onClose} aria-label="Close action dialog" style={{ border: `1px solid ${C.border}`, background: C.card, color: C.mid, borderRadius: 999, width: 32, height: 32, fontFamily: 'Georgia,serif', fontWeight: 900, cursor: 'pointer' }}>x</button>
        </div>
        <div style={{ color: C.mid, fontSize: 12.3, lineHeight: 1.45, marginTop: 6 }}>{taskDraft.prompt}</div>
        <div style={{ background: C.sageFaint, border: `1px solid ${C.sage}33`, borderRadius: 14, padding: '11px 12px', marginTop: 9 }}>
          <div style={{ color: C.sage, fontSize: 10.5, letterSpacing: '.13em', textTransform: 'uppercase', fontWeight: 900, marginBottom: 5 }}>What happens next</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 8 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 9px' }}>
              <div style={{ color: C.sage, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Action button</div>
              <div style={{ color: C.ink, fontSize: 12.1, lineHeight: 1.35, fontWeight: 900, marginTop: 3 }}>{saveLabel}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 9px' }}>
              <div style={{ color: C.sage, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Owner</div>
              <div style={{ color: C.ink, fontSize: 12.1, lineHeight: 1.35, fontWeight: 900, marginTop: 3 }}>{task.assigned_to_name || task.assigned_to_email || 'Next-step owner'}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 9px' }}>
              <div style={{ color: C.sage, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Current status</div>
              <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.35, fontWeight: 800, marginTop: 3 }}>{taskExpectedUpdate(task, 'funeral_home')}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 11, padding: '8px 9px' }}>
              <div style={{ color: C.sage, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>Proof/status</div>
              <div style={{ color: C.mid, fontSize: 12, lineHeight: 1.35, fontWeight: 800, marginTop: 3 }}>Proof saves to the case record; any family-facing update still requires approval.</div>
            </div>
          </div>
          <div style={{ color: C.mid, fontSize: 11.8, lineHeight: 1.4, marginTop: 8 }}><strong style={{ color: C.ink }}>Where proof saves:</strong> {proofDestination}</div>
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
            This is the proof packet that closes the client step. Review it, copy or print it for the arrangement file if needed, then close the step so the waiting/request actions disappear.
          </div>
        )}
        {taskDraft.status === 'blocked' && (
          <div style={{ background: C.card, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: '8px 9px', color: C.mid, fontSize: 11.8, lineHeight: 1.45, marginTop: 8 }}>
            This is saved as a family help request. Copy it for email/text when demoing; Passage does not send live messages here.
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
            const kind = item.kind === 'vendor' ? 'Vendor' : item.kind === 'message' ? 'Message' : item.kind === 'task' ? 'Client step' : 'Case update';
            const urgent = item.attentionLevel === 'urgent';
            const waiting = item.attentionLevel === 'waiting';
            const tone = urgent ? C.rose : waiting ? C.amber : C.sage;
            const bg = urgent ? C.roseFaint : waiting ? C.amberFaint : C.sageFaint;
            return (
              <button key={`${item.caseId}_${item.id}`} onClick={() => onOpenCase(item.caseId)} style={{ textAlign: 'left', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', border: `1px solid ${urgent ? C.rose + '44' : C.border}`, borderLeft: `5px solid ${tone}`, background: C.bg, borderRadius: 12, padding: 12, fontFamily: 'Georgia,serif', cursor: 'pointer' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: tone, background: bg, borderRadius: 999, padding: '3px 8px', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 900 }}>{item.attentionLabel || kind}</span>
                    <span style={{ color: C.soft, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 900 }}>{item.caseName} - {item.locationName}</span>
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
        <div style={{ color: C.mid, fontSize: 12.5 }}>No report rows yet. Data appears here as work is assigned, handled, and logged.</div>
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
