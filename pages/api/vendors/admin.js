import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../../lib/notificationSafety';
import { passageEmailShell, passageSubject } from '../../../lib/brandedEmail';

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

async function sendVendorApprovalEmail(admin, vendor) {
  const to = String(vendor?.contact_email || '').trim().toLowerCase();
  if (!to || !process.env.RESEND_API_KEY) return;
  const vendorName = vendor?.business_name || 'your business';
  const inviteUrl = `${SITE_URL}/vendors/accept?email=${encodeURIComponent(to)}`;
  const subject = passageSubject('Vendor approved', vendorName);
  const html = passageEmailShell({
    eyebrow: 'Vendor approval',
    title: `${vendorName} can now receive scoped requests.`,
    intro: `Sign in with ${to} to review quote requests, update availability, and save completion proof.`,
    preheader: 'Your Passage vendor workspace is ready.',
    sections: [
      {
        label: 'Access boundary',
        text: 'Vendors only see the request connected to their service. You do not browse family records.',
        tone: 'soft',
      },
      {
        label: 'Sign in with',
        text: to,
      },
    ],
    ctaLabel: 'Open vendor workspace',
    ctaUrl: inviteUrl,
  });
  const route = routeEmailRecipients([to]);
  if (!route.actual.length) {
    await insertNotificationLog(admin, {
      channel: 'email',
      recipient_email: to,
      recipient_name: vendorName,
      subject,
      provider: 'resend',
      provider_id: null,
      status: 'blocked',
      error_message: 'QA notification mode had no override email configured.',
      source: 'vendor_approval',
      ...qaAuditFields(route),
    });
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: route.actual,
      subject,
      html,
    }),
  }).catch(() => null);
  const json = response ? await response.json().catch(() => ({})) : {};
  await insertNotificationLog(admin, {
    channel: 'email',
    recipient_email: to,
    recipient_name: vendorName,
    subject,
    provider: 'resend',
    provider_id: response?.ok ? json.id || null : null,
    status: response?.ok ? 'sent' : 'failed',
    sent_at: response?.ok ? new Date().toISOString() : null,
    error_message: response?.ok ? null : (json?.message || json?.error || 'Vendor approval email failed'),
    source: 'vendor_approval',
    ...qaAuditFields(route),
  });
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
    const updates = { status, updated_at: new Date().toISOString() };
    if (req.body.stripeConnectAccountId !== undefined) {
      const accountId = String(req.body.stripeConnectAccountId || '').trim() || null;
      updates.stripe_account_id = accountId;
      updates.stripe_connect_account_id = accountId;
    }
    if (req.body.marketplaceFeePercent !== undefined) {
      const fee = Number(req.body.marketplaceFeePercent);
      if (!Number.isFinite(fee) || fee < 0 || fee > 40) return res.status(400).json({ error: 'Marketplace fee must be between 0 and 40 percent.' });
      updates.marketplace_fee_percent = fee;
      updates.passage_rev_share_percent = fee;
      updates.funeral_home_rev_share_percent = 0;
    }
    if (req.body.stripeChargesEnabled !== undefined) {
      updates.stripe_charges_enabled = Boolean(req.body.stripeChargesEnabled);
      updates.stripe_connect_status = updates.stripe_charges_enabled ? 'charges_enabled' : 'onboarding';
    }
    if (req.body.stripePayoutsEnabled !== undefined) {
      updates.stripe_payouts_enabled = Boolean(req.body.stripePayoutsEnabled);
      if (updates.stripe_payouts_enabled) updates.stripe_connect_status = 'payouts_enabled';
    }
    const { data, error } = await auth.admin
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    if (status === 'active') await sendVendorApprovalEmail(auth.admin, data);
    return res.status(200).json({ success: true, vendor: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
