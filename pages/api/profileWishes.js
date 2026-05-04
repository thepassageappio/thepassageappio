import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = url && anon ? createClient(url, anon) : null;
const admin = url && service ? createClient(url, service) : null;

function normalizeDisposition(value) {
  return ({
    cremation: 'cremation',
    burial: 'burial',
    green_burial: 'green',
    donation: 'donation',
    undecided: 'unsure',
  })[value] || value || '';
}

function normalizeServiceType(value) {
  return ({
    religious: 'funeral',
    celebration_of_life: 'celebration',
    graveside: 'graveside',
    memorial: 'private',
    none: 'none',
  })[value] || value || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authClient || !admin) return res.status(500).json({ error: 'Server is not configured' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Please sign in again before saving.' });

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData?.user?.id) {
    return res.status(401).json({ error: 'Please sign in again before saving.' });
  }

  const body = req.body || {};
  const userId = authData.user.id;
  const nextProfile = {
    user_id: userId,
    disposition: normalizeDisposition(body.disposition),
    service_type: normalizeServiceType(body.service_type),
    healthcare_proxy_name: body.religious_leader || '',
    music_notes: body.music_preferences || '',
    special_requests: body.special_requests || '',
    organ_donor: !!body.organ_donation,
    wishes_complete: true,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await admin
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupError) {
    return res.status(500).json({ error: lookupError.message || 'Could not load profile.' });
  }

  const query = existing
    ? admin.from('profiles').update(nextProfile).eq('user_id', userId).select('*').maybeSingle()
    : admin.from('profiles').insert([nextProfile]).select('*').maybeSingle();

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message || 'Could not save wishes.' });
  }

  return res.status(200).json({ profile: data || nextProfile });
}
