import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = createClient(url, anon);
const admin = createClient(url, service);

function buildTaskStats(tasks) {
  const grouped = {};
  (tasks || []).forEach((task) => {
    const workflowId = task.workflow_id;
    if (!workflowId) return;
    if (!grouped[workflowId]) grouped[workflowId] = { total: 0, required: 0, completed: 0, assigned: 0, openTasks: [] };
    if (task.status !== 'not_applicable') grouped[workflowId].required += 1;
    grouped[workflowId].total += 1;
    const handled = ['handled', 'completed', 'done'].includes(task.status || '');
    if (task.status !== 'not_applicable' && handled) grouped[workflowId].completed += 1;
    if (task.status !== 'not_applicable' && (task.assigned_to_name || task.assigned_to_email)) grouped[workflowId].assigned += 1;
    if (task.status !== 'not_applicable' && !handled) {
      grouped[workflowId].openTasks.push({
        id: task.id,
        title: task.title,
        assignedTo: task.assigned_to_name || '',
        assignedEmail: task.assigned_to_email || '',
        dueDays: task.due_days_after_trigger ?? 0,
        createdAt: task.created_at,
      });
    }
  });
  return grouped;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!service) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in to view your estates.' });

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user?.id) return res.status(401).json({ error: 'Your session could not be verified.' });

  const email = String(user.email || '').toLowerCase();
  const workflowSelect = 'id, name, deceased_name, coordinator_name, coordinator_email, date_of_death, status, activation_status, trigger_type, trigger_token, confirmation_count, confirmed_by, path, mode, seat_status, estate_name, created_at, updated_at';

  const [{ data: owned, error: ownedError }, { data: coordinated, error: coordinatedError }] = await Promise.all([
    admin
      .from('workflows')
      .select(workflowSelect)
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false }),
    email
      ? admin
          .from('workflows')
          .select(workflowSelect)
          .ilike('coordinator_email', email)
          .neq('status', 'archived')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (ownedError) return res.status(500).json({ error: ownedError.message });
  if (coordinatedError) return res.status(500).json({ error: coordinatedError.message });

  const byId = new Map();
  [...(owned || []), ...(coordinated || [])].forEach((workflow) => {
    if (workflow?.id && !byId.has(workflow.id)) byId.set(workflow.id, workflow);
  });
  const workflows = Array.from(byId.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const workflowIds = workflows.map((workflow) => workflow.id);

  let taskStats = {};
  if (workflowIds.length > 0) {
    const { data: tasks, error: taskError } = await admin
      .from('tasks')
      .select('id, workflow_id, title, status, assigned_to_name, assigned_to_email, due_days_after_trigger, created_at')
      .in('workflow_id', workflowIds);
    if (taskError) return res.status(500).json({ error: taskError.message });
    taskStats = buildTaskStats(tasks || []);
  }

  return res.status(200).json({ workflows, taskStats });
}
