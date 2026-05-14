import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../lib/adminAccess';
import { normalizePartnerPlanId, partnerPlanFor } from '../../lib/partnerPlans';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = createClient(url, anon);
const admin = createClient(url, service);

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thepassageapp.io').replace(/\/$/, '');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function cleanText(value) {
  return String(value || '').trim();
}

function slugify(value) {
  const slug = cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || `partner-${Date.now()}`;
}

function schemaColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('column') || message.includes('schema cache');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function upsertOrganization({ name, slug, supportEmail, supportPhone, planId }) {
  const now = new Date().toISOString();
  const plan = partnerPlanFor(planId);
  const base = { name, slug, updated_at: now };
  const attempts = [
    {
      row: {
        ...base,
        type: 'funeral_home',
        status: 'active',
        from_name: name,
        support_email: supportEmail || null,
        support_phone: supportPhone || null,
        family_portal_name: name,
        white_label_enabled: true,
        partner_plan: plan.id,
        included_location_slots: plan.includedLocationSlots,
        additional_location_fee_cents: plan.additionalLocationFeeCents,
        active_case_limit: plan.activeCaseLimit,
      },
      select: 'id,name,slug,type,status,from_name,support_email,support_phone,family_portal_name,white_label_enabled,partner_plan,included_location_slots,additional_location_fee_cents,active_case_limit',
    },
    {
      row: { ...base, type: 'funeral_home', support_email: supportEmail || null, from_name: name, white_label_enabled: true, partner_plan: plan.id, included_location_slots: plan.includedLocationSlots },
      select: 'id,name,slug,type,support_email,from_name,white_label_enabled',
    },
    { row: base, select: 'id,name,slug' },
  ];

  for (const attempt of attempts) {
    const { data, error } = await admin
      .from('organizations')
      .upsert(attempt.row, { onConflict: 'slug' })
      .select(attempt.select)
      .maybeSingle();
    if (!error) return data || attempt.row;
    if (!schemaColumnError(error)) throw error;
  }
  throw new Error('Could not create partner organization.');
}

async function upsertPartnerPlan({ organization, directorEmail, supportEmail, supportPhone, planId }) {
  if (!organization?.id) return null;
  const plan = partnerPlanFor(planId);
  const now = new Date().toISOString();
  const base = {
    organization_id: organization.id,
    name: organization.name,
    brand_name: organization.name,
    email: directorEmail,
    contact_email: directorEmail,
    support_email: supportEmail || directorEmail,
    support_phone: supportPhone || null,
    plan: plan.id,
    monthly_fee_cents: plan.monthlyFeeCents,
    included_location_slots: plan.includedLocationSlots,
    additional_location_fee_cents: plan.additionalLocationFeeCents,
    active_case_limit: plan.activeCaseLimit,
    status: 'invited',
    updated_at: now,
  };
  const attempts = [
    { row: base, select: 'id,organization_id,plan,monthly_fee_cents,included_location_slots,additional_location_fee_cents,active_case_limit,status' },
    { row: { name: organization.name, email: directorEmail, plan: plan.id, monthly_fee_cents: plan.monthlyFeeCents, updated_at: now }, select: 'id,plan,monthly_fee_cents' },
  ];
  for (const attempt of attempts) {
    const { data: existing } = await admin
      .from('funeral_home_partners')
      .select('id')
      .eq('organization_id', organization.id)
      .maybeSingle();
    const query = existing?.id
      ? admin.from('funeral_home_partners').update(attempt.row).eq('id', existing.id)
      : admin.from('funeral_home_partners').insert([attempt.row]);
    const { data, error } = await query.select(attempt.select).maybeSingle();
    if (!error) return data;
    if (!schemaColumnError(error)) throw error;
  }
  return null;
}

async function upsertOwnerMember({ organizationId, directorEmail, directorName }) {
  const now = new Date().toISOString();
  const base = {
    organization_id: organizationId,
    email: directorEmail,
    role: 'owner',
    status: 'active',
    updated_at: now,
  };
  const attempts = [
    {
      row: { ...base, display_name: directorName || null, title: 'Owner / director', location_scope: 'all' },
      select: 'organization_id,email,role,status,display_name,title,location_scope',
    },
    {
      row: { ...base, display_name: directorName || null, location_scope: 'all' },
      select: 'organization_id,email,role,status,display_name,location_scope',
    },
    { row: base, select: 'organization_id,email,role,status' },
  ];

  for (const attempt of attempts) {
    const { data, error } = await admin
      .from('organization_members')
      .upsert(attempt.row, { onConflict: 'organization_id,email' })
      .select(attempt.select)
      .maybeSingle();
    if (!error) return data || attempt.row;
    if (!schemaColumnError(error)) throw error;
  }
  throw new Error('Could not create partner owner.');
}

