import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function clean(value, max = 4000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const name = clean(body.name, 120);
  const email = clean(body.email, 180);
  const category = clean(body.category, 80) || 'General';
  const message = clean(body.message, 3000);
  const urgency = clean(body.urgency, 40) || 'Normal';

  if (!email || !message) {
    return res.status(400).json({ error: 'Please include your email and message.' });
  }

  try {
    await supabase.from('leads').insert([{
      email,
      first_name: name || null,
      flow_type: 'support_inquiry',
      source: 'contact_page',
      notes: JSON.stringify({ category, urgency, message, site: SITE_URL, created_at: new Date().toISOString() }),
    }]).catch(() => {});

    const key = process.env.RESEND_API_KEY;
    if (key) {
      const to = process.env.SUPPORT_EMAIL || process.env.RESEND_SUPPORT_EMAIL || 'steventurrisi@gmail.com';
      const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
      const subject = `Passage support inquiry: ${category}`;
      const html = [
        '<div style="font-family:Georgia,serif;background:#f6f3ee;padding:28px">',
        '<div style="background:#fff;border-radius:16px;padding:28px;max-width:640px;margin:auto">',
        '<div style="font-size:11px;color:#6b8f71;letter-spacing:.18em;text-transform:uppercase;font-weight:700">Passage inquiry</div>',
        `<h1 style="font-size:24px;color:#1a1916">${category}</h1>`,
        `<p><strong>Name:</strong> ${name || 'Not provided'}</p>`,
        `<p><strong>Email:</strong> ${email}</p>`,
        `<p><strong>Urgency:</strong> ${urgency}</p>`,
        `<p style="white-space:pre-wrap;line-height:1.7;color:#6a6560">${message}</p>`,
        '</div></div>',
      ].join('');
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], reply_to: email, subject, html }),
      });
      if (!emailRes.ok) {
        const detail = await emailRes.text();
        console.warn('supportInquiry email not sent:', detail);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('supportInquiry:', err);
    return res.status(200).json({ success: true, warning: err.message || 'Inquiry saved but email may not have sent.' });
  }
}
