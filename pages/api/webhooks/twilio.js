import crypto from 'crypto';
import { recordProviderDelivery } from '../../../lib/taskStatus';

export const config = { api: { bodyParser: false } };

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyTwilio(req, params) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return false;
  const signature = req.headers['x-twilio-signature'];
  if (!signature) return false;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');
  const url = siteUrl + (req.url || '/api/webhooks/twilio');
  const sorted = Array.from(params.keys()).sort().map(key => key + params.get(key)).join('');
  const expected = crypto.createHmac('sha1', token).update(url + sorted).digest('base64');
  return safeEqual(signature, expected);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const raw = await readRaw(req);
  const params = new URLSearchParams(raw);
  if (!verifyTwilio(req, params)) return res.status(401).json({ error: 'Invalid Twilio signature.' });

  const sid = params.get('MessageSid') || params.get('SmsSid');
  const status = params.get('MessageStatus') || params.get('SmsStatus') || 'sent';
  const to = params.get('To');
  const error = params.get('ErrorMessage') || params.get('ErrorCode') || '';
  const providerEventId = `${sid || 'message'}:${status}`;

  const result = await recordProviderDelivery({
    provider: 'twilio',
    providerMessageId: sid,
    providerEventId,
    providerStatus: status,
    channel: 'sms',
    recipient: to,
    detail: error ? `Twilio reported ${status}: ${error}` : `Twilio reported ${status}.`,
    errorMessage: error,
  });

  return res.status(200).json({ success: true, result });
}
