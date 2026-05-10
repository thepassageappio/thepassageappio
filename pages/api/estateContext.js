import { createClient } from '@supabase/supabase-js';
import { buildCoordinationSpine, selectNextTask } from '../../lib/communicationCenter';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

async function getUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
}

async function canAccessEstate(user, workflow) {
  if (!user?.id || !workflow?.id) return false;
  if (workflow.user_id === user.id) return true;
  const email = String(user.email || '').toLowerCase();
  if (email && String(workflow.coordinator_email || '').toLowerCase() === email) return true;

  const [{ data: access }, { data: member }] = await Promise.all([
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

  return Boolean(access?.id || member?.id);
}

async function fetchEstateParticipants(id) {
  const attempts = [
    'id,workflow_id,email,name,phone,role,invite_status,invite_token,accepted_at,created_at,updated_at',
    'id,workflow_id,email,role,invite_status,invite_token,accepted_at,created_at,updated_at',
    'id,workflow_id,email,invite_status,invite_token,created_at,updated_at',
  ];
  for (const selection of attempts) {
    const { data, error } = await admin
      .from('estate_participants')
      .select(selection)
      .eq('workflow_id', id)
      .order('created_at', { ascending: false })
      .limit(80);
    if (!error) return data || [];
  }
  return [];
}

function mergePeopleAndParticipants(people = [], participants = []) {
  const seen = new Set();
  const merged = [];
  function keyFor(row) {
    return String(row.email || row.id || row.name || '').trim().toLowerCase();
  }
  (people || []).forEach(person => {
    const key = keyFor(person);
    if (key) seen.add(key);
    merged.push(person);
  });
  (participants || []).forEach(participant => {
    const key = keyFor(participant);
    if (key && seen.has(key)) return;
    if (key) seen.add(key);
    merged.push({
      id: 'participant:' + (participant.id || participant.email || key),
      source: 'estate_participant',
      name: participant.name || participant.email || 'Family participant',
      email: participant.email || '',
      phone: participant.phone || '',
      role: participant.role || 'participant',
      relationship: participant.role || 'participant',
      estate_role_label: participant.role || 'participant',
      participant_status: participant.invite_status || '',
      accepted_at: participant.accepted_at || null,
      created_at: participant.created_at || null,
      updated_at: participant.updated_at || null,
    });
  });
  return merged;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!service) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const user = await getUser(req);
  if (!user?.id) return res.status(401).json({ error: 'Please sign in to open this estate.' });

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Missing estate id.' });

  const { data: estate, error: estateError } = await admin
    .from('workflows')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (estateError) return res.status(500).json({ error: estateError.message });
  if (!estate || estate.status === 'archived') return res.status(404).json({ error: 'Estate not found.' });
  if (!(await canAccessEstate(user, estate))) return res.status(403).json({ error: 'You do not have access to this estate.' });

  const [
    { data: outcomes },
    { data: tasks },
    { data: events },
    { data: serviceEvents },
    { data: serviceTimelineEvents },
    { data: people },
    { data: actions },
    { data: announcements },
    { data: statusEvents },
    { data: communications },
    { data: vendorRequests },
    participants,
  ] = await Promise.all([
    admin.from('outcomes').select('*').eq('estate_id', id).order('position'),
    admin.from('tasks').select('*').eq('workflow_id', id).order('created_at', { ascending: true }),
    admin.from('estate_events').select('*').eq('estate_id', id).order('created_at', { ascending: false }).limit(8),
    admin.from('workflow_events').select('*').eq('workflow_id', id).order('date', { ascending: true }),
    admin.from('estate_events').select('id,estate_id,event_type,name,title,date,time,location_name,location_address,notes,description').eq('estate_id', id).not('date', 'is', null).order('date', { ascending: true }).limit(80),
    admin.from('people').select('*').eq('estate_id', id).order('created_at', { ascending: true }),
    admin.from('workflow_actions').select('*').eq('workflow_id', id).order('sort_order', { ascending: true }),
    admin.from('announcements').select('*').eq('estate_id', id).order('created_at', { ascending: false }).limit(10),
    admin.from('task_status_events').select('*').eq('workflow_id', id).order('last_action_at', { ascending: false, nullsFirst: false }).limit(80),
    admin.from('notification_log').select('*').eq('workflow_id', id).order('created_at', { ascending: false }).limit(80),
    admin.from('vendor_requests').select('*, vendors(business_name,category,contact_email,contact_phone)').eq('workflow_id', id).order('requested_at', { ascending: false }).limit(40),
    fetchEstateParticipants(id),
  ]);

  await admin.from('workflows').update({ last_viewed_at: new Date().toISOString() }).eq('id', id).then(() => {}, () => {});

  const coordinationSpine = buildCoordinationSpine({
    tasks: tasks || [],
    statusEvents: statusEvents || [],
    communications: communications || [],
    vendorRequests: vendorRequests || [],
    estateEvents: events || [],
    limit: 16,
    role: 'family',
  });

  const seenServiceEvents = new Set();
  const mergedServiceEvents = [...(serviceEvents || []), ...(serviceTimelineEvents || [])]
    .filter(event => {
      const key = [event.event_type || event.type || event.name || event.title, event.date || '', event.time || '', event.location_name || ''].join('|');
      if (seenServiceEvents.has(key)) return false;
      seenServiceEvents.add(key);
      return true;
    })
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

  return res.status(200).json({
    estate,
    outcomes: outcomes || [],
    tasks: tasks || [],
    events: events || [],
    serviceEvents: mergedServiceEvents,
    people: mergePeopleAndParticipants(people || [], participants || []),
    participants: participants || [],
    actions: actions || [],
    announcements: announcements || [],
    statusEvents: statusEvents || [],
    communications: communications || [],
    vendorRequests: vendorRequests || [],
    coordinationSpine,
    nextTask: selectNextTask(tasks || [], 'family'),
  });
}
