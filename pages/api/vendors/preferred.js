import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

async function getMembership(user) {
  const email = user?.email?.toLowerCase();
  if (!email) return null;
  const { data } = await admin
    .from('organization_members')
    .select('organization_id,role,status')
    .ilike('email', email)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])
    .limit(1)
    .maybeSingle();
  return data || null;
}

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Session could not be verified.' });
  const membership = await getMembership(userData.user);
  if (!membership?.organization_id) return res.status(403).json({ error: 'Funeral home admin access required.' });

  if (req.method === 'GET') {
    const [{ data: vendors }, { data: preferred }] = await Promise.all([
      admin.from('vendors').select('id,business_name,category,short_description,status').eq('status', 'active').order('business_name'),
      admin.from('funeral_home_preferred_vendors').select('vendor_id,category,active').eq('organization_id', membership.organization_id),
    ]);
    return res.status(200).json({ vendors: vendors || [], preferred: preferred || [] });
  }

  if (req.method === 'POST') {
    const { vendorId, category, active } = req.body || {};
    if (!vendorId || !category) return res.status(400).json({ error: 'Missing vendor preference.' });
    const { data: vendor } = await admin.from('vendors').select('id,category,status').eq('id', vendorId).eq('status', 'active').maybeSingle();
    if (!vendor) return res.status(404).json({ error: 'Vendor not available.' });
    const { error } = await admin.from('funeral_home_preferred_vendors').upsert({
      organization_id: membership.organization_id,
      vendor_id: vendorId,
      category: category || vendor.category,
      active: active !== false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,vendor_id,category' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
