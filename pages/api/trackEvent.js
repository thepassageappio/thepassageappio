import { createClient } from '@supabase/supabase-js';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function clean(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function safeProps(input) {
  const output = {};
  Object.entries(input || {}).slice(0, 24).forEach(([key, value]) => {
    const safeKey = clean(key, 80);
    if (!safeKey) return;
    if (value == null) output[safeKey] = value;
    else if (typeof value === 'number' || typeof value === 'boolean') output[safeKey] = value;
    else output[safeKey] = clean(value, 500);
  });
  return output;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const event = clean(body.event, 120);
  if (!event) return res.status(400).json({ error: 'Event name is required.' });

  const payload = {
    event,
    path: clean(body.path, 240),
    persona: clean(body.persona, 80),
    source: clean(body.source, 80) || 'product',
    props: safeProps(body.props),
    created_at: new Date().toISOString(),
  };

  if (!supabase) return res.status(200).json({ success: true, skipped: true, reason: 'tracking_not_configured' });

  await supabase.from('leads').insert([{
    email: clean(body.email, 180) || null,
    first_name: clean(body.name, 120) || null,
    flow_type: 'product_event',
    source: payload.source,
    notes: JSON.stringify(payload),
  }]).then(() => {}, () => {});

  return res.status(200).json({ success: true });
}
