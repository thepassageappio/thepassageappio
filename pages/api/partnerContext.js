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
  if (userError || !userData?.user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const email = userData.user.email.toLowerCase();
  const { data: memberships, error: memberError } = await admin
    .from('organization_members')
    .select('organization_id, role, status, organizations(id,type,name,logo_url,primary_color,white_label_enabled,support_email,from_name)')
    .ilike('email', email)
    .eq('status', 'active');
  if (memberError) return res.status(500).json({ error: memberError.message });

  const organizationIds = (memberships || []).map(m => m.organization_id).filter(Boolean);
  if (organizationIds.length === 0) return res.status(200).json({ organizations: [], cases: [] });

  const { data: workflows, error: workflowError } = await admin
    .from('workflows')
    .select('id,name,deceased_name,coordinator_name,coordinator_email,status,activation_status,organization_id,organization_case_reference,created_at,updated_at')
    .in('organization_id', organizationIds)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (workflowError) return res.status(500).json({ error: workflowError.message });

  const workflowIds = (workflows || []).map(w => w.id);
  let tasks = [];
  if (workflowIds.length > 0) {
    const { data: taskData } = await admin
      .from('tasks')
      .select('id,workflow_id,title,status,last_action_at,last_actor,channel,recipient,assigned_to_name,assigned_to_email')
      .in('workflow_id', workflowIds)
      .order('last_action_at', { ascending: false, nullsFirst: false });
    tasks = taskData || [];
  }

  const cases = (workflows || []).map(w => ({
    ...w,
    tasks: tasks.filter(t => t.workflow_id === w.id),
  }));

  return res.status(200).json({
    organizations: memberships || [],
    cases,
  });
}