function partnerInviteHtml({ organizationName, directorName, directorEmail, inviteUrl, senderEmail }) {
  const safeOrg = escapeHtml(organizationName);
  const safeName = escapeHtml(directorName || directorEmail);
  const safeUrl = escapeHtml(inviteUrl);
  return `
  <div style="font-family:Georgia,serif;background:#f6f3ee;padding:28px 16px;">
    <div style="max-width:580px;margin:0 auto;background:#fffdf9;border:1px solid #e4ddd4;border-radius:18px;padding:30px;color:#1a1916;">
      <div style="font-size:12px;color:#6b8f71;letter-spacing:.18em;text-transform:uppercase;font-weight:900;margin-bottom:18px;">Passage partner setup</div>
      <h1 style="font-size:27px;line-height:1.18;margin:0 0 12px;font-weight:400;">${safeOrg} has a Passage partner workspace.</h1>
      <p style="font-size:15px;line-height:1.7;color:#6a6560;margin:0 0 16px;">Hi ${safeName}, Passage is ready for your team to set up the workspace families and staff will use together.</p>
      <div style="background:#f0f5f1;border:1px solid #c8deca;border-radius:14px;padding:15px 16px;margin:18px 0;">
        <div style="font-size:12px;color:#6b8f71;letter-spacing:.14em;text-transform:uppercase;font-weight:900;margin-bottom:6px;">First setup steps</div>
        <p style="font-size:14px;line-height:1.65;color:#4f5b50;margin:0;">Confirm the co-branded family view, add locations, invite employees, create or import first cases, then assign one next task from the case spine.</p>
      </div>
      <a href="${safeUrl}" style="display:inline-block;background:#6b8f71;color:#fff;text-decoration:none;border-radius:13px;padding:13px 18px;font-size:15px;font-weight:900;">Open partner workspace</a>
      <p style="font-size:12.5px;line-height:1.6;color:#a09890;margin:18px 0 0;">Sign in with Google or the same email address: ${escapeHtml(directorEmail)}. Invited by ${escapeHtml(senderEmail || 'Passage')}.</p>
    </div>
  </div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Please sign in first.' });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  const adminEmail = normalizeEmail(userData?.user?.email);
  if (userError || !adminEmail) return res.status(401).json({ error: 'Session could not be verified.' });
  if (!isPassageAdmin(adminEmail)) return res.status(403).json({ error: 'Passage system admin access required.' });

  const organizationName = cleanText(req.body?.organizationName);
  const directorEmail = normalizeEmail(req.body?.directorEmail);
  const directorName = cleanText(req.body?.directorName);
  const supportEmail = normalizeEmail(req.body?.supportEmail || directorEmail);
  const supportPhone = cleanText(req.body?.supportPhone);
  const planId = normalizePartnerPlanId(req.body?.planId);
  if (!organizationName) return res.status(400).json({ error: 'Add the funeral home name.' });
  if (!directorEmail || !directorEmail.includes('@')) return res.status(400).json({ error: 'Add a valid director email.' });

  try {
    const organization = await upsertOrganization({
      name: organizationName,
      slug: slugify(organizationName),
      supportEmail,
      supportPhone,
      planId,
    });
    const partnerPlan = await upsertPartnerPlan({ organization, directorEmail, supportEmail, supportPhone, planId });
    const member = await upsertOwnerMember({
      organizationId: organization.id,
      directorEmail,
      directorName,
    });

    const inviteUrl = `${SITE_URL}/partner/accept?role=director&email=${encodeURIComponent(directorEmail)}`;
    const subject = `${organizationName}: set up your Passage partner workspace`;
    const html = partnerInviteHtml({ organizationName, directorName, directorEmail, inviteUrl, senderEmail: adminEmail });

    const key = process.env.RESEND_API_KEY;
    if (!key) {
      await admin.from('notification_log').insert([{
        channel: 'email',
        recipient_email: directorEmail,
        recipient_name: directorName || directorEmail,
        subject,
        provider: 'resend',
        status: 'skipped',
        error_message: 'RESEND_API_KEY is not configured.',
        sent_at: new Date().toISOString(),
      }]).then(() => {}, () => {});
      return res.status(200).json({ success: true, skipped: true, organization, member, inviteUrl, message: 'Partner workspace created. Invite prepared, but Resend is not configured.' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Passage <notifications@thepassageapp.io>',
        to: [directorEmail],
        subject,
        html,
      }),
    });
    const emailData = await response.json().catch(() => ({}));
    const ok = response.ok && emailData.id;
    await admin.from('notification_log').insert([{
      channel: 'email',
      recipient_email: directorEmail,
      recipient_name: directorName || directorEmail,
      subject,
      provider: 'resend',
      provider_id: emailData.id || null,
      status: ok ? 'sent' : 'failed',
      error_message: ok ? null : (emailData.message || emailData.error || JSON.stringify(emailData)),
      sent_at: new Date().toISOString(),
    }]).then(() => {}, () => {});

    if (!ok) return res.status(500).json({ error: emailData.message || emailData.error || 'Email provider did not accept the partner invite.', organization, inviteUrl });
    return res.status(200).json({ success: true, organization, member, partnerPlan, inviteUrl, id: emailData.id });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not create this partner invite.' });
  }
}
