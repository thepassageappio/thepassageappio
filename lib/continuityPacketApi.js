import { createClient } from '@supabase/supabase-js';
import { buildContinuityContext, buildContinuityPackets, demoContinuityInput } from './continuityPackets';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PACKET_ALIASES = {
  funeral_home_arrangement: 'funeral-home-arrangement',
  funeral_home: 'funeral-home-arrangement',
  arrangement: 'funeral-home-arrangement',
  bank_notification: 'agency-notification',
  ss_government: 'agency-notification',
  government_notifications: 'agency-notification',
  government: 'agency-notification',
  executor_summary: 'executor-summary',
  family_handoff: 'executor-summary',
  hospice_handoff: 'hospice-handoff',
  warm_path: 'hospice-handoff',
  family_event_one_pager: 'family-event-one-pager',
  event_one_pager: 'family-event-one-pager',
};

function authClient() {
  if (!url || !anon) return null;
  return createClient(url, anon);
}

function adminClient() {
  if (!url || !service) return null;
  return createClient(url, service);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function text(value, fallback = '') {
  const clean = String(value || '').trim();
  return clean || fallback;
}

function eventFromRow(row = {}) {
  return {
    title: row.title || row.name || row.event_type || 'Event',
    date: row.date || row.created_at || '',
    time: row.time || '',
    location: row.location_name || row.location_address || row.location || '',
  };
}

export function normalizePacketType(type) {
  const key = String(type || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return PACKET_ALIASES[key] || String(type || '').trim() || 'funeral-home-arrangement';
}

export function packetFileName(packet = {}) {
  return `${String(packet.title || packet.id || 'passage-packet')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'passage-packet'}.txt`;
}

export async function getRequestUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const client = authClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
}

async function canAccessWorkflow(admin, user, workflow) {
  if (!user?.id || !workflow?.id) return false;
  if (workflow.user_id === user.id) return true;
  const email = normalizeEmail(user.email);
  if (email && normalizeEmail(workflow.coordinator_email) === email) return true;

  const [{ data: estateAccess }, { data: orgMember }] = await Promise.all([
    admin
      .from('estate_access')
      .select('id')
      .eq('workflow_id', workflow.id)
      .ilike('email', email)
      .in('status', ['active', 'invited', 'accepted'])
      .limit(1)
      .maybeSingle(),
    workflow.organization_id
      ? admin
          .from('organization_members')
          .select('id')
          .eq('organization_id', workflow.organization_id)
          .ilike('email', email)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return Boolean(estateAccess?.id || orgMember?.id);
}

function inputFromWorkflow({ workflow, organization, tasks = [], serviceEvents = [] }) {
  const summary = workflow?.orchestration_summary && typeof workflow.orchestration_summary === 'object'
    ? workflow.orchestration_summary
    : {};
  const warm = summary.warm_path_context || summary.hospice_context || summary.planning_context || {};
  const estateFile = summary.estate_file || {};
  const missingTimeline = Array.isArray(summary.missing_timeline_watch) ? summary.missing_timeline_watch : [];
  const openTasks = (tasks || [])
    .filter(task => !['handled', 'completed', 'done', 'not_applicable', 'cancelled'].includes(String(task.status || '').toLowerCase()))
    .slice(0, 8)
    .map(task => `${task.title || 'Task'}${task.status ? ` - ${task.status}` : ''}${task.assigned_to_name ? ` - ${task.assigned_to_name}` : ''}`);

  return {
    familyName: workflow?.estate_name || workflow?.name || workflow?.deceased_name || 'Family',
    lovedOne: workflow?.deceased_name || workflow?.estate_name || workflow?.name || 'Loved one',
    coordinatorName: workflow?.coordinator_name || warm.family_coordinator || estateFile.family_coordinator || '',
    coordinatorEmail: workflow?.coordinator_email || '',
    coordinatorPhone: workflow?.coordinator_phone || '',
    caregiverName: warm.caregiver_name || warm.primary_caregiver || '',
    hospiceAgency: warm.hospice_agency || warm.hospiceAgency || '',
    hospiceContact: warm.hospice_contact || warm.hospiceContact || warm.hospital_or_hospice_contact || '',
    hospicePhone: warm.hospice_phone || warm.hospicePhone || '',
    funeralHomeName: organization?.name || summary.funeral_home_name || warm.funeral_home_name || '',
    funeralHomeContact: summary.funeral_home_contact || warm.funeral_home_contact || organization?.support_email || '',
    authorityContact: warm.authority_contact || warm.decision_maker || estateFile.healthcare_proxy || '',
    dispositionPreference: warm.disposition_preference || estateFile.disposition_preference || estateFile.wishes?.disposition || '',
    servicePreference: warm.service_preference || estateFile.service_preference || estateFile.wishes?.service || '',
    dateOfDeath: workflow?.date_of_death || warm.date_of_death || '',
    deathLocation: warm.death_location || warm.location || summary.location_name || '',
    caseReference: workflow?.organization_case_reference || '',
    events: (serviceEvents || []).map(eventFromRow),
    openTasks,
    missingItems: [
      ...missingTimeline,
      ...(openTasks.length ? [] : ['No open task list was supplied to the packet generator.']),
    ].filter(Boolean).slice(0, 8),
  };
}

export async function loadContinuityPacketSet(req, estateId) {
  const id = text(estateId);
  if (!id || /^demo[-_]?/i.test(id) || req.query?.demo === '1') {
    const input = demoContinuityInput();
    return {
      status: 200,
      source: 'demo',
      context: buildContinuityContext(input),
      packets: buildContinuityPackets(input),
      workflow: null,
      user: null,
    };
  }

  const admin = adminClient();
  if (!admin) return { status: 500, error: 'Supabase service role is not configured.' };
  const user = await getRequestUser(req);
  if (!user?.id) return { status: 401, error: 'Please sign in to generate packets from this case.' };

  const { data: workflow, error: workflowError } = await admin
    .from('workflows')
    .select('id,user_id,name,estate_name,deceased_name,date_of_death,coordinator_name,coordinator_email,coordinator_phone,organization_id,organization_case_reference,status,orchestration_summary')
    .eq('id', id)
    .maybeSingle();
  if (workflowError) return { status: 500, error: workflowError.message };
  if (!workflow || workflow.status === 'archived') return { status: 404, error: 'Case not found.' };
  if (!(await canAccessWorkflow(admin, user, workflow))) return { status: 403, error: 'You do not have access to this case.' };

  const [{ data: organization }, { data: tasks }, { data: serviceEvents }] = await Promise.all([
    workflow.organization_id
      ? admin.from('organizations').select('name,from_name,support_email').eq('id', workflow.organization_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('tasks').select('id,title,status,assigned_to_name,assigned_to_email,last_actor,last_action_at').eq('workflow_id', id).order('created_at', { ascending: true }).limit(120),
    admin.from('estate_events').select('id,event_type,name,title,date,time,location_name,location_address,notes,description,created_at').eq('estate_id', id).order('date', { ascending: true, nullsFirst: false }).limit(80),
  ]);

  const input = inputFromWorkflow({ workflow, organization, tasks: tasks || [], serviceEvents: serviceEvents || [] });
  return {
    status: 200,
    source: 'case',
    workflow: { id: workflow.id, name: workflow.name, organizationCaseReference: workflow.organization_case_reference || null },
    context: buildContinuityContext(input),
    packets: buildContinuityPackets(input),
    user,
  };
}

export function preparedPacketRecord({ estateId, packet, packetType, user, context }) {
  const now = new Date().toISOString();
  return {
    id: `${estateId || 'demo'}:${packet.id}`,
    estate_id: estateId || null,
    type: packetType || packet.id,
    version: 1,
    generated_at: now,
    generated_by: user?.id || null,
    data: {
      title: packet.title,
      description: packet.description,
      text: packet.text,
      context,
      approvalBoundary: 'Review before sharing outside the family record.',
      poweredBy: 'Passage | thepassageapp.io',
    },
    file_path: null,
    status: 'draft',
    created_at: now,
    persistence: 'prepared_from_spine',
    delivery: 'review_only',
    fileName: packetFileName(packet),
  };
}

export function packetForType(packets = [], packetType) {
  const normalized = normalizePacketType(packetType);
  return packets.find(packet => packet.id === normalized) || packets[0] || null;
}
