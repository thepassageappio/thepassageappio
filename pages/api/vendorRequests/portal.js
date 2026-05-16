import { createClient } from '@supabase/supabase-js';
import { recordStatusEvent } from '../../../lib/taskStatus';
import { vendorCategoryLabel } from '../../../lib/vendors';
import { calculateVendorEconomics } from '../../../lib/vendorEconomics';
import { canonicalVendorStatus } from '../../../lib/vendorLifecycle';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../../lib/notificationSafety';
import { escapeHtml, passageEmailShell, passageSubject } from '../../../lib/brandedEmail';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

async function loadRequest(token) {
  if (!token) return null;
  const { data } = await admin
    .from('vendor_requests')
    .select('id,workflow_id,task_id,task_title,status,urgency,request_note,vendor_note,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,marketplace_fee_percent,funeral_home_rev_share_percent,payment_collection_status,organization_id,service_date,service_start_at,service_end_at,service_location,service_notes,family_contact_name,family_contact_phone,gross_amount,passage_fee_percent,passage_fee_amount,stripe_fee_estimate,vendor_net_amount,payout_status,vendors(business_name,category,contact_email,contact_phone,website),workflows(deceased_name,estate_name,name,coordinator_name,coordinator_email,organizations(name))')
    .eq('response_token', token)
    .maybeSingle();
  return data;
}

async function notifyOwner(request, title, detail) {
  const recipients = Array.from(new Set([
    request.workflows?.coordinator_email,
  ].filter(Boolean)));
  if (!recipients.length) return { status: 'skipped', reason: 'No coordinator email.' };
  const route = routeEmailRecipients(recipients);
  if (!route.actual.length) return { status: 'skipped', reason: 'No routed recipient.' };
  const subject = passageSubject('Vendor update', request.task_title || title);
  const ctaUrl = `${SITE_URL}${request.organization_id ? '/funeral-home/dashboard' : '/estate'}?workflow=${encodeURIComponent(request.workflow_id)}&vendor_request=${encodeURIComponent(request.id)}`;
  const html = passageEmailShell({
    eyebrow: 'Vendor update',
    title,
    intro: detail,
    preheader: detail,
    sections: [
      {
        label: 'Request',
        html: `Task: <strong style="color:#1a1916;">${escapeHtml(request.task_title || 'Vendor request')}</strong><br/>Vendor: <strong style="color:#1a1916;">${escapeHtml(request.vendors?.business_name || 'Vendor')}</strong>`,
      },
    ],
    ctaLabel: 'Open in Passage',
    ctaUrl,
  });
  if (!process.env.RESEND_API_KEY) {
    await insertNotificationLog(admin, {
      workflow_id: request.workflow_id,
      channel: 'email',
      recipient_email: recipients[0],
      recipient_name: request.workflows?.coordinator_name || recipients[0],
      subject,
      provider: 'resend',
      status: 'skipped',
      error_message: 'RESEND_API_KEY is not configured.',
      source: 'vendor_request_update',
      ...qaAuditFields(route),
    });
    return { status: 'skipped', reason: 'Resend is not configured.' };
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: route.actual,
      subject,
      html,
    }),
  }).catch(() => null);
  const json = response ? await response.json().catch(() => ({})) : {};
  await insertNotificationLog(admin, {
    workflow_id: request.workflow_id,
    channel: 'email',
    recipient_email: recipients[0],
    recipient_name: request.workflows?.coordinator_name || recipients[0],
    subject,
    provider: 'resend',
    provider_id: response?.ok ? json.id || null : null,
    status: response?.ok ? 'sent' : 'failed',
    sent_at: response?.ok ? new Date().toISOString() : null,
    error_message: response?.ok ? null : (json?.message || json?.error || 'Vendor update notification failed.'),
    source: 'vendor_request_update',
    ...qaAuditFields(route),
  });
  return { status: response?.ok ? 'sent' : 'failed' };
}

