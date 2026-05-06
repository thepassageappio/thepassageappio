import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

function clients() {
  if (!url || !anon || !service) {
    return {
      error: 'Vendor portal is not configured. Supabase URL, anon key, and service role key are required.',
    };
  }
  return {
    authClient: createClient(url, anon),
    admin: createClient(url, service),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const configured = clients();
  if (configured.error) return res.status(500).json({ error: configured.error });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });

  const { data: userData, error: userError } = await configured.authClient.auth.getUser(token);
  const email = userData?.user?.email?.trim().toLowerCase();
  if (userError || !email) return res.status(401).json({ error: 'Session could not be verified.' });

  const { data: vendor, error: vendorError } = await configured.admin
    .from('vendors')
    .select('*')
    .eq('status', 'active')
    .ilike('contact_email', email)
    .maybeSingle();

  if (vendorError) return res.status(500).json({ error: vendorError.message });
  if (!vendor) {
    return res.status(200).json({
      vendor: null,
      requests: [],
      message: 'No approved vendor profile is connected to this email yet.',
    });
  }

  const { data: requests, error: requestError } = await configured.admin
    .from('vendor_requests')
    .select('id,response_token,task_title,status,urgency,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,workflows(deceased_name,estate_name,name,organizations(name))')
    .eq('vendor_id', vendor.id)
    .order('requested_at', { ascending: false })
    .limit(50);

  if (requestError) return res.status(500).json({ error: requestError.message });
  return res.status(200).json({ vendor, requests: requests || [] });
}
