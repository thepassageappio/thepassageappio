import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import { recordStatusEvent } from '../../../lib/taskStatus';
import { categoryForTask, vendorCategoryLabel } from '../../../lib/vendors';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, service);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

async function userCanAccessWorkflow(user, workflow) {
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

async function sendVendorEmail({ vendor, workflow, request, taskTitle }) {
  if (!process.env.RESEND_API_KEY || !vendor.contact_email) return false;
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const acceptUrl = `${BASE_URL}/api/vendorRequests/respond?token=${request.response_token}&status=accepted`;
  const declineUrl = `${BASE_URL}/api/vendorRequests/respond?token=${request.response_token}&status=declined`;
  const html = `
    <div style="font-family:Georgia,serif;background:#f6f3ee;padding:24px">
      <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e4ddd4;border-radius:16px;padding:24px">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6b8f71;font-weight:800">Passage request</div>
        <h1 style="font-weight:400;color:#1a1916;font-size:25px;line-height:1.25">A family asked for help with ${taskTitle || vendorCategoryLabel(vendor.category)}.</h1>
        <p style="color:#6a6560;line-height:1.6">This request came through Passage so the family and any connected funeral home can see what is waiting and what is handled.</p>
        <p style="color:#1a1916;line-height:1.6"><strong>Family case:</strong> ${workflow.deceased_name || workflow.estate_name || workflow.name || 'Family case'}<br/><strong>Task:</strong> ${taskTitle || vendorCategoryLabel(vendor.category)}<br/><strong>Urgency:</strong> ${request.urgency === 'rush' ? 'Rush' : 'Planned'}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
          <a href="${acceptUrl}" style="background:#6b8f71;color:white;text-decoration:none;border-radius:10px;padding:11px 14px;font-weight:800">Accept request</a>
          <a href="${declineUrl}" style="background:#fff;color:#6a6560;text-decoration:none;border:1px solid #e4ddd4;border-radius:10px;padding:10px 14px;font-weight:800">Decline</a>
        </div>
      </div>
    </div>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [vendor.contact_email],
      subject: `Passage request: ${taskTitle || vendorCategoryLabel(vendor.category)}`,
      html,
    }),
  });
  return response.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok || !auth.user) return res.status(auth.status || 401).json({ error: auth.error || 'Please sign in first.' });

  const { workflowId, taskId, taskTitle, vendorId, urgency } = req.body || {};
  if (!isUuid(workflowId)) return res.status(400).json({ error: 'Missing estate.' });
  if (!isUuid(vendorId)) return res.status(400).json({ error: 'Choose a vendor.' });

  const [{ data: workflow }, { data: task }, { data: vendor }] = await Promise.all([
    admin.from('workflows').select('id,user_id,name,estate_name,deceased_name,coordinator_email,organization_id').eq('id', workflowId).maybeSingle(),
    isUuid(taskId) ? admin.from('tasks').select('id,title,workflow_id').eq('id', taskId).eq('workflow_id', workflowId).maybeSingle() : Promise.resolve({ data: null }),
    admin.from('vendors').select('*').eq('id', vendorId).eq('status', 'active').maybeSingle(),
  ]);
  if (!workflow) return res.status(404).json({ error: 'Estate not found.' });
  if (!vendor) return res.status(404).json({ error: 'Vendor is not available.' });
  const allowed = await userCanAccessWorkflow(auth.user, workflow);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to this estate.' });

  const resolvedTaskTitle = task?.title || String(taskTitle || vendorCategoryLabel(vendor.category));
  const category = categoryForTask(task || resolvedTaskTitle);
  if (category && category !== vendor.category) return res.status(400).json({ error: 'This vendor does not match this task.' });

  const { data: request, error } = await admin.from('vendor_requests').insert([{
    vendor_id: vendor.id,
    workflow_id: workflow.id,
    task_id: task?.id || null,
    task_title: resolvedTaskTitle,
    organization_id: workflow.organization_id || null,
    requested_by_user_id: auth.user.id,
    requested_by_email: auth.user.email,
    requested_by_name: auth.user.user_metadata?.full_name || auth.user.email,
    status: 'requested',
    urgency: urgency === 'rush' ? 'rush' : 'planned',
    referral_source: workflow.organization_id ? 'funeral_home' : 'passage',
    marketplace_fee_percent: vendor.marketplace_fee_percent,
    passage_rev_share_percent: vendor.passage_rev_share_percent,
    funeral_home_rev_share_percent: vendor.funeral_home_rev_share_percent,
    estimated_value: vendor.estimated_value || vendor.estimated_transaction_value || null,
    estimated_transaction_value: vendor.estimated_transaction_value,
  }]).select('*').single();
  if (error) return res.status(500).json({ error: error.message });

  const emailSent = await sendVendorEmail({ vendor, workflow, request, taskTitle: resolvedTaskTitle });
  const detail = `${vendorCategoryLabel(vendor.category)} help requested from ${vendor.business_name}. ${emailSent ? 'Vendor notified.' : 'Vendor request recorded.'} We'll coordinate this here.`;
  await admin.from('estate_events').insert([{
    estate_id: workflow.id,
    event_type: 'vendor_help_requested',
    title: `${vendorCategoryLabel(vendor.category)} help requested`,
    description: detail,
    actor: auth.user.email || 'Passage',
  }]).catch(() => {});
  await recordStatusEvent({
    workflowId: workflow.id,
    taskId: task?.id || null,
    status: 'waiting',
    actor: auth.user.email || 'Passage',
    channel: 'vendor',
    recipient: vendor.business_name,
    detail,
  });
  return res.status(200).json({ success: true, request });
}
