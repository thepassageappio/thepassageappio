import { createClient } from '@supabase/supabase-js';
import { recordTaskCommunicationEvent } from '../../../lib/communicationEvents';
import { vendorCategoryLabel } from '../../../lib/vendors';
import { calculateVendorEconomics } from '../../../lib/vendorEconomics';
import { canonicalVendorStatus } from '../../../lib/vendorLifecycle';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../../lib/notificationSafety';
import { escapeHtml, passageEmailShell, passageSubject } from '../../../lib/brandedEmail';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

async function sendStatusEmail({ request, title, detail, ctaUrl, subject }) {
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
  const route = routeEmailRecipients(recipients);
  if (!route.actual.length) {
    await Promise.all(recipients.map((recipient) => insertNotificationLog(admin, {
      workflow_id: request.workflow_id,
      task_id: request.task_id || null,
      channel: 'email',
      recipient_email: recipient,
      recipient_name: recipient,
      subject: title,
      provider: 'resend',
      provider_id: null,
      status: 'blocked',
      error_message: 'QA notification mode had no override email configured.',
      source: 'vendor_status_update',
      ...qaAuditFields(route),
    })));
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const html = passageEmailShell({
    eyebrow: 'Vendor update',
    title,
    intro: detail,
    preheader: detail,
    sections: [
      {
        label: 'Saved to the spine',
        text: 'The family and any connected funeral home can see this status, the vendor, and the next expected action in Passage.',
        tone: 'soft',
      },
    ],
    ctaLabel: 'Open in Passage',
    ctaUrl,
  });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: route.actual,
      subject,
      html,
    }),
  }).catch(() => null);
  const json = response ? await response.json().catch(() => ({})) : {};
  await Promise.all(recipients.map((recipient) => insertNotificationLog(admin, {
    workflow_id: request.workflow_id,
    task_id: request.task_id || null,
    channel: 'email',
      recipient_email: recipient,
      recipient_name: recipient,
      subject,
    provider: 'resend',
    provider_id: response?.ok ? json.id || null : null,
    status: response?.ok ? 'sent' : 'failed',
    sent_at: response?.ok ? new Date().toISOString() : null,
    error_message: response?.ok ? null : (json?.message || json?.error || 'Vendor status email failed'),
    source: 'vendor_status_update',
    ...qaAuditFields(route),
  })));
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
  const resetFromDeclined = request.status === 'declined' && status !== 'declined';
  const economics = calculateVendorEconomics({
    value: finalValue,
    marketplaceFeePercent: request.marketplace_fee_percent,
    funeralHomeSharePercent: request.funeral_home_rev_share_percent || 0,
    hasFuneralHome: !!request.organization_id,
  });
  const update = {
    status: status === 'accepted' ? 'quoted' : status === 'in_progress' ? 'scheduled' : status,
    responded_at: status === 'accepted' || status === 'declined' || resetFromDeclined ? now : request.responded_at || now,
    in_progress_at: status === 'declined' || status === 'accepted' ? null : status === 'in_progress' || resetFromDeclined ? now : request.in_progress_at || now,
    completed_at: status === 'completed' ? now : null,
    final_value: status === 'declined' ? null : finalValue > 0 ? finalValue : null,
    platform_fee_amount: economics.platformFeeAmount,
    funeral_home_share_amount: economics.funeralHomeShareAmount,
    passage_share_amount: economics.passageShareAmount,
    gross_amount: finalValue > 0 ? finalValue : null,
    passage_fee_percent: Number(request.marketplace_fee_percent ?? 12),
    passage_fee_amount: economics.platformFeeAmount,
    vendor_net_amount: economics.platformFeeAmount ? Math.max(finalValue - economics.platformFeeAmount, 0) : null,
    payment_collection_status: status === 'declined'
      ? 'not_required'
      : status === 'completed' && finalValue > 0
        ? 'payment_pending'
        : status === 'accepted' || status === 'in_progress'
          ? 'quote_ready'
          : 'quote_needed',
    updated_at: now,
  };
  const { error: updateError } = await admin.from('vendor_requests').update(update).eq('id', request.id);
  if (updateError) return res.status(500).send(updateError.message);

  const vendorName = request.vendors?.business_name || 'Vendor';
  const category = vendorCategoryLabel(request.vendors?.category);
  const title = status === 'accepted'
    ? `${vendorName} sent a quote`
    : status === 'in_progress'
      ? `${vendorName} started work`
    : status === 'completed'
      ? `${vendorName} saved completion proof`
      : `${vendorName} declined`;
  const detail = status === 'accepted'
    ? `${category} quote for ${request.task_title || 'this request'} is ready for review.${finalValue > 0 ? ` Value: $${Math.round(finalValue)}.` : ''}`
    : `${category} request for ${request.task_title || 'this request'} was ${canonicalVendorStatus(status).replace('_', ' ')}.`;
  const ctaUrl = `${SITE_URL}${request.organization_id ? '/funeral-home/dashboard' : '/estate'}?workflow=${encodeURIComponent(request.workflow_id)}&vendor_request=${encodeURIComponent(request.id)}`;
  const subject = passageSubject(status === 'accepted' ? 'Vendor quote ready' : 'Vendor update', request.task_title || category);
  await recordTaskCommunicationEvent({
    verb: status === 'completed' ? 'prove' : status === 'declined' ? 'escalate' : 'update',
    workflowId: request.workflow_id,
    taskId: request.task_id,
    taskTitle: request.task_title,
    status: status === 'completed' ? 'handled' : status === 'accepted' || status === 'in_progress' ? 'acknowledged' : 'blocked',
    actor: vendorName,
    actorRole: 'vendor',
    channel: 'vendor',
    recipient: vendorName,
    recipientRole: 'vendor',
    detail,
    visibility: 'family_funeral_home',
  });
  await sendStatusEmail({ request, title, detail, ctaUrl, subject });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
    <main style="font-family:Georgia,serif;background:#f6f3ee;min-height:100vh;padding:48px;color:#1a1916">
      <section style="max-width:620px;margin:auto;background:white;border:1px solid #e4ddd4;border-radius:18px;padding:30px">
        <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6b8f71;font-weight:800">Passage</div>
        <h1 style="font-weight:400">${escapeHtml(title)}</h1>
        <p style="color:#6a6560;line-height:1.7">${escapeHtml(detail)}</p>
        <p style="color:#6b8f71;font-weight:800">The family and any connected funeral home can see this update.</p>
      </section>
    </main>
  `);
}