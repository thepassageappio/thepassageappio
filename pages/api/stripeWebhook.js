import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export const config = { api: { bodyParser: false } };
async function getRawBody(req) {
  return new Promise((resolve, reject) => { const c = []; req.on('data', d => c.push(Buffer.from(d))); req.on('end', () => resolve(Buffer.concat(c))); req.on('error', reject); });
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(200).json({ received: true, mock: true });
  try {
    const raw = await getRawBody(req);
    const sig = req.headers['stripe-signature'] || '';
    const parts = sig.split(','); let ts = ''; const sigs = [];
    for (const p of parts) { if (p.startsWith('t=')) ts = p.slice(2); if (p.startsWith('v1=')) sigs.push(p.slice(3)); }
    const expected = crypto.createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(ts + '.' + raw.toString()).digest('hex');
    const valid = sigs.some(s => { try { return crypto.timingSafeEqual(Buffer.from(s,'hex'), Buffer.from(expected,'hex')); } catch { return false; } });
    if (!valid) return res.status(400).json({ error: 'Bad signature' });
    const event = JSON.parse(raw.toString());
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object; const uid = s.metadata && s.metadata.userId;
      if (uid) await sb.from('users').update({ plan: (s.metadata && s.metadata.planId) || 'paid', plan_activated_at: new Date().toISOString(), stripe_customer_id: s.customer || null }).eq('id', uid);
    }
    return res.status(200).json({ received: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
