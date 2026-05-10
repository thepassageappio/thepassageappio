import { createClient } from '@supabase/supabase-js';
import { enrichTaskWithPlaybook, partnerTaskPriority } from '../../lib/taskPlaybooks';
import { isPassageAdmin } from '../../lib/adminAccess';
import { buildCoordinationSpine, selectNextTask } from '../../lib/communicationCenter';
import { orchestrateTasks } from '../../lib/taskOrchestration';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

function isHandledStatus(status) {
  return ['handled', 'completed', 'done', 'not_applicable', 'cancelled'].includes(String(status || '').toLowerCase());
}

function isWaitingStatus(status) {
  return ['sent', 'waiting', 'pending', 'assigned', 'acknowledged'].includes(String(status || '').toLowerCase());
}

function schemaColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('column') || message.includes('schema cache');
}

async function selectOrganizationMembers(organizationIds) {
  const selections = [
    'organization_id, role, status, email, display_name, title, location_scope, annual_salary, hourly_cost',
    'organization_id, role, status, email, display_name, title, location_scope',
    'organization_id, role, status, email',
  ];
  for (const selection of selections) {
    const { data, error } = await admin
      .from('organization_members')
      .select(selection)
      .in('organization_id', organizationIds)
      .eq('status', 'active');
    if (!error) return data || [];
    if (!schemaColumnError(error)) return [];
  }
  return [];
}

function locationNameForWorkflow(workflow) {
  const ref = String(workflow?.organization_case_reference || workflow?.case_reference || '');
  if (/MULTI-002/i.test(ref)) return 'Poughkeepsie';
  if (/MULTI/i.test(ref)) return 'Beacon';
  return workflow?.location_name || workflow?.branch_name || workflow?.funeral_home_location || 'Main location';
}

function valueFromRequest(request, field) {
  if (field === 'final_value' && request?.final_value_cents != null) return Number(request.final_value_cents || 0) / 100;
  return Number(request?.[field] || 0);
}

function moneyNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value || '').replace(/[$,\s]/g, '').trim();
  const number = Number(raw);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function caseFinancials(workflow) {
  return workflow?.orchestration_summary?.partner_financials || workflow?.partner_financials || {};
}

function caseValueNumber(workflow) {
  const financials = caseFinancials(workflow);
  return moneyNumber(financials.total_case_value || financials.case_value || financials.contract_value || financials.arrangement_value);
}

