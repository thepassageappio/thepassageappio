import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    email,
    your_email,
    first_name,
    your_name,
    flow_type,
    deceased_name,
    relationship,
    mode,
  } = req.body;

  console.log('🕊️ New Passage Lead:', { email, your_email, flow_type, mode });

  try {
    const { error } = await supabase
      .from('leads')
      .insert([{
        email: email || your_email || null,
        first_name: first_name || your_name || null,
        flow_type,
        source: 'onboarding',
        notes: JSON.stringify({
          deceased_name,
          relationship,
          your_name,
          mode,
        }),
      }]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
