import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function cleanText(value) {
  return String(value || '').trim();
}

function cleanHex(value) {
  const raw = cleanText(value);
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : null;
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Session could not be verified.' });
  const membership = await getAdminMembership(userData.user);
  if (!membership?.organization_id) return res.status(403).json({ error: 'Funeral home director or admin access required.' });

  const organizationName = cleanText(req.body?.organizationName);
  const familyPortalName = cleanText(req.body?.familyPortalName || organizationName);
  const supportEmail = normalizeEmail(req.body?.supportEmail);
  const supportPhone = cleanText(req.body?.supportPhone);
  const logoUrl = cleanText(req.body?.logoUrl);
  const primaryColor = cleanHex(req.body?.primaryColor) || '#6b8f71';
  const whiteLabelEnabled = req.body?.whiteLabelEnabled !== false;
  const now = new Date().toISOString();

  const base = { updated_at: now };
  if (organizationName) base.name = organizationName;

  const attempts = [
    {
      row: {
        ...base,
        from_name: familyPortalName || organizationName || null,
        family_portal_name: familyPortalName || organizationName || null,
        support_email: supportEmail || null,
        support_phone: supportPhone || null,
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        white_label_enabled: whiteLabelEnabled,
      },
      select: 'id,name,slug,type,from_name,family_portal_name,support_email,support_phone,logo_url,primary_color,white_label_enabled',
    },
    {
      row: {
        ...base,
        from_name: familyPortalName || organizationName || null,
        support_email: supportEmail || null,
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        white_label_enabled: whiteLabelEnabled,
      },
      select: 'id,name,slug,type,from_name,support_email,logo_url,primary_color,white_label_enabled',
    },
    {
      row: {
        ...base,
        support_email: supportEmail || null,
        logo_url: logoUrl || null,
        white_label_enabled: whiteLabelEnabled,
      },
      select: 'id,name,slug,type,support_email,logo_url,white_label_enabled',
    },
    { row: base, select: 'id,name,slug,type' },
  ];

  for (const attempt of attempts) {
    const { data, error } = await admin
      .from('organizations')
      .update(attempt.row)
      .eq('id', membership.organization_id)
      .select(attempt.select)
      .maybeSingle();
    if (!error) {
      return res.status(200).json({
        organization: data || { id: membership.organization_id, ...attempt.row },
        confirmation: 'Family-facing brand saved. This appears in the partner header, invite copy, packets, and family handoff language where available.',
      });
    }
    if (!schemaColumnError(error)) return res.status(500).json({ error: error.message });
  }
  return res.status(500).json({ error: 'Could not save brand settings.' });
}
