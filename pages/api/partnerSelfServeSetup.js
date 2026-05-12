import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

function cleanText(value, max = 240) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function slugify(value) {
  const base = cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base || `partner-${Date.now()}`;
}

function schemaColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('column') || message.includes('schema cache');
}

async function upsertOrganization({ name, slug, supportEmail, supportPhone }) {
  const now = new Date().toISOString();
  const attempts = [
    {
      row: {
        name,
        slug,
        type: 'funeral_home',
        status: 'active',
        from_name: name,
        support_email: supportEmail || null,
        support_phone: supportPhone || null,
        family_portal_name: name,
        white_label_enabled: true,
        marketplace_enabled: true,
        updated_at: now,
      },
      select: 'id,name,slug,type,status,from_name,support_email,support_phone,family_portal_name,white_label_enabled,marketplace_enabled',
    },
    {
      row: { name, slug, type: 'funeral_home', support_email: supportEmail || null, from_name: name, updated_at: now },
      select: 'id,name,slug,type,support_email,from_name',
    },
    { row: { name, slug, updated_at: now }, select: 'id,name,slug' },
  ];
  for (const attempt of attempts) {
    const { data, error } = await admin
      .from('organizations')
      .upsert(attempt.row, { onConflict: 'slug' })
      .select(attempt.select)
      .maybeSingle();
    if (!error) return data;
    if (!schemaColumnError(error)) throw error;
  }
  throw new Error('Could not create this partner workspace.');
}

async function upsertOwner({ organizationId, user, name }) {
  const now = new Date().toISOString();
  const email = normalizeEmail(user.email);
  const displayName = cleanText(name || user.user_metadata?.full_name || email);
  const attempts = [
    {
      row: { organization_id: organizationId, user_id: user.id, email, role: 'owner', status: 'active', display_name: displayName, title: 'Owner / director', location_scope: 'all', updated_at: now },
      select: 'organization_id,user_id,email,role,status,display_name,title,location_scope',
    },
    {
      row: { organization_id: organizationId, email, role: 'owner', status: 'active', display_name: displayName, location_scope: 'all', updated_at: now },
      select: 'organization_id,email,role,status,display_name,location_scope',
    },
    {
      row: { organization_id: organizationId, email, role: 'owner', status: 'active', updated_at: now },
      select: 'organization_id,email,role,status',
    },
  ];
  for (const attempt of attempts) {
    const { data, error } = await admin
      .from('organization_members')
      .upsert(attempt.row, { onConflict: 'organization_id,email' })
      .select(attempt.select)
      .maybeSingle();
    if (!error) return data;
    if (!schemaColumnError(error)) throw error;
  }
  throw new Error('Could not save the director as workspace owner.');
}

async function upsertLocation({ organizationId, name, address, city, state, zip, country, placeId }) {
  if (!name && !address) return null;
  const row = {
    organization_id: organizationId,
    name: cleanText(name || 'Main location', 160),
    address: cleanText(address, 500) || null,
    city: cleanText(city, 120) || null,
    state: cleanText(state, 60) || null,
    zip: cleanText(zip, 40) || null,
    country: cleanText(country, 80) || null,
    place_id: cleanText(placeId, 220) || null,
    status: 'active',
    updated_at: new Date().toISOString(),
  };
  const attempts = [
    { table: 'organization_locations', select: 'id,organization_id,name,address,city,state,zip,country,place_id,status' },
    { table: 'partner_locations', select: 'id,organization_id,name,address,city,state,zip,country,status' },
  ];
  for (const attempt of attempts) {
    const { data, error } = await admin.from(attempt.table).insert([row]).select(attempt.select).maybeSingle();
    if (!error) return data;
    if (error?.code !== '42P01' && !schemaColumnError(error)) throw error;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Sign in before creating a partner workspace.' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user?.email) return res.status(401).json({ error: 'Session could not be verified.' });

  const organizationName = cleanText(req.body?.organizationName, 180);
  if (!organizationName) return res.status(400).json({ error: 'Add the funeral home name.' });
  const directorName = cleanText(req.body?.directorName || user.user_metadata?.full_name || user.email, 160);
  const supportEmail = normalizeEmail(req.body?.supportEmail || user.email);
  const supportPhone = cleanText(req.body?.supportPhone, 80);
  const location = req.body?.location || {};

  try {
    const organization = await upsertOrganization({
      name: organizationName,
      slug: slugify(organizationName),
      supportEmail,
      supportPhone,
    });
    const member = await upsertOwner({ organizationId: organization.id, user, name: directorName });
    const savedLocation = await upsertLocation({
      organizationId: organization.id,
      name: location.name || 'Main location',
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip || location.postalCode,
      country: location.country,
      placeId: location.placeId || location.place_id,
    });

    await admin.from('leads').insert([{
      email: user.email,
      first_name: directorName,
      flow_type: 'funeral_home_self_serve_setup',
      source: 'funeral_home_setup',
      notes: JSON.stringify({
        organization_id: organization.id,
        organization_name: organization.name,
        support_email: supportEmail,
        support_phone: supportPhone,
        location: savedLocation || null,
        created_at: new Date().toISOString(),
      }),
    }]).then(() => {}, () => {});

    return res.status(200).json({ success: true, organization, member, location: savedLocation });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not create this workspace.' });
  }
}
