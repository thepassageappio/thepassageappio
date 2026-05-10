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

function cleanText(value) {
  return String(value || '').trim();
}

function schemaColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('column') || message.includes('schema cache');
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
    const displayName = cleanText(req.body?.name || req.body?.displayName);
    const locationScope = cleanText(req.body?.locationScope || req.body?.location_scope) || 'all';
    const title = cleanText(req.body?.title);
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Add a valid employee email.' });

    const baseRow = {
      organization_id: membership.organization_id,
      email,
      role,
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    const extendedRow = {
      ...baseRow,
      display_name: displayName || null,
      title: title || null,
      location_scope: locationScope,
    };
    const attempts = [
      { row: extendedRow, select: 'organization_id,email,role,status,display_name,title,location_scope' },
      { row: baseRow, select: 'organization_id,email,role,status' },
    ];
    for (const attempt of attempts) {
      const { data, error } = await admin
        .from('organization_members')
        .upsert(attempt.row, { onConflict: 'organization_id,email' })
        .select(attempt.select)
        .maybeSingle();
      if (!error) {
        return res.status(200).json({
          member: { ...(data || attempt.row), display_name: data?.display_name || displayName || undefined, location_scope: data?.location_scope || locationScope },
          confirmation: 'Employee saved. Copy the invite message when you are ready; Passage did not send email or SMS.',
          persistedProfileFields: Boolean(data?.display_name || data?.location_scope),
        });
      }
      if (!schemaColumnError(error)) return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Could not save this employee.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
