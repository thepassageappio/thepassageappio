import { createClient } from '@supabase/supabase-js';

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
    { data: people },
    { data: actions },
    { data: announcements },
  ] = await Promise.all([
    admin.from('outcomes').select('*').eq('estate_id', id).order('position'),
    admin.from('tasks').select('*').eq('workflow_id', id).order('position'),
    admin.from('estate_events').select('*').eq('estate_id', id).order('created_at', { ascending: false }).limit(8),
    admin.from('workflow_events').select('*').eq('workflow_id', id).order('date', { ascending: true }),
    admin.from('people').select('*').eq('estate_id', id).order('created_at', { ascending: true }),
    admin.from('workflow_actions').select('*').eq('workflow_id', id).order('sort_order', { ascending: true }),
    admin.from('announcements').select('*').eq('estate_id', id).order('created_at', { ascending: false }).limit(10),
  ]);

  await admin.from('workflows').update({ last_viewed_at: new Date().toISOString() }).eq('id', id).catch(() => {});

  return res.status(200).json({
    estate,
    outcomes: outcomes || [],
    tasks: tasks || [],
    events: events || [],
    serviceEvents: serviceEvents || [],
    people: people || [],
    actions: actions || [],
    announcements: announcements || [],
  });
}
