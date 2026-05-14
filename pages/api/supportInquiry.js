import { createClient } from '@supabase/supabase-js';
import { syncLeadToHubSpot } from '../../lib/hubspot';
import { detailRows, sendSubmissionReceipt } from '../../lib/submissionReceipts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function clean(value, max = 4000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function isRealEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;
  const domain = email.split('@')[1] || '';
  if (!domain || domain.includes('..')) return false;
  if (['example.com', 'test.com', 'fake.com', 'none.com', 'noemail.com'].includes(domain)) return false;
  if (/^(test|fake|none|asdf|na|noreply|no-reply)@/.test(email)) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const name = clean(body.name, 120);
  const email = clean(body.email, 180);
  const category = clean(body.category, 80) || 'General';
  const message = clean(body.message, 3000);
  const urgency = clean(body.urgency, 40) || 'Normal';
  const source = clean(body.source, 80) || 'contact_page';
  const flowType = clean(body.flowType, 80) || 'support_inquiry';

  if (!email || !message) {
    return res.status(400).json({ error: 'Please include your email and message.' });
  }
  if (!isRealEmail(email)) {
    return res.status(400).json({ error: 'Please enter a real email address so we can send the guide.' });
  }

  try {
    await supabase.from('leads').insert([{
      email,
      first_name: name || null,
      flow_type: flowType,
      source,
      notes: JSON.stringify({ category, urgency, message, site: SITE_URL, created_at: new Date().toISOString() }),
    }]).then(() => {}, () => {});

    const lowerCategory = category.toLowerCase();
    const isFuneralHome = lowerCategory.includes('funeral') || lowerCategory.includes('partner');
    const isVendor = lowerCategory.includes('vendor');
    const isCare = lowerCategory.includes('hospice') || lowerCategory.includes('care');
    const isMeeting = lowerCategory.includes('demo') || lowerCategory.includes('walkthrough') || lowerCategory.includes('conversation') || isFuneralHome || isVendor || isCare;
    await syncLeadToHubSpot({
      admin: supabase,
      eventType: 'support_inquiry',
      source,
      contact: {
        email,
        name,
        persona: isFuneralHome ? 'funeral_home' : isVendor ? 'vendor' : isCare ? 'care_provider' : 'family',
        lifecycleStage: isMeeting ? 'marketingqualifiedlead' : 'lead',
        message,
      },
      company: isFuneralHome || isVendor || isCare ? { name: name || email, companyType: isFuneralHome ? 'funeral_home' : isVendor ? 'vendor' : 'care_provider' } : {},
      deal: isMeeting ? {
        name: `Passage ${category}: ${name || email}`,
        persona: isFuneralHome ? 'funeral_home' : isVendor ? 'vendor' : isCare ? 'care_provider' : 'family',
        description: `${urgency}\n\n${message}`,
      } : {},
      payload: { category, urgency, message, flowType, source, site: SITE_URL },
    });

    const key = process.env.RESEND_API_KEY;
    if (key) {
      const to = process.env.SUPPORT_EMAIL || process.env.RESEND_SUPPORT_EMAIL || 'support@thepassageapp.io';
      const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
      const subject = category === 'Resource guide lead' ? `New Passage resource lead: ${email}` : `Passage support inquiry: ${category}`;
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

    await sendSubmissionReceipt({
      to: email,
      subject: category === 'Resource guide lead' ? 'We received your Passage guide request' : 'We received your Passage inquiry',
      eyebrow: category === 'Resource guide lead' ? 'Guide request received' : 'Inquiry received',
      title: 'Thanks for reaching out to Passage.',
      intro: 'We received your request. A real person will review it and get back to you as soon as possible.',
      sections: [
        {
          label: 'What we received',
          html: detailRows({
            Category: category,
            Urgency: urgency,
            Name: name || 'Not provided',
          }),
        },
        {
          label: 'Your note',
          text: message || 'No note supplied.',
          tone: 'soft',
        },
      ],
      ctaLabel: 'Return to Passage',
      ctaPath: '/',
    }).catch(err => console.warn('supportInquiry receipt not sent:', err?.message || err));

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('supportInquiry:', err);
    return res.status(200).json({ success: true, warning: err.message || 'Inquiry saved but email may not have sent.' });
  }
}
