import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function clients() {
  if (!url || !anon || !service) {
    return {
      error: 'Vendor admin is not configured. Supabase URL, anon key, and service role key are required.',
    };
  }
  return {
    authClient: createClient(url, anon),
    admin: createClient(url, service),
  };
}

async function requireAdmin(req) {
  const configured = clients();
  if (configured.error) return { ok: false, status: 500, error: configured.error };
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Please sign in first.' };
  const { data, error } = await configured.authClient.auth.getUser(token);
  const email = data?.user?.email?.toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: 'Session could not be verified.' };
  if (!isPassageAdmin(email)) return { ok: false, status: 403, error: 'Admin access required.' };
  return { ok: true, user: data.user, admin: configured.admin };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendVendorApprovalEmail(admin, vendor) {
  const to = String(vendor?.contact_email || '').trim().toLowerCase();
  if (!to || !process.env.RESEND_API_KEY) return;
  const vendorName = vendor?.business_name || 'your business';
  const inviteUrl = `${SITE_URL}/vendors/accept?email=${encodeURIComponent(to)}`;
  const subject = `${vendorName} is approved for Passage vendor requests`;
  const html = `
  <div style="font-family:Georgia,serif;background:#f6f3ee;padding:28px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#fffdf9;border:1px solid #e4ddd4;border-radius:18px;padding:28px;color:#1a1916;">
      <div style="font-size:12px;color:#6b8f71;letter-spacing:.18em;text-transform:uppercase;font-weight:900;margin-bottom:18px;">Passage vendor approval</div>
      <h1 style="font-size:26px;line-height:1.2;margin:0 0 12px;font-weight:400;">${escapeHtml(vendorName)} can now receive scoped requests.</h1>
      <p style="font-size:15px;line-height:1.7;color:#6a6560;margin:0 0 16px;">Sign in with ${escapeHtml(to)} to review quote requests, update availability, and save completion proof. Vendors only see the request connected to their service.</p>
      <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#6b8f71;color:#fff;text-decoration:none;border-radius:13px;padding:13px 18px;font-size:15px;font-weight:900;">Open vendor workspace</a>
      <p style="font-size:12.5px;line-height:1.6;color:#a09890;margin:18px 0 0;">You can sign in with Google or request a secure email link using this same address.</p>
    </div>
  </div>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: [to],
      subject,
      html,
    }),
  }).catch(() => null);
  const json = response ? await response.json().catch(() => ({})) : {};
  await admin.from('notification_log').insert([{
    channel: 'email',
    recipient_email: to,
    recipient_name: vendorName,
    subject,
    provider: 'resend',
    provider_id: response?.ok ? json.id || null : null,
    status: response?.ok ? 'sent' : 'failed',
    sent_at: response?.ok ? new Date().toISOString() : null,
    error_message: response?.ok ? null : (json?.message || json?.error || 'Vendor approval email failed'),
  }]).then(() => {}, () => {});
}

export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const { data, error } = await auth.admin
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      const hint = error.message?.includes('does not exist')
        ? ' Apply the marketplace migration so public.vendors exists.'
        : '';
      return res.status(500).json({ error: error.message + hint });
    }
    return res.status(200).json({ vendors: data || [] });
  }

  if (req.method === 'POST') {
    const { vendorId, status } = req.body || {};
    if (!vendorId) return res.status(400).json({ error: 'Missing vendor.' });
    if (!['pending', 'active', 'inactive', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const { data, error } = await auth.admin
      .from('vendors')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', vendorId)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    if (status === 'active') await sendVendorApprovalEmail(auth.admin, data);
    return res.status(200).json({ success: true, vendor: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