function prepaidValueNumber(workflow) {
  const financials = caseFinancials(workflow);
  return moneyNumber(financials.prepaid_amount || financials.policy_amount || financials.funded_amount);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function findPartnerForMembership(membership, partnerRows = []) {
  const org = membership?.organizations || {};
  const orgId = String(membership?.organization_id || org.id || '');
  const memberEmail = normalizeEmail(membership?.email);
  const supportEmail = normalizeEmail(org.support_email);
  const orgName = normalizeName(org.name);
  return (partnerRows || []).find(row => {
    const rowOrgId = String(row.organization_id || '');
    if (rowOrgId && orgId && rowOrgId === orgId) return true;
    const rowEmail = normalizeEmail(row.email || row.contact_email || row.support_email);
    if (rowEmail && (rowEmail === memberEmail || rowEmail === supportEmail)) return true;
    return orgName && normalizeName(row.name || row.brand_name || row.funeral_home_name) === orgName;
  }) || null;
}

function activationStatusFor(partner) {
  if (!partner) return 'no_partner_record';
  if (partner.subscribed_at) return 'active_paid';
  if (partner.trial_ends_at) {
    const trialEnds = new Date(partner.trial_ends_at).getTime();
    if (Number.isFinite(trialEnds) && trialEnds > Date.now()) return 'active_trial';
    if (Number.isFinite(trialEnds) && trialEnds <= Date.now()) return 'trial_expired';
  }
  return 'inactive';
}

function billingStatusFor(partner) {
  if (!partner) return 'not_configured';
  if (partner.subscribed_at) return 'paid';
  if (partner.stripe_customer_id) return 'stripe_pending';
  return 'not_configured';
}

function serializePartnerPlan(partner) {
  if (!partner) return null;
  return {
    id: partner.id || null,
    plan: partner.plan || null,
    monthlyFeeCents: Number(partner.monthly_fee_cents || 0),
    trialStartedAt: partner.trial_started_at || null,
    trialEndsAt: partner.trial_ends_at || null,
    subscribedAt: partner.subscribed_at || null,
    stripeCustomerId: partner.stripe_customer_id || null,
    familiesReferred: Number(partner.families_referred || 0),
    familiesActivated: Number(partner.families_activated || 0),
  };
}

function featureFlagsFor(membership, org, activationStatus) {
  const role = String(membership?.role || '').toLowerCase();
  const isManager = ['owner', 'admin', 'director', 'location_manager', 'manager'].includes(role);
  return {
    whiteLabelEnabled: !!org?.white_label_enabled,
    marketplaceEnabled: org?.marketplace_enabled !== false,
    canCreateCases: !['trial_expired', 'inactive'].includes(activationStatus),
    canViewReports: isManager,
    canManageBilling: role === 'owner',
  };
}

function isDemoPartnerEmail(email) {
  return ['demo@collinsffh.com', 'demo@collinsfuneralhome.com', 'maria@hvfg.demo'].includes(normalizeEmail(email));
}

function demoPartnerPayload(email, memberships = []) {
  const organizationRow = memberships?.[0] || {
    organization_id: 'demo-org-collins',
    role: 'director',
    status: 'active',
    email,
    organizations: { id: 'demo-org-collins', type: 'funeral_home', name: 'Collins Family Funeral Home', support_email: email },
  };
  const staff = [
    { email, role: 'director', scope: 'all_cases', status: 'active', annual_salary: '95000' },
    { email: 'maria@collinsffh.demo', role: 'location_manager', scope: 'main_location', status: 'active', annual_salary: '78000' },
    { email: 'robert@collinsffh.demo', role: 'staff', scope: 'assigned_work', status: 'active', hourly_cost: '31' },
  ];
  const cases = [
    {
      id: 'demo-collins-price',
      deceased_name: 'Eleanor Price',
      estate_name: 'Price family',
      coordinator_name: 'Michael Price',
      coordinator_email: 'michael.price@example.com',
      coordinator_phone: '845-555-0137',
      date_of_death: '2026-05-09',
      organization_case_reference: 'COL-1024',
      setup_stage: 'active',
      mode: 'red',
      path: 'red',
      status: 'active',
      orchestration_summary: { partner_financials: { total_case_value: '12400', is_prepaid: false, prepaid_amount: null } },
      tasks: [
        { id: 'demo-collins-task-1', workflow_id: 'demo-collins-price', title: 'Confirm cemetery plot details', description: 'Ask family for section, lot number, and deed photo before the arrangement meeting.', status: 'waiting', assigned_to_name: 'Robert Alvarez', assigned_to_email: 'robert@collinsffh.demo', created_at: '2026-05-08T13:00:00Z', last_action_at: '2026-05-08T14:30:00Z', proof_required: 'Family reply or cemetery record' },
        { id: 'demo-collins-task-2', workflow_id: 'demo-collins-price', title: 'Prepare the funeral home meeting summary', description: 'Organize dates, family contact, service preferences, and open questions into one prepared packet.', status: 'assigned', assigned_to_name: 'Maria Collins', assigned_to_email: 'maria@collinsffh.demo', created_at: '2026-05-08T15:00:00Z', proof_required: 'Prepared packet' },
        { id: 'demo-collins-task-3', workflow_id: 'demo-collins-price', title: 'Send obituary approval request', description: 'Send the family a clean approval request with the current obituary draft.', status: 'blocked', assigned_to_name: 'Robert Alvarez', assigned_to_email: 'robert@collinsffh.demo', created_at: '2026-05-08T10:00:00Z', proof_required: 'Family approval' },
        { id: 'demo-collins-task-4', workflow_id: 'demo-collins-price', title: 'Record hospital release confirmation', description: 'Hospital release was confirmed and saved for transportation.', status: 'handled', assigned_to_name: 'Maria Collins', assigned_to_email: 'maria@collinsffh.demo', created_at: '2026-05-08T09:00:00Z', last_action_at: '2026-05-08T11:00:00Z', proof_required: 'Release confirmation' },
      ],
      blockedTasks: [{ id: 'demo-collins-task-3', status: 'blocked' }],
      communications: [{ id: 'demo-collins-comm-1', status: 'sent' }, { id: 'demo-collins-comm-2', status: 'waiting' }],
      waitingOnFamily: [{ id: 'demo-collins-waiting-1', title: 'Cemetery plot details' }],
      vendorRequests: [{ id: 'demo-collins-vendor-1', task_title: 'Livestream support', status: 'accepted', requested_at: '2026-05-08T12:00:00Z', estimated_value: 650 }],
      activity: [{ id: 'demo-collins-act-1', status: 'handled', detail: 'Hospital release saved.' }, { id: 'demo-collins-act-2', status: 'waiting', detail: 'Waiting for cemetery plot confirmation.' }],
      serviceEvents: [{ id: 'demo-collins-service-1', name: 'Arrangement meeting', event_type: 'arrangement', date: '2026-05-12', time: '10:00 AM', location_name: 'Main location' }],
      coordinationSpine: {
        conversation: [],
        proof: [{ id: 'demo-collins-proof-1', title: 'Hospital release saved', detail: 'Release confirmation recorded by Maria.', statusLabel: 'handled' }],
        notifications: [{ id: 'demo-collins-note-1', title: 'Family update prepared', detail: 'Email route prepared; demo mode does not send.', statusLabel: 'prepared' }],
        attentionItems: [
          { id: 'demo-collins-attn-1', title: 'Family reply needed', detail: 'Cemetery plot details are waiting on Michael.', status: 'waiting', statusLabel: 'Waiting on family' },
          { id: 'demo-collins-attn-2', title: 'Obituary approval blocked', detail: 'Draft needs one family decision before it can be sent.', status: 'blocked', statusLabel: 'Needs help' },
        ],
        latest: [{ id: 'demo-collins-latest-1', title: 'Hospital release saved', detail: 'Proof is visible to staff and family.', statusLabel: 'handled' }],
      },
    },
    {
      id: 'demo-collins-reed',
      deceased_name: '',
      estate_name: 'Thomas Reed planning file',
      coordinator_name: 'Anna Reed',
      coordinator_email: 'anna.reed@example.com',
      organization_case_reference: 'COL-PN-220',
      setup_stage: 'preneed',
      mode: 'green',
      path: 'green',
      status: 'active',
      orchestration_summary: { partner_financials: { total_case_value: '7400', is_prepaid: true, prepaid_amount: '7400' } },
      tasks: [
        { id: 'demo-collins-green-1', workflow_id: 'demo-collins-reed', title: 'Collect pre-need preferences', description: 'Capture wishes, contacts, documents, and activation people before it is urgent.', status: 'assigned', assigned_to_name: 'Maria Collins', assigned_to_email: 'maria@collinsffh.demo', created_at: '2026-05-07T09:00:00Z', proof_required: 'Preferences saved' },
        { id: 'demo-collins-green-2', workflow_id: 'demo-collins-reed', title: 'Confirm activation contacts', description: 'Name who should be contacted when the family needs the plan activated.', status: 'waiting', assigned_to_name: 'Anna Reed', assigned_to_email: 'anna.reed@example.com', created_at: '2026-05-07T10:00:00Z', proof_required: 'Activation contact confirmed' },
      ],
      blockedTasks: [],
      communications: [],
      waitingOnFamily: [{ id: 'demo-collins-green-wait', title: 'Activation contacts' }],
      vendorRequests: [],
      activity: [],
      serviceEvents: [],
      coordinationSpine: { conversation: [], proof: [], notifications: [], attentionItems: [{ id: 'demo-collins-green-attn', title: 'Planning contact waiting', detail: 'Anna needs to confirm who can activate the plan.', status: 'waiting', statusLabel: 'Waiting on family' }], latest: [] },
    },
    {
      id: 'demo-collins-after',
      deceased_name: 'Marian Ellis',
      estate_name: 'Ellis aftercare',
      coordinator_name: 'Claire Ellis',
      coordinator_email: 'claire.ellis@example.com',
      organization_case_reference: 'COL-AF-031',
      setup_stage: 'aftercare',
      mode: 'after',
      path: 'after',
      status: 'active',
      orchestration_summary: { partner_financials: { total_case_value: '9800', is_prepaid: false, prepaid_amount: null } },
      tasks: [
        { id: 'demo-collins-after-1', workflow_id: 'demo-collins-after', title: 'Send aftercare document packet', description: 'Export certificates, service details, and proof summary for the executor.', status: 'handled', assigned_to_name: 'Robert Alvarez', assigned_to_email: 'robert@collinsffh.demo', created_at: '2026-05-05T09:00:00Z', last_action_at: '2026-05-06T12:00:00Z', proof_required: 'Packet delivered' },
        { id: 'demo-collins-after-2', workflow_id: 'demo-collins-after', title: 'Confirm thank-you card recipient list', description: 'Family needs one clean list before printing.', status: 'waiting', assigned_to_name: 'Claire Ellis', assigned_to_email: 'claire.ellis@example.com', created_at: '2026-05-06T09:00:00Z', proof_required: 'Recipient list approved' },
      ],
      blockedTasks: [],
      communications: [{ id: 'demo-collins-after-comm', status: 'delivered' }],
      waitingOnFamily: [{ id: 'demo-collins-after-wait', title: 'Recipient list' }],
      vendorRequests: [],
      activity: [{ id: 'demo-collins-after-act', status: 'handled' }],
      serviceEvents: [{ id: 'demo-collins-after-service', name: 'Memorial service', event_type: 'funeral', date: '2026-05-07', time: '11:00 AM', location_name: 'Collins Family Funeral Home' }],
      coordinationSpine: { conversation: [], proof: [], notifications: [], attentionItems: [{ id: 'demo-collins-after-attn', title: 'Aftercare list waiting', detail: 'Thank-you card list needs family approval.', status: 'waiting', statusLabel: 'Waiting on family' }], latest: [] },
    },
  ];
  const allTasks = cases.flatMap(item => item.tasks || []);
  const handled = allTasks.filter(task => isHandledStatus(task.status)).length;
  const waiting = allTasks.filter(task => isWaitingStatus(task.status)).length;
  const blocked = allTasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length;
  return {
    organizations: [organizationRow],
    partnerPlan: { plan: 'pilot', status: 'demo' },
    activationStatus: 'active_trial',
    billingStatus: 'demo',
    trialEndsAt: null,
    featureFlags: { whiteLabelEnabled: true, marketplaceEnabled: true, canCreateCases: true, canViewReports: true, canManageBilling: false },
    partnerContexts: [],
    cases,
    staff,
    reports: {
      activeCases: cases.length,
      totalTasks: allTasks.length,
      openTasks: allTasks.length - handled,
      handledTasks: handled,
      waitingTasks: waiting,
      blockedTasks: blocked,
      communicationsLogged: cases.reduce((sum, item) => sum + (item.communications || []).length, 0),
      assignmentsCoordinated: allTasks.filter(task => task.assigned_to_email || task.assigned_to_name).length,
      callsAvoided: 14,
      avgTasksPerEstate: Math.round((allTasks.length / cases.length) * 10) / 10,
      totalCaseValue: cases.reduce((sum, item) => sum + caseValueNumber(item), 0),
      prepaidCaseValue: cases.reduce((sum, item) => sum + prepaidValueNumber(item), 0),
      avgCaseValue: Math.round(cases.reduce((sum, item) => sum + caseValueNumber(item), 0) / cases.length),
      marketplace: { requests: 1, estimatedValue: 650, funeralHomeShare: 0, passageShare: 0 },
      byLocation: [{ location: 'Main location', cases: 3, openTasks: allTasks.length - handled, handledTasks: handled, waitingTasks: waiting, blockedTasks: blocked, callsAvoided: 14, referralValue: 650, funeralHomeShare: 0 }],
      byEmployee: staff.map(member => ({ email: member.email, role: member.role, scope: member.scope, assignedTasks: allTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === normalizeEmail(member.email)).length, openTasks: allTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === normalizeEmail(member.email) && !isHandledStatus(task.status)).length, handledTasks: allTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === normalizeEmail(member.email) && isHandledStatus(task.status)).length, waitingTasks: allTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === normalizeEmail(member.email) && isWaitingStatus(task.status)).length })),
    },
    isPassageAdmin: false,
    demoData: true,
    demoLabel: 'Demo data loaded for the Collins walkthrough. No email, SMS, or production record is changed by demo actions.',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (req.query.demo === '1' || req.query.demo === 'true') {
    return res.status(200).json(demoPartnerPayload('demo@collinsffh.com', []));
  }
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const email = userData.user.email.toLowerCase();
  const adminMode = isPassageAdmin(email);
  const { data: memberships, error: memberError } = await admin
    .from('organization_members')
    .select('organization_id, role, status, email, organizations(id,type,name,logo_url,primary_color,white_label_enabled,support_email,from_name)')
    .ilike('email', email)
    .eq('status', 'active');
  if (memberError) return res.status(500).json({ error: memberError.message });

  const organizationIds = (memberships || []).map(m => m.organization_id).filter(Boolean);
  if (organizationIds.length === 0) {
    if (isDemoPartnerEmail(email)) return res.status(200).json(demoPartnerPayload(email, memberships || []));
    return res.status(200).json({ organizations: [], cases: [], isPassageAdmin: adminMode });
  }

  let partnerRows = [];
  const { data: partnerData } = await admin
    .from('funeral_home_partners')
    .select('*')
    .limit(200);
  partnerRows = partnerData || [];

  const primaryMembership = (memberships || [])[0] || null;
  const primaryOrg = primaryMembership?.organizations || null;
  const primaryPartner = findPartnerForMembership(primaryMembership, partnerRows);
  const activationStatus = activationStatusFor(primaryPartner);
  const partnerPlan = serializePartnerPlan(primaryPartner);
  const featureFlags = featureFlagsFor(primaryMembership, primaryOrg, activationStatus);
  const partnerContexts = (memberships || []).map(membership => {
    const org = membership.organizations || {};
    const partner = findPartnerForMembership(membership, partnerRows);
    const status = activationStatusFor(partner);
    return {
      organizationId: membership.organization_id,
      organizationName: org.name || null,
      membership: { role: membership.role || null, status: membership.status || null, email: membership.email || null },
      partnerPlan: serializePartnerPlan(partner),
      activationStatus: status,
      billingStatus: billingStatusFor(partner),
      featureFlags: featureFlagsFor(membership, org, status),
    };
  });

  const { data: workflows, error: workflowError } = await admin
    .from('workflows')
    .select('id,name,deceased_name,estate_name,coordinator_name,coordinator_email,coordinator_phone,status,activation_status,organization_id,organization_case_reference,mode,setup_stage,date_of_death,orchestration_summary,created_at,updated_at')
    .in('organization_id', organizationIds)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (workflowError) return res.status(500).json({ error: workflowError.message });

  const visibleWorkflows = adminMode
    ? (workflows || [])
    : (workflows || []).filter(w => !/^DEMO/i.test(w.organization_case_reference || '') && !/^Demo - /i.test(w.name || ''));
  const workflowIds = visibleWorkflows.map(w => w.id);
  let allMembers = memberships || [];
  const organizationMemberData = await selectOrganizationMembers(organizationIds);
  if (organizationMemberData?.length) allMembers = organizationMemberData;

  let tasks = [];
  let statusEvents = [];
  let communications = [];
  let vendorRequests = [];
  let familyParticipants = [];
  let serviceEvents = [];
  if (workflowIds.length > 0) {
    const { data: taskData } = await admin
      .from('tasks')
      .select('id,workflow_id,title,status,last_action_at,last_actor,channel,recipient,assigned_to_name,assigned_to_email,notes,outcome_status')
      .in('workflow_id', workflowIds)
      .order('last_action_at', { ascending: false, nullsFirst: false });
    tasks = (taskData || []).map(enrichTaskWithPlaybook).sort((a, b) => partnerTaskPriority(a) - partnerTaskPriority(b));

    const { data: eventData } = await admin
      .from('task_status_events')
      .select('id,workflow_id,task_id,status,last_action_at,last_actor,channel,recipient,detail')
      .in('workflow_id', workflowIds)
      .order('last_action_at', { ascending: false, nullsFirst: false })
      .limit(80);
    statusEvents = eventData || [];

    const { data: communicationData } = await admin
      .from('notification_log')
      .select('id,workflow_id,channel,recipient_email,recipient_phone,recipient_name,subject,provider,provider_id,status,sent_at,delivered_at,error_message,created_at')
      .in('workflow_id', workflowIds)
      .order('created_at', { ascending: false })
      .limit(120);
    communications = communicationData || [];

    const { data: vendorRequestData } = await admin
      .from('vendor_requests')
      .select('id,workflow_id,task_id,task_title,status,urgency,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,platform_fee_amount,funeral_home_share_amount,passage_share_amount,payment_collection_status,vendors(business_name,category,contact_email,contact_phone)')
      .in('workflow_id', workflowIds)
      .order('requested_at', { ascending: false })
      .limit(120);
    vendorRequests = vendorRequestData || [];

    const familyParticipantAttempts = [
      'id,workflow_id,email,name,phone,role,invite_status,invite_token,accepted_at,created_at,updated_at',
      'id,workflow_id,email,role,invite_status,invite_token,accepted_at,created_at,updated_at',
      'id,workflow_id,email,invite_status,invite_token,created_at,updated_at',
    ];
    for (const selection of familyParticipantAttempts) {
      const { data: participantData, error: participantError } = await admin
        .from('estate_participants')
        .select(selection)
        .in('workflow_id', workflowIds)
        .order('created_at', { ascending: false })
        .limit(120);
      if (!participantError) {
        familyParticipants = participantData || [];
        break;
      }
    }
    const { data: serviceEventData } = await admin
      .from('estate_events')
      .select('id,estate_id,event_type,name,title,date,time,location_name,location_address,notes,description')
      .in('estate_id', workflowIds)
      .not('date', 'is', null)
      .limit(160);
    serviceEvents = serviceEventData || [];
  }

  const cases = visibleWorkflows.map(w => {
    const rawCaseTasks = tasks.filter(t => t.workflow_id === w.id);
    const caseStatusEvents = statusEvents.filter(e => e.workflow_id === w.id);
    const caseCommunications = communications.filter(c => c.workflow_id === w.id);
    const caseVendorRequests = vendorRequests.filter(v => v.workflow_id === w.id);
    const caseFamilyParticipants = familyParticipants.filter(p => p.workflow_id === w.id);
    const caseServiceEvents = serviceEvents.filter(e => e.estate_id === w.id);
    const orchestration = orchestrateTasks({
      tasks: rawCaseTasks,
      role: 'funeral_home',
      context: { workflow: w, estate: w, deathDate: w.date_of_death, serviceEvents: caseServiceEvents },
    });
    const caseTasks = orchestration.tasks;
    const partnerTasks = caseTasks.filter(t => t.playbook?.funeralHomeEligible);
    const partnerOrchestration = orchestrateTasks({
      tasks: partnerTasks.length ? partnerTasks : caseTasks,
      role: 'funeral_home',
      context: { workflow: w, estate: w, deathDate: w.date_of_death, serviceEvents: caseServiceEvents },
    });
    const coordinationSpine = buildCoordinationSpine({
      tasks: caseTasks,
      statusEvents: caseStatusEvents,
      communications: caseCommunications,
      vendorRequests: caseVendorRequests,
      limit: 10,
      role: 'funeral_home',
    });
    return {
      ...w,
      tasks: caseTasks,
      activity: caseStatusEvents.slice(0, 6),
      communications: caseCommunications.slice(0, 8),
      vendorRequests: caseVendorRequests.slice(0, 8),
      familyParticipants: caseFamilyParticipants.slice(0, 8),
      serviceEvents: caseServiceEvents,
      partnerTasks,
      orchestration,
      nextPartnerTask: partnerOrchestration.nextTask || selectNextTask(partnerTasks.length ? partnerTasks : caseTasks, 'funeral_home'),
      coordinationSpine,
      waitingOnFamily: caseTasks.filter(t => /family|executor|coordinator/i.test(t.playbook?.waitingOn || '')),
      blockedTasks: caseTasks.filter(t => ['blocked', 'failed', 'needs_review'].includes(t.status || '')),
    };
  });

  const allTasks = cases.flatMap(item => (item.tasks || []).map(task => ({ ...task, case_id: item.id, case_name: item.deceased_name || item.estate_name || item.name || 'Family case', location_name: locationNameForWorkflow(item) })));
  const allVendorRequests = cases.flatMap(item => (item.vendorRequests || []).map(request => ({ ...request, case_id: item.id, case_name: item.deceased_name || item.estate_name || item.name || 'Family case', location_name: locationNameForWorkflow(item) })));
  const allCommunications = cases.flatMap(item => item.communications || []);
  const activeTasks = allTasks.filter(task => !isHandledStatus(task.status));
  const handledTasks = allTasks.filter(task => isHandledStatus(task.status));
  const waitingTasks = allTasks.filter(task => isWaitingStatus(task.status));
  const blockedTasks = allTasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase()));

  const staff = (allMembers || []).map(member => {
    const memberEmail = String(member.email || '').toLowerCase();
    const assigned = allTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === memberEmail);
    const handledByMember = allTasks.filter(task => String(task.last_actor || '').toLowerCase() === memberEmail && isHandledStatus(task.status));
    const role = String(member.role || 'staff');
    const directorRole = /owner|admin|director|manager|location/i.test(role);
    return {
      email: member.email,
      role,
      organization_id: member.organization_id,
      display_name: member.display_name || null,
      title: member.title || null,
      location_scope: member.location_scope || null,
      annual_salary: member.annual_salary || null,
      hourly_cost: member.hourly_cost || null,
      scope: directorRole ? 'all_cases' : 'assigned_work',
      assignedOpen: assigned.filter(task => !isHandledStatus(task.status)).length,
      handled: handledByMember.length,
      waiting: assigned.filter(task => isWaitingStatus(task.status)).length,
      blocked: assigned.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length,
    };
  });

  const locations = Array.from(new Set(cases.map(locationNameForWorkflow)));
  const totalCaseValue = cases.reduce((sum, item) => sum + caseValueNumber(item), 0);
  const prepaidCaseValue = cases.reduce((sum, item) => sum + prepaidValueNumber(item), 0);
  const byLocation = locations.map(location => {
    const locationCases = cases.filter(item => locationNameForWorkflow(item) === location);
    const locationTasks = allTasks.filter(task => task.location_name === location);
    const locationVendorRequests = allVendorRequests.filter(request => request.location_name === location);
    const locationCommunications = locationCases.flatMap(item => item.communications || []);
    return {
      location,
      cases: locationCases.length,
      openTasks: locationTasks.filter(task => !isHandledStatus(task.status)).length,
      handledTasks: locationTasks.filter(task => isHandledStatus(task.status)).length,
      waitingTasks: locationTasks.filter(task => isWaitingStatus(task.status)).length,
      blockedTasks: locationTasks.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length,
      caseValue: locationCases.reduce((sum, item) => sum + caseValueNumber(item), 0),
      prepaidValue: locationCases.reduce((sum, item) => sum + prepaidValueNumber(item), 0),
      callsAvoided: locationCommunications.length + locationTasks.filter(task => task.assigned_to_email || task.assigned_to_name).length + locationVendorRequests.length,
      referralValue: locationVendorRequests.reduce((sum, request) => sum + valueFromRequest(request, 'final_value') + (!request.final_value ? valueFromRequest(request, 'estimated_value') : 0), 0),
      funeralHomeShare: locationVendorRequests.reduce((sum, request) => sum + valueFromRequest(request, 'funeral_home_share_amount'), 0),
    };
  });

  const byEmployee = staff.map(member => {
    const memberEmail = String(member.email || '').toLowerCase();
    const assigned = allTasks.filter(task => String(task.assigned_to_email || '').toLowerCase() === memberEmail);
    const acted = allTasks.filter(task => String(task.last_actor || '').toLowerCase() === memberEmail);
    return {
      email: member.email,
      role: member.role,
      scope: member.scope,
      annualSalary: member.annual_salary || null,
      hourlyCost: member.hourly_cost || null,
      assignedTasks: assigned.length,
      openTasks: assigned.filter(task => !isHandledStatus(task.status)).length,
      handledTasks: assigned.filter(task => isHandledStatus(task.status)).length + acted.filter(task => isHandledStatus(task.status)).length,
      waitingTasks: assigned.filter(task => isWaitingStatus(task.status)).length,
    };
  });

  const reports = {
    activeCases: cases.length,
    totalTasks: allTasks.length,
    openTasks: activeTasks.length,
    handledTasks: handledTasks.length,
    waitingTasks: waitingTasks.length,
    blockedTasks: blockedTasks.length,
    communicationsLogged: allCommunications.length,
    assignmentsCoordinated: allTasks.filter(task => task.assigned_to_email || task.assigned_to_name).length,
    callsAvoided: allCommunications.length + allTasks.filter(task => task.assigned_to_email || task.assigned_to_name).length + allVendorRequests.length,
    avgTasksPerEstate: cases.length ? Math.round((allTasks.length / cases.length) * 10) / 10 : 0,
    totalCaseValue,
    prepaidCaseValue,
    avgCaseValue: cases.length ? Math.round(totalCaseValue / cases.length) : 0,
    marketplace: {
      requests: allVendorRequests.length,
      estimatedValue: allVendorRequests.reduce((sum, request) => sum + valueFromRequest(request, 'final_value') + (!request.final_value ? valueFromRequest(request, 'estimated_value') : 0), 0),
      funeralHomeShare: allVendorRequests.reduce((sum, request) => sum + valueFromRequest(request, 'funeral_home_share_amount'), 0),
      passageShare: allVendorRequests.reduce((sum, request) => sum + valueFromRequest(request, 'passage_share_amount'), 0),
    },
    byLocation,
    byEmployee,
  };

  if (cases.length === 0 && isDemoPartnerEmail(email)) {
    return res.status(200).json(demoPartnerPayload(email, memberships || []));
  }

  return res.status(200).json({
    organizations: memberships || [],
    partnerPlan,
    activationStatus,
    billingStatus: billingStatusFor(primaryPartner),
    trialEndsAt: primaryPartner?.trial_ends_at || null,
    featureFlags,
    partnerContexts,
    cases,
    staff,
    reports,
    isPassageAdmin: adminMode,
  });
}
