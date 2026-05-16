import { createClient } from '@supabase/supabase-js';
import { verifyDeliveryRequest } from '../../lib/deliveryAuth';
import { passageEmailShell, passageSubject } from '../../lib/brandedEmail';

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

function rowsTable(form) {
  return '<table style="width:100%;border-collapse:collapse;margin:4px 0;font-size:14px">' + rows(form) + '</table>';
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

  const subject = passageSubject('Preparation summary', form.deceasedName || 'funeral home meeting');
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const html = passageEmailShell({
    eyebrow: 'Prepared with Passage',
    title: 'Funeral home meeting preparation',
    intro: 'Here is the information to help begin arrangements. Anything marked "To be added" can be filled in later.',
    preheader: 'Funeral home meeting details prepared from the Passage family record.',
    sections: [
      {
        label: 'Family details',
        html: rowsTable(form),
      },
      missing.length ? {
        label: 'Still okay to send',
        text: 'Missing: ' + missing.map(x => clean(x, 80)).join(', ') + '. These can be filled in later.',
        tone: 'soft',
      } : {
        label: 'Ready',
        text: 'You have everything most funeral homes need to get started.',
        tone: 'soft',
      },
    ],
    ctaLabel: 'Open family record',
    ctaUrl: `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '')}/estate?id=${encodeURIComponent(estateId)}`,
  });

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
    }]).then(() => {}, () => {});

    await supabase.from('estate_events').insert([{
      estate_id: estateId,
      event_type: r.ok ? 'prep_summary_sent' : 'prep_summary_failed',
      title: r.ok ? 'Preparation summary emailed' : 'Preparation summary email failed',
      description: r.ok ? 'Funeral home preparation summary emailed to ' + to : 'Could not email preparation summary to ' + to,
      actor: auth.user?.email || 'Passage',
    }]).then(() => {}, () => {});

    if (!r.ok) return res.status(500).json({ error: data.message || data.error || 'Email provider did not accept the message.' });
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not send email.' });
  }
}
