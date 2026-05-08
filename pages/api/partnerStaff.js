import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value) {
  const role = String(value || 'staff').trim().toLowerCase();
  if (['owner', 'admin', 'director', 'location_manager', 'manager', 'staff'].includes(role)) return role;
  return 'staff';
}

async function getAdminMembership(user) {
  const email = normalizeEmail(user?.email);
  if (!email) return null;
  const { data } = await admin
    .from('organization_members')
    .select('organization_id,role,status')
    .ilike('email', email)
    .eq('status', 'active')
    .in('role', ['owner', 'admin', 'director', 'manager', 'location_manager'])
    .limit(1)
    .maybeSingle();
  return data || null;
}

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Session could not be verified.' });
  const membership = await getAdminMembership(userData.user);
  if (!membership?.organization_id) return res.status(403).json({ error: 'Funeral home director or admin access required.' });

  if (req.method === 'POST') {
    const email = normalizeEmail(req.body?.email);
    const role = normalizeRole(req.body?.role);
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Add a valid employee email.' });

    const row = {
      organization_id: membership.organization_id,
      email,
      role,
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await admin
      .from('organization_members')
      .upsert(row, { onConflict: 'organization_id,email' })
      .select('organization_id,email,role,status')
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ member: data || row, confirmation: 'Staff profile saved. They can be assigned work from case tasks.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
