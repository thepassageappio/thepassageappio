import { createClient } from '@supabase/supabase-js';
import { cleanZipList, normalizeVendorCategory, vendorCategoryLabel } from '../../../lib/vendors';
import { escapeHtml, passageEmailShell } from '../../../lib/brandedEmail';
import { detailRows, sendSubmissionReceipt } from '../../../lib/submissionReceipts';
import { syncLeadToHubSpot } from '../../../lib/hubspot';
import { getRequestIp, rateLimit } from '../../../lib/inMemoryRateLimit';
import { getRateLimitPolicy } from '../../../lib/rateLimitPolicy';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function clean(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function intakeKey(req, email) {
  return ['vendorApply', getRequestIp(req), clean(email, 180).toLowerCase() || 'no-email'].join(':');
}

async function notifyPassage(vendor) {
  if (!process.env.RESEND_API_KEY) return;
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const to = process.env.PASSAGE_LEADS_EMAIL || process.env.SUPPORT_EMAIL || 'support@thepassageapp.io';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'New Passage vendor application',
      html: passageEmailShell({
        eyebrow: 'Vendor application',
        title: `${vendor.business_name} applied as ${vendorCategoryLabel(vendor.category)}.`,
        intro: 'A vendor applied to receive scoped Passage requests. Review quality, service area, category fit, and approval status before making them available in partner or family flows.',
        sections: [
          {
            label: 'Contact',
            html: `Email: <strong style=\"color:#1a1916;\">${escapeHtml(vendor.contact_email || 'n/a')}</strong><br/>Phone: ${escapeHtml(vendor.contact_phone || 'n/a')}<br/>ZIPs: ${escapeHtml((vendor.zip_codes_served || []).join(', ') || 'n/a')}`,
          },
          {
            label: 'Description',
            text: vendor.short_description || 'No description supplied.',
            tone: 'soft',
          },
        ],
      }),
    }),
  }).catch(() => null);
}

async function sendApplicantReceipt(vendor) {
  return sendSubmissionReceipt({
    to: vendor.contact_email,
    subject: 'We received your Passage vendor application',
    eyebrow: 'Vendor application received',
    title: 'Thanks for applying to work with Passage.',
    intro: 'We received your vendor application. Passage reviews each vendor before making them available for family or partner requests, and we will get back to you as soon as possible.',
    sections: [
      {
        label: 'Application summary',
        html: detailRows({
          Business: vendor.business_name,
          Category: vendorCategoryLabel(vendor.category),
          'Service ZIPs': (vendor.zip_codes_served || []).join(', '),
          Phone: vendor.contact_phone || 'Not provided',
        }),
      },
      {
        label: 'What happens next',
        text: 'We review service fit, coverage area, quality details, and payout readiness before approving vendors for scoped Passage requests.',
        tone: 'soft',
      },
    ],
    ctaLabel: 'Return to vendor page',
    ctaPath: '/vendors',
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const businessName = String(body.businessName || body.business_name || '').trim();
  const category = normalizeVendorCategory(body.category);
  const email = String(body.email || body.contact_email || '').trim().toLowerCase();
  const phone = String(body.phone || body.contact_phone || '').trim();
  const zipCodes = cleanZipList(body.zipCodes || body.zip_codes_served);

  if (!businessName) return res.status(400).json({ error: 'Add the business name.' });
  if (!category) return res.status(400).json({ error: 'Choose a support category.' });
  if (!validEmail(email)) return res.status(400).json({ error: 'Add a real email address.' });
  if (!zipCodes.length) return res.status(400).json({ error: 'Add at least one ZIP code served.' });

  const contactPolicy = getRateLimitPolicy('contactIntake');
  const limit = rateLimit({
    key: intakeKey(req, email),
    windowSeconds: contactPolicy.windowSeconds,
    maxRequests: contactPolicy.maxRequests,
  });
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds || contactPolicy.windowSeconds));
    return res.status(429).json({
      error: 'We received several recent applications from this address. Please wait a bit before submitting again.',
      retryAfterSeconds: limit.retryAfterSeconds,
    });
  }

  const vendorRow = {
    business_name: businessName,
    category,
    short_description: String(body.description || body.short_description || '').trim() || null,
    zip_codes_served: zipCodes,
    rush_supported: !!body.rushSupported || !!body.rush_supported,
    rush_window_hours: body.rushWindowHours || body.rush_window_hours ? Number(body.rushWindowHours || body.rush_window_hours) : null,
    planned_supported: body.plannedSupported === false || body.planned_supported === false ? false : true,
    contact_email: email,
    contact_phone: phone || null,
    website: String(body.website || '').trim() || null,
    status: 'pending',
    marketplace_fee_percent: 12,
    passage_rev_share_percent: 12,
    funeral_home_rev_share_percent: 0,
    estimated_value: null,
  };

  const { data, error } = await supabase.from('vendors').insert([vendorRow]).select('id,business_name,category,contact_email,contact_phone,zip_codes_served').single();
  if (error) return res.status(500).json({ error: error.message });
  await syncLeadToHubSpot({
    admin: supabase,
    eventType: 'vendor_application',
    source: 'vendor_onboarding',
    sourceId: data.id,
    contact: {
      email,
      name: businessName,
      phone,
      persona: 'vendor',
      lifecycleStage: 'marketingqualifiedlead',
    },
    company: {
      name: businessName,
      website: vendorRow.website,
      phone,
      companyType: 'vendor',
    },
    deal: {
      name: `Vendor application: ${businessName}`,
      persona: 'vendor',
      description: `${businessName} applied as ${vendorCategoryLabel(category)}. ZIPs: ${zipCodes.join(', ')}.`,
    },
    payload: { vendorId: data.id, category, zipCodes, rushSupported: vendorRow.rush_supported },
  });
  await notifyPassage(data);
  await sendApplicantReceipt({ ...vendorRow, ...data }).catch(err => console.warn('vendor applicant receipt not sent:', err?.message || err));
  return res.status(200).json({ success: true, vendor: data });
}
