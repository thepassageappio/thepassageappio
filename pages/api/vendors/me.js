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
  let activeVendor = vendor || null;
  let membership = null;

  if (!activeVendor) {
    const { data: teamMember, error: teamError } = await configured.admin
      .from('vendor_team_members')
      .select('id,email,display_name,role,status,vendor_id,vendors(*)')
      .ilike('email', email)
      .in('status', ['invited', 'active'])
      .limit(1)
      .maybeSingle();
    if (teamError && teamError.code !== '42P01') return res.status(500).json({ error: teamError.message });
    if (teamMember?.vendors?.status === 'active') {
      activeVendor = teamMember.vendors;
      membership = teamMember;
      if (teamMember.status === 'invited') {
        await configured.admin
          .from('vendor_team_members')
          .update({ status: 'active', accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', teamMember.id)
          .then(() => {}, () => {});
        membership = { ...teamMember, status: 'active' };
      }
    }
  }

  if (!activeVendor) {
    return res.status(200).json({
      vendor: null,
      requests: [],
      message: 'No approved vendor profile is connected to this email yet.',
    });
  }

  const { data: team } = await configured.admin
    .from('vendor_team_members')
    .select('id,email,display_name,role,status,invited_at,accepted_at')
    .eq('vendor_id', activeVendor.id)
    .order('created_at', { ascending: true })
    .then((result) => result, () => ({ data: [] }));

  const { data: requests, error: requestError } = await configured.admin
    .from('vendor_requests')
    .select('id,response_token,task_title,status,urgency,request_note,vendor_note,requested_at,viewed_at,responded_at,in_progress_at,completed_at,estimated_value,final_value,workflows(deceased_name,estate_name,name,organizations(name))')
    .eq('vendor_id', activeVendor.id)
    .order('requested_at', { ascending: false })
    .limit(50);

  if (requestError) return res.status(500).json({ error: requestError.message });
  return res.status(200).json({
    vendor: activeVendor,
    membership: membership || { email, role: 'owner', status: 'active' },
    team: team || [],
    requests: requests || [],
  });
}
