import { createHmac, timingSafeEqual } from 'crypto';

function callbackSecret() {
  return process.env.PASSAGE_INTERNAL_API_SECRET || process.env.CRON_SECRET || process.env.TWILIO_AUTH_TOKEN || '';
}

function signVoiceCallback({ to, name, expires }) {
  return createHmac('sha256', callbackSecret()).update([to, name, expires].join('|')).digest('hex');
}

function validSignature({ to, name, expires, sig }) {
  const secret = callbackSecret();
  if (!secret || !sig || !expires) return false;
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || expiresAt > Date.now() + 10 * 60 * 1000) return false;
  const expected = signVoiceCallback({ to, name, expires });
  const left = Buffer.from(String(sig), 'hex');
  const right = Buffer.from(expected, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

function escapeXml(value) {
  return String(value || '').replace(/[<>&'"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));
}

export default function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).send('Method not allowed');
  const to = String(req.query.to || '').replace(/[^\d+]/g, '');
  const name = String(req.query.name || 'the provider').replace(/[<>&'"]/g, '').slice(0, 120) || 'the provider';
  const expires = String(req.query.expires || '');
  const sig = String(req.query.sig || '');
  res.setHeader('Content-Type', 'text/xml');
  if (!validSignature({ to, name, expires, sig })) {
    return res.status(403).send('<Response><Say>Passage could not verify this call request. Please return to Passage and start the call again.</Say></Response>');
  }
  if (!to) {
    return res.status(200).send('<Response><Say>Passage could not find the provider phone number. Please return to the estate and try again.</Say></Response>');
  }
  return res.status(200).send(
    '<Response>' +
      '<Say>Passage is connecting your call to ' + escapeXml(name) + ' now.</Say>' +
      '<Dial callerId="' + escapeXml(process.env.TWILIO_PHONE_NUMBER || '') + '">' + escapeXml(to) + '</Dial>' +
    '</Response>'
  );
}
