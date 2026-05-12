import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function roleLabel(value) {
  const role = String(value || 'staff').replace(/_/g, ' ');
  return role.charAt(0).toUpperCase() + role.slice(1);
}

async function getAdminMembership(user) {
  const email = normalizeEmail(user?.email);
  if (!email) return null;
  const { data } = await admin
    .from('organization_members')
    .select('organization_id,role,status')
    .ilike('email', email)
    .eq('status', 'active')
    .in('role', ['owner', 'admin', 'director', 'manager', 'location_manager'])
    .limit(1)
    .maybeSingle();
  return data || null;
}

function staffInviteHtml({ orgName, memberName, memberEmail, role, locationScope, inviteUrl, senderEmail }) {
  const safeOrg = escapeHtml(orgName || 'your organization');
  const safeName = escapeHtml(memberName || memberEmail);
  const safeRole = escapeHtml(roleLabel(role));
  const safeLocation = escapeHtml(locationScope === 'all' ? 'All locations' : (locationScope || 'All locations'));
  const safeUrl = escapeHtml(inviteUrl);
  return `
  <div style="font-family:Georgia,serif;background:#f6f3ee;padding:28px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#fffdf9;border:1px solid #e4ddd4;border-radius:18px;padding:28px;color:#1a1916;">
      <div style="font-size:12px;color:#6b8f71;letter-spacing:.18em;text-transform:uppercase;font-weight:900;margin-bottom:18px;">Passage</div>
      <h1 style="font-size:25px;line-height:1.2;margin:0 0 12px;font-weight:400;">${safeOrg} invited you to Passage.</h1>
      <p style="font-size:15px;line-height:1.7;color:#6a6560;margin:0 0 16px;">Hi ${safeName}, you have been added as <strong style="color:#1a1916;">${safeRole}</strong> with <strong style="color:#1a1916;">${safeLocation}</strong> scope.</p>
      <div style="background:#f0f5f1;border:1px solid #c8deca;border-radius:14px;padding:14px 16px;margin:18px 0;">
        <div style="font-size:12px;color:#6b8f71;letter-spacing:.14em;text-transform:uppercase;font-weight:900;margin-bottom:6px;">Your first screen</div>
        <p style="font-size:14px;line-height:1.65;color:#4f5b50;margin:0;">Open Passage to see assigned case work, waiting points, family-safe updates, and proof. You only see the work your role is allowed to handle.</p>
      </div>
      <a href="${safeUrl}" style="display:inline-block;background:#6b8f71;color:#fff;text-decoration:none;border-radius:13px;padding:13px 18px;font-size:15px;font-weight:900;">Open Passage workspace</a>
      <p style="font-size:12.5px;line-height:1.6;color:#a09890;margin:18px 0 0;">You can sign in with Google or use the same email address: ${escapeHtml(memberEmail)}. Invited by ${escapeHtml(senderEmail || safeOrg)}.</p>
    </div>
  </div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) return res.status(401).json({ error: 'Session could not be verified.' });

  const membership = await getAdminMembership(userData.user);
  if (!membership?.organization_id) return res.status(403).json({ error: 'Director or admin access required.' });

  const email = normalizeEmail(req.body?.email);
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Add a valid employee email.' });

  const { data: member } = await admin
    .from('organization_members')
    .select('email,role,status,display_name,location_scope')
    .eq('organization_id', membership.organization_id)
    .ilike('email', email)
    .maybeSingle();
  if (!member) return res.status(404).json({ error: 'Save this employee before sending an invite.' });

  const { data: org } = await admin
    .from('organizations')
    .select('name')
    .eq('id', membership.organization_id)
    .maybeSingle();

  const inviteUrl = `${SITE_URL}/partner/accept?role=staff&email=${encodeURIComponent(email)}`;
  const subject = `${org?.name || 'Your team'} invited you to Passage`;
  const html = staffInviteHtml({
    orgName: org?.name,
    memberName: member.display_name,
    memberEmail: email,
    role: member.role,
    locationScope: member.location_scope,
    inviteUrl,
    senderEmail: userData.user.email,
  });

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await admin.from('notification_log').insert([{
      channel: 'email',
      recipient_email: email,
      recipient_name: member.display_name || email,
      subject,
      provider: 'resend',
      status: 'skipped',
      error_message: 'RESEND_API_KEY is not configured.',
      sent_at: new Date().toISOString(),
    }]).then(() => {}, () => {});
    return res.status(200).json({ success: true, skipped: true, message: 'Invite prepared, but Resend is not configured.' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
      to: [email],
      subject,
      html,
    }),
  });
  const data = await response.json().catch(() => ({}));
  const ok = response.ok && data.id;

  await admin.from('notification_log').insert([{
    channel: 'email',
    recipient_email: email,
    recipient_name: member.display_name || email,
    subject,
    provider: 'resend',
    provider_id: data.id || null,
    status: ok ? 'sent' : 'failed',
    error_message: ok ? null : (data.message || data.error || JSON.stringify(data)),
    sent_at: new Date().toISOString(),
  }]).then(() => {}, () => {});

  if (!ok) return res.status(500).json({ error: data.message || data.error || 'Email provider did not accept the invite.' });
  return res.status(200).json({ success: true, id: data.id, inviteUrl });
}
