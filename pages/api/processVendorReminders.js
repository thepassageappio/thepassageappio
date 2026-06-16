import { createClient } from '@supabase/supabase-js';
import { internalHeaders } from '../../lib/deliveryAuth';
import { recordStatusEvent } from '../../lib/taskStatus';
import { getRequestIp, rateLimit } from '../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../lib/rateLimitPolicy';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function isAuthorized(req) {
  const internalSecret = process.env.PASSAGE_INTERNAL_API_SECRET;
  const cronSecret = process.env.CRON_SECRET || internalSecret;
  const providedInternal = req.headers['x-passage-internal-secret'];
  const providedBearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return Boolean((internalSecret && providedInternal === internalSecret) || (cronSecret && providedBearer === cronSecret));
}

function enforceProcessorLimit(req) {
  const policy = getRateLimitPolicy('outboundDelivery');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: ['process-vendor-reminders', getRequestIp(req), String(req.headers.authorization || req.headers['x-passage-internal-secret'] || 'internal').slice(0, 24)].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: Math.max(6, Math.floor(policy.maxRequests / 2)),
  });
}

function hoursFromNow(value) {
  return (new Date(value).getTime() - Date.now()) / 3600000;
}

async function sendVendorReminder(request, kind) {
  const vendorEmail = request.vendors?.contact_email;
  if (!vendorEmail) return { skipped: true, reason: 'no vendor email' };
  const serviceTime = request.service_start_at ? new Date(request.service_start_at).toLocaleString() : 'the scheduled service time';
  const familyName = request.workflows?.deceased_name || request.workflows?.estate_name || request.workflows?.name || 'the family record';
  const subject = kind === 'completion'
    ? `Passage reminder: mark ${request.task_title || 'vendor service'} completed`
    : `Passage reminder: upcoming service for ${familyName}`;
  const messageText = kind === 'completion'
    ? `Please mark this Passage vendor request completed when the work is finished.\n\nRequest: ${request.task_title || 'Vendor service'}\nFamily record: ${familyName}\n\nOpen the request: ${SITE_URL}/vendors/request?token=${encodeURIComponent(request.response_token)}`
    : `Upcoming Passage vendor obligation.\n\nRequest: ${request.task_title || 'Vendor service'}\nFamily record: ${familyName}\nTime: ${serviceTime}\nLocation: ${request.service_location || 'Location not recorded'}\nNotes: ${request.service_notes || request.vendor_note || 'No special notes recorded'}\n\nOpen the request: ${SITE_URL}/vendors/request?token=${encodeURIComponent(request.response_token)}`;
  const response = await fetch(SITE_URL + '/api/sendEmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...internalHeaders() },
    body: JSON.stringify({
      to: vendorEmail,
      toName: request.vendors?.business_name || vendorEmail,
      subject,
      taskTitle: request.task_title || 'Vendor service',
      taskId: request.task_id || null,
      workflowId: request.workflow_id,
      actionType: 'execution',
      messageText,
      coordinatorName: 'Passage',
      deceasedName: familyName,
      cc: request.workflows?.coordinator_email || undefined,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw new Error(data.error || 'Vendor reminder send failed');
  return { sent: true };
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Vendor reminder processor is not authorized.' });
  const limit = enforceProcessorLimit(req);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || 3600));
    return res.status(429).json({ error: 'Vendor reminder processing is cooling down. Wait before running it again.', retryAfterSeconds: limit.retryAfterSeconds });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const soon = new Date(now.getTime() + 36 * 3600000).toISOString();
  const staleReminderBefore = new Date(now.getTime() - 18 * 3600000).toISOString();

  const { data: upcoming, error } = await supabase
    .from('vendor_requests')
    .select('id,response_token,workflow_id,task_id,task_title,status,payment_collection_status,service_start_at,service_end_at,service_location,service_notes,vendor_note,last_vendor_reminder_at,completion_reminder_at,vendors(business_name,contact_email),workflows(name,estate_name,deceased_name,coordinator_email)')
    .in('status', ['paid', 'scheduled'])
    .eq('payment_collection_status', 'paid')
    .not('service_start_at', 'is', null)
    .lte('service_start_at', soon)
    .limit(40);
  if (error) return res.status(500).json({ error: error.message });

  const results = [];
  for (const request of upcoming || []) {
    const hours = hoursFromNow(request.service_start_at);
    const alreadyReminded = request.last_vendor_reminder_at && request.last_vendor_reminder_at > staleReminderBefore;
    if (hours >= -2 && hours <= 36 && !alreadyReminded) {
      try {
        await sendVendorReminder(request, 'upcoming');
        await supabase.from('vendor_requests').update({ last_vendor_reminder_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', request.id);
        await recordStatusEvent({
          workflowId: request.workflow_id,
          taskId: request.task_id,
          status: 'waiting',
          actor: 'Passage',
          channel: 'email',
          recipient: request.vendors?.business_name || request.vendors?.contact_email,
          detail: `Vendor reminder sent for ${request.task_title || 'vendor service'}.`,
        });
        results.push({ id: request.id, kind: 'upcoming', sent: true });
      } catch (err) {
        results.push({ id: request.id, kind: 'upcoming', sent: false, error: err.message });
      }
    }

    const serviceEnd = request.service_end_at || request.service_start_at;
    if (serviceEnd && new Date(serviceEnd).getTime() < now.getTime() - 2 * 3600000 && !request.completion_reminder_at) {
      try {
        await sendVendorReminder(request, 'completion');
        await supabase.from('vendor_requests').update({ completion_reminder_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', request.id);
        results.push({ id: request.id, kind: 'completion', sent: true });
      } catch (err) {
        results.push({ id: request.id, kind: 'completion', sent: false, error: err.message });
      }
    }
  }

  return res.status(200).json({ success: true, processed: results.length, results });
}
