import { createClient } from '@supabase/supabase-js';
import { enrichTaskWithPlaybook, partnerTaskPriority } from '../../lib/taskPlaybooks';
import { isPassageAdmin } from '../../lib/adminAccess';
import { buildCommunicationCenter, selectNextTask } from '../../lib/communicationCenter';

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

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
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
  if (organizationIds.length === 0) return res.status(200).json({ organizations: [], cases: [], isPassageAdmin: adminMode });

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
    .select('id,name,deceased_name,estate_name,coordinator_name,coordinator_email,coordinator_phone,status,activation_status,organization_id,organization_case_reference,mode,setup_stage,created_at,updated_at')
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
  const { data: organizationMemberData } = await admin
    .from('organization_members')
    .select('organization_id, role, status, email')
    .in('organization_id', organizationIds)
    .eq('status', 'active');
  if (organizationMemberData?.length) allMembers = organizationMemberData;

  let tasks = [];
  let statusEvents = [];
  let communications = [];
  let vendorRequests = [];
  let familyParticipants = [];
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
  }

  const cases = visibleWorkflows.map(w => {
    const caseTasks = tasks.filter(t => t.workflow_id === w.id);
    const caseStatusEvents = statusEvents.filter(e => e.workflow_id === w.id);
    const caseCommunications = communications.filter(c => c.workflow_id === w.id);
    const caseVendorRequests = vendorRequests.filter(v => v.workflow_id === w.id);
    const caseFamilyParticipants = familyParticipants.filter(p => p.workflow_id === w.id);
    const partnerTasks = caseTasks.filter(t => t.playbook?.funeralHomeEligible);
    return {
      ...w,
      tasks: caseTasks,
      activity: caseStatusEvents.slice(0, 6),
      communications: caseCommunications.slice(0, 8),
      vendorRequests: caseVendorRequests.slice(0, 8),
      familyParticipants: caseFamilyParticipants.slice(0, 8),
      partnerTasks,
      nextPartnerTask: selectNextTask(partnerTasks.length ? partnerTasks : caseTasks, 'funeral_home'),
      communicationCenter: buildCommunicationCenter({
        tasks: caseTasks,
        statusEvents: caseStatusEvents,
        communications: caseCommunications,
        vendorRequests: caseVendorRequests,
        limit: 10,
      }),
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
      scope: directorRole ? 'all_cases' : 'assigned_work',
      assignedOpen: assigned.filter(task => !isHandledStatus(task.status)).length,
      handled: handledByMember.length,
      waiting: assigned.filter(task => isWaitingStatus(task.status)).length,
      blocked: assigned.filter(task => ['blocked', 'failed', 'needs_review'].includes(String(task.status || '').toLowerCase())).length,
    };
  });

  const locations = Array.from(new Set(cases.map(locationNameForWorkflow)));
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
    marketplace: {
      requests: allVendorRequests.length,
      estimatedValue: allVendorRequests.reduce((sum, request) => sum + valueFromRequest(request, 'final_value') + (!request.final_value ? valueFromRequest(request, 'estimated_value') : 0), 0),
      funeralHomeShare: allVendorRequests.reduce((sum, request) => sum + valueFromRequest(request, 'funeral_home_share_amount'), 0),
      passageShare: allVendorRequests.reduce((sum, request) => sum + valueFromRequest(request, 'passage_share_amount'), 0),
    },
    byLocation,
    byEmployee,
  };

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
