const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://thepassageapp.io';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { planId, userId, userEmail } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(200).json({ url: BASE + '/?upgrade=pending', mock: true });
  try {
    const auth = 'Bearer ' + process.env.STRIPE_SECRET_KEY;
    const amt = planId === 'annual' ? 4900 : planId === 'lifetime' ? 24900 : 999;
    const lbl = planId === 'annual' ? 'Passage Annual' : planId === 'lifetime' ? 'Passage Lifetime' : 'Passage Monthly';
    const intvl = planId === 'annual' ? 'year' : planId === 'monthly' ? 'month' : null;
    const p = new URLSearchParams({ 'customer_email': userEmail || '', 'success_url': BASE + '/?upgraded=true', 'cancel_url': BASE + '/?upgrade=cancelled', 'metadata[userId]': userId, 'metadata[planId]': planId || '', 'line_items[0][price_data][currency]': 'usd', 'line_items[0][price_data][product_data][name]': lbl, 'line_items[0][price_data][unit_amount]': String(amt), 'line_items[0][quantity]': '1', 'mode': intvl ? 'subscription' : 'payment' });
    if (intvl) p.set('line_items[0][price_data][recurring][interval]', intvl);
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() });
    const d = await r.json();
    if (d.error) return res.status(500).json({ error: d.error.message });
    return res.status(200).json({ url: d.url });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
