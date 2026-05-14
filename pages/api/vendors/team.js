import { createClient } from '@supabase/supabase-js';
import { escapeHtml, passageEmailShell } from '../../../lib/brandedEmail';
import { insertNotificationLog, qaAuditFields, routeEmailRecipients } from '../../../lib/notificationSafety';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function clients() {
  if (!url || !anon || !service) return { error: 'Vendor team access is not configured.' };
  return {
    authClient: createClient(url, anon),
    admin: createClient(url, service),
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value) {
  const role = String(value || 'staff').trim().toLowerCase();
  if (['owner', 'manager', 'staff'].includes(role)) return role;
  return 'staff';
}

async function getVendorAccess(admin, email) {
  const { data: vendor, error: vendorError } = await admin
    .from('vendors')
    .select('*')
    .eq('status', 'active')
    .ilike('contact_email', email)
    .maybeSingle();
  if (vendorError) throw vendorError;
  if (vendor) return { vendor, member: { email, role: 'owner', status: 'active' } };

  const { data: member, error: memberError } = await admin
    .from('vendor_team_members')
    .select('id,email,display_name,role,status,vendor_id,vendors(*)')
    .ilike('email', email)
    .in('status', ['invited', 'active'])
    .limit(1)
    .maybeSingle();
  if (memberError && memberError.code !== '42P01') throw memberError;
  if (member?.vendors?.status === 'active') return { vendor: member.vendors, member };
  return { vendor: null, member: null };
}

async function sendInvite(admin, { vendor, member, senderEmail }) {
  const key = process.env.RESEND_API_KEY;
  const inviteUrl = `${SITE_URL}/vendors/accept?email=${encodeURIComponent(member.email)}`;
  const subject = `${vendor.business_name} invited you to Passage`;
  const html = passageEmailShell({
    eyebrow: 'Vendor team invite',
    title: `${vendor.business_name} invited you to Passage.`,
    intro: 'You have been added to a vendor workspace. Sign in with this email to respond to scoped family or funeral-home requests, share quotes, and save completion proof.',
    sections: [
      {
        label: 'Your workspace',
        html: `Role: <strong style="color:#1a1916;">${escapeHtml(member.role)}</strong><br/>Vendor: <strong style="color:#1a1916;">${escapeHtml(vendor.business_name)}</strong><br/>Invited by: ${escapeHtml(senderEmail || 'Passage')}`,
        tone: 'soft',
      },
      {
        label: 'Access boundary',
        text: 'Vendor employees see request details, timing, quote fields, and proof for their vendor work. They do not browse family records or unrelated case notes.',
      },
    ],
    ctaLabel: 'Open vendor workspace',
    ctaUrl: inviteUrl,
  });

  if (!key) {
    await admin.from('notification_log').insert([{
      channel: 'email',
      recipient_email: member.email,
      recipient_name: member.display_name || member.email,
      subject,
      provider: 'resend',
      status: 'skipped',
      error_message: 'RESEND_API_KEY is not configured.',
      sent_at: new Date().toISOString(),
    }]).then(() => {}, () => {});
    return { skipped: true, inviteUrl };
  }

  const route = routeEmailRecipients([member.email]);
  if (!route.actual.length) {
    await insertNotificationLog(admin, {
      channel: 'email',
      recipient_email: member.email,
      recipient_name: member.display_name || member.email,
      subject,
      provider: 'resend',
      provider_id: null,
      status: 'blocked',
      error_message: 'QA notification mode had no override email configured.',
      source: 'vendor_team_invite',
      ...qaAuditFields(route),
    });
    return { blocked: true, inviteUrl };
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: route.actual,
      subject,
      html,
    }),
  });
  const data = await response.json().catch(() => ({}));
  const ok = response.ok && data.id;
  await insertNotificationLog(admin, {
    channel: 'email',
    recipient_email: member.email,
    recipient_name: member.display_name || member.email,
    subject,
    provider: 'resend',
    provider_id: data.id || null,
    status: ok ? 'sent' : 'failed',
    error_message: ok ? null : (data.message || data.error || JSON.stringify(data)),
    sent_at: new Date().toISOString(),
    source: 'vendor_team_invite',
    ...qaAuditFields(route),
  });

  if (!ok) throw new Error(data.message || data.error || 'Email provider did not accept the vendor invite.');
  return { id: data.id, inviteUrl };
}

export default async function handler(req, res) {
  const configured = clients();
  if (configured.error) return res.status(500).json({ error: configured.error });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data: userData, error: userError } = await configured.authClient.auth.getUser(token);
  const email = normalizeEmail(userData?.user?.email);
  if (userError || !email) return res.status(401).json({ error: 'Session could not be verified.' });

  let access;
  try {
    access = await getVendorAccess(configured.admin, email);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!access.vendor) return res.status(403).json({ error: 'Approved vendor access required.' });
  if (!['owner', 'manager'].includes(access.member?.role || 'owner')) return res.status(403).json({ error: 'Vendor owner or manager access required.' });

  if (req.method === 'GET') {
    const { data: team, error } = await configured.admin
      .from('vendor_team_members')
      .select('id,email,display_name,role,status,invited_at,accepted_at')
      .eq('vendor_id', access.vendor.id)
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ team: team || [] });
  }

  if (req.method === 'POST') {
    const memberEmail = normalizeEmail(req.body?.email);
    const displayName = String(req.body?.displayName || req.body?.name || '').trim();
    const role = normalizeRole(req.body?.role);
    if (!memberEmail || !memberEmail.includes('@')) return res.status(400).json({ error: 'Add a valid employee email.' });

    const row = {
      vendor_id: access.vendor.id,
      email: memberEmail,
      display_name: displayName || null,
      role,
      status: 'invited',
      invited_by_user_id: userData.user.id,
      invited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: member, error } = await configured.admin
      .from('vendor_team_members')
      .upsert(row, { onConflict: 'vendor_id,email' })
      .select('id,email,display_name,role,status,invited_at,accepted_at')
      .single();
    if (error) return res.status(500).json({ error: error.message });

    try {
      const invite = await sendInvite(configured.admin, { vendor: access.vendor, member, senderEmail: userData.user.email });
      return res.status(200).json({ success: true, member, invite });
    } catch (error) {
      return res.status(500).json({ error: error.message, member });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
