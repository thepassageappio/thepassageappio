import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import { recordTaskCommunicationEvent } from '../../../lib/communicationEvents';
import { vendorCategoryLabel } from '../../../lib/vendors';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok || !auth.user) return res.status(auth.status || 401).json({ error: auth.error || 'Please sign in first.' });

  const requestId = String(req.body?.requestId || '');
  const action = String(req.body?.action || '').toLowerCase();
  if (!isUuid(requestId)) return res.status(400).json({ error: 'Choose a vendor request.' });
  if (!['approve_quote', 'decline_quote'].includes(action)) return res.status(400).json({ error: 'Choose a valid quote decision.' });

  const { data: request, error } = await admin
    .from('vendor_requests')
    .select('id,workflow_id,task_id,task_title,status,urgency,estimated_value,final_value,vendor_note,payment_collection_status,vendors(business_name,category),workflows(id,user_id,coordinator_email,organization_id)')
    .eq('id', requestId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!request) return res.status(404).json({ error: 'Vendor request not found.' });

  const allowed = await userCanAccessWorkflow(auth.user, request.workflows);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to this family record.' });

  if (request.status !== 'accepted' && action === 'approve_quote') {
    return res.status(409).json({ error: 'A vendor quote must be ready before it can be accepted.' });
  }

  const now = new Date().toISOString();
  const nextStatus = action === 'approve_quote' ? 'in_progress' : 'declined';
  const update = {
    status: nextStatus,
    in_progress_at: action === 'approve_quote' ? now : null,
    completed_at: null,
    payment_collection_status: action === 'approve_quote' ? 'tracking_only' : 'waived',
    updated_at: now,
  };
  const { error: updateError } = await admin.from('vendor_requests').update(update).eq('id', request.id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  const vendorName = request.vendors?.business_name || 'Vendor';
  const category = vendorCategoryLabel(request.vendors?.category);
  const value = Number(request.final_value || request.estimated_value || 0);
  const detail = action === 'approve_quote'
    ? `${vendorName} quote accepted for ${request.task_title || category}. ${value > 0 ? `Tracked value: $${Math.round(value)}.` : 'Value not recorded yet.'}`
    : `${vendorName} quote was not accepted for ${request.task_title || category}; another local option is needed.`;

  await recordTaskCommunicationEvent({
    verb: action === 'approve_quote' ? 'update' : 'escalate',
    workflowId: request.workflow_id,
    taskId: request.task_id,
    taskTitle: request.task_title,
    status: action === 'approve_quote' ? 'acknowledged' : 'blocked',
    actor: auth.user.email || 'Family coordinator',
    actorRole: request.workflows?.organization_id ? 'funeral_home' : 'family_coordinator',
    channel: 'vendor',
    recipient: vendorName,
    recipientRole: 'vendor',
    detail,
    visibility: 'family_funeral_home',
  });

  const { data: updated } = await admin
    .from('vendor_requests')
    .select('id,vendor_id,task_id,task_title,status,urgency,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,vendor_note,payment_collection_status,vendors(business_name,category)')
    .eq('id', request.id)
    .maybeSingle();

  return res.status(200).json({ success: true, request: updated || { ...request, ...update } });
}
