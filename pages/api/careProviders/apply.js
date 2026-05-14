import { createClient } from '@supabase/supabase-js';
import { syncLeadToHubSpot } from '../../../lib/hubspot';
import { detailRows, sendSubmissionReceipt } from '../../../lib/submissionReceipts';
import { escapeHtml, passageEmailShell } from '../../../lib/brandedEmail';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function adminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function clean(value, max = 4000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function validEmail(value) {
  const email = clean(value, 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;
  const domain = email.split('@')[1] || '';
  return !['example.com', 'test.com', 'fake.com', 'none.com', 'noemail.com'].includes(domain);
}

function providerTypeLabel(type) {
  const value = clean(type, 80).toLowerCase();
  if (value === 'assisted_living') return 'Assisted living';
  if (value === 'senior_living') return 'Senior living';
  if (value === 'home_care') return 'Home care';
  return 'Hospice';
}

async function notifyPassage(application) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };
  const to = process.env.SUPPORT_EMAIL || process.env.RESEND_SUPPORT_EMAIL || 'support@thepassageapp.io';
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const html = passageEmailShell({
    eyebrow: 'Care-provider inquiry',
    title: `${application.organization_name} wants to discuss ${providerTypeLabel(application.provider_type)} continuity.`,
    intro: 'A hospice, assisted living, senior living, or care provider submitted a Passage partnership inquiry.',
    sections: [
      {
        label: 'Contact',
        html: detailRows({
          Name: application.contact_name,
          Email: application.contact_email,
          Phone: application.contact_phone || 'Not provided',
          Organization: application.organization_name,
          Type: providerTypeLabel(application.provider_type),
        }),
      },
      {
        label: 'Context',
        text: application.message || 'No message supplied.',
        tone: 'soft',
      },
    ],
    ctaLabel: 'Open HubSpot meeting link',
    ctaUrl: 'https://meetings-na2.hubspot.com/steven-t',
  });
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: application.contact_email,
      subject: `New Passage care-provider inquiry: ${application.organization_name}`,
      html,
    }),
  });
  if (!response.ok) return { error: await response.text().catch(() => 'Resend rejected the email.') };
  return { sent: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const application = {
    organization_name: clean(body.organizationName, 220),
    provider_type: clean(body.providerType, 80) || 'hospice',
    contact_name: clean(body.contactName, 160),
    contact_email: clean(body.contactEmail, 180).toLowerCase(),
    contact_phone: clean(body.contactPhone, 80),
    locations_count: clean(body.locationsCount, 40),
    active_families_estimate: clean(body.activeFamiliesEstimate, 80),
    message: clean(body.message, 2500),
    source: clean(body.source, 120) || 'care_provider_page',
    status: 'new',
    website: clean(body.website, 240),
  };

  if (!application.organization_name) return res.status(400).json({ error: 'Add the organization name.' });
  if (!validEmail(application.contact_email)) return res.status(400).json({ error: 'Add a real contact email.' });

  const admin = adminClient();
  let saved = null;
  if (admin) {
    const { data } = await admin
      .from('care_provider_applications')
      .insert([application])
      .select('id')
      .maybeSingle()
      .then(result => result, error => ({ error }));
    saved = data || null;

    await admin.from('leads').insert([{
      email: application.contact_email,
      first_name: application.contact_name || null,
      flow_type: 'care_provider_partnership',
      source: application.source,
      notes: JSON.stringify({ ...application, site: SITE_URL, created_at: new Date().toISOString() }),
    }]).then(() => {}, () => {});
  }

  await syncLeadToHubSpot({
    admin,
    eventType: 'care_provider_inquiry',
    source: application.source,
    sourceId: saved?.id || null,
    contact: {
      email: application.contact_email,
      name: application.contact_name,
      phone: application.contact_phone,
      persona: 'care_provider',
      lifecycleStage: 'marketingqualifiedlead',
      message: application.message,
    },
    company: {
      name: application.organization_name,
      website: application.website,
      phone: application.contact_phone,
      companyType: application.provider_type,
    },
    deal: {
      name: `${providerTypeLabel(application.provider_type)} partnership: ${application.organization_name}`,
      pipeline: process.env.HUBSPOT_CARE_PIPELINE,
      dealstage: process.env.HUBSPOT_CARE_NEW_STAGE,
      persona: 'care_provider',
      description: `${application.locations_count || 'Unknown'} locations. ${application.active_families_estimate || 'Unknown'} active families.\n\n${application.message}`,
    },
    payload: { ...application, applicationId: saved?.id || null },
  });

  await notifyPassage(application).catch(err => console.warn('care provider admin notice not sent:', err?.message || err));
  await sendSubmissionReceipt({
    to: application.contact_email,
    subject: 'We received your Passage care-provider inquiry',
    eyebrow: 'Care-provider inquiry received',
    title: 'Thanks for reaching out to Passage.',
    intro: 'We received your care-provider inquiry. A real person will review it and follow up as soon as possible.',
    sections: [
      {
        label: 'What we received',
        html: detailRows({
          Organization: application.organization_name,
          Type: providerTypeLabel(application.provider_type),
          Contact: application.contact_name || application.contact_email,
          Locations: application.locations_count || 'Not provided',
        }),
      },
      { label: 'Your note', text: application.message || 'No note supplied.', tone: 'soft' },
    ],
    ctaLabel: 'Return to Passage',
    ctaPath: '/care-providers',
  }).catch(err => console.warn('care provider receipt not sent:', err?.message || err));

  return res.status(200).json({ success: true });
}
