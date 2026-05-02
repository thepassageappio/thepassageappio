import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

async function requireAdmin(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Please sign in first.' };
  const { data, error } = await authClient.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: 'Session could not be verified.' };
  if (!isPassageAdmin(email)) return { ok: false, status: 403, error: 'Admin access required.' };
  return { ok: true, user: data.user };
}

export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const { data, error } = await admin
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ vendors: data || [] });
  }

  if (req.method === 'POST') {
    const { vendorId, status } = req.body || {};
    if (!vendorId) return res.status(400).json({ error: 'Missing vendor.' });
    if (!['pending', 'active', 'inactive', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const { data, error } = await admin
      .from('vendors')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', vendorId)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, vendor: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
