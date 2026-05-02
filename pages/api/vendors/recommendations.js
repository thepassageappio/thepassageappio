import { createClient } from '@supabase/supabase-js';
import { categoryForTask } from '../../../lib/vendors';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

async function userCanViewWorkflow(user, workflow) {
  if (!user?.email || !workflow) return false;
  const email = user.email.toLowerCase();
  if (workflow.user_id === user.id) return true;
  if (workflow.coordinator_email && workflow.coordinator_email.toLowerCase() === email) return true;
  const [{ data: access }, { data: member }] = await Promise.all([
    admin.from('estate_access').select('id').eq('workflow_id', workflow.id).ilike('email', email).neq('status', 'revoked').limit(1),
    workflow.organization_id ? admin.from('organization_members').select('id').eq('organization_id', workflow.organization_id).ilike('email', email).eq('status', 'active').limit(1) : Promise.resolve({ data: [] }),
  ]);
  return !!access?.length || !!member?.length;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(200).json({ vendors: [], category: '' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Session could not be verified.' });

  const workflowId = req.query.workflowId;
  const taskId = req.query.taskId;
  const taskTitleParam = String(req.query.taskTitle || '');
  if (!isUuid(workflowId)) return res.status(400).json({ error: 'Missing estate.' });

  const [{ data: workflow }, { data: task }] = await Promise.all([
    admin.from('workflows').select('id,user_id,coordinator_email,organization_id,coordinator_phone,organizations(marketplace_enabled)').eq('id', workflowId).maybeSingle(),
    isUuid(taskId) ? admin.from('tasks').select('id,title,description,workflow_id').eq('id', taskId).eq('workflow_id', workflowId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const allowed = await userCanViewWorkflow(userData.user, workflow);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to this estate.' });
  if (workflow.organization_id && workflow.organizations?.marketplace_enabled === false) {
    return res.status(200).json({ vendors: [], category: '' });
  }

  const category = categoryForTask(task || taskTitleParam);
  if (!category) return res.status(200).json({ vendors: [], category: '' });

  const { data: preferredRows } = workflow.organization_id ? await admin
    .from('funeral_home_preferred_vendors')
      .select('vendor_id, vendors(id,business_name,category,short_description,zip_codes_served,rush_supported,rush_window_hours,planned_supported,contact_email,contact_phone,website,status,marketplace_fee_percent,passage_rev_share_percent,funeral_home_rev_share_percent,estimated_value,estimated_transaction_value,family_review_snippet,review_count,average_rating,recently_helped_count)')
    .eq('organization_id', workflow.organization_id)
    .eq('category', category)
    .eq('active', true)
    .limit(2) : { data: [] };

  const preferred = (preferredRows || [])
    .map((row) => row.vendors)
    .filter((vendor) => vendor && vendor.status === 'active')
    .map((vendor) => ({ ...vendor, preferred_by_funeral_home: true }));

  let vendors = preferred.slice(0, 2);
  if (vendors.length < 2) {
    const exclude = vendors.map((v) => v.id);
    let query = admin.from('vendors')
      .select('id,business_name,category,short_description,zip_codes_served,rush_supported,rush_window_hours,planned_supported,contact_email,contact_phone,website,status,marketplace_fee_percent,passage_rev_share_percent,funeral_home_rev_share_percent,estimated_value,estimated_transaction_value,family_review_snippet,review_count,average_rating,recently_helped_count')
      .eq('category', category)
      .eq('status', 'active')
      .order('rush_supported', { ascending: false })
      .limit(2 - vendors.length);
    if (exclude.length) query = query.not('id', 'in', `(${exclude.join(',')})`);
    const { data } = await query;
    vendors = vendors.concat((data || []).map((vendor) => ({ ...vendor, preferred_by_funeral_home: false }))).slice(0, 2);
  }

  const { data: requestRows } = await admin
    .from('vendor_requests')
    .select('id,vendor_id,task_id,task_title,status,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,payment_collection_status,vendors(business_name,category)')
    .eq('workflow_id', workflowId)
    .order('requested_at', { ascending: false })
    .limit(12);
  const requests = (requestRows || [])
    .filter((request) => {
      const requestCategory = request.vendors?.category;
      if (requestCategory && requestCategory !== category) return false;
      if (task?.id && request.task_id) return request.task_id === task.id;
      if (taskTitleParam && request.task_title) return request.task_title.toLowerCase() === taskTitleParam.toLowerCase();
      return true;
    })
    .slice(0, 3);

  return res.status(200).json({ vendors, category, requests });
}
