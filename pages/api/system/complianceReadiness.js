import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient = url && anon ? createClient(url, anon) : null;
const admin = url && service ? createClient(url, service) : null;

function present(value) {
  return Boolean(String(value || '').trim());
}

async function requireAdmin(req) {
  if (!authClient || !admin) return { ok: false, status: 500, error: 'Supabase admin clients are not configured.' };
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Please sign in first.' };
  const { data, error } = await authClient.auth.getUser(token);
  const email = String(data?.user?.email || '').toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: 'Session could not be verified.' };
  if (!isPassageAdmin(email)) return { ok: false, status: 403, error: 'System admin access required.' };
  return { ok: true, user: data.user };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAdmin(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const { data: snapshot, error } = await admin.rpc('passage_compliance_snapshot');
  if (error) return res.status(500).json({ error: error.message || 'Compliance snapshot could not be generated.' });

  const env = {
    supabaseUrl: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
    resend: present(process.env.RESEND_API_KEY),
    resendFrom: present(process.env.RESEND_FROM_EMAIL),
    stripeSecret: present(process.env.STRIPE_SECRET_KEY),
    stripeWebhook: present(process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET2),
    hubspot: present(process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_SERVICE_API_KEY || process.env.HUBSPOT_SERVICE_KEY || process.env.HUBSPOT_ACCESS_TOKEN),
    internalSecret: present(process.env.PASSAGE_INTERNAL_API_SECRET),
    qaNotificationMode: process.env.QA_NOTIFICATION_MODE === 'true' || process.env.QA_NOTIFICATION_MODE === '1' || process.env.PASSAGE_QA_MODE === 'true' || process.env.PASSAGE_QA_MODE === '1',
    qaNotificationOverride: present(process.env.QA_NOTIFICATION_OVERRIDE_EMAIL),
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@thepassageapp.io',
    twilioLiveReady: process.env.TWILIO_PRODUCTION_SMS_ENABLED === 'true' || process.env.TWILIO_A2P_APPROVED === 'true',
  };

  const blockers = [];
  if ((snapshot?.rls_disabled || []).length) blockers.push('One or more public tables do not have RLS enabled.');
  if ((snapshot?.sensitive_allow_all_policies || []).length) blockers.push('One or more sensitive tables has an allow-all policy.');
  if (!env.resend || !env.resendFrom) blockers.push('Resend production email is not fully configured.');
  if (!env.internalSecret) blockers.push('PASSAGE_INTERNAL_API_SECRET is missing, so server orchestration smoke tests cannot run as internal jobs.');
  if (!env.qaNotificationMode || !env.qaNotificationOverride) blockers.push('QA notification safety is not fully enabled for production testing.');

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    claims: {
      hipaa: 'Do not claim HIPAA compliance.',
      soc1: 'Do not claim SOC 1 compliance.',
      soc2: 'Do not claim SOC 2 compliance.',
      safePublicLanguage: 'Role-scoped, audit-oriented, review-before-share, preparing for formal compliance review.',
    },
    snapshot,
    env,
    blockers,
    status: blockers.length ? 'needs_work' : 'ready_for_readiness_review',
  });
}
