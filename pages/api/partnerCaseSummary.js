import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing case id.' });

  const { data: workflow, error: workflowError } = await admin
    .from('workflows')
    .select('id,name,estate_name,deceased_name,date_of_death,coordinator_name,coordinator_email,coordinator_phone,organization_id,organization_case_reference,mode,setup_stage')
    .eq('id', id)
    .maybeSingle();
  if (workflowError) return res.status(500).json({ error: workflowError.message });
  if (!workflow) return res.status(404).json({ error: 'Case not found.' });

  const { data: member } = await admin
    .from('organization_members')
    .select('id')
    .eq('organization_id', workflow.organization_id)
    .ilike('email', user.email)
    .eq('status', 'active')
    .limit(1);
  if (!member?.length) return res.status(403).json({ error: 'You do not have access to this case.' });

  const { data: organization } = await admin
    .from('organizations')
    .select('name,logo_url,from_name,support_email')
    .eq('id', workflow.organization_id)
    .maybeSingle();

  const [{ data: tasks }, { data: communications }, { data: serviceEvents }] = await Promise.all([
    admin.from('tasks').select('id,title,status,assigned_to_name,assigned_to_email,last_action_at,last_actor,notes').eq('workflow_id', id).order('created_at', { ascending: true }),
    admin.from('notification_log').select('id,channel,recipient_name,recipient_email,recipient_phone,subject,status,sent_at,delivered_at').eq('workflow_id', id).order('created_at', { ascending: false }).limit(8),
    admin.from('estate_events').select('id,event_type,title,description,created_at').eq('estate_id', id).order('created_at', { ascending: false }).limit(8),
  ]);

  return res.status(200).json({ workflow: Object.assign({}, workflow, { organizations: organization || null }), tasks: tasks || [], communications: communications || [], serviceEvents: serviceEvents || [] });
}
