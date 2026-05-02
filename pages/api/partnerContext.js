import { createClient } from '@supabase/supabase-js';
import { enrichTaskWithPlaybook, partnerTaskPriority } from '../../lib/taskPlaybooks';
import { isPassageAdmin } from '../../lib/adminAccess';

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
  const adminMode = isPassageAdmin(email);
  const { data: memberships, error: memberError } = await admin
    .from('organization_members')
    .select('organization_id, role, status, organizations(id,type,name,logo_url,primary_color,white_label_enabled,support_email,from_name)')
    .ilike('email', email)
    .eq('status', 'active');
  if (memberError) return res.status(500).json({ error: memberError.message });

  const organizationIds = (memberships || []).map(m => m.organization_id).filter(Boolean);
  if (organizationIds.length === 0) return res.status(200).json({ organizations: [], cases: [], isPassageAdmin: adminMode });

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
  let tasks = [];
  let statusEvents = [];
  let communications = [];
  let vendorRequests = [];
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
  }

  const cases = visibleWorkflows.map(w => ({
    ...w,
    tasks: tasks.filter(t => t.workflow_id === w.id),
    activity: statusEvents.filter(e => e.workflow_id === w.id).slice(0, 6),
    communications: communications.filter(c => c.workflow_id === w.id).slice(0, 8),
    vendorRequests: vendorRequests.filter(v => v.workflow_id === w.id).slice(0, 8),
    partnerTasks: tasks.filter(t => t.workflow_id === w.id && t.playbook?.funeralHomeEligible),
    waitingOnFamily: tasks.filter(t => t.workflow_id === w.id && /family|executor|coordinator/i.test(t.playbook?.waitingOn || '')),
    blockedTasks: tasks.filter(t => t.workflow_id === w.id && ['blocked', 'failed', 'needs_review'].includes(t.status || '')),
  }));

  return res.status(200).json({
    organizations: memberships || [],
    cases,
    isPassageAdmin: adminMode,
  });
}
