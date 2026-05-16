import { createClient } from '@supabase/supabase-js';
import { escapeHtml, passageEmailShell, passageSubject } from '../../lib/brandedEmail';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
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
  const org = orgName || 'your organization';
  const name = memberName || memberEmail;
  const location = locationScope === 'all' ? 'All locations' : (locationScope || 'All locations');
  return passageEmailShell({
    eyebrow: 'Employee invite',
    title: `${org} invited you to Passage.`,
    intro: `Hi ${name}, you have been added as ${roleLabel(role)} with ${location} scope.`,
    preheader: 'Open Passage to see assigned case work, waiting points, family-safe updates, and proof.',
    sections: [
      {
        label: 'Your first screen',
        text: 'Open Passage to see assigned case work, waiting points, family-safe updates, and proof. You only see the work your role is allowed to handle.',
        tone: 'soft',
      },
      {
        label: 'Sign in with',
        html: `Email: <strong style="color:#1a1916;">${escapeHtml(memberEmail)}</strong><br/>Invited by: <strong style="color:#1a1916;">${escapeHtml(senderEmail || org)}</strong>`,
      },
    ],
    ctaLabel: 'Open Passage workspace',
    ctaUrl: inviteUrl,
  });
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
  const subject = passageSubject('Employee invite', org?.name || 'Your team');
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
