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
    // Red path fields
    email,
    your_email,
    first_name,
    your_name,
    deceased_name,
    relationship,
    // Green path fields
    executor_email,
    executor_name,
    person_name,
    disposition,
    service_type,
    // Shared
    flow_type,
    mode,
  } = req.body;

  console.log('🕊️ New Passage Lead:', { flow_type, mode });

  try {
    const { error } = await supabase
      .from('leads')
      .insert([{
        // Green path uses executor_email as the contact
        // Red path uses your_email
        email: executor_email || email || your_email || null,
        first_name: person_name || first_name || your_name || null,
        flow_type,
        source: 'onboarding',
        notes: JSON.stringify({
          // Red path
          deceased_name,
          relationship,
          your_name,
          // Green path
          executor_name,
          executor_email,
          person_name,
          disposition,
          service_type,
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