export default async function handler(req, res) {
  const token = String(req.query.token || req.body?.token || '');
  if (!token) return res.status(400).json({ error: 'Missing request token.' });

  const request = await loadRequest(token);
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  if (req.method === 'GET') {
    if (!request.viewed_at) {
      const now = new Date().toISOString();
      const viewedUpdate = { viewed_at: now, updated_at: now };
      if (canonicalVendorStatus(request.status) === 'requested') viewedUpdate.status = 'viewed';
      await admin.from('vendor_requests').update(viewedUpdate).eq('id', request.id);
      await admin.from('estate_events').insert([{
        estate_id: request.workflow_id,
        event_type: 'vendor_help_viewed',
        title: `${request.vendors?.business_name || 'Vendor'} viewed request`,
        description: `${vendorCategoryLabel(request.vendors?.category)} request for ${request.task_title || 'this task'} was viewed.`,
        actor: request.vendors?.business_name || 'Vendor',
      }]).then(() => {}, () => {});
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
  const vendorNote = String(req.body?.vendorNote || '').trim();
  const serviceDate = String(req.body?.serviceDate || '').trim();
  const serviceStartAt = String(req.body?.serviceStartAt || '').trim();
  const serviceEndAt = String(req.body?.serviceEndAt || '').trim();
  const serviceLocation = String(req.body?.serviceLocation || '').trim();
  const serviceNotes = String(req.body?.serviceNotes || '').trim();
  const valueForFee = action === 'completed' ? finalValue : estimatedValue;
  const resetFromDeclined = request.status === 'declined' && action !== 'declined';
  const economics = calculateVendorEconomics({
    value: valueForFee,
    marketplaceFeePercent: request.marketplace_fee_percent,
    funeralHomeSharePercent: request.funeral_home_rev_share_percent || 0,
    hasFuneralHome: !!request.organization_id,
  });
  const nextStatus = action === 'accepted'
    ? 'quoted'
    : action === 'in_progress'
      ? (canonicalVendorStatus(request.status) === 'paid' ? 'scheduled' : 'scheduled')
      : action;
  const update = {
    status: nextStatus,
    viewed_at: request.viewed_at || now,
    responded_at: ['accepted', 'declined'].includes(action) || resetFromDeclined ? now : request.responded_at || now,
    in_progress_at: action === 'declined' || action === 'accepted' ? null : action === 'in_progress' || resetFromDeclined ? now : request.in_progress_at || now,
    completed_at: action === 'declined' || action === 'accepted' || action === 'in_progress' ? null : now,
    estimated_value: estimatedValue > 0 ? estimatedValue : request.estimated_value,
    final_value: action === 'declined' ? null : finalValue > 0 ? finalValue : request.final_value,
    vendor_note: vendorNote || request.vendor_note || null,
    service_date: serviceDate || request.service_date || null,
    service_start_at: serviceStartAt || request.service_start_at || null,
    service_end_at: serviceEndAt || request.service_end_at || null,
    service_location: serviceLocation || request.service_location || null,
    service_notes: serviceNotes || request.service_notes || null,
    platform_fee_amount: economics.platformFeeAmount,
    funeral_home_share_amount: economics.funeralHomeShareAmount,
    passage_share_amount: economics.passageShareAmount,
    gross_amount: valueForFee > 0 ? valueForFee : request.gross_amount || null,
    passage_fee_percent: Number(request.marketplace_fee_percent ?? 12),
    passage_fee_amount: economics.platformFeeAmount,
    vendor_net_amount: economics.platformFeeAmount ? Math.max(valueForFee - economics.platformFeeAmount, 0) : null,
    payment_collection_status: action === 'declined'
      ? 'not_required'
      : action === 'completed' && finalValue > 0 && request.payment_collection_status !== 'paid'
        ? 'payment_pending'
        : action === 'accepted'
          ? 'quote_ready'
          : action === 'in_progress'
            ? (request.payment_collection_status === 'paid' ? 'paid' : 'quote_ready')
            : request.payment_collection_status || 'quote_needed',
    updated_at: now,
  };
  const { error } = await admin.from('vendor_requests').update(update).eq('id', request.id);
  if (error) return res.status(500).json({ error: error.message });

  const vendorName = request.vendors?.business_name || 'Vendor';
  const title = action === 'accepted'
    ? `${vendorName} sent a quote`
    : action === 'in_progress'
      ? `${vendorName} started work`
      : action === 'completed'
        ? `${vendorName} completed request`
        : `${vendorName} declined`;
  const detail = action === 'accepted'
    ? `${vendorCategoryLabel(request.vendors?.category)} quote for ${request.task_title || 'this task'} is ready for family or funeral-home review.${estimatedValue > 0 ? ` Estimated value: $${Math.round(estimatedValue)}.` : ''}${serviceStartAt ? ` Service timing: ${serviceStartAt}.` : ''}${vendorNote ? ` Note: ${vendorNote}` : ''}`
    : `${vendorCategoryLabel(request.vendors?.category)} request for ${request.task_title || 'this task'} was ${nextStatus.replace('_', ' ')}.`;
  await admin.from('estate_events').insert([{
    estate_id: request.workflow_id,
    event_type: action === 'completed' ? 'vendor_help_completed' : 'vendor_help_updated',
    title,
    description: detail,
    actor: vendorName,
  }]).then(() => {}, () => {});
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
