import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = createClient(url, anon);
const admin = createClient(url, service);

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in to view participating estates.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user?.email) {
    return res.status(401).json({ error: 'Your session could not be verified.' });
  }

  const email = userData.user.email.toLowerCase();

  try {
    const [{ data: actions }, { data: tasks }, { data: people }] = await Promise.all([
      admin.from('workflow_actions')
        .select('id, workflow_id, action_type, subject, body, status, delivery_status, recipient_email, recipient_phone, created_at, sent_at')
        .ilike('recipient_email', email)
        .order('created_at', { ascending: false }),
      admin.from('tasks')
        .select('id, workflow_id, title, status, assigned_to_name, assigned_to_email, completed_at, created_at')
        .ilike('assigned_to_email', email)
        .order('created_at', { ascending: false }),
      admin.from('people')
        .select('id, owner_id, first_name, last_name, email, relationship, estate_role_label, participant_status, participant_discount_offered, created_at')
        .ilike('email', email)
        .order('created_at', { ascending: false }),
    ]);

    const workflowIds = unique([
      ...(actions || []).map(a => a.workflow_id),
      ...(tasks || []).map(t => t.workflow_id),
    ]);

    let workflows = [];
    let events = [];
    if (workflowIds.length > 0) {
      const [{ data: wfData }, { data: eventData }] = await Promise.all([
        admin.from('workflows')
          .select('id, name, deceased_name, coordinator_name, coordinator_email, status, path, activation_status, created_at, updated_at')
          .in('id', workflowIds),
        admin.from('workflow_events')
          .select('id, workflow_id, event_type, name, date, time, location_name, location_address, notes')
          .in('workflow_id', workflowIds)
          .order('date', { ascending: true }),
      ]);
      workflows = wfData || [];
      events = eventData || [];
    }

    const estates = workflows.map(w => ({
      ...w,
      role: (people || []).find(p => p.email && p.email.toLowerCase() === email)?.estate_role_label ||
        (people || []).find(p => p.email && p.email.toLowerCase() === email)?.relationship ||
        'Participant',
      actions: (actions || []).filter(a => a.workflow_id === w.id),
      tasks: (tasks || []).filter(t => t.workflow_id === w.id),
      events: events.filter(e => e.workflow_id === w.id),
    }));

    return res.status(200).json({
      email,
      estates,
      contacts: people || [],
      discountEligible: (people || []).some(p => p.participant_discount_offered),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Participant context could not be loaded.' });
  }
}
