import { createClient } from '@supabase/supabase-js';
import { recordStatusEvent } from '../../../lib/taskStatus';
import { vendorCategoryLabel } from '../../../lib/vendors';
import { calculateVendorEconomics } from '../../../lib/vendorEconomics';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function loadRequest(token) {
  if (!token) return null;
  const { data } = await admin
    .from('vendor_requests')
    .select('id,workflow_id,task_id,task_title,status,urgency,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,marketplace_fee_percent,funeral_home_rev_share_percent,payment_collection_status,organization_id,vendors(business_name,category,contact_email,contact_phone,website),workflows(deceased_name,estate_name,name,coordinator_name,coordinator_email,organizations(name))')
    .eq('response_token', token)
    .maybeSingle();
  return data;
}

async function notifyOwner(request, title, detail) {
  if (!process.env.RESEND_API_KEY) return;
  const recipients = Array.from(new Set([
    request.workflows?.coordinator_email,
  ].filter(Boolean)));
  if (!recipients.length) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: recipients,
      subject: title,
      html: `<div style="font-family:Georgia,serif;background:#f6f3ee;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e4ddd4;border-radius:16px;padding:24px"><div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6b8f71;font-weight:800">Passage local support</div><h1 style="font-weight:400;color:#1a1916;font-size:24px;line-height:1.25">${title}</h1><p style="color:#6a6560;line-height:1.7">${detail}</p><p style="color:#6b8f71;font-weight:800">We are tracking this in Passage.</p></div></div>`,
    }),
  }).catch(() => {});
}

export default async function handler(req, res) {
  const token = String(req.query.token || req.body?.token || '');
  if (!token) return res.status(400).json({ error: 'Missing request token.' });

  const request = await loadRequest(token);
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  if (req.method === 'GET') {
    if (!request.viewed_at) {
      const now = new Date().toISOString();
      await admin.from('vendor_requests').update({ viewed_at: now, updated_at: now }).eq('id', request.id);
      await admin.from('estate_events').insert([{
        estate_id: request.workflow_id,
        event_type: 'vendor_help_viewed',
        title: `${request.vendors?.business_name || 'Vendor'} viewed request`,
        description: `${vendorCategoryLabel(request.vendors?.category)} request for ${request.task_title || 'this task'} was viewed.`,
        actor: request.vendors?.business_name || 'Vendor',
      }]).catch(() => {});
      await recordStatusEvent({
        workflowId: request.workflow_id,
        taskId: request.task_id,
        status: 'waiting',
        actor: request.vendors?.business_name || 'Vendor',
        channel: 'vendor',
        recipient: request.vendors?.business_name || 'Vendor',
        detail: 'Vendor viewed the request. Passage is tracking the response.',
      });
      request.viewed_at = now;
    }
    return res.status(200).json({ request });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const action = String(req.body?.action || '').toLowerCase();
  if (!['accepted', 'in_progress', 'declined', 'completed'].includes(action)) {
    return res.status(400).json({ error: 'Choose a valid update.' });
  }

  const now = new Date().toISOString();
  const estimatedValue = Number(req.body?.estimatedValue || request.estimated_value || 0);
  const finalValue = Number(req.body?.finalValue || request.final_value || 0);
  const valueForFee = action === 'completed' ? finalValue : estimatedValue;
  const economics = calculateVendorEconomics({
    value: valueForFee,
    marketplaceFeePercent: request.marketplace_fee_percent,
    funeralHomeSharePercent: request.funeral_home_rev_share_percent || 6,
    hasFuneralHome: !!request.organization_id,
  });
  const update = {
    status: action,
    viewed_at: request.viewed_at || now,
    responded_at: ['accepted', 'declined'].includes(action) ? now : request.responded_at || now,
    in_progress_at: action === 'in_progress' ? now : request.in_progress_at,
    completed_at: action === 'completed' ? now : request.completed_at,
    estimated_value: estimatedValue > 0 ? estimatedValue : request.estimated_value,
    final_value: finalValue > 0 ? finalValue : request.final_value,
    platform_fee_amount: economics.platformFeeAmount,
    funeral_home_share_amount: economics.funeralHomeShareAmount,
    passage_share_amount: economics.passageShareAmount,
    payment_collection_status: action === 'completed' && finalValue > 0 ? 'passage_collects' : request.payment_collection_status || 'tracking_only',
    updated_at: now,
  };
  const { error } = await admin.from('vendor_requests').update(update).eq('id', request.id);
  if (error) return res.status(500).json({ error: error.message });

  const vendorName = request.vendors?.business_name || 'Vendor';
  const title = action === 'accepted'
    ? `${vendorName} accepted`
    : action === 'in_progress'
      ? `${vendorName} started work`
      : action === 'completed'
        ? `${vendorName} completed request`
        : `${vendorName} declined`;
  const detail = `${vendorCategoryLabel(request.vendors?.category)} request for ${request.task_title || 'this task'} was ${action.replace('_', ' ')}.`;
  await admin.from('estate_events').insert([{
    estate_id: request.workflow_id,
    event_type: action === 'completed' ? 'vendor_help_completed' : 'vendor_help_updated',
    title,
    description: detail,
    actor: vendorName,
  }]).catch(() => {});
  await recordStatusEvent({
    workflowId: request.workflow_id,
    taskId: request.task_id,
    status: action === 'completed' ? 'handled' : action === 'declined' ? 'blocked' : 'acknowledged',
    actor: vendorName,
    channel: 'vendor',
    recipient: vendorName,
    detail,
  });
  await notifyOwner(request, title, detail);
  const updated = await loadRequest(token);
  return res.status(200).json({ request: updated });
}
