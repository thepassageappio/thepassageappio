import { createClient } from '@supabase/supabase-js';
import { cleanZipList, normalizeVendorCategory, vendorCategoryLabel } from '../../../lib/vendors';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function notifyPassage(vendor) {
  if (!process.env.RESEND_API_KEY) return;
  const from = process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>';
  const to = process.env.PASSAGE_LEADS_EMAIL || 'thepassageappio@gmail.com';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'New Passage vendor application',
      html: `<p><strong>${vendor.business_name}</strong> applied as ${vendorCategoryLabel(vendor.category)}.</p><p>Email: ${vendor.contact_email || 'n/a'}<br/>Phone: ${vendor.contact_phone || 'n/a'}<br/>ZIPs: ${(vendor.zip_codes_served || []).join(', ') || 'n/a'}</p><p>${vendor.short_description || ''}</p>`,
    }),
  }).catch(() => {});
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
    marketplace_fee_percent: 18,
    passage_rev_share_percent: 18,
    funeral_home_rev_share_percent: 0,
    estimated_value: null,
  };

  const { data, error } = await supabase.from('vendors').insert([vendorRow]).select('id,business_name,category,contact_email,zip_codes_served').single();
  if (error) return res.status(500).json({ error: error.message });
  await notifyPassage(data);
  return res.status(200).json({ success: true, vendor: data });
}
