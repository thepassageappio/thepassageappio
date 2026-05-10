import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = url && anon ? createClient(url, anon) : null;
const admin = url && service ? createClient(url, service) : null;

const COMPLETION_STAGES = new Set([
  'planning_estate_created',
  'urgent_estate_created',
  'partner_case_created',
  'checkout_completed',
]);

const STAGE_FIELDS = {
  planning_estate_created: { planning_complete: true },
  urgent_estate_created: { urgent_complete: true },
  partner_case_created: { partner_onboarding_complete: true },
  people_complete: { people_complete: true },
  documents_complete: { documents_complete: true },
  vault_complete: { vault_complete: true },
  wishes_complete: { wishes_complete: true },
  checkout_started: { checkout_started: true },
  checkout_completed: { checkout_completed: true },
};

function schemaColumnName(error) {
  const message = String(error?.message || error || '');
  if (!/schema cache|column .* does not exist|Could not find the .* column/i.test(message)) return '';
  const quoted = message.match(/'([^']+)' column/i)?.[1] || message.match(/column "([^"]+)"/i)?.[1];
  return quoted || '';
}

function computeCompleted(profile) {
  if (!profile) return false;
  if (profile.onboarding_completed) return true;
  if (profile.planning_complete || profile.urgent_complete || profile.partner_onboarding_complete || profile.checkout_completed) return true;
  return Boolean(profile.people_complete && (profile.documents_complete || profile.vault_complete || profile.wishes_complete));
}

async function upsertProfile(row, userId) {
  let next = { ...row };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await admin
      .from('profiles')
      .upsert([next], { onConflict: 'user_id' })
      .select('*')
      .maybeSingle();
    if (!error) return { data, removed: Object.keys(row).filter(key => !(key in next)) };
    const missingColumn = schemaColumnName(error);
    if (missingColumn && missingColumn in next) {
      delete next[missingColumn];
      continue;
    }
    throw error;
  }
  throw new Error('Could not record onboarding progress.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authClient || !admin) return res.status(500).json({ error: 'Server is not configured.' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'Please sign in again before saving progress.' });

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData?.user?.id) {
    return res.status(401).json({ error: 'Please sign in again before saving progress.' });
  }

  const stage = String(req.body?.stage || '').trim();
  if (!stage || !STAGE_FIELDS[stage]) {
    return res.status(400).json({ error: 'Unknown onboarding stage.' });
  }

  const userId = authData.user.id;
  const now = new Date().toISOString();
  const { data: existing } = await admin.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  const row = {
    user_id: userId,
    ...STAGE_FIELDS[stage],
    onboarding_started: true,
    onboarding_completed: COMPLETION_STAGES.has(stage),
    onboarding_last_stage: stage,
    updated_at: now,
  };
  const merged = { ...(existing || {}), ...row };
  row.onboarding_completed = computeCompleted(merged);

  try {
    const { data, removed } = await upsertProfile(row, userId);
    return res.status(200).json({
      ok: true,
      stage,
      onboardingCompleted: computeCompleted(data || merged),
      removedColumns: removed,
    });
  } catch (error) {
    console.error('onboardingProgress:', error);
    return res.status(500).json({ error: error.message || 'Could not save onboarding progress.' });
  }
}
