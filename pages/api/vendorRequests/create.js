import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import { recordTaskCommunicationEvent } from '../../../lib/communicationEvents';
import { categoryForTask, vendorCategoryLabel } from '../../../lib/vendors';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../../lib/notificationSafety';
import { passageEmailShell, passageSubject } from '../../../lib/brandedEmail';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, service);
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function requestBody(req) {
  if (!req?.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

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
  const route = routeEmailRecipients([vendor.contact_email]);
  if (!route.actual.length) return false;
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const encodedToken = encodeURIComponent(request.response_token || '');
  const portalUrl = `${BASE_URL}/vendors/request?token=${encodedToken}`;
  const acceptUrl = `${BASE_URL}/api/vendorRequests/respond?token=${encodedToken}&status=accepted`;
  const declineUrl = `${BASE_URL}/api/vendorRequests/respond?token=${encodedToken}&status=declined`;
  const completeUrl = `${BASE_URL}/api/vendorRequests/respond?token=${encodedToken}&status=completed`;
  const requestTitle = taskTitle || vendorCategoryLabel(vendor.category);
  const familyName = workflow.deceased_name || workflow.estate_name || workflow.name || 'Family case';
  const subject = passageSubject('Vendor request', requestTitle);
  const html = passageEmailShell({
    eyebrow: 'Vendor request',
    title: `A family asked for help with ${requestTitle}.`,
    intro: 'This scoped request came through Passage so the family and any connected funeral home can see what is waiting, what you own, and what is handled.',
    preheader: `Open the request to quote, decline, or mark progress for ${requestTitle}.`,
    sections: [
      {
        label: 'Request',
        html: `<strong style="color:#1a1916;">Family record:</strong> ${familyName}<br><strong style="color:#1a1916;">Request:</strong> ${requestTitle}<br><strong style="color:#1a1916;">Urgency:</strong> ${request.urgency === 'rush' ? 'Rush' : 'Planned'}`,
      },
      {
        label: 'Quick actions',
        html: `<a href="${acceptUrl}" style="color:#6b8f71;font-weight:900;">Send quote or own request</a><br><a href="${declineUrl}" style="color:#6a6560;font-weight:900;">Decline request</a><br><a href="${completeUrl}" style="color:#6a6560;font-weight:900;">Save completion proof</a>`,
        tone: 'soft',
      },
    ],
    ctaLabel: 'Open vendor request',
    ctaUrl: portalUrl,
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
  });
  const json = await response.json().catch(() => ({}));
  await insertNotificationLog(admin, {
    workflow_id: workflow.id,
    task_id: request.task_id || null,
    channel: 'email',
    recipient_email: vendor.contact_email,
    recipient_name: vendor.business_name,
    subject,
    provider: 'resend',
    provider_id: response.ok ? json.id || null : null,
    status: response.ok ? 'sent' : 'failed',
    sent_at: response.ok ? new Date().toISOString() : null,
    error_message: response.ok ? null : json.message || json.error || 'Vendor request email failed',
    source: 'vendor_request',
    ...qaAuditFields(route),
  });
  return response.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = requestBody(req);
  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status || 401).json({ error: auth.error || 'Please sign in first.' });
  const actor = auth.user || (auth.source === 'internal' && body.actorEmail
    ? {
      id: body.actorUserId || null,
      email: String(body.actorEmail).trim().toLowerCase(),
      user_metadata: { full_name: body.actorName || body.actorEmail },
    }
    : null);
  if (!actor?.email) return res.status(401).json({ error: auth.error || 'Please sign in first.' });

  let workflowId = body.workflowId || body.workflow_id || body.estateId || body.estate_id;
  const taskId = body.taskId || body.task_id;
  const taskTitle = body.taskTitle || body.task_title;
  const vendorId = body.vendorId || body.vendor_id;
  const urgency = body.urgency;
  const requestNote = String(body.requestNote || body.request_note || '').trim();
  if (!isUuid(workflowId) && isUuid(taskId)) {
    const { data: taskForWorkflow } = await admin.from('tasks').select('workflow_id').eq('id', taskId).maybeSingle();
    workflowId = taskForWorkflow?.workflow_id || workflowId;
  }
  if (!isUuid(workflowId) && auth.source === 'internal' && body.qaSmokeTest && actor.id) {
    const { data: latestWorkflow } = await admin
      .from('workflows')
      .select('id')
      .eq('user_id', actor.id)
      .ilike('name', 'QA coordination simulation%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    workflowId = latestWorkflow?.id || workflowId;
  }
  if (!isUuid(workflowId)) return res.status(400).json({ error: 'Choose a family record.' });
  if (!isUuid(vendorId)) return res.status(400).json({ error: 'Choose a vendor.' });

  const [{ data: workflow }, { data: task }, { data: vendor }] = await Promise.all([
    admin.from('workflows').select('id,user_id,name,estate_name,deceased_name,coordinator_email,organization_id').eq('id', workflowId).maybeSingle(),
    isUuid(taskId) ? admin.from('tasks').select('id,title,workflow_id').eq('id', taskId).eq('workflow_id', workflowId).maybeSingle() : Promise.resolve({ data: null }),
    admin.from('vendors').select('*').eq('id', vendorId).eq('status', 'active').maybeSingle(),
  ]);
  if (!workflow) return res.status(404).json({ error: 'Family record not found.' });
  if (!vendor) return res.status(404).json({ error: 'Vendor is not available.' });
  const allowed = await userCanAccessWorkflow(actor, workflow);
  if (!allowed) return res.status(403).json({ error: 'You do not have access to this family record.' });

  const resolvedTaskTitle = task?.title || String(taskTitle || vendorCategoryLabel(vendor.category));
  const category = categoryForTask(task || resolvedTaskTitle);
  if (category && category !== vendor.category) return res.status(400).json({ error: 'This vendor does not match this request.' });
  const marketplaceFeePercent = Number(vendor.marketplace_fee_percent ?? 12);
  const funeralHomeSharePercent = workflow.organization_id ? Number(vendor.funeral_home_rev_share_percent || 0) : 0;
  const passageSharePercent = Math.max(marketplaceFeePercent - funeralHomeSharePercent, 0);

  const { data: request, error } = await admin.from('vendor_requests').insert([{
    vendor_id: vendor.id,
    workflow_id: workflow.id,
    task_id: task?.id || null,
    task_title: resolvedTaskTitle,
    organization_id: workflow.organization_id || null,
    requested_by_user_id: actor.id,
    requested_by_email: actor.email,
    requested_by_name: actor.user_metadata?.full_name || actor.email,
    status: 'requested',
    urgency: urgency === 'rush' ? 'rush' : 'planned',
    request_note: requestNote || null,
    referral_source: workflow.organization_id ? 'funeral_home' : 'passage',
    marketplace_fee_percent: marketplaceFeePercent,
    passage_rev_share_percent: passageSharePercent,
    funeral_home_rev_share_percent: funeralHomeSharePercent,
    estimated_value: vendor.estimated_value || vendor.estimated_transaction_value || null,
    estimated_transaction_value: vendor.estimated_transaction_value,
    payment_collection_status: 'quote_needed',
  }]).select('*').single();
  if (error) return res.status(500).json({ error: error.message });

  const emailSent = await sendVendorEmail({ vendor, workflow, request, taskTitle: resolvedTaskTitle });
  const detail = `${vendorCategoryLabel(vendor.category)} quote requested from ${vendor.business_name}. ${urgency === 'rush' ? 'Urgent timeframe.' : 'Planned timeframe.'} ${emailSent ? 'Vendor notified.' : 'Vendor request recorded.'} We'll coordinate this here.`;
  await recordTaskCommunicationEvent({
    verb: 'ask',
    workflowId: workflow.id,
    taskId: task?.id || null,
    taskTitle: resolvedTaskTitle,
    status: 'waiting',
    actor: actor.email || 'Passage',
    actorRole: workflow.organization_id ? 'funeral_home' : 'family_coordinator',
    channel: 'vendor',
    recipient: vendor.business_name,
    recipientRole: 'vendor',
    detail,
    visibility: 'family_funeral_home',
  });
  return res.status(200).json({ success: true, request: { ...request, vendors: { business_name: vendor.business_name, category: vendor.category } } });
}
