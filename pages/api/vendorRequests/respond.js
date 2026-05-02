import { createClient } from '@supabase/supabase-js';
import { recordStatusEvent } from '../../../lib/taskStatus';
import { vendorCategoryLabel } from '../../../lib/vendors';
import { calculateVendorEconomics } from '../../../lib/vendorEconomics';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sendStatusEmail({ request, title, detail }) {
  if (!process.env.RESEND_API_KEY) return;
  const { data: workflow } = await admin
    .from('workflows')
    .select('id,coordinator_email,coordinator_name,organization_id,organizations(support_email,name)')
    .eq('id', request.workflow_id)
    .maybeSingle();
  const recipients = Array.from(new Set([
    workflow?.coordinator_email,
    workflow?.organizations?.support_email,
  ].filter(Boolean)));
  if (!recipients.length) return;
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: title,
      html: `<div style="font-family:Georgia,serif;background:#f6f3ee;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e4ddd4;border-radius:16px;padding:24px"><div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6b8f71;font-weight:800">Passage update</div><h1 style="font-weight:400;color:#1a1916;font-size:24px;line-height:1.25">${title}</h1><p style="color:#6a6560;line-height:1.7">${detail}</p><p style="color:#6b8f71;font-weight:800">We are tracking this in Passage.</p></div></div>`,
    }),
  }).catch(() => {});
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const token = String(req.query.token || req.body?.token || '');
  const status = String(req.query.status || req.body?.status || '').toLowerCase();
  if (!token) return res.status(400).send('Missing request token.');
  if (!['accepted', 'in_progress', 'declined', 'completed'].includes(status)) return res.status(400).send('Invalid request status.');

  const { data: request, error } = await admin
    .from('vendor_requests')
    .select('id,workflow_id,task_id,task_title,status,responded_at,in_progress_at,vendor_id,organization_id,marketplace_fee_percent,funeral_home_rev_share_percent,vendors(business_name,category)')
    .eq('response_token', token)
    .maybeSingle();
  if (error) return res.status(500).send(error.message);
  if (!request) return res.status(404).send('Request not found.');

  const now = new Date().toISOString();
  const finalValue = Number(req.query.finalValue || req.body?.finalValue || 0);
  const economics = calculateVendorEconomics({
    value: finalValue,
    marketplaceFeePercent: request.marketplace_fee_percent,
    funeralHomeSharePercent: request.funeral_home_rev_share_percent || 6,
    hasFuneralHome: !!request.organization_id,
  });
  const update = {
    status,
    responded_at: status === 'accepted' || status === 'declined' ? now : request.responded_at || now,
    in_progress_at: status === 'in_progress' ? now : request.in_progress_at,
    completed_at: status === 'completed' ? now : null,
    final_value: finalValue > 0 ? finalValue : null,
    platform_fee_amount: economics.platformFeeAmount,
    funeral_home_share_amount: economics.funeralHomeShareAmount,
    passage_share_amount: economics.passageShareAmount,
    payment_collection_status: status === 'completed' && finalValue > 0 ? 'passage_collects' : 'tracking_only',
    updated_at: now,
  };
  await admin.from('vendor_requests').update(update).eq('id', request.id);

  const vendorName = request.vendors?.business_name || 'Vendor';
  const category = vendorCategoryLabel(request.vendors?.category);
  const title = status === 'accepted'
    ? `${vendorName} accepted`
    : status === 'in_progress'
      ? `${vendorName} started work`
    : status === 'completed'
      ? `${vendorName} completed request`
      : `${vendorName} declined`;
  const detail = `${category} request for ${request.task_title || 'this task'} was ${status}.`;
  await admin.from('estate_events').insert([{
    estate_id: request.workflow_id,
    event_type: status === 'completed' ? 'vendor_help_completed' : 'vendor_help_updated',
    title,
    description: detail,
    actor: vendorName,
  }]).catch(() => {});
  await recordStatusEvent({
    workflowId: request.workflow_id,
    taskId: request.task_id,
    status: status === 'completed' ? 'handled' : status === 'accepted' || status === 'in_progress' ? 'acknowledged' : 'blocked',
    actor: vendorName,
    channel: 'vendor',
    recipient: vendorName,
    detail,
  });
  await sendStatusEmail({ request, title, detail });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
    <main style="font-family:Georgia,serif;background:#f6f3ee;min-height:100vh;padding:48px;color:#1a1916">
      <section style="max-width:620px;margin:auto;background:white;border:1px solid #e4ddd4;border-radius:18px;padding:30px">
        <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6b8f71;font-weight:800">Passage</div>
        <h1 style="font-weight:400">${title}</h1>
        <p style="color:#6a6560;line-height:1.7">${detail}</p>
        <p style="color:#6b8f71;font-weight:800">The family and any connected funeral home can see this update.</p>
      </section>
    </main>
  `);
}
