import { createClient } from '@supabase/supabase-js';
import { locationUsageForPlan } from '../../lib/partnerPlans';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

function cleanText(value) {
  return String(value || '').trim();
}

function schemaError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || error?.code === '42P01' || message.includes('schema cache') || message.includes('column') || message.includes('relation');
}

async function getAdminMembership(user) {
  const email = cleanText(user?.email).toLowerCase();
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

async function getLocationSlotUsage(organizationId, nextName) {
  let partner = null;
  const { data: partnerRow } = await admin
    .from('funeral_home_partners')
    .select('plan,included_location_slots,additional_location_fee_cents')
    .eq('organization_id', organizationId)
    .maybeSingle();
  partner = partnerRow || null;
  if (!partner) {
    const { data: orgRow } = await admin
      .from('organizations')
      .select('partner_plan,included_location_slots,additional_location_fee_cents')
      .eq('id', organizationId)
      .maybeSingle();
    partner = {
      plan: orgRow?.partner_plan || 'partner_local',
      included_location_slots: orgRow?.included_location_slots,
      additional_location_fee_cents: orgRow?.additional_location_fee_cents,
    };
  }

  let existingLocations = [];
  for (const table of ['organization_locations', 'partner_locations']) {
    const { data, error } = await admin
      .from(table)
      .select('name,status')
      .eq('organization_id', organizationId)
      .neq('status', 'archived');
    if (!error) {
      existingLocations = data || [];
      break;
    }
    if (!schemaError(error)) break;
  }
  const normalizedNext = cleanText(nextName).toLowerCase();
  const alreadyExists = existingLocations.some(location => cleanText(location.name).toLowerCase() === normalizedNext);
  const usage = locationUsageForPlan(partner?.plan || 'partner_local', existingLocations.length, {
    includedLocationSlots: partner?.included_location_slots,
    additionalLocationFeeCents: partner?.additional_location_fee_cents,
  });
  return { ...usage, alreadyExists };
}

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Session could not be verified.' });
  const membership = await getAdminMembership(userData.user);
  if (!membership?.organization_id) return res.status(403).json({ error: 'Funeral home director or admin access required.' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const name = cleanText(req.body?.name);
  if (!name) return res.status(400).json({ error: 'Name the location before saving it.' });
  const slotUsage = await getLocationSlotUsage(membership.organization_id, name);
  if (slotUsage.needsUpgradeForNextLocation && !slotUsage.alreadyExists) {
    return res.status(402).json({
      error: `This ${slotUsage.planLabel} workspace includes ${slotUsage.includedLocationSlots} location slot${slotUsage.includedLocationSlots === 1 ? '' : 's'}. Upgrade to multi-location or add another location slot before saving this location.`,
      code: 'LOCATION_SLOT_UPGRADE_REQUIRED',
      locationSlots: slotUsage,
    });
  }

  const row = {
    organization_id: membership.organization_id,
    name,
    address: cleanText(req.body?.address),
    city: cleanText(req.body?.city),
    state: cleanText(req.body?.state),
    zip: cleanText(req.body?.zip),
    country: cleanText(req.body?.country),
    place_id: cleanText(req.body?.placeId || req.body?.place_id),
    status: 'active',
    updated_at: new Date().toISOString(),
  };

  const attempts = [
    { table: 'organization_locations', row, select: 'id,organization_id,name,address,city,state,zip,country,place_id,status,created_at,updated_at' },
    { table: 'organization_locations', row: { organization_id: row.organization_id, name: row.name, status: row.status, updated_at: row.updated_at }, select: 'id,organization_id,name,status' },
    { table: 'partner_locations', row, select: 'id,organization_id,name,address,city,state,zip,country,place_id,status,created_at,updated_at' },
    { table: 'partner_locations', row: { organization_id: row.organization_id, name: row.name, status: row.status, updated_at: row.updated_at }, select: 'id,organization_id,name,status' },
  ];

  for (const attempt of attempts) {
    const { data, error } = await admin
      .from(attempt.table)
      .upsert(attempt.row, { onConflict: 'organization_id,name' })
      .select(attempt.select)
      .maybeSingle();
    if (!error) {
      return res.status(200).json({
        location: { ...(data || attempt.row), source: 'partner setup' },
        confirmation: 'Location saved. It is now available in staff scope, case setup, reporting, and exports.',
        persisted: true,
        locationSlots: { ...slotUsage, usedLocationSlots: slotUsage.alreadyExists ? slotUsage.usedLocationSlots : slotUsage.usedLocationSlots + 1 },
      });
    }
    if (!schemaError(error)) return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    location: { ...row, source: 'prepared' },
    confirmation: 'Location prepared in this workspace. Add the partner location table to persist it across sessions.',
    persisted: false,
    locationSlots: slotUsage,
  });
}
