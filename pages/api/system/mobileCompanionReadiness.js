import { createClient } from '@supabase/supabase-js';
import { isPassageAdmin } from '../../../lib/adminAccess';
import { verifyDeliveryRequest } from '../../../lib/deliveryAuth';
import {
  buildMobileCompanionScore,
  mobileCompanionApiSurface,
  mobileCompanionPersonas,
  mobileCompanionSuccessCriteria,
} from '../../../lib/mobileCompanionContract';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
const authClient = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;
const admin = supabaseUrl && supabaseService ? createClient(supabaseUrl, supabaseService) : null;

async function requireSystemAccess(req) {
  const internal = await verifyDeliveryRequest(req);
  if (internal.ok && internal.source === 'internal') return { ok: true, source: 'internal' };

  if (!authClient) return { ok: false, status: 500, error: 'Supabase auth is not configured.' };
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, status: 401, error: 'Please sign in first.' };
  const { data, error } = await authClient.auth.getUser(token);
  const email = String(data?.user?.email || '').toLowerCase();
  if (error || !email) return { ok: false, status: 401, error: 'Session could not be verified.' };
  if (!isPassageAdmin(email)) return { ok: false, status: 403, error: 'System admin access required.' };
  return { ok: true, source: 'admin', user: data.user };
}

async function tableReadable(tableName, selection = 'id') {
  if (!admin) return { ok: false, error: 'Supabase service role is not configured.' };
  const { error } = await admin.from(tableName).select(selection).limit(1);
  return { ok: !error, error: error?.message || null };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireSystemAccess(req);
  if (!access.ok) return res.status(access.status || 401).json({ error: access.error });

  const [
    workflows,
    tasks,
    participants,
    notificationLog,
    vendors,
    vendorRequests,
    organizations,
    mobilePushTokens,
  ] = await Promise.all([
    tableReadable('workflows', 'id'),
    tableReadable('tasks', 'id,status'),
    tableReadable('estate_participants', 'id'),
    tableReadable('notification_log', 'id'),
    tableReadable('vendors', 'id'),
    tableReadable('vendor_requests', 'id,status'),
    tableReadable('organizations', 'id'),
    tableReadable('mobile_push_tokens', 'id'),
  ]);

  const schema = {
    workflows: workflows.ok,
    tasks: tasks.ok,
    estate_participants: participants.ok,
    notification_log: notificationLog.ok,
    vendors: vendors.ok,
    vendor_requests: vendorRequests.ok,
    organizations: organizations.ok,
    mobile_push_tokens: mobilePushTokens.ok,
  };
  const routes = Object.fromEntries(mobileCompanionApiSurface.map(item => [item.id, true]));
  const score = buildMobileCompanionScore({
    env: { resend: Boolean(process.env.RESEND_API_KEY) },
    schema,
    routes,
  });

  const blockers = [];
  const warnings = [];
  if (!schema.workflows || !schema.tasks) blockers.push('Core workflow/task tables are not readable.');
  if (!schema.estate_participants) blockers.push('Participant scope table is not readable.');
  if (!schema.notification_log) blockers.push('Notification log table is not readable.');
  if (!schema.vendors || !schema.vendor_requests) blockers.push('Vendor request tables are not readable.');
  if (!schema.mobile_push_tokens) warnings.push('Native push-token table is not present yet. Email remains the notification path until the Expo app build starts.');

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    accessedBy: access.source,
    status: blockers.length ? 'needs_work' : 'scoped',
    personas: mobileCompanionPersonas,
    apiSurface: mobileCompanionApiSurface,
    successCriteria: mobileCompanionSuccessCriteria,
    schema,
    checks: score.checks,
    blockers,
    warnings,
  });
}
