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
  const workflowId = String(body.workflowId || '').trim();
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

  let estateFile = null;
  if (workflowId) {
    const { data: workflow, error: workflowError } = await admin
      .from('workflows')
      .select('id,user_id,orchestration_summary')
      .eq('id', workflowId)
      .maybeSingle();
    if (workflowError) {
      return res.status(500).json({ error: workflowError.message || 'Could not load estate file.' });
    }
    if (!workflow || workflow.user_id !== userId) {
      return res.status(404).json({ error: 'Estate file not found.' });
    }
    const summary = workflow.orchestration_summary && typeof workflow.orchestration_summary === 'object'
      ? workflow.orchestration_summary
      : {};
    const wishes = {
      disposition: body.disposition || '',
      service_type: body.service_type || '',
      religious_leader: body.religious_leader || '',
      music_preferences: body.music_preferences || '',
      special_requests: body.special_requests || '',
      organ_donation: !!body.organ_donation,
      updated_at: new Date().toISOString(),
    };
    const nextSummary = {
      ...summary,
      estate_file: {
        ...(summary.estate_file || {}),
        wishes,
      },
      planning_context: {
        ...(summary.planning_context || {}),
        disposition: nextProfile.disposition,
        service_type: nextProfile.service_type,
        clergy_or_officiant: body.religious_leader || summary.planning_context?.clergy_or_officiant || '',
        faith_notes: body.special_requests || summary.planning_context?.faith_notes || '',
      },
    };
    const { data: workflowUpdate, error: updateError } = await admin
      .from('workflows')
      .update({ orchestration_summary: nextSummary, updated_at: new Date().toISOString() })
      .eq('id', workflowId)
      .select('id,orchestration_summary')
      .maybeSingle();
    if (updateError) {
      return res.status(500).json({ error: updateError.message || 'Could not save wishes to estate file.' });
    }
    estateFile = workflowUpdate?.orchestration_summary?.estate_file || nextSummary.estate_file || null;
  }

  return res.status(200).json({ profile: data || nextProfile, estateFile });
}
