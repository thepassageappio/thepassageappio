import crypto from 'crypto';
import { recordProviderDelivery } from '../../../lib/taskStatus';

export const config = { api: { bodyParser: false } };

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyResendSignature(raw, req) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  const id = req.headers['svix-id'];
  const timestamp = req.headers['svix-timestamp'];
  const signature = String(req.headers['svix-signature'] || '');
  if (!id || !timestamp || !signature) return false;
  const numericTimestamp = Number(timestamp);
  if (!Number.isFinite(numericTimestamp)) return false;
  const ageMs = Math.abs(Date.now() - numericTimestamp * 1000);
  if (ageMs > 10 * 60 * 1000) return false;
  const signed = `${id}.${timestamp}.${raw.toString('utf8')}`;
  const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : secret;
  const expected = crypto.createHmac('sha256', key).update(signed).digest('base64');
  return signature.split(' ').some(part => safeEqual(part.replace(/^v1,/, ''), expected));
}

function extractEmailId(event) {
  return event?.data?.email_id || event?.data?.id || event?.data?.email?.id || event?.data?.message_id || event?.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const raw = await readRaw(req);
  if (!process.env.RESEND_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'RESEND_WEBHOOK_SECRET is not configured.' });
  }
  if (!verifyResendSignature(raw, req)) return res.status(401).json({ error: 'Invalid Resend signature.' });

  let event;
  try {
    event = JSON.parse(raw.toString('utf8') || '{}');
  } catch {
    return res.status(400).json({ error: 'Invalid webhook body.' });
  }

  const providerMessageId = extractEmailId(event);
  const providerEventId = event?.id || req.headers['svix-id'] || `${providerMessageId}:${event?.type || 'event'}`;
  const providerStatus = event?.type || event?.data?.status || 'sent';
  const recipient = event?.data?.to?.[0] || event?.data?.to || event?.data?.recipient;

  const result = await recordProviderDelivery({
    provider: 'resend',
    providerMessageId,
    providerEventId,
    providerStatus,
    channel: 'email',
    recipient,
    detail: recipient ? `${recipient} ${providerStatus.replace(/^email\./, '')}.` : `Resend reported ${providerStatus}.`,
    errorMessage: event?.data?.error || event?.data?.reason,
    payload: event,
  });

  return res.status(200).json({ success: true, result });
}
