import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role for server-side writes
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const {
      email,
      your_email,
      name,
      your_name,
      first_name,
      flow_type,
      mode,
      deceased_name,
      relationship,
      executor_name,
      executor_email,
      disposition,
      service_type,
      timestamp,
    } = body;

    // Resolve email and name from either field name
    const resolvedEmail = email || your_email || executor_email || null;
    const resolvedName = name || your_name || first_name || executor_name || null;

    console.log('🕊️ Passage lead:', { resolvedEmail, resolvedName, flow_type, mode });

    // Write to Supabase leads table
    const { error } = await supabase.from('leads').insert([{
      email: resolvedEmail,
      first_name: resolvedName,
      flow_type: flow_type || 'unknown',
      source: 'web',
      notes: JSON.stringify({
        mode,
        deceased_name,
        relationship,
        executor_name,
        executor_email,
        disposition,
        service_type,
        timestamp: timestamp || new Date().toISOString(),
      }),
    }]);

    if (error) {
      console.error('Lead save error:', error);
      // Don't fail the request — lead capture is non-critical
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('saveLead handler error:', err);
    return res.status(200).json({ success: true }); // still 200 — never block the flow
  }
}
