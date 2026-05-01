import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function clean(value, max = 4000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || '').trim());
}

function rows(form) {
  return [
    ['Full name', form.deceasedName],
    ['Date of birth', form.dateOfBirth],
    ['Date of death', form.dateOfDeath],
    ['Place of death', form.placeOfDeath],
    ['Primary contact', form.familyContact],
    ['Phone', form.familyPhone],
    ['Email', form.familyEmail],
    ['Service preferences', form.servicePreferences],
    ['Documents / items', form.documents],
    ['Notes', form.notes],
  ].map(([label, value]) => (
    '<tr><td style="width:170px;padding:8px 10px;border-bottom:1px solid #eee8df;color:#1a1916;font-weight:700;vertical-align:top">' +
    label +
    '</td><td style="padding:8px 10px;border-bottom:1px solid #eee8df;color:#6a6560;white-space:pre-wrap">' +
    (clean(value, 1600) || 'To be added') +
    '</td></tr>'
  )).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await verifyDeliveryRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const { estateId, to, form = {}, missing = [] } = req.body || {};
  if (!estateId) return res.status(400).json({ error: 'Missing estate.' });
  if (!isEmail(to)) return res.status(400).json({ error: 'Enter a real email address.' });

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return res.status(200).json({ success: true, skipped: true });

  const subject = 'Funeral home meeting preparation summary';
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const html = [
    '<div style="font-family:Georgia,serif;background:#f6f3ee;padding:28px">',
    '<div style="background:#fff;border-radius:16px;padding:28px;max-width:720px;margin:auto;border:1px solid #e4ddd4">',
    '<div style="font-size:11px;color:#6b8f71;letter-spacing:.16em;text-transform:uppercase;font-weight:800">Prepared with Passage</div>',
    '<h1 style="font-size:26px;line-height:1.18;color:#1a1916;margin:10px 0">Funeral home meeting preparation</h1>',
    '<p style="color:#6a6560;line-height:1.7">Here is the information to help begin arrangements. Anything marked "To be added" can be filled in later.</p>',
    '<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px">',
    rows(form),
    '</table>',
    missing.length ? '<div style="background:#fdf8ee;border-radius:12px;padding:12px;color:#b07d2e;font-size:13px;line-height:1.5"><strong>Still okay to send:</strong> missing ' + missing.map(x => clean(x, 80)).join(', ') + '.</div>' : '',
    '<div style="background:#f0f5f1;border-radius:12px;padding:12px;color:#6b8f71;font-weight:800;margin-top:16px">You have everything most funeral homes need to get started.</div>',
    '<p style="color:#a09890;font-size:12px;line-height:1.6;margin-top:20px">Prepared with Passage. Based on standard funeral home intake information.</p>',
    '</div></div>',
  ].join('');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    const data = await r.json().catch(() => ({}));
    const now = new Date().toISOString();

    await supabase.from('task_status_events').insert([{
      workflow_id: estateId,
      status: r.ok ? 'sent' : 'failed',
      last_action_at: now,
      last_actor: auth.user?.email || 'Passage',
      channel: 'email',
      recipient: to,
      detail: r.ok ? 'Funeral home preparation summary emailed to ' + to : 'Failed to email funeral home preparation summary to ' + to,
      provider: 'resend',
      provider_message_id: data.id || null,
    }]).catch(() => {});

    await supabase.from('estate_events').insert([{
      estate_id: estateId,
      event_type: r.ok ? 'prep_summary_sent' : 'prep_summary_failed',
      title: r.ok ? 'Preparation summary emailed' : 'Preparation summary email failed',
      description: r.ok ? 'Funeral home preparation summary emailed to ' + to : 'Could not email preparation summary to ' + to,
      actor: auth.user?.email || 'Passage',
    }]).catch(() => {});

    if (!r.ok) return res.status(500).json({ error: data.message || data.error || 'Email provider did not accept the message.' });
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not send email.' });
  }
}
