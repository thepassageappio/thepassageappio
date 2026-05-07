import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = url && anon ? createClient(url, anon) : null;
const admin = url && service ? createClient(url, service) : null;

function mergeSection(summary, section, payload) {
  const current = summary && typeof summary === 'object' ? summary : {};
  return {
    ...current,
    estate_file: {
      ...(current.estate_file || {}),
      [section]: {
        ...(current.estate_file?.[section] || {}),
        ...payload,
        updated_at: new Date().toISOString(),
      },
    },
  };
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

  const workflowId = String(req.body?.workflowId || '').trim();
  const section = String(req.body?.section || '').trim();
  const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
  if (!workflowId) return res.status(400).json({ error: 'Missing estate file.' });
  if (!['wishes', 'obituary'].includes(section)) return res.status(400).json({ error: 'Unsupported estate file section.' });

  const { data: workflow, error: lookupError } = await admin
    .from('workflows')
    .select('id,user_id,orchestration_summary')
    .eq('id', workflowId)
    .maybeSingle();

  if (lookupError) return res.status(500).json({ error: lookupError.message || 'Could not load estate file.' });
  if (!workflow || workflow.user_id !== authData.user.id) {
    return res.status(404).json({ error: 'Estate file not found.' });
  }

  const nextSummary = mergeSection(workflow.orchestration_summary, section, payload);
  const { data, error } = await admin
    .from('workflows')
    .update({ orchestration_summary: nextSummary, updated_at: new Date().toISOString() })
    .eq('id', workflowId)
    .select('id,orchestration_summary')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message || 'Could not save estate file.' });

  return res.status(200).json({
    workflowId,
    section,
    estateFile: data?.orchestration_summary?.estate_file || nextSummary.estate_file || {},
  });
}
