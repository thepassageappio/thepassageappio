import { createClient } from '@supabase/supabase-js';
import { escapeHtml, passageEmailShell, passageSubject } from '../../lib/brandedEmail';
import { getRequestIp, rateLimit } from '../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../lib/rateLimitPolicy';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function isAuthorized(req) {
  const internalSecret = process.env.PASSAGE_INTERNAL_API_SECRET;
  const cronSecret = process.env.CRON_SECRET || internalSecret;
  const providedInternal = req.headers['x-passage-internal-secret'];
  const providedBearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');

  if (internalSecret && providedInternal === internalSecret) return true;
  if (cronSecret && providedBearer === cronSecret) return true;
  return false;
}

function enforceProcessorLimit(req) {
  const policy = getRateLimitPolicy('outboundDelivery');
  if (!policy) return { allowed: true };
  return rateLimit({
    key: ['process-scheduled-deliveries', getRequestIp(req), String(req.headers.authorization || req.headers['x-passage-internal-secret'] || 'internal').slice(0, 24)].join(':'),
    windowSeconds: policy.windowSeconds,
    maxRequests: Math.max(6, Math.floor(policy.maxRequests / 2)),
  });
}

function emailHtml(item) {
  const recipient = item.to_name || 'there';
  return passageEmailShell({
    eyebrow: 'Scheduled message',
    title: item.title || 'A message from Passage',
    intro: `${recipient}, this message was saved in Passage to be delivered at this time.`,
    preheader: item.content_text || item.title || 'A scheduled Passage message is ready.',
    sections: [
      item.delivery_event ? { label: 'Milestone', text: item.delivery_event } : null,
      { label: 'Message', html: escapeHtml(item.content_text || '').replace(/\n/g, '<br>'), tone: 'soft' },
      item.content_url ? { label: 'Attachment', text: 'An attachment was saved with this message. Sign in to Passage to review the full stored memory.' } : null,
    ].filter(Boolean),
    ctaLabel: 'Open Passage',
    ctaUrl: `${SITE_URL}/participating`,
    footer: 'Passage keeps family instructions, documents, roles, and messages together when timing matters.',
  });
}

async function sendEmail(item, key, from) {
  if (!item.to_email) return null;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [item.to_email],
      subject: passageSubject('Scheduled message', item.title || 'Passage'),
      html: emailHtml(item),
    }),
  });
  const data = await response.json();
  if (!response.ok || !data.id) throw new Error(JSON.stringify(data));
  return data.id;
}

async function sendSms(item) {
  if (!item.to_phone) return null;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) throw new Error('Twilio is not configured.');

  const text = [
    'Passage: A scheduled message is ready for you.',
    item.title ? '"' + item.title + '"' : '',
    'Sign in to Passage to view details: ' + SITE_URL + '/participating'
  ].filter(Boolean).join(' ');

  const body = new URLSearchParams({ To: item.to_phone, From: from, Body: text });
  const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(sid + ':' + token).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await response.json();
  if (!response.ok || !data.sid) throw new Error(JSON.stringify(data));
  return data.sid;
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Scheduled delivery processor is not authorized.' });
  const limit = enforceProcessorLimit(req);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || 3600));
    return res.status(429).json({ error: 'Scheduled delivery processing is cooling down. Wait before running it again.', retryAfterSeconds: limit.retryAfterSeconds });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Scheduled delivery processor is missing Supabase configuration.' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const key = process.env.RESEND_API_KEY;

  const today = new Date().toISOString().slice(0, 10);
  const { data: deliveries, error } = await supabase
    .from('scheduled_deliveries')
    .select('*')
    .eq('status', 'scheduled')
    .in('delivery_trigger', ['on_date', 'on_event'])
    .lte('delivery_date', today)
    .order('delivery_date', { ascending: true })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  if (!deliveries || deliveries.length === 0) return res.status(200).json({ success: true, processed: 0 });

  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const results = [];

  for (const item of deliveries) {
    try {
      await supabase.from('scheduled_deliveries').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('id', item.id).eq('status', 'scheduled');

      const channel = item.delivery_channel || 'email';
      const sent = [];
      const failures = [];

      if (channel === 'email' || channel === 'email_and_sms') {
        try {
          if (!key) throw new Error('RESEND_API_KEY missing');
          const emailId = await sendEmail(item, key, from);
          if (emailId) sent.push({ channel: 'email', id: emailId });
        } catch (err) {
          failures.push({ channel: 'email', error: err.message });
        }
      }
      if (channel === 'sms' || channel === 'email_and_sms') {
        try {
          const smsId = await sendSms(item);
          if (smsId) sent.push({ channel: 'sms', id: smsId });
        } catch (err) {
          failures.push({ channel: 'sms', error: err.message });
        }
      }

      if (sent.length === 0) {
        await supabase.from('scheduled_deliveries').update({ status: 'scheduled', updated_at: new Date().toISOString() }).eq('id', item.id);
        results.push({ id: item.id, ok: false, error: failures });
        continue;
      }

      await supabase.from('scheduled_deliveries').update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', item.id);

      await supabase.from('notification_log').insert(sent.map((delivery) => ({
        channel: delivery.channel,
        recipient_email: delivery.channel === 'email' ? item.to_email : null,
        recipient_phone: delivery.channel === 'sms' ? item.to_phone : null,
        recipient_name: item.to_name || null,
        subject: passageSubject('Scheduled message', item.title || 'Passage'),
        provider: delivery.channel === 'email' ? 'resend' : 'twilio',
        provider_id: delivery.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }))).then(() => {}, () => {});

      results.push({ id: item.id, ok: failures.length === 0, sent, failures });
    } catch (err) {
      await supabase.from('scheduled_deliveries').update({ status: 'scheduled', updated_at: new Date().toISOString() }).eq('id', item.id).then(() => {}, () => {});
      results.push({ id: item.id, ok: false, error: err.message });
    }
  }

  return res.status(200).json({ success: true, processed: results.length, results });
}
