import { createClient } from '@supabase/supabase-js';
import { escapeHtml, passageEmailShell } from '../../lib/brandedEmail';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../lib/notificationSafety';
import { recordStatusEvent } from '../../lib/taskStatus';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function clean(value) {
  return String(value || '').trim();
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function parseRecipients(input) {
  const rows = Array.isArray(input) ? input : String(input || '').split(/[\n,;]+/);
  const seen = new Set();
  return rows
    .map((row) => {
      if (typeof row === 'object' && row) {
        const email = normalizeEmail(row.email || row.recipient_email || row.value);
        return { email, name: clean(row.name || row.recipient_name || '') };
      }
      const text = clean(row);
      const match = text.match(/<?([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>?/);
      const email = normalizeEmail(match?.[1] || text);
      const name = clean(text.replace(/<?[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>?/, '').replace(/[<>()"]/g, ''));
      return { email, name };
    })
    .filter((recipient) => recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))
    .filter((recipient) => {
      if (seen.has(recipient.email)) return false;
      seen.add(recipient.email);
      return true;
    })
    .slice(0, 50);
}

async function getUser(req) {
  const verified = await verifyDeliveryRequest(req);
  if (verified.ok && verified.source === 'internal') {
    return {
      id: 'passage-internal',
      email: clean(req.body?.actorEmail || 'notifications@thepassageapp.io'),
      internal: true,
    };
  }
  if (verified.ok && verified.user) return verified.user;

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await authClient.auth.getUser(token);
  return data?.user || null;
}

async function canAccessWorkflow(user, workflow) {
  if (!user?.id || !workflow?.id) return false;
  if (user.internal) return true;
  const email = normalizeEmail(user.email);
  if (workflow.user_id === user.id) return true;
  if (email && normalizeEmail(workflow.coordinator_email) === email) return true;
  if (workflow.organization_id) {
    const { data: member } = await admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', workflow.organization_id)
      .ilike('email', email)
      .eq('status', 'active')
      .limit(1);
    if (member?.length) return true;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!service) return res.status(500).json({ error: 'Supabase service role is not configured.' });

  const user = await getUser(req);
  if (!user?.id) return res.status(401).json({ error: 'Sign in before sending a family update.' });

  const workflowId = clean(req.body?.workflowId);
  const message = clean(req.body?.message);
  const channel = clean(req.body?.channel || 'email').toLowerCase();
  const audience = clean(req.body?.audience || 'family_update');
  const tone = clean(req.body?.tone || 'custom');
  const reviewer = clean(req.body?.reviewedBy);
  const recipients = parseRecipients(req.body?.recipients || req.body?.recipientText);

  if (!workflowId) return res.status(400).json({ error: 'Missing family record.' });
  if (!message) return res.status(400).json({ error: 'Add the family update before sending.' });
  if (channel !== 'email') return res.status(400).json({ error: 'Email is the only live reviewed delivery channel right now. SMS remains paused.' });
  if (!recipients.length) return res.status(400).json({ error: 'Add at least one valid recipient email.' });

  const { data: workflow, error: workflowError } = await admin
    .from('workflows')
    .select('id,user_id,name,estate_name,deceased_name,coordinator_name,coordinator_email,organization_id')
    .eq('id', workflowId)
    .maybeSingle();
  if (workflowError) return res.status(500).json({ error: workflowError.message });
  if (!workflow) return res.status(404).json({ error: 'Family record not found.' });
  if (!(await canAccessWorkflow(user, workflow))) return res.status(403).json({ error: 'You do not have access to this family record.' });

  const subjectName = workflow.deceased_name || workflow.estate_name || workflow.name || 'the family';
  const subject = req.body?.subject || `Family update for ${subjectName}`;
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return res.status(200).json({ success: true, skipped: true, reason: 'Email provider is not configured.' });

  const { data: announcement } = await admin.from('announcements').insert([{
    estate_id: workflowId,
    audience,
    tone,
    content: message,
    status: 'sending',
    requires_review: Boolean(reviewer),
    reviewed_by: reviewer || null,
    channel: 'email',
  }]).select('id').maybeSingle();

  let sent = 0;
  let failed = 0;
  const failures = [];

  for (const recipient of recipients) {
    const route = routeEmailRecipients([recipient.email]);
    const html = passageEmailShell({
      eyebrow: 'Family update',
      title: `An update was shared for ${subjectName}.`,
      intro: message,
      sections: [
        {
          label: 'From',
          html: `<strong style="color:#1a1916;">${escapeHtml(workflow.coordinator_name || user.email || 'Passage coordinator')}</strong>`,
        },
      ],
      ctaLabel: 'Open Passage',
      ctaUrl: `${SITE_URL}/participating?estate=${encodeURIComponent(workflowId)}`,
    });

    let response = null;
    let json = {};
    if (route.actual.length) {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: route.actual,
          subject,
          html,
        }),
      }).catch(() => null);
      json = response ? await response.json().catch(() => ({})) : {};
    }

    const ok = Boolean(response?.ok && json.id);
    if (ok) sent += 1;
    else {
      failed += 1;
      failures.push({ recipient: recipient.email, error: route.actual.length ? (json?.message || json?.error || 'Provider did not accept the update.') : 'QA notification mode had no override email configured.' });
    }

    await insertNotificationLog(admin, {
      workflow_id: workflowId,
      channel: 'email',
      recipient_email: recipient.email,
      recipient_name: recipient.name || recipient.email,
      subject,
      provider: 'resend',
      provider_id: ok ? json.id : null,
      status: ok ? 'sent' : (route.actual.length ? 'failed' : 'blocked'),
      sent_at: ok ? new Date().toISOString() : null,
      error_message: ok ? null : failures[failures.length - 1]?.error,
      source: 'family_update',
      ...qaAuditFields(route),
    });

    await recordStatusEvent({
      workflowId,
      status: ok ? 'sent' : 'failed',
      actor: workflow.coordinator_name || user.email || 'Passage coordinator',
      channel: 'email',
      recipient: recipient.name || recipient.email,
      detail: ok ? `Family update sent to ${recipient.name || recipient.email}` : `Family update failed for ${recipient.name || recipient.email}`,
      provider: 'resend',
      providerMessageId: ok ? json.id : null,
      eventType: ok ? 'family_update_sent' : 'family_update_failed',
      eventTitle: ok ? 'Family update sent' : 'Family update needs review',
      eventDescription: `Audience: ${audience}. ${recipient.name || recipient.email}`,
    });
  }

  await admin.from('announcements').update({
    status: failed ? (sent ? 'partially_sent' : 'failed') : 'sent',
    updated_at: new Date().toISOString(),
  }).eq('id', announcement?.id || '');

  return res.status(failed && !sent ? 502 : 200).json({ success: sent > 0, sent, failed, failures, announcementId: announcement?.id || null });
}
