import { createClient } from '@supabase/supabase-js';

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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function emailHtml(item) {
  const recipient = escapeHtml(item.to_name || 'there');
  const title = escapeHtml(item.title || 'A message from Passage');
  const body = escapeHtml(item.content_text || '').replace(/\n/g, '<br>');
  const event = item.delivery_event ? '<p class="p"><strong>Milestone:</strong> ' + escapeHtml(item.delivery_event) + '</p>' : '';
  const attachment = item.content_url
    ? '<div class="note">An attachment was saved with this message. Sign in to Passage to review the full stored memory.</div>'
    : '';

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    'body{font-family:Georgia,serif;background:#f6f3ee;margin:0;padding:32px 16px;color:#1a1916}' +
    '.card{background:#fff;border-radius:16px;padding:34px 30px;max-width:560px;margin:0 auto;box-shadow:0 2px 18px rgba(0,0,0,.06)}' +
    '.logo{font-size:11px;color:#a09890;letter-spacing:.2em;text-transform:uppercase;margin-bottom:24px}' +
    '.tag{display:inline-block;background:#f0f5f1;border:1px solid #c8deca;border-radius:8px;padding:3px 10px;font-size:11px;color:#6b8f71;font-weight:700;letter-spacing:.05em;margin-bottom:18px}' +
    '.h1{font-size:23px;line-height:1.35;font-weight:400;margin:0 0 14px}' +
    '.p{font-size:14px;line-height:1.75;color:#6a6560;margin:0 0 14px}' +
    '.message{white-space:normal;background:#f6f3ee;border-radius:12px;padding:16px 18px;font-size:15px;line-height:1.8;color:#1a1916;margin:18px 0}' +
    '.note{background:#f0f5f1;border:1px solid #c8deca;border-radius:10px;padding:12px 14px;color:#6b8f71;font-size:13px;line-height:1.55;margin:16px 0}' +
    '.btn{display:inline-block;background:#6b8f71;color:white;text-decoration:none;padding:13px 24px;border-radius:11px;font-size:15px;font-weight:700;margin-top:12px}' +
    '.footer{font-size:11px;color:#a09890;margin-top:26px;padding-top:18px;border-top:1px solid #f0ece5;line-height:1.6}' +
    '</style></head><body><div class="card"><div class="logo">Passage</div><div class="tag">Scheduled message</div>' +
    '<div class="h1">' + title + '</div>' +
    '<p class="p">' + recipient + ', this message was saved in Passage to be delivered at this time.</p>' +
    event +
    '<div class="message">' + body + '</div>' +
    attachment +
    '<a class="btn" href="' + SITE_URL + '/participating">Open Passage</a>' +
    '<div class="footer">Passage keeps family instructions, documents, roles, and messages together when timing matters.</div>' +
    '</div></body></html>';
}

async function sendEmail(item, key, from) {
  if (!item.to_email) return null;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [item.to_email],
      subject: item.title || 'A scheduled Passage message',
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
        subject: item.title || 'A scheduled Passage message',
        provider: delivery.channel === 'email' ? 'resend' : 'twilio',
        provider_id: delivery.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }))).catch(() => {});

      results.push({ id: item.id, ok: failures.length === 0, sent, failures });
    } catch (err) {
      await supabase.from('scheduled_deliveries').update({ status: 'scheduled', updated_at: new Date().toISOString() }).eq('id', item.id).catch(() => {});
      results.push({ id: item.id, ok: false, error: err.message });
    }
  }

  return res.status(200).json({ success: true, processed: results.length, results });
}
